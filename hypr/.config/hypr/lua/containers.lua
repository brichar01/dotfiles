-- general {
--     gaps_in = 5
--     gaps_out = 10
--
--     border_size = 2
--     col.active_border = rgba(7e8188ee)
--     col.inactive_border = rgba(39404fee)
--
--     # Please see https://wiki.hypr.land/Configuring/Tearing/ before you turn this on
--     allow_tearing = false
--
-- }
--
-- # https://wiki.hypr.land/Configuring/Variables/#decoration
-- decoration {
--     rounding = 5
--     rounding_power = 2
--
--     # Change transparency of focused and unfocused windows
--     active_opacity = 1.0
--     inactive_opacity = 1.0
--
--     shadow {
--         enabled = true
--         range = 20
--         render_power = 3
--         color = rgba(2e3440ee)
--     }
--
--     # https://wiki.hypr.land/Configuring/Variables/#blur
--     blur {
--         enabled = true
--         size = 5
--         passes = 2
--         vibrancy = 0.2
--     }
-- }

hl.config({
  general = {
    gaps_in = 5,
    gaps_out = 10,
  },
  decoration = {
    rounding = 5,
    rounding_power = 2,
    shadow = {
      enabled = true,
      range = 20,
      render_power = 3,
      color = "rgba(2e3440ee)",
    },
    blur = {
      enabled = true,
      size = 5,
      passes = 2,
      vibrancy = 0.2,
    },
  },
  animations = {
    enabled = true,
  },
})
