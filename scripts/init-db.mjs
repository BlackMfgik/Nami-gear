import { ensureSchema } from "../lib/db.ts";

await ensureSchema();
console.log("Database is ready: orders, jar_payments and artisan_stock tables exist.");
