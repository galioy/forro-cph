#!/bin/bash

docker build -f Dockerfile_prod \
  --build-arg DATABASE_URL=$DATABASE_URL \
  --build-arg PG_APP_USERNAME=$PG_APP_USERNAME \
  --build-arg PG_APP_PASSWORD=$PG_APP_PASSWORD \
  --build-arg PG_HOST=$PG_HOST \
  --build-arg PG_DBNAME=$PG_DBNAME \
  --build-arg REDIS_URL=$REDIS_URL \
  --build-arg LOGDNA_KEY=$LOGDNA_KEY \
  --build-arg AUTH_SECRET=$AUTH_SECRET \
  --build-arg FIREBASE_API_KEY=$FIREBASE_API_KEY \
  --build-arg FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN \
  --build-arg FIREBASE_DATABASE_URL=$FIREBASE_DATABASE_URL \
  --build-arg FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID \
  --build-arg FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET \
  --build-arg FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID \
  -t registry.heroku.com/forro-service:latest .
