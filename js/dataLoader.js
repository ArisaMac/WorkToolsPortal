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
