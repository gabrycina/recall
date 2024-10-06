import { generateQuestionFromContent } from './quizGenerator';
import { pauseVideo, resumeVideo } from '../utils/videoControls';
import { extractCaptions } from '../utils/captionExtractor';

const CONTENT_THRESHOLD = 100;
let quizInProgress = false;
let transcriptionInProgress = false;

export function manageQuizAndTranscriptIntervals() {
  console.log('Setting up transcript extraction intervals');
  const interval = 1 * 30 * 1000; // 30 seconds in milliseconds

  // Function to handle the interval logic
  const handleInterval = () => {
    if (!quizInProgress && !transcriptionInProgress) {
      console.log('Attempting to extract transcript');
      transcriptionInProgress = true;
      const video = document.querySelector('video');
      const currentTime = video ? video.currentTime : 0;
      const videoId = new URLSearchParams(window.location.search).get('v');
      console.log('Triggering transcript extraction for video:', videoId, 'at time:', currentTime);

      extractCaptions(currentTime, CONTENT_THRESHOLD).then((transcript) => {
        transcriptionInProgress = false;
        if (typeof transcript === 'string' && transcript !== "") {
          showQuiz(transcript);
        }
      }).catch(error => {
        console.error('Error extracting captions:', error);
        transcriptionInProgress = false;
      });
    } else if (quizInProgress) {
      console.log('Quiz already in progress, skipping this interval');
    } else {
      console.log('Transcription already in progress, skipping this interval');
    }
  };

  // Execute immediately
  handleInterval();

  // Then set up the interval
  setInterval(handleInterval, interval);
}

export async function showQuiz(transcript: string) {
  if (quizInProgress) {
    console.log('Quiz already in progress, skipping');
    return;
  }

  console.log('Preparing to show quiz');

  try {
    console.log('Generating question from content');
    const { question, options, correctAnswer } = await generateQuestionFromContent(transcript);
    console.log('Generated question:', question);
    console.log('Options:', options);
    console.log('Correct answer:', correctAnswer);
    
    if (!question || !options || !correctAnswer) {
      throw new Error('Failed to generate a valid question');
    }
    
    quizInProgress = true;

    // Remove any existing quiz containers
    const existingQuizContainers = document.querySelectorAll('#yt-quiz-container');
    existingQuizContainers.forEach(container => container.remove());

    // Create and display the quiz
    const quizContainer = document.createElement('div');
    quizContainer.id = 'yt-quiz-container';
    quizContainer.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-10 rounded-lg shadow-lg z-50 max-w-xl w-full';
    quizContainer.innerHTML = `
      <h2 class="text-3xl font-bold mb-6">${question}</h2>
      <div id="options" class="space-y-4 text-xl"></div>
      <button id="submit-answer" class="mt-6 w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300">Submit</button>
    `;

    const optionsContainer = quizContainer.querySelector('#options');
    options.forEach((option: string | null) => {
      const button = document.createElement('button');
      if (option !== null) {
        button.textContent = option;
        button.className = 'block w-full p-3 bg-gray-200 rounded hover:bg-gray-300';
        button.addEventListener('click', () => selectOption(button));
        if (optionsContainer) {
          optionsContainer.appendChild(button);
        }
      }
    });

    const submitButton = quizContainer.querySelector('#submit-answer');
    if (submitButton) {
      submitButton.addEventListener('click', () => checkAnswer(correctAnswer));
    }

    document.body.appendChild(quizContainer);
    console.log('Quiz displayed successfully');
    pauseVideo();
  } catch (error: unknown) {
    console.error('Error in showQuiz:', error);
    if (error instanceof Error) {
      alert(`An error occurred while generating the quiz: ${error.message}`);
    } else {
      alert('An unexpected error occurred while generating the quiz.');
    }
    resumeVideo();
    quizInProgress = false;
  }
}

function selectOption(button: HTMLButtonElement) {
  const options = document.querySelectorAll('#options button');
  options.forEach(opt => opt.classList.remove('selected'));
  button.classList.add('selected');
}

function checkAnswer(correctAnswer: string | null) {
  const selectedOption = document.querySelector('#options button.selected');
  if (selectedOption) {
    if (selectedOption.textContent === correctAnswer) {
      alert('Correct!');
      const quizContainer = document.getElementById('yt-quiz-container');
      if (quizContainer) {
        quizContainer.remove();
      }
      resumeVideo();
      quizInProgress = false;
    } else {
      alert(`Incorrect. The correct answer is: ${correctAnswer}`);
    }
  } else {
    alert('Please select an answer before submitting.');
  }
}
