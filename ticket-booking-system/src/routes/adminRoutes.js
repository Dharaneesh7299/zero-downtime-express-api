const express = require("express");

const router = express.Router();

const {updateRole,resetInventory,getInventory,getAllBookings} = require("../controller/adminController");
const {isAuthenticated,isAdmin} = require("../middleware/authMiddleware");

router.use(isAuthenticated);
router.use(isAdmin);

router.patch("/role/:id", updateRole);
router.post("/reset",resetInventory);
router.get('/get',getInventory);
router.get('/bookings',getAllBookings);
router.get("/test", (req, res) => {
    res.status(200).json({
        success : true,
        message : "admin route working"
    });
});

module.exports = router;