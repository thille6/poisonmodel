// Globala variabler för att lagra beräkningsresultat
let resultsData = {};
let resultsChart = null;

// Custom popup funktioner
const customPopup = {
    element: null,
    titleElement: null,
    messageElement: null,
    okButton: null,
    cancelButton: null,
    closeXButton: null,
    resolvePromise: null,
    
    init() {
        this.element = document.getElementById('customPopup');
        this.titleElement = document.getElementById('popupTitle');
        this.messageElement = document.getElementById('popupMessage');
        this.okButton = document.getElementById('popupOkBtn');
        this.cancelButton = document.getElementById('popupCancelBtn');
        this.closeXButton = document.getElementById('popupCloseX');
        
        this.okButton.addEventListener('click', () => {
            this.hide();
            if (this.resolvePromise) this.resolvePromise(true);
        });
        
        this.cancelButton.addEventListener('click', () => {
            this.hide();
            if (this.resolvePromise) this.resolvePromise(false);
        });
        
        this.closeXButton.addEventListener('click', () => {
            this.hide();
            if (this.resolvePromise) this.resolvePromise(false);
        });
    },
    
    show(message, title = 'Meddelande', showCancel = false) {
        this.titleElement.textContent = title;
        this.messageElement.textContent = message;
        this.cancelButton.classList.toggle('hidden', !showCancel);
        this.element.classList.remove('hidden');
        
        return new Promise(resolve => {
            this.resolvePromise = resolve;
        });
    },
    
    hide() {
        this.element.classList.add('hidden');
        this.resolvePromise = null;
    },
    
    alert(message, title = 'Meddelande') {
        return this.show(message, title, false);
    },
    
    confirm(message, title = 'Bekräfta') {
        return this.show(message, title, true);
    }
};

// Initialize popup
customPopup.init();

// Event listeners with null checks
const calculateBtn = document.getElementById('calculateBtn');
const saveBtn = document.getElementById('saveBtn');
const showSavedBtn = document.getElementById('showSavedBtn');
const closeSavedBtn = document.getElementById('closeSavedBtn');
const generateAIPromptBtn = document.getElementById('generateAIPromptBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');

// Ta bort dessa rader
// const saveResultBtn = document.getElementById('saveResultBtn');
// const saveActionBtn = document.getElementById('saveActionBtn');

if (calculateBtn) calculateBtn.addEventListener('click', calculateResults);
if (saveBtn) saveBtn.addEventListener('click', saveCalculation);
if (showSavedBtn) showSavedBtn.addEventListener('click', showSavedCalculations);
if (closeSavedBtn) closeSavedBtn.addEventListener('click', closeSavedCalculations);
if (generateAIPromptBtn) generateAIPromptBtn.addEventListener('click', generateCurrentAIPrompt);
if (exportBtn) exportBtn.addEventListener('click', exportSavedCalculations);
if (importBtn) importBtn.addEventListener('click', importSavedCalculations);

// Ta bort dessa rader
// if (saveResultBtn) saveResultBtn.addEventListener('click', saveCalculation);
// if (saveActionBtn) saveActionBtn.addEventListener('click', saveCalculation);

// Huvudfunktion för beräkningar
function calculateResults() {
    // Hämta inmatningsvärden
    const homeXGF = parseFloat(document.getElementById('homeXGF').value);
    const homeXGA = parseFloat(document.getElementById('homeXGA').value);
    const awayXGF = parseFloat(document.getElementById('awayXGF').value);
    const awayXGA = parseFloat(document.getElementById('awayXGA').value);
    const leagueAvg = parseFloat(document.getElementById('leagueAvg').value);
    const homeForm = parseFloat(document.getElementById('homeForm').value);
    const awayForm = parseFloat(document.getElementById('awayForm').value);
    const correlation = parseFloat(document.getElementById('correlation').value);
    const userOdds = parseFloat(document.getElementById('userOdds').value) || 0;
    const betType = document.getElementById('betType').value;
    
    // Validera inmatningsvärden
    if (isNaN(homeXGF) || isNaN(homeXGA) || isNaN(awayXGF) || isNaN(awayXGA) || 
        isNaN(leagueAvg) || isNaN(homeForm) || isNaN(awayForm) || isNaN(correlation)) {
        customPopup.alert('Vänligen fyll i alla obligatoriska fält med giltiga numeriska värden.', 'Valideringsfel');
        return;
    }
    
    if (correlation < 0 || correlation > 1) {
        customPopup.alert('Korrelation måste vara mellan 0 och 1.', 'Valideringsfel');
        return;
    }
    
    if (userOdds !== 0 && userOdds < 1) {
        customPopup.alert('Odds måste vara 1 eller högre.', 'Valideringsfel');
        return;
    }
    
    try {
        // Beräkna formfaktorer (normaliserade runt 1.0)
        const homeFormFactor = homeForm / 5.0;  // Form 1-10 blir 0.2-2.0
        const awayFormFactor = awayForm / 5.0;  // Form 1-10 blir 0.2-2.0
        
        // Beräkna normaliseringsfaktor baserat på ligasnitt
        const normalizationFactor = leagueAvg / 2.7;
        
        // Beräkna lambda1 (hemmalag) och lambda2 (bortalag) med form och normalisering
        const rawLambda1 = ((homeXGF + awayXGA) / 2) * homeFormFactor * normalizationFactor;
        const rawLambda2 = ((awayXGF + homeXGA) / 2) * awayFormFactor * normalizationFactor;
        
        // Debug-utskrifter
        console.log('Debug värden:');
        console.log('homeFormFactor:', homeFormFactor);
        console.log('awayFormFactor:', awayFormFactor);
        console.log('rawLambda1:', rawLambda1);
        console.log('rawLambda2:', rawLambda2);

        // Beräkna resultatmatris med Bivariat Poisson-fördelning
        const resultMatrix = calculateBivariatePoissonMatrix(rawLambda1, rawLambda2, correlation);
        
        // Beräkna 1X2 sannolikheter
        const outcomes = calculate1X2Probabilities(resultMatrix);
        
        // Beräkna BTTS och över/under 2.5
        const btts = calculateBTTS(resultMatrix);
        const overUnder = calculateOverUnder25(resultMatrix);
        
        // Hitta mest sannolika resultat
        const mostLikely = findMostLikelyResults(resultMatrix);
        
        // Beräkna värdeindikator istället för Kelly Criterion
        const valueIndicator = calculateValueIndicator(outcomes, userOdds, betType);
        
        // Spara resultaten för senare användning
        resultsData = {
            homeXGF,
            homeXGA,
            awayXGF,
            awayXGA,
            leagueAvg,
            homeForm,
            awayForm,
            correlation,
            userOdds,
            betType,
            resultMatrix,
            outcomes,
            btts,
            overUnder,
            mostLikely,
            valueIndicator,  // Ersätter kelly
            timestamp: new Date().toLocaleString()
        };
        
        // Uppdatera UI med resultaten
        updateUI(resultsData);
        
        // Visa resultatsektionen och se till att den är synlig
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
        resultsSection.style.display = 'block';
        
        // Scrolla till resultatsektionen
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Visa bekräftelse
        customPopup.alert('Beräkningen är klar!', 'Information');
    } catch (error) {
        console.error('Fel vid beräkning:', error);
        customPopup.alert('Ett fel uppstod vid beräkningen: ' + error.message, 'Fel');
    }
}

