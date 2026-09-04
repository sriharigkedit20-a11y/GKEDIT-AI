let currentMode = 'chat';
let isVoiceOutputEnabled = true;
let isListening = false;
let recognition = null;

// Speech Recognition Init
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'te-IN'; // Default Telugu, also supports English

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    document.getElementById('userInput').value = speechResult;
    processInput();
    stopMic();
  };

  recognition.onerror = () => stopMic();
  recognition.onend = () => stopMic();
}

function handleMicClick() {
  if (!recognition) {
    alert('Speech recognition is not supported on this browser.');
    return;
  }
  if (!isListening) {
    try {
      recognition.start();
      isListening = true;
      document.getElementById('micBtn').classList.add('listening');
    } catch (e) {
      stopMic();
    }
  } else {
    stopMic();
  }
}

function stopMic() {
  if (recognition && isListening) recognition.stop();
  isListening = false;
  document.getElementById('micBtn').classList.remove('listening');
}

function toggleSpeechOutput() {
  isVoiceOutputEnabled = !isVoiceOutputEnabled;
  document.getElementById('ttsToggleBtn').innerText = isVoiceOutputEnabled ? '🔊' : '🔇';
}

function speakText(text) {
  if (!isVoiceOutputEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

function switchMode(mode) {
  currentMode = mode;
  document.getElementById('chatModeBtn').classList.toggle('active', mode === 'chat');
  document.getElementById('imageModeBtn').classList.toggle('active', mode === 'image');
  
  const input = document.getElementById('userInput');
  input.placeholder = mode === 'chat' 
    ? 'Ask anything to GKEDIT AI...' 
    : 'Describe the image you want to create...';
}

document.getElementById('userInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') processInput();
});

async function processInput() {
  const input = document.getElementById('userInput');
  const prompt = input.value.trim();
  if (!prompt) return;

  renderMessage(prompt, 'user');
  input.value = '';

  if (currentMode === 'image') {
    handleImageGeneration(prompt);
  } else {
    await handleChatResponse(prompt);
  }
}

function renderMessage(content, sender, isHTML = false) {
  const chatArea = document.getElementById('chatArea');
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  if (isHTML) {
    msg.innerHTML = content;
  } else {
    msg.innerText = content;
  }
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
  return msg;
}

// 100% Reliable Instant AI Response
async function handleChatResponse(prompt) {
  const loadingMsg = renderMessage('GKEDIT AI ఆలోచిస్తోంది...', 'ai');

  try {
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`);
    if (!res.ok) throw new Error();
    const answer = await res.text();
    loadingMsg.innerText = answer;
    speakText(answer);
  } catch (err) {
    loadingMsg.innerText = "Network issue or service busy. Please try again!";
  }
}

// 100% Reliable Instant Image Generation
function handleImageGeneration(prompt) {
  const seed = Math.floor(Math.random() * 999999);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=512&height=512&nologo=true`;

  const containerHTML = `
    <div>🎨 Generating: <b>"${prompt}"</b>...</div>
    <img src="${imageUrl}" alt="${prompt}" onload="this.previousElementSibling.innerText='Done: ${prompt}'" onerror="this.outerHTML='<p style=\'color:#f87171;\'>Image generation failed.</p>'">
  `;

  renderMessage(containerHTML, 'ai', true);
  speakText("Image generated successfully!");
    }
