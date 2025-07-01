let gengouList = [];
const gengouSelect = document.getElementById("gengouSelect"); // ← グローバルに出す！

/**
 * ① 元号データを取得してセレクトボックスにセットする
 */
async function loadGengouData() {
  try{
    const response = await fetch("./wareki.json");
    const data = await response.json();
    gengouList = data;
    console.log("元号データ読み込み完了", gengouList);

    // セレクトボックスを生成
    gengouList.forEach(g => {
      const option = document.createElement("option");
      option.value = g.name;
      const endYearText = g.endYear ? g.endYear : "現在";
      option.textContent = `${g.name}（${g.startYear}～${endYearText}）`;
      gengouSelect.appendChild(option);
    });
  } catch(error) {
    console.error("JSONの読み込みに失敗:", error);

  }
}

/**
 * ② 天皇治世データを取得する
 */
async function loadEmperorData() {
  try {
    const response = await fetch("./emperor.json");
    const data = await response.json();
    emperorList = data;    
    console.log("天皇治世データ読み込み完了", emperorList);
  } catch(error) {
    console.error("天皇治世データの読み込みに失敗:", error);
  }
}

(async () => {
  await loadGengouData();
  await loadEmperorData();
})();

/**
 * 和暦→西暦変換を実行する
 */
function convertToSeireki() {
  document.getElementById("convertToSeireki").addEventListener("click", () => {
    const selected = gengouSelect.value;
    const year = parseInt(document.getElementById("warekiYear").value, 10);
  
    const resultEl = document.getElementById("result");
  
    const validation = validateWarekiInput(selected, year);
    if (validation) {
      renderResult(`<span class="text-danger fw-bold">${validation}</span>`);
      return;
    }
    
    const gengou = gengouList.find(g => g.name === selected);
  
    // 西暦計算
    const seireki = gengou.startYear + year - 1;
  
    // 西暦入力欄に反映
    document.getElementById("seirekiYear").value = seireki;
  
    // 結果をHTMLに挿入
    resultEl.innerHTML = `
      <i class="bi bi-calendar-check-fill me-2"></i>
      <span class="text-success fw-bold fs-4">西暦 ${seireki} 年</span>
    `;
  
    fadeIn(resultEl);
  
    document.getElementById("seirekiYear").value = seireki;
  
  });
}

/**
 * 西暦→和暦変換を実行する
 */
function convertToWareki() {
  document.getElementById("convertToWareki").addEventListener("click", () => {
    const year = parseInt(document.getElementById("seirekiYear").value, 10);
    const resultEl = document.getElementById("result");
  
    if (emperorList.length === 0) {
      resultEl.innerHTML = `<span class="text-danger fw-bold">治世データがまだ読み込み中です。少し待ってください。</span>`;
      fadeIn(resultEl);
      return;
    }
  
    const validation = validateSeirekiInput(year);
    if (validation) {
      renderResult(`<span class="text-danger fw-bold">${validation}</span>`);
      return;
    }
  
    // ここで大化以前を判定
  if (year < 645) {
    renderEmperorEra(year);
    return;
  }
  
  // ここから複数元号対応
  const gengous = gengouList.filter(g => {
    const end = g.endYear || Infinity;
    return year >= g.startYear && year <= end;
  });
  
  if (gengous.length === 0) {
    renderNoGengouMessage();
    return;
  }
  
    // 和暦文字列を作る
    const warekiTexts = gengous.map(g => {
      const warekiYear = year - g.startYear + 1;
      return `${g.name}${warekiYear === 1 ? "元" : warekiYear}年`;
    });
  
    // セレクトボックスと入力欄には最初の元号を反映
    gengouSelect.value = gengous[0].name;
    document.getElementById("warekiYear").value = year - gengous[0].startYear + 1;
  
    // 結果表示
    resultEl.innerHTML = `
      <i class="bi bi-calendar-event-fill me-2"></i>
      <span class="text-success fw-bold fs-4">${warekiTexts.join(" / ")}</span>
    `;
    fadeIn(resultEl);
  
  });
}

/**
 * 大化以前の治世情報を表示する
 * @param {number} year - 西暦
 */
