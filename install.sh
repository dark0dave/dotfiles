#!/usr/bin/env bash
set -eo pipefail
source ${HOME}/.myDotFiles/util.sh

setupPowerline() {
  git clone https://github.com/powerline/fonts.git --depth=1
  ./fonts/install.sh
  rm -rf ./fonts
}

setupZsh() {
  [[ ! -d ${HOME}/.oh-my-zsh ]] && \
    bash -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
  ifDirDoesNotExistRun ${HOME}/.fast-syntax-highlighting \
    'git clone https://github.com/zdharma/fast-syntax-highlighting'
  ifDirDoesNotExistRun ${HOME}/.zsh-autosuggestions \
    'git clone https://github.com/zsh-users/zsh-autosuggestions'
}

setupTmux() {
  ifDirDoesNotExistRun ${HOME}/.tmux/plugins/tpm \
    'git clone https://github.com/tmux-plugins/tpm'
}

linkDotFiles() {
  dotFilesFolder=${HOME}/.myDotFiles/dotFiles
  for file in $(cd ${dotFilesFolder} && ls .*); do
    backUpAndLink ${HOME}/${file} ${dotFilesFolder}/${file};
  done
  sed -i "s|source ${HOME}/.zshrc.local||g" ${HOME}/.zshrc 1>/dev/null \
    && echo "source ${HOME}/.zshrc.local" >> ${HOME}/.zshrc
}

setupVim() {
  vundleLocation=${HOME}/.vim/bundle/Vundle.vim
  [[ ! -d ${vundleLocation} ]] && \
    git clone https://github.com/VundleVim/Vundle.vim.git ${vundleLocation}
  vim +PluginInstall +qall
}

main() {
  setupZsh
  setupTmux
  linkDotFiles
  setupVim
}

main
