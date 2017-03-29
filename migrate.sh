#!/usr/bin/env bash

cd server
npm run knex migrate:latest
