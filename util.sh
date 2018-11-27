#!/usr/bin/env bash
set -eo pipefail

backUpAndLink() {
  date=$(date +%s)
  [[ -f ${1} ]] && mv ${1} ${1}.${date}
  [[ -h ${1} ]] && rm ${1}
  ln -s ${2} ${1}
}

ifDirDoesNotExistRun() {
  [[ -d ${1} ]] || bash -c "${2} ${1}"
}
