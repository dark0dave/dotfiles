# DotFiles

![](./public/icon/icon.png)

This repo is for linux only. Fuck off windows and macos.

## Setup

Ensure, you have installed:
* [stow](https://www.gnu.org/software/stow/): Which is symlink farm manager
* [git](https://en.wikipedia.org/wiki/git): Is a distributed version-control system for tracking code changes
* [zsh](https://en.wikipedia.org/wiki/Z_shell): More pleasant shell experience
* [zim](https://github.com/zimfw/zimfw): Modular, customizable, and blazing fast Zsh framework
* [jq](https://jqlang.github.io/jq/): A lightweight and flexible command-line json processor
* [curl](https://en.wikipedia.org/wiki/CURL): A useful tool for fetching web content
* [direnv](https://github.com/direnv/direnv/blob/master/README.md): Manage your environment variables by folder
* [powerline](https://github.com/powerline/fonts.git): Powerline fonts
* [helix](https://github.com/helix-editor/helix): A post-modern modal text editor.
* [mise](https://github.com/jdx/mise): A version manager for multiple programming langauges
* [rofi](https://github.com/davatorium/rofi): A better dbus menu
#### Pick one of these
* [ghostty](https://ghostty.org/): is a fast, feature-rich, and cross-platform terminal emulator that uses platform-native UI and GPU acceleration.
* [wezterm](https://github.com/wez/wezterm): A GPU-accelerated cross-platform terminal emulator and multiplexer 
* [kitty](https://github.com/kovidgoyal/kitty): The fast, feature-rich, GPU based terminal emulator
* [foot](https://codeberg.org/dnkl/foot): The fast, lightweight and minimalistic Wayland terminal emulator.
* [alacritty](https://github.com/alacritty/alacritty): A fast, cross-platform, OpenGL terminal emulator

## Emojis

```sh
pacman -S noto-fonts-emoji
```

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

## Installation

You can install one of my dotfiles with:
```sh
stow --adopt --target=$HOME <foldername>
```
Where `<foldername>` is the name of dotfile you'd like to install (alacritty, firefox, mise, python, tmux, wezterm, zim)

Do note for firefox, some more configuration will be required.

```sh
stow --adopt --target=$HOME/.mozilla/firefox/<yourprofile>default-release firefox
```
Fill in `<yourprofile>`. Read about firefox profiles [here](https://support.mozilla.org/en-US/kb/profiles-where-firefox-stores-user-data?redirectslug=Profiles&redirectlocale=en-US).

## Tmux first time startup

* Press a + I (capital I, as in Install) to install the tmux plugin manager
