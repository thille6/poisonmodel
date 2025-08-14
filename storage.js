// storage.js - Funktioner för att hantera sparade beräkningar med localStorage

function saveCalculation() {
    if (!window.currentCalculation) {
        customPopup.alert('Ingen beräkning att spara. Utför en beräkning först.');
        return;
    }
    const title = document.getElementById('calculationTitle').value.trim();
    if (!title) {
        customPopup.alert('Ange en rubrik för beräkningen.');
        return;
    }
    const saved = JSON.parse(localStorage.getItem('savedCalculations') || '[]');

    // Säkerställ att vi sparar även formulärens inputvärden
    const dataToSave = { ...window.currentCalculation };
    if (!dataToSave.inputs) {
        dataToSave.inputs = {
            homeXGF: parseFloat(document.getElementById('homeXGF')?.value) || 1.0,
            homeXGA: parseFloat(document.getElementById('homeXGA')?.value) || 1.0,
            awayXGF: parseFloat(document.getElementById('awayXGF')?.value) || 1.0,
            awayXGA: parseFloat(document.getElementById('awayXGA')?.value) || 1.0,
            leagueAvg: parseFloat(document.getElementById('leagueAvg')?.value) || 2.7,
            homeForm: parseFloat(document.getElementById('homeForm')?.value) || 0,
            awayForm: parseFloat(document.getElementById('awayForm')?.value) || 0,
            correlation: parseFloat(document.getElementById('correlation')?.value) || 0.4,
            userOdds: parseFloat(document.getElementById('userOdds')?.value) || 0,
            betType: document.getElementById('betType')?.value || 'home'
        };
    }
    if (!dataToSave.betType && dataToSave.inputs?.betType) {
        dataToSave.betType = dataToSave.inputs.betType;
    }

    saved.push({ title, data: dataToSave });
    localStorage.setItem('savedCalculations', JSON.stringify(saved));
    customPopup.alert('Beräkning sparad!');
}

function showSavedCalculations() {
    console.log('showSavedCalculations called');
    const savedSection = document.getElementById('savedCalculationsSection');
    const list = document.getElementById('savedCalculationsList');
    list.innerHTML = '';
    const saved = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    console.log('Current saved calculations:', saved);
    if (saved.length === 0) {
        list.innerHTML = '<p>Inga sparade beräkningar.</p>';
    } else {
        saved.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'bg-gray-100 p-3 rounded-md flex justify-between items-center';
            div.innerHTML = `
                <span class="font-medium">${item.title}</span>
                <div>
                    <button onclick="loadSavedCalculation(${index})" class="bg-blue-500 text-white px-2 py-1 rounded mr-2">Ladda</button>
                    <button onclick="deleteSavedCalculation(${index})" class="bg-red-500 text-white px-2 py-1 rounded">Radera</button>
                </div>
            `;
            list.appendChild(div);
        });
    }
    savedSection.classList.remove('hidden');
    console.log('showSavedCalculations completed');
}

function loadSavedCalculation(index) {
    const saved = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
    const item = saved[index];
    if (item) {
        const data = item.data || {};

        // Om det finns sparade inputvärden, återställ dem i formuläret
        if (data.inputs) {
            const i = data.inputs;
            if (document.getElementById('homeXGF')) document.getElementById('homeXGF').value = i.homeXGF ?? '';
            if (document.getElementById('homeXGA')) document.getElementById('homeXGA').value = i.homeXGA ?? '';
            if (document.getElementById('awayXGF')) document.getElementById('awayXGF').value = i.awayXGF ?? '';
            if (document.getElementById('awayXGA')) document.getElementById('awayXGA').value = i.awayXGA ?? '';
            if (document.getElementById('leagueAvg')) document.getElementById('leagueAvg').value = i.leagueAvg ?? '';
            if (document.getElementById('homeForm')) document.getElementById('homeForm').value = i.homeForm ?? '';
            if (document.getElementById('awayForm')) document.getElementById('awayForm').value = i.awayForm ?? '';
            if (document.getElementById('correlation')) document.getElementById('correlation').value = i.correlation ?? '';
            if (document.getElementById('userOdds')) document.getElementById('userOdds').value = i.userOdds ?? '';
            if (document.getElementById('betType')) document.getElementById('betType').value = i.betType ?? 'home';
            if (!data.betType && i.betType) data.betType = i.betType;
        } else if (data.betType && document.getElementById('betType')) {
            // Fallback: sätt åtminstone speltyp
            document.getElementById('betType').value = data.betType;
        }

        // Uppdatera UI direkt med sparad data
        updateUI(data);
        document.getElementById('resultsSection').classList.remove('hidden');
        document.getElementById('generateAIPromptBtn').classList.remove('hidden');
        closeSavedCalculations();
    }
}

function deleteSavedCalculation(index) {
    console.log('deleteSavedCalculation called with index:', index);
    const confirmed = window.confirm('Är du säker på att du vill radera denna beräkning?');
    console.log('Confirmation result:', confirmed);
    if (confirmed) {
        console.log('Deleting item at index:', index);
        const saved = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
        if (index < 0 || index >= saved.length) {
            console.log('Invalid index:', index);
            alert('Ogiltigt index för radering.');
            return;
        }
        console.log('Before splice:', [...saved]);
        saved.splice(index, 1);
        console.log('After splice:', [...saved]);
        localStorage.setItem('savedCalculations', JSON.stringify(saved));
        showSavedCalculations();
        console.log('Deletion complete and list refreshed');
        alert('Beräkningen har raderats framgångsrikt!');
    } else {
        console.log('Deletion cancelled');
    }
}

function closeSavedCalculations() {
    document.getElementById('savedCalculationsSection').classList.add('hidden');
}

function exportSavedCalculations() {
    const saved = localStorage.getItem('savedCalculations');
    if (!saved || saved === '[]') {
        customPopup.alert('Inga beräkningar att exportera.');
        return;
    }
    const blob = new Blob([saved], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saved_calculations.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importSavedCalculations() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!Array.isArray(data)) throw new Error('Ogiltigt format');
                localStorage.setItem('savedCalculations', JSON.stringify(data));
                customPopup.alert('Beräkningar importerade!');
                showSavedCalculations();
            } catch (err) {
                customPopup.alert('Fel vid import: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}