// Beräkna Bivariat Poisson-sannolikheter för resultatmatris
function calculateBivariatePoissonMatrix(homeXG, awayXG, correlation) {
    const matrix = [];
    const maxGoals = 5; // 0-5 mål
    
    // Beräkna lambda3 baserat på korrelation
    // Lambda3 representerar kovariansen mellan hemma- och bortamål
    const lambda3 = correlation * Math.sqrt(homeXG * awayXG);
    
    // Justera lambda1 och lambda2 för att ta hänsyn till kovariansen
    // Säkerställ att lambda-värdena förblir positiva
    const lambda1 = Math.max(0.01, homeXG - lambda3);
    const lambda2 = Math.max(0.01, awayXG - lambda3);
    
    // Debug-utskrifter för att kontrollera värdena
    console.log('Lambda-värden:');
    console.log('homeXG:', homeXG, 'awayXG:', awayXG);
    console.log('lambda3:', lambda3);
    console.log('lambda1:', lambda1, 'lambda2:', lambda2);
    
    // Beräkna sannolikheten för varje resultat med bivariat Poisson
    for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals++) {
        const row = [];
        for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals++) {
            // Beräkna bivariat Poisson-sannolikhet
            const probability = bivariatePoissonProbability(lambda1, lambda2, lambda3, homeGoals, awayGoals);
            row.push({
                homeGoals,
                awayGoals,
                probability
            });
        }
        matrix.push(row);
    }
    
    return matrix;
}

// Beräkna bivariat Poisson-sannolikhet för ett specifikt resultat
function bivariatePoissonProbability(lambda1, lambda2, lambda3, k, l) {
    let probability = 0;
    
    // Bivariat Poisson-formel: P(X=k, Y=l) = sum_{i=0}^{min(k,l)} (e^-λ3 * λ3^i / i!) * (e^-λ1 * λ1^(k-i) / (k-i)!) * (e^-λ2 * λ2^(l-i) / (l-i)!)
    const minKL = Math.min(k, l);
    
    for (let i = 0; i <= minKL; i++) {
        const term1 = poissonTerm(lambda3, i);
        const term2 = poissonTerm(lambda1, k - i);
        const term3 = poissonTerm(lambda2, l - i);
        
        probability += term1 * term2 * term3;
    }
    
    return probability;
}

// Hjälpfunktion för att beräkna en term i Poisson-formeln: (e^-λ * λ^k / k!)
function poissonTerm(lambda, k) {
    if (lambda < 0) return 0; // Säkerställ att lambda är positiv
    
    const e = Math.exp(-lambda);
    let result = e;
    
    if (k > 0) {
        let factorial = 1;
        let lambdaPower = 1;
        
        for (let i = 1; i <= k; i++) {
            factorial *= i;
            lambdaPower *= lambda;
        }
        
        result = e * lambdaPower / factorial;
    }
    
    return result;
}

// Beräkna 1X2 sannolikheter från resultatmatrisen
function calculate1X2Probabilities(matrix) {
    let homeProbability = 0;
    let drawProbability = 0;
    let awayProbability = 0;
    
    // Summera sannolikheter för varje utfall
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            const result = matrix[i][j];
            
            if (result.homeGoals > result.awayGoals) {
                homeProbability += result.probability;
            } else if (result.homeGoals === result.awayGoals) {
                drawProbability += result.probability;
            } else {
                awayProbability += result.probability;
            }
        }
    }
    
    // Beräkna fair odds (1/sannolikhet)
    const homeOdds = 1 / homeProbability;
    const drawOdds = 1 / drawProbability;
    const awayOdds = 1 / awayProbability;
    
    return {
        home: homeProbability,
        draw: drawProbability,
        away: awayProbability,
        homeOdds,
        drawOdds,
        awayOdds
    };
}

// Beräkna BTTS (Båda lagen gör mål) sannolikheter
function calculateBTTS(matrix) {
    let bttsProbability = 0;
    
    // Summera sannolikheter för resultat där båda lagen gör mål
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            const result = matrix[i][j];
            
            if (result.homeGoals > 0 && result.awayGoals > 0) {
                bttsProbability += result.probability;
            }
        }
    }
    
    return {
        yes: bttsProbability,
        no: 1 - bttsProbability
    };
}

// Beräkna Över/Under 2.5 mål sannolikheter
function calculateOverUnder25(matrix) {
    let overProbability = 0;
    
    // Summera sannolikheter för resultat med över 2.5 mål
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            const result = matrix[i][j];
            
            if (result.homeGoals + result.awayGoals > 2) {
                overProbability += result.probability;
            }
        }
    }
    
    return {
        over: overProbability,
        under: 1 - overProbability
    };
}

// Hitta de mest sannolika resultaten
function findMostLikelyResults(matrix) {
    // Platta ut matrisen till en array av resultat
    const allResults = [];
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            allResults.push(matrix[i][j]);
        }
    }
    
    // Sortera resultaten efter sannolikhet (högst först)
    allResults.sort((a, b) => b.probability - a.probability);
    
    // Returnera de tre mest sannolika resultaten
    return allResults.slice(0, 3);
}