function renderEmperorEra(year) {
  const resultEl = document.getElementById("result");
  const emperor = emperorList.find(e => year >= e.startYear && year <= e.endYear);
  const gengou = findGengouByYear(year);

  if (emperor) {
    renderResult(`
      <div>
        <span class="text-warning fw-bold">※注意: 西暦${year}年は元号が存在しません。</span><br/>
        <span class="text-secondary">※元号は西暦645年（大化）から制定されています。</span><br/>
        <span class="text-success">この時代は「${emperor.name}」の治世です。</span>
      </div>
    `);
  } else {
    renderResult(`
      <div>
        <span class="text-danger fw-bold">西暦${year}年は元号も治世データも確認できません。</span><br/>
        <span class="text-secondary">※元号は西暦645年（大化）から制定されています。</span>
      </div>
    `);
  }
}

/**
 * 元号が見つからない場合のメッセージを表示する
 */
function renderNoGengouMessage() {
  renderResult(`
    <div>
      <span class="text-danger fw-bold">変換できる元号がありません。</span><br/>
      <span class="text-secondary">※元号は西暦645年（大化）から制定されています。</span>
    </div>
  `);
}


/**
 * ④ 西暦を和暦の文字列に変換する
 *
 * @param {number} year - 西暦年
 * @returns {string} - 対応する和暦の文字列（該当なしの場合は「対象外」）
 */  
function toWareki(year) {
  const hits = gengouList.filter(g => {
    const end = g.endYear || Infinity;
    return year >= g.startYear && year <= end;
  });

  if (hits.length === 0) {
    return "対象外";
  }

  const results = hits.map(g => {
    const warekiYear = year - g.startYear + 1;
    return `${g.name}${warekiYear === 1 ? '元' : warekiYear}年`;
  });

  return results.join(" / ");
}

/**
 * 要素にフェードインアニメーションを適用する
 *
 * @param {HTMLElement} el - フェードインさせる要素
 */
function fadeIn(el) {
  el.classList.remove("fade-in");
  void el.offsetWidth;
  el.classList.add("fade-in");
}

/**
 * 指定した西暦が含まれる元号を取得する
 *
 * @param {number} year - 西暦年
 * @returns {Object|undefined} - 見つかった元号オブジェクト、なければ undefined
 */
function findGengouByYear(year) {
  return gengouList.find(g => {
    const end = g.endYear || Infinity;
    return year >= g.startYear && year <= end;
  });
}

/**
 * 和暦入力を検証するバリデーション関数
 *
 * @param {string} gengouName - 選択された元号の名前（例：令和）
 * @param {number} year - 入力された和暦の年（1以上）
 * @returns {string|null} - 入力に問題がある場合はエラーメッセージ文字列、問題がなければ null
 *
 */
function validateWarekiInput(gengouName, year) {
  
  // 入力が空・無効値・1未満の場合エラー
  if (!gengouName || isNaN(year) || year <= 0) {
    return "元号と1年以上の年を入力してください。";
  }

  // 元号が存在しない場合エラー
  const gengou = gengouList.find(g => g.name === gengouName);
  if (!gengou) {
    return "その元号は認識できません。";
  }  

  const seireki = gengou.startYear + year - 1;

  // 終了年がある元号で範囲外ならエラー
  if (gengou.endYear && seireki > gengou.endYear) {
    return "その年は存在しません。";
  }

  // 終了年が未定で未来の年（今年+5年超）は警告メッセージ
  if (!gengou.endYear && seireki > new Date().getFullYear() + 5) {
    return `その年はまだ存在しません。ただし西暦に換算すると ${seireki} 年です。`;
  }

  return null;

}

/**
 * 西暦入力を検証するバリデーション関数
 *
 * @param {number} year - 入力された西暦の年
 * @returns {string|null} - 入力が無効な場合はエラーメッセージ、問題なければ null
 */
function validateSeirekiInput(year) {

  if (isNaN(year) || year <= 0) {
    return "1年以上の西暦を入力してください。";
  }
  return null;
}

/**
 * 結果表示エリアにHTMLを描画し、フェードインアニメーションを適用する
 *
 * @param {string} html - 挿入するHTML文字列
 */
function renderResult(html) {
  const resultEl = document.getElementById("result");
  resultEl.innerHTML = html;
  fadeIn(resultEl);
}

