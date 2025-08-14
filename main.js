// Globala variabler för att lagra beräkningsresultat
// resultsChart deklareras nu i window-objektet istället för lokalt

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
        
        if (this.okButton) {
            this.okButton.addEventListener('click', () => {
                this.hide();
                if (this.resolvePromise) this.resolvePromise(true);
            });
        }
        
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', () => {
                this.hide();
                if (this.resolvePromise) this.resolvePromise(false);
            });
        }
        
        if (this.closeXButton) {
            this.closeXButton.addEventListener('click', () => {
                this.hide();
                if (this.resolvePromise) this.resolvePromise(false);
            });
        }
    },
    
    show(message, title = 'Meddelande', showCancel = false) {
        console.log('customPopup.show called with message:', message);
        if (this.titleElement) this.titleElement.textContent = title;
        if (this.messageElement) this.messageElement.textContent = message;
        if (this.cancelButton) this.cancelButton.classList.toggle('hidden', !showCancel);
        if (this.element) this.element.classList.remove('hidden');
        
        return new Promise(resolve => {
            console.log('Promise created for popup');
            this.resolvePromise = resolve;
        });
    },
    hide() {
        console.log('customPopup.hide called');
        if (this.element) this.element.classList.add('hidden');
        this.resolvePromise = null;
    },
    
    alert(message, title = 'Meddelande') {
        return this.show(message, title, false);
    },
    
    confirm(message, title = 'Bekräfta') {
        return this.show(message, title, true);
    }
};

// Event listeners
window.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired - starting initialization');
    customPopup.init();
    
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) calculateBtn.addEventListener('click', function() {
        console.log('Calculate button clicked');
        calculateResults(); // Från calculations.js
    });
    
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveCalculation); // Från storage.js
    
    const showSavedBtn = document.getElementById('showSavedBtn');
    if (showSavedBtn) showSavedBtn.addEventListener('click', showSavedCalculations); // Från storage.js
    
    const closeSavedBtn = document.getElementById('closeSavedBtn');
    if (closeSavedBtn) closeSavedBtn.addEventListener('click', closeSavedCalculations); // Från storage.js
    
    const generateAIPromptBtn = document.getElementById('generateAIPromptBtn');
    if (generateAIPromptBtn) generateAIPromptBtn.addEventListener('click', generateCurrentAIPrompt); // Från ai.js
    
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportSavedCalculations); // Från storage.js
    
    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.addEventListener('click', importSavedCalculations); // Från storage.js
    
    // Dölj action buttons från början
    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) {
        actionButtons.classList.add('hidden');
    }
    
    // Dölj AI-prompt knappen från början
    const aiPromptBtn = document.getElementById('generateAIPromptBtn');
    if (aiPromptBtn) {
        aiPromptBtn.classList.add('hidden');
    }
    console.log('Initialization complete');
});