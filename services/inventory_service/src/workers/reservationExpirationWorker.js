
require("dotenv").config();

const redis = require("../config/redis");
const {
  processExpiredReservations,
} = require("../services/reservationExpirationService");

const INTERVAL_MS = 1000;
const BATCH_SIZE = 100;

let running = false;
let stopping = false;
let timer;

async function run() {
  if (running || stopping) return;

  running = true;

  try {
    const results = await processExpiredReservations(BATCH_SIZE);

    const expiredCount = results.filter(
      (result) => result.expired
    ).length;

    if (expiredCount > 0) {
      console.log(`Expired ${expiredCount} reservation(s)`);
    }
  } catch (error) {
    console.error("Expiration worker iteration failed:", error);
  } finally {
    running = false;
  }
}

async function shutdown() {
  if (stopping) return;

  stopping = true;
  console.log("Stopping reservation expiration worker...");

  if (timer) clearInterval(timer);

  // Wait for any in-progress iteration to finish.
  while (running) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (redis.isOpen) {
    await redis.quit();
  }

  process.exit(0);
}

async function start() {
  if (!redis.isOpen) {
    await redis.connect();
  }

  await redis.ping();

  console.log("Reservation expiration worker connected to Redis");

  await run();
  timer = setInterval(run, INTERVAL_MS);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

start().catch(async (error) => {
  console.error("Could not start expiration worker:", error);

  if (redis.isOpen) {
    await redis.quit().catch(() => {});
  }

  process.exitCode = 1;
});
