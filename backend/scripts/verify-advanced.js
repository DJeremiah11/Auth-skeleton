const BASE_URL = 'http://localhost:4000';

async function verifyAdvancedAuth() {
    console.log('--- Starting Advanced Auth Verification ---');

    const uniqueEmail = `advanced_${Date.now()}@example.com`;
    const password = 'Password123!';
    let userId = '';
    let accessToken = '';
    let otpSecret = '';

    try {
        // 1. Register & Login
        console.log(`1. Registering user...`);
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password })
        });
        if (!regRes.ok) throw new Error(await regRes.text());
        const regData = await regRes.json();
        userId = regData.id;

        console.log(`2. Logging in...`);
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password })
        });
        const loginData = await loginRes.json();
        accessToken = loginData.accessToken;
        console.log('   Login OK. Access Token Received.');

        // 3. Generate 2FA
        console.log(`3. Generating 2FA Secret...`);
        const gen2faRes = await fetch(`${BASE_URL}/auth/2fa/generate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const gen2faData = await gen2faRes.json();
        otpSecret = gen2faData.secret;
        console.log(`   Secret: ${otpSecret}`);

        // 4. Verify 2FA (Enable it)
        console.log(`4. Verifying 2FA (Enabling)...`);
        const speakeasy = require('speakeasy');
        let token = speakeasy.totp({ secret: otpSecret, encoding: 'base32' });

        // Attempt verification
        const verify2faRes = await fetch(`${BASE_URL}/auth/2fa/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({ token })
        });
        if (!verify2faRes.ok) throw new Error(await verify2faRes.text());
        console.log('   2FA Enabled.');

        // 5. Login with 2FA
        console.log(`5. Testing Login with 2FA...`);
        const login2Res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password })
        });
        const login2Data = await login2Res.json();

        if (login2Data.requires2FA) {
            console.log('   Login returned requires2FA: true (Expected)');

            // Finalize Login
            token = speakeasy.totp({ secret: otpSecret, encoding: 'base32' });
            const finalLoginRes = await fetch(`${BASE_URL}/auth/2fa/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: login2Data.userId, token })
            });
            const finalData = await finalLoginRes.json();
            if (finalData.accessToken) {
                console.log('   Final 2FA Login Success.');
            } else {
                throw new Error('Final login failed');
            }
        } else {
            throw new Error('Login should have required 2FA');
        }

        // 6. Magic Link
        console.log(`6. Testing Magic Link Sending...`);
        const magicRes = await fetch(`${BASE_URL}/auth/magic-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail })
        });
        if (magicRes.ok) console.log('   Magic Link Sent (Mock).');
        else throw new Error('Magic link send failed');

        // NOTE: Cannot easily verify Magic Link click without parsing logs/mock email, skipping verification of the GET leg for now in this script.

        console.log('--- Advanced Auth Verification PASSED ---');

    } catch (error) {
        console.error('--- Advanced Auth Verification FAILED ---');
        console.error(error);
    }
}

verifyAdvancedAuth();
