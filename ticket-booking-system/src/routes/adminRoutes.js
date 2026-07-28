const express = require("express");

const router = express.Router();

const {resetInventory,getInventory} = require("../controller/adminController");
const {isAuthenticated,isAdmin} = require("../middleware/authMiddleware");

router.use(isAuthenticated);
router.use(isAdmin);

router.post("/reset",resetInventory);
router.get('/get',getInventory);
router.get("/test", (req, res) => {
    res.status(200).json({
        success : true,
        message : "admin route working"
    });
});

module.exports = router;