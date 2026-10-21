
const amqp = require("amqplib");

const EXCHANGE = "ticket.events";
const QUEUE = "notification.events";

const RETRY_EXCHANGE = "notification.retry.exchange";
const RETRY_QUEUE = "notification.retry";
const DLX_EXCHANGE = "notification.dlx";
const DLQ = "notification.dlq";

let connection;
let channel;
let publisherChannel;

async function connectRabbitMQ() {
    connection = await amqp.connect(process.env.RABBITMQ_URL);

    channel = await connection.createChannel();
    publisherChannel = await connection.createConfirmChannel();

    await channel.assertExchange(EXCHANGE, "direct", {
        durable: true,
    });

    await channel.assertQueue(QUEUE, {
        durable: true,
    });

    await channel.bindQueue(QUEUE, EXCHANGE, "reservation.confirmed");
    await channel.bindQueue(QUEUE, EXCHANGE, "reservation.expired");

    await channel.assertExchange(RETRY_EXCHANGE, "direct", {
        durable: true,
    });

    await channel.assertQueue(RETRY_QUEUE, {
        durable: true,
        arguments: {
            "x-message-ttl": 10000,
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": QUEUE,
        },
    });

    await channel.bindQueue(RETRY_QUEUE, RETRY_EXCHANGE, "retry");

    await channel.assertExchange(DLX_EXCHANGE, "direct", {
        durable: true,
    });

    await channel.assertQueue(DLQ, {
        durable: true,
    });

    await channel.bindQueue(DLQ, DLX_EXCHANGE, "failed");

    console.log("Connected to RabbitMQ");
    console.log(`Main queue: ${QUEUE}`);
    console.log(`Retry queue: ${RETRY_QUEUE}`);
    console.log(`Dead-letter queue: ${DLQ}`);

    return channel;
}

function getChannel() {
    if (!channel) {
        throw new Error("RabbitMQ channel is not initialized");
    }

    return channel;
}

function getPublisherChannel() {
    if (!publisherChannel) {
        throw new Error("RabbitMQ publisher channel is not initialized");
    }

    return publisherChannel;
}

async function closeRabbitMQ() {
    if (publisherChannel) await publisherChannel.close();
    if (channel) await channel.close();
    if (connection) await connection.close();
}

module.exports = {
    connectRabbitMQ,
    getChannel,
    getPublisherChannel,
    closeRabbitMQ,
    QUEUE,
    RETRY_EXCHANGE,
    DLX_EXCHANGE,
};
