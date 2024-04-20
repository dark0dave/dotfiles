# DotFiles

![](public/icon/icon.png)

This repo is for macos and linux only.

## Setup

Ensure, you have installed:
* (stow)[https://www.gnu.org/software/stow/]: Which is symlink farm manager
* [git](https://en.wikipedia.org/wiki/git): Is a distributed version-control system for tracking code changes
* [zsh](https://en.wikipedia.org/wiki/Z_shell): More pleasant shell experience
* [zim](https://github.com/zimfw/zimfw): Modular, customizable, and blazing fast Zsh framework 
* [curl](https://en.wikipedia.org/wiki/CURL): A useful tool for fetching web content
* [direnv](https://github.com/direnv/direnv/blob/master/README.md): Manage your environment variables by folder
* [powerline](https://github.com/powerline/fonts.git): Powerline fonts
* [helix](https://github.com/helix-editor/helix): A post-modern modal text editor.
* [tmux](https://en.wikipedia.org/wiki/Tmux): A multi-window terminal emulator
* [tpm](https://github.com/tmux-plugins/tpm): Tmux package manager
* [mise](https://github.com/jdx/mise): A version manager for multiple programming langauges
* [wezterm](https://github.com/wez/wezterm): A GPU-accelerated cross-platform terminal emulator and multiplexer 

Clone with:

```sh
git clone https://github.com:dark0dave/dotFiles.git
```

or use a mirror:
```sh
git clone https://gitlab.com:dark0dave/dotFiles.git
```

or another mirror
```sh
git clone https://git.sr.ht/~dark0dave/dotfiles
```

To install my dotfiles, use stow:
```sh
stow --target=$HOME */
```

## Tmux first time startup

* Press a + I (capital I, as in Install) to install the tmux plugin manager
