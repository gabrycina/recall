export function pauseVideo() {
  const video = document.querySelector('video');
  if (video) {
    video.pause();
  }
}

export function resumeVideo() {
  const video = document.querySelector('video');
  if (video) {
    video.play();
  }
}

export function getCurrentTime(): number {
  const video = document.querySelector('video');
  return video ? video.currentTime : 0;
}