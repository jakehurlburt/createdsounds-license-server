require ('dotenv').config ();

const shop = (process.env.SHOPIFY_SHOP || '').trim().replace (/^https?:\/\//, '').replace (/\/$/, '');
const token = (process.env.SHOPIFY_ADMIN_TOKEN || '').trim ();
const argUrl = process.argv[2];
const baseUrl = (process.env.WEBHOOK_URL || argUrl || '').trim ().replace (/\/$/, '');

function usage()
{
    console.error ('');
    console.error ('  Register Shopify "order paid" webhook for your custom app');
    console.error ('  --------------------------------------------------------');
    console.error ('');
    console.error ('  Add to your .env file:');
    console.error ('    SHOPIFY_SHOP=your-store.myshopify.com');
    console.error ('    SHOPIFY_ADMIN_TOKEN=shpat_...  (Admin API access token)');
    console.error ('');
    console.error ('  Then run ONE of:');
    console.error ('    npm run register-shopify-webhook -- https://YOUR-RAILWAY-URL.up.railway.app');
    console.error ('    WEBHOOK_URL=https://YOUR-RAILWAY-URL.up.railway.app npm run register-shopify-webhook');
    console.error ('');
    console.error ('  The script appends /shopify/order-paid automatically if needed.');
    console.error ('');
}

function normaliseWebhookUrl (url)
{
    if (url.endsWith ('/shopify/order-paid'))
        return url;

    return url + '/shopify/order-paid';
}

async function main()
{
    if (! shop || ! token || ! baseUrl)
    {
        usage();
        process.exit (1);
    }

    const callbackUrl = normaliseWebhookUrl (baseUrl);

    const mutation = `
        mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
            webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
                webhookSubscription {
                    id
                    topic
                    uri
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const variables = {
        topic: 'ORDERS_PAID',
        webhookSubscription: {
            callbackUrl,
            format: 'JSON',
        },
    };

    const response = await fetch (`https://${shop}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify ({ query: mutation, variables }),
    });

    const payload = await response.json();

    if (! response.ok)
    {
        console.error ('HTTP error:', response.status);
        console.error (JSON.stringify (payload, null, 2));
        process.exit (1);
    }

    const result = payload.data?.webhookSubscriptionCreate;

    if (! result)
    {
        console.error ('Unexpected response:');
        console.error (JSON.stringify (payload, null, 2));
        process.exit (1);
    }

    if (result.userErrors?.length)
    {
        console.error ('Shopify returned errors:');
        for (const err of result.userErrors)
            console.error (`  - ${err.field}: ${err.message}`);

        console.error ('');
        console.error ('Common fixes:');
        console.error ('  - Add scopes read_orders + write_webhooks on your custom app, reinstall, get a new token');
        console.error ('  - Check SHOPIFY_SHOP is your-store.myshopify.com (not createdsounds.com)');
        process.exit (1);
    }

    console.log ('');
    console.log ('  Webhook registered!');
    console.log ('  -------------------');
    console.log ('  Topic: ' + result.webhookSubscription.topic);
    console.log ('  URL:   ' + result.webhookSubscription.uri);
    console.log ('');
    console.log ('  This webhook uses the same custom app as your shpss_ API secret key.');
    console.log ('  Place a new test order, then check Railway logs for "created license".');
    console.log ('');
}

main().catch (err =>
{
    console.error (err);
    process.exit (1);
});
