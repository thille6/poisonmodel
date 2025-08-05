const { factorial, simplePoissonProbability, calculateBivariatePoissonMatrix, calculate1X2Probabilities, calculateBTTS, calculateOverUnder25, calculateValueIndicator } = require('./calculations');

describe('Calculations Module', () => {
  test('factorial of 0 should be 1', () => {
    expect(factorial(0)).toBe(1);
  });

  test('factorial of 5 should be 120', () => {
    expect(factorial(5)).toBe(120);
  });

  test('simplePoissonProbability for k=0, lambda=1 should be approx 0.3679', () => {
    expect(simplePoissonProbability(0, 1)).toBeCloseTo(0.3679, 4);
  });

  test('calculateBivariatePoissonMatrix returns a matrix with total prob approx 1', () => {
    const matrix = calculateBivariatePoissonMatrix(1.5, 1.0, 0.2);
    const totalProb = matrix.reduce((sum, row) => sum + row.reduce((rSum, cell) => rSum + cell.probability, 0), 0);
    expect(totalProb).toBeCloseTo(1, 2);
  });

  // Lägg till fler tester för andra funktioner vid behov
});