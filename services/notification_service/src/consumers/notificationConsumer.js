
const {
    getChannel,
    getPublisherChannel,
    QUEUE,
    RETRY_EXCHANGE,
    DLX_EXCHANGE,
} = require("../config/rabbitmq");

const {
    sendNotification,
} = require("../services/notificationService");

const MAX_ATTEMPTS = 3;

async function publishAndConfirm(channel, exchange, routingKey, message, options) {
    await new Promise((resolve, reject) => {
        channel.publish(
            exchange,
            routingKey,
            message.content,
            options,
            (error) => {
                if (error) reject(error);
                else resolve();
            }
        );
    });
}

async function startNotificationConsumer() {
    const channel = getChannel();

    // Confirm publishing before acknowledging the original message.
    const publisher = getPublisherChannel();

    await channel.prefetch(1);

    await channel.consume(
        QUEUE,
        async (message) => {
            if (!message) return;

            let event;

            try {
                event = JSON.parse(message.content.toString());

                console.log("Received event:", event.eventType);
                console.log("Attempt:", 
                    Number(message.properties.headers?.["x-retry-count"] || 0) + 1
                );

                await sendNotification(event);

                console.log(
                    "Notification processed successfully:",
                    event.reservationId
                );

                channel.ack(message);
            } catch (error) {
                console.error(
                    "Notification failed:",
                    error?.message || String(error)
                );

                const previousRetries = Number(
                    message.properties.headers?.["x-retry-count"] || 0
                );

                const nextAttempt = previousRetries + 1;

                try {
                    if (nextAttempt < MAX_ATTEMPTS) {
                        console.log(
                            `Scheduling retry ${nextAttempt + 1}/${MAX_ATTEMPTS}`
                        );

                        await publishAndConfirm(
                            publisher,
                            RETRY_EXCHANGE,
                            "retry",
                            message,
                            {
                                persistent: true,
                                contentType: message.properties.contentType,
                                type: message.properties.type,
                                messageId: message.properties.messageId,
                                headers: {
                                    ...message.properties.headers,
                                    "x-retry-count": nextAttempt,
                                },
                            }
                        );
                    } else {
                        console.error(
                            "Maximum attempts reached. Sending to DLQ."
                        );

                        await publishAndConfirm(
                            publisher,
                            DLX_EXCHANGE,
                            "failed",
                            message,
                            {
                                persistent: true,
                                contentType: message.properties.contentType,
                                type: message.properties.type,
                                messageId: message.properties.messageId,
                                headers: {
                                    ...message.properties.headers,
                                    "x-retry-count": nextAttempt,
                                    "x-failure-reason":
                                        error?.message || String(error),
                                },
                            }
                        );
                    }

                    // Acknowledge only after the handoff is confirmed.
                    channel.ack(message);
                } catch (publishError) {
                    console.error(
                        "Failed to publish retry/DLQ message:",
                        publishError?.message || String(publishError)
                    );

                    // Requeue the original if handoff failed.
                    channel.nack(message, false, true);
                }
            }
        },
        { noAck: false }
    );

    console.log("Notification consumer started");
}

module.exports = { startNotificationConsumer };
