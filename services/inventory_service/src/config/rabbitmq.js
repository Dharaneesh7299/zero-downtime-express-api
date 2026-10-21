
const amqp = require("amqplib");

let connection;
let channel;

async function connectRabbitMQ() {
  if (channel) {
    return channel;
  }

  const url =
    process.env.RABBITMQ_URL ||
    "amqp://guest:guest@localhost:5672";

  connection = await amqp.connect(url);
  channel = await connection.createConfirmChannel();

  console.log("Connected to RabbitMQ");

  connection.on("error", (error) => {
    console.error("RabbitMQ connection error:", error.message);
  });

  connection.on("close", () => {
    console.log("RabbitMQ connection closed");
    connection = null;
    channel = null;
  });

  return channel;
}

async function getChannel() {
  if (!channel) {
    return connectRabbitMQ();
  }

  return channel;
}

async function setupReservationMessaging() {
  const channel = await getChannel();

  await channel.assertExchange(
    "ticket.events",
    "direct",
    { durable: true }
  );

  await channel.assertQueue(
    "order.reservations",
    { durable: true }
  );

  await channel.bindQueue(
    "order.reservations",
    "ticket.events",
    "reservation.created"
  );

  await channel.bindQueue(
    "order.reservations",
    "ticket.events",
    "reservation.expired"
  );

  await channel.bindQueue(
    "order.reservations",
    "ticket.events",
    "reservation.confirmed"
  );

  console.log("Reservation messaging is ready");
}

async function closeRabbitMQ() {
  const currentChannel = channel;
  const currentConnection = connection;

  channel = null;
  connection = null;

  if (currentChannel) {
    await currentChannel.close();
  }

  if (currentConnection) {
    await currentConnection.close();
  }
}

module.exports = {
  connectRabbitMQ,
  getChannel,
  setupReservationMessaging,
  closeRabbitMQ,
};
