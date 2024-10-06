import { showQuiz, manageQuizAndTranscriptIntervals } from './quiz/quizManager';

function injectTailwindCSS() {
  const link = document.createElement('link');
  link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

injectTailwindCSS();

document.addEventListener('yt-navigate-finish', () => {
  console.log('YouTube navigation finished');
  if (window.location.pathname === '/watch') {
    console.log('On a watch page, triggering transcript extraction');
    manageQuizAndTranscriptIntervals();
  } else {
    console.log('Not on a watch page, quiz not triggered');
  }
});