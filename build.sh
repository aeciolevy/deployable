#!/usr/bin/env bash

cd client
./node_modules/.bin/webpack --config webpack.production.config.js
cp ./dist/bundle.js ../server/public
cp ./dist/bundle.js.map ../server/public
