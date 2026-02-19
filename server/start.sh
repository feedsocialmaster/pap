#!/bin/sh
echo "Resolving failed migration..."
npx prisma migrate resolve --rolled-back 20260207_expand_order_statuses || true

echo "Running migrations..."
npm run db:deploy

echo "Starting server..."
npm start
