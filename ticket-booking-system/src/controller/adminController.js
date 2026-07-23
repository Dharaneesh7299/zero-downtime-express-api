const { json } = require("express");
const redisClient = require("../config/redis");
const { exec } = require("npx/child");

const TICKETS_KEY = process.env.TICKETS_KEY;

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



module.exports = {
    resetInventory,
    getInventory
};