"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { saveGame, loadGame } from "@/utils/saveLoad";

const GameMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lastGameState, setLastGameState] = useState<any | null>(null);

  useEffect(() => {
    if (location.state && location.state.players && location.state.buildings) {
      setLastGameState(location.state);
    }
  }, [location.state]);

  const handleNewGame = () => {
    navigate("/select-player");
  };

  const handleResumeGame = () => {
    if (lastGameState) {
      navigate("/game", { state: lastGameState });
    } else {
      showError("Nincs aktív játék a memóriában.");
    }
  };

  const handleSaveGame = () => {
    if (lastGameState) {
      const success = saveGame(lastGameState);
      if (success) showSuccess("Játék sikeresen mentve a böngészőbe!");
      else showError("Hiba történt a mentéskor.");
    } else {
      showError("Nincs mit elmenteni. Előbb kezdj el játszani!");
    }
  };

  const handleLoadGame = () => {
    const savedData = loadGame();
    if (savedData) {
      showSuccess("Mentett játék betöltve!");
      navigate("/game", { state: savedData });
    } else {
      showError("Nem található mentett játék.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Tile-o-polis Menü</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          {lastGameState && (
            <Button onClick={handleResumeGame} className="w-full">Vissza a játékba</Button>
          )}
          <Button onClick={handleNewGame} className="w-full">Új Játék</Button>
          <Button onClick={handleSaveGame} className="w-full" variant="secondary">Játék Mentése</Button>
          <Button onClick={handleLoadGame} className="w-full" variant="secondary">Játék Betöltése</Button>
          <Button onClick={() => showError("Beállítások hamarosan...")} className="w-full" variant="secondary">Beállítások</Button>
          <Button onClick={() => navigate('/select-player')} className="w-full" variant="destructive">Kilépés</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameMenuScreen;