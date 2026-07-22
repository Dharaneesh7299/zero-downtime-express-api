const express = require("express");

const router = express.Router();

const {resetInventory,getInventory} = require("../controller/ticketController");

router.post("/admin/reset",resetInventory);
router.get('/admin/get',getInventory);
router.get("/test", (req, res) => {
    res.send("Working");
});

module.exports = router;