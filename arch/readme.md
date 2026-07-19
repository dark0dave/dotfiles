# Arch packages

## Export
rm -f ~/projects/dotfiles/arch/packages && pacman -Qqe | grep -Fvx "$(pacman -Qqm)" > ~/projects/dotfiles/arch/packages

## Import
xargs sudo pacman -S --needed --noconfirm < packages

## Aur packages

## Export
rm -f ~/projects/dotfiles/arch/aur_packages && pacman -Qm | awk '{print $1}' > arch/aur_packages

## Import
aura -A -yu < arch/aur_packages
