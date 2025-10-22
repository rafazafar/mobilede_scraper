const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // ブラウザ内部のconsoleログをNodeのコンソールに出力するためのリスナー
    page.on('console', msg => {
        console.log(`PAGE LOG: ${msg.text()}`);
    });

    // テストする詳細ページのURLを指定してください
    const detailUrl = 'https://www.carsensor.net/usedcar/detail/AU6272266064/index.html?TRCD=200002&RESTID=CS210610&LOAN=TSUJO'; // 実際のURLに置き換え
    
    // ページ読み込み完了まで待機（ネットワークアイドル状態）
    await page.goto(detailUrl, { waitUntil: 'networkidle' });
    
    // 対象要素（例: div.defaultTable）が表示されるまで待機
    await page.waitForSelector('div.footContainer');

    // 対象のセレクタから値を取得
    const extractedValue = await page.evaluate(() => {
        // まず、全ての div.defaultTable を取得
        const defaultTables = document.querySelector('div.footContainer');
        if (!defaultTables) {
            console.log('defaultTables は見つかりませんでした');
            return null;
        }

        const column_sub = defaultTables.querySelector('div.column__sub');
        if (!column_sub) {
            console.log('column_sub は見つかりませんでした');
            return null;
        }

        // その中にある defaultTable__table クラスの div を取得
        const innerTable = column_sub.querySelectorAll('div.specWrap__box');
        if (!innerTable) {
            console.log('innerTable は見つかりませんでした');
            return null;
        }
        
        // innerTable 内の tbody > tr を取得
        const tr = innerTable[6].querySelector('p.specWrap__boxDetail');
        if (!tr) {
            console.log('tr は見つかりませんでした');
            return null;
        }

        // 2つ目の td のテキスト内容を返す（インデックスは0始まり）
        return Array.from(tr)
            .map(item => item.textContent.trim())
            .join('\n');
    });

    console.log('Extracted Value:', extractedValue);

    await browser.close();
})();
