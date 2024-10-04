"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
chrome.identity.getAuthToken({ interactive: true }, function (token) {
    if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
    }
    chrome.storage.sync.set({ youtubeAuthToken: token });
});
// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    var _a;
    if (request.action === "getTranscript") {
        fetchTranscript(request.videoId, request.currentTime, (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id)
            .then(transcript => {
            if (sender.tab && sender.tab.id) {
                chrome.tabs.sendMessage(sender.tab.id, { action: "showQuiz", transcript: transcript });
            }
        })
            .catch(error => console.error('Error fetching transcript:', error));
        return true; // Indicates that the response is sent asynchronously
    }
    if (request.action === "showQuiz") {
        console.log('Received showQuiz message with transcript:', request.transcript);
        if (request.transcript && request.transcript.trim().length > 0) {
            showQuiz(request.transcript);
        }
        else {
            console.log('Received empty transcript, not showing quiz');
            quizInProgress = false;
        }
    }
});
function fetchTranscript(videoId, currentTime, tabId) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            if (tabId === undefined) {
                reject(new Error('Tab ID is undefined'));
                return;
            }
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: extractCaptions,
                args: [currentTime]
            }, (results) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else if (results && results[0] && results[0].result) {
                    resolve(results[0].result);
                }
                else {
                    reject(new Error('Failed to extract captions'));
                }
            });
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
                var _a;
                const captionsContainer = document.querySelector('.ytp-caption-segment');
                if (captionsContainer) {
                    const currentCaption = (_a = captionsContainer.textContent) === null || _a === void 0 ? void 0 : _a.trim();
                    if (currentCaption && currentCaption !== lastCaption) {
                        transcript += currentCaption + ' ';
                        lastCaption = currentCaption;
                        console.log('Current transcript:', transcript);
                    }
                }
                else {
                    console.log('Captions container not found');
                }
            }, 50);
        }
        else {
            console.log('Video element not found');
        }
        setTimeout(() => {
            if (captionCheckInterval) {
                clearInterval(captionCheckInterval);
            }
            if (video) {
                video.pause();
            }
            const finalTranscript = transcript.trim();
            console.log('Finished caption extraction. Final transcript:', finalTranscript);
            resolve(finalTranscript);
        }, 30000);
    });
}
