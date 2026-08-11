const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");

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

        const booking = await prisma.booking.create({
            data : {
                userID : req.session.user.id,
                quantity : tickets
            }
        });

        return res.status(200).json({
            success: true,
            message: "Tickets purchased successfully.",
            bookingId: booking.id,
            quantity: booking.quantity,
            remainingTickets: result
        });

    } 
    
    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to complete booking."
        });
    }
}

async function getBookings(req,res) {
    try {
        const userID = req.session.user.id;

        const bookings = await prisma.booking.findMany({
            where : {
                userID : userID
            },
            orderBy : {
                createdAt : "desc"
            }
        });

        return res.status(200).json({
            success: true,
            bookings : bookings
        });
    } 
    catch(err){
        console.error("Get bookings error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch booking history."
        });
    }
}

module.exports = {
    buyTicket,
    getBookings
};