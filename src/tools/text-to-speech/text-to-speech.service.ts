export interface TTSOptions {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function speak({ text, lang = 'zh-CN', rate = 1, pitch = 1, volume = 1 }: TTSOptions) {
  return new Promise<void>((resolve, reject) => {
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

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
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

export async function textToAudioBlob(options: TTSOptions): Promise<Blob> {
  const audioContext = new AudioContext();
  const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
  const mediaRecorder = new MediaRecorder(mediaStream);
  
  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (event) => {
    chunks.push(event.data);
  };
  
  mediaRecorder.start();
  await speak(options);
  mediaRecorder.stop();
  
  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      resolve(blob);
      mediaStream.getTracks().forEach(track => track.stop());
    };
  });
}