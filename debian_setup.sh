#!/usr/bin/env bash
set -eo pipefail

software() {
  echo "Installing software"
  # Update apt
  apt-get update && apt-get -y upgrade
  # Utilies
  apt-get install git zsh tmux vim git curl direnv openvpn -y
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
  apt-get install python python3.7 python-setuptools python-pip -y
  # Pipenv to make python development bearable
  pip install pipenv
}

main() {
  software
  pythonSetup
}

main
