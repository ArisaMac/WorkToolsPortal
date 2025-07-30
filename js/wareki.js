import { DataRepository } from './dataLoader.js';
import { WarekiConverter, validateWarekiInput, validateSeirekiInput } from './converter.js';
import { renderResult, renderEmperorEra, zenkakuToHankaku } from './utils.js';
import { messages } from './messages.js';


class WarekiApp{
  
  /**
   * クラスのプロパティ
   * 変数とDOM要素を定義
   */ 
  repo;
  /** @type {WarekiConverter} */ 
  converter;
  elements = {
    gengouSelect: document.getElementById("gengouSelect"),  
    seirekiInput: document.getElementById("seirekiYear"),
    warekiInput: document.getElementById("warekiYear"),
    birthdateInput: document.getElementById('birthdate'),
    convertToSeirekiBtn: document.getElementById("convertToSeireki"),
    convertToWarekiBtn: document.getElementById("convertToWareki"),
    currentAgeDisplay: document.getElementById('current-age-display'),
    thisYearDisplay: document.getElementById('thisYearDisplay'),
    clearValue: document.getElementById("clear") 
  }

  /**
   * コンストラクタ
   * インスタンス生成時に一度だけ呼ばれる
   * ここでイベントリスナーを登録
   */
  constructor() {
    this.elements.convertToSeirekiBtn.addEventListener("click", this.handleWarekiToSeireki.bind(this));
    this.elements.convertToWarekiBtn.addEventListener("click", this.handleSeirekiToWareki.bind(this));
    this.elements.clearValue.addEventListener("click", this.clearValue.bind(this));
    this.elements.thisYearDisplay.addEventListener('click', this.thisYearDisplay.bind(this));
    this.elements.birthdateInput.addEventListener('input', this.updateCurrentAgeDisplay.bind(this));
    this.elements.seirekiInput.addEventListener('input', this.handleNumericInput.bind(this));
    this.elements.warekiInput.addEventListener('input', this.handleNumericInput.bind(this));
  }

  /**
   * 初期化処理
   * データの読み込みやUIのセットアップを行う
   */  
  async init() {
    try{
      // １．元号リスト
      // １－１．元号と天皇治世データを読み込み
      this.repo = new DataRepository();
      const gengouData = await this.repo.loadGengouData();
      await this.repo.loadEmperorData();        
      this.converter = new WarekiConverter(gengouData);

      // １－２．セレクトボックスにデータを埋める
      gengouData.forEach(g => {
        const option = document.createElement("option");
        option.value = g.name;
        const endYearText = g.endYear ? g.endYear : "現在";
        option.textContent = `${g.name}（${g.startYear}～${endYearText}）`;
        this.elements.gengouSelect.appendChild(option);
      });

      // １－３．データが全部入ったあとでSelect2を初期化
      $('#gengouSelect').select2({
        placeholder: '元号を選択',
        allowClear: true,
      });
      
      // ２．生年月日
      // ２－１．生年月日を初期化
      this.elements.birthdateInput.valueAsDate = null;    
      // ２－２．ページ読み込み時に年齢を表示
      this.updateCurrentAgeDisplay();
    
    } catch (error) {
      console.error("初期化中にエラーが発生しました:", error);
      renderResult(`<span class="text-danger fw-bold">データの読み込みに失敗しました。ページを再読み込みしてください。: ${error.message}</span>`);
      return; 
    }

  }
  
  /**
   * 和暦→西暦
   */
  handleWarekiToSeireki() {
  
    // １．入力値取得
    const gengouName =  this.elements.gengouSelect.value;
    const year = parseInt(this.elements.warekiInput.value, 10);
  
    // ２．入力チェック
    const validation = validateWarekiInput( gengouName, year);
    if (validation) {
      renderResult(`<span class="text-danger fw-bold">${validation}</span>`);
      return;
    }
  
    // ３．西暦変換
    const seireki = this.converter.toSeireki(gengouName, year);  
    this.elements.seirekiInput.value = seireki;

    // ４．結果を描画(UI更新)
    this._renderConversionResult(seireki, (ageText) => {
      const note = (seireki > new Date().getFullYear()) ? messages.FUTURE_YEAR_NOTE : "";

      const mainText = `西暦 ${seireki} 年`;
      return this._createResultHTML('bi-calendar-check-fill', mainText, note, ageText, 'text-primary');

    });

  }

