#!/usr/bin/env bash

root=$PWD

yarn install

# Make mono repo imports work
cd $root/packages/data && yarn link
cd $root/packages/shared && yarn link
cd $root/packages/data-adapter && yarn link
cd $root/packages/engine && yarn link

cd $root/packages/engine && yarn link data
cd $root/packages/engine && yarn link shared

cd $root/packages/server && yarn link engine
cd $root/packages/server && yarn link shared

cd $root/packages/client && yarn link engine
cd $root/packages/client && yarn link data 
cd $root/packages/client && yarn link shared


