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
    saved.push({ title, data: window.currentCalculation });
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
        updateUI(item.data);
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