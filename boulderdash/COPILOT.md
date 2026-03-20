# Boulder Dash PWA

## Architektura
Cała gra jest w jednym pliku: `index.html`
Zero zewnętrznych bibliotek, czysty HTML/CSS/JS (ES6).

## Struktura kodu w index.html
- CSS: style mobilne, HUD, overlay, d-pad, splash screen
- Pixel sprites: funkcje drawSpr(), drawDiamond(), drawPlayer() — tylko fillRect()
- Generator poziomów: generateLevel(lvl) — seeded RNG, rośnie z poziomem
- Fizyka: physics() — kamienie/diamenty spadają, gracz je blokuje
- Ruch: move(dr, dc) — wywoływany przez d-pad i klawiaturę
- Render: render() — scrollujący viewport VW×VH kafelków
- Leaderboard: lbLoad/lbSave/lbAdd — localStorage
- PWA: manifest.json + sw.js (cache: boulderdash-v2)

## Ważne zmienne
- T = 16 (tile size px)
- VW, VH, PX — wymiary viewportu, obliczane w resize()
- ROWS, COLS — rozmiar aktualnej mapy (zmienny!)
- dyingLock — mutex zapobiegający wielokrotnej śmierci

## Czego nie ruszać
- generateLevel() — delikatna logika RNG
- physics() — logika falling[] i blokowania przez gracza
- resize() — obliczanie VW/VH/PX