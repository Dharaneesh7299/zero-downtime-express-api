require("dotenv").config();

const prisma = require("./config/prisma");

async function main() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;

  console.log("Order Service connected to PostgreSQL!");
}

main()
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });