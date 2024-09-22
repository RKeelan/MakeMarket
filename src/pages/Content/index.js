console.log('Content script loaded');

  
  function extractTweetDetails(tweetElement) {
    const statusLink = tweetElement.querySelector('a[href*="/status/"]');
    const id = statusLink.href.split('/').pop().split('?')[0];
    console.log('Extracted tweet ID:', id);

    const text = tweetElement.querySelector(`[data-testid="tweetText"]`).textContent;
    console.log('Extracted tweet text:', text);

    const username = statusLink.href.split('/')[3];
    console.log('Extracted username:', username);

    return {
      id: id,
      text: text,
      username: username
    };
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === "getTweetDetails") {
      const tweetElement = document.querySelector(`a[href*="${request.tweetId}"]`).closest('article');
      if (tweetElement) {
        const tweet = extractTweetDetails(tweetElement);
        sendResponse({tweet: tweet});
      } else {
        sendResponse({error: "Tweet not found"});
      }
    }
    return true;
  });
