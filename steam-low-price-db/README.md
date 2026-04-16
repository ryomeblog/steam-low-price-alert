# Steam最安値監視システム - データベース

このディレクトリには、Steam最安値監視システムのデータベース設計ドキュメントとSQLスクリプトが含まれています。

## ディレクトリ構成

```
steam-low-price-db/
├── doc/                          # ドキュメント
│   └── database_design.md        # データベース設計書
├── sql/                          # SQLスクリプト
│   ├── 01_create_tables.sql      # テーブル作成DDL
│   └── 02_insert_sample_data.sql # サンプルデータINSERT
└── README.md                     # このファイル
```

## データベース概要

- **データベース名**: `steam_price_alert`
- **RDBMS**: PostgreSQL 16
- **文字コード**: UTF-8

## テーブル一覧

### lowest_prices（最安値記録テーブル）

Steamゲームの最安値情報を記録するテーブル

| カラム名 | データ型 | NULL | 説明 |
|---------|---------|------|------|
| id | UUID | NOT NULL | レコードID（自動生成） |
| title | VARCHAR(255) | NOT NULL | ゲームタイトル |
| steam_url | TEXT | NOT NULL | Steam商品ページURL（UNIQUE） |
| lowest_price | INTEGER | NOT NULL | 最安値（円、整数のみ） |
| created_at | TIMESTAMP | NOT NULL | 登録日時 |
| updated_at | TIMESTAMP | NOT NULL | 更新日時 |

## セットアップ方法

### Docker Composeでの自動セットアップ

Docker Composeを使用すると、SQLスクリプトが自動的に実行されます。

```bash
# すべてのサービスを起動（初回起動時にテーブルが自動作成される）
docker-compose up -d

# データベースの状態を確認
docker-compose exec postgres psql -U postgres -d steam_price_alert -c "\dt"
```

### 手動セットアップ

手動でSQLを実行する場合：

```bash
# PostgreSQLコンテナに接続
docker-compose exec postgres psql -U postgres -d steam_price_alert

# SQLファイルを実行
\i /docker-entrypoint-initdb.d/01_create_tables.sql
\i /docker-entrypoint-initdb.d/02_insert_sample_data.sql

# テーブル確認
\dt

# データ確認
SELECT * FROM lowest_prices;

# 終了
\q
```

## データベース接続情報

### Docker内からの接続

```
Host: postgres
Port: 5432
Database: steam_price_alert
User: postgres
Password: postgres
```

### ローカルからの接続（Docker外）

```
Host: localhost
Port: 5432
Database: steam_price_alert
User: postgres
Password: postgres
```

### 接続URL（Prisma/Node.js用）

```
postgresql://postgres:postgres@postgres:5432/steam_price_alert
```

## 注意事項

1. **UUIDの生成**: PostgreSQL 13以降の`gen_random_uuid()`を使用
2. **自動更新**: `updated_at`カラムはトリガーで自動更新されます
3. **重複防止**: `steam_url`カラムにUNIQUE制約があります
4. **価格精度**: 整数のみ対応（INTEGER型）- 小数点以下は入力不可

## ドキュメント

詳細な設計情報は [`doc/database_design.md`](doc/database_design.md) を参照してください。
