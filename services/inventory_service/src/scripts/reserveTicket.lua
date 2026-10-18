
-- KEYS[1] = inventory key
-- KEYS[2] = reservation key
-- KEYS[3] = idempotency key
-- KEYS[4] = reservation-expiration sorted set
--
-- ARGV[1] = reservation ID
-- ARGV[2] = event ID
-- ARGV[3] = user ID
-- ARGV[4] = requested quantity
-- ARGV[5] = reservation TTL in seconds

local inventoryKey = KEYS[1]
local reservationKey = KEYS[2]
local idempotencyKey = KEYS[3]
local expirationKey = KEYS[4]

local reservationId = ARGV[1]
local eventId = ARGV[2]
local userId = ARGV[3]
local quantity = tonumber(ARGV[4])
local ttl = tonumber(ARGV[5])

if not quantity or quantity < 1 or quantity % 1 ~= 0 then
    return {-4, "INVALID_QUANTITY"}
end

if not ttl or ttl < 1 or ttl % 1 ~= 0 then
    return {-4, "INVALID_TTL"}
end

-- Reuse the original reservation for idempotent retries.
local existingReservationId = redis.call("GET", idempotencyKey)

if existingReservationId then
    local existingReservationKey = "reservation:" .. existingReservationId

    if redis.call("EXISTS", existingReservationKey) == 1 then
        return {2, existingReservationId}
    end

    return {-5, "IDEMPOTENCY_RECORD_WITHOUT_RESERVATION"}
end

local available = redis.call("GET", inventoryKey)

if not available then
    return {-1, "INVENTORY_NOT_INITIALIZED"}
end

available = tonumber(available)

if not available or available < 0 or available % 1 ~= 0 then
    return {-4, "INVALID_INVENTORY"}
end

if available < quantity then
    return {-2, "INSUFFICIENT_INVENTORY"}
end

-- Use Redis server time to avoid application clock differences.
local time = redis.call("TIME")
local now = tonumber(time[1])
local expiresAt = now + ttl

local reservation = cjson.encode({
    reservationId = reservationId,
    eventId = eventId,
    userId = userId,
    quantity = quantity,
    status = "RESERVED",
    expiresAt = expiresAt
})

-- All these operations execute atomically in Redis.
redis.call("DECRBY", inventoryKey, quantity)
redis.call("SET", reservationKey, reservation)
redis.call("SET", idempotencyKey, reservationId, "EX", ttl)
redis.call("ZADD", expirationKey, expiresAt, reservationId)

return {1, reservationId}