// Beräkna Kelly Criterion för ett givet spel
function calculateKelly(outcomes, userOdds, betType) {
    let probability;
    let fairOdds;
    
    // Välj rätt sannolikhet baserat på speltyp
    if (betType === 'home') {
        probability = outcomes.home;
        fairOdds = outcomes.homeOdds;
    } else if (betType === 'draw') {
        probability = outcomes.draw;
        fairOdds = outcomes.drawOdds;
    } else { // away
        probability = outcomes.away;
        fairOdds = outcomes.awayOdds;
    }
    
    // Kelly-formel: f* = (bp - q) / b
    // där b = odds - 1, p = sannolikhet att vinna, q = 1 - p
    const b = userOdds - 1;
    const p = probability;
    const q = 1 - p;
    
    const kellyFraction = (b * p - q) / b;
    
    // Om Kelly är negativ, rekommenderas inget spel
    return {
        fraction: Math.max(0, kellyFraction),
        value: kellyFraction,
        fairOdds,
        userOdds,
        probability,
        betType
    };
}

// Beräkna värdeindikator för ett givet spel
function calculateValueIndicator(outcomes, userOdds, betType) {
    let probability;
    let fairOdds;
    
    // Välj rätt sannolikhet baserat på speltyp
    if (betType === 'home') {
        probability = outcomes.home;
        fairOdds = outcomes.homeOdds;
    } else if (betType === 'draw') {
        probability = outcomes.draw;
        fairOdds = outcomes.drawOdds;
    } else { // away
        probability = outcomes.away;
        fairOdds = outcomes.awayOdds;
    }
    
    // Beräkna värdeindikator (skillnad mellan användarens odds och rättvist odds)
    const valuePercentage = ((userOdds / fairOdds) - 1) * 100;
    
    return {
        valuePercentage,
        fairOdds,
        userOdds,
        probability,
        betType
    };
}

// Uppdatera användargränssnittet med beräkningsresultaten
function updateUI(data) {
    // Uppdatera resultatmatrisen
    updateResultMatrix(data.resultMatrix);
    
    // Uppdatera sammanfattningen
    updateSummary(data);
    
    // Uppdatera stapeldiagrammet
    updateChart(data.resultMatrix);
    
    // Visa resultatsektionen
    document.getElementById('resultsSection').classList.remove('hidden');
    
    // Visa AI-prompt knappen efter beräkning
    const aiPromptBtn = document.getElementById('generateAIPromptBtn');
    if (aiPromptBtn) {
        aiPromptBtn.classList.remove('hidden');
    }
    
    // Spara data globalt för AI-prompt funktionen
    resultsData = {
        homeXGF: parseFloat(document.getElementById('homeXGF').value),
        homeXGA: parseFloat(document.getElementById('homeXGA').value),
        awayXGF: parseFloat(document.getElementById('awayXGF').value),
        awayXGA: parseFloat(document.getElementById('awayXGA').value),
        leagueAvg: parseFloat(document.getElementById('leagueAvg').value),
        homeForm: parseFloat(document.getElementById('homeForm').value),
        awayForm: parseFloat(document.getElementById('awayForm').value),
        correlation: parseFloat(document.getElementById('correlation').value),
        userOdds: parseFloat(document.getElementById('userOdds').value) || null,
        betType: document.getElementById('betType').value,
        outcomes: data.outcomes,
        mostLikely: data.mostLikely,
        btts: data.btts,
        overUnder: data.overUnder,
        valueIndicator: data.valueIndicator,
        timestamp: new Date().toLocaleString('sv-SE'),
        title: 'Aktuell beräkning'
    };
}

// Uppdatera resultatmatrisen i UI
// Uppdatera resultatmatrisen i UI
function updateResultMatrix(matrix) {
    const matrixElement = document.getElementById('resultMatrix');
    matrixElement.innerHTML = '';
    
    // Lägg till förklarande text överst
    const explanation = document.createElement('div');
    explanation.className = 'matrix-explanation';
    explanation.innerHTML = '<p>Tabellen visar sannolikheten för olika slutresultat. <strong>Rader</strong> = Hemmalagets mål, <strong>Kolumner</strong> = Bortalagets mål.</p>';
    matrixElement.appendChild(explanation);
    
    // Hitta högsta sannolikhet för att markera den
    let maxProbability = 0;
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j].probability > maxProbability) {
                maxProbability = matrix[i][j].probability;
            }
        }
    }
    
    // Skapa en container för själva matrisen
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-results';
    matrixElement.appendChild(gridContainer);
    
    // Lägg till kolumnrubriker (bortalag mål)
    gridContainer.appendChild(createGridCell('', 'header-cell'));
    for (let j = 0; j < matrix[0].length; j++) {
        gridContainer.appendChild(createGridCell(j, 'header-cell font-bold bg-blue-100'));
    }
    
    // Skapa resultatmatrisen
    for (let i = 0; i < matrix.length; i++) {
        // Radrubriker (hemmalag mål)
        gridContainer.appendChild(createGridCell(i, 'header-cell font-bold bg-blue-100'));
        
        // Resultatceller med färgskala
        for (let j = 0; j < matrix[i].length; j++) {
            const result = matrix[i][j];
            const probability = (result.probability * 100).toFixed(1) + '%';
            
            // Beräkna färgintensitet baserat på sannolikhet
            const normalizedProb = result.probability / maxProbability;
            
            // Skapa en cell med mer information
            const cellContent = `<div>${probability}</div><div class="result-score">${i}-${j}</div>`;
            
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.style.backgroundColor = `rgba(74, 222, 128, ${normalizedProb.toFixed(2)})`;
            cell.style.fontWeight = normalizedProb > 0.5 ? 'bold' : 'normal';
            cell.innerHTML = cellContent;
            gridContainer.appendChild(cell);
        }
    }
    
    // Lägg till förklaring under matrisen
    const legend = document.createElement('div');
    legend.className = 'matrix-legend mt-4 text-sm text-gray-600';
    legend.innerHTML = `
        <p>Mörkare grön färg indikerar högre sannolikhet.</p>
        <p>Exempel: 2-1 betyder att hemmalaget gör 2 mål och bortalaget gör 1 mål.</p>
    `;
    matrixElement.appendChild(legend);
}

// Skapa en cell för resultatmatrisen
function createGridCell(content, className = '') {
    const cell = document.createElement('div');
    cell.className = `grid-cell ${className}`;
    cell.textContent = content;
    return cell;
}

