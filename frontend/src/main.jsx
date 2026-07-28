import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import AppRoutes from "./routes/AppRoutes";
import { LanguageProvider } from "./context/LanguageContext";
import VoiceAssistant from "./components/voice/VoiceAssistant";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <Toaster position="top-right" />
        <AppRoutes />
        <VoiceAssistant />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);