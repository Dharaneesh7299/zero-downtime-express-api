const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash("dharan@2007", 10);

    const admin = await prisma.user.upsert({
        where: {
            email: "admin@gmail.com"
        },
        update: {},
        create: {
            username: "admin",
            email: "admin@gmail.com",
            password,
            role: "ADMIN"
        }
    });

    console.log("Admin created:", admin.email);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });