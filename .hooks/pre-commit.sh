#!/bin/sh

if [ $(git diff --cached --name-status | grep "nereid.js" -c) -ne 0 ]
then
  echo "Minifying nereid.js"
  grunt uglify
  git add nereid.min.js
fi
