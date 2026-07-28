export function speak(text, lang = "en-IN") {
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = lang;

  utterance.rate = 1;

  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}