
const { getChannel } = require("../config/rabbitmq");

const EXCHANGE = "ticket.events";

async function publishReservationExpired(reservation) {
  const channel = await getChannel();

  const event = {
    eventType: "reservation.expired",
    reservationId: reservation.reservationId,
    eventId: reservation.eventId,
    userId: reservation.userId,
    quantity: reservation.quantity,
    occurredAt: new Date().toISOString(),
  };

  const message = Buffer.from(JSON.stringify(event));

  await new Promise((resolve, reject) => {
    channel.publish(
      EXCHANGE,
      "reservation.expired",
      message,
      {
        persistent: true,
        contentType: "application/json",
        messageId: reservation.reservationId,
        type: "reservation.expired",
      },
      (error) => {
        if (error) reject(error);
        else resolve();
      }
    );
  });

  return event;
}

async function publishReservationConfirmed(reservation) {
  const channel = await getChannel();

  const event = {
    eventType: "reservation.confirmed",
    reservationId: reservation.reservationId,
    eventId: reservation.eventId,
    userId: reservation.userId,
    quantity: reservation.quantity,
    occurredAt: new Date().toISOString(),
  };

  const message = Buffer.from(JSON.stringify(event));

  await new Promise((resolve, reject) => {
    channel.publish(
      EXCHANGE,
      "reservation.confirmed",
      message,
      {
        persistent: true,
        contentType: "application/json",
        messageId: reservation.reservationId,
        type: "reservation.confirmed",
      },
      (error) => {
        if (error) reject(error);
        else resolve();
      }
    );
  });

  return event;
}

module.exports = {
  publishReservationExpired,
  publishReservationConfirmed,
};
