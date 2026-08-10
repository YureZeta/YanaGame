const board = document.getElementById('game-board');
const timerDisplay = document.getElementById('timer-display');
const foundCount = document.getElementById('found-count');
const progressFill = document.getElementById('progress-fill');
const toast = document.getElementById('toast');
const toastStack = document.getElementById('toast-stack');
const targetList = document.getElementById('target-list');
const logEl = document.getElementById('activity-log');
const timerStatus = document.getElementById('timer-status');
const restartButton = document.getElementById('restart-button');
const findButton = document.getElementById('find-button');
const spotButton = document.getElementById('spot-button');
const zoomButton = document.getElementById('zoom-button');
const pauseButton = document.getElementById('pause-button');
const mapDot = document.getElementById('map-dot');

const yanaDock = document.getElementById('yana-dock');
const yanaCard = document.getElementById('yana-card');

let timeLeft = 120;
let running = false;
let win = false;
let timerId = null;
let toastTimer = null;

const target = {
  left: 48,
  top: 36,
  width: 8,
  height: 17
};

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function addLog(message) {
  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const timeNode = document.createElement('span');
  timeNode.className = 'log-time';
  timeNode.textContent = time;

  const copyNode = document.createElement('span');
  copyNode.className = 'log-copy';
  copyNode.textContent = message;

  entry.appendChild(timeNode);
  entry.appendChild(copyNode);

  logEl.insertBefore(entry, logEl.firstChild);

  while (logEl.children.length > 10) {
    logEl.removeChild(logEl.lastElementChild);
  }
}

function setProgress(score) {
  const percent = Math.max(0, Math.min(100, (score / 8) * 100));
  progressFill.style.width = `${percent}%`;
}

function flashToast(message) {
  toast.querySelector('.toast-copy').textContent = message;
  toast.classList.remove('hidden');

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

function handleFound() {
  if (win) {
    return;
  }

  yanaCard.classList.add('found');
  yanaCard.style.outline = '3px solid var(--brand-3)';

  if (!yanaCard.dataset.found) {
    yanaCard.dataset.found = 'true';
    const score = Number(foundCount.textContent) + 1;
    foundCount.textContent = String(score);
    setProgress(score);

    const foundItem = document.createElement('li');
    foundItem.className = 'target-row';
    foundItem.innerHTML = `<span class="target-icon target-circles"></span><span>Yana</span><span class="target-status found-status">✓</span>`;

    const existingItems = Array.from(targetList.children);
    const firstRow = existingItems[0];

    if (firstRow && firstRow.querySelector('span:nth-child(2)').textContent.trim() === 'Yana') {
      firstRow.querySelector('.target-status').textContent = '✓';
      firstRow.querySelector('.target-status').classList.add('found-status');
    } else {
      targetList.insertBefore(foundItem, targetList.firstChild);
    }

    flashToast('Yana encontrada!');
    addLog('Yana localizada com sucesso');

    if (score >= 8) {
      finishGame(true);
    }
  }
}

function isInsideTarget(xPercent, yPercent) {
  const normalizedX = xPercent;
  const normalizedY = yPercent;

  const left = target.left;
  const right = target.left + target.width;
  const top = target.top;
  const bottom = target.top + target.height;

  return normalizedX >= left && normalizedX <= right && normalizedY >= top && normalizedY <= bottom;
}

function updateMapPosition(xPercent, yPercent) {
  const mapLeft = Math.max(4, Math.min(90, xPercent));
  const mapTop = Math.max(6, Math.min(88, yPercent));

  mapDot.style.left = `${mapLeft}%`;
  mapDot.style.top = `${mapTop}%`;
}

function handleSearch(event) {
  if (!running) {
    startGame();
  }

  const rect = board.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const xPercent = (x / rect.width) * 100;
  const yPercent = (y / rect.height) * 100;
  const hit = isInsideTarget(xPercent, yPercent);

  updateMapPosition(xPercent, yPercent);

  if (hit) {
    handleFound();
  } else {
    flashToast('Zona de busca');
    addLog('Local marcado');
  }
}

function startGame() {
  if (running) {
    return;
  }

  running = true;
  win = false;
  timeLeft = 120;
  timerStatus.textContent = 'Ativo';
  timerStatus.classList.remove('paused');

  timerDisplay.textContent = formatTime(timeLeft);

  timerId = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft <= 0) {
      timeLeft = 0;
      finishGame(false);
      timerDisplay.textContent = formatTime(0);
      return;
    }

    timerDisplay.textContent = formatTime(timeLeft);
  }, 1000);

  addLog('Busca iniciada');
}

function finishGame(won) {
  running = false;
  win = won;

  clearInterval(timerId);

  if (won) {
    timerStatus.textContent = 'Concluído';
    flashToast('Missão concluída!');
    addLog('Missão concluída');
  } else {
    timerStatus.textContent = 'Tempo esgotado';
    flashToast('Tempo esgotado');
    addLog('Tempo esgotado');
  }
}

function resetGame() {
  clearInterval(timerId);

  timeLeft = 120;
  running = false;
  win = false;
  foundCount.textContent = '0';
  setProgress(0);
  timerDisplay.textContent = formatTime(timeLeft);
  timerStatus.textContent = 'Ativo';

  yanaCard.classList.remove('found');
  yanaCard.style.outline = 'none';
  yanaCard.dataset.found = '';

  const rows = targetList.querySelectorAll('.target-row');
  rows.forEach((row) => {
    const status = row.querySelector('.target-status');
    if (status) {
      status.textContent = '○';
      status.classList.remove('found-status');
    }
  });

  addLog('Busca reiniciada');
  startGame();
}

board.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  handleSearch(event);
});

findButton.addEventListener('click', () => {
  const x = target.left + target.width / 2;
  const y = target.top + target.height / 2;

  const boardRect = board.getBoundingClientRect();
  const xPx = (x / 100) * boardRect.width;
  const yPx = (y / 100) * boardRect.height;

  const clickEvent = {
    clientX: boardRect.left + xPx,
    clientY: boardRect.top + yPx
  };

  handleSearch(clickEvent);
});

spotButton.addEventListener('click', () => {
  const marker = document.createElement('div');
  marker.className = 'spot-marker';

  const x = target.left + target.width / 2;
  const y = target.top + target.height / 2;

  marker.style.left = `${x}%`;
  marker.style.top = `${y}%`;

  board.appendChild(marker);

  marker.animate([
    { transform: 'scale(0.9)', opacity: 0.85 },
    { transform: 'scale(1.12)', opacity: 1 },
    { transform: 'scale(0.78)', opacity: 0.15 }
  ], {
    duration: 700,
    easing: 'ease-out'
  }).onfinish = () => marker.remove();
});

zoomButton.addEventListener('click', () => {
  board.classList.toggle('zoomed');
});

pauseButton.addEventListener('click', () => {
  if (running) {
    running = false;
    clearInterval(timerId);
    timerStatus.textContent = 'Pausado';
    pauseButton.querySelector('span').textContent = '▶';
    addLog('Jogo pausado');
  } else {
    startGame();
    pauseButton.querySelector('span').textContent = '⏸';
  }
});

restartButton.addEventListener('click', () => {
  resetGame();
});

function tndConfigureAssets() {
  const assetMap = {
    background: 'assets/forest.svg',
    miniMap: 'assets/mini-map.svg'
  };

  return assetMap;
}

function hydrateAssets(assetMap) {
  board.querySelector('.board-background').style.backgroundImage = `url("${assetMap.background}")`;
}

function bootstrap() {
  const assets = tndConfigureAssets();
  hydrateAssets(assets);
  startGame();
}

bootstrap();
