const session = require("express-session");
const RedisStore = require("connect-redis").RedisStore;
const redisClient = require("./redis");

const store = new RedisStore({
    client : redisClient,
});

module.exports = session({
    store,
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized : false,
    cookie : {
        httpOnly : true,
        secure : false,
        maxAge : 1000*60*60,//one hour
    }
})