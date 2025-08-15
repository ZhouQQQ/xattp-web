export function speak({ text, lang = 'zh-CN', rate = 1, pitch = 1, volume = 1 }) {
  return new Promise((resolve, reject) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = lang;
    speech.rate = rate;
    speech.pitch = pitch;
    speech.volume = volume;
    
    speech.onend = () => resolve();
    speech.onerror = (error) => reject(error);
    
    window.speechSynthesis.speak(speech);
  });
}

export function getVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

export function generateSpeech({ text, lang = 'zh-CN', rate = 1, pitch = 1, volume = 1 }) {
  return new Promise((resolve, reject) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = lang;
    speech.rate = rate;
    speech.pitch = pitch;
    speech.volume = volume;

    // 这里我们返回语音合成的配置，而不是尝试录制音频
    // 实际的音频生成将在浏览器端通过 Web Speech API 完成
    resolve({
      text: speech.text,
      lang: speech.lang,
      rate: speech.rate,
      pitch: speech.pitch,
      volume: speech.volume
    });
  });
}