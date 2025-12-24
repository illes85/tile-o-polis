"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { saveGame, loadGame } from "@/utils/saveLoad";
import { BuildingData } from "@/components/Map";
import { Transaction } from "@/components/MoneyHistory";

const GameMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  interface SavedGameState {
    players: { id: string; name: string; money: number; inventory: Record<string, number>; workplace: string; workplaceSalary: number }[];
    buildings: BuildingData[];
    currentPlayerId: string;
    transactions: Transaction[];
  }
  const [lastGameState, setLastGameState] = useState<SavedGameState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Ha a játékból jövünk vissza, elmentjük az állapotot a memóriába
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

  const handleSaveGame = async () => {
    if (lastGameState) {
      setIsProcessing(true);
      const toastId = showLoading("Mentés az adatbázisba...");
      
      // Csak a szükséges adatokat mentjük el
      const stateToSave = {
        players: lastGameState.players,
        buildings: lastGameState.buildings,
        currentPlayerId: lastGameState.currentPlayerId,
        transactions: lastGameState.transactions,
        // shopInventories és egyéb állapotok, ha szükségesek
      };

      const success = await saveGame(stateToSave);
      dismissToast(toastId);
      setIsProcessing(false);
      
      if (success) showSuccess("Játék sikeresen mentve a felhőbe!");
      else showError("Hiba történt a mentéskor. Kérlek ellenőrizd a Supabase kapcsolatot.");
    } else {
      showError("Nincs mit elmenteni. Előbb kezdj el játszani!");
    }
  };

  const handleLoadGame = async () => {
    setIsProcessing(true);
    const toastId = showLoading("Betöltés a felhőből...");
    const savedData = await loadGame();
    dismissToast(toastId);
    setIsProcessing(false);

    if (savedData) {
      showSuccess("Mentett játék betöltve!");
      // A betöltött adatokat átadjuk a Game komponensnek
      navigate("/game", { state: savedData });
    } else {
      showError("Nem található mentett játék az adatbázisban.");
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
            <Button onClick={handleResumeGame} disabled={isProcessing} className="w-full">Vissza a játékba</Button>
          )}
          <Button onClick={handleNewGame} disabled={isProcessing} className="w-full">Új Játék</Button>
          <Button onClick={handleSaveGame} disabled={isProcessing || !lastGameState} className="w-full" variant="secondary">Játék Mentése</Button>
          <Button onClick={handleLoadGame} disabled={isProcessing} className="w-full" variant="secondary">Játék Betöltése</Button>
          <Button onClick={() => navigate('/select-player')} disabled={isProcessing} className="w-full" variant="destructive">Kilépés</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameMenuScreen;