// Uppdatera sammanfattningssektionen
function updateSummary(data) {
    // Mest sannolika resultat
    const mostLikelyElement = document.getElementById('mostLikelyResult');
    mostLikelyElement.innerHTML = data.mostLikely.map(result => {
        const percent = (result.probability * 100).toFixed(1);
        return `${result.homeGoals}-${result.awayGoals} (${percent}%)`;
    }).join(', ');
    
    // BTTS
    document.getElementById('bttsYes').textContent = (data.btts.yes * 100).toFixed(1) + '%';
    document.getElementById('bttsNo').textContent = (data.btts.no * 100).toFixed(1) + '%';
    
    // Över/Under 2.5
    document.getElementById('over25').textContent = (data.overUnder.over * 100).toFixed(1) + '%';
    document.getElementById('under25').textContent = (data.overUnder.under * 100).toFixed(1) + '%';
    
    // 1X2
    document.getElementById('home1x2').textContent = (data.outcomes.home * 100).toFixed(1) + '%';
    document.getElementById('draw1x2').textContent = (data.outcomes.draw * 100).toFixed(1) + '%';
    document.getElementById('away1x2').textContent = (data.outcomes.away * 100).toFixed(1) + '%';
    
    // Odds
    document.getElementById('homeOdds').textContent = data.outcomes.homeOdds.toFixed(2);
    document.getElementById('drawOdds').textContent = data.outcomes.drawOdds.toFixed(2);
    document.getElementById('awayOdds').textContent = data.outcomes.awayOdds.toFixed(2);
    
    // Värdebedömning (ersätter Kelly Criterion)
    const kellyElement = document.getElementById('kellyResult');
    const valueIndicator = data.valueIndicator;
    
    // Kontrollera om användaren har angett odds
    if (isNaN(valueIndicator.userOdds) || valueIndicator.userOdds < 1) {
        kellyElement.textContent = "Fyll i odds för att se värdebedömning";
        kellyElement.className = 'bg-gray-100 p-3 rounded-md font-bold text-gray-500';
        return;
    }
    
    let betTypeText = '';
    if (valueIndicator.betType === 'home') betTypeText = 'Hemmavinst (1)';
    else if (valueIndicator.betType === 'draw') betTypeText = 'Oavgjort (X)';
    else betTypeText = 'Bortavinst (2)';
    
    // Visa värdebedömning baserat på procentuell skillnad
    const valuePercent = valueIndicator.valuePercentage.toFixed(1);
    
    if (valueIndicator.valuePercentage <= -5) {
        kellyElement.textContent = `Dåligt värde på ${betTypeText}. Ditt odds ${valueIndicator.userOdds.toFixed(2)} är ${Math.abs(valuePercent)}% lägre än beräknat rättvist odds ${valueIndicator.fairOdds.toFixed(2)}.`;
        kellyElement.className = 'bg-red-50 p-3 rounded-md font-bold';
    } else if (valueIndicator.valuePercentage >= 5) {
        kellyElement.textContent = `Bra värde på ${betTypeText}! Ditt odds ${valueIndicator.userOdds.toFixed(2)} är ${valuePercent}% högre än beräknat rättvist odds ${valueIndicator.fairOdds.toFixed(2)}.`;
        kellyElement.className = 'bg-green-50 p-3 rounded-md font-bold';
    } else {
        kellyElement.textContent = `Neutralt värde på ${betTypeText}. Ditt odds ${valueIndicator.userOdds.toFixed(2)} är nära beräknat rättvist odds ${valueIndicator.fairOdds.toFixed(2)}.`;
        kellyElement.className = 'bg-blue-50 p-3 rounded-md font-bold';
    }
}

// Uppdatera stapeldiagrammet
// Uppdatera diagrammet (ändrat från cirkeldiagram till en tydligare tabell)
function updateChart(matrix) {
    // Säkerställ att sparade beräkningar är dolda
    document.getElementById('savedCalculationsSection').classList.add('hidden');
    document.getElementById('savedCalculationsSection').style.display = 'none';
    
    const resultsChartElement = document.getElementById('resultsChart');
    
    // Kontrollera om elementet finns innan vi försöker använda det
    if (!resultsChartElement) {
        console.error('Element med ID "resultsChart" hittades inte');
        return; // Avsluta funktionen om elementet inte finns
    }
    
    const chartContainer = resultsChartElement.parentNode;
    chartContainer.innerHTML = ''; // Rensa befintligt innehåll
    
    // Återskapa canvas-elementet
    const canvas = document.createElement('canvas');
    canvas.id = 'resultsChart';
    chartContainer.appendChild(canvas);
    
    // Skapa förklarande text
    const explanation = document.createElement('div');
    explanation.className = 'mb-4 p-3 bg-gray-50 rounded-md';
    explanation.innerHTML = `
        <p class="font-medium">De 10 mest sannolika matchresultaten visas nedan med färgkodning:</p>
        <ul class="list-disc pl-5 mt-2 text-sm">
            <li><span class="font-medium text-blue-600">Blå</span> = Hemmavinst (hemmalaget gör fler mål)</li>
            <li><span class="font-medium text-yellow-500">Gul</span> = Oavgjort (lika många mål)</li>
            <li><span class="font-medium text-red-500">Röd</span> = Bortavinst (bortalaget gör fler mål)</li>
        </ul>
    `;
    chartContainer.appendChild(explanation);
    
    // Förbered data
    const allResults = [];
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            allResults.push(matrix[i][j]);
        }
    }
    
    // Sortera resultaten efter sannolikhet (högst först)
    allResults.sort((a, b) => b.probability - a.probability);
    
    // Använd de 10 mest sannolika resultaten
    const topResults = allResults.slice(0, 10);
    
    // Skapa tabell
    const table = document.createElement('table');
    table.className = 'w-full border-collapse';
    
    // Skapa tabellhuvud
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr class="bg-gray-100">
            <th class="p-2 text-left">Resultat</th>
            <th class="p-2 text-left">Sannolikhet</th>
            <th class="p-2 text-left">Typ</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Skapa tabellkropp
    const tbody = document.createElement('tbody');
    
    for (const result of topResults) {
        const row = document.createElement('tr');
        
        // Bestäm resultattyp och färg
        let resultType, bgColor;
        if (result.homeGoals > result.awayGoals) {
            resultType = 'Hemmavinst';
            bgColor = 'bg-blue-100';
        } else if (result.homeGoals === result.awayGoals) {
            resultType = 'Oavgjort';
            bgColor = 'bg-yellow-100';
        } else {
            resultType = 'Bortavinst';
            bgColor = 'bg-red-100';
        }
        
        row.className = bgColor + ' hover:bg-opacity-80';
        row.innerHTML = `
            <td class="p-2 font-medium">${result.homeGoals}-${result.awayGoals}</td>
            <td class="p-2">${(result.probability * 100).toFixed(1)}%</td>
            <td class="p-2">${resultType}</td>
        `;
        
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    chartContainer.appendChild(table);
    
    // Förstör tidigare diagram om det finns
    if (resultsChart) {
        resultsChart.destroy();
        resultsChart = null;
    }
}

