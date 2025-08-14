// calculations.js - Fullständiga beräkningsfunktioner för Poisson-modellen

// Globala variabler (om nödvändigt, men försök minimera)
let resultsData = {};

// Factorial helper
function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

// Simple Poisson
function simplePoissonProbability(k, lambda) {
    if (lambda <= 0) return (k === 0) ? 1 : 0;
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// Bivariate Poisson matrix using three-parameter model
function calculateBivariatePoissonMatrix(homeXG, awayXG, correlation) {
    // Dynamiskt justera maxGoals baserat på xG-värden
    // För låga xG-värden räcker det med färre mål, för höga xG behövs fler
    const totalXG = homeXG + awayXG;
    let maxGoals;
    
    if (totalXG < 2) {
        maxGoals = 6; // Låga xG-värden
    } else if (totalXG < 4) {
        maxGoals = 8; // Medelhöga xG-värden
    } else if (totalXG < 6) {
        maxGoals = 10; // Höga xG-värden
    } else {
        maxGoals = 12; // Mycket höga xG-värden
    }
    
    // Säkerställ att maxGoals aldrig är mindre än 6
    maxGoals = Math.max(6, maxGoals);
    
    console.log('Dynamiskt maxGoals:', maxGoals, 'baserat på totalXG:', totalXG);
    
    correlation = Math.max(0, Math.min(1, correlation)); // Clamp to 0-1 for this model
    const lambda1 = homeXG * (1 - correlation);
    const lambda2 = awayXG * (1 - correlation);
    const lambda3 = correlation * Math.min(homeXG, awayXG); // Covariance term
    const safeLambda1 = Math.max(0, lambda1);
    const safeLambda2 = Math.max(0, lambda2);
    const safeLambda3 = Math.max(0, lambda3);
    console.log('Lambda1:', safeLambda1, 'Lambda2:', safeLambda2, 'Lambda3:', safeLambda3);

    const matrix = [];
    let totalProb = 0;

    // Optimera beräkningen genom att bara beräkna sannolikheter för relevanta målantal
    // Använd en cutoff-sannolikhet för att hoppa över osannolika resultat
    const cutoffProb = 1e-6; // Hoppa över resultat med extremt låg sannolikhet
    
    for (let h = 0; h <= maxGoals; h++) {
        const row = [];
        for (let a = 0; a <= maxGoals; a++) {
            // Snabb kontroll om resultatet är osannolikt baserat på Poisson-fördelningen
            const simpleHomeProb = simplePoissonProbability(h, homeXG);
            const simpleAwayProb = simplePoissonProbability(a, awayXG);
            
            // Om både hem- och bortasannolikheterna är extremt låga, sätt sannolikheten till 0
            if (simpleHomeProb < cutoffProb && simpleAwayProb < cutoffProb) {
                row.push({ homeGoals: h, awayGoals: a, probability: 0 });
                continue;
            }
            
            let sumTerms = 0;
            for (let i = 0; i <= Math.min(h, a); i++) {
                const term = simplePoissonProbability(h - i, safeLambda1) *
                             simplePoissonProbability(a - i, safeLambda2) *
                             simplePoissonProbability(i, safeLambda3);
                sumTerms += term;
            }
            let prob = sumTerms;
            if (isNaN(prob) || prob < 0) prob = 0;
            row.push({ homeGoals: h, awayGoals: a, probability: prob });
            totalProb += prob;
        }
        matrix.push(row);
    }
    console.log('Total probability before normalization:', totalProb);

    // Normalisera om nödvändigt (bör vara nära 1, men för säkerhet)
    if (totalProb > 0 && Math.abs(totalProb - 1) > 1e-6) {
        for (let row of matrix) for (let cell of row) cell.probability /= totalProb;
    }
    console.log('Total probability after normalization:', matrix.reduce((sum, row) => sum + row.reduce((rSum, cell) => rSum + cell.probability, 0), 0));
    return matrix;
}

// 1X2 probabilities
function calculate1X2Probabilities(matrix) {
    let home = 0, draw = 0, away = 0;
    for (let row of matrix) {
        for (let cell of row) {
            if (cell.homeGoals > cell.awayGoals) home += cell.probability;
            else if (cell.homeGoals === cell.awayGoals) draw += cell.probability;
            else away += cell.probability;
        }
    }
    // Undvik 0-prob
    home = Math.max(0.001, home);
    draw = Math.max(0.001, draw);
    away = Math.max(0.001, away);
    const total = home + draw + away;
    return { home: home / total * 100, draw: draw / total * 100, away: away / total * 100 };
}

// BTTS
function calculateBTTS(matrix) {
    let yes = 0, no = 0;
    for (let row of matrix) for (let cell of row) {
        if (cell.homeGoals > 0 && cell.awayGoals > 0) yes += cell.probability;
        else no += cell.probability;
    }
    yes = Math.max(0.001, yes);
    no = Math.max(0.001, no);
    const total = yes + no;
    return { yes: yes / total * 100, no: no / total * 100 };
}

// Over/Under 2.5
function calculateOverUnder25(matrix) {
    let over = 0, under = 0;
    for (let row of matrix) for (let cell of row) {
        if (cell.homeGoals + cell.awayGoals > 2.5) over += cell.probability;
        else under += cell.probability;
    }
    over = Math.max(0.001, over);
    under = Math.max(0.001, under);
    const total = over + under;
    return { over: over / total * 100, under: under / total * 100 };
}

// Value indicator
function calculateValueIndicator(outcomes, userOdds, betType) {
    let prob = 0;
    if (betType === 'home') prob = outcomes.home / 100;
    else if (betType === 'draw') prob = outcomes.draw / 100;
    else if (betType === 'away') prob = outcomes.away / 100;
    if (prob === 0) prob = 0.001;
    const fairOdds = 1 / prob;
    const value = ((userOdds * prob) - 1) * 100;
    return { fairOdds: isFinite(fairOdds) ? fairOdds.toFixed(2) : 'Infinity', value: isFinite(value) ? value.toFixed(2) : '0' };
}

// Huvudfunktion
function calculateResults() {
    console.log('calculateResults started');
    try {
        // Hämta inputs (med säkerhetsvärden)
        let homeXGF = parseFloat(document.getElementById('homeXGF').value) || 1.0;
        let homeXGA = parseFloat(document.getElementById('homeXGA').value) || 1.0;
        let awayXGF = parseFloat(document.getElementById('awayXGF').value) || 1.0;
        let awayXGA = parseFloat(document.getElementById('awayXGA').value) || 1.0;
        const leagueAvg = parseFloat(document.getElementById('leagueAvg').value) || 2.7;
        const homeForm = parseFloat(document.getElementById('homeForm').value) || 0;
        const awayForm = parseFloat(document.getElementById('awayForm').value) || 0;
        let correlation = parseFloat(document.getElementById('correlation').value) || 0.4;
        const userOdds = parseFloat(document.getElementById('userOdds').value) || 0;
        const betType = document.getElementById('betType').value;

        // Validering
        homeXGF = Math.max(0.1, homeXGF);
        homeXGA = Math.max(0.1, homeXGA);
        awayXGF = Math.max(0.1, awayXGF);
        awayXGA = Math.max(0.1, awayXGA);
        correlation = Math.max(-0.5, Math.min(0.5, correlation));

        // Beräkna formfaktorer
        const avgGoalsPer5Games = 6.0;
        const homeFormFactor = Math.max(0.6, Math.min(1.8, homeForm / avgGoalsPer5Games));
        const awayFormFactor = Math.max(0.6, Math.min(1.8, awayForm / avgGoalsPer5Games));

        const homeStrength = Math.sqrt(homeXGF / homeXGA);
        const awayStrength = Math.sqrt(awayXGF / awayXGA);

        const expectedHomeGoals = homeXGF * awayStrength * homeFormFactor;
        const expectedAwayGoals = awayXGF * homeStrength * awayFormFactor;

        const finalHomeXG = Math.max(0.2, Math.min(4.0, expectedHomeGoals));
        const finalAwayXG = Math.max(0.2, Math.min(4.0, expectedAwayGoals));

        // Beräkna matris
        const resultMatrix = calculateBivariatePoissonMatrix(finalHomeXG, finalAwayXG, correlation);

        // Beräkna resultat
        const outcomes = calculate1X2Probabilities(resultMatrix);
        const btts = calculateBTTS(resultMatrix);
        const overUnder = calculateOverUnder25(resultMatrix);
        const valueIndicator = userOdds > 0 ? calculateValueIndicator(outcomes, userOdds, betType) : null;

        // Spara i resultsData med alla inputvärden
        resultsData = { 
            matrix: resultMatrix, 
            outcomes, 
            btts, 
            overUnder, 
            valueIndicator,
            betType,
            // Spara alla inputvärden för återladdning
            inputs: {
                homeXGF: parseFloat(document.getElementById('homeXGF').value) || 1.0,
                homeXGA: parseFloat(document.getElementById('homeXGA').value) || 1.0,
                awayXGF: parseFloat(document.getElementById('awayXGF').value) || 1.0,
                awayXGA: parseFloat(document.getElementById('awayXGA').value) || 1.0,
                leagueAvg,
                homeForm,
                awayForm,
                correlation: parseFloat(document.getElementById('correlation').value) || 0.4,
                userOdds,
                betType
            }
        };

        // Uppdatera UI (anropa från ui.js, antar att updateUI är definierad där)
        updateUI(resultsData);

        // Visa resultsSection och AI-knapp
        document.getElementById('resultsSection').classList.remove('hidden');
        document.getElementById('generateAIPromptBtn').classList.remove('hidden');
    } catch (error) {
        console.error('Fel vid beräkning:', error);
    }
}


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    factorial,
    simplePoissonProbability,
    calculateBivariatePoissonMatrix,
    calculate1X2Probabilities,
    calculateBTTS,
    calculateOverUnder25,
    calculateValueIndicator
  };
}