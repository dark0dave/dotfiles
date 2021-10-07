set nocompatible              " be iMproved, required
filetype off                  " required
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

Plugin 'dracula/dracula-theme'

Plugin 'Xuyuanp/nerdtree-git-plugin'

Plugin 'tpope/vim-sensible'
Plugin 'airblade/vim-gitgutter'

Plugin 'valloric/youcompleteme'

call vundle#end()            " required
filetype plugin indent on    " required

set updatetime=100
set tabstop=2
set shiftwidth=2
set expandtab
retab
set number
highlight LineNr term=bold cterm=NONE ctermfg=DarkGrey ctermbg=NONE gui=NONE guifg=DarkGrey guibg=NONE
highlight CursorLine cterm=NONE ctermbg=NONE ctermfg=NONE guibg=NONE guifg=NONE
set cursorline
hi CursorLineNr guifg=#050506

let g:gitgutter_terminal_reports_focus=1
let g:gitgutter_buffer_enable=1
let g:gitgutter_highlight_lines = 1
let g:gitgutter_enabled = 1

autocmd StdinReadPre * let s:std_in=1
