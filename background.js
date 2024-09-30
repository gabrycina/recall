chrome.identity.getAuthToken({ interactive: true }, function(token) {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }
  chrome.storage.sync.set({youtubeAuthToken: token});
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTranscript") {
    fetchTranscript(request.videoId, request.currentTime, sender.tab.id)
      .then(transcript => {
        if (sender.tab) {
          chrome.tabs.sendMessage(sender.tab.id, {action: "showQuiz", transcript: transcript});
        }
      })
      .catch(error => console.error('Error fetching transcript:', error));
    return true; // Indicates that the response is sent asynchronously
  }
  if (request.action === "showQuiz") {
    console.log('Received showQuiz message with transcript:', request.transcript);
    if (request.transcript && request.transcript.trim().length > 0) {
      showQuiz(request.transcript);
    } else {
      console.log('Received empty transcript, not showing quiz');
      quizInProgress = false;
    }
  }
});

async function fetchTranscript(videoId, currentTime, tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: extractCaptions,
      args: [currentTime]
    }, (results) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (results && results[0] && results[0].result) {
        resolve(results[0].result);
      } else {
        reject(new Error('Failed to extract captions'));
      }
    });
  });
}

function extractCaptions(currentTime) {
  return new Promise((resolve) => {
    const video = document.querySelector('video');
    let transcript = '';
    let lastCaption = '';
    let captionCheckInterval;

    console.log('Starting caption extraction...');

    if (video) {
      video.currentTime = currentTime;
      
      captionCheckInterval = setInterval(() => {
        const captionsContainer = document.querySelector('.ytp-caption-segment');
        if (captionsContainer) {
          const currentCaption = captionsContainer.textContent.trim();
          if (currentCaption && currentCaption !== lastCaption) {
            transcript += currentCaption + ' ';
            lastCaption = currentCaption;
            console.log('Current transcript:', transcript);
          }
        } else {
          console.log('Captions container not found');
        }
      }, 50);
    } else {
      console.log('Video element not found');
    }

    setTimeout(() => {
      clearInterval(captionCheckInterval);
      if (video) video.pause();
      const finalTranscript = transcript.trim();
      console.log('Finished caption extraction. Final transcript:', finalTranscript);
      
      resolve(finalTranscript);
    }, 30000);
  });
}

