const { Resend } = require ('resend');

let resend = null;

function getResend()
{
    if (! process.env.RESEND_API_KEY)
        return null;

    if (! resend)
        resend = new Resend (process.env.RESEND_API_KEY);

    return resend;
}

async function sendLicenseEmail ({ to, licenseKey, productName })
{
    const client = getResend();

    if (! client)
    {
        console.log ('[email] RESEND_API_KEY not set — skipping email. Key:', licenseKey);
        return { skipped: true };
    }

    const from = process.env.EMAIL_FROM || 'CreatedSounds <onboarding@resend.dev>';

    const { error } = await client.emails.send ({
        from,
        to: [to],
        subject: `Your ${productName} license key`,
        text: [
            `Thanks for purchasing ${productName}!`,
            '',
            `Your license key:`,
            licenseKey,
            '',
            `1. Install ${productName}`,
            '2. Open the plugin in your DAW',
            '3. Paste this key when prompted',
            '',
            'You can activate on up to 2 computers.',
            '',
            'Questions? Reply to this email or visit createdsounds.com',
        ].join ('\n'),
    });

    if (error)
        throw new Error (`Email failed: ${error.message}`);

    return { sent: true };
}

module.exports = { sendLicenseEmail };
