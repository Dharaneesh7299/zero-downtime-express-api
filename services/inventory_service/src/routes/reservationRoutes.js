
const express = require("express");
const controller = require("../controllers/reservationController");
const authenticateToken = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

// Only authenticated administrators can initialize inventory.
router.put(
  "/admin/events/:eventId/inventory",
  authenticateToken,
  requireRole("ADMIN"),
  controller.initializeInventory
);

// Inventory can be viewed publicly.
router.get(
  "/events/:eventId/inventory",
  controller.getInventory
);

// Only authenticated users can reserve tickets.
router.post(
  "/reservations",
  authenticateToken,
  controller.reserveTickets
);

// Only the owner or an administrator can view a reservation.
// Ownership is checked inside the controller.
router.get(
  "/reservations/:reservationId",
  authenticateToken,
  controller.getReservation
);

// Only the owner or an administrator can confirm a reservation.
// Ownership is checked inside the controller.
router.post(
  "/reservations/:reservationId/confirm",
  authenticateToken,
  controller.confirmReservation
);

module.exports = router;
