require('dotenv').config();
const app = require("./app");
const redisClient = require("./config/redis");

const PORT = process.env.PORT || 3500;

async function startServer() {
    try {
        await redisClient.connect();
        console.log("redis connected");

        app.listen(PORT,()=>{
            console.log(`the server is running in http://localhost:${PORT}`)
        });
    }

    catch(err){
        console.log("failed to connect");
        process.exit(1);
    }
};

startServer();