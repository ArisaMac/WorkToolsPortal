const visualizer = document.getElementById('visualizer');
const generateBtn = document.getElementById('generate-btn');
const sortBtn = document.getElementById('sort-btn');
const bottomControls = document.getElementById('bottom-controls');
const playbackControls = document.getElementById('playback-controls');
const sizeSlider = document.getElementById('size-slider');
const speedSlider = document.getElementById('speed-slider');
const explanationText = document.getElementById('explanation-text');
const currentPivotValue = document.getElementById('current-pivot-value');
const prevStepBtn = document.getElementById('prev-step-btn');
const nextStepBtn = document.getElementById('next-step-btn');
const playPauseBtn = document.getElementById('play-pause-btn');

let array = [];
let speed = 250;

let history = [];
let currentStep = -1;
let isAutoplaying = false;
let autoplayInterval = null;
let isPlaybackMode = false;

// --- イベントリスナー ---
generateBtn.addEventListener('click', generateArray);
sortBtn.addEventListener('click', startPlaybackMode);

speedSlider.addEventListener('input', (e) => {
    speed = 1050 - e.target.value;
    if (isAutoplaying) {
        pauseAutoplay();
        playAutoplay();
    }
});

nextStepBtn.addEventListener('click', () => {
    pauseAutoplay();
    stepForward();
});

prevStepBtn.addEventListener('click', () => {
    pauseAutoplay();
    stepBackward();
});

playPauseBtn.addEventListener('click', () => {
    if (isAutoplaying) {
        pauseAutoplay();
    } else {
        playAutoplay();
    }
});

// --- UI表示切り替え ---
function showInitialControls() {
    sortBtn.classList.remove('hidden');
    playbackControls.classList.add('hidden');
}

function showPlaybackControls() {
    sortBtn.classList.add('hidden');
    playbackControls.classList.remove('hidden');
}

// --- 状態管理とUI更新 ---
function resetSortState() {
    isPlaybackMode = false;
    history = [];
    currentStep = -1;
    pauseAutoplay();
    showInitialControls();
}

function updatePlaybackControls() {
    prevStepBtn.disabled = currentStep <= 0;
    nextStepBtn.disabled = currentStep >= history.length - 1;
    playPauseBtn.disabled = history.length === 0 || currentStep >= history.length - 1;
}

function updateExplanation(text) {
    explanationText.innerHTML = text;
}

// --- 自動再生ロジック ---
function playAutoplay() {
    if (currentStep >= history.length - 1) return;
    isAutoplaying = true;
    playPauseBtn.textContent = '一時停止';
    autoplayInterval = setInterval(() => {
        if (currentStep < history.length - 1) {
            stepForward();
        } else {
            pauseAutoplay();
        }
    }, speed);
}

function pauseAutoplay() {
    isAutoplaying = false;
    playPauseBtn.textContent = '自動再生';
    clearInterval(autoplayInterval);
}

// --- ステップ移動ロジック ---
function stepForward() {
    if (currentStep < history.length - 1) {
        currentStep++;
        renderStep(history[currentStep]);
    }
}

function stepBackward() {
    if (currentStep > 0) {
        currentStep--;
        renderStep(history[currentStep]);
    }
}

// --- 配列生成と描画 ---
function generateArray() {
    resetSortState();
    array = [];
    visualizer.innerHTML = '';
    currentPivotValue.textContent = '--';
    const size = sizeSlider.value;
    for (let i = 0; i < size; i++) {
        array.push(Math.floor(Math.random() * 75) + 15);
    }
    renderBars(array, {});
    updateExplanation('新しい配列が生成されました。「ソート開始」または「チュートリアル」を選択してください。');
}

function renderBars(arr, highlights) {
    visualizer.innerHTML = ''; // Clear everything first

    // 枠線を先に追加
    const partitionBox = document.createElement('div');
    partitionBox.id = 'partition-box';
    partitionBox.className = 'absolute border-2 border-red-500 rounded-lg pointer-events-none transition-all duration-300 ease-in-out';
    partitionBox.style.opacity = '0'; // Initially hidden
    visualizer.appendChild(partitionBox);

    arr.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.style.height = `${value}%`;
        bar.classList.add('bar', 'bg-cyan-400');
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'bar-value';
        valueSpan.textContent = value;
        bar.appendChild(valueSpan);

        if (highlights.sortedIndices?.includes(index)) bar.classList.add('sorted');
        if (index === highlights.pivotIndex) bar.classList.add('pivot');
        if (index === highlights.currentIndex) bar.classList.add('comparing');
        if (index >= highlights.low && index <= highlights.smallerIndex) bar.classList.add('smaller');

        visualizer.appendChild(bar);
    });
}