// Spara beräkning till localStorage
async function saveCalculation() {
    // Kontrollera om det finns resultat att spara
    if (!resultsData || Object.keys(resultsData).length === 0) {
        await customPopup.alert('Gör en beräkning först innan du sparar.', 'Information');
        return;
    }
    
    // Hämta rubrik från inmatningsfältet
    const title = document.getElementById('calculationTitle').value.trim() || 'Beräkning ' + new Date().toLocaleString();
    
    // Lägg till rubriken i resultsData
    resultsData.title = title;
    
    // Hämta befintliga sparade beräkningar eller skapa en tom array
    let savedCalculations = JSON.parse(localStorage.getItem('footballCalculations')) || [];
    
    // Lägg till den nya beräkningen
    savedCalculations.push(resultsData);
    
    // Begränsa antalet sparade beräkningar till 10
    if (savedCalculations.length > 10) {
        savedCalculations = savedCalculations.slice(-10);
    }
    
    // Spara till localStorage
    localStorage.setItem('footballCalculations', JSON.stringify(savedCalculations));
    
    // Återställ rubrikfältet
    document.getElementById('calculationTitle').value = '';
    
    await customPopup.alert('Beräkningen har sparats med rubriken: ' + title, 'Bekräftelse');
}

// Visa sparade beräkningar
function showSavedCalculations() {
    // Hämta sparade beräkningar från localStorage
    const savedCalculations = JSON.parse(localStorage.getItem('footballCalculations')) || [];
    
    // Referens till listan där vi ska visa beräkningarna
    const savedList = document.getElementById('savedCalculationsList');
    savedList.innerHTML = '';
    
    // Kontrollera om det finns sparade beräkningar
    if (savedCalculations.length === 0) {
        savedList.innerHTML = '<p class="text-gray-500 italic">Inga sparade beräkningar hittades.</p>';
    } else {
        // Loopa igenom alla sparade beräkningar och skapa element för varje
        savedCalculations.forEach((calc, index) => {
            // Skapa container för beräkningen
            const calcItem = document.createElement('div');
            calcItem.className = 'bg-gray-50 p-4 rounded-md';
            
            // Formatera bettyp för visning
            let betTypeText = '';
            if (calc.betType === 'home') betTypeText = 'Hemmavinst (1)';
            else if (calc.betType === 'draw') betTypeText = 'Oavgjort (X)';
            else betTypeText = 'Bortavinst (2)';
            
            // Skapa innehåll med titel och information
            const title = calc.title || 'Beräkning ' + (calc.timestamp || new Date().toLocaleString());
            
            calcItem.innerHTML = `
                <h3 class="font-bold text-lg mb-2">${title}</h3>
                <p class="text-sm text-gray-600 mb-2">Sparad: ${calc.timestamp || new Date().toLocaleString()}</p>
                <div class="grid grid-cols-2 gap-2 mb-3">
                    <div>
                        <p><span class="font-medium">Hemma xG:</span> ${calc.homeXGF}</p>
                        <p><span class="font-medium">Hemma xGA:</span> ${calc.homeXGA}</p>
                        <p><span class="font-medium">Borta xG:</span> ${calc.awayXGF}</p>
                        <p><span class="font-medium">Borta xGA:</span> ${calc.awayXGA}</p>
                    </div>
                    <div>
                        <p><span class="font-medium">Ligasnitt:</span> ${calc.leagueAvg}</p>
                        <p><span class="font-medium">Form Hemma:</span> ${calc.homeForm}</p>
                        <p><span class="font-medium">Form Borta:</span> ${calc.awayForm}</p>
                        <p><span class="font-medium">Korrelation:</span> ${calc.correlation}</p>
                    </div>
                </div>
                <div class="mb-3">
                    <p><span class="font-medium">Speltyp:</span> ${betTypeText}</p>
                    ${calc.userOdds ? `<p><span class="font-medium">Odds:</span> ${calc.userOdds}</p>` : ''}
                </div>
                <div class="flex flex-wrap gap-2">
                    <button class="load-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition">Ladda</button>
                    <button class="export-btn bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition">Exportera</button>
                    <button class="ai-prompt-btn bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition">AI-prompt</button>
                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition">Radera</button>
                </div>
            `;
            
            // Lägg till event listener för laddningsknappen
            const loadBtn = calcItem.querySelector('.load-btn');
            loadBtn.addEventListener('click', () => loadSavedCalculation(index));
            
            // Lägg till event listener för exportknappen
            const exportBtn = calcItem.querySelector('.export-btn');
            exportBtn.addEventListener('click', () => exportSingleCalculation(index));
            
            // Lägg till event listener för AI-prompt-knappen
            const aiPromptBtn = calcItem.querySelector('.ai-prompt-btn');
            aiPromptBtn.addEventListener('click', () => convertToAIPrompt(index));
            
            // Lägg till event listener för raderingsknappen
            const deleteBtn = calcItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteSavedCalculation(index));
            
            // Lägg till beräkningen i listan
            savedList.appendChild(calcItem);
        });
    }
    
    // Visa sektionen med sparade beräkningar och dölj resultatsektionen
    const savedSection = document.getElementById('savedCalculationsSection');
    const resultsSection = document.getElementById('resultsSection');
    
    if (savedSection) {
        savedSection.classList.remove('hidden');
        savedSection.style.display = 'block';
    }
    
    if (resultsSection) {
        resultsSection.classList.add('hidden');
        resultsSection.style.display = 'none';
    }
}

