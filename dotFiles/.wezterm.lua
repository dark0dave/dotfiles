local wezterm = require 'wezterm'
local config = wezterm.config_builder()

-- https://github.com/wez/wezterm/issues/4323
-- https://github.com/wez/wezterm/issues/3214
-- nvidia linux settings
config.front_end = 'WebGpu'

-- Config
config.enable_scroll_bar = true
config.scrollback_lines = 5000000
config.colors = {}
config.colors.scrollbar_thumb = 'white'

config.color_scheme = 'tokyonight_night'
config.font = wezterm.font_with_fallback {
  'Roboto Mono for Powerline',
  'Fira Code',
}

config.window_background_opacity = 0.75
config.line_height = 1

config.window_padding = {
  left = '0.25cell',
  right = '0.25cell',
  top = '0cell',
  bottom = '0.1cell',
}

config.hide_tab_bar_if_only_one_tab = true
-- https://wezfurlong.org/wezterm/config/default-keys.html?h=key
config.disable_default_key_bindings = true
config.keys = {
  { key = 'L', mods = 'CTRL', action = wezterm.action.ShowDebugOverlay },
  { key = 'c', mods = 'CTRL|SHIFT', action = wezterm.action.CopyTo("Clipboard") },
  { key = 'v', mods = 'CTRL|SHIFT', action = wezterm.action.PasteFrom("Clipboard") },
  { key = 'c', mods = 'SUPER', action = wezterm.action.CopyTo("Clipboard") },
  { key = 'v', mods = 'SUPER', action = wezterm.action.PasteFrom("Clipboard") },
  { key = 'T', mods = 'CTRL|SHIFT', action = wezterm.action.SpawnTab("DefaultDomain") },
  { key = '[', mods = 'CTRL|ALT', action = wezterm.action.ActivateTabRelative(-1) },
  { key = ']', mods = 'CTRL|ALT', action = wezterm.action.ActivateTabRelative(1) },
  { key = '+', mods = 'CTRL|SHIFT', action = wezterm.action.SplitVertical { domain = 'CurrentPaneDomain' } },
  { key = '_', mods = 'CTRL|SHIFT', action = wezterm.action.SplitHorizontal { domain = 'CurrentPaneDomain' } },
  { key = 'z', mods = 'CTRL', action = wezterm.action.TogglePaneZoomState },
  { key = 'UpArrow', mods = 'CTRL|SHIFT', action = wezterm.action.ActivatePaneDirection("Up") },
  { key = 'DownArrow', mods = 'CTRL|SHIFT', action = wezterm.action.ActivatePaneDirection("Down") },
  { key = 'RightArrow', mods = 'CTRL|SHIFT', action = wezterm.action.ActivatePaneDirection("Right") },
  { key = 'LeftArrow', mods = 'CTRL|SHIFT', action = wezterm.action.ActivatePaneDirection("Left") },
}

return config
