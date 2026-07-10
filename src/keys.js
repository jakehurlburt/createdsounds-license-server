const crypto = require ('crypto');

function generateLicenseKey()
{
    const part = () => crypto.randomBytes (2).toString ('hex').toUpperCase();
    return `BLOOM-${part()}-${part()}-${part()}`;
}

module.exports = { generateLicenseKey };
