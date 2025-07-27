import { renderEmperorEra } from './utils.js';

/**
 * 和暦をバリデーションする
 */
export function validateWarekiInput(gengouName, year) {
  if (!gengouName || isNaN(year) || year <= 0) {
    return "元号と1年以上の年を入力してください。";
  }

  return null;
}


/**
 * 西暦をバリデーションする
 */
export function validateSeirekiInput(seireki, emperorData) {
  // 入力が無効な場合はエラーメッセージ
  if (isNaN(seireki) || seireki <= 0) {
    return "西暦に1年以上の入力してください。";
  } 
  
  return null;
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
   * 西暦から和暦に変換（複数候補を全部返す）
   */
  toWareki(seireki) {
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
