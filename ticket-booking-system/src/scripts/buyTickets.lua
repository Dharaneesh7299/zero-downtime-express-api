
local available = redis.call("GET",KEYS[1])

if not available then 
    return -1
end

available = tonumber(available)

local requested = tonumber(ARGV[1])

if available < requested then
    return -2
end

redis.call("DECRBY",KEYS[1],requested)

return available-requested
    
