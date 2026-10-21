
const { getChannel } = require("../config/rabbitmq");
const prisma = require("../config/prisma");

const QUEUE = "order.reservations";

async function startReservationConsumer() {
  const channel = await getChannel();
  
  // Ensure the durable queue exists before consuming.
  // Inventory Service uses the same queue.
  await channel.assertQueue(QUEUE, {
    durable: true,
  });

  await channel.prefetch(10);

  await channel.consume(
    QUEUE,
    async (message) => {
      if (!message) return;

      try {
        const event = JSON.parse(message.content.toString());

        console.log("Received reservation event:", event.eventType);

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

            console.log(
              "Order created or already exists:",
              event.reservationId
            );
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

            console.log(
              "Order confirmed:",
              event.reservationId,
              "Updated:",
              result.count
            );
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

            console.log(
              "Order expired:",
              event.reservationId,
              "Updated:",
              result.count
            );
            break;
          }

          default:
            console.log("Ignoring unknown event:", event.eventType);
        }

        // Acknowledge only after successful processing.
        channel.ack(message);
      } catch (error) {
        console.error("Failed to process reservation event:", error);

        // Requeue the event if processing fails.
        channel.nack(message, false, true);
      }
    },
    {
      noAck: false,
    }
  );

  console.log(`Reservation consumer started on queue: ${QUEUE}`);
}

module.exports = {
  startReservationConsumer,
};
