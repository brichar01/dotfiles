hl.gesture({
  fingers = 3,
  direction = "horizontal",
  action = "workspace",
})

hl.config({
  input = {
    kb_layout = "us",
    kb_variant = "",
    kb_model = "",
    kb_options = "",
    kb_rules = "",

    follow_mouse = 1,

    sensitivity = 0, -- -1.0 - 1.0, 0 means no modification.
    accel_profile = "flat",

    touchpad = {
      natural_scroll = true,
      clickfinger_behavior = true,
    },
  },
})

-- Adds input swapping for en and 日本語
hl.env("XMODIFIERS", "@im=fcitx")
hl.env("QT_IM_MODULE", "fcitx")
hl.env("QT_IM_MODULES", "wayland;fcitx")
