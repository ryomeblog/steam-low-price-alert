#!/bin/sh
echo "Starting batch server..."

# Prismaクライアントを生成
npx prisma generate

# テストモードかどうかをチェック
if [ "$TEST_MODE" = "true" ]; then
  echo "🧪 TEST MODE: Running every 10 seconds"
  echo "To switch to production mode, set TEST_MODE=false in docker-compose.yml"
  echo "* * * * * sleep 0 && node /app/index.js" > /etc/crontabs/root
  echo "* * * * * sleep 10 && node /app/index.js" >> /etc/crontabs/root
  echo "* * * * * sleep 20 && node /app/index.js" >> /etc/crontabs/root
  echo "* * * * * sleep 30 && node /app/index.js" >> /etc/crontabs/root
  echo "* * * * * sleep 40 && node /app/index.js" >> /etc/crontabs/root
  echo "* * * * * sleep 50 && node /app/index.js" >> /etc/crontabs/root
  echo "Cron schedule: Every 10 seconds"
  echo ""
  echo "📋 Starting cron daemon..."
  echo "Output will be displayed in console"
  echo ""
  
  # cronデーモンを起動（フォアグラウンドで実行）
  crond -f -l 2
else
  # 本番モード: cronで実行
  echo "🚀 PRODUCTION MODE: Running on cron schedule"
  echo "${CRON_SCHEDULE:-0 3 * * *} node /app/index.js" > /etc/crontabs/root
  echo "Cron schedule: ${CRON_SCHEDULE:-0 3 * * *}"
  echo ""
  echo "📋 Starting cron daemon..."
  echo "Output will be displayed in console"
  echo ""
  
  # cronデーモンを起動（フォアグラウンドで実行）
  crond -f -l 2
fi
