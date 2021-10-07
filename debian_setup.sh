#!/usr/bin/env bash
set -eo pipefail

software() {
  echo "Installing software"
  # Update apt
  apt-get update -qqq
  apt-get -qqqy upgrade
  # Utilies
  apt-get install git zsh tmux vim git curl direnv openvpn -qqqy >/dev/null
  chsh -s /bin/zsh
}

gitSetup() {
  echo "git setup"
  read -p "Enter your username for gitlab: " gitusername
  git config --global user.name $gitusername
  read -p "Enter your email address for gitlab: " gitemail
  git config --global user.email $gitemail
  # ssh keygen ed25519
  ssh-keygen -t ed25519  -C $gitemail -f gitlab
  ssh-add ~/.ssh/gitlab
}

pythonSetup() {
  echo "Python setup, with pyenv";
  apt-get -yqqq install make build-essential libssl-dev zlib1g-dev \
    libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
    libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev \
    > /dev/null;
  echo "Installing pyenv";
  git clone https://github.com/pyenv/pyenv.git ${HOME}/.pyenv
}

main() {
  software
  pythonSetup
}

main
