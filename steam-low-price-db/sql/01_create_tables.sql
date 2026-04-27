-- ============================================
-- Steam最安値監視システム DDL
-- テーブル作成スクリプト
-- ============================================

-- データベース: steam_price_alert
-- 作成日: 2026-01-07
-- バージョン: 1.0

-- ============================================
-- 1. 最安値記録テーブル作成
-- ============================================

-- テーブル削除（既存の場合）
DROP TABLE IF EXISTS game_folders CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS lowest_prices CASCADE;

-- 最安値記録テーブル
CREATE TABLE lowest_prices (
    -- プライマリキー（UUID自動生成）
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ゲーム情報
    title VARCHAR(255) NOT NULL,
    steam_url TEXT NOT NULL UNIQUE,
    
    -- 価格情報
    lowest_price INTEGER NOT NULL CHECK (lowest_price >= 0),
    
    -- タイムスタンプ
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. インデックス作成
-- ============================================

-- 作成日時での検索用インデックス
CREATE INDEX idx_lowest_prices_created_at ON lowest_prices(created_at);

-- タイトル検索用インデックス
CREATE INDEX idx_lowest_prices_title ON lowest_prices(title);

-- ============================================
-- 3. テーブルコメント追加
-- ============================================

COMMENT ON TABLE lowest_prices IS 'Steam最安値記録テーブル';
COMMENT ON COLUMN lowest_prices.id IS 'レコードID（UUID自動生成）';
COMMENT ON COLUMN lowest_prices.title IS 'ゲームタイトル';
COMMENT ON COLUMN lowest_prices.steam_url IS 'Steam商品ページURL（重複不可）';
COMMENT ON COLUMN lowest_prices.lowest_price IS '最安値（円、小数点以下2桁）';
COMMENT ON COLUMN lowest_prices.created_at IS 'レコード登録日時';
COMMENT ON COLUMN lowest_prices.updated_at IS 'レコード更新日時';

-- ============================================
-- 4. フォルダテーブル作成（ゲーム分類用ラベル）
-- ============================================

CREATE TABLE folders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(7)   NOT NULL,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_folders_sort_order ON folders(sort_order);

COMMENT ON TABLE folders IS 'ゲーム分類用フォルダ（ラベル）テーブル';
COMMENT ON COLUMN folders.id IS 'フォルダID（UUID自動生成）';
COMMENT ON COLUMN folders.name IS 'フォルダ名';
COMMENT ON COLUMN folders.color IS '表示色（#RRGGBB形式のHEXカラー）';
COMMENT ON COLUMN folders.sort_order IS 'サイドバー表示順';
COMMENT ON COLUMN folders.created_at IS 'レコード登録日時';
COMMENT ON COLUMN folders.updated_at IS 'レコード更新日時';

-- ============================================
-- 5. ゲーム-フォルダ中間テーブル作成（多対多）
-- ============================================

CREATE TABLE game_folders (
    game_id    UUID      NOT NULL REFERENCES lowest_prices(id) ON DELETE CASCADE,
    folder_id  UUID      NOT NULL REFERENCES folders(id)       ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (game_id, folder_id)
);

CREATE INDEX idx_game_folders_folder_id ON game_folders(folder_id);

COMMENT ON TABLE game_folders IS 'ゲームとフォルダの多対多中間テーブル';
COMMENT ON COLUMN game_folders.game_id IS 'ゲームID（lowest_prices.id）';
COMMENT ON COLUMN game_folders.folder_id IS 'フォルダID（folders.id）';
COMMENT ON COLUMN game_folders.created_at IS '紐付け登録日時';
