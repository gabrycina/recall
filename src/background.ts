import { extractCaptions } from './utils/captionExtractor';

chrome.identity.getAuthToken({ interactive: true }, function(token) {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }
  chrome.storage.sync.set({youtubeAuthToken: token});
});