# Poisson Model for Football Predictions

Detta projekt är en webbapplikation som använder en bivariat Poisson-modell för att förutsäga fotbollsmatchresultat baserat på förväntade mål (xG) och andra parametrar.

## Installation

1. Klona repositoriet:
   ```bash
   git clone <repo-url>
   ```
2. Installera beroenden:
   ```bash
   npm install
   ```

## Kör projektet

- För utveckling: `npm run watch` (kör Tailwind CSS watcher)
- Bygg projektet: `npm run build`
- Starta en lokal server: `npx serve dist` (eller använd en annan server för att servera `dist`-mappen)
- Öppna `http://localhost:3000` i webbläsaren.

## Modellförklaring

Applikationen använder en bivariat Poisson-distribution för att modellera antalet mål för hemmalag och bortalag. Modellen tar hänsyn till:
- Förväntade mål (xG) för hemma- och bortalag.
- Korrelation mellan lagens mål (för att hantera beroenden).
- Formfaktorer baserat på senaste matcher.

Beräkningar inkluderar:
- Sannolikheter för 1X2 (hemma, oavgjort, borta).
- BTTS (båda lagen gör mål).
- Över/Under 2.5 mål.
- Värdeindikator baserat på användarens odds.

Matrisen visar sannolikheter för specifika resultat, med visualiseringar som stapeldiagram för totala mål och topresultat.

## Användningsexempel

1. Ange xG-värden för hemma- och bortalag, korrelation och form.
2. Klicka på "Beräkna" för att se resultatmatris, sammanfattning och diagram.
3. Ange odds för att se värdeindikator.

För tester: `npm test` (kräver Jest installerat).

## Beroenden

- Tailwind CSS för styling.
- Chart.js för diagram.
- Jest för enhetstester.

Kontakta för frågor eller bidrag!