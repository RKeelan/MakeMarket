console.log('Background script loaded');

chrome.storage.local.get(['apiKey'], function (result) {
  const apiKey = result.apiKey;
  if (apiKey) {
    // Use the apiKey here
  } else {
    console.log('API key not set. Please set it in the extension options.');
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed or updated');
  chrome.contextMenus.create({
    id: "createPredictionMarketContextMenuEntry",
    title: "Create Prediction Market for Tweet",
    contexts: ["link"],
    documentUrlPatterns: [
      "https://twitter.com/*",
      "https://x.com/*"
    ]
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

    chrome.tabs.sendMessage(tab.id, { action: "getTweetDetails", tweetId: tweetId }, response => {
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
  createManifoldMarket(tweet);
}

async function createManifoldMarket(tweet) {
  // Truncate the tweet text if it's too long
  const maxTweetLength = 50;
  const truncatedTweet = tweet.text.length > maxTweetLength
    ? tweet.text.substring(0, maxTweetLength - 3) + '...'
    : tweet.text;

  // Create the question with a maximum of 120 characters
  const questionPrefix = `Will @${tweet.username}'s tweet prove correct: "`;
  const questionSuffix = '"?';
  const maxTweetInQuestion = 120 - questionPrefix.length - questionSuffix.length;
  const tweetInQuestion = truncatedTweet.length > maxTweetInQuestion
    ? truncatedTweet.substring(0, maxTweetInQuestion - 3) + '...'
    : truncatedTweet;

  const marketData = {
    outcomeType: 'BINARY',
    question: `${questionPrefix}${tweetInQuestion}${questionSuffix}`,
    closeTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now in milliseconds
    descriptionMarkdown: `
This market was created by MakeMarket, which is meant to allow quick generation of markets and uses these default rules unless otherwise stated:

This market is about the following tweet by @${tweet.username}:

${createSimpleTweetMarkdown(tweet)}

Resolution criteria:
- This market resolves to YES if the Tweet centrally holds up or appears centrally true by the deadline.
- The market resolves to NO if the Tweet does not centrally hold up or appears centrally false by the deadline.
- If the deadline is reached and this cannot be resolved to either YES or NO, but that looks to be possible soon, the deadline will be extended.
- If the deadline is reached and a full YES or NO resolution does not appear possible soon, this will resolve to a fair percentage by market creator's best judgment, by default as indicated by the market price.
- If and only if this market proves popular, the market creator is encouraged to and reserves the right to clarify these rules and specify a more robust, detailed and appropriate resolution mechanism that adheres to the intent of a market based on the linked Tweet.
    `,
    initialProbability: 50,
  };

  console.log('Form URL:', chrome.runtime.getURL('market_form.html'));
  // Open a new tab with the form
  chrome.tabs.create({ url: chrome.runtime.getURL('market_form.html') }, (tab) => {
    // Listen for messages from the form
    chrome.runtime.onMessage.addListener(function listener(request, sender, sendResponse) {
      if (request.action === 'submitMarket' && sender.tab.id === tab.id) {
        submitMarket(request.marketData, tab.id);
        chrome.runtime.onMessage.removeListener(listener);
      } else if (request.action === 'cancelMarket' && sender.tab.id === tab.id) {
        chrome.tabs.remove(tab.id);
        chrome.runtime.onMessage.removeListener(listener);
      }
    });

    // Send market data to the form
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, { action: 'populateForm', marketData: marketData });
        chrome.tabs.onUpdated.removeListener(listener);
      }
    });
  });
}

async function submitMarket(marketData, tabId) {
  try {
    // Fetch the Manifold API key from Chrome storage
    const result = await chrome.storage.sync.get(['manifoldApiKey']);
    const manifoldApiKey = result.manifoldApiKey;

    if (!manifoldApiKey) {
      throw new Error('Manifold API key not set. Please set it in the extension options.');
    }

    console.log('Submitting market to Manifold:', marketData);
    const response = await fetch('https://api.manifold.markets/v0/market', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${manifoldApiKey}`,
      },
      body: JSON.stringify(marketData),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`HTTP error ${response.status}: ${errorBody}`);
      throw new Error(`HTTP error: ${response.status}. Details: ${errorBody}`);
    }

    const marketResult = await response.json();
    console.log('Market created successfully:', marketResult);

    // Close the form tab and open the new market
    chrome.tabs.remove(tabId);
    chrome.tabs.create({ url: marketResult.url });

    return marketResult;
  } catch (error) {
    console.error('Error creating market:', error);
    // Send error message to the form
    chrome.tabs.sendMessage(tabId, { action: 'submitError', error: error.message });
    throw error;
  }
}

function createSimpleTweetMarkdown(tweet) {
  if (!tweet) return '';
  return `
> ${tweet.text}
> 
> — ${tweet.author} (@${tweet.username})
> 
> [Link to tweet](${tweet.url})
  `;
}