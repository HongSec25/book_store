import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
// Cloud Functions/Cloud Run set K_SERVICE (and friends) on the runtime
// automatically — that's how we tell "running inside GCP" apart from local
// dev without a dedicated env var of our own.
const RUNNING_ON_GCP = Boolean(process.env.K_SERVICE || process.env.FUNCTION_TARGET);
function getAdminApp() {
    if (getApps().length)
        return getApps()[0];
    // Deployed to Cloud Functions in the same project: the function's own
    // default service account already has Firestore access — no key needed,
    // and shipping a service-account private key into a function's env vars
    // would be a needless secret to leak/rotate anyway.
    if (RUNNING_ON_GCP) {
        return initializeApp({ credential: applicationDefault() });
    }
    // Preferred on hosts like Render: single-line env vars mangle the
    // private key's embedded newlines, so the whole service-account JSON
    // is base64-encoded into one opaque string instead.
    const credentialsBase64 = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64;
    if (credentialsBase64) {
        const serviceAccount = JSON.parse(Buffer.from(credentialsBase64, "base64").toString("utf8"));
        return initializeApp({ credential: cert(serviceAccount) });
    }
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Missing Firebase admin credentials. Set FIREBASE_ADMIN_CREDENTIALS_BASE64, or FIREBASE_ADMIN_PROJECT_ID/FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_ADMIN_PRIVATE_KEY in .env.");
    }
    return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });
}
export const adminAuth = getAuth(getAdminApp());
export const adminDb = getFirestore(getAdminApp());
