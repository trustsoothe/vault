#!/bin/sh

set -e

export TERM=xterm-256color

warning_log() {
  printf "\033[1;33m[WARN]\033[0m $1\n"
}

error_log() {
  printf "\033[1;31m[ERROR]\033[0m $1\n"
}

info_log() {
  printf "\033[1;32m[INFO]\033[0m $1\n"
}

success_log() {
  printf "\033[1;32m[SUCCESS]\033[0m $1\n"
}
