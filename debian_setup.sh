#!/usr/bin/env bash
set -eo pipefail

software() {
  echo "Installing software"
  # Openvpn because we like privacy
  sudo apt-get install openvpn
  # Utilies
  sudo apt-get install zsh tmux vim git curl direnv
  chsh -s /bin/zsh
}

gitSetup() {
  echo "git setup"
  read -p "Enter your username for github: " gitusername
  git config --global user.name $gitusername
  read -p "Enter your email address for github: " gitemail
  git config --global user.email $gitemail
  git config --global core.editor vim
  # ssh keygen ed25519
  ssh-keygen -t ed25519  -C $gitemail -f gitlab
  ssh-add ~/.ssh/gitlab
}

pythonSetup() {
  echo "Python setup"
  sudo apt-get install python python3 python-pip python3-pip
  # Pipenv to make python development bearable
  pip install pipenv
}

main() {
  pythonSetup
  software
  github
}

main
