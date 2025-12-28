const BASE_URL = 'http://localhost:4000';

async function verifyProfile() {
    console.log('--- Starting Profile Verification ---');

    const uniqueEmail = `profile_${Date.now()}@example.com`;
    const password = 'Password123!';

    try {
        // 1. Register
        console.log(`1. Registering user...`);
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password, firstName: 'OldName' })
        });
        if (!regRes.ok) throw new Error(await regRes.text());

        // 2. Login
        console.log(`2. Logging in...`);
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password })
        });
        const { accessToken } = await loginRes.json();

        // 3. Get Profile
        console.log(`3. Fetching Profile...`);
        const profileRes = await fetch(`${BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const profile = await profileRes.json();
        console.log(`   Fetched Name: ${profile.firstName}`);
        if (profile.firstName !== 'OldName') throw new Error('First name mismatch');

        // 4. Update Profile
        console.log(`4. Updating Profile...`);
        const updateRes = await fetch(`${BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({ firstName: 'NewName', lastName: 'Updated' })
        });
        const updatedProfile = await updateRes.json();
        console.log(`   Updated Name: ${updatedProfile.firstName} ${updatedProfile.lastName}`);

        if (updatedProfile.firstName !== 'NewName') throw new Error('Update failed');

        console.log('--- Profile Verification PASSED ---');

    } catch (error) {
        console.error('--- Profile Verification FAILED ---');
        console.error(error);
    }
}

verifyProfile();
