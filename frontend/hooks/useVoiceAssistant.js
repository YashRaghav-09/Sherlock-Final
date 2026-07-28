import { useEffect, useRef, useState } from "react";

export default function useVoiceAssistant(onResult) {
  const recognitionRef = useRef(null);

  const [listening, setListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      const lang = recognition.lang;

      if (onResult) {
        onResult(transcript, lang);
      }
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  const startListening = (language = "en-IN") => {
    if (!recognitionRef.current) return;

    recognitionRef.current.lang = language;

    recognitionRef.current.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  return {
    listening,
    startListening,
    stopListening,
  };
}