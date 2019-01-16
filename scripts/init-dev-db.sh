#!/bin/bash
# Simple script to drop and re-initialize the database schema
set -e

echo "** Initializing dev and test DBs..."

dropdb -h localhost -p 7200 -U postgres ${DBNAME:-forro} || true >/dev/null
psql -h localhost -p 7200 -U postgres -c "CREATE DATABASE ${DBNAME:-forro}" >/dev/null
psql -h localhost -p 7200 -U postgres --set=dbname=${DBNAME:-forro} --set=user_migration=forro_migration --set=user_app=forro_app -f ../sql/create-users.sql >/dev/null
psql -h localhost -p 7200 -U postgres <<EOF > /dev/null
ALTER USER forro_migration PASSWORD 'asdf1234';
ALTER USER forro_app PASSWORD 'asdf1234';
EOF

psql -h localhost -p 7200 -U forro_migration --set=user_app=forro_app -f ../sql/create-tables.sql ${DBNAME:-forro} >/dev/null
psql -h localhost -p 7200 -U forro_migration --set=user_app=forro_app -f ../sql/populate-tables.sql ${DBNAME:-forro} >/dev/null

echo "** DB re-initialized!"
