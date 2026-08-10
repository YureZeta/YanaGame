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

// Quantidade de Yanas que devem surgir por partida.
const TOTAL_YANAS = 8;

// Estado das Yanas geradas na partida para controle de descoberta.
let yanas = [];
let foundYanas = new Set();

// Coordenadas em percentual da área do tabuleiro onde a busca é analisada.
const mapBounds = {
  left: 4,
  right: 96,
  top: 6,
  bottom: 94
};

// Gera posições aleatórias para as 8 Yanas escondidas dentro do mapa.
function generateYanas() {
  const generated = [];

  while (generated.length < TOTAL_YANAS) {
    const x = 10 + Math.round(Math.random() * 78);
    const y = 12 + Math.round(Math.random() * 74);
    const key = `${x}:${y}`;

    if (!generated.some((yana) => `${yana.x}:${yana.y}` === key)) {
      generated.push({
        id: generated.length + 1,
        x,
        y,
        found: false
      });
    }
  }

  return generated;
}

// Cria o único item visual da lista de procura com imagem de Yana e total do mapa.
function renderTargetList() {
  targetList.innerHTML = '';

  const row = document.createElement('li');
  row.className = 'target-row target-row-single';

  const icon = document.createElement('span');
  icon.className = 'target-icon target-yana';

  const image = document.createElement('img');
  image.className = 'target-yana-image';
  image.src = 'assets/Sprite 1.png';
  image.alt = 'Yana';

  const label = document.createElement('span');
  label.className = 'target-copy';
  label.textContent = 'Yanas';

  const count = document.createElement('span');
  count.className = 'target-count';
  count.textContent = String(TOTAL_YANAS);

  icon.appendChild(image);

  row.appendChild(icon);
  row.appendChild(label);
  row.appendChild(count);

  targetList.appendChild(row);
}

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
  const percent = Math.max(0, Math.min(100, (score / TOTAL_YANAS) * 100));
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
function handleFound(yanaId) {
  if (win || foundYanas.has(yanaId)) {
    return;
  }

  foundYanas.add(yanaId);
  const foundYana = yanas.find((item) => item.id === yanaId);

  if (foundYana) {
    foundYana.found = true;
  }

  const score = foundYanas.size;
  foundCount.textContent = String(score);
  setProgress(score);

  const row = targetList.querySelector(`[data-yana-id="${yanaId}"]`);
  if (row) {
    const status = row.querySelector('.target-status');
    if (status) {
      status.textContent = '✓';
      status.classList.add('found-status');
    }
  }

  yanaCard.classList.add('found');
  yanaCard.style.outline = '3px solid var(--brand-3)';

  flashToast(`Yana ${String(yanaId).padStart(2, '0')} encontrada!`);
  addLog(`Yana ${String(yanaId).padStart(2, '0')} localizada com sucesso`);

  if (score >= TOTAL_YANAS) {
    finishGame(true);
  }
}

// Verifica se um ponto do tabuleiro coincide com alguma Yana escondida.
function findYanaAt(xPercent, yPercent) {
  const hit = yanas.find((yana) => {
    const xDelta = Math.abs(yana.x - xPercent);
    const yDelta = Math.abs(yana.y - yPercent);

    return xDelta <= 2.8 && yDelta <= 2.8;
  });

  return hit || null;
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
  const matchedYana = findYanaAt(xPercent, yPercent);

  updateMapPosition(xPercent, yPercent);

  if (matchedYana) {
    handleFound(matchedYana.id);
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

  yanas = generateYanas();
  foundYanas = new Set();
  renderTargetList();

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

  addLog('Busca reiniciada');
  startGame();
}

// Escuta direta de toque e clique no tabuleiro para localizar a resposta do usuário.
board.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  handleSearch(event);
});

// Botão de confirmação do alvo usando uma Yana ainda não encontrada.
findButton.addEventListener('click', () => {
  const nextYana = yanas.find((yana) => !foundYanas.has(yana.id));

  if (!nextYana) {
    flashToast('Missão concluída');
    return;
  }

  const boardRect = board.getBoundingClientRect();
  const xPx = (nextYana.x / 100) * boardRect.width;
  const yPx = (nextYana.y / 100) * boardRect.height;

  const clickEvent = {
    clientX: boardRect.left + xPx,
    clientY: boardRect.top + yPx
  };

  handleSearch(clickEvent);
});

// Cria um marcador de visualização apontando para uma Yana ainda não encontrada.
spotButton.addEventListener('click', () => {
  const nextYana = yanas.find((yana) => !foundYanas.has(yana.id)) || yanas[0];

  if (!nextYana) {
    return;
  }

  const marker = document.createElement('div');
  marker.className = 'spot-marker';

  marker.style.left = `${nextYana.x}%`;
  marker.style.top = `${nextYana.y}%`;

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
    background: 'assets/Mapa.jpeg',
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

  yanas = generateYanas();
  renderTargetList();
  foundCount.textContent = '0';

  startGame();
}

bootstrap();
