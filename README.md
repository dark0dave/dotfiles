# myDotFiles

My Dot files, for zsh. tmux and vim

## tmux

Remmeber to install tmux plugin manager

```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

Press prefix + I (capital I, as in Install) to install new plugins.

## zsh

Remmeber to install zsh, oh-my-zsh, powerline fonts and direnv

powerline fonts
```bash
# clone
git clone https://github.com/powerline/fonts.git --depth=1
# install
cd fonts
./install.sh
# clean-up a bit
cd ..
rm -rf fonts
```

And zsh-autosuggestions
```bash
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.zsh-highlight
```
And zsh-highlight
```bash
git clone git://github.com/zsh-users/zsh-autosuggestions ~/.zsh-autosuggestions
```
