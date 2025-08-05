// ui.js - Funktioner för att uppdatera användargränssnittet

function updateUI(data) {
    console.log('Updating UI with data:', data);
    if (!data) {
        console.error('No data provided to updateUI');
        return;
    }
    window.currentCalculation = data;
    updateResultMatrix(data.matrix);
    updateSummary(data.outcomes, data.btts, data.overUnder, data.matrix);
    updateValueIndicator(data.valueIndicator, data.betType);
    updateChartAndTopResults(data.matrix);
}

function updateResultMatrix(matrix) {
    const matrixDiv = document.getElementById('resultMatrix');
    if (!matrixDiv) return;
    matrixDiv.innerHTML = '';
    // Explanation
    const explanation = document.createElement('div');
    explanation.className = 'matrix-explanation';
    explanation.innerHTML = '<p>Tabellen visar sannolikheten för olika slutresultat. <strong>Rader</strong> = Hemmalagets mål, <strong>Kolumner</strong> = Bortalagets mål.</p>';
    matrixDiv.appendChild(explanation);
    // Grid
    const grid = document.createElement('div');
    grid.className = 'grid-results';
    // Headers
    grid.innerHTML += '<div class="grid-cell header-cell"></div>';
    for (let a = 0; a <= 5; a++) {
        grid.innerHTML += `<div class="grid-cell header-cell font-bold bg-blue-100">${a}</div>`;
    }
    for (let h = 0; h <= 5; h++) {
        grid.innerHTML += `<div class="grid-cell header-cell font-bold bg-blue-100">${h}</div>`;
        for (let a = 0; a <= 5; a++) {
            const cell = matrix[h][a];
            const prob = (cell.probability * 100).toFixed(1);
            const intensity = Math.min(900, Math.floor(prob * 100)); // e.g. bg-green-100 to bg-green-900
            const textColor = intensity > 300 ? 'text-white' : 'text-black';
            const fontWeight = parseFloat(prob) > 5 ? 'bold' : 'normal';
            grid.innerHTML += `<div class="grid-cell bg-green-${intensity} ${textColor}" style="font-weight: ${fontWeight};"><div>${prob}%</div><div class="result-score">${h}-${a}</div></div>`;
        }
    }
    matrixDiv.appendChild(grid);
    // Legend
    const legend = document.createElement('div');
    legend.className = 'matrix-legend mt-4 text-sm text-gray-600';
    legend.innerHTML = '<p>Mörkare grön färg indikerar högre sannolikhet.</p><p>Exempel: 2-1 betyder att hemmalaget gör 2 mål och bortalaget gör 1 mål.</p>';
    matrixDiv.appendChild(legend);
}

function updateSummary(outcomes, btts, overUnder, matrix) {
    console.log('Updating summary:', {outcomes, btts, overUnder});
    // 1X2 probabilities
    document.getElementById('home1x2').textContent = `${outcomes.home.toFixed(1)}%`;
    document.getElementById('draw1x2').textContent = `${outcomes.draw.toFixed(1)}%`;
    document.getElementById('away1x2').textContent = `${outcomes.away.toFixed(1)}%`;
    // Odds
    const homeOdds = outcomes.home > 0 ? (100 / outcomes.home).toFixed(2) : 'Infinity';
    const drawOdds = outcomes.draw > 0 ? (100 / outcomes.draw).toFixed(2) : 'Infinity';
    const awayOdds = outcomes.away > 0 ? (100 / outcomes.away).toFixed(2) : 'Infinity';
    document.getElementById('homeOdds').textContent = homeOdds;
    document.getElementById('drawOdds').textContent = drawOdds;
    document.getElementById('awayOdds').textContent = awayOdds;
    // BTTS
    document.getElementById('bttsYes').textContent = `${btts.yes.toFixed(1)}%`;
    document.getElementById('bttsNo').textContent = `${btts.no.toFixed(1)}%`;
    // Over/Under
    document.getElementById('over25').textContent = `${overUnder.over.toFixed(1)}%`;
    document.getElementById('under25').textContent = `${overUnder.under.toFixed(1)}%`;
    // Most likely
    const flat = matrix.flat().sort((a, b) => b.probability - a.probability);
    const top3 = flat.slice(0, 3).map(c => `${c.homeGoals}-${c.awayGoals} (${(c.probability * 100).toFixed(1)}%)`);
    document.getElementById('mostLikelyResult').textContent = top3.join(', ');
}

