// DOM要素の取得
const visualizer = document.getElementById('visualizer');
const generateBtn = document.getElementById('generate-btn');
const sortBtn = document.getElementById('sort-btn');
const tutorialBtn = document.getElementById('tutorial-btn');
const prevStepBtn = document.getElementById('prev-step-btn');
const nextStepBtn = document.getElementById('next-step-btn');
const autoPlayBtn = document.getElementById('auto-play-btn');
const speedSlider = document.getElementById('speed-slider');
const initialControls = document.getElementById('initial-controls');
const sortingControls = document.getElementById('sorting-controls');
const explanationText = document.getElementById('explanation-text');

let originalArray = [], array = [], history = [];
let currentStep = -1;
let isAutoPlaying = false;
let autoPlayTimeoutId = null;
let delay = 2100 - speedSlider.value;
let isInitialLoad = true;

const ARRAY_SIZE = 8, MAX_VALUE = 100, BUBBLE_SIZE = 60;

const stopAutoPlay = () => {
    isAutoPlaying = false;
    if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
    autoPlayBtn.textContent = '自動再生';
    autoPlayBtn.disabled = false;
    nextStepBtn.disabled = currentStep >= history.length - 1;
    prevStepBtn.disabled = currentStep <= 0;
};

const generateArray = () => {
    stopAutoPlay();
    history = [];
    currentStep = -1;
    originalArray = Array.from({length: ARRAY_SIZE}, () => Math.floor(Math.random() * MAX_VALUE) + 5);
    array = [...originalArray];
    setTimeout(() => renderArray(array), 0);
    
    if (isInitialLoad) {
        explanationText.innerHTML = "「ソート開始」または「チュートリアル」ボタンを押して開始してください。";
        isInitialLoad = false;
    } else {
        explanationText.innerHTML = "新しい配列が生成されました。「ソート開始」または「チュートリアル」ボタンを押してください。";
    }
    
    setUiState('initial');
};

const renderArray = (arr, comparingIndices = [], swappedIndices = [], sortedIndex = -1) => {
    if (!arr) return;
    visualizer.querySelectorAll('.bubble').forEach(el => el.remove());
    const containerWidth = visualizer.clientWidth;
    const containerHeight = visualizer.clientHeight;
    
    const panelHeight = sortingControls.classList.contains('hidden') ? 0 : sortingControls.offsetHeight + 16;
    const availableHeight = containerHeight - panelHeight;

    const totalBubbleWidth = arr.length * BUBBLE_SIZE;
    const gap = (containerWidth - totalBubbleWidth) / (arr.length + 1);

    arr.forEach((value, index) => {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = value;
        bubble.style.left = `${gap * (index + 1) + (index * BUBBLE_SIZE)}px`;
        
        const maxBottom = availableHeight - BUBBLE_SIZE - 10;
        bubble.style.bottom = `${(value / MAX_VALUE) * maxBottom + panelHeight}px`;

        if (index >= sortedIndex && sortedIndex !== -1) bubble.classList.add('sorted');
        else if (comparingIndices.includes(index)) bubble.classList.add('comparing');
        else if (swappedIndices.includes(index)) bubble.classList.add('swapped');
        
        visualizer.appendChild(bubble);
    });
};

const renderStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= history.length) return;
    const step = history[stepIndex];
    array = [...step.arrayState];
    renderArray(step.arrayState, step.comparing, step.swapped, step.sorted);
    explanationText.innerHTML = step.explanation;
    
    prevStepBtn.disabled = stepIndex <= 0;
    nextStepBtn.disabled = stepIndex >= history.length - 1;
    if(stepIndex >= history.length - 1) {
        stopAutoPlay();
        autoPlayBtn.disabled = true;
    } else {
        autoPlayBtn.disabled = false;
    }
};

const setUiState = (state) => {
    if (state === 'initial' || state === 'finished') {
        initialControls.classList.remove('hidden');
        sortingControls.classList.add('hidden');
    } else if (state === 'sorting') {
        initialControls.classList.add('hidden');
        sortingControls.classList.remove('hidden');
    }
};

const nextStep = () => {
    if (currentStep < history.length - 1) {
        currentStep++;
        renderStep(currentStep);
    }
};

const prevStep = () => {
    if (currentStep > 0) {
        currentStep--;
        renderStep(currentStep);
    }
};

const startAutoPlay = () => {
    if (!isAutoPlaying) return;
    if (currentStep < history.length - 1) {
        nextStep();
        autoPlayTimeoutId = setTimeout(startAutoPlay, delay);
    } else {
        stopAutoPlay();
    }
};

