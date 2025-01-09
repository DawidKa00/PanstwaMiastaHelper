let answers = {};
let inputMethod = 'placeholder';
let lastGameState = null;
let stableValues = {};

function loadAnswers() {
    fetch(chrome.runtime.getURL('answers.json'))
        .then(response => response.json())
        .then(data => {
            answers = data;
            fillFields();
        })
        .catch(error => console.error('Error loading answers:', error));
}

function getCurrentGameState() {
    const letterElement = document.querySelector("#root-game > div.RoundSettings-module__round-settings-container > div:nth-child(2) > big")
    const categoryElements = document.querySelectorAll('.form-group label');

    if (letterElement && categoryElements.length > 0) {
        const letter = letterElement.textContent.trim().toUpperCase();
        const categories = Array.from(categoryElements).map(el => el.textContent.trim());
        return { letter, categories };
    }
    return null;
}

function getRandomWord(category, letter) {
    if (answers[category] && answers[category][letter]) {
        const words = answers[category][letter];
        return Array.isArray(words) ? words[Math.floor(Math.random() * words.length)] : words;
    }
    return null;
}

function fillFields(forceRefill = false) {
    const gameState = getCurrentGameState();
    if (!gameState) return;

    const { letter, categories } = gameState;
    const inputFields = document.querySelectorAll('.form-group input[type="text"]');
    
    const isNewRound = !lastGameState || lastGameState.letter !== letter;
    if (isNewRound) {
        stableValues = {};
    }

    categories.forEach((category, index) => {
        const inputField = inputFields[index];
        const fieldId = `${category}-${index}`;
        
        if (isNewRound || !stableValues[fieldId] || forceRefill) {
            const randomWord = getRandomWord(category, letter);
            if (randomWord) {
                stableValues[fieldId] = randomWord;
            }
        }

        // Reset and apply the current input method
        inputField.placeholder = `${letter}...`;
        inputField.value = '';

        if (inputMethod === 'placeholder' && stableValues[fieldId]) {
            inputField.placeholder = stableValues[fieldId];
        } else if (inputMethod === 'value' && stableValues[fieldId]) {
            inputField.value = stableValues[fieldId];
            inputField.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    
    lastGameState = gameState;
}

const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList' || 
            (mutation.type === 'attributes' && mutation.attributeName === 'class')) {
            const gameState = getCurrentGameState();
            if (gameState && (!lastGameState || gameState.letter !== lastGameState.letter)) {
                setTimeout(() => fillFields(true), 100);
                break;
            }
        }
    }
});

const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] };

observer.observe(document.body, config);

chrome.storage.sync.get(['inputMethod'], (result) => {
    inputMethod = result.inputMethod || 'placeholder';
    loadAnswers();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.inputMethod) {
        inputMethod = changes.inputMethod.newValue;
        fillFields(true);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'changeInputMethod') {
        inputMethod = request.method;
        fillFields(true);
        sendResponse({status: 'Input method updated'});
    }
});

document.addEventListener('input', (event) => {
    if (event.target.matches('.form-group input[type="text"]')) {
        const category = event.target.closest('.form-group').querySelector('label').textContent.trim();
        const index = Array.from(event.target.closest('.form-group').parentNode.children).indexOf(event.target.closest('.form-group'));
        const fieldId = `${category}-${index}`;
        stableValues[fieldId] = event.target.value;
    }
});