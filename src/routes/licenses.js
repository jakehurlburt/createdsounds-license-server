const express = require ('express');
const { query } = require ('../db');

const router = express.Router();

function normaliseKey (key)
{
    return String (key || '').trim().toUpperCase();
}

function normaliseMachineId (machineId)
{
    return String (machineId || '').trim();
}

async function handleLicenseCheck ({ licenseKey, machineId, countAsActivation })
{
    const key = normaliseKey (licenseKey);
    const machine = normaliseMachineId (machineId);

    if (! key || ! machine)
        return { success: false, message: 'License key and machine ID are required.' };

    const licenseResult = await query (
        `SELECT license_key, max_activations, status
         FROM licenses
         WHERE license_key = $1`,
        [key]
    );

    if (licenseResult.rowCount === 0)
        return { success: false, message: 'That license key is not valid. Check your email and try again.' };

    const license = licenseResult.rows[0];

    if (license.status !== 'active')
        return { success: false, message: 'This license is no longer active. Contact support@createdsounds.com' };

    const activationResult = await query (
        `SELECT machine_id
         FROM activations
         WHERE license_key = $1`,
        [key]
    );

    const knownMachines = activationResult.rows.map (row => row.machine_id);
    const alreadyActivated = knownMachines.includes (machine);

    if (alreadyActivated)
        return { success: true, message: 'Bloom is activated. Thank you for your purchase!' };

    if (! countAsActivation)
        return { success: false, message: 'This license is not activated on this computer.' };

    if (knownMachines.length >= license.max_activations)
        return { success: false, message: 'This key has already been used on too many computers.' };

    await query (
        `INSERT INTO activations (license_key, machine_id)
         VALUES ($1, $2)`,
        [key, machine]
    );

    return { success: true, message: 'Bloom is activated. Thank you for your purchase!' };
}

router.post ('/activate', async (req, res) =>
{
    try
    {
        const result = await handleLicenseCheck ({
            licenseKey: req.body.license_key,
            machineId: req.body.machine_id,
            countAsActivation: true,
        });

        res.json (result);
    }
    catch (err)
    {
        console.error ('activate error:', err);
        res.status (500).json ({ success: false, message: 'Server error. Try again in a moment.' });
    }
});

router.post ('/validate', async (req, res) =>
{
    try
    {
        const result = await handleLicenseCheck ({
            licenseKey: req.body.license_key,
            machineId: req.body.machine_id,
            countAsActivation: false,
        });

        res.json (result);
    }
    catch (err)
    {
        console.error ('validate error:', err);
        res.status (500).json ({ success: false, message: 'Server error. Try again in a moment.' });
    }
});

module.exports = router;
