require ('dotenv').config ();

const shop = (process.env.SHOPIFY_SHOP || '').trim().replace (/^https?:\/\//, '').replace (/\/$/, '');
const legacyToken = (process.env.SHOPIFY_ADMIN_TOKEN || '').trim ();
const clientId = (process.env.SHOPIFY_CLIENT_ID || '').trim ();
const clientSecret = (process.env.SHOPIFY_CLIENT_SECRET || '').trim ();
const argUrl = process.argv[2];
const baseUrl = (process.env.WEBHOOK_URL || argUrl || '').trim ().replace (/\/$/, '');

function usage()
{
    console.error ('');
    console.error ('  Register Shopify "order paid" webhook for your app');
    console.error ('  --------------------------------------------------');
    console.error ('');
    console.error ('  Add to your .env file:');
    console.error ('    SHOPIFY_SHOP=your-store.myshopify.com');
    console.error ('');
    console.error ('  Dev Dashboard apps (2026+) — use Client ID + Client secret:');
    console.error ('    SHOPIFY_CLIENT_ID=from Dev Dashboard → Settings');
    console.error ('    SHOPIFY_CLIENT_SECRET=from Dev Dashboard → Settings');
    console.error ('');
    console.error ('  Legacy store custom apps (pre-2026) — OR use Admin API token:');
    console.error ('    SHOPIFY_ADMIN_TOKEN=shpat_...');
    console.error ('');
    console.error ('  Then run:');
    console.error ('    npm run register-shopify-webhook -- https://YOUR-RAILWAY-URL.up.railway.app');
    console.error ('');
}

function normaliseWebhookUrl (url)
{
    if (url.endsWith ('/shopify/order-paid'))
        return url;

    return url + '/shopify/order-paid';
}

async function getAccessToken()
{
    if (legacyToken)
        return legacyToken;

    if (! clientId || ! clientSecret)
        return null;

    const response = await fetch (`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify ({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
        }),
    });

    const payload = await response.json();

    if (! response.ok || ! payload.access_token)
    {
        console.error ('Could not get access token from Dev Dashboard credentials:');
        console.error (JSON.stringify (payload, null, 2));
        console.error ('');
        console.error ('Common fixes:');
        console.error ('  - Install the app on your store first (Dev Dashboard → Overview → Install app)');
        console.error ('  - App and store must be in the same Shopify organization');
        console.error ('  - Check SHOPIFY_SHOP matches your .myshopify.com domain');
        process.exit (1);
    }

    return payload.access_token;
}

async function main()
{
    if (! shop || ! baseUrl)
    {
        usage();
        process.exit (1);
    }

    const accessToken = await getAccessToken();

    if (! accessToken)
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
            'X-Shopify-Access-Token': accessToken,
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

        const topicError = result.userErrors.some (e =>
            e.message?.includes ('cannot create a webhook subscription with the specified topic')
            || e.message?.includes ('protected customer data'));

        if (topicError)
        {
            console.error ('');
            console.error ('  >>> MISSING read_orders PERMISSION (most common)');
            console.error ('');
            console.error ('  1. dev.shopify.com → Bloom License Server → Versions');
            console.error ('  2. Click New version (or edit active version)');
            console.error ('  3. Find Access scopes / API scopes → enable read_orders');
            console.error ('  4. Release the version');
            console.error ('  5. Overview → Install app again on your store');
            console.error ('  6. Run this script again');
            console.error ('');
            console.error ('  If still failing on a LIVE store:');
            console.error ('  partners.shopify.com → Apps → Bloom License Server');
            console.error ('  → API access requests → Protected customer data access → Request');
            console.error ('');
            console.error ('  OR use Notifications webhook instead (see SETUP.md Method A).');
        }
        else
        {
            console.error ('  - Delete duplicate webhook in Settings → Notifications → Webhooks');
            console.error ('  - Install app on store (Dev Dashboard → Install app)');
            console.error ('  - App needs read_orders scope — edit version in Dev Dashboard');
        }

        process.exit (1);
    }

    console.log ('');
    console.log ('  Webhook registered!');
    console.log ('  -------------------');
    console.log ('  Topic: ' + result.webhookSubscription.topic);
    console.log ('  URL:   ' + result.webhookSubscription.uri);
    console.log ('');
    console.log ('  Put the same app Client secret in Railway → SHOPIFY_WEBHOOK_SECRET');
    console.log ('  Delete any duplicate webhook in Settings → Notifications → Webhooks');
    console.log ('  Place a new test order, then check Railway logs for "created license".');
    console.log ('');
}

main().catch (err =>
{
    console.error (err);
    process.exit (1);
});
