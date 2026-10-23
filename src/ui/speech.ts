const KEY = 'arcanopee.voice';

export function voiceEnabled(): boolean {
  return localStorage.getItem(KEY) === '1';
}

export function setVoiceEnabled(on: boolean) {
  localStorage.setItem(KEY, on ? '1' : '0');
  if (!on) window.speechSynthesis?.cancel();
}

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string) {
  if (!speechAvailable() || !voiceEnabled()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.rate = 0.95;
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('fr'));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}
