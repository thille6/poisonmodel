/** @jest-environment jsdom */
const { updateUI, updateResultMatrix, updateSummary, updateValueIndicator, updateChartAndTopResults } = require('./ui');

describe('UI Module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="resultMatrix"></div>
      <span id="home1x2"></span>
      <span id="draw1x2"></span>
      <span id="away1x2"></span>
      <span id="homeOdds"></span>
      <span id="drawOdds"></span>
      <span id="awayOdds"></span>
      <span id="bttsYes"></span>
      <span id="bttsNo"></span>
      <span id="over25"></span>
      <span id="under25"></span>
      <span id="mostLikelyResult"></span>
      <div id="kellyResult"></div>
      <table id="probabilityTable"><tbody></tbody></table>
      <canvas id="totalGoalsChart"></canvas>
      <table id="topResultsTable"><tbody></tbody></table>
    `;
    global.Chart = jest.fn(() => ({
      destroy: jest.fn(),
    }));
  });

  test('updateSummary updates 1X2 probabilities correctly', () => {
    const outcomes = { home: 50, draw: 30, away: 20 };
    const btts = { yes: 60, no: 40 };
    const overUnder = { over: 55, under: 45 };
    const matrix = [[{ homeGoals: 0, awayGoals: 0, probability: 0.1 }]];
    updateSummary(outcomes, btts, overUnder, matrix);
    expect(document.getElementById('home1x2').textContent).toBe('50.0%');
    expect(document.getElementById('draw1x2').textContent).toBe('30.0%');
    expect(document.getElementById('away1x2').textContent).toBe('20.0%');
  });

  // Lägg till fler tester för andra funktioner vid behov
});