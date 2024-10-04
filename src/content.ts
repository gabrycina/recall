// Function to pause the video
function pauseVideo() {
  const video = document.querySelector('video');
  if (video) {
    video.pause();
  }
}

// Function to resume the video
function resumeVideo() {
  const video = document.querySelector('video');
  if (video) {
    video.play();
  }
}

// Function to trigger quizzes at intervals
let quizInProgress = false;

function triggerQuizAtIntervals() {
  console.log('Setting up quiz intervals');
  const interval = 1 * 30 * 1000; // 30 seconds in milliseconds
  setInterval(() => {
    if (!quizInProgress) {
      console.log('Interval triggered, attempting to show quiz');
      triggerTranscriptExtraction();
    } else {
      console.log('Quiz already in progress, skipping this interval');
    }
  }, interval);
}

// Function to show the quiz
async function showQuiz(transcript: string) {
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
    
    // Set quizInProgress to true only when we're about to display the quiz
    quizInProgress = true;

    // Remove any existing quiz containers
    const existingQuizContainers = document.querySelectorAll('#yt-quiz-container');
    existingQuizContainers.forEach(container => container.remove());

    // Create and display the quiz
    const quizContainer = document.createElement('div');
    quizContainer.id = 'yt-quiz-container';
    quizContainer.innerHTML = `
      <h2>${question}</h2>
      <div id="options"></div>
      <button id="submit-answer">Submit</button>
    `;

    const optionsContainer = quizContainer.querySelector('#options');
    options.forEach((option: string | null) => {
      const button = document.createElement('button');
      if (option !== null) {
        button.textContent = option;
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

// Function to select an option
function selectOption(button: HTMLButtonElement) {
  const options = document.querySelectorAll('#options button');
  options.forEach(opt => opt.classList.remove('selected'));
  button.classList.add('selected');
}

// Function to check the answer
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

function triggerTranscriptExtraction() {
  const video = document.querySelector('video');
  const currentTime = video ? video.currentTime : 0;
  const videoId = new URLSearchParams(window.location.search).get('v');
  console.log('Triggering transcript extraction for video:', videoId, 'at time:', currentTime);
  chrome.runtime.sendMessage({action: "getTranscript", videoId: videoId, currentTime: currentTime});
}

async function generateQuestionFromContent(transcript: string) {
  console.log('Generating question from transcript');
  
  if (!transcript || transcript.trim().length === 0) {
    console.log('No transcript available, generating fallback question');
    return generateFallbackQuestion();
  }
  
  console.log('Generating question using OpenAI');
  const prompt = `Based on the following transcript from a YouTube video, generate a multiple-choice question with 4 options. Format the response as JSON with keys: question, options (an array of 4 strings), and correctAnswer. The correct answer has to be one of the options. Don't mention the "transcript" in the question. Transcript: ${transcript}`;
  
  try {
    const response = await callOpenAI(prompt);
    const questionData = JSON.parse(response);
    console.log('Generated question:', questionData);
    return questionData;
  } catch (error) {
    console.error('Error generating question with OpenAI:', error);
    return generateFallbackQuestion();
  }
}

function generateSimpleQuestion(transcript: string) {
  console.log('Generating simple question from transcript');
  
  const words = transcript.split(' ');
  if (words.length < 5) {
    console.log('Transcript too short, generating fallback question');
    return generateFallbackQuestion();
  }
  
  const keywords = extractKeywords(transcript);
  console.log('Extracted keywords:', keywords);
  
  if (keywords.length === 0) {
    return generateFallbackQuestion();
  }
  
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
  console.log('Selected random keyword:', randomKeyword);
  
  const questionTemplates = [
    `What is the significance of "${randomKeyword}" in this context?`,
    `How does "${randomKeyword}" relate to the main topic of the video?`,
    `What role does "${randomKeyword}" play in the discussion?`,
    `Why is "${randomKeyword}" important in this video?`
  ];
  
  const question = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
  console.log('Generated question:', question);
  
  const options = generateOptions(randomKeyword, keywords);
  console.log('Generated options:', options);
  
  return {
    question: question,
    options: options,
    correctAnswer: randomKeyword
  };
}

function extractKeywords(transcript: string) {
  const words = transcript.toLowerCase().split(/\W+/);
  const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can']);
  const wordFrequency: { [key: string]: number } = {};
  
  words.forEach((word: string) => {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });
  
  // Sort words by frequency and return top 10
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
}

function generateOptions(correctAnswer: string, keywords: string[]) {
  const options = [correctAnswer];
  while (options.length < 4 && keywords.length > 0) {
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    if (!options.includes(randomKeyword)) {
      options.push(randomKeyword);
    }
    keywords = keywords.filter(k => k !== randomKeyword);
  }
  while (options.length < 4) {
    options.push(`Option ${options.length + 1}`);
  }
  return shuffleArray(options);
}

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateFallbackQuestion() {
  const videoTitle = document.querySelector('.title.ytd-video-primary-info-renderer')?.textContent || 'this video';
  return {
    question: `Based on the title "${videoTitle}", what do you think this video is about?`,
    options: ["Science and Technology", "History and Culture", "Arts and Entertainment", "Other"],
    correctAnswer: "Science and Technology" // This is a guess, you might want to randomize this
  };
}

// Ensure this function is called when the video starts
document.addEventListener('yt-navigate-finish', () => {
  console.log('YouTube navigation finished');
  if (window.location.pathname === '/watch') {
    console.log('On a watch page, triggering transcript extraction');
    triggerTranscriptExtraction();
    triggerQuizAtIntervals();
  } else {
    console.log('Not on a watch page, quiz not triggered');
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

async function callOpenAI(prompt: string) {
  const apiKey = await getOpenAIKey();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{"role": "user", "content": prompt}],
      max_tokens: 150
    })
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function getOpenAIKey(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('openAIKey', (data) => {
      resolve(data.openAIKey);
    });
  });
}