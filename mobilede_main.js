import { chromium } from 'patchright';
import fs from 'fs';
import path from 'path';
import { consola } from 'consola';

// 出力先ディレクトリを作成（存在しない場合は再帰的に作成）
const outputDir = path.resolve('./output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// 収集対象のデータ項目を定義（この順番でCSVに書き込む）
const HEADERS = [
  'car_name', 'price', 'maker', 'image', 'detail_url',
  'first_registration', 'mileage', 'power', 'cubic_capacity', 'fuel',
  'transmission', 'drive_type', 'colour', 'number_of_seats',
  'door_count', 'weight', 'cylinders', 'tank_capacity'
];

// 車リスト（スクレイピング対象URL群）をJSONから読み込み
const carList = JSON.parse(fs.readFileSync('./car_urls.json', 'utf8'));
const results = []; // 最終的に保存する車両情報一覧

consola.info(`📋 Loaded ${carList.length} cars from car_urls.json`);

// プロキシはJSON形式のテキストファイルから読み込む想定
const proxyTxt = fs.readFileSync('./socks4_socks5_proxies.txt', 'utf8');
const proxyObj = JSON.parse(proxyTxt);
const proxyList = proxyObj.proxies.map(p => p.proxy);

let proxyIndex = 0;

//次のプロキシを取得する（ラウンドロビン方式）
function getNextProxy() {
  if (proxyList.length === 0) {
    throw new Error('利用可能なプロキシがありません');
  }
  const proxy = proxyList[proxyIndex];
  proxyIndex = (proxyIndex + 1) % proxyList.length;
  return proxy;
}

//現在失敗したプロキシを除外
function removeCurrentProxy() {
  if (proxyList.length > 0) {
    proxyList.splice(proxyIndex === 0 ? proxyList.length - 1 : proxyIndex - 1, 1);
    if (proxyIndex >= proxyList.length) proxyIndex = 0;
  }
}

// 人間らしく見せるための処理

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

//マウスをランダムに移動
function randomMouseMove(page) {
  const x = 100 + Math.random() * 800;
  const y = 100 + Math.random() * 500;
  return page.mouse.move(x, y, { steps: 10 });
}

//ページをランダムにスクロール
function randomScroll(page) {
  const scrollY = 300 + Math.random() * 1200;
  return page.mouse.wheel(0, scrollY);
}

//Cookieバナーや同意ダイアログを処理する
async function handleConsentModal(page) {
  try {
    const selectors = [
      'button[data-testid="uc-accept-all-button"]',
      'button[aria-label="Accept all"]',
      'button:has-text("Alle akzeptieren")',
      'button:has-text("Accept all")',
      'button:has-text("OK")',
      '#mde-consent-modal-dialog button',
      '#gdpr-consent-accept-button'
    ];
    for (const sel of selectors) {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await sleep(800 + Math.random() * 800);
        return; // 見つかった時点で終了
      }
    }
  } catch {}
}

// ページから車両情報を抽出

async function extractCarDetails(page) {
  return await page.evaluate(() => {
    function getDd(label) {
      const dts = Array.from(document.querySelectorAll('dt'));
      for (const dt of dts) {
        if (dt.textContent.trim().toLowerCase() === label.toLowerCase()) {
          const dd = dt.nextElementSibling;
          if (dd && dd.tagName.toLowerCase() === 'dd') {
            return dd.textContent.trim();
          }
        }
      }
      return '';
    }

    // 車両仕様情報（<dt>/<dd> の組み合わせ）を取得
    return {
      first_registration: getDd('First registration'),
      mileage: getDd('Mileage'),
      power: getDd('Power'),
      cubic_capacity: getDd('Cubic capacity'),
      fuel: getDd('Fuel'),
      transmission: getDd('Transmission'),
      drive_type: getDd('Drive type'),
      colour: getDd('Colour'),
      number_of_seats: getDd('Number of seats'),
      door_count: getDd('Door count'),
      weight: getDd('Weight'),
      cylinders: getDd('Cylinders'),
      tank_capacity: getDd('Tank capacity')
    };
  });
}

//JSON化されたデータをCSVフォーマットに変換
function convertDataToCSV(carData) {
  const headerRow = HEADERS.join(',');
  const dataRows = carData.map(car => {
    const rowData = HEADERS.map(header => {
      let value = car[header];
      if (value === null || value === undefined) value = '';
      if (String(value).includes(',')) return `"${value}"`; // CSVエスケープ
      return value;
    });
    return rowData.join(',');
  });
  return [headerRow, ...dataRows].join('\n');
}

//CSVファイルとして保存
async function saveDataToCSV(carData) {
  const csvData = convertDataToCSV(carData);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(outputDir, `mobilede_output_${timestamp}.csv`);
  fs.writeFileSync(filename, '\ufeff' + csvData); // BOM付きで保存（Excel互換性向上）
  consola.success(`📄 CSV saved: ${filename}`);
}

