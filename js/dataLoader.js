export let gengouList = [];
export let emperorList = [];

/**
 * 元号データを取得
 */
export async function loadGengouData() {
  const response = await fetch("./wareki.json");
  const data = await response.json();
  gengouList = data;

  // セレクトボックスを生成
  const gengouSelect = document.getElementById("gengouSelect");
  gengouList.forEach(g => {
    const option = document.createElement("option");
    option.value = g.name;
    const endYearText = g.endYear ? g.endYear : "現在";
    option.textContent = `${g.name}（${g.startYear}～${endYearText}）`;
    gengouSelect.appendChild(option);
  });
}

/**
 * 天皇治世データを取得
 */
export async function loadEmperorData() {
  const response = await fetch("./emperor.json");
  const data = await response.json();
  emperorList = data;
}



/**
 * データロードとキャッシュを担当するクラス
 */
export class DataRepository {
  constructor() {
    this.gengouData = [];
    this.emperorData = [];
  }

    /**
   * 元号データをJSONから取得する
   * @param {string} url - データURL
   * @returns {Promise<Array>} 読み込んだ元号データ
   * @throws {Error} 取得エラー時
   */
  async loadGengouData(url = '../json/wareki.json') {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('元号データの読み込みに失敗しました');
    }
    this.gengouData = await res.json();
    return this.gengouData;
  }

    /**
   * 天皇治世データをJSONから取得する
   * @param {string} url - データURL
   * @returns {Promise<Array>} 読み込んだ治世データ
   * @throws {Error} 取得エラー時
   */
  async loadEmperorData(url = '../json/emperor.json') {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('天皇治世データの読み込みに失敗しました');
    }
    this.emperorData = await res.json();
    return this.emperorData;
  }
}
