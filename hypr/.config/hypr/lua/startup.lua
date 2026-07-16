-- exec-once = systemctl --user start hyperpolkitagent
--
-- ## desktop
-- exec-once = waybar
-- exec-once = hyprpaper
-- exec-once = hyprlidle
--
-- # configure cliphist
-- exec-once = wl-paste --type text --watch cliphist store
-- exec-once = wl-paste --type image --watch cliphist store

hl.on("hyprland.start", function()
  hl.exec_cmd("waybar")
  hl.exec_cmd("hyprpaper")
  hl.exec_cmd("hypridle")
  hl.exec_cmd("wl-paste --type text --watch cliphist store")
  hl.exec_cmd("wl-paste --type image --watch cliphist store")
  hl.exec_cmd("fcitx5")
  hl.exec_cmd("/usr/lib/pam_kwallet_init")
  hl.exec_cmd("flatpak run com.nextcloud.desktopclient.nextcloud --background")
end)
