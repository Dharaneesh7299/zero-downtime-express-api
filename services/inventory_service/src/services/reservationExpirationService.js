
const fs = require("fs");
const path = require("path");
const redis = require("../config/redis");

const scriptPath = path.join(
  __dirname,
  "../scripts/expireReservation.lua"
);

const expireScript = fs.readFileSync(scriptPath, "utf8");

const EXPIRATION_KEY = "reservation:expirations";

async function expireReservation(reservationId) {
  const reservationKey = `reservation:${reservationId}`;

  // Read the reservation to identify its event inventory key.
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

  if (code === 1) {
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

  // Use Redis server time for selecting expired reservations.
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
      const result = await expireReservation(reservationId);
      results.push(result);
    } catch (error) {
      // Leave failed reservations in the sorted set so they
      // can be retried by a later worker iteration.
      console.error(
        `Failed to expire reservation ${reservationId}:`,
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
