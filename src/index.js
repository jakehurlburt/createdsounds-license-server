require ('dotenv').config();

const express = require ('express');
const licenseRoutes = require ('./routes/licenses');
const shopifyRoutes = require ('./routes/shopify');

const app = express();
const port = Number (process.env.PORT || 3000);

// Shopify needs the raw body to verify signatures.
app.use (express.json ({
    verify: (req, res, buf) =>
    {
        req.rawBody = buf.toString ('utf8');
    },
}));

app.get ('/health', (req, res) =>
{
    res.json ({ ok: true, service: 'createdsounds-license-server' });
});

app.use ('/licenses', licenseRoutes);
app.use ('/shopify', shopifyRoutes);

app.listen (port, () =>
{
    console.log (`License server listening on port ${port}`);
});
