import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Game from "./pages/Game";
import NotFound from "./pages/NotFound";
import GameMenuScreen from "./pages/GameMenuScreen";
import PlayerSelectionScreen from "./pages/PlayerSelectionScreen";
import StartScreen from "./components/StartScreen";
import { useState, useEffect, useRef } from "react";
import introMusicUrl from "@/music/Boogie in the Happy City 2.mp3";

const queryClient = new QueryClient();

const AppContent = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    const audio = new Audio(introMusicUrl);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    const playAudio = () => {
      audio.play().catch((e) => {
        console.log("Autoplay prevented, waiting for interaction", e);
      });
    };

    // Try to play immediately
    playAudio();

    // Also add a click listener to the document to start playing if autoplay was blocked
    const handleInteraction = () => {
      if (audio.paused) {
        audio.play().catch(console.error);
      }
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);

    return () => {
      audio.pause();
      document.removeEventListener('click', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/game' && audioRef.current) {
      const audio = audioRef.current;
      // Fade out
      const fadeInterval = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume = Math.max(0, audio.volume - 0.05);
        } else {
          clearInterval(fadeInterval);
          audio.pause();
        }
      }, 100); // 10 steps * 100ms = 1s fade out
    }
  }, [location.pathname]);

  const handleStart = () => {
    setHasStarted(true);
  };

  if (!hasStarted) {
    return <StartScreen onStart={handleStart} />;
  }

  return (
    <Routes>
      <Route path="/" element={<GameMenuScreen />} />
      <Route path="/select-player" element={<PlayerSelectionScreen />} />
      <Route path="/game" element={<Game />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