function updateValueIndicator(valueIndicator, betType) {
    if (!valueIndicator) return;
    const kellyResult = document.getElementById('kellyResult');
    if (!kellyResult) return;
    const betNames = {home: 'Hemmavinst (1)', draw: 'Oavgjort (X)', away: 'Bortavinst (2)'};
    const betName = betNames[betType] || 'Okänd speltyp';
    const fairOdds = valueIndicator.fairOdds;
    const value = parseFloat(valueIndicator.value);
    const isGood = value > 0;
    const colorClass = isGood ? 'bg-green-50' : 'bg-red-50';
    const valueText = isGood ? 'Bra värde' : 'Dåligt värde';
    const diff = Math.abs(value);
    const comparison = isGood ? 'högre' : 'lägre';
    kellyResult.className = `${colorClass} p-3 rounded-md font-bold`;
    kellyResult.textContent = `${valueText} på ${betName}. Ditt odds är ${diff}% ${comparison} än beräknat rättvist odds ${fairOdds}.`;
}

function updateChartAndTopResults(matrix) {
    const totalGoalsProb = {};
    matrix.flat().forEach(cell => {
        const total = cell.homeGoals + cell.awayGoals;
        totalGoalsProb[total] = (totalGoalsProb[total] || 0) + cell.probability;
    });
    // Total goals table
    const tableBody = document.querySelector('#probabilityTable tbody');
    if (tableBody) {
        tableBody.innerHTML = '';
        const labels = Object.keys(totalGoalsProb).sort((a,b) => a - b);
        labels.forEach(label => {
            const prob = (totalGoalsProb[label] * 100).toFixed(1);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${label}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prob}%</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Total goals chart
    const ctx = document.getElementById('totalGoalsChart');
    if (ctx) {
        const chartLabels = Object.keys(totalGoalsProb).sort((a,b) => a - b);
        const chartData = chartLabels.map(label => (totalGoalsProb[label] * 100).toFixed(1));
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Sannolikhet för totala mål (%)',
                    data: chartData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Sannolikhet (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Totala mål'
                        }
                    }
                }
            }
        });
    }

    // Top 6 results table
    const topTableBody = document.querySelector('#topResultsTable tbody');
    if (topTableBody) {
        topTableBody.innerHTML = '';
        const flat = matrix.flat().sort((a, b) => b.probability - a.probability);
        const top6 = flat.slice(0, 6);
        top6.forEach(cell => {
            const prob = (cell.probability * 100).toFixed(1);
            let rowClass = '';
            if (cell.homeGoals > cell.awayGoals) {
                rowClass = 'bg-green-100';
            } else if (cell.homeGoals < cell.awayGoals) {
                rowClass = 'bg-red-100';
            } else {
                rowClass = 'bg-yellow-100';
            }
            const row = document.createElement('tr');
            row.className = rowClass;
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${cell.homeGoals}-${cell.awayGoals}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prob}%</td>
            `;
            topTableBody.appendChild(row);
        });

        // Add color explanation
        const colorExplanation = document.createElement('caption');
        colorExplanation.className = 'text-sm text-gray-600 mt-2';
        colorExplanation.innerHTML = 'Färger: <span class="bg-green-100 px-2">Grön</span> = Hemmavinst, <span class="bg-yellow-100 px-2">Gul</span> = Oavgjort, <span class="bg-red-100 px-2">Röd</span> = Bortavinst';
        document.querySelector('#topResultsTable').appendChild(colorExplanation);
    }
}


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    updateUI,
    updateResultMatrix,
    updateSummary,
    updateValueIndicator,
    updateChartAndTopResults
  };
}