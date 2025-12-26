"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { saveGame, loadGame } from "@/utils/saveLoad";
import { Building, Trees, Wheat, Settings, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [showSettings, setShowSettings] = useState(false);
  const [playerSwitchEnabled, setPlayerSwitchEnabled] = useState(() => {
    return localStorage.getItem("playerSwitchEnabled") !== "false";
  });
  const [avatarSize, setAvatarSize] = useState(() => {
    const saved = localStorage.getItem("avatarSize");
    return saved ? parseInt(saved, 10) : 100;
  });

  useEffect(() => {
    localStorage.setItem("playerSwitchEnabled", String(playerSwitchEnabled));
  }, [playerSwitchEnabled]);

  useEffect(() => {
    localStorage.setItem("avatarSize", String(avatarSize));
  }, [avatarSize]);

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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-800 to-blue-900 text-white">
      {/* Háttér minta */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:32px_32px]" />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        {showSettings ? (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-2xl text-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="text-white hover:text-white/80 hover:bg-white/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-2xl font-bold">Beállítások</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-1">
                  <Label className="text-base font-medium text-white">Játékos váltása</Label>
                  <p className="text-sm text-gray-400">Játékosváltó gombok megjelenítése a játékban</p>
                </div>
                <Switch
                  checked={playerSwitchEnabled}
                  onCheckedChange={setPlayerSwitchEnabled}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-1">
                  <Label className="text-base font-medium text-white">Játékos avatár mérete</Label>
                  <p className="text-sm text-gray-400">A karakterek mérete a térképen ({avatarSize}%)</p>
                </div>
                <div className="flex gap-2">
                  {[100, 75, 50].map((size) => (
                    <Button
                      key={size}
                      size="sm"
                      variant={avatarSize === size ? "default" : "outline"}
                      onClick={() => setAvatarSize(size)}
                      className={avatarSize === size ? "bg-green-600 hover:bg-green-700 border-none" : "bg-transparent text-white border-white/20 hover:bg-white/10"}
                    >
                      {size}%
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex gap-6 mb-8 text-yellow-400 animate-bounce delay-75 duration-1000">
              <Building className="w-12 h-12 drop-shadow-lg" />
              <Trees className="w-12 h-12 drop-shadow-lg" />
              <Wheat className="w-12 h-12 drop-shadow-lg" />
            </div>
            
            <h1 className="text-5xl font-extrabold mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-amber-500 drop-shadow-sm filter">
              Tile-o-Polis
            </h1>

            <Card className="w-full bg-black/40 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="flex flex-col space-y-3 p-6">
                {lastGameState && (
                  <Button 
                    onClick={handleResumeGame} 
                    disabled={isProcessing} 
                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-700 hover:from-green-600 hover:to-emerald-800 text-white border border-green-400/30"
                  >
                    Vissza a játékba
                  </Button>
                )}
                <Button 
                  onClick={handleNewGame} 
                  disabled={isProcessing} 
                  className="w-full h-12 text-lg bg-white/10 hover:bg-white/20 text-white border border-white/10"
                >
                  Új Játék
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleSaveGame} 
                    disabled={isProcessing || !lastGameState} 
                    className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/30"
                  >
                    Mentés
                  </Button>
                  <Button 
                    onClick={handleLoadGame} 
                    disabled={isProcessing} 
                    className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30"
                  >
                    Betöltés
                  </Button>
                </div>
                <Button 
                  onClick={() => setShowSettings(true)} 
                  className="w-full bg-transparent hover:bg-white/5 text-gray-300 border border-white/10"
                >
                  <Settings className="mr-2 h-4 w-4" /> Beállítások
                </Button>
              </CardContent>
            </Card>
            
            <div className="mt-8 text-sm text-gray-400 font-mono">
              v1.0.0 • Tile-o-Polis
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameMenuScreen;
