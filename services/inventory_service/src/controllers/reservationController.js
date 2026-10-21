
const inventoryService = require("../services/inventoryService");
const prisma = require("../config/prisma");

const {
    publishReservationCreated,
} = require("../services/reservationPublisher");

const {
    publishReservationConfirmed,
} = require("../services/reservationEventPublisher");

function validId(value) {
    return (
        typeof value === "string" &&
        /^[a-zA-Z0-9_-]{1,64}$/.test(value)
    );
}

async function initializeInventory(req, res, next) {
    try {
        const { eventId } = req.params;
        const { quantity, name, category, icon, date, location, price, type } = req.body;

        if (!validId(eventId)) {
            return res.status(400).json({
                error: "Invalid event ID. Alphanumeric, dashes, and underscores only (1-64 chars).",
            });
        }

        const numQuantity = Number(quantity);
        if (!Number.isSafeInteger(numQuantity) || numQuantity < 0) {
            return res.status(400).json({
                error: "Quantity must be a non-negative integer",
            });
        }

        const metadata = {
            name: typeof name === "string" && name.trim() ? name.trim() : eventId,
            category: typeof category === "string" && category.trim() ? category.trim() : "Live Event",
            icon: typeof icon === "string" && icon.trim() ? icon.trim() : "🎟️",
            date: typeof date === "string" && date.trim() ? date.trim() : "Upcoming",
            location: typeof location === "string" && location.trim() ? location.trim() : "Venue TBA",
            price: (!isNaN(Number(price)) && Number(price) >= 0) ? Number(price) : 0,
            type: typeof type === "string" && type.trim() ? type.trim() : "Standard Admission",
        };

        const result = await inventoryService.setInventory(
            eventId,
            numQuantity,
            metadata
        );

        return res.status(200).json({
            message: "Inventory initialized",
            ...result,
        });
    } catch (error) {
        next(error);
    }
}

async function getAllInventory(req, res, next) {
    try {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        const items = await inventoryService.getAllInventory();
        return res.status(200).json(items);
    } catch (error) {
        next(error);
    }
}

async function deleteInventory(req, res, next) {
    try {
        const { eventId } = req.params;

        if (!validId(eventId)) {
            return res.status(400).json({
                error: "Invalid event ID",
            });
        }

        const result = await inventoryService.deleteInventory(eventId);
        return res.status(200).json({
            message: "Event inventory deleted",
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

        const inventory =
            await inventoryService.getInventory(eventId);

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

        if (result.created) {
            try {
                await prisma.order.upsert({
                    where: {
                        reservationId: result.reservation.reservationId,
                    },
                    update: {},
                    create: {
                        reservationId: result.reservation.reservationId,
                        eventId: result.reservation.eventId,
                        userId: result.reservation.userId,
                        quantity: result.reservation.quantity,
                        status: "PENDING",
                    },
                });
            } catch (dbErr) {
                console.error("Direct order pending creation error:", dbErr);
            }

            await publishReservationCreated(result.reservation);
        }

        return res.status(result.created ? 201 : 200).json({
            message: result.created
                ? "Tickets reserved"
                : "Existing reservation returned",
            ...result,
        });
    } catch (error) {
        if (error.code === "INSUFFICIENT_INVENTORY") {
            return res.status(409).json({
                error: error.message,
            });
        }

        if (error.code === "INVENTORY_NOT_INITIALIZED") {
            return res.status(404).json({
                error: error.message,
            });
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

async function confirmReservation(req, res, next) {
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

        if (
            reservation.userId !== req.user.id &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                error: "You are not allowed to confirm this reservation",
            });
        }

        const result =
            await inventoryService.confirmReservation(reservationId);

        if (result.message === "CONFIRMED") {
            const confirmedReservation =
                await inventoryService.getReservation(reservationId);

            const user = await prisma.user.findUnique({
                where: {
                    id: confirmedReservation.userId,
                },
                select: {
                    email: true,
                },
            });

            if (!user) {
                throw new Error("Reservation owner not found");
            }

            // Directly and synchronously persist CONFIRMED status in PostgreSQL
            try {
                await prisma.order.upsert({
                    where: {
                        reservationId,
                    },
                    update: {
                        status: "CONFIRMED",
                    },
                    create: {
                        reservationId,
                        eventId: confirmedReservation.eventId,
                        userId: confirmedReservation.userId,
                        quantity: confirmedReservation.quantity,
                        status: "CONFIRMED",
                    },
                });
            } catch (dbErr) {
                console.error("Direct order confirmation error:", dbErr);
            }

            await publishReservationConfirmed({
                ...confirmedReservation,
                email: user.email,
            });
        }

        return res.status(200).json({
            message: result.message,
            reservationId,
        });
    } catch (error) {
        if (error.code === "RESERVATION_NOT_FOUND") {
            return res.status(404).json({
                error: error.message,
            });
        }

        if (
            error.code === "RESERVATION_EXPIRED" ||
            error.code === "RESERVATION_NOT_ACTIVE"
        ) {
            return res.status(409).json({
                error: error.message,
            });
        }

        return next(error);
    }
}

async function getUserOrders(req, res, next) {
    try {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        const userId = req.user.id;
        const orders = await prisma.order.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const redis = require("../config/redis");
        const enrichedOrders = await Promise.all(
            orders.map(async (order) => {
                let currentStatus = order.status;

                // Self-healing: if order is PENDING, verify Redis reservation status
                if (currentStatus === "PENDING" && order.reservationId) {
                    try {
                        const reservationRaw = await redis.get(`reservation:${order.reservationId}`);
                        if (reservationRaw) {
                            const resObj = JSON.parse(reservationRaw);
                            if (resObj.status === "CONFIRMED") {
                                currentStatus = "CONFIRMED";
                                await prisma.order.update({
                                    where: { id: order.id },
                                    data: { status: "CONFIRMED" },
                                }).catch(() => {});
                            } else if (resObj.status === "EXPIRED" || (resObj.expiresAt && resObj.expiresAt * 1000 < Date.now())) {
                                currentStatus = "EXPIRED";
                                await prisma.order.update({
                                    where: { id: order.id },
                                    data: { status: "EXPIRED" },
                                }).catch(() => {});
                            }
                        }
                    } catch (e) {
                        // ignore
                    }
                }

                const redisMeta = await redis.get(`event:meta:${order.eventId}`);
                let metadata = null;
                if (redisMeta) {
                    try {
                        metadata = JSON.parse(redisMeta);
                    } catch {
                        // ignore
                    }
                }

                return {
                    id: order.id,
                    bookingId: order.reservationId,
                    reservationId: order.reservationId,
                    eventId: order.eventId,
                    quantity: order.quantity,
                    status: currentStatus,
                    createdAt: order.createdAt,
                    event: {
                        id: order.eventId,
                        name: metadata?.name || order.eventId,
                        category: metadata?.category || "Live Event",
                        date: metadata?.date || "Upcoming",
                        location: metadata?.location || "Venue TBA",
                        price: metadata?.price || 0,
                    },
                    totalPrice: (metadata?.price || 0) * order.quantity,
                };
            })
        );

        return res.status(200).json(enrichedOrders);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    initializeInventory,
    deleteInventory,
    getInventory,
    getAllInventory,
    reserveTickets,
    getReservation,
    confirmReservation,
    getUserOrders
};
