#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$( dirname $(readlink -f "$0") );


checkForBinaries() {
  which zsh git curl tmux >/dev/null  || echo "Missing binaries"
}

setupPowerline() {
  git clone https://github.com/powerline/fonts.git --depth=1
  ./fonts/install.sh
  rm -rf ./fonts
}

setupZsh() {
  if [ ! -d ${HOME}/.zim ]; then
    curl -fsSL https://raw.githubusercontent.com/zimfw/install/master/install.zsh | zsh
  fi
}

setupTmux() {
  if [ ! -d "${HOME}/.tmux/plugins/tpm" ]; then 
    git clone https://github.com/tmux-plugins/tpm "${HOME}/.tmux/plugins/tpm"
  fi
}

linkDotFiles() {
  local dotFilesFolder=${SCRIPT_DIR}/dotFiles
  local -r dotFilesToInstall=$(find "${dotFilesFolder}" -name ".*" -type f -printf "%f\n")
  for file in ${dotFilesToInstall}; do
    echo "Copying ${dotFilesFolder}/${file} to ${HOME}/${file}"
    cp "${dotFilesFolder}/${file}" "${HOME}/${file}"
  done
  sed -i "s|source ${HOME}/.zshrc.local||g" "${HOME}"/.zshrc 1>/dev/null \
    && echo "source ${HOME}/.zshrc.local" >> "${HOME}"/.zshrc
}

main() {
  checkForBinaries
  setupPowerline
  setupZsh
  setupTmux
  linkDotFiles
}

main
