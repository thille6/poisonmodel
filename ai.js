// ai.js - Funktioner för AI-prompt generering
function generateCurrentAIPrompt() {
    if (!window.currentCalculation) {
        customPopup.alert('Ingen beräkning tillgänglig. Utför en beräkning först.');
        return;
    }
    const data = window.currentCalculation;
    const prompt = `Analysera denna fotbollsmatch baserat på Poisson-modell:

xG-värden:
- Hemmalag xG: ${data.homeLambda}
- Bortalag xG: ${data.awayLambda}

Sannolikheter:
- Hemmavinst: ${data.outcomes.home.toFixed(1)}%
- Oavgjort: ${data.outcomes.draw.toFixed(1)}%
- Bortavinst: ${data.outcomes.away.toFixed(1)}%

BTTS: Ja ${data.btts.yes.toFixed(1)}%, Nej ${data.btts.no.toFixed(1)}%
Over/Under 2.5: Över ${data.overUnder.over.toFixed(1)}%, Under ${data.overUnder.under.toFixed(1)}%

Mest sannolika resultat: ${document.getElementById('mostLikelyResult').textContent}

Ge en detaljerad analys och spelrekommendationer.`;
    // Visa prompt i en modal med kopieringsknapp
    showAIPromptModal(prompt);
}

function showAIPromptModal(prompt) {
    const modal = document.createElement('div');
    modal.className = 'ai-prompt-modal';
    modal.innerHTML = `
        <div class="ai-prompt-content">
            <h3>AI-Prompt</h3>
            <textarea rows="10" style="width: 100%;">${prompt}</textarea>
            <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value).then(() => alert('Kopierat till urklipp!'));">Kopiera</button>
            <button onclick="this.parentElement.parentElement.remove();">Stäng</button>
        </div>
    `;
    document.body.appendChild(modal);
}