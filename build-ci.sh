#!/usr/bin/env bash
set -e

app=$1

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

yarn turbo prune --docker --scope=@poktscan/$app

echo "copying packages/nodejs/graphql to out/full"
cp -R packages/nodejs/graphql out/full/packages/nodejs

FILE=out/json/packages/nodejs/graphql/package.json
if [ ! -f "$FILE" ]; then
    echo "removing packages/nodejs/graphql/package.json"
    rm out/full/packages/nodejs/graphql/package.json
fi
