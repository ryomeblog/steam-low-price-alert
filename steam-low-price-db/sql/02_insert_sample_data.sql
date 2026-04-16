-- ============================================
-- Steam最安値監視システム
-- サンプルデータINSERTスクリプト
-- ============================================

-- 作成日: 2026-01-07
-- バージョン: 1.0

-- ============================================
-- 既存サンプルデータ削除
-- ============================================

-- サンプルデータのみ削除（URLで識別）
DELETE FROM lowest_prices WHERE steam_url IN (
    'https://store.steampowered.com/app/1245620/ELDEN_RING/',
    'https://store.steampowered.com/app/1091500/Cyberpunk_2077/',
    'https://store.steampowered.com/app/1332010/Stray/',
    'https://store.steampowered.com/app/1145360/Hades/'
);

-- ============================================
-- サンプルデータ投入
-- ============================================

-- 1. ELDEN RING
INSERT INTO lowest_prices (title, steam_url, lowest_price)
VALUES (
    'ELDEN RING',
    'https://store.steampowered.com/app/1245620/ELDEN_RING/',
    4980
);

-- 2. Cyberpunk 2077
INSERT INTO lowest_prices (title, steam_url, lowest_price)
VALUES (
    'Cyberpunk 2077',
    'https://store.steampowered.com/app/1091500/Cyberpunk_2077/',
    3980
);

-- 3. Stray
INSERT INTO lowest_prices (title, steam_url, lowest_price)
VALUES (
    'Stray',
    'https://store.steampowered.com/app/1332010/Stray/',
    2980
);

-- 4. Hades
INSERT INTO lowest_prices (title, steam_url, lowest_price)
VALUES (
    'Hades',
    'https://store.steampowered.com/app/1145360/Hades/',
    2050
);

-- ============================================
-- データ確認用SELECT
-- ============================================

SELECT 
    id,
    title,
    lowest_price,
    created_at
FROM lowest_prices
ORDER BY created_at;
