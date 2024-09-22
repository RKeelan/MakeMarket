console.log('Background script loaded');

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed or updated');
    chrome.contextMenus.create({
      id: "createPredictionMarketContextMenuEntry",
      title: "Create Prediction Market for Tweet",
      contexts: ["link"],
      documentUrlPatterns: ["https://twitter.com/*"]
    }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating context menu:', chrome.runtime.lastError);
        } else {
          console.log('Context menu created successfully');
        }
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('Context menu clicked', info, tab);
    if (info.menuItemId === "createPredictionMarketContextMenuEntry") {
      const tweetUrl = info.linkUrl;
      const tweetId = tweetUrl.split('/').pop().split('?')[0];
      
      chrome.tabs.sendMessage(tab.id, {action: "getTweetDetails", tweetId: tweetId}, response => {
        if (response && response.tweet) {
          createPredictionMarket(response.tweet);
        }
      });
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "createPredictionMarketAction") {
      createPredictionMarket(request.tweet);
    }
  });
  
  async function createPredictionMarket(tweet) {
    console.log('Creating prediction market for tweet:', tweet);
  }

