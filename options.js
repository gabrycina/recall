document.getElementById('save').addEventListener('click', () => {
  const openAIKey = document.getElementById('openAIKey').value;
  chrome.storage.sync.set({openAIKey: openAIKey}, () => {
    alert('Settings saved successfully!');
  });
});

// Load saved API key when options page is opened
chrome.storage.sync.get(['openAIKey'], (data) => {
  if (data.openAIKey) {
    document.getElementById('openAIKey').value = data.openAIKey;
  }
});
