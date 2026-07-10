require ('dotenv').config();

const { pool } = require ('./db');

const schema = `
CREATE TABLE IF NOT EXISTS licenses (
    license_key TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    shopify_order_id TEXT,
    product_name TEXT NOT NULL DEFAULT 'Bloom',
    max_activations INTEGER NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activations (
    id SERIAL PRIMARY KEY,
    license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
    machine_id TEXT NOT NULL,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (license_key, machine_id)
);

CREATE INDEX IF NOT EXISTS idx_activations_license_key ON activations(license_key);
`;

async function main()
{
    if (! process.env.DATABASE_URL)
    {
        console.error ('DATABASE_URL is missing. Copy .env.example to .env first.');
        process.exit (1);
    }

    await pool.query (schema);
    console.log ('Database tables created (or already exist).');
    await pool.end();
}

main().catch (err =>
{
    console.error (err);
    process.exit (1);
});
