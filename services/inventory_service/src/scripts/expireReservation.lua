
-- KEYS[1] = reservation key
-- KEYS[2] = inventory key
-- KEYS[3] = reservation-expiration sorted set
--
-- ARGV[1] = reservation ID

local reservationKey = KEYS[1]
local inventoryKey = KEYS[2]
local expirationKey = KEYS[3]
local reservationId = ARGV[1]

local raw = redis.call("GET", reservationKey)

if not raw then
    redis.call("ZREM", expirationKey, reservationId)
    return {0, "RESERVATION_NOT_FOUND"}
end

local reservation = cjson.decode(raw)

-- Never restore tickets twice or expire a confirmed reservation.
if reservation.status ~= "RESERVED" then
    redis.call("ZREM", expirationKey, reservationId)
    return {0, "RESERVATION_NOT_ACTIVE"}
end

local time = redis.call("TIME")
local now = tonumber(time[1])
local expiresAt = tonumber(reservation.expiresAt)

if not expiresAt or now < expiresAt then
    return {0, "RESERVATION_NOT_EXPIRED"}
end

local available = redis.call("GET", inventoryKey)

if not available then
    return {-1, "INVENTORY_NOT_FOUND"}
end

available = tonumber(available)

if not available or available < 0 then
    return {-1, "INVALID_INVENTORY"}
end

-- Restore inventory and update the reservation atomically.
redis.call("INCRBY", inventoryKey, reservation.quantity)

reservation.status = "EXPIRED"
reservation.expiredAt = now

redis.call("SET", reservationKey, cjson.encode(reservation))
redis.call("ZREM", expirationKey, reservationId)

return {1, "EXPIRED"}
