import { loadGengouData, loadEmperorData, gengouList, emperorList } from './dataLoader.js';
import { validateWarekiInput, validateSeirekiInput, convertWarekiToSeireki, convertSeirekiToWareki } from './converter.js';
import { renderResult, renderEmperorEra, resetInputs } from './utils.js';
import { messages } from './messages.js';

const gengouSelect = document.getElementById("gengouSelect");

/**
 * 初期化
 */
(async () => {
  // 元号と天皇治世データを読み込み
  await loadGengouData(gengouSelect);
  await loadEmperorData();

  // データが全部入ったあとでSelect2を初期化
  $('#gengouSelect').select2({
    placeholder: '元号を選択',
    allowClear: true,
    width: '250px'
  });
})();

// ページ読み込み後にSelect2を初期化
// document.addEventListener("DOMContentLoaded", () => {
//   $('#gengouSelect').select2({
//     placeholder: '元号を選択',
//     allowClear: true,
//     width: '250px'
//   });

// });

document.getElementById("convertToSeireki").addEventListener("click", handleWarekiToSeireki);
document.getElementById("convertToWareki").addEventListener("click", handleSeirekiToWareki);

/**
 * 和暦→西暦
 */
// document.getElementById("convertToSeireki").addEventListener("click", () => {
function handleWarekiToSeireki() {
  // 入力値取得
  const gengouName = gengouSelect.value;
  // 年の入力値取得
  const year = parseInt(document.getElementById("warekiYear").value, 10);
  const currentYear = new Date().getFullYear();

  // 入力チェック
  const validation = validateWarekiInput(gengouName, year);
  if (validation) {
    renderResult(`<span class="text-danger fw-bold">${validation}</span>`);
    return;
  }
  // 西暦計算
  const seireki = convertWarekiToSeireki(gengouName, year);
  // 西暦入力欄に反映
  document.getElementById("seirekiYear").value = seireki;
  // 結果をHTMLに挿入
  renderResult(`<i class="bi bi-calendar-check-fill me-2"></i><span class="text-success fw-bold fs-4">西暦 ${seireki} 年</span>`);
};

/**
 * 西暦→和暦
 */
// document.getElementById("convertToWareki").addEventListener("click", () => {
function handleSeirekiToWareki() {
  // 入力値をリセット
  resetInputs(); 

  // 年の入力値取得
  const year = parseInt(document.getElementById("seirekiYear").value, 10);
  const currentYear = new Date().getFullYear();

  // 入力値が空の場合はリセット
  if (emperorList.length === 0) {
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
    renderEmperorEra(year, emperorList);
    return;
  }

  // 西暦から和暦に変換
  const gengous = convertSeirekiToWareki(year);
  // 治世データがまだ読み込み中の場合
  if (gengous.length === 0) {
    // renderResult(`<span class="text-danger fw-bold">変換できる元号がありません。</span>`);
    renderResult(messages.NO_GENGOU);
    return;
  }
  // セレクトボックスの更新
  const texts = gengous.map(g => {
    const warekiYear = year - g.startYear + 1;
    return `${g.name}${warekiYear === 1 ? '元' : warekiYear}年`;
  });

  gengouSelect.value = gengous[0].name;
  $('#gengouSelect').val(gengous[0].name).trigger('change');

  // 和暦入力欄に反映
  document.getElementById("warekiYear").value = year - gengous[0].startYear + 1;

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



