import { gengouList, emperorList } from './dataLoader.js';
import { renderResult } from './utils.js';

/**
 * 和暦をバリデーションする
 */
export function validateWarekiInput(converter, gengouName, year) {
  if (!gengouName || isNaN(year) || year <= 0) {
    return "元号と1年以上の年を入力してください。";
  }

  const gengouData = converter.gengouList.find(g => g.name === gengouName);
  if (!gengouData) {
    return "その元号は認識できません。";
  }
  const seireki = gengouData.startYear + year - 1;

  if (gengouData.endYear && seireki > gengouData.endYear) {
    return "その年は存在しません。";
  }

  if (!gengouData.endYear && seireki > new Date().getFullYear() + 5) {
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
 * 西暦 → 和暦（複数該当も返す）
 */
export function convertSeirekiToWareki(year) {
  return gengouList.filter(g => {
    const end = g.endYear || Infinity;
    return year >= g.startYear && year <= end;
  });
}

/**
 * 和暦⇔西暦変換を行うクラス
 */
export class WarekiConverter {
    /**
   * @param {Array} gengouList - 元号データの配列
   */
  constructor(gengouList) {
    this.gengouList = gengouList;
  }

  /**
   * 和暦から西暦に変換する
   * @param {string} gengou - 元号（例: "平成"）
   * @param {number} year - 年（例: 1）
   * @returns {number} 西暦年
   * @throws {Error} 元号が見つからない場合
   */
  toSeireki(gengou, year) {
    const gengouData = this.gengouList.find(g => g.name === gengou);
    if (!gengouData) {
      throw new Error("元号が見つかりません");
    }
    return gengouData.startYear + year - 1;
  }

  /**
   * 西暦から和暦に変換する
   * @param {number} seireki - 西暦年
   * @returns {Object|null} { gengou: string, year: number } 変換結果 or null
   */
  toWareki(seireki) {
    const gengouData = this.gengouList
      .slice()
      .reverse()
      .find(g => {
        const end = g.endYear || Infinity;
        return seireki >= g.startYear && seireki <= end;
      });
    if (!gengouData) {
      return null;
    }
    return {
      gengou: gengouData.name,
      year: seireki - gengouData.startYear + 1
    };
  }

    /**
   * 西暦から和暦に変換（複数候補を全部返す）
   */
  toWarekiMultiple(seireki) {
    return this.gengouList
      .filter(g => {
        const end = g.endYear || Infinity;
        return seireki >= g.startYear && seireki <= end;
      })
      .map(g => ({
        gengou: g.name,
        year: seireki - g.startYear + 1
      }));
  }

}
