# Steam最安値監視システム データベース設計書

## 概要
Steam最安値を記録・監視するためのデータベース設計

## データベース情報
- **データベース名**: steam_price_alert
- **RDBMS**: PostgreSQL 16
- **文字コード**: UTF-8

---

## テーブル定義

### 1. 最安値記録テーブル (lowest_prices)

Steamゲームの最安値情報を記録するテーブル

#### テーブル構造

| カラム名 | データ型 | NULL | デフォルト値 | 制約 | 説明 |
|---------|---------|------|------------|------|------|
| id | UUID | NOT NULL | gen_random_uuid() | PRIMARY KEY | レコードID（自動生成） |
| title | VARCHAR(255) | NOT NULL | - | - | ゲームタイトル |
| steam_url | TEXT | NOT NULL | - | UNIQUE | Steam商品ページURL |
| lowest_price | INTEGER | NOT NULL | - | CHECK (lowest_price >= 0) | 最安値（円、整数のみ） |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | - | 登録日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | - | 更新日時 |

#### インデックス
- PRIMARY KEY: `id`
- UNIQUE INDEX: `steam_url` (重複登録防止)
- INDEX: `created_at` (作成日時での検索用)

#### 制約
1. **主キー制約**: id（UUID）
2. **NOT NULL制約**: id, title, steam_url, lowest_price, created_at, updated_at
3. **UNIQUE制約**: steam_url（同一ゲームの重複登録を防止）
4. **CHECK制約**: lowest_price >= 0（負の値を防止）

#### トリガー
- `update_updated_at_trigger`: updated_atカラムを自動更新

---

## データ例

```sql
-- サンプルデータ
INSERT INTO lowest_prices (title, steam_url, lowest_price)
VALUES
  (
    'Elden Ring',
    'https://store.steampowered.com/app/1245620/ELDEN_RING/',
    4980.00
  );
```

---

## 備考

### UUID生成について
- PostgreSQL 13以降の`gen_random_uuid()`関数を使用
- 自動的にUUIDv4を生成

### 価格データ型について
- INTEGERを使用し、整数のみを保存
- 最大2,147,483,647円まで対応
- 小数点以下の値は入力不可

### タイムスタンプについて
- created_at: レコード作成時に自動設定
- updated_at: レコード更新時に自動更新（トリガーで実装）

### 今後の拡張性
1. 価格履歴テーブルの追加
2. 通知設定テーブルの追加
3. ユーザー管理機能の追加

---

**作成日**: 2026-01-07  
**バージョン**: 1.0
