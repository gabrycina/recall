export function extractCaptions(currentTime: number, contentThreshold: number) {
  return new Promise((resolve) => {
    const video = document.querySelector('video');
    let transcript = '';
    let lastCaption = '';
    let captionCheckInterval: NodeJS.Timeout;

    console.log('Starting caption extraction...');

    if (video) {
      video.currentTime = currentTime;
      
      captionCheckInterval = setInterval(() => {
        const captionsContainer = document.querySelector('.ytp-caption-segment');
        if (captionsContainer) {
          const currentCaption = captionsContainer.textContent?.trim();
          if (currentCaption && currentCaption !== lastCaption) {
            transcript += currentCaption + ' ';
            lastCaption = currentCaption;
            console.log('Current transcript:', transcript);

            // Check if the transcript length has reached the threshold
            if (transcript.split(' ').length >= contentThreshold) {
              clearInterval(captionCheckInterval);
              console.log('Content threshold reached, resolving transcript');
              resolve(transcript.trim());
            }
          }
        } else {
          console.log('Captions container not found');
        }
      }, 50);
    } else {
      console.log('Video element not found');
    }

    // Fallback to resolve after a certain time if threshold isn't met
    setTimeout(() => {
        if (captionCheckInterval) {
            clearInterval(captionCheckInterval);
        }

        resolve(''); // Resolve with an empty string if threshold is not met
    }, 900000);
  });
}