const express = require("express");
const sesssionmiddleware = require("./config/session");
const adminRoutes = require("./routes/adminRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const authRoutes = require("./routes/authRoutes");


const app = express();
app.use(express.json());
app.use(sesssionmiddleware);
app.use('/admin',adminRoutes);
app.use('/ticket',ticketRoutes);
app.use('/auth',authRoutes);

app.get('/',(req,res)=>{

    res.status(200).json({
        message : "the ticket booking server is running",
        workerPID: process.pid
    });
});

module.exports = app;