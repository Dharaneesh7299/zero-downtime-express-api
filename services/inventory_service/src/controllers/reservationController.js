const inventoryService = require("../services/inventoryService");

function validId(value) {
  return (
    typeof value === "string" &&
    /^[a-zA-Z0-9_-]{1,64}$/.test(value)
  );
}

async function initializeInventory(req, res, next) {
  try {
    const { eventId } = req.params;
    const { quantity } = req.body;

    if (!validId(eventId)) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        error: "Quantity must be a non-negative integer",
      });
    }

    const result = await inventoryService.setInventory(
      eventId,
      quantity
    );

    return res.status(200).json({
      message: "Inventory initialized",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

async function getInventory(req, res, next) {
  try {
    const { eventId } = req.params;

    if (!validId(eventId)) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    const inventory = await inventoryService.getInventory(eventId);

    if (!inventory) {
      return res.status(404).json({
        error: "Inventory not found",
      });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    next(error);
  }
}


async function reserveTickets(req, res, next) {
  try {
    const { eventId, quantity } = req.body;

    // Identity comes from the verified JWT.
    const userId = req.user.id;
    const idempotencyKey = req.get("Idempotency-Key");

    if (!validId(eventId)) {
      return res.status(400).json({
        error: "A valid eventId is required",
      });
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 10
    ) {
      return res.status(400).json({
        error: "Quantity must be an integer between 1 and 10",
      });
    }

    if (
      typeof idempotencyKey !== "string" ||
      !/^[a-zA-Z0-9_-]{8,128}$/.test(idempotencyKey)
    ) {
      return res.status(400).json({
        error: "A valid Idempotency-Key header is required",
      });
    }

    const result = await inventoryService.reserveTickets({
      eventId,
      userId,
      quantity,
      idempotencyKey,
    });

    return res.status(result.created ? 201 : 200).json({
      message: result.created
        ? "Tickets reserved"
        : "Existing reservation returned",
      ...result,
    });
  } catch (error) {
    if (error.code === "INSUFFICIENT_INVENTORY") {
      return res.status(409).json({ error: error.message });
    }

    if (error.code === "INVENTORY_NOT_INITIALIZED") {
      return res.status(404).json({ error: error.message });
    }

    return next(error);
  }
}



async function getReservation(req, res, next) {
  try {
    const { reservationId } = req.params;

    if (!validId(reservationId)) {
      return res.status(400).json({
        error: "Invalid reservation ID",
      });
    }

    const reservation =
      await inventoryService.getReservation(reservationId);

    if (!reservation) {
      return res.status(404).json({
        error: "Reservation not found",
      });
    }

    // Only the owner or an administrator can view the reservation.
    if (
      reservation.userId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        error: "You are not allowed to view this reservation",
      });
    }

    return res.status(200).json(reservation);
  } catch (error) {
    return next(error);
  }
}


module.exports = {
  initializeInventory,
  getInventory,
  reserveTickets,
  getReservation,
};