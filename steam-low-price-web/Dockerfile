# Node.js 20 LTS Alpine
FROM node:20-alpine

# 作業ディレクトリの設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# Prismaクライアントのインストール
RUN npm install @prisma/client prisma

# アプリケーションファイルをコピー
COPY . .

# Prismaのスキーマファイルを確認
RUN ls -la prisma/

# ポート3000を公開
EXPOSE 3000

# 開発サーバーの起動（docker-compose.ymlのcommandでオーバーライドされる）
CMD ["npm", "run", "dev"]
