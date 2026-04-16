import fetch from "node-fetch";
import { prisma } from "./lib/prisma.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SteamのURLから価格情報を取得
async function getSteamPrice(url) {
  try {
    // HTMLを取得（年齢確認をスキップするためのCookie設定）
    const response = await fetch(url, {
      headers: {
        Cookie: "birthtime=0; mature_content=1",
      },
    });
    const html = await response.text();

    // 複数の価格パターンに対応
    // パターン1: <div class="game_purchase_price price" ...>¥ 1,700</div>
    let priceMatch = html.match(
      /<div class="game_purchase_price price"[^>]*>\s*([^<]+)<\/div>/
    );

    // パターン2: discount_final_price (セール時など)
    if (!priceMatch) {
      priceMatch = html.match(
        /<div class="discount_final_price"[^>]*>\s*([^<]+)<\/div>/
      );
    }

    if (!(priceMatch && priceMatch[1])) {
      console.log("価格情報が見つかりませんでした");
      // デバッグ: game_purchase_action部分を抽出して表示
      const purchaseSection = html.match(
        /<div class="game_purchase_action">[\s\S]{0,500}/
      );
      if (purchaseSection) {
        console.log("取得したHTML部分:", purchaseSection[0]);
      }
      return null;
    }
    
    const price = priceMatch[1].trim();
    // 数字とカンマのみを抽出してカンマを削除
    const numericPrice = price.replace(/[^\d,]/g, "").replace(/,/g, "");
    console.log(numericPrice);
    return numericPrice;
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return null;
  }
}

// setting.jsonを読み込む
function loadSettings() {
  try {
    const settingPath = path.join(__dirname, "setting.json");
    const settingData = fs.readFileSync(settingPath, "utf-8");
    return JSON.parse(settingData);
  } catch (error) {
    console.error("⚠️ setting.jsonの読み込みに失敗しました:", error.message);
    return { userIds: [] };
  }
}

// LINE通知を送信する
async function sendLineNotification(message) {
  const lineAccessToken = process.env.LINE_ACCESS_TOKEN;
  
  if (!lineAccessToken) {
    console.error("⚠️ LINE_ACCESS_TOKENが設定されていません。LINE通知をスキップします。");
    return;
  }
  
  const settings = loadSettings();
  
  if (settings.userIds.length === 0) {
    console.error("⚠️ setting.jsonにuserIdsが設定されていません。LINE通知をスキップします。");
    return;
  }
  
  console.log(`\n📱 LINE通知を ${settings.userIds.length} 人のユーザーに送信中...`);
  
  for (const userId of settings.userIds) {
    try {
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lineAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: userId,
          messages: [
            { type: "text", text: message }
          ]
        }),
      });
      
      if (response.ok) {
        console.log(`✅ LINE通知送信成功: ${userId}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ LINE通知送信失敗: ${userId} - ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ LINE通知送信エラー: ${userId} - ${error.message}`);
    }
    
    // リクエスト間隔を空ける
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log("📱 LINE通知送信完了\n");
}

// データベースからlowest_pricesテーブルのデータを取得して価格をチェック
async function checkPrices() {
  try {
    console.log("=".repeat(80));
    console.log("📊 lowest_prices テーブルのデータを取得中...");
    console.log("=".repeat(80));
    
    const lowestPrices = await prisma.lowestPrice.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (lowestPrices.length === 0) {
      console.log("\n⚠️  データが見つかりませんでした");
      return;
    }

    console.log(`\n✅ ${lowestPrices.length}件のデータを取得しました\n`);
    console.log("現在の価格を確認中...\n");
    
    // より安い価格を見つけた商品を格納する配列
    const cheaperItems = [];
    
    for (let i = 0; i < lowestPrices.length; i++) {
      const record = lowestPrices[i];
      console.log(`[${i + 1}/${lowestPrices.length}] ${record.title} の価格を確認中...`);
      
      // 現在の価格を取得
      const currentPrice = await getSteamPrice(record.steamUrl);
      
      if (currentPrice !== null) {
        const currentPriceNum = parseInt(currentPrice, 10);
        const dbLowestPrice = record.lowestPrice;
        
        // 現在の価格がDB記録最安値未満の場合（値下げ時のみ通知）
        if (currentPriceNum < dbLowestPrice) {
          const discount = dbLowestPrice - currentPriceNum;
          const discountRate = ((1 - currentPriceNum / dbLowestPrice) * 100).toFixed(1);
          
          // 配列に追加
          cheaperItems.push({
            id: record.id,
            title: record.title,
            url: record.steamUrl,
            oldPrice: dbLowestPrice,
            newPrice: currentPriceNum,
            discount: discount,
            discountRate: discountRate
          });
          
          console.log(`  → 🔥 より安い価格を発見！`);
          
          // DBの最安値を更新
          await prisma.lowestPrice.update({
            where: { id: record.id },
            data: { lowestPrice: currentPriceNum }
          });
          
          console.log(`  → ✅ DBを更新しました: ¥${dbLowestPrice.toLocaleString()} → ¥${currentPriceNum.toLocaleString()}`);
        }
      } else {
        console.log(`  → 価格情報の取得に失敗しました`);
      }
      
      // リクエスト間隔を空ける（Steam側の負荷を考慮）
      if (i < lowestPrices.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log("\n" + "=".repeat(80));
    
    // より安い価格が見つかった場合、一覧表示
    if (cheaperItems.length > 0) {
      console.log("🔥 最安値更新情報 🔥");
      console.log("=".repeat(80));
      console.log(`${cheaperItems.length}件の商品で最安値を更新しました！\n`);
      
      // LINE通知用のメッセージを作成
      let lineMessage = "🔥 Steam最安値更新 🔥\n\n";
      
      cheaperItems.forEach((item, index) => {
        const itemNumber = index + 1;
        
        // コンソール出力
        console.log(`【${itemNumber}】${item.title}`);
        console.log(`前回最安値: ¥${item.oldPrice.toLocaleString()}`);
        console.log(`現在価格:   ¥${item.newPrice.toLocaleString()} 🔥`);
        if (item.discount > 0) {
          console.log(`お得額:     ¥${item.discount.toLocaleString()} (${item.discountRate}% OFF)`);
        }
        console.log(`URL: ${item.url}`);
        console.log("");
        
        // LINE用メッセージ
        lineMessage += `【${itemNumber}】${item.title}\n`;
        lineMessage += `前回: ¥${item.oldPrice.toLocaleString()}\n`;
        lineMessage += `現在: ¥${item.newPrice.toLocaleString()} 🔥\n`;
        if (item.discount > 0) {
          lineMessage += `${item.discountRate}% OFF (¥${item.discount.toLocaleString()}お得)\n`;
        }
        lineMessage += `${item.url}\n\n`;
      });
      
      console.log("=".repeat(80));
      console.log("\n📱 LINE通知用メッセージ:");
      console.log("-".repeat(80));
      console.log(lineMessage);
      console.log("-".repeat(80));
      
      // LINE通知を送信
      await sendLineNotification(lineMessage);
      
    } else {
      console.log("ℹ️  現在、記録されている最安値より安い価格は見つかりませんでした。");
    }
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// データベースからlowest_pricesを取得して価格をチェック
checkPrices();