// Ladda en sparad beräkning
async function loadSavedCalculation(index) {
    // Hämta sparade beräkningar
    const savedCalculations = JSON.parse(localStorage.getItem('footballCalculations')) || [];
    
    if (index < 0 || index >= savedCalculations.length) {
        await customPopup.alert('Ogiltig beräkning.', 'Fel');
        return;
    }
    
    // Hämta den valda beräkningen
    const calc = savedCalculations[index];
    
    // Fyll i formuläret med sparade värden
    if (calc.homeXGF !== undefined) document.getElementById('homeXGF').value = calc.homeXGF;
    if (calc.homeXGA !== undefined) document.getElementById('homeXGA').value = calc.homeXGA;
    if (calc.awayXGF !== undefined) document.getElementById('awayXGF').value = calc.awayXGF;
    if (calc.awayXGA !== undefined) document.getElementById('awayXGA').value = calc.awayXGA;
    if (calc.leagueAvg !== undefined) document.getElementById('leagueAvg').value = calc.leagueAvg;
    if (calc.homeForm !== undefined) document.getElementById('homeForm').value = calc.homeForm;
    if (calc.awayForm !== undefined) document.getElementById('awayForm').value = calc.awayForm;
    if (calc.correlation !== undefined) document.getElementById('correlation').value = calc.correlation;
    if (calc.userOdds !== undefined) document.getElementById('userOdds').value = calc.userOdds;
    if (calc.betType !== undefined) document.getElementById('betType').value = calc.betType;
    if (calc.title !== undefined) document.getElementById('calculationTitle').value = calc.title;
    
    // Ladda resultaten
    resultsData = calc;
    
    // Säkerställ att sparade beräkningar är helt dolda
    document.getElementById('savedCalculationsSection').classList.add('hidden');
    document.getElementById('savedCalculationsSection').style.display = 'none';
    
    // Visa resultatsektionen
    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('resultsSection').style.display = 'block';
    
    // Uppdatera UI
    updateUI(resultsData);
    
    // Lägg till bekräftelse
    const title = calc.title || 'Beräkning';
    await customPopup.alert(`Beräkningen "${title}" har laddats.`, 'Bekräftelse');
}

// Stäng sektionen med sparade beräkningar
function closeSavedCalculations() {
    const savedSection = document.getElementById('savedCalculationsSection');
    const resultsSection = document.getElementById('resultsSection');
    
    if (savedSection) {
        savedSection.classList.add('hidden');
        savedSection.style.display = 'none';
    }
    
    // Visa resultatsektionen om det finns resultat
    if (resultsData && Object.keys(resultsData).length > 0 && resultsSection) {
        resultsSection.classList.remove('hidden');
        resultsSection.style.display = 'block';
    }
}

// Initiera popup-komponenten när sidan laddas
window.addEventListener('DOMContentLoaded', function() {
    customPopup.init();
    
    // Dölj action buttons från början
    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) {
        actionButtons.classList.add('hidden');
    }
    
    calculateResults();
    
    // Lägg till event listeners för export/import-knappar
    // const exportBtn = document.getElementById('exportBtn');
    // const importBtn = document.getElementById('importBtn');
    
    // if (exportBtn) exportBtn.addEventListener('click', exportSavedCalculations);
    // if (importBtn) importBtn.addEventListener('click', importSavedCalculations);
    
    // Dölj AI-prompt knappen från början
    const aiPromptBtn = document.getElementById('generateAIPromptBtn');
    if (aiPromptBtn) {
        aiPromptBtn.classList.add('hidden');
    }
});

// Radera en sparad beräkning
async function deleteSavedCalculation(index) {
    // Hämta sparade beräkningar
    const savedCalculations = JSON.parse(localStorage.getItem('footballCalculations')) || [];
    
    if (index < 0 || index >= savedCalculations.length) {
        await customPopup.alert('Ogiltig beräkning.', 'Fel');
        return;
    }
    
    // Bekräfta radering
    const confirmed = await customPopup.confirm('Är du säker på att du vill radera denna beräkning?', 'Bekräfta radering');
    if (confirmed) {
        // Ta bort beräkningen från arrayen
        savedCalculations.splice(index, 1);
        
        // Spara den uppdaterade listan till localStorage
        localStorage.setItem('footballCalculations', JSON.stringify(savedCalculations));
        
        // Uppdatera visningen av sparade beräkningar
        showSavedCalculations();
        
        await customPopup.alert('Beräkningen har raderats.', 'Bekräftelse');
    }
}

// Funktion för att exportera alla sparade beräkningar
function exportSavedCalculations() {
    try {
        const savedCalculations = JSON.parse(localStorage.getItem('footballCalculations')) || [];
        
        if (savedCalculations.length === 0) {
            alert('Det finns inga sparade beräkningar att exportera.');
            return;
        }
        
        const dataStr = JSON.stringify(savedCalculations, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'fotbollsberakningar.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
    } catch (error) {
        console.error('Fel vid export:', error);
        alert('Ett fel uppstod vid export av beräkningar.');
    }
}

// Funktion för att importera sparade beräkningar
function importSavedCalculations() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    if (!Array.isArray(importedData)) {
                        throw new Error('Ogiltig dataformat.');
                    }
                    
                    // Kombinera med befintliga beräkningar
                    const existingCalculations = JSON.parse(localStorage.getItem('footballCalculations')) || [];
                    const combinedCalculations = [...existingCalculations, ...importedData];
                    
                    // Begränsa till 10 beräkningar
                    const finalCalculations = combinedCalculations.slice(-10);
                    
                    localStorage.setItem('footballCalculations', JSON.stringify(finalCalculations));
                    
                    alert(`${importedData.length} beräkningar har importerats.`);
                    
                    // Uppdatera visningen om sparade beräkningar visas
                    if (!document.getElementById('savedCalculationsSection').classList.contains('hidden')) {
                        showSavedCalculations();
                    }
                    
                } catch (error) {
                    console.error('Fel vid import:', error);
                    alert('Filen innehåller ogiltigt format. Kontrollera att det är en korrekt JSON-fil.');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
        
    } catch (error) {
        console.error('Fel vid import:', error);
        alert('Ett fel uppstod vid import av beräkningar.');
    }
}

