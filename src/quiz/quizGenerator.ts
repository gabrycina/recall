import { callOpenAI } from '../api/openai';

export async function generateQuestionFromContent(transcript: string) {
  console.log('Generating question from transcript');
  
  if (!transcript || transcript.trim().length === 0) {
    console.log('No transcript available, generating fallback question');
    return generateFallbackQuestion();
  }
  
  console.log('Generating question using OpenAI');
  const prompt = `Based on the following transcript from a YouTube video, generate a multiple-choice question with 4 options. Format the response as JSON with keys: question, options (an array of 4 strings), and correctAnswer. The correct answer has to be included as one of the options. Don't mention the word "transcript" in the question, insteas refer to it as the "video" if needed. Transcript: ${transcript}`;
  
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

function generateFallbackQuestion() {
  const videoTitle = document.querySelector('.title.ytd-video-primary-info-renderer')?.textContent || 'this video';
  return {
    question: `Based on the title "${videoTitle}", what do you think this video is about?`,
    options: ["Science and Technology", "History and Culture", "Arts and Entertainment", "Other"],
    correctAnswer: "Science and Technology" // This is a guess, you might want to randomize this
  };
}

// Include other quiz-related functions here (generateSimpleQuestion, extractKeywords, generateOptions, shuffleArray)