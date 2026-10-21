
const fs = require("fs");
const path = require("path");
const redis = require("../config/redis");
const prisma = require("../config/prisma");

const {
    publishReservationExpired,
} = require("./reservationEventPublisher");

const scriptPath = path.join(
    __dirname,
    "../scripts/expireReservation.lua"
);

const expireScript = fs.readFileSync(scriptPath, "utf8");

const EXPIRATION_KEY = "reservation:expirations";

async function expireReservation(reservationId) {
    const reservationKey = `reservation:${reservationId}`;

    const raw = await redis.get(reservationKey);

    if (!raw) {
        await redis.zRem(EXPIRATION_KEY, reservationId);

        return {
            expired: false,
            reason: "RESERVATION_NOT_FOUND",
        };
    }

    let reservation;

    try {
        reservation = JSON.parse(raw);
    } catch {
        throw new Error(
            `Invalid reservation JSON for ${reservationId}`
        );
    }

    if (!reservation.eventId) {
        throw new Error(
            `Reservation ${reservationId} has no eventId`
        );
    }

    // Atomically expire the reservation and restore inventory.
    const result = await redis.eval(expireScript, {
        keys: [
            reservationKey,
            `inventory:${reservation.eventId}`,
            EXPIRATION_KEY,
        ],
        arguments: [reservationId],
    });

    const code = Number(result[0]);
    const reason = String(result[1]);

    if (code === 1 && reason === "EXPIRED") {
        console.log(
            "Reservation expired:",
            reservationId
        );

        // Find the registered user's email.
        const user = await prisma.user.findUnique({
            where: {
                id: reservation.userId,
            },
            select: {
                email: true,
            },
        });

        if (!user) {
            throw new Error(
                `User not found for reservation ${reservationId}`
            );
        }

        // Publish the expiration event with the recipient email.
        await publishReservationExpired({
            ...reservation,
            email: user.email,
        });

        console.log(
            "Expiration notification event published:",
            reservationId
        );

        return {
            expired: true,
            reservationId,
        };
    }

    if (code === 0) {
        return {
            expired: false,
            reason,
        };
    }

    const error = new Error(
        `Reservation expiration failed: ${reason}`
    );

    error.code = reason;

    throw error;
}

async function processExpiredReservations(batchSize = 100) {
    if (
        !Number.isSafeInteger(batchSize) ||
        batchSize < 1 ||
        batchSize > 1000
    ) {
        throw new Error(
            "batchSize must be an integer between 1 and 1000"
        );
    }

    const time = await redis.time();
    const now = Number(time[0]);

    const reservationIds = await redis.zRangeByScore(
        EXPIRATION_KEY,
        0,
        now,
        {
            LIMIT: {
                offset: 0,
                count: batchSize,
            },
        }
    );

    const results = [];

    for (const reservationId of reservationIds) {
        try {
            const result =
                await expireReservation(reservationId);

            results.push(result);
        } catch (error) {
            console.error(
                `Failed to process reservation ${reservationId}:`,
                error.message
            );

            results.push({
                expired: false,
                reservationId,
                error: error.message,
            });
        }
    }

    return results;
}

module.exports = {
    expireReservation,
    processExpiredReservations,
};
