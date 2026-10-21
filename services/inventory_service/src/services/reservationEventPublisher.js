
const { getChannel } = require("../config/rabbitmq");

const EXCHANGE = "ticket.events";

async function publishEvent(routingKey, reservation) {
    const channel = await getChannel();

    const message = {
        eventType: routingKey,
        reservationId:
            reservation.reservationId || reservation.id,
        eventId: reservation.eventId,
        userId: reservation.userId,
        email: reservation.email,
        quantity: reservation.quantity,
        status: reservation.status,
        occurredAt: new Date().toISOString(),
    };

    const messageBuffer = Buffer.from(
        JSON.stringify(message)
    );

    await new Promise((resolve, reject) => {
        channel.publish(
            EXCHANGE,
            routingKey,
            messageBuffer,
            {
                persistent: true,
                contentType: "application/json",
                messageId: message.reservationId,
                type: routingKey,
            },
            (error) => {
                if (error) reject(error);
                else resolve();
            }
        );
    });

    return message;
}

async function publishReservationCreated(reservation) {
    return publishEvent("reservation.created", reservation);
}

async function publishReservationConfirmed(reservation) {
    return publishEvent("reservation.confirmed", reservation);
}

async function publishReservationExpired(reservation) {
    return publishEvent("reservation.expired", reservation);
}

module.exports = {
    publishReservationCreated,
    publishReservationConfirmed,
    publishReservationExpired,
};
