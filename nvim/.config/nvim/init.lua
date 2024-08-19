vim.g.base46_cache = vim.fn.stdpath "data" .. "/nvchad/base46/"
vim.g.mapleader = " "
vim.g.maplocalleader = "//"

-- vim options
-- allow file creation
vim.opt.modifiable = true
vim.opt.buftype = ""
vim.opt.readonly = false
vim.opt.modified = true
-- tab
vim.opt.smarttab = true
vim.opt.softtabstop = 2
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = true
-- line numbers
vim.opt.number = true
-- Show spaces
vim.opt.list = true
vim.opt.listchars = { space = '•', tab = '→ ' }
-- enable 24-bit colour
vim.opt.termguicolors = true
-- copy paste to clipboard
vim.opt.clipboard = "unnamedplus"
-- wrap
vim.opt.textwidth = 80

-- bootstrap lazy and all plugins
local lazypath = vim.fn.stdpath "data" .. "/lazy/lazy.nvim"

if not vim.uv.fs_stat(lazypath) then
  local repo = "https://github.com/folke/lazy.nvim.git"
  vim.fn.system { "git", "clone", "--filter=blob:none", repo, "--branch=stable", lazypath }
end

vim.opt.rtp:prepend(lazypath)

local lazy_config = require "configs.lazy"

-- load plugins
require("lazy").setup({
  spec = {
    -- import your plugins
    { import = "plugins" },
  },
}, lazy_config)

-- load theme
dofile(vim.g.base46_cache .. "defaults")
dofile(vim.g.base46_cache .. "statusline")

vim.schedule(function()
  require "mappings"
end)

