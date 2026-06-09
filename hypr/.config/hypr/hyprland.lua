-- Configs
require("lua.startup")
require("lua.monitors")
require("lua.containers")
require("lua.input")
require("lua.keybinds")
require("lua.animations")

-- Other stuff
hl.config({
	misc = {
		disable_hyprland_logo = true,
		disable_splash_rendering = true,
		mouse_move_focuses_monitor = true,
		middle_click_paste = false,
	},
})

hl.window_rule({
	-- Fix some dragging issues with XWayland
	name = "fix-xwayland-drags",
	match = {
		class = "^$",
		title = "^$",
		xwayland = true,
		float = true,
		fullscreen = false,
		pin = false,
	},

	no_focus = true,
})

-- hl.layer_rule({
-- 	name = "blur-rofi",
-- 	match = { class = "rofi" },
-- 	blur = true,
-- })
