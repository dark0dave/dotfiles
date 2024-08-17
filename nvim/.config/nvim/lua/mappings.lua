require "nvchad.mappings"

local api = require('nvim-tree.api')
local map = vim.keymap.set

local function opts(desc)
  return {
    desc = 'nvim-tree: ' .. desc,
    buffer = bufnr,
    noremap = true,
    silent = true,
    nowait = true
  }
end

map("n", ";", ":", { desc = "CMD enter command mode" })
map("i", "jk", "<ESC>")
map("n", "=", api.tree.change_root_to_node, opts('CD'))

