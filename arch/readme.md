# Arch packages

## Export
rm -f ~/projects/dotfiles/arch/packages && aura -Qqe | grep -Fvx "$(aura -Qqm)" | sort -u > ~/projects/dotfiles/arch/packages

## Import
xargs sudo aura -S --needed --noconfirm < packages

## Aur packages

## Export
rm -f ~/projects/dotfiles/arch/aur_packages && aura -Qqm > ~/projects/dotfiles/arch/aur_packages

## Import
aura -A -yu < arch/aur_packages
