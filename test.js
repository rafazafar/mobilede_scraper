const { chromium } = require('playwright');
const fs = require('fs');


(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // ブラウザ内部のconsoleログをNodeのコンソールに出力するためのリスナー
    page.on('console', msg => {
        console.log(`PAGE LOG: ${msg.text()}`);
    });

    // テストする詳細ページのURLを指定してください
    const detailUrl = 'https://www.carsensor.net/usedcar/detail/AU5755075871/index.html?TRCD=200002&RESTID=CS210610'; // 実際のURLに置き換え
    
    await page.goto(detailUrl, { waitUntil: 'networkidle' });
    // その後、目的の要素が読み込まれるまで待つ
    await page.waitForSelector('div.defaultTable');
    // 詳細ページが完全に読み込まれるまで待機（適宜セレクタを指定してください）
    
    // 詳細ページから driving_system と engine_type を取得
    const detailData = await page.evaluate(() => {
        // ※ 以下のセレクタは一例です。実際のサイトの DOM に合わせて修正してください。
        // まず、全ての div.defaultTable を取得
        const defaultTables = document.querySelectorAll('div.defaultTable');
        if (defaultTables.length < 2) {
            console.log('defaultTables は見つかりませんでした');
            return null;
        }

        // 2つ目の div.defaultTable を取得
        const secondDefaultTable = defaultTables[1];

        // その中にある defaultTable__table クラスの div を取得
        const innerTable = secondDefaultTable.querySelector('table.defaultTable__table');
        if (!innerTable) {
            console.log('innerTable は見つかりませんでした');
            return null;
        }
        
        // innerTable 内の tbody > tr を取得
        const tr = innerTable.querySelector('tbody > tr');
        if (!tr) {
            console.log('tr は見つかりませんでした');
            return null;
        }
        
        // tr 内の defaultTable__description クラスを持つ td をすべて取得
        const tdDescriptions = tr.querySelectorAll('td.defaultTable__description');
        if (tdDescriptions.length < 2) {
            console.log('tdDescriptionsが見つかりませんでした');
            return null;
        }

        const drivingSystemElem = tdDescriptions[1].textContent.trim();
        console.log(drivingSystemElem);

        // innerTable 内の tbody > tr を取得
        const tr_engine = innerTable.querySelector('tbody >  tr:nth-child(5)');
        if (!tr_engine) {
            console.log('tr は見つかりませんでした');
            return null;
        }
        
        // tr 内の defaultTable__description クラスを持つ td をすべて取得
        const tdDescriptions_engine = tr_engine.querySelectorAll('td.defaultTable__description');
        if (tdDescriptions_engine.length < 2) {
            console.log('tdDescriptionsが見つかりませんでした');
            return null;
        }

        // 2つ目の td のテキスト内容を返す（インデックスは0始まり）
        const engineTypeElem = tdDescriptions_engine[0].textContent.trim();

        // innerTable 内の tbody > tr を取得
        const tr_handle = innerTable.querySelector('tbody >  tr:nth-child(2)');
        if (!tr_engine) {
            console.log('tr は見つかりませんでした');
            return null;
        }
        
        // tr 内の defaultTable__description クラスを持つ td をすべて取得
        const tdDescriptions_handle = tr_handle.querySelectorAll('td.defaultTable__description');
        if (tdDescriptions_engine.length < 2) {
            console.log('tdDescriptionsが見つかりませんでした');
            return null;
        }
        const handleElem = tdDescriptions_handle[1].textContent.trim();

        // innerTable 内の tbody > tr を取得
        const tr_mission = innerTable.querySelector('tbody >  tr:nth-child(3)');
        if (!tr_mission) {
            console.log('tr は見つかりませんでした');
            return null;
        }
        
        // tr 内の defaultTable__description クラスを持つ td をすべて取得
        const tdDescriptions_mission = tr_mission.querySelectorAll('td.defaultTable__description');
        if (tdDescriptions_mission.length < 2) {
            console.log('tdDescriptionsが見つかりませんでした');
            return null;
        }
        // まず、全ての div.defaultTable を取得
        const defaultTables_safe = document.querySelector('div.equipmentList');
        if (!defaultTables_safe) {
            console.log('defaultTables_safe は見つかりませんでした');
            return null;
        }

        // その中にある defaultTable__table クラスの div を取得
        const innerTable_safe = defaultTables_safe.querySelectorAll('div.equipmentList__category');
        if (!innerTable_safe) {
            console.log('innerTable_safe は見つかりませんでした');
            return null;
        }
        
        // innerTable_safe 内の tbody > tr を取得
        const tr_safe = innerTable_safe[0].querySelectorAll('ul > li.equipmentList__item--active');
        if (!tr_safe) {
            console.log('tr は見つかりませんでした');
            return null;
        }

        // 2つ目の td のテキスト内容を返す（インデックスは0始まり）
        const safeequipElem =  Array.from(tr_safe)
            .map(item => item.textContent.trim())
            .join('\n');

        // innerTable_safe 内の tbody > tr を取得
        const tr_comfort = innerTable_safe[1].querySelectorAll('ul > li.equipmentList__item--active');
        if (!tr_comfort) {
            console.log('tr は見つかりませんでした');
            return null;
        }

        // 2つ目の td のテキスト内容を返す（インデックスは0始まり）
        const comfortequipElem =  Array.from(tr_comfort)
            .map(item => item.textContent.trim())
            .join('\n');

        // innerTable_safe 内の tbody > tr を取得
        const tr_interia = innerTable_safe[2].querySelectorAll('ul > li.equipmentList__item--active');
        if (!tr_interia) {
            console.log('tr は見つかりませんでした');
            return null;
        }

        // 2つ目の td のテキスト内容を返す（インデックスは0始まり）
        const interiaequipElem =  Array.from(tr_interia)
            .map(item => item.textContent.trim())
            .join('\n');
        
        // innerTable_safe 内の tbody > tr を取得
        const tr_exteria = innerTable_safe[3].querySelectorAll('ul > li.equipmentList__item--active');
        if (!tr_exteria) {
            console.log('tr は見つかりませんでした');
            return null;
        }

        // 2つ目の td のテキスト内容を返す（インデックスは0始まり）
        const exteriaequipElem =  Array.from(tr_exteria)
            .map(item => item.textContent.trim())
            .join('\n');

        const defaultTables_footer = document.querySelector('div.footContainer');
        if (!defaultTables_footer) {
            console.log('defaultTables は見つかりませんでした');
            return null;
        }

        const column_sub_footer = defaultTables_footer.querySelector('div.toPageTop');
        if (!column_sub_footer) {
            console.log('column_sub は見つかりませんでした');
            return null;
        }

        // その中にある defaultTable__table クラスの div を取得
        const innerTable_footer = column_sub_footer.querySelector('div.toPageTop__inner');
        if (!innerTable_footer) {
            console.log('innerTable は見つかりませんでした');
            return null;
        }

        // 2つ目の td のテキスト内容を返す（インデックスは0始まり）
        const footerText = innerTable_footer ? innerTable_footer.textContent.trim() : null
        const parts = footerText.split('・');
        const modelText = parts[1];  
            
        return {
            driving_system: drivingSystemElem || "不明",
            engine_type: engineTypeElem  || "不明",
            handle: handleElem  || "不明",
            modelText: modelText || "不明",
            safeequipment: safeequipElem  || "不明",
            comfortequipment: comfortequipElem || "不明",
            interiaequipment: interiaequipElem || "不明",
            exteriaequipment: exteriaequipElem || "不明"
        };
    });
    console.log('Extracted Value:', detailData);

    await browser.close();
})();
