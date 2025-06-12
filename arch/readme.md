# Arch packages

## Export
### put all explicitly installed packages (minus AUR) into a file
### can be run as user
rm -f ~/projects/dotfiles/arch/packages && pacman -Qqe | grep -Fvx "$(pacman -Qqm)" > ~/projects/dotfiles/arch/packages

## Import
### reinstall from said file (deps will be pulled in automatically)
### must run as root
xargs pacman -S --needed --noconfirm < packages
