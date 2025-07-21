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
  });

  document.getElementById("convertToSeireki").addEventListener("click", handleWarekiToSeireki);
  document.getElementById("convertToWareki").addEventListener("click", handleSeirekiToWareki);

  // 生年月日入力欄に30年前の日付をデフォルトで設定
  const date30YearsAgo = new Date();
  date30YearsAgo.setFullYear(date30YearsAgo.getFullYear() - 30);
  document.getElementById('birthdate').valueAsDate = date30YearsAgo;

  // 生年月日が変更されたら、現在の年齢表示を更新
  document.getElementById('birthdate').addEventListener('input', updateCurrentAgeDisplay);
  
  // ページ読み込み時に一度、年齢を表示する
  updateCurrentAgeDisplay();

})();


/**
 * 和暦→西暦
 */
function handleWarekiToSeireki() {
  // 入力値取得
  const gengouName =  $('#gengouSelect').val();
  // 年の入力値取得
  const year = parseInt(document.getElementById("warekiYear").value, 10);

  // 入力チェック
  const validation = validateWarekiInput(converter, gengouName, year);
  if (validation) {
    renderResult(`<span class="text-danger fw-bold">${validation}</span>`);
    return;
  }
  // 西暦計算
  const seireki = converter.toSeireki(gengouName, year);

  // --- 年齢表示ロジック ---
  // 生年月日を取得
  const birthdateValue = document.getElementById('birthdate').value;
  const today = new Date();
  const targetDate = new Date(seireki, 11, 31); // 計算基準日を変換後の年に設定
  const age = calculateAge(targetDate, birthdateValue);

  // 年齢表示用のHTMLを作成
  let ageText = '';
  if (age !== null && age >= 0) {
    const label = (seireki === today.getFullYear()) ? '現在' : '当時';
    ageText = `<span class="text-muted ms-2">(${label} ${age} 歳)</span>`;
  } else if (age !== null && age < 0) {
    ageText = `<span class="text-info ms-2">(まだ生まれていません)</span>`;
  }

  // 西暦入力欄に反映
  document.getElementById("seirekiYear").value = seireki;
  // 結果をHTMLに挿入
  renderResult(`<i class="bi bi-calendar-check-fill me-2"></i><span class="text-success fw-bold fs-4">西暦 ${seireki} 年</span>${ageText}`);

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

  // --- 年齢表示ロジック ---
  // 生年月日を取得
  const birthdateValue = document.getElementById('birthdate').value;
  const today = new Date();
  const targetDate = new Date(year, 11, 31); // 計算基準日を変換後の年に設定
  // 当時の年齢を計算
  const age = calculateAge(targetDate, birthdateValue);

  // 年齢表示用のHTMLを作成
  let ageText = '';
  if (age !== null && age >= 0) {
    const label = (year === today.getFullYear()) ? '現在' : '当時';
    ageText = `<span class="text-muted ms-2">(${label} ${age} 歳)</span>`;
  } else if (age !== null && age < 0) {
    ageText = `<span class="text-info ms-2">(まだ生まれていません)</span>`;
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
    ${ageText} 
  `);
};


/**
 * 生年月日から現在の満年齢を計算する関数
 * @param {string} birthdateString - "YYYY-MM-DD"形式の生年月日の文字列
 * @returns {number|null} - 満年齢。不正な日付の場合はnullを返す。
 */
function calculateCurrentAge(birthdateString) {
  if (!birthdateString) return null;

  const today = new Date();
  const birthDate = new Date(birthdateString);

  // 年齢を計算
  let age = today.getFullYear() - birthDate.getFullYear();
  
  // 今年の誕生日がまだ来ていない場合は1歳引く
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * 指定された西暦と生年月日から、年齢を計算する汎用関数
 * @param {Date} baseDate - 基準日
 * @param {string} birthdateString - "YYYY-MM-DD"形式の生年月日の文字列
 * @returns {number|null} - 満年齢。不正な日付の場合はnullを返す。
 */
function calculateAge(baseDate, birthdateString) {
  if (!birthdateString) return null;

  const birthDate = new Date(birthdateString);
  let age = baseDate.getFullYear() - birthDate.getFullYear();
  
  const monthDifference = baseDate.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && baseDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * 現在の年齢表示を更新する関数
 */
function updateCurrentAgeDisplay() {
  const birthdateValue = document.getElementById('birthdate').value;
  // 常に「今日」を基準に現在の年齢を計算
  const age = calculateAge(new Date(), birthdateValue);
  const displayElement = document.getElementById('current-age-display');

  if (age !== null && age >= 0) {
    displayElement.textContent = `(満 ${age} 歳)`;
  } else {
    displayElement.textContent = '';
  }
}