// 個別の車データをCSVに追記
function appendCarToCSV(car, filename, isFirstRow = false) {
  const rowData = HEADERS.map(header => {
    let value = car[header];
    if (value === null || value === undefined) value = '';
    if (String(value).includes(',')) return `"${value}"`; // CSVエスケープ
    return value;
  });

  const csvRow = rowData.join(',') + '\n';

  if (isFirstRow) {
    // 初回はヘッダー付きで書き込み
    const headerRow = HEADERS.join(',') + '\n';
    fs.writeFileSync(filename, '\ufeff' + headerRow + csvRow);
  } else {
    // 2回目以降は追記
    fs.appendFileSync(filename, csvRow);
  }
}

// プロキシ付きでブラウザ起動（失敗したら次のプロキシでリトライ）
async function launchBrowserWithProxy(maxTries = proxyList.length) {
  let lastErr;
  for (let tries = 0; tries < maxTries; tries++) {
    // TEMP: Disable proxy for testing - remove this line to re-enable
    const USE_PROXY = false;

    if (!USE_PROXY) {
      const browser = await chromium.launchPersistentContext('', {
        channel: 'chrome',
        headless: true,
        viewport: null
      });
      return { browser, proxy: 'NO_PROXY' };
    }

    if (proxyList.length === 0) throw new Error('利用可能なプロキシがありません');
    const proxy = getNextProxy();
    try {
      const browser = await chromium.launchPersistentContext('', {
        channel: 'chrome',
        headless: false,
        viewport: null,
        proxy: { server: proxy }
      });
      return { browser, proxy };
    } catch (e) {
      console.warn(`プロキシ接続失敗: ${proxy} - 除外します`);
      removeCurrentProxy();
      lastErr = e;
    }
  }
  throw lastErr;
}

// メイン処理フロー

(async () => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const csvFilename = path.join(outputDir, `mobilede_output_${timestamp}.csv`);

  consola.box(`🚗 Mobile.de Scraper Started\n📦 Total cars to process: ${carList.length}`);
  consola.info(`💾 Incremental CSV output: ${csvFilename}`);

  for (let i = 0; i < carList.length; i++) {
    const car = carList[i];
    const carNumber = i + 1;
    let browser = null, detailPage = null;
    let usedProxy = null;

    consola.start(`[${carNumber}/${carList.length}] Processing: ${car.car_name || 'Unknown'}`);

    try {
      // プロキシを切り替えながらブラウザ起動
      consola.info(`  ⚙️  Launching browser${usedProxy !== 'NO_PROXY' ? ' with proxy' : ''}...`);
      const launchResult = await launchBrowserWithProxy();
      browser = launchResult.browser;
      usedProxy = launchResult.proxy;

      if (usedProxy !== 'NO_PROXY') {
        consola.debug(`  🔒 Using proxy: ${usedProxy}`);
      }

      detailPage = await browser.newPage();

      // 人間っぽい挙動を追加
      consola.debug('  🖱️  Simulating human behavior...');
      await randomMouseMove(detailPage);
      await randomScroll(detailPage);
      await sleep(800 + Math.random() * 1200);

      // 車両詳細ページへ遷移
      try {
        consola.info('  🌐 Loading detail page...');
        await detailPage.goto(car.detail_url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
      } catch (gotoErr) {
        consola.error(`  ❌ Page load failed: ${gotoErr.message}`);
        const errorFile = path.join(outputDir, `goto_error_${carNumber}_${Date.now()}.png`);
        await detailPage.screenshot({ path: errorFile, fullPage: true });
        consola.warn(`  📸 Screenshot saved: ${path.basename(errorFile)}`);
        continue;
      }

      // GDPRバナー処理
      consola.debug('  🍪 Handling consent modals...');
      await handleConsentModal(detailPage);

      // さらに人間らしい挙動
      await randomMouseMove(detailPage);
      await randomScroll(detailPage);
      await sleep(1200 + Math.random() * 1500);

      // 車の詳細情報を抽出
      consola.info('  📊 Extracting car details...');
      const details = await extractCarDetails(detailPage);
      Object.assign(car, details);
      results.push(car);

      // 即座にCSVに追記
      appendCarToCSV(car, csvFilename, i === 0);

      const extractedFields = Object.keys(details).filter(k => details[k]).length;
      consola.success(`  ✅ Extracted ${extractedFields} fields | Saved to CSV | Total: ${results.length}/${carList.length}`);

    } catch (e) {
      consola.error(`  💥 Fatal error: ${e.message}`);
      if (detailPage) {
        const errorFile = path.join(outputDir, `fatal_error_${carNumber}_${Date.now()}.png`);
        await detailPage.screenshot({ path: errorFile, fullPage: true });
        consola.warn(`  📸 Error screenshot: ${path.basename(errorFile)}`);
      }

    } finally {
      if (browser) await browser.close(); // ブラウザを必ずクローズ
    }

    // --- 次の車に移る前に待機（サイトBan対策）---
    // await sleep(300000); // 5分休憩
  }

  // 全件終了後のサマリー
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  consola.box(`🎉 Scraping Complete!\n✅ Processed: ${results.length}/${carList.length} cars\n⏱️  Time: ${elapsed} minutes\n📄 CSV file: ${csvFilename}`);
  consola.success('✨ All done!');
})();