const calculateSortHistory = (isTutorial) => {
    history = [];
    let tempArray = [...originalArray];
    const n = tempArray.length;
    
    const addHistoryStep = (arr, comp, swap, sort, exp) => {
        history.push({ arrayState: [...arr], comparing: [...comp], swapped: [...swap], sorted: sort, explanation: exp });
    };

    if (isTutorial) {
        addHistoryStep(tempArray, [], [], -1, "こんにちは！バブルソートを学んでいきましょう。<br><b>【一言でいうと？】</b> バブルソートは<b>『隣同士を比べて、順番が逆なら入れ替える』</b>を繰り返す、とてもシンプルな方法です。");
        addHistoryStep(tempArray, [], [], -1, "<b>【人間とどう違う？】</b> 私たちがカードを並べる時は、全体から一番小さいものを探しますよね。<br>でもバブルソートは<b>隣しか見えません。</b>この『視野の狭さ』がポイントです。");
    } else {
        addHistoryStep(tempArray, [], [], -1, "ソートを開始します。左端から隣同士の比較を始めます。");
    }

    for (let i = 0; i < n - 1; i++) {
        let swappedInPass = false;
        for (let j = 0; j < n - i - 1; j++) {
            addHistoryStep(tempArray, [j, j + 1], [], n - i, isTutorial ? `左から${j+1}番目の泡「${tempArray[j]}」と、隣の泡「${tempArray[j+1]}」を比べます。` : `比較中: 「${tempArray[j]}」と「${tempArray[j+1]}」`);
            if (tempArray[j] > tempArray[j + 1]) {
                [tempArray[j], tempArray[j + 1]] = [tempArray[j + 1], tempArray[j]];
                swappedInPass = true;
                addHistoryStep(tempArray, [], [j, j + 1], n - i, isTutorial ? `左の泡「${tempArray[j+1]}」の方が大きいですね。順番が逆なので、この2つを入れ替えます！` : `交換: 「${tempArray[j+1]}」 > 「${tempArray[j]}」なので入れ替えます。`);
            } else if (isTutorial) {
                addHistoryStep(tempArray, [j, j + 1], [], n - i, `左の泡「${tempArray[j]}」の方が小さいので、順番は正しいですね。このままにします。`);
            }
        }
        addHistoryStep(tempArray, [], [], n - i - 1, isTutorial ? `これで${i+1}周目が終わりました。一番大きい泡「${tempArray[n-i-1]}」が右端に確定しましたね！` : `${i+1}周目完了。最大値「${tempArray[n-i-1]}」が確定しました。`);
        if (!swappedInPass) {
            addHistoryStep(tempArray, [], [], n - i - 1, "この周回では一度も交換がありませんでした。つまり、すでに整列済みです！ソートを終了します。");
            break;
        }
    }
    
    addHistoryStep(tempArray, [], [], 0, isTutorial ? "全ての泡が整列しました！<br><b>【メリットは？】</b> ご覧の通りロジックが非常にシンプルですよね。この<b>『実装の簡単さ』</b>が最大のメリットで、アルゴリズム学習の第一歩として最適なんです。" : "ソートが完了しました！");
    if (isTutorial) {
        addHistoryStep(tempArray, [], [], 0, "<b>【どうやって生まれたの？】</b> このシンプルさから、コンピュータ科学の初期に『どうやって並べ替えを教えるか』という問いへの最も簡単な答えとして生まれ、教育の場で長く使われてきた、古典的なアルゴリズムなんですよ。お疲れ様でした！");
    }
};

const startSort = (isTutorial) => {
    stopAutoPlay();
    calculateSortHistory(isTutorial);
    currentStep = -1;
    setUiState('sorting');
    nextStep();
};

generateBtn.addEventListener('click', generateArray);
sortBtn.addEventListener('click', () => startSort(false));
tutorialBtn.addEventListener('click', () => startSort(true));
prevStepBtn.addEventListener('click', prevStep);
nextStepBtn.addEventListener('click', nextStep);
autoPlayBtn.addEventListener('click', () => {
    isAutoPlaying = !isAutoPlaying;
    if (isAutoPlaying) {
        autoPlayBtn.textContent = '一時停止';
        prevStepBtn.disabled = true;
        nextStepBtn.disabled = true;
        startAutoPlay();
    } else {
        stopAutoPlay();
    }
});
speedSlider.addEventListener('input', (e) => {
    delay = 2100 - e.target.value;
});
window.addEventListener('resize', () => {
      if (currentStep >= 0) {
        renderStep(currentStep);
      } else {
        renderArray(array);
      }
});

window.onload = generateArray;