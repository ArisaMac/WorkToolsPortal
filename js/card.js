    function adjustFontSizes() {
      const elementsToAdjust = document.querySelectorAll('.card-title, .card-text');
      const MIN_FONT_SIZE = 8; // これ以上小さくならない最小フォントサイズ (単位: px)

      elementsToAdjust.forEach(el => {
        // スタイルをリセットして、ウィンドウサイズ変更時に再計算できるようにする
        el.style.fontSize = ''; 

        // デフォルトのフォントサイズを取得
        let currentFontSize = parseFloat(window.getComputedStyle(el).fontSize);

        // 要素の実際の幅(scrollWidth)が、表示上の幅(clientWidth)より大きい間、ループ
        while (el.scrollWidth > el.clientWidth && currentFontSize > MIN_FONT_SIZE) {
          currentFontSize -= 0.5; // 0.5pxずつフォントを小さくする
          el.style.fontSize = `${currentFontSize}px`;
        }
      });
    }

    // ページの読み込み完了時に実行
    window.addEventListener('DOMContentLoaded', adjustFontSizes);

    // ウィンドウサイズが変更された時に実行
    window.addEventListener('resize', adjustFontSizes);