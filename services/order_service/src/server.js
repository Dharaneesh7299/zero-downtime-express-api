
require("dotenv").config();

const app = require("./app");
const prisma = require("./config/prisma");
const { connectRabbitMQ } = require("./config/rabbitmq");
const {
  startReservationConsumer,
} = require("./consumers/reservationConsumer");

const PORT = Number(process.env.PORT || 4002);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL");

    await connectRabbitMQ();
    await startReservationConsumer();

    app.listen(PORT, () => {
      console.log(`Order Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Order Service:", error.message);
    process.exit(1);
  }
}

startServer();
