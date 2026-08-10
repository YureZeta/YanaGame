// Elementos principais da interface do jogo que são usados em vários pontos do código.
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

// A área visual do alvo no tabuleiro e o cartão do personagem encontrado.
const yanaDock = document.getElementById('yana-dock');
const yanaCard = document.getElementById('yana-card');

// Estado de execução do jogo e cronômetro.
let timeLeft = 120;
let running = false;
let win = false;
let timerId = null;
let toastTimer = null;

// Coordenadas em percentual da área do tabuleiro onde Yana está localizada.
const target = {
  left: 48,
  top: 36,
  width: 8,
  height: 17
};

// Converte segundos em formato MM:SS para exibir o tempo restante.
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Registra uma ação no relatório e mantém apenas as últimas 10 entradas.
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

// Atualiza a barra de progresso da missão com base no número de alvos descobertos.
function setProgress(score) {
  const percent = Math.max(0, Math.min(100, (score / 8) * 100));
  progressFill.style.width = `${percent}%`;
}

// Exibe uma mensagem temporária na interface e a limpa ao fim do tempo configurado.
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

// Processa a identificação do alvo quando a busca coincide com a posição de Yana.
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

// Verifica se um ponto do tabuleiro cai dentro do retângulo alvo definido para Yana.
function isInsideTarget(xPercent, yPercent) {
  const normalizedX = xPercent;
  const normalizedY = yPercent;

  const left = target.left;
  const right = target.left + target.width;
  const top = target.top;
  const bottom = target.top + target.height;

  return normalizedX >= left && normalizedX <= right && normalizedY >= top && normalizedY <= bottom;
}

// Ajusta a posição visual do marcador no mini mapa com base na coordenada de busca.
function updateMapPosition(xPercent, yPercent) {
  const mapLeft = Math.max(4, Math.min(90, xPercent));
  const mapTop = Math.max(6, Math.min(88, yPercent));

  mapDot.style.left = `${mapLeft}%`;
  mapDot.style.top = `${mapTop}%`;
}

// Coordena uma tentativa de busca na cena: inicia, converte clique/touch e decide se houve acerto.
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

// Inicia o timer do jogo e prepara o estado inicial da corrida de busca.
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

// Encerra a partida e atualiza a mensagem de estado visual a partir de resultado específico.
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

// Reinicializa o estado do jogo para o início de uma nova sessão.
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

// Escuta direta de toque e clique no tabuleiro para localizar a resposta do usuário.
board.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  handleSearch(event);
});

// Botão de confirmação do alvo usando a geometria conhecida do tabuleiro.
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

// Cria um marcador de visualização apontando para a localização esperada do alvo.
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

// Alterna o zoom visual do quadro do tabuleiro para manter o foco no cenário.
zoomButton.addEventListener('click', () => {
  board.classList.toggle('zoomed');
});

// Pausa ou retoma a execução dependendo do estado do jogo.
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

// Reinicia a cena por meio de um reset completo do estado.
restartButton.addEventListener('click', () => {
  resetGame();
});

// Centraliza o caminho dos assets da interface e seu carregamento inicial.
function tndConfigureAssets() {
  const assetMap = {
    background: 'assets/forest.svg',
    miniMap: 'assets/mini-map.svg'
  };

  return assetMap;
}

// Atribui o background principal do tabuleiro a partir do mapa de assets configurado.
function hydrateAssets(assetMap) {
  board.querySelector('.board-background').style.backgroundImage = `url("${assetMap.background}")`;
}

// Inicializa o jogo e aplica as configurações da UI estáticas.
function bootstrap() {
  const assets = tndConfigureAssets();
  hydrateAssets(assets);
  startGame();
}

bootstrap();
