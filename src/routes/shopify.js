const express = require ('express');
const crypto = require ('crypto');
const { query } = require ('../db');
const { generateLicenseKey } = require ('../keys');
const { sendLicenseEmail } = require ('../email');

const router = express.Router();

function verifyShopifyWebhook (req)
{
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET?.trim();

    if (! secret)
    {
        console.error ('SHOPIFY_WEBHOOK_SECRET is not set');
        return false;
    }

    const hmacHeader = req.get ('X-Shopify-Hmac-Sha256')?.trim();

    if (! hmacHeader)
    {
        console.warn ('Shopify webhook missing X-Shopify-Hmac-Sha256 header');
        return false;
    }

    const rawBody = req.rawBody;

    if (! rawBody || ! Buffer.isBuffer (rawBody) || rawBody.length === 0)
    {
        console.warn ('Shopify webhook missing raw body for HMAC verification');
        return false;
    }

    const digest = crypto
        .createHmac ('sha256', secret)
        .update (rawBody)
        .digest ('base64');

    // String compare first (Shopify sends matching base64 strings)
    if (digest === hmacHeader)
        return true;

    try
    {
        const valid = crypto.timingSafeEqual (
            Buffer.from (digest, 'base64'),
            Buffer.from (hmacHeader, 'base64')
        );

        if (! valid)
        {
            console.warn ('Shopify HMAC mismatch.');
            console.warn ('  Secret starts with:', secret.slice (0, 6) + '...');
            console.warn ('  Body bytes:', rawBody.length);
            console.warn ('  Fix: webhook + secret must be from same Dev Dashboard app.');
            console.warn ('  Delete Notifications webhook; use register script OR add read_orders in Versions.');
        }

        return valid;
    }
    catch (err)
    {
        console.warn ('Shopify HMAC compare failed:', err.message);
        return false;
    }
}

function orderContainsBloom (order)
{
    const match = (process.env.BLOOM_PRODUCT_MATCH || 'Bloom').trim().toLowerCase();

    if (! match)
        return true;

    const lineItems = order.line_items || [];

    return lineItems.some (item =>
    {
        const title = String (item.title || '').toLowerCase();
        const sku = String (item.sku || '').toLowerCase();
        return title.includes (match) || sku.includes (match);
    });
}

router.post ('/order-paid', async (req, res) =>
{
    if (! verifyShopifyWebhook (req))
    {
        console.warn ('Shopify webhook rejected — bad signature');
        return res.status (401).send ('Invalid signature');
    }

    try
    {
        const order = req.body;

        if (! orderContainsBloom (order))
        {
            console.log (`Order ${order.id}: no Bloom product — skipping`);
            return res.status (200).send ('No Bloom product in order');
        }

        const email = order.email || order.contact_email;

        if (! email)
        {
            console.error (`Order ${order.id}: no customer email`);
            return res.status (200).send ('No email on order');
        }

        const orderId = String (order.id);

        const existing = await query (
            `SELECT license_key FROM licenses WHERE shopify_order_id = $1`,
            [orderId]
        );

        if (existing.rowCount > 0)
        {
            console.log (`Order ${orderId}: license already exists`);
            return res.status (200).send ('Already processed');
        }

        const licenseKey = generateLicenseKey();

        await query (
            `INSERT INTO licenses (license_key, email, shopify_order_id, product_name)
             VALUES ($1, $2, $3, $4)`,
            [licenseKey, email, orderId, 'Bloom']
        );

        await sendLicenseEmail ({
            to: email,
            licenseKey,
            productName: 'Bloom',
        });

        console.log (`Order ${orderId}: created license ${licenseKey} for ${email}`);
        res.status (200).send ('OK');
    }
    catch (err)
    {
        console.error ('shopify webhook error:', err);
        res.status (500).send ('Server error');
    }
});

module.exports = router;
