# Node.js 20 LTS Alpine
FROM node:20-alpine

# cronのインストール
RUN apk add --no-cache dcron

# 作業ディレクトリの設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# アプリケーションファイルをコピー
COPY . .

# start.shに実行権限を付与
RUN chmod +x /app/start.sh

# 起動スクリプトを実行
CMD ["sh", "/app/start.sh"]
