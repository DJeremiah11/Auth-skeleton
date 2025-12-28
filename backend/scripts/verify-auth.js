const BASE_URL = 'http://localhost:4000';

async function verifyAuth() {
    console.log('--- Starting Auth Verification ---');

    const uniqueEmail = `test_${Date.now()}@example.com`;
    const password = 'Password123!';
    const userPayload = {
        email: uniqueEmail,
        password: password,
        firstName: 'Test',
        lastName: 'User'
    };

    try {
        // 1. Register
        console.log(`1. Registering user: ${uniqueEmail}`);
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload)
        });

        if (!regRes.ok) {
            const err = await regRes.text();
            throw new Error(`Registration failed: ${regRes.status} ${err}`);
        }

        const regData = await regRes.json();
        console.log('   Registration Success:', regData.id ? 'OK' : 'No ID returned');

        // 2. Login
        console.log(`2. Logging in user: ${uniqueEmail}`);
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password: password })
        });

        if (!loginRes.ok) {
            const err = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} ${err}`);
        }

        const loginData = await loginRes.json();
        console.log('   Login Success:', loginData.accessToken ? 'Token Received' : 'No Token');

        if (loginData.user.email !== uniqueEmail) {
            throw new Error('Logged in user email does not match');
        }

        console.log('--- Verification PASSED ---');

    } catch (error) {
        console.error('--- Verification FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

verifyAuth();
