const express = require("express");

const router = express.Router();

const {resetInventory,getInventory} = require("../controller/adminController");

router.post("/reset",resetInventory);
router.get('/get',getInventory);
router.get("/test", (req, res) => {
    res.status(200).json({
        success : true,
        message : "admin route working"
    });
});

module.exports = router;