// Funktion för att exportera en enskild beräkning
function exportSingleCalculation(index) {
    try {
        const savedCalculations = JSON.parse(localStorage.getItem('footballCalculations')) || [];
        
        if (index < 0 || index >= savedCalculations.length) {
            alert('Ogiltig beräkning.');
            return;
        }
        
        const calculation = savedCalculations[index];
        const dataStr = JSON.stringify(calculation, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const title = calculation.title || 'berakning';
        const exportFileName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
    } catch (error) {
        console.error('Fel vid export:', error);
        alert('Ett fel uppstod vid export av beräkningen.');
    }
}

// Funktion för att konvertera en beräkning till en AI-prompt
function convertToAIPrompt(index) {
    try {
        const savedCalculations = JSON.parse(localStorage.getItem('footballCalculations')) || [];
        
        if (index < 0 || index >= savedCalculations.length) {
            alert('Ogiltig beräkning.');
            return;
        }
        
        const calc = savedCalculations[index];
        
        // Formatera bettyp för visning
        let betTypeText = '';
        if (calc.betType === 'home') betTypeText = 'Hemmavinst (1)';
        else if (calc.betType === 'draw') betTypeText = 'Oavgjort (X)';
        else betTypeText = 'Bortavinst (2)';
        
        // Skapa en formaterad prompt för AI-analys
        let prompt = `Analysera följande fotbollsmatchberäkning baserad på Expected Goals (xG) data:

`;
        
        // Lägg till titel och tidsstämpel
        prompt += `Titel: ${calc.title || 'Beräkning'}
`;
        prompt += `Tidpunkt: ${calc.timestamp}

`;
        
        // Lägg till grundläggande data
        prompt += `## Grunddata
`;
        prompt += `- Hemmalag xG för (xGF): ${calc.homeXGF}
`;
        prompt += `- Hemmalag xG emot (xGA): ${calc.homeXGA}
`;
        prompt += `- Bortalag xG för (xGF): ${calc.awayXGF}
`;
        prompt += `- Bortalag xG emot (xGA): ${calc.awayXGA}
`;
        prompt += `- Ligasnitt mål per match: ${calc.leagueAvg}
`;
        prompt += `- Hemmalag form (senaste 5 matcher): ${calc.homeForm}
`;
        prompt += `- Bortalag form (senaste 5 matcher): ${calc.awayForm}
`;
        prompt += `- Korrelation mellan hemma- och bortamål: ${calc.correlation}

`;
        
        // Lägg till beräknade sannolikheter
        prompt += `## Beräknade sannolikheter
`;
        prompt += `**VIKTIGT: Dessa odds är beräknade baserat på xG-data och är INTE marknadens odds.**
`;
        prompt += `- Hemmavinst: ${(calc.outcomes.home * 100).toFixed(1)}% (beräknat rättvist odds: ${calc.outcomes.homeOdds.toFixed(2)})
`;
        prompt += `- Oavgjort: ${(calc.outcomes.draw * 100).toFixed(1)}% (beräknat rättvist odds: ${calc.outcomes.drawOdds.toFixed(2)})
`;
        prompt += `- Bortavinst: ${(calc.outcomes.away * 100).toFixed(1)}% (beräknat rättvist odds: ${calc.outcomes.awayOdds.toFixed(2)})
`;
        prompt += `
**Obs:** Dessa odds representerar vad som skulle vara "rättvisa" odds baserat på xG-analys, inte vad spelbolagen erbjuder.

`;
        
        // Lägg till mest sannolika resultat
        prompt += `## Mest sannolika resultat
`;
        calc.mostLikely.forEach((result, i) => {
            prompt += `${i+1}. ${result.homeGoals}-${result.awayGoals} (${(result.probability * 100).toFixed(1)}%)
`;
        });
        prompt += `
`;
        
        // Lägg till BTTS och över/under 2.5 mål
        prompt += `## Andra marknader
`;
        prompt += `- Båda lagen gör mål (BTTS): Ja ${(calc.btts.yes * 100).toFixed(1)}%, Nej ${(calc.btts.no * 100).toFixed(1)}%
`;
        prompt += `- Över/Under 2.5 mål: Över ${(calc.overUnder.over * 100).toFixed(1)}%, Under ${(calc.overUnder.under * 100).toFixed(1)}%

`;
        
        // Lägg till värdebedömning om användaren har angett odds
        if (calc.userOdds && calc.userOdds > 1) {
            prompt += `## Värdebedömning
`;
            prompt += `- Speltyp: ${betTypeText}
`;
            prompt += `- Användarens odds: ${calc.userOdds.toFixed(2)}
`;
            prompt += `- Beräknat rättvist odds: ${calc.valueIndicator.fairOdds.toFixed(2)}
`;
            prompt += `- Värdeindikator: ${calc.valueIndicator.valuePercentage.toFixed(1)}%

`;
        }
        
        // Lägg till frågor för AI:n
        prompt += `Baserat på denna data, vänligen analysera:
`;
        prompt += `1. Vilka är de viktigaste insikterna från denna beräkning?
`;
        prompt += `2. Finns det några intressanta mönster eller avvikelser i sannolikheterna?
`;
        prompt += `3. Vilka spel skulle du rekommendera baserat på denna analys och varför?
`;
        prompt += `4. Finns det några andra faktorer som bör beaktas utöver xG-data?
`;
        
        // Kopiera till urklipp
        navigator.clipboard.writeText(prompt)
            .then(() => {
                alert('AI-prompt har kopierats till urklipp! Du kan nu klistra in den i en AI-chat.');
            })
            .catch(err => {
                console.error('Kunde inte kopiera till urklipp:', err);
                
                // Visa prompt i en modal om kopiering misslyckas
                const modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
                modal.style.zIndex = '1000';
                modal.style.display = 'flex';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                
                const content = document.createElement('div');
                content.style.backgroundColor = 'white';
                content.style.padding = '20px';
                content.style.borderRadius = '5px';
                content.style.maxWidth = '80%';
                content.style.maxHeight = '80%';
                content.style.overflow = 'auto';
                
                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.marginBottom = '10px';
                
                const title = document.createElement('h3');
                title.textContent = 'AI-prompt (kopiera denna text)';
                title.style.margin = '0';
                
                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'Stäng';
                closeBtn.style.padding = '5px 10px';
                closeBtn.style.backgroundColor = '#f44336';
                closeBtn.style.color = 'white';
                closeBtn.style.border = 'none';
                closeBtn.style.borderRadius = '3px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.onclick = () => document.body.removeChild(modal);
                
                header.appendChild(title);
                header.appendChild(closeBtn);
                
                const textarea = document.createElement('textarea');
                textarea.value = prompt;
                textarea.style.width = '100%';
                textarea.style.height = '300px';
                textarea.style.padding = '10px';
                textarea.style.marginTop = '10px';
                textarea.style.boxSizing = 'border-box';
                
                content.appendChild(header);
                content.appendChild(textarea);
                modal.appendChild(content);
                
                document.body.appendChild(modal);
            });
        
    } catch (error) {
        console.error('Fel vid skapande av AI-prompt:', error);
        alert('Ett fel uppstod vid skapande av AI-prompt.');
    }
}

// Funktion för att generera AI-prompt för aktuell beräkning
function generateCurrentAIPrompt() {
    if (!resultsData || Object.keys(resultsData).length === 0) {
        alert('Ingen beräkning att generera prompt för. Gör en beräkning först.');
        return;
    }
    
    try {
        const calc = resultsData;
        
        // Formatera bettyp för visning
        let betTypeText = '';
        if (calc.betType === 'home') betTypeText = 'Hemmavinst (1)';
        else if (calc.betType === 'draw') betTypeText = 'Oavgjort (X)';
        else betTypeText = 'Bortavinst (2)';
        
        // Skapa en formaterad prompt för AI-analys
        let prompt = `Analysera följande fotbollsmatchberäkning baserad på Expected Goals (xG) data:

`;
        
        // Lägg till titel och tidsstämpel
        prompt += `Titel: ${calc.title || 'Aktuell beräkning'}
`;
        prompt += `Tidpunkt: ${calc.timestamp}

`;
        
        // Lägg till grundläggande data
        prompt += `## Grunddata
`;
        prompt += `- Hemmalag xG för (xGF): ${calc.homeXGF}
`;
        prompt += `- Hemmalag xG emot (xGA): ${calc.homeXGA}
`;
        prompt += `- Bortalag xG för (xGF): ${calc.awayXGF}
`;
        prompt += `- Bortalag xG emot (xGA): ${calc.awayXGA}
`;
        prompt += `- Ligasnitt mål per match: ${calc.leagueAvg}
`;
        prompt += `- Hemmalag form (senaste 5 matcher): ${calc.homeForm}
`;
        prompt += `- Bortalag form (senaste 5 matcher): ${calc.awayForm}
`;
        prompt += `- Korrelation mellan hemma- och bortamål: ${calc.correlation}

`;
        
        // Lägg till beräknade sannolikheter
        prompt += `## Beräknade sannolikheter
`;
        prompt += `- Hemmavinst: ${(calc.outcomes.home * 100).toFixed(1)}% (odds: ${calc.outcomes.homeOdds.toFixed(2)})
`;
        prompt += `- Oavgjort: ${(calc.outcomes.draw * 100).toFixed(1)}% (odds: ${calc.outcomes.drawOdds.toFixed(2)})
`;
        prompt += `- Bortavinst: ${(calc.outcomes.away * 100).toFixed(1)}% (odds: ${calc.outcomes.awayOdds.toFixed(2)})

`;
        
        // Lägg till mest sannolika resultat
        prompt += `## Mest sannolika resultat
`;
        calc.mostLikely.forEach((result, i) => {
            prompt += `${i+1}. ${result.homeGoals}-${result.awayGoals} (${(result.probability * 100).toFixed(1)}%)
`;
        });
        prompt += `
`;
        
        // Lägg till BTTS och över/under 2.5 mål
        prompt += `## Andra marknader
`;
        prompt += `- Båda lagen gör mål (BTTS): Ja ${(calc.btts.yes * 100).toFixed(1)}%, Nej ${(calc.btts.no * 100).toFixed(1)}%
`;
        prompt += `- Över/Under 2.5 mål: Över ${(calc.overUnder.over * 100).toFixed(1)}%, Under ${(calc.overUnder.under * 100).toFixed(1)}%

`;
        
        // Lägg till värdebedömning om användaren har angett odds
        if (calc.userOdds && calc.userOdds > 1) {
            prompt += `## Värdebedömning
`;
            prompt += `- Speltyp: ${betTypeText}
`;
            prompt += `- Användarens odds: ${calc.userOdds.toFixed(2)}
`;
            prompt += `- Beräknat rättvist odds: ${calc.valueIndicator.fairOdds.toFixed(2)}
`;
            prompt += `- Värdeindikator: ${calc.valueIndicator.valuePercentage.toFixed(1)}%

`;
        }
        
        // Lägg till frågor för AI:n
        prompt += `Baserat på denna data, vänligen analysera:
`;
        prompt += `1. Vilka är de viktigaste insikterna från denna beräkning?
`;
        prompt += `2. Finns det några intressanta mönster eller avvikelser i sannolikheterna?
`;
        prompt += `3. Vilka spel skulle du rekommendera baserat på denna analys och varför?
`;
        prompt += `4. Finns det några andra faktorer som bör beaktas utöver xG-data?
`;
        
        // Kopiera till urklipp
        navigator.clipboard.writeText(prompt)
            .then(() => {
                alert('AI-prompt har kopierats till urklipp! Du kan nu klistra in den i en AI-chat.');
            })
            .catch(err => {
                console.error('Kunde inte kopiera till urklipp:', err);
                
                // Visa prompt i en modal om kopiering misslyckas
                const modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
                modal.style.zIndex = '1000';
                modal.style.display = 'flex';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                
                const content = document.createElement('div');
                content.style.backgroundColor = 'white';
                content.style.padding = '20px';
                content.style.borderRadius = '5px';
                content.style.maxWidth = '80%';
                content.style.maxHeight = '80%';
                content.style.overflow = 'auto';
                
                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.marginBottom = '10px';
                
                const title = document.createElement('h3');
                title.textContent = 'AI-prompt (kopiera denna text)';
                title.style.margin = '0';
                
                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'Stäng';
                closeBtn.style.padding = '5px 10px';
                closeBtn.style.backgroundColor = '#f44336';
                closeBtn.style.color = 'white';
                closeBtn.style.border = 'none';
                closeBtn.style.borderRadius = '3px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.onclick = () => document.body.removeChild(modal);
                
                header.appendChild(title);
                header.appendChild(closeBtn);
                
                const textarea = document.createElement('textarea');
                textarea.value = prompt;
                textarea.style.width = '100%';
                textarea.style.height = '300px';
                textarea.style.padding = '10px';
                textarea.style.marginTop = '10px';
                textarea.style.boxSizing = 'border-box';
                
                content.appendChild(header);
                content.appendChild(textarea);
                modal.appendChild(content);
                
                document.body.appendChild(modal);
            });
        
    } catch (error) {
        console.error('Fel vid skapande av AI-prompt:', error);
        alert('Ett fel uppstod vid skapande av AI-prompt.');
    }
}