function renderStep(step) {
    renderBars(step.arrayState, step);
    updateExplanation(step.explanation);
    currentPivotValue.textContent = step.pivotValue ?? '--';
    updatePlaybackControls();

    // 枠線の位置を更新
    const partitionBox = document.getElementById('partition-box');
    const bars = Array.from(visualizer.getElementsByClassName('bar'));

    if (bars.length > 0 && step.low !== undefined && step.high !== undefined && step.low <= step.high) {
        const firstBar = bars[step.low];
        const lastBar = bars[step.high];
        
        if (firstBar && lastBar) {
            const visualizerRect = visualizer.getBoundingClientRect();
            const firstBarRect = firstBar.getBoundingClientRect();
            const lastBarRect = lastBar.getBoundingClientRect();

            const left = firstBarRect.left - visualizerRect.left;
            const width = lastBarRect.right - firstBarRect.left;
            
            partitionBox.style.left = `${left - 4}px`;
            partitionBox.style.width = `${width + 8}px`;
            partitionBox.style.top = '-4px';
            partitionBox.style.height = 'calc(100% + 8px)';
            partitionBox.style.opacity = '1';
        } else {
            partitionBox.style.opacity = '0';
        }
    } else {
        partitionBox.style.opacity = '0';
    }

    if (currentStep >= history.length - 1) {
        pauseAutoplay();
        currentPivotValue.textContent = '✓';
        partitionBox.style.opacity = '0';
    }
}

// --- チュートリアルとソートロジック ---
function startPlaybackMode() {
    if (isPlaybackMode || array.length === 0) return;
    isPlaybackMode = true;
    
    showPlaybackControls();
    
    generateSortSteps(array);
    currentStep = 0;
    renderStep(history[currentStep]);
}

// --- チュートリアル用ステップ生成 ---
function generateSortSteps(arr) {
    const tempArr = [...arr];
    const sortedIndices = [];
    history.push({ arrayState: [...tempArr], low: 0, high: arr.length - 1, explanation: "ソートを開始します。まず、全体を１つのグループとして並び替えます。", sortedIndices: [] });
    quickSortRecursive(tempArr, 0, arr.length - 1, sortedIndices);
    history.push({ arrayState: [...tempArr], explanation: "すべてのグループが並び替えられ、ソートが完了しました！", sortedIndices: tempArr.map((_, i) => i) });
}

function quickSortRecursive(arr, low, high, sortedIndices) {
    if (low >= high) { if(low === high) sortedIndices.push(low); return; }
    history.push({ arrayState: [...arr], low, high, sortedIndices: [...sortedIndices], explanation: `<strong class="text-red-500">【分割】</strong><br>このグループ（赤い線で囲まれた範囲）を並び替えます。` });
    const pivotValue = arr[high];
    let i = low - 1;
    history.push({ arrayState: [...arr], low, high, pivotIndex: high, pivotValue, sortedIndices: [...sortedIndices], explanation: `まず、グループの右端にある<strong class="text-orange-500">「${pivotValue}」</strong>を基準（ピボット）にします。` });
    for (let j = low; j < high; j++) {
        history.push({ arrayState: [...arr], low, high, pivotIndex: high, pivotValue, currentIndex: j, smallerIndex: i, sortedIndices: [...sortedIndices], explanation: `紫色の<strong class="text-purple-500">「${arr[j]}」</strong>と、基準の<strong class="text-orange-500">「${pivotValue}」</strong>を比べます。` });
        if (arr[j] < pivotValue) {
            i++;
            const val1 = arr[i];
            const val2 = arr[j];
            [arr[i], arr[j]] = [arr[j], arr[i]];
            history.push({ arrayState: [...arr], low, high, pivotIndex: high, pivotValue, currentIndex: j, smallerIndex: i, sortedIndices: [...sortedIndices], explanation: `<strong class="text-blue-500">「${val2}」</strong>は基準より小さいので、青いグループの右隣にある「${val1}」と場所を交換しました。` });
        }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    const pivotFinalIndex = i + 1;
    sortedIndices.push(pivotFinalIndex);
    history.push({ arrayState: [...arr], low, high, pivotIndex: pivotFinalIndex, pivotValue, sortedIndices: [...sortedIndices], explanation: `基準だった<strong class="text-orange-500">「${pivotValue}」</strong>を、大小２つのグループの間に移動させます。これでこの数字の位置は確定です！` });
    history.push({ arrayState: [...arr], low, high, pivotIndex: pivotFinalIndex, pivotValue, sortedIndices: [...sortedIndices], explanation: `<strong class="text-green-500">【統治】</strong><br>１つのグループが、確定した基準を境に２つの小さなグループに分かれました。これを繰り返します。` });
    quickSortRecursive(arr, low, pivotFinalIndex - 1, sortedIndices);
    quickSortRecursive(arr, pivotFinalIndex + 1, high, sortedIndices);
}

// --- 初期化 ---
window.onload = () => {
    generateArray();
};