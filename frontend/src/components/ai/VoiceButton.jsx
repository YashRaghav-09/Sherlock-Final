import { Mic, MicOff } from "lucide-react";
import useVoiceAssistant from "../../hooks/useVoiceAssistant";
import { speak } from "../../services/voiceService";
import VoiceWave from "./VoiceWave";

export default function VoiceButton({ onTranscript }) {
  const { listening, startListening, stopListening } =
    useVoiceAssistant(async (text, lang) => {
      if (onTranscript) {
        const response = await onTranscript(text, lang);

        if (response) {
          speak(response, lang);
        }
      }
    });

  const toggleVoice = () => {
    if (listening) {
      stopListening();
      return;
    }

   const language = prompt(
  "Choose Language:\n\n1 = English\n2 = Hindi\n3 = Kannada",
  "1"
);

let selectedLanguage = "en-IN";

switch (language) {
  case "2":
    selectedLanguage = "hi-IN";
    break;

  case "3":
    selectedLanguage = "kn-IN";
    break;

  default:
    selectedLanguage = "en-IN";
}

startListening(selectedLanguage);
  };

  return (
    <div className="w-full">
      <button
        onClick={toggleVoice}
        className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg py-2 transition"
      >
        {listening ? <MicOff size={18} /> : <Mic size={18} />}
        {listening ? "Listening..." : "Voice"}
      </button>

      <VoiceWave listening={listening} />
    </div>
  );
}