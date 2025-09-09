local readtext = function(path)
    local f = io.open(path, "r")
    local dat = f:read("a")
    f:flush()
    f:close()
    return dat
end
local term = ""
term = term .. readtext('./Terminal.html') .. "<script type='application/lua'>\n"
term = term .. readtext('./src/bootloader.lua') .. '\n'
term = term .. "\n</script>"
local a = io.open('/sdcard/webbrew/index.html', "w+")
a:write(term)
a:flush()
a:close()