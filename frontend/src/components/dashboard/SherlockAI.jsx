import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Mic,
  MicOff,
  MessageCircle,
  ScanLine,
  BrainCircuit,
  Sparkles,
  Send,
  X,
  Volume2,
  VolumeX,
  AlertCircle,
  PhoneOff,
  ArrowLeft,
} from "lucide-react";
import api from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

const SPEECH_LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
};

const LANG_INSTRUCTION = {
  en: "",
  hi: " Please respond in Hindi (Devanagari script).",
  kn: " Please respond in Kannada (Kannada script).",
};

const VOICE_LANGS = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिं" },
  { code: "kn", label: "ಕನ" },
];

export default function SherlockAI() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  // "home" | "chat" | "voice"
  const [view, setView] = useState("home");

  // ---- Chat state ----
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const messagesEndRef = useRef(null);

  // ---- Voice call state ----
  const [voiceLang, setVoiceLang] = useState(lang || "en");
  const [callStatus, setCallStatus] = useState("idle"); // idle | listening | processing | speaking
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [autoListen, setAutoListen] = useState(true);

  // ---- Shared voice plumbing ----
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceError, setVoiceError] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setVoiceError("Voice input isn't supported in this browser.");
      return;
    }

    if (window.isSecureContext === false) {
      setVoiceError("Voice input needs a secure connection (localhost or https).");
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setLiveTranscript(text);
      setInput(text);
    };

    // Cut off as soon as speech pauses instead of waiting on the browser's
    // longer default silence timeout — makes it feel real-time.
    recognition.onspeechend = () => {
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError("Microphone access was blocked. Allow it in your browser's site settings.");
      } else if (event.error === "no-speech") {
        setVoiceError("Didn't catch that — try again.");
      } else if (event.error === "network") {
        setVoiceError("Voice recognition needs an internet connection.");
      } else {
        setVoiceError(`Voice input error: ${event.error}`);
      }
      setCallStatus("idle");
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopEverything = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
    window.speechSynthesis?.cancel();
    setListening(false);
    setCallStatus("idle");
  };

  // ---------- Chat mode ----------

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError("Voice input isn't available right now.");
      return;
    }
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    setVoiceError("");
    recognition.lang = SPEECH_LANG_MAP[lang] || "en-IN";
    try {
      recognition.start();
      setListening(true);
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setVoiceError("Could not start listening. Try again.");
      setListening(false);
    }
  };

  const speak = (text, langCode, onEnd) => {
    if (!window.speechSynthesis) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = SPEECH_LANG_MAP[langCode] || "en-IN";
    utter.rate = 1.05;
    utter.onend = () => onEnd?.();
    utter.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utter);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post("/api/ai/chat", {
        message: text + (LANG_INSTRUCTION[lang] || ""),
      });
      const reply = res.data.reply ?? res.data.response ?? JSON.stringify(res.data);
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
      if (speakEnabled) speak(reply, lang);
    } catch (err) {
      console.error("Sherlock AI chat failed:", err);
      const detail =
        err.response?.data?.detail ||
        "Sherlock AI could not be reached. Check that your API key is set in the backend .env file.";
      setMessages((prev) => [...prev, { role: "ai", text: detail, isError: true }]);
    } finally {
      setSending(false);
    }
  };

  // ---------- Voice call mode ----------

  const startCallListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError("Voice input isn't available right now.");
      return;
    }
    setVoiceError("");
    setLiveTranscript("");
    recognition.lang = SPEECH_LANG_MAP[voiceLang] || "en-IN";
    try {
      recognition.start();
      setListening(true);
      setCallStatus("listening");
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setListening(false);
      setCallStatus("idle");
    }
  };

  // When recognition ends with a transcript captured, fire the request.
  useEffect(() => {
    if (view !== "voice") return;
    if (!listening && callStatus === "listening" && liveTranscript.trim()) {
      const text = liveTranscript.trim();
      setLiveTranscript("");
      askInCall(text);
    } else if (!listening && callStatus === "listening" && !liveTranscript.trim()) {
      // stopped with nothing heard
      setCallStatus("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  const askInCall = async (text) => {
    setCallStatus("processing");
    try {
      const res = await api.post("/api/ai/chat", {
        message: text + (LANG_INSTRUCTION[voiceLang] || ""),
      });
      const reply = res.data.reply ?? res.data.response ?? "I could not generate a response.";
      setLastReply(reply);
      setCallStatus("speaking");
      speak(reply, voiceLang, () => {
        setCallStatus("idle");
        if (autoListen && view === "voice") {
          startCallListening();
        }
      });
    } catch (err) {
      console.error("Voice call failed:", err);
      setLastReply(
        err.response?.data?.detail ||
          "Sherlock AI could not be reached. Check the backend connection."
      );
      setCallStatus("idle");
    }
  };

  const handleOrbTap = () => {
    if (callStatus === "listening") {
      recognitionRef.current?.stop();
    } else if (callStatus === "idle") {
      startCallListening();
    }
    // while "processing" or "speaking", ignore taps — nothing useful to do
  };

  const openVoiceCall = () => {
    setLastReply("");
    setLiveTranscript("");
    setVoiceLang(lang || "en");
    setView("voice");
  };

  const endCall = () => {
    stopEverything();
    setView("home");
    setLastReply("");
    setLiveTranscript("");
  };

  // ================= RENDER =================

  if (view === "chat") {
    return (
      <div className="relative h-[500px] rounded-3xl overflow-hidden border border-cyan-500/20 bg-gradient-to-b from-[#0a1526] to-[#08111f] flex flex-col shadow-xl shadow-cyan-500/5">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-900" />
            </div>
            <div>
              <h2 className="font-bold text-sm">{t("sherlockAI")}</h2>
              <p className="text-[11px] text-green-400">● {t("online")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpeakEnabled((v) => !v)}
              title={speakEnabled ? "Mute responses" : "Unmute responses"}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              {speakEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={() => setView("home")}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-3">
                <Sparkles className="text-cyan-400" size={26} />
              </div>
              <p className="text-slate-500 text-sm">
                Ask Sherlock AI about cases, missing persons, vehicles, or records.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-[msgIn_0.25s_ease-out]`}
            >
              {m.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                  <Bot size={14} className="text-white" />
                </div>
              )}

              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-sm"
                    : m.isError
                    ? "bg-red-950/60 border border-red-800/60 text-red-300 rounded-bl-sm"
                    : "bg-slate-800/80 text-slate-200 rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start animate-[msgIn_0.2s_ease-out]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-slate-800/80 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {voiceError && (
          <div className="mx-3 mb-2 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs px-3 py-2 rounded-lg">
            <AlertCircle size={14} className="shrink-0" />
            <span className="flex-1">{voiceError}</span>
            <button onClick={() => setVoiceError("")} className="shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        <form
          onSubmit={sendMessage}
          className="p-3 border-t border-slate-800/80 bg-slate-900/40 backdrop-blur flex items-center gap-2"
        >
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleListening}
              title={listening ? "Stop listening" : "Speak"}
              className={`shrink-0 rounded-xl p-2.5 transition-all ${
                listening
                  ? "bg-red-500 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening..." : "Ask Sherlock AI..."}
            className="flex-1 rounded-xl bg-slate-800/80 border border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 transition"
          />

          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 hover:brightness-110 disabled:opacity-40 rounded-xl p-2.5 transition"
          >
            <Send size={18} />
          </button>
        </form>

        <style>{`@keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  if (view === "voice") {
    const isListening = callStatus === "listening";
    const isProcessing = callStatus === "processing";
    const isSpeaking = callStatus === "speaking";

    return (
      <div className="relative h-[500px] rounded-3xl overflow-hidden border border-cyan-500/20 bg-[#08111f] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur shrink-0">
          <button
            onClick={endCall}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition flex items-center gap-1"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-1.5">
            {VOICE_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setVoiceLang(l.code)}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition ${
                  voiceLang === l.code
                    ? "bg-cyan-500 border-cyan-500 text-white"
                    : "border-slate-700 text-slate-400 hover:border-cyan-500"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoListen((v) => !v)}
            title={autoListen ? "Auto-listen on (tap to turn off)" : "Auto-listen off (tap to turn on)"}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            {autoListen ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* Orb area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <button onClick={handleOrbTap} className="relative w-40 h-40 flex items-center justify-center">
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-cyan-500/25 animate-ping" />
                <span className="absolute inset-[-16px] rounded-full border-2 border-cyan-400/30 animate-pulse" />
              </>
            )}
            {isProcessing && (
              <span className="absolute inset-[-6px] rounded-full border-4 border-yellow-400/40 border-t-yellow-400 animate-spin" />
            )}
            {isSpeaking && (
              <span className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
            )}
            {callStatus === "idle" && (
              <motion.span
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-cyan-500/10"
              />
            )}

            <div
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-300 shadow-2xl ${
                isListening
                  ? "bg-cyan-500 shadow-cyan-500/50"
                  : isProcessing
                  ? "bg-yellow-500 shadow-yellow-500/40"
                  : isSpeaking
                  ? "bg-green-500 shadow-green-500/40"
                  : "bg-gradient-to-br from-cyan-400 to-blue-700 shadow-cyan-500/30"
              }`}
            >
              <Bot size={48} className="text-white" />
            </div>
          </button>

          {(isListening || isSpeaking) && (
            <div className="flex items-end gap-1.5 h-7 mt-5">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span
                  key={i}
                  className={`w-1.5 rounded-full ${
                    isListening ? "bg-cyan-400" : "bg-green-400"
                  } animate-[waveform_0.8s_ease-in-out_infinite]`}
                  style={{ animationDelay: `${i * 0.09}s`, height: "100%" }}
                />
              ))}
            </div>
          )}

          <p className="text-slate-300 text-sm mt-5 font-medium text-center min-h-[20px]">
            {isListening && "Listening..."}
            {isProcessing && "Thinking..."}
            {isSpeaking && "Speaking..."}
            {callStatus === "idle" && !liveTranscript && !lastReply && "Tap the orb to talk"}
          </p>

          {!voiceSupported && (
            <p className="text-yellow-400 text-xs text-center mt-3 max-w-xs">
              Voice input isn't supported in this browser.
            </p>
          )}
          {voiceError && (
            <p className="text-red-400 text-xs text-center mt-3 max-w-xs">{voiceError}</p>
          )}

          {liveTranscript && (
            <div className="w-full mt-4 rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 max-h-20 overflow-y-auto">
              <p className="text-cyan-400 text-[11px] font-semibold mb-1">You</p>
              <p className="text-slate-200 text-sm leading-relaxed">{liveTranscript}</p>
            </div>
          )}

          {lastReply && !liveTranscript && (
            <div className="w-full mt-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 px-4 py-3 max-h-28 overflow-y-auto animate-[msgIn_0.25s_ease-out]">
              <p className="text-cyan-400 text-[11px] font-semibold mb-1">Sherlock AI</p>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{lastReply}</p>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-center gap-6 pb-6 shrink-0">
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg shadow-red-500/30"
            title="End"
          >
            <PhoneOff size={22} className="text-white" />
          </button>
        </div>

        <style>{`
          @keyframes waveform { 0%, 100% { height: 25%; } 50% { height: 100%; } }
          @keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  // ---------- Home view ----------
  return (
    <div className="relative h-[500px] rounded-3xl overflow-hidden border border-cyan-500/20 bg-[#08111f]">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-600/10" />

      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute top-12 left-10 w-3 h-3 rounded-full bg-cyan-400 blur-sm"
      />

      <motion.div
        animate={{ y: [10, -15, 10] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute right-10 top-20 w-2 h-2 rounded-full bg-blue-500 blur-sm"
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 m-auto w-44 h-44 rounded-full border border-cyan-500/30"
          />

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 m-auto w-56 h-56 rounded-full border border-cyan-400/20"
          />

          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 m-auto w-32 h-32 rounded-full bg-cyan-500 blur-[60px]"
          />

          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center shadow-[0_0_60px_#06b6d4]"
          >
            <Bot size={55} className="text-white" />
          </motion.div>
        </div>

        <h1 className="mt-12 text-3xl font-bold tracking-widest">SHERLOCK AI</h1>
        <p className="text-cyan-400 mt-2">Intelligence Core Online</p>

        <div className="grid grid-cols-2 gap-4 mt-10 w-[90%]">
          <button
            onClick={() => setView("chat")}
            className="rounded-xl bg-slate-800 hover:bg-cyan-600 transition-all py-3 flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} />
            Chat
          </button>

          <button
            onClick={openVoiceCall}
            className="rounded-xl bg-slate-800 hover:bg-cyan-600 transition-all py-3 flex items-center justify-center gap-2"
          >
            <Mic size={18} />
            Voice
          </button>

          <button
            onClick={() => navigate("/scan")}
            className="rounded-xl bg-slate-800 hover:bg-cyan-600 transition-all py-3 flex items-center justify-center gap-2"
          >
            <ScanLine size={18} />
            Smart Scan
          </button>

          <button
            onClick={() => navigate("/analytics")}
            className="rounded-xl bg-slate-800 hover:bg-cyan-600 transition-all py-3 flex items-center justify-center gap-2"
          >
            <BrainCircuit size={18} />
            Analyze
          </button>
        </div>

        <div className="mt-8 flex items-center gap-2 text-cyan-400">
          <Sparkles size={18} />
          AI STATUS : ONLINE
        </div>
      </div>
    </div>
  );
}