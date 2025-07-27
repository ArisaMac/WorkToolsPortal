import { emperorEraMessage, noEmperorMessage } from './messages.js';

/**
 * 結果を表示してフェードイン
 */
export function renderResult(html) {
  const resultEl = document.getElementById("result");
  resultEl.innerHTML = html;
  fadeIn(resultEl);
}

/**
 * フェードインアニメーション
 */
export function fadeIn(el) {
  el.classList.remove("fade-in");
  void el.offsetWidth;
  el.classList.add("fade-in");
}

/**
 * 大化以前の治世情報を表示する
 * @param {number} year - 西暦
 * @param {Array} emperorList - 天皇治世データ
 */
export function renderEmperorEra(year, emperorList) {
  const resultEl = document.getElementById("result");
  const emperor = emperorList.find(e => year >= e.startYear && year <= e.endYear);

  if (emperor) {
    resultEl.innerHTML = emperorEraMessage(year, emperor.name);
  } else {
    resultEl.innerHTML = noEmperorMessage(year);
  }
}

/**
 * 文字列に含まれる全角数字を半角数字に変換する
 * @param {string} str - 変換したい文字列
 * @returns {string} - 変換後の文字列
 */
export function zenkakuToHankaku(str) {
  return str.replace(/[０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
}


