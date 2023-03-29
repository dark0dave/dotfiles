#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR=$( dirname "$0" );
source ${SCRIPT_DIR}/util.sh

setupPowerline() {
  git clone https://github.com/powerline/fonts.git --depth=1
  ./fonts/install.sh
  rm -rf ./fonts
}

setupZsh() {
  [[ ! -d ${HOME}/.zim ]] && \
    curl -fsSL https://raw.githubusercontent.com/zimfw/install/master/install.zsh | zsh
}

setupTmux() {
  ifDirDoesNotExistRun ${HOME}/.tmux/plugins/tpm \
    'git clone https://github.com/tmux-plugins/tpm'
}

linkDotFiles() {
  local dotFilesFolder=${SCRIPT_DIR}/dotFiles
  for file in $(ls -A ${dotFilesFolder}/. | awk -F "/" '{print $NF}' ); do
    backUpAndLink "${HOME}/${file}" "${dotFilesFolder}/${file}"
  done
  sed -i "s|source ${HOME}/.zshrc.local||g" ${HOME}/.zshrc 1>/dev/null \
    && echo "source ${HOME}/.zshrc.local" >> ${HOME}/.zshrc
}

setupVim() {
  local vundleLocation=${HOME}/.vim/bundle/Vundle.vim
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
