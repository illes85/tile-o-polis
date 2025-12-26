import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Game from "./pages/Game";
import NotFound from "./pages/NotFound";
import GameMenuScreen from "./pages/GameMenuScreen";
import PlayerSelectionScreen from "./pages/PlayerSelectionScreen";
import StartScreen from "./components/StartScreen";
import { useState } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const [hasStarted, setHasStarted] = useState(false);

  if (!hasStarted) {
    return <StartScreen onStart={() => setHasStarted(true)} />;
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
