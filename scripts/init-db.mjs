import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS orders (
    id text PRIMARY KEY,
    order_number text UNIQUE NOT NULL,
    status text NOT NULL DEFAULT 'new',
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text NOT NULL,
    email text,
    city text NOT NULL,
    city_ref text NOT NULL,
    warehouse text NOT NULL,
    warehouse_ref text NOT NULL,
    comment text,
    payment_method text NOT NULL,
    items jsonb NOT NULL,
    subtotal_uah integer NOT NULL,
    shipping_uah integer NOT NULL,
    total_uah integer NOT NULL,
    weight_kg numeric(8, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

console.log("Database is ready: orders table exists.");
