import mysql from "mysql2/promise";
// Stashed on globalThis so Next.js dev-mode hot reloads reuse the same pool
// instead of leaking a fresh one (and its connections) on every file change.
const globalForPool = globalThis;
export function getPool() {
    if (globalForPool.mysqlPool)
        return globalForPool.mysqlPool;
    const host = process.env.MYSQL_HOST;
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;
    const database = process.env.MYSQL_DATABASE;
    if (!host || !user || !database) {
        throw new Error("Missing MySQL credentials. Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE in .env.local.");
    }
    globalForPool.mysqlPool = mysql.createPool({
        host,
        port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
    });
    return globalForPool.mysqlPool;
}
