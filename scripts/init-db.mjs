import { ensureSchema } from "../lib/db.ts";

await ensureSchema();
console.log("Database schema is ready.");
