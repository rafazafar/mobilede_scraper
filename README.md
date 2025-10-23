# Mobile.de スクレイパー

Mobile.de から中古車情報を自動収集するツール。Patchright を使用して検出を回避します。

## 📋 機能

- ✅ 複数の車種モデルから検索結果ページをスクレイピング
- ✅ 各車両の詳細ページから仕様情報を抽出
- ✅ リアルタイムで CSV に保存（データ損失なし）
- ✅ プロキシローテーション対応
- ✅ Bot 検出回避（Patchright + Chrome）

## 🚀 クイックスタート

```bash
# 依存関係のインストール
npm install

# 1. 検索結果から車両URLを収集
node mobilede_extractor.js

# 2. 収集したURLを統合
node merge_inputs.js

# 3. 詳細情報をスクレイピング
node mobilede_main.js
```

## 📁 プロジェクト構成

```
mobilede_scraper/
├── models.json              # スクレイピング対象の車種モデル
├── mobilede_extractor.js    # ステップ1: 検索結果から URL 収集
├── merge_inputs.js          # ステップ2: JSON ファイルを統合
├── mobilede_main.js         # ステップ3: 詳細ページをスクレイピング
├── input/                   # 車種ごとの URL リスト
├── output/                  # 最終的な CSV 出力
└── car_urls.json           # 統合された車両 URL リスト
```

## ⚙️ 設定

### models.json
スクレイピングする車種を定義：
```json
{
  "190": "17200%3B126%3B%3B",
  "200": "17200%3B127%3B%3B"
}
```

### プロキシ設定
`mobilede_main.js` の `USE_PROXY` を変更：
```javascript
const USE_PROXY = false;  // プロキシ無効（推奨）
const USE_PROXY = true;   // プロキシ有効
```

## 📊 出力データ

CSV には以下の項目が含まれます：
- 基本情報: 車名、価格、メーカー、画像URL
- 仕様: 初回登録、走行距離、馬力、排気量、燃料
- 詳細: トランスミッション、駆動方式、色、座席数など

## 🔧 トラブルシューティング

**ブラウザが起動しない**
```bash
npx patchright install chrome
```

**プロキシが遅い**
- `mobilede_main.js` で `USE_PROXY = false` に設定

---

# Mobile.de Scraper

Automated scraper for collecting used car data from Mobile.de using Patchright for stealth.

## 📋 Features

- ✅ Scrapes search results for multiple car models
- ✅ Extracts detailed specs from individual listings
- ✅ Incremental CSV saving (no data loss)
- ✅ Proxy rotation support
- ✅ Bot detection evasion (Patchright + Chrome)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Step 1: Collect car URLs from search results
node mobilede_extractor.js

# Step 2: Merge collected URLs
node merge_inputs.js

# Step 3: Scrape detailed information
node mobilede_main.js
```

## 📁 Project Structure

```
mobilede_scraper/
├── models.json              # Car models to scrape
├── mobilede_extractor.js    # Step 1: Collect URLs from search
├── merge_inputs.js          # Step 2: Merge JSON files
├── mobilede_main.js         # Step 3: Scrape detail pages
├── input/                   # Per-model URL lists
├── output/                  # Final CSV output
└── car_urls.json           # Merged car URL list
```

## ⚙️ Configuration

### models.json
Define car models to scrape:
```json
{
  "190": "17200%3B126%3B%3B",
  "200": "17200%3B127%3B%3B"
}
```

### Proxy Settings
Change `USE_PROXY` in `mobilede_main.js`:
```javascript
const USE_PROXY = false;  // Disabled (recommended)
const USE_PROXY = true;   // Enabled
```

## 📊 Output Data

CSV includes:
- Basic: Car name, price, maker, image URL
- Specs: First registration, mileage, power, cubic capacity, fuel
- Details: Transmission, drive type, color, seats, etc.

## 🔧 Troubleshooting

**Browser won't launch**
```bash
npx patchright install chrome
```

**Proxy too slow**
- Set `USE_PROXY = false` in `mobilede_main.js`
