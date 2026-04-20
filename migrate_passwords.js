const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { password: { not: null } }
    });

    for (const user of users) {
        const existingAccount = await prisma.account.findFirst({
            where: { userId: user.id, providerId: 'credential' }
        });

        if (!existingAccount) {
            await prisma.account.create({
                data: {
                    userId: user.id,
                    accountId: user.email,
                    providerId: 'credential',
                    password: user.password,
                }
            });
            console.log(`Migrated account for ${user.email}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
