hl.monitor({
  output = "desc:Microstep G274QPF-QD CC2H313900280",
  mode = "2560x1440@60",
  position = "0x0",
  scale = 1,
})

hl.monitor({
  output = "desc:ViewSonic Corporation VX2728-FHD",
  mode = "1920x1080@60",
  position = "2560x0",
  scale = 1,
})

local function external_monitor_connected()
  local ls = io.popen("ls -d /sys/class/drm/card*-*/")
  if not ls then return false end
  local found = false
  for dir in ls:lines() do
    if not dir:find("eDP") then
      local f = io.open(dir .. "status")
      if f then
        found = f:read("l") == "connected"
        f:close()
      end
      if found then break end
    end
  end
  ls:close()
  return found
end

local function update_builtin() hl.monitor({ output = "eDP-1", disabled = external_monitor_connected() }) end

update_builtin()
hl.on("monitor.added", update_builtin)
hl.on("monitor.removed", update_builtin)

hl.monitor({ output = "", mode = "preferred", position = "auto", scale = 1 })
