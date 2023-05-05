#!/usr/bin/env bash

echo "checking .env file"
if [ -f .env ]
then
  echo "loading .env file"
  # https://gist.github.com/judy2k/7656bfe3b322d669ef75364a46327836?permalink_comment_id=3632918#gistcomment-3632918
  set -o allexport
  eval $(cat '.env' | sed -e '/^#/d;/^\s*$/d' -e 's/\(\w*\)[ \t]*=[ \t]*\(.*\)/\1=\2/' -e "s/=['\"]\(.*\)['\"]/=\1/g" -e "s/'/'\\\''/g" -e "s/=\(.*\)/='\1'/g")
  set +o allexport
  echo ".env file loaded"
fi

app=$1

rm -rf out

./build-ci.sh $app

./apps/nodejs/${app}/build.sh $app

rm -rf out
