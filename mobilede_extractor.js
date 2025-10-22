import { chromium } from 'patchright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, 'input');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const carModelsPath = path.join(__dirname, 'models.json');
const carModels = JSON.parse(fs.readFileSync(carModelsPath, 'utf-8'));

const SEARCH_URL_BASE =
  'https://suchen.mobile.de/fahrzeuge/search.html?con=USED&dam=false&fr=1900%3A2005&isSearchRequest=true&ms={car_model}&ref=srp&s=Car&vc=Car&pageNumber={PAGE}&lang=en';
const MAX_PAGES = 100;

async function extractCarDataFromPage(page) {
  return await page.evaluate(() => {
    const containers = document.querySelectorAll('div.mN_WC');
    return Array.from(containers).map(container => {
      const carNameElement = container.querySelector('span.eO87w');
      const priceElement = container.querySelector('span[data-testid="price-label"]');
      const imageElement = container.querySelector('img.Qj_9F');
      const linkElement = container.querySelector('a.FWtU1.YIC4W.rqEvz') || container.querySelector('a[data-testid^="result-listing-"]');
      const carName = carNameElement ? carNameElement.textContent.trim() : '';
      const maker = carName ? carName.split(' ')[0] : '';
      let detail_url = linkElement ? linkElement.getAttribute('href') : null;
      if (detail_url && !detail_url.startsWith('http')) {
        detail_url = 'https://suchen.mobile.de' + detail_url;
      }
      return {
        car_name: carName,
        maker: maker,
        price: priceElement ? priceElement.textContent.trim() : null,
        image: imageElement ? imageElement.getAttribute('src') : null,
        detail_url: detail_url
      };
    });
  });
}

(async () => {
  const browser = await chromium.launchPersistentContext('', {
    channel: 'chrome',
    headless: false
  });

  for (const [modelName, modelCode] of Object.entries(carModels)) {
    console.log(`\n=== ${modelName} (${modelCode}) のスクレイピング開始 ===`);
    const carList = [];

    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      const page = await browser.newPage();
      const url = SEARCH_URL_BASE
        .replace('{car_model}', modelCode)
        .replace('{PAGE}', pageNum);

      console.log(`Fetching page: ${pageNum} -> ${url}`);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Cookie同意モーダル処理（無ければスキップ）
        await page.click('button[data-testid="uc-accept-all-button"]', { timeout: 3000 }).catch(() => {});

        // 結果が非同期ロードされるのを待つ
        await page.waitForSelector('div.mN_WC', { timeout: 15000 }).catch(() => {});

        await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));

        const cars = await extractCarDataFromPage(page);
        console.log('Found:', cars.length, 'cars');
        carList.push(...cars);

        await page.close();

        if (cars.length === 0) break;
      } catch (err) {
        console.error(`Error on ${modelName} page ${pageNum}:`, err.message);
        await page.close();
        break;
      }
    }

    const outputPath = path.join(outputDir, `${modelName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(carList, null, 2));
    console.log(`${modelName}: 抽出完了 (${carList.length} 件)`);
  }

  await browser.close();
  console.log('すべての車種スクレイピング完了');
})();
