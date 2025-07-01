// messages.js

/**
 * 固定メッセージ
 */
export const messages = {
  NO_GENGOU: `
    <div>
      <span class="text-danger fw-bold">変換できる元号がありません。</span><br/>
      <span class="text-secondary">※元号は西暦645年（大化）から制定されています。</span>
    </div>
  `,
  LOADING_EMPEROR: `
    <span class="text-danger fw-bold">治世データがまだ読み込み中です。少し待ってください。</span>
  `,
  FUTURE_YEAR_NOTE: `
    <br/>
    <span class="text-warning">※未来の年です。参考値として表示しています。</span>
  `
};

/**
 * 大化以前の治世メッセージ
 */
export function emperorEraMessage(year, emperorName) {
  return `
    <div>
      <span class="text-warning fw-bold">※注意: 西暦${year}年は元号が存在しません。</span><br/>
      <span class="text-secondary">※元号は西暦645年（大化）から制定されています。</span><br/>
      <span class="text-success">この時代は「${emperorName}」の治世です。</span>
    </div>
  `;
}

/**
 * 大化以前で治世も不明な場合
 */
export function noEmperorMessage(year) {
  return `
    <span class="text-danger fw-bold">西暦${year}年は元号も治世データも確認できません。</span><br/>
    <span class="text-secondary">※元号は西暦645年（大化）から制定されています。</span>
  `;
}
