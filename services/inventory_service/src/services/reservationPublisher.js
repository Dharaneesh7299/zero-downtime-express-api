
const { getChannel } = require("../config/rabbitmq");

const EXCHANGE = "ticket.events";
const ROUTING_KEY = "reservation.created";

async function publishReservationCreated(reservation) {
  const channel = await getChannel();

  const message = {
    eventType: "reservation.created",
    reservationId: reservation.reservationId,
    eventId: reservation.eventId,
    userId: reservation.userId,
    quantity: reservation.quantity,
    status: reservation.status,
    occurredAt: new Date().toISOString(),
  };

  const messageBuffer = Buffer.from(
    JSON.stringify(message)
  );

  // Wait until RabbitMQ confirms the publication.
  await new Promise((resolve, reject) => {
    channel.publish(
      EXCHANGE,
      ROUTING_KEY,
      messageBuffer,
      {
        persistent: true,
        contentType: "application/json",
        messageId: reservation.reservationId,
        type: "reservation.created",
      },
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });

  return message;
}

module.exports = {
  publishReservationCreated,
};
