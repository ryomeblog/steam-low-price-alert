# Steam 最安値監視システム

Steam ストアの指定ゲームを定期的にクロールし、**登録済みの最安値を下回った場合に LINE で通知する** システムです。
Web 画面でゲームを登録・編集し、バッチサーバが日次で価格をチェックします。

---

## 構成

本プロジェクトは 3 つのサービスと 1 つの DB からなる Docker Compose 構成です。

```
steam-low-price-alert/
├── docker-compose.yml         # 全サービスの起動定義
├── steam-low-price-web/       # Next.js 製の管理Webアプリ（CRUD UI）
├── steam-low-price-batch/     # Node.js 製の価格チェックバッチ（cron）
└── steam-low-price-db/        # DB設計ドキュメント・SQLスクリプト
```

### サービス一覧

| サービス | 役割 | 技術スタック | ポート |
|---------|------|-------------|--------|
| `postgres` | ゲーム情報・最安値の永続化 | PostgreSQL 16 (Alpine) | 5432 (内部) |
| `web` | ゲーム登録・編集・削除 UI | Next.js 16 / React 19 / Tailwind CSS 4 / Prisma 7 | `13000` → `3000` |
| `batch` | Steam 価格スクレイピング & LINE 通知 | Node.js / Prisma 7 / node-fetch / crond | — |

---

## アーキテクチャ

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   ユーザー    │──────▶│  Web (Next) │──────▶│  PostgreSQL  │
│  (ブラウザ)   │  CRUD │  :13000      │       │  lowest_prices│
└──────────────┘       └──────────────┘       └──────────────┘
                                                      ▲
                                                      │ 参照・更新
                                                      │
                              ┌───────────────────────┴────────────────┐
                              │  Batch (crond + Node.js)               │
                              │  毎日 03:00 (JST)                       │
                              │  1. DB から監視対象ゲームを取得         │
                              │  2. Steam ページから現在価格を取得      │
                              │  3. 記録より安ければ DB を更新 & 通知   │
                              └───────────────────────┬────────────────┘
                                                      │ push
                                                      ▼
                                               ┌──────────────┐
                                               │  LINE API    │
                                               └──────────────┘
```

---

## データモデル

`lowest_prices` テーブル（PostgreSQL 16）

| カラム | 型 | 説明 |
|--------|----|------|
| `id` | UUID | 主キー（`gen_random_uuid()` で自動生成） |
| `title` | VARCHAR(255) | ゲームタイトル |
| `steam_url` | TEXT UNIQUE | Steam 商品ページ URL（重複登録防止） |
| `lowest_price` | INTEGER | 最安値（円、整数） |
| `created_at` | TIMESTAMP | 登録日時 |
| `updated_at` | TIMESTAMP | 更新日時（トリガーで自動更新） |

詳細は [`steam-low-price-db/doc/database_design.md`](steam-low-price-db/doc/database_design.md) を参照。

---

## セットアップ

### 前提条件
- Docker / Docker Compose
- LINE Messaging API チャネル（通知を使う場合）

### 1. リポジトリ取得

```bash
git clone <このリポジトリ>
cd steam-low-price-alert
```

### 2. 環境変数の設定

`docker-compose.yml` の `batch` サービス内にある以下を書き換えます。

```yaml
- LINE_ACCESS_TOKEN=[LINE ACCESS TOKEN]   # 実トークンに置換
- TEST_MODE=false                         # true にすると10秒おきに実行
- CRON_SCHEDULE=0 3 * * *                 # 本番実行時刻（JST 03:00）
```

通知先の LINE ユーザー ID は [`steam-low-price-batch/setting.json`](steam-low-price-batch/setting.json) に配列で記入します。

```json
{ "userIds": ["Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"] }
```

### 3. 起動

```bash
docker-compose up -d
```

初回起動時に以下が自動で実行されます。
- PostgreSQL コンテナの作成
- Web コンテナで `prisma generate` と `prisma db push`（スキーマ反映）
- Batch コンテナで cron デーモン起動

### 4. 動作確認

- 管理画面: <http://localhost:13000>
- DB 接続:
  ```bash
  docker-compose exec postgres psql -U postgres -d postgres -c "\dt"
  ```

---

## 使い方

### ゲームを登録する
1. <http://localhost:13000> を開く
2. 「**+ 新規登録**」をクリック
3. タイトル / Steam URL / 現在の基準価格（円）を入力して登録

### バッチの動作
- **本番モード** (`TEST_MODE=false`): `CRON_SCHEDULE` に従って実行（デフォルト毎日 03:00 JST）
- **テストモード** (`TEST_MODE=true`): 10 秒おきに実行
- 現在価格が DB 記録より **安い場合のみ**、DB を更新し LINE 通知を送信

### 手動実行（デバッグ用）

```bash
docker-compose exec batch node /app/index.js
```

---

## 各サブプロジェクトの詳細

- **Web 管理画面**: [`steam-low-price-web/README.md`](steam-low-price-web/README.md)
- **バッチサーバ**: [`steam-low-price-batch/README.md`](steam-low-price-batch/README.md)
- **データベース設計**: [`steam-low-price-db/README.md`](steam-low-price-db/README.md)

---

## 主な依存関係

| プロジェクト | 主要ライブラリ |
|-------------|---------------|
| web | `next@16`, `react@19`, `@prisma/client@7`, `tailwindcss@4` |
| batch | `@prisma/client@7`, `node-fetch@3`, `pg@8`, `dotenv` |

---

## 注意事項

- Steam のスクレイピングは HTML パターンマッチで実装されており、Steam 側のマークアップ変更で壊れる可能性があります。
- 価格取得は年齢確認回避のため `birthtime=0; mature_content=1` Cookie を送信しています。
- Steam への連続アクセスを避けるため、各リクエスト間に 2 秒の待機を入れています。
- 価格は **整数（円）のみ** 対応です（小数点なし）。
