let currentInputMethod = 'placeholder';

// Funkcja do ustawiania metody wprowadzania
function setInputMethod(method) {
    currentInputMethod = method;
    chrome.storage.sync.set({ inputMethod: method }, function() {
        console.log('Input method saved: ' + method);
    });
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "changeInputMethod", method: method});
    });
}

// Funkcja do aktualizacji statusu
function updateStatus(message) {
    const status = document.getElementById('status');
    status.textContent = message;
    setTimeout(() => {
        status.textContent = '';
    }, 3000);
}

// Obsługa kliknięć na przyciski radiowe
document.getElementById('placeholder').addEventListener('click', () => {
    currentInputMethod = 'placeholder';
});

document.getElementById('value').addEventListener('click', () => {
    currentInputMethod = 'value';
});

// Obsługa kliknięcia przycisku "Zapisz"
document.getElementById('saveButton').addEventListener('click', () => {
    setInputMethod(currentInputMethod);
    updateStatus('Ustawienia zostały zapisane!');
});

// Wczytanie zapisanej metody przy otwarciu popup
chrome.storage.sync.get(['inputMethod'], (result) => {
    currentInputMethod = result.inputMethod || 'placeholder';
    document.getElementById(currentInputMethod).checked = true;
});