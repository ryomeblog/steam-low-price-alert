# Steam価格監視バッチサーバ

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.example`を参考に`.env`ファイルを作成してください。

```bash
# .envファイルを作成
cp .env.example .env
```

`.env`ファイルの`DATABASE_URL`を実際のデータベース接続情報に更新してください。

### 3. Prismaクライアントの生成
```bash
npx prisma generate
```

## 実行方法

### データベースのlowest_pricesテーブルを表示
```bash
npm start
```

または

```bash
node index.js
```

## 必要な環境変数

- `DATABASE_URL`: PostgreSQLデータベースの接続URL
  - 例: `postgresql://postgres:postgres@localhost:5432/postgres`
