import './styles.css';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('marketForm');
    const cancelButton = document.getElementById('cancelButton');
    const timeZoneElement = document.getElementById('timeZone');

    // Display user's time zone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    timeZoneElement.textContent = `Time zone: ${timeZone}`;

    // Listen for the initial market data
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'populateForm') {
            document.getElementById('question').value = request.marketData.question;
            document.getElementById('description').value = request.marketData.descriptionHtml;

            // Convert milliseconds to ISO string for datetime-local input
            const closeDate = new Date(request.marketData.closeTime);
            document.getElementById('closeTime').value = closeDate.toISOString().slice(0, 16);
        } else if (request.action === 'submitError') {
            alert(`Error creating market: ${request.error}`);
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const closeTimeDate = new Date(document.getElementById('closeTime').value);
        const marketData = {
            outcomeType: 'BINARY',
            question: document.getElementById('question').value,
            descriptionHtml: document.getElementById('description').value,
            closeTime: closeTimeDate.getTime(), // Convert to milliseconds since epoch
            initialProbability: 50,
        };
        chrome.runtime.sendMessage({ action: 'submitMarket', marketData: marketData });
    });

    cancelButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'cancelMarket' });
    });
});