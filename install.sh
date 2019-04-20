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
  ifDirDoesNotExistRun ${HOME}/.zsh-highlight \
    'git clone https://github.com/zsh-users/zsh-syntax-highlighting'
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
  sed "s|source ${HOME}/.zshrc.local||g" ${HOME}/.zshrc 1>/dev/null \
    && echo "source ${HOME}/.zshrc.local" >> ${HOME}/.zshrc
}

main() {
  setupZsh
  setupTmux
  linkDotFiles
}

main
