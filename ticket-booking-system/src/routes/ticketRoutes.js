const express = require('express');
const { buyTicket } = require("../controller/ticketController");
const isAuthenticated = require("../middleware/authMiddleware");

const router = express.Router();

router.post('/buy',isAuthenticated,buyTicket);
router.get('/test',(req,res)=>{
    return res.status(200).json({
        success : true,
        message : "ticket router working"
    });
});

module.exports = router
