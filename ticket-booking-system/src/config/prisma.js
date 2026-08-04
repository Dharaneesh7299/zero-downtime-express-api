const {prismaClient} = require("../genearted/prisma")

const prisma = new prismaClient();

module.exports = prisma;