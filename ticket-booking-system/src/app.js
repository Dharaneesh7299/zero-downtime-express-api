const express = require("express");
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();
app.use(express.json());
app.use(ticketRoutes);

app.get('/',(req,res)=>{
    res.status(200).json({
        message : "the ticket booking server is running"
    });
});

module.exports = app;