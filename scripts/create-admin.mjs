import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const env = fs.readFileSync(path.join(root, "server", ".env"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}

const { cert, initializeApp } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
const { getFirestore } = await import("firebase-admin/firestore");

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const auth = getAuth(app);
const db = getFirestore(app);

let user;
try {
  user = await auth.getUserByEmail(email);
  console.log(`User already exists: ${user.uid}`);
} catch {
  user = await auth.createUser({ email, password });
  console.log(`Created auth user: ${user.uid}`);
}

const createdAt = new Date();

if (process.env.DB_PROVIDER === "mysql") {
  const mysql = (await import("mysql2/promise")).default;
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  await pool.query(
    `INSERT INTO users (uid, email, role, disabled, createdAt) VALUES (?, ?, 'admin', FALSE, ?)
     ON DUPLICATE KEY UPDATE email = VALUES(email), role = 'admin', disabled = FALSE`,
    [user.uid, email, createdAt]
  );
  await pool.end();
} else {
  await db.collection("users").doc(user.uid).set(
    {
      email,
      role: "admin",
      disabled: false,
      createdAt: createdAt.toISOString(),
    },
    { merge: true }
  );
}

console.log(`Admin user ready: ${email}`);
process.exit(0);
