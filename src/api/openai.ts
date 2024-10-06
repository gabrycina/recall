export async function callOpenAI(prompt: string) {
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