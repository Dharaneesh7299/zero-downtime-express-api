const {createClient} = require("redis");

const redisClient = createClient({
    url : process.env.REDIS_URL
});

redisClient.on("connect",()=>{
    console.log("redis is connecting"); 
});

redisClient.on("ready",()=>{
    console.log("redis is ready");
});

redisClient.on("error",(err)=>{
    console.error("redis error : ", err.message);
});

redisClient.on("end",()=>{
    console.log("redis connection is closed");
})

module.exports = redisClient;