  /**
   * 西暦→和暦
   */
  handleSeirekiToWareki() {

    // １．入力値が空の場合はリセット
    if (this.repo.emperorData.length === 0) {
      renderResult(messages.LOADING_EMPEROR);
      return;
    }    
  
    // ２．年の入力値取得
    const seireki = parseInt(this.elements.seirekiInput.value, 10);
    const validation = validateSeirekiInput(seireki, this.repo.emperorData);

    // ３．入力チェック
    if (validation) {
      renderResult(`<span class="text-danger fw-bold">${validation}</span>`);
      return;
    }

    // 大化以前の処理
    if (seireki < 645) {
      renderEmperorEra(seireki, this.repo.emperorData);
      return; 
    }

    // ４．和暦変換
    const wareki = this.converter.toWareki(seireki);
    // 結果が空の場合はエラーメッセージ
    if (!wareki || wareki.length === 0) {
      renderResult(messages.NO_GENGOU);
      return;
    }

    // ５．結果を描画(UI更新)
    // 先頭をセレクトボックスに反映
    $(this.elements.gengouSelect).val(wareki[0].gengou).trigger('change');
    // 和暦入力欄に反映
    this.elements.warekiInput.value = wareki[0].year;

    this._renderConversionResult(seireki, (ageText) => {
      const note = (seireki > new Date().getFullYear()) ? messages.FUTURE_YEAR_NOTE : "";

      // ↓ 和暦変換用のHTMLだけを定義する
      const texts = wareki.map(r => `${r.gengou}${r.year === 1 ? '元' : r.year}年`);      
      const mainText = texts.join(" / ");
      // ↓ 新しい共通メソッドを呼び出す
      return this._createResultHTML('bi-calendar-event-fill', mainText, note, ageText);

    });

  };

  /**
    * 現在の年齢表示を更新する関数
    */
  updateCurrentAgeDisplay() {
    const birthdateValue = this.elements.birthdateInput.value;
    // 常に「今日」を基準に現在の年齢を計算
    const age = this.calculateAge(new Date(), birthdateValue);
    const displayElement = this.elements.currentAgeDisplay;
  
    if (age !== null && age >= 0) {
      displayElement.textContent = `(現在 ${age} 歳)`;
    } else {
      displayElement.textContent = '';
    }
    
  }

  /**
  * 今年の和暦と西暦を表示する
  */
  thisYearDisplay(){
    // 1. 今日の日付から現在の西暦を取得
    const today = new Date();
    const currentSeireki = today.getFullYear();

    // 2. 西暦入力欄に現在の西暦をセット
    this.elements.seirekiInput.value = currentSeireki;

    // 3. converterを使って現在の西暦を和暦に変換
    const warekiResult = this.converter.toWareki(currentSeireki);

    // 4. 変換結果が存在すれば、和暦の入力欄にもセット
    if (warekiResult && warekiResult.length > 0) {
      const currentWareki = warekiResult[0]; // 最新の元号を取得
      
      // 和暦の年をセット
      this.elements.warekiInput.value = currentWareki.year;
      
      // Select2で初期化されたセレクトボックスの値を更新
      $(this.elements.gengouSelect).val(currentWareki.gengou).trigger('change');
    }

  }

  /**
    * 入力項目の初期化
    */
  clearValue(){
    // 入力欄をクリア
    this.elements.gengouSelect.value = '';
    this.elements.warekiInput.value = '';
    this.elements.seirekiInput.value = '';
    this.elements.birthdateInput.value = '';
    this.updateCurrentAgeDisplay();
    
    // セレクトボックスの選択をリセット
    $(this.elements.gengouSelect).val(null).trigger('change');
    
    // 結果表示をクリア
    renderResult('');
  }    
    
