import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Bot, X, Volume2, VolumeX, Keyboard, Mic, MicOff, Send } from "lucide-react";
import api from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

const VOICE_LANGUAGES = [
  { code: "en-IN", label: "English", name: "English" },
  { code: "hi-IN", label: "हिंदी", name: "Hindi" },
  { code: "kn-IN", label: "ಕನ್ನಡ", name: "Kannada" },
  { code: "ta-IN", label: "தமிழ்", name: "Tamil" },
  { code: "te-IN", label: "తెలుగు", name: "Telugu" },
  { code: "bn-IN", label: "বাংলা", name: "Bengali" },
  { code: "mr-IN", label: "मराठी", name: "Marathi" },
  { code: "gu-IN", label: "ગુજરાતી", name: "Gujarati" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ", name: "Punjabi" },
  { code: "ml-IN", label: "മലയാളം", name: "Malayalam" },
  { code: "ur-IN", label: "اردو", name: "Urdu" },
];

const LANG_MAP_FROM_APP = { en: "en-IN", hi: "hi-IN", kn: "kn-IN" };

export default function VoiceAssistant() {
  const { t, lang } = useLanguage();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [inputMode, setInputMode] = useState("chat"); // "chat" | "voice"
  const [messages, setMessages] = useState([]); // { id, role, text }
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState("");
  const [muted, setMuted] = useState(false);
  const [voiceLang, setVoiceLang] = useState(LANG_MAP_FROM_APP[lang] || "en-IN");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);
  const supported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition) &&
    window.speechSynthesis;

  const stopEverything = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
    window.speechSynthesis?.cancel();
    setStatus("idle");
  }, []);

  useEffect(() => () => stopEverything(), [stopEverything]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const currentVoiceLangEntry =
    VOICE_LANGUAGES.find((l) => l.code === voiceLang) || VOICE_LANGUAGES[0];

  const speak = (text) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;
    utterance.rate = 1.05;
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (text, viaVoice = false) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTranscript("");
    setStatus("processing");

    try {
      const payload =
        viaVoice && voiceLang !== "en-IN"
          ? `Please respond only in ${currentVoiceLangEntry.name}. ${text.trim()}`
          : text.trim();

      const res = await api.post("/api/ai/chat", { message: payload });
      const reply = res.data.reply || "I could not generate a response.";
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: reply }]);

      if (!muted) {
        speak(reply);
      } else {
        setStatus("idle");
      }
    } catch (err) {
      console.error("Chat failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "ai",
          text: "Sherlock AI could not be reached. Check your API key in the backend .env file.",
        },
      ]);
      setStatus("idle");
    }
  };

  const handleTextSend = () => {
    if (!input.trim() || status === "processing") return;
    sendMessage(input, false);
  };

  const startListening = () => {
    if (!supported) {
      setMessages((prev) => [...prev, { id: Date.now(), role: "ai", text: t("voiceNotSupported") }]);
      return;
    }

    setTranscript("");
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onspeechend = () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setStatus("idle");
    };

    recognition.onend = () => {
      setStatus((current) => (current === "listening" ? "idle" : current));
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // When recognition finishes with a transcript, send it (voice mode only)
  useEffect(() => {
    if (status === "idle" && transcript.trim()) {
      const text = transcript.trim();
      setTranscript("");
      sendMessage(text, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleMicClick = () => {
    if (status === "listening" || status === "processing" || status === "speaking") {
      stopEverything();
    } else {
      startListening();
    }
  };

  const switchMode = (mode) => {
    stopEverything();
    setInputMode(mode);
  };

  const closeWidget = () => {
    stopEverything();
    setOpen(false);
  };

  // Voice assistant is not shown on the login page
  const hideOnLogin = location.pathname === "/login";
  if (hideOnLogin) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 shadow-2xl shadow-cyan-500/40 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Bot size={26} className="text-white" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 flex flex-col overflow-hidden animate-[fadeSlideIn_0.25s_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-900" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{t("sherlockAI")}</h3>
                <p className="text-green-400 text-xs">{t("online")}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowLangPicker((v) => !v)}
                className="text-slate-400 hover:text-cyan-400 transition px-2 py-1 text-xs border border-slate-700 rounded-lg"
              >
                {currentVoiceLangEntry.label}
              </button>
              <button
                onClick={() => setMuted((m) => !m)}
                className="text-slate-400 hover:text-white transition p-1.5"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button onClick={closeWidget} className="text-slate-400 hover:text-white transition p-1.5">
                <X size={18} />
              </button>
            </div>
          </div>

          {showLangPicker && (
            <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap gap-2">
              {VOICE_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setVoiceLang(l.code);
                    setShowLangPicker(false);
                  }}
                  className={`text-xs px-3 py-1 rounded-full border transition ${
                    voiceLang === l.code
                      ? "bg-cyan-500 border-cyan-500 text-white"
                      : "border-slate-700 text-slate-400 hover:border-cyan-500"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <p className="text-slate-500 text-sm text-center mt-10">{t("voiceTapMicToStart")}</p>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-[fadeSlideUp_0.25s_ease-out]`}
              >
                {m.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 mr-2">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-cyan-600 text-white rounded-br-sm"
                      : "bg-slate-800 text-slate-200 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {status === "processing" && (
              <div className="flex justify-start animate-[fadeSlideUp_0.2s_ease-out]">
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 mr-2">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {inputMode === "voice" && status === "listening" && transcript && (
              <div className="flex justify-end animate-[fadeSlideUp_0.2s_ease-out]">
                <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm bg-cyan-600/50 text-white rounded-br-sm italic">
                  {transcript}
                </div>
              </div>
            )}
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-2 px-4 pt-3 shrink-0">
            <button
              onClick={() => switchMode("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl transition ${
                inputMode === "chat" ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              <Keyboard size={14} /> {t("chatTab")}
            </button>
            <button
              onClick={() => switchMode("voice")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl transition ${
                inputMode === "voice" ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              <Mic size={14} /> {t("voiceTab")}
            </button>
          </div>

          {/* Footer input */}
          <div className="p-4 shrink-0">
            {inputMode === "chat" ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSend()}
                  placeholder={t("askSherlockPlaceholder")}
                  className="flex-1 h-11 rounded-xl bg-slate-800 border border-slate-700 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition"
                />
                <button
                  onClick={handleTextSend}
                  disabled={!input.trim() || status === "processing"}
                  className="w-11 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 flex items-center justify-center transition shrink-0"
                >
                  <Send size={18} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2">
                <button onClick={handleMicClick} className="relative w-16 h-16 flex items-center justify-center">
                  {status === "listening" && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping" />
                      <span className="absolute inset-[-6px] rounded-full border-2 border-cyan-400/40 animate-pulse" />
                    </>
                  )}
                  {status === "processing" && (
                    <span className="absolute inset-[-3px] rounded-full border-2 border-yellow-400/50 border-t-transparent animate-spin" />
                  )}
                  {status === "speaking" && (
                    <span className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
                  )}
                  <div
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                      status === "listening"
                        ? "bg-cyan-500"
                        : status === "processing"
                        ? "bg-yellow-500"
                        : status === "speaking"
                        ? "bg-green-500"
                        : "bg-gradient-to-br from-cyan-500 to-blue-700"
                    }`}
                  >
                    {status === "listening" ? (
                      <MicOff size={22} className="text-white" />
                    ) : (
                      <Mic size={22} className="text-white" />
                    )}
                  </div>
                </button>

                {status === "listening" && (
                  <div className="flex items-end gap-1 h-5 mt-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="w-1 bg-cyan-400 rounded-full animate-[waveform_0.8s_ease-in-out_infinite]"
                        style={{ animationDelay: `${i * 0.1}s`, height: "100%" }}
                      />
                    ))}
                  </div>
                )}

                <p className="text-slate-400 text-xs mt-2 text-center">
                  {status === "listening" && t("voiceListening")}
                  {status === "processing" && t("voiceProcessing")}
                  {status === "speaking" && t("voiceSpeaking")}
                  {status === "idle" && t("tapToTalk")}
                </p>

                {!supported && (
                  <p className="text-yellow-400 text-xs text-center mt-2">{t("voiceNotSupported")}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes waveform { 0%, 100% { height: 30%; } 50% { height: 100%; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}