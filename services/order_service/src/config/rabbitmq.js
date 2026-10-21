
const amqp = require("amqplib");

let connection;
let channel;

async function connectRabbitMQ() {
  if (channel) return channel;

  const url =
    process.env.RABBITMQ_URL ||
    "amqp://guest:guest@localhost:5672";

  connection = await amqp.connect(url);
  channel = await connection.createChannel();

  connection.on("close", () => {
    connection = null;
    channel = null;
  });

  console.log("Order Service connected to RabbitMQ");

  return channel;
}

async function getChannel() {
  if (!channel) {
    return connectRabbitMQ();
  }

  return channel;
}

module.exports = { connectRabbitMQ, getChannel };
