#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$( dirname "$0" );

backUpAndLink() {
  date=$(date +%s)
  echo "Linking $2 to $1 with date: $date"
  [[ -f ${1} ]] && mv "${1}" "${1}"."${date}"
  [[ -h ${1} ]] && rm "${1}"
  ln -s "${2}" "${1}"
}

checkForBinaries() {
  which zsh git curl vim tmux >/dev/null  || echo "Missing binaries"
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
    backUpAndLink "${HOME}/${file}" "${dotFilesFolder}/${file}"
  done
  sed -i "s|source ${HOME}/.zshrc.local||g" "${HOME}"/.zshrc 1>/dev/null \
    && echo "source ${HOME}/.zshrc.local" >> "${HOME}"/.zshrc
}

main() {
  checkForBinaries
  setupZsh
  setupTmux
  linkDotFiles
}

main
