local readtext = function(path)
    local f = io.open(path, "r")
    local dat = f:read("a")
    f:flush()
    f:close()
    return dat
end
local term = ""
term = term .. readtext('./Terminal.html') .. "<script type='application/lua'>
term = term .. readtext('./src/bootloader.lua')