  /**
   * [共通] 変換結果と年齢計算をまとめて描画する
   * @param {number} targetYear - 年齢計算の基準となる西暦
   * @param {function} renderContentFn - 結果表示用のHTMLを生成する関数
   * @private
  */
 _renderConversionResult(targetYear, renderContentFn) {
   // 【共通処理】生年月日を取得し、年齢情報のテキストを生成する
   const birthdate = this.elements.birthdateInput.value;
   const ageInfo = this.getAgeInfo(targetYear, birthdate);
   const ageText = this.formatAgeText(ageInfo, birthdate);
   
   // 【個別処理】引数で渡された関数を呼び出して、最終的なHTMLを生成・描画する
   renderResult(renderContentFn(ageText));

  }

  /**
    * 指定された西暦と生年月日から、年齢に関する情報をオブジェクトとして取得する
    * @param {number} targetYear - 基準となる西暦
    * @param {string} birthdateString - "YYYY-MM-DD"形式の生年月日
    * @returns {object|null} - 年齢情報。生年月日が無効な場合はnull。
    */
  getAgeInfo(targetYear, birthdateString) {
    if (!birthdateString || !targetYear) return null;
  
    const targetDate = new Date(targetYear, 11, 31); // その年の大晦日を基準
    const age = this.calculateAge(targetDate, birthdateString);
  
    if (age === null) return null;
  
    if (age >= 0) {
      return {
        status: 'born',
        age: age,
        isCurrentYear: targetYear === new Date().getFullYear()
      };
    } else {
      return {
        status: 'unborn',
        age: null,
        isCurrentYear: false
      };
    }
  }

    /**
    * 指定された西暦と生年月日から、年齢を計算する汎用関数
    * @param {Date} baseDate - 基準日
    * @param {string} birthdateString - "YYYY-MM-DD"形式の生年月日文字列
    * @returns {number|null} - 満年齢。不正な日付の場合はnullを返す。
    */
  calculateAge(baseDate, birthdateString) {
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
    * 年齢情報オブジェクトを元に、表示用のHTML文字列を生成する
    * @param {object} ageInfo - getAgeInfoが返すオブジェクト
    * @param {string} birthdateString - "YYYY-MM-DD"形式の生年月日
    * @returns {string} - 年齢表示用のHTML文字列
    */
  formatAgeText(ageInfo, birthdateString) {
    if (!ageInfo) return '';
  
    const formattedBirthdate = birthdateString.replaceAll('-', '/');
    
    if (ageInfo.status === 'born') {
      const label = `${formattedBirthdate}生まれの人 ${ageInfo.isCurrentYear ? '現在：' : ''}`;
      return `<span class="text-muted ms-2"><br>(${label} ${ageInfo.age} 歳)</span>`;
    }
    
    if (ageInfo.status === 'unborn') {
      return `<span class="text-secondary ms-2"><br>${formattedBirthdate}生まれの人 当時はまだ生まれていません</span>`;
    }
  
    return '';
  }
  
  /**
   * [共通] 変換結果の表示用HTMLを生成する
   * @param {string} iconClass - Bootstrap Iconのクラス名
   * @param {string} mainText - メインで表示するテキスト
   * @param {string} note - 注釈
   * @param {string} ageText - 年齢に関するテキスト
   * @returns {string} - 描画用のHTML文字列
   * @private
   */
  _createResultHTML(iconClass, mainText, note, ageText, colorClass = 'text-success') {
    return `
      <i class="bi ${iconClass} me-2"></i>
      <span class="${colorClass} fw-bold fs-4">${mainText}</span>
      ${note}
      ${ageText}
    `;
  }

  /**
    * 入力値を半角数字のみに整形し、桁数も制限するハンドラ
    * @param {Event} event
    */
  handleNumericInput(event) {
    const input = event.target;
    // HTMLからmaxlength属性の値を取得する
    const maxLength = parseInt(input.getAttribute('maxlength'), 10);

    // 全角を半角に変換し、さらに数字以外の文字を削除する
    let sanitizedValue = zenkakuToHankaku(input.value).replace(/[^0-9]/g, '');

    // maxlength属性があり、その桁数を超えていればカットする
    if (maxLength && sanitizedValue.length > maxLength) {
      sanitizedValue = sanitizedValue.slice(0, maxLength);
    }

    // 整形した値と入力値が異なれば、入力値を更新する
    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }
  }

}

// アプリケーションの起動 
document.addEventListener('DOMContentLoaded', () => {
  const app = new WarekiApp();
  app.init();
})

