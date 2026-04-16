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
