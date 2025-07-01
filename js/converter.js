import { gengouList, emperorList } from './dataLoader.js';
import { renderResult } from './utils.js';

/**
 * 和暦をバリデーションする
 */
export function validateWarekiInput(gengouName, year) {
  // 入力が空・無効値・1未満の場合エラー
  if (!gengouName || isNaN(year) || year <= 0) {
    return "元号と1年以上の年を入力してください。";
  }

  // 元号が存在しない場合エラー
  const gengou = gengouList.find(g => g.name === gengouName);
  if (!gengou) return "その元号は認識できません。";
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
 * 西暦をバリデーションする
 */
export function validateSeirekiInput(year) {
  // 入力が無効な場合はエラーメッセージ
  if (isNaN(year) || year <= 0) {
    return "1年以上の西暦を入力してください。";
  }
  return null;
}

/**
 * 和暦 → 西暦
 */
export function convertWarekiToSeireki(gengouName, year) {
  const gengou = gengouList.find(g => g.name === gengouName);
  return gengou.startYear + year - 1;
}

/**
 * 西暦 → 和暦（複数該当も返す）
 */
export function convertSeirekiToWareki(year) {
  return gengouList.filter(g => {
    const end = g.endYear || Infinity;
    return year >= g.startYear && year <= end;
  });
}
