
-- KEYS[1] = reservation key
-- KEYS[2] = reservation-expiration sorted set
--
-- ARGV[1] = current time in Unix seconds

local reservationKey = KEYS[1]
local expirationKey = KEYS[2]
local now = tonumber(ARGV[1])

local raw = redis.call("GET", reservationKey)

if not raw then
    return {0, "RESERVATION_NOT_FOUND"}
end

local reservation = cjson.decode(raw)

if reservation.status == "CONFIRMED" then
    return {1, "ALREADY_CONFIRMED"}
end

if reservation.status ~= "RESERVED" then
    return {0, "RESERVATION_NOT_ACTIVE"}
end

if not now or now >= tonumber(reservation.expiresAt) then
    return {0, "RESERVATION_EXPIRED"}
end

reservation.status = "CONFIRMED"
reservation.confirmedAt = now

redis.call("SET", reservationKey, cjson.encode(reservation))
redis.call("ZREM", expirationKey, reservation.reservationId)

return {1, "CONFIRMED"}
