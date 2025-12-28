const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:4000';

async function verifyRBAC() {
    console.log('--- Starting RBAC Verification ---');

    const uniqueEmail = `rbac_${Date.now()}@example.com`;
    const password = 'Password123!';

    try {
        // 1. Register (Should be USER)
        console.log(`1. Registering user: ${uniqueEmail}`);
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password, firstName: 'Rbac', lastName: 'Test' })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(JSON.stringify(regData));

        // 2. Login
        console.log(`2. Logging in...`);
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password })
        });
        const { accessToken } = await loginRes.json();
        console.log('   Token received.');

        // 3. Try Admin Route (Should Fail)
        console.log(`3. Accessing /users/admin (Expected: 403)`);
        const adminFailReq = await fetch(`${BASE_URL}/users/admin`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (adminFailReq.status === 403) {
            console.log('   [PASS] Access denied as expected.');
        } else {
            throw new Error(`Expected 403, got ${adminFailReq.status}`);
        }

        // 4. Upgrade to ADMIN
        console.log(`4. Upgrading user to ADMIN directly in DB...`);
        const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
        await prisma.userRole.create({
            data: { userId: regData.id, roleId: adminRole.id }
        });

        // 5. Try Admin Route Again (Should Pass)
        console.log(`5. Accessing /users/admin (Expected: 200)`);
        const adminSuccessReq = await fetch(`${BASE_URL}/users/admin`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (adminSuccessReq.status === 200) {
            console.log('   [PASS] Access granted.');
        } else {
            const txt = await adminSuccessReq.text();
            throw new Error(`Expected 200, got ${adminSuccessReq.status} - ${txt}`);
        }

        console.log('--- RBAC Verification PASSED ---');

    } catch (error) {
        console.error('--- RBAC Verification FAILED ---');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyRBAC();
