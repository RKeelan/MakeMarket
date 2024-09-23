document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('marketForm');
  const cancelButton = document.getElementById('cancelButton');

  // Listen for the initial market data
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'populateForm') {
      document.getElementById('question').value = request.marketData.question;
      document.getElementById('description').value = request.marketData.description;
      // Convert milliseconds to local date-time string for input
      document.getElementById('closeTime').value = new Date(request.marketData.closeTime).toLocaleString();
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
      description: document.getElementById('description').value,
      closeTime: closeTimeDate.getTime(), // Convert to milliseconds since epoch
      initialProbability: 50,
    };
    chrome.runtime.sendMessage({ action: 'submitMarket', marketData: marketData });
  });

  cancelButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'cancelMarket' });
  });
});