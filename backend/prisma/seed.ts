import { prisma } from '../src/utils/prisma';

async function main() {
    const roles = ['USER', 'ADMIN', 'MODERATOR'];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role },
            update: {},
            create: { name: role, description: `Default ${role} role` },
        });
    }

    console.log('Roles seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
