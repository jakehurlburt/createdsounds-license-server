require ('dotenv').config();

const express = require ('express');
const licenseRoutes = require ('./routes/licenses');
const shopifyRoutes = require ('./routes/shopify');

const app = express();
const port = Number (process.env.PORT || 3000);

app.get ('/health', (req, res) =>
{
    res.json ({ ok: true, service: 'createdsounds-license-server' });
});

app.get ('/health/db', async (req, res) =>
{
    const { query } = require ('./db');

    try
    {
        if (! process.env.DATABASE_URL)
        {
            res.status (500).json ({
                ok: false,
                error: 'DATABASE_URL is not set on this server.',
            });
            return;
        }

        await query ('SELECT 1 AS ok');

        const tableCheck = await query (
            `SELECT to_regclass ('public.licenses') AS licenses_table`
        );

        const hasLicensesTable = tableCheck.rows[0].licenses_table !== null;

        res.json ({
            ok: true,
            database: 'connected',
            licenses_table: hasLicensesTable,
        });
    }
    catch (err)
    {
        console.error ('health/db error:', err);
        res.status (500).json ({
            ok: false,
            error: err.message,
        });
    }
});

// Licenses use normal JSON. Shopify MUST use the raw body for HMAC verification.
app.use ('/licenses', express.json(), licenseRoutes);

app.use ('/shopify', express.raw ({
    type: 'application/json',
    verify: (req, res, buf) =>
    {
        req.rawBody = buf;
    },
}), (req, res, next) =>
{
    if (Buffer.isBuffer (req.body) && req.body.length > 0)
    {
        try
        {
            req.body = JSON.parse (req.body.toString ('utf8'));
        }
        catch (err)
        {
            res.status (400).send ('Invalid JSON');
            return;
        }
    }

    next();
}, shopifyRoutes);

app.listen (port, () =>
{
    console.log (`License server listening on port ${port}`);
});
