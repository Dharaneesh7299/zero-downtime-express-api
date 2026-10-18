require("dotenv").config();

const app = require("./app");
const redis = require("./config/redis");

const PORT = Number(process.env.PORT || 4001);

async function startServer() {
  try {
    await redis.connect();

    await redis.ping();
    console.log("Connected to Redis");

    const server = app.listen(PORT, () => {
      console.log(
        `Inventory service running on port ${PORT}`
      );
    });

    async function shutdown() {
      console.log("Shutting down inventory service...");

      server.close(async () => {
        try {
          if (redis.isOpen) {
            await redis.quit();
          }

          process.exit(0);
        } catch (error) {
          console.error("Shutdown error:", error.message);
          process.exit(1);
        }
      });
    }

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start service:", error.message);

    if (redis.isOpen) {
      await redis.quit().catch(() => {});
    }

    process.exit(1);
  }
}

startServer();