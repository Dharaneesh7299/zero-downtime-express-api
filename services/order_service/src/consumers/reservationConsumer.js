
const { getChannel } = require("../config/rabbitmq");
const prisma = require("../config/prisma");

async function processReservationEvent(event) {
  switch (event.eventType) {
    case "reservation.created": {
      await prisma.order.upsert({
        where: {
          reservationId: event.reservationId,
        },
        update: {},
        create: {
          reservationId: event.reservationId,
          eventId: event.eventId,
          userId: event.userId,
          quantity: event.quantity,
          status: "PENDING",
        },
      });

      console.log("Order created/verified:", event.reservationId);
      break;
    }

    case "reservation.confirmed": {
      const result = await prisma.order.updateMany({
        where: {
          reservationId: event.reservationId,
          status: "PENDING",
        },
        data: {
          status: "CONFIRMED",
        },
      });

      if (result.count === 1) {
        console.log("Order marked CONFIRMED:", event.reservationId);
      } else {
        console.log(
          "No pending order to confirm:",
          event.reservationId
        );
      }

      break;
    }

    case "reservation.expired": {
      const result = await prisma.order.updateMany({
        where: {
          reservationId: event.reservationId,
          status: "PENDING",
        },
        data: {
          status: "EXPIRED",
        },
      });

      if (result.count === 1) {
        console.log("Order marked EXPIRED:", event.reservationId);
      } else {
        console.log(
          "No pending order to expire:",
          event.reservationId
        );
      }

      break;
    }

    default:
      throw new Error(`Unknown event type: ${event.eventType}`);
  }
}

async function startReservationConsumer() {
  const channel = await getChannel();

  await channel.prefetch(10);

  await channel.consume("order.reservations", async (message) => {
    if (!message) return;

    try {
      const event = JSON.parse(message.content.toString());

      console.log(
        "Received RabbitMQ event:",
        event.eventType,
        event.reservationId
      );

      await processReservationEvent(event);

      // Acknowledge only after database processing succeeds.
      channel.ack(message);
    } catch (error) {
      console.error(
        "Failed to process reservation event:",
        error.message
      );

      // Requeue for a later retry.
      channel.nack(message, false, true);
    }
  });

  console.log("Reservation consumer started");
}

module.exports = {
  startReservationConsumer,
  processReservationEvent,
};
