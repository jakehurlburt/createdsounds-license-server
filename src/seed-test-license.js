require ('dotenv').config();

const { query, pool } = require ('./db');

const TEST_KEY = 'BLOOM-TEST-1111-AAAA';
const TEST_EMAIL = process.env.SEED_TEST_EMAIL || 'test@createdsounds.com';

async function main()
{
    if (! process.env.DATABASE_URL)
    {
        console.error ('DATABASE_URL is missing. Set it in your .env file first.');
        process.exit (1);
    }

    await query (
        `INSERT INTO licenses (license_key, email, shopify_order_id, product_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (license_key) DO NOTHING`,
        [TEST_KEY, TEST_EMAIL, 'test-order-1', 'Bloom']
    );

    console.log ('');
    console.log ('  Test license ready!');
    console.log ('  -------------------');
    console.log ('  Key:   ' + TEST_KEY);
    console.log ('  Email: ' + TEST_EMAIL);
    console.log ('');
    console.log ('  Use this key in Step 4.3 when you test activate.');
    console.log ('');

    await pool.end();
}

main().catch (err =>
{
    console.error (err);
    process.exit (1);
});
