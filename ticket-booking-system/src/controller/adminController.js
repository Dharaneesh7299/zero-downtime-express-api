const { json } = require("express");
const redisClient = require("../config/redis");
const prisma = require("../config/prisma");
const { exec } = require("npx/child");

const TICKETS_KEY = process.env.TICKETS_KEY;

async function updateRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!["USER", "ADMIN"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: Number(id)
            },
            data: {
                role
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true
            }
        });

        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            user: updatedUser
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

async function resetInventory(req,res) {
    try{
        const { tickets } = req.body;
        if (!Number.isInteger(tickets) || tickets<0){
            return res.status(400).json({
                success : false,
                message : "ticket value cannot be neagtive or characters"
            });
        }

        await redisClient.set(TICKETS_KEY,tickets);

        return res.status(200).json({
            success : true,
            message : "inventory reset successfully"
        });
    }
    catch(err){
        return res.status(500).json({
            success : false,
            message : err.message
        });
    }
};

async function getInventory(req,res) {
    try{
        const ticket = await redisClient.get(TICKETS_KEY);
        if (ticket == null){
            return res.status(404).json({
                success : false,
                message : "could not find the given key"
            });
        }

        return res.status(200).json({
            success : true,
            tickets : Number(ticket)
        });
    }
    catch(err){
        return res.status(500).json({
            success : false,
            message : "could not fetch ticket data"
        });
    }
};

async function getAllBookings(req, res) {
    try {
        const bookings = await prisma.booking.findMany({
            orderBy: {
                createdAt: "desc"
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            bookings
        });

    } catch (err) {
        console.error("Get all bookings error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings."
        });
    }
}



module.exports = {
    updateRole,
    resetInventory,
    getInventory,
    getAllBookings
};