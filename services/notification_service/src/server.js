require("dotenv").config();

const {
    connectRabbitMQ,
    closeRabbitMQ,
} = require("./config/rabbitmq");

const {
    startNotificationConsumer,
} = require("./consumers/notificationConsumer");

async function startServer() {
    try {
        console.log("Step 1: Connecting to RabbitMQ...");

        await connectRabbitMQ();

        console.log("Step 2: Starting notification consumer...");

        await startNotificationConsumer();

        console.log("Notification Service started successfully");
    } catch (error) {
        console.error("Failed to start Notification Service");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Full error:", error.stack);

        process.exitCode = 1;
    }
}

async function shutdown() {
    console.log("Shutting down Notification Service...");

    try {
        await closeRabbitMQ();
    } catch (error) {
        console.error(error.message);
    }

    process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

startServer();