# Ache Yana

Este repositório tem uma implementação estática em HTML5, CSS3 e JavaScript para um jogo tipo "Ache Yana" com uma UI adaptativa para mouse e touch screen.

## Estrutura

- `index.html` — layout principal e composição visual do jogo.
- `styles.css` — estilos responsivos e visual completo da interface.
- `game.js` — interações do jogo, contagem regressiva, rastreamento e eventos para clique/touch.
- `assets/forest.svg` — imagem de fundo principal da cena.
- `assets/mini-map.svg` — mini mapa opcional visual.

## Customização de assets

Para trocar a imagem do cenário e o mini-mapa, edite os arquivos SVG na pasta `assets/`.

Se quiser usar outras imagens/fundos, mantenha os mesmos caminhos relativos e atualize os nomes das imagens no código.

## Documentação de manutenção

O código é organizado em três camadas:

- `index.html` define a estrutura visual em blocos: cabeçalho, painel lateral esquerdo, cenário com `game-board`, painel lateral direito e mini mapa.
- `styles.css` concentra a aparência visual completa: grid, cores, ícones, estados de foco, toast, log e elementos do tabuleiro.
- `game.js` concentra a lógica do jogo: cronômetro, busca, animações, status e atualização dinâmicas da interface.

A função `startGame()` inicia temporizador e muda o estado de execução. A função `handleSearch()` converte coordenadas de clique/touch em percentuais do tabuleiro e usa `isInsideTarget()` para decidir se a busca acertou a localização esperada de Yana. Quando a busca tem sucesso, `handleFound()` incrementa a contagem, atualiza a lista e emite a mensagem com `flashToast()`.

O arquivo `game.js` também contém `resetGame()` para limpar todos os dados visuais e `bootstrap()` para carregar os assets e iniciar o ciclo do jogo.

## GitHub Pages

Como é uma aplicação estática, o GitHub Pages pode publicar esse diretório diretamente com suporte a `index.html`, `styles.css`, `game.js` e os assets em `assets/`.
