import { DataRepository } from './dataLoader.js';
import { WarekiConverter, convertSeirekiToWareki, validateWarekiInput, validateSeirekiInput } from './converter.js';
import { renderResult, renderEmperorEra, resetInputs } from './utils.js';
import { messages } from './messages.js';

const gengouSelect = document.getElementById("gengouSelect");

let repo;
let converter;

/**
 * 初期化
*/
(async () => {
  // 元号と天皇治世データを読み込み
  repo = new DataRepository();
  const gengouData = await repo.loadGengouData();
  await repo.loadEmperorData();  

  converter = new WarekiConverter(gengouData);
  
  // セレクトボックスにデータを埋める
  gengouData.forEach(g => {
    const option = document.createElement("option");
    option.value = g.name;
    const endYearText = g.endYear ? g.endYear : "現在";
    option.textContent = `${g.name}（${g.startYear}～${endYearText}）`;
    gengouSelect.appendChild(option);
  });

  // データが全部入ったあとでSelect2を初期化
  $('#gengouSelect').select2({
    placeholder: '元号を選択',
    allowClear: true,
    width: '250px'
  });

  document.getElementById("convertToSeireki").addEventListener("click", handleWarekiToSeireki);
  document.getElementById("convertToWareki").addEventListener("click", handleSeirekiToWareki);

})();



/**
 * 和暦→西暦
 */
function handleWarekiToSeireki() {
  // 入力値取得
  const gengouName =  $('#gengouSelect').val();
  // 年の入力値取得
  const year = parseInt(document.getElementById("warekiYear").value, 10);
  const currentYear = new Date().getFullYear();

  // 入力チェック
  const validation = validateWarekiInput(converter, gengouName, year);
  if (validation) {
    renderResult(`<span class="text-danger fw-bold">${validation}</span>`);
    return;
  }
  // 西暦計算
  const seireki = converter.toSeireki(gengouName, year);

  // 西暦入力欄に反映
  document.getElementById("seirekiYear").value = seireki;
  // 結果をHTMLに挿入
  renderResult(`<i class="bi bi-calendar-check-fill me-2"></i><span class="text-success fw-bold fs-4">西暦 ${seireki} 年</span>`);
};

/**
 * 西暦→和暦
 */
function handleSeirekiToWareki() {
  // 入力値をリセット
  resetInputs(); 

  // 年の入力値取得
  const year = parseInt(document.getElementById("seirekiYear").value, 10);
  const currentYear = new Date().getFullYear();

  // 入力値が空の場合はリセット
  if (repo.emperorData.length === 0) {
    renderResult(messages.LOADING_EMPEROR);
    return;
  }

  // 入力チェック
  const validation = validateSeirekiInput(year);
  if (validation) {
    renderResult(`<span class="text-danger fw-bold">${validation}</span>`);
    return;
  }

  // 大化以前の特別処理
  if (year < 645) {
    renderEmperorEra(year, repo.emperorData);
    return;
  }

  // 西暦から和暦に変換
  // 複数候補を取得
  const results = converter.toWarekiMultiple(year);

  if (!results || results.length === 0) {
    renderResult(messages.NO_GENGOU);
    return;
  }

  // 先頭をセレクトボックスに反映
  // 和暦入力欄に反映
  $('#gengouSelect').val(results[0].gengou).trigger('change');
  document.getElementById("warekiYear").value = results[0].year;

  // 複数候補のテキスト
  const texts = results.map(r => `${r.gengou}${r.year === 1 ? '元' : r.year}年`);

  // 注意メッセージ
  let note = "";
  if (year > currentYear) {
    note = messages.FUTURE_YEAR_NOTE;
  }

  renderResult(`
    <i class="bi bi-calendar-event-fill me-2"></i>
    <span class="text-success fw-bold fs-4">${texts.join(" / ")}</span>
    ${note}
  `);
};



