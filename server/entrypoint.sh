#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding citations if database is empty..."
node dist/scripts/seed-citations.js

echo "Starting server..."
exec node dist/index.js
