require("dotenv").config();

const cluster = require("cluster");
const os = require("os");

const PORT = process.env.PORT || 3500;

async function startServer() {

    const app = require("./app");
    const redisClient = require("./config/redis");

    try {

        await redisClient.connect();

        console.log(
            `Worker ${process.pid}: Redis connected`
        );

        app.listen(PORT, () => {
            console.log(
                `Worker ${process.pid} running on port ${PORT}`
            );
        });

    } catch (err) {

        console.error(
            `Worker ${process.pid}: failed to connect`,
            err
        );

        process.exit(1);
    }
}


if (cluster.isPrimary) {

    const cpuCount = os.cpus().length;

    console.log(`Primary process ${process.pid} is running`);
    console.log(`Creating ${cpuCount} workers...`);

    for (let i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {

        console.log(
            `Worker ${worker.process.pid} died`
        );

        console.log("Starting a new worker...");

        cluster.fork();
    });

} else {

    startServer();

}