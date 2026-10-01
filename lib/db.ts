import { neon } from "@neondatabase/serverless";

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  return neon(databaseUrl);
}

export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS orders (
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
  )`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payable_kop integer`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_kop integer NOT NULL DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz`,
  `CREATE INDEX IF NOT EXISTS orders_pending_payment_idx ON orders (payable_kop) WHERE payment_status = 'pending'`,
  `CREATE TABLE IF NOT EXISTS jar_payments (
    id text PRIMARY KEY,
    account text NOT NULL,
    amount_kop integer NOT NULL,
    description text,
    comment text,
    paid_at timestamptz NOT NULL,
    order_id text REFERENCES orders(id),
    raw jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS job_runs (
    name text PRIMARY KEY,
    ran_at timestamptz NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS artisan_stock (
    product_id text PRIMARY KEY,
    source_url text NOT NULL,
    in_stock boolean NOT NULL,
    variants jsonb NOT NULL,
    jpy_to_uah numeric(10, 5) NOT NULL,
    synced_at timestamptz NOT NULL,
    checked_at timestamptz NOT NULL,
    last_error text
  )`
];

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  schemaReady ??= (async () => {
    const sql = getSql();
    for (const statement of schemaStatements) await sql.query(statement);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}
