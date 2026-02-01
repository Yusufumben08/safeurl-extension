const SERVER_URL = 'https://safeurl-beta.vercel.app/api';

document.getElementById('scanBtn').addEventListener('click', scanUrl);
document.getElementById('scanCurrentBtn').addEventListener('click', scanCurrentTab);
document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') scanUrl();
});

async function scanUrl() {
    const url = document.getElementById('urlInput').value;
    if (!url) {
        showError('Please enter a URL');
        return;
    }
    await performScan(url);
} 

async function scanCurrentTab() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url) {
            document.getElementById('urlInput').value = tab.url;
            await performScan(tab.url);
        }
    } catch (error) {
        showError('Could not get current tab URL');
    }
}

async function performScan(url) {
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(`${SERVER_URL}/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error('Server error');
        }

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        showError(`Something went wrong, Please retry.`);
    } finally {
        showLoading(false);
    }
}

function displayResults(data) {
    console.log(data);
    if (data.harmless == 0 && data.malicious == 0 && data.suspicious == 0 && data.undetected == 0) {
        setTimeout(() => {
            displayResults(data);
        }, 1000);
        return;
    }
    document.getElementById('harmless').textContent = data.harmless;
    document.getElementById('malicious').textContent = data.malicious;
    document.getElementById('suspicious').textContent = data.suspicious;
    document.getElementById('undetected').textContent = data.undetected;
    document.getElementById('results').style.display = 'block';
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

// Load URL from input on popup open if available
window.addEventListener('load', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            document.getElementById('urlInput').value = tabs[0].url;
        }
    });
});
