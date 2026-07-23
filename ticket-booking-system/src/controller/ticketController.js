const fs = require("fs");
const path = require("path");

const redisClient = require("../config/redis");

const TICKETS_KEY = process.env.TICKETS_KEY;

const buyTicketScript = fs.readFileSync(
    path.join(__dirname, "../scripts/buyTickets.lua"),
    "utf8"
);

async function buyTicket(req, res) {
    try {
        const { tickets } = req.body;

        if (!Number.isInteger(tickets) || tickets <= 0) {
            return res.status(400).json({
                success: false,
                message: "Ticket count must be a positive integer."
            });
        }

        const result = await redisClient.eval(buyTicketScript, {
            keys: [TICKETS_KEY],
            arguments: [tickets.toString()]
        });

        if (result === -1) {
            return res.status(404).json({
                success: false,
                message: "Inventory not initialized."
            });
        }

        if (result === -2) {
            return res.status(400).json({
                success: false,
                message: "Not enough tickets available."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Tickets purchased successfully.",
            remainingTickets: result
        });

    } 
    
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

module.exports = {
    buyTicket
};