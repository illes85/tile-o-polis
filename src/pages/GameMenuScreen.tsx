"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess } from "@/utils/toast"; // Helykitöltő üzenetekhez

const GameMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lastGameState, setLastGameState] = useState<any | null>(null);

  useEffect(() => {
    // Ha a Game komponensből érkezünk, akkor a state-ben lesznek az adatok
    if (location.state && location.state.players && location.state.buildings) {
      setLastGameState(location.state);
    }
  }, [location.state]);

  const handleNewGame = () => {
    setLastGameState(null); // Új játék indításakor töröljük az előző játékállapotot
    navigate("/select-player"); // Navigálás az új játékosválasztó képernyőre
  };

  const handleResumeGame = () => {
    if (lastGameState) {
      navigate("/game", { state: lastGameState });
    } else {
      showError("Nincs aktív játék, amit folytatni lehetne. Kezdj új játékot!");
    }
  };

  const handleSaveGame = () => {
    showSuccess("Játék mentve (placeholder)");
    // Itt lehetne implementálni a tényleges mentési logikát
  };

  const handleLoadGame = () => {
    showSuccess("Játék betöltve (placeholder)");
    // Itt lehetne implementálni a tényleges betöltési logikát
  };

  const handleSettings = () => {
    showSuccess("Beállítások megnyitva (placeholder)");
    // Itt lehetne implementálni a tényleges beállítások dialógust/oldalt
  };

  const handleExit = () => {
    // Webes alkalmazásban a "kilépés" általában azt jelenti, hogy visszatérünk a főmenübe.
    // Mivel ez a főmenü, maradhatunk itt, vagy megjeleníthetünk egy üzenetet.
    showSuccess("Kilépés (vissza a főmenübe)");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Játék Menü</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          {lastGameState && (
            <Button onClick={handleResumeGame} className="w-full">Vissza a játékba</Button>
          )}
          <Button onClick={handleNewGame} className="w-full">Új Játék</Button>
          <Button onClick={handleSaveGame} className="w-full" variant="secondary">Játék Mentése</Button>
          <Button onClick={handleLoadGame} className="w-full" variant="secondary">Játék Betöltése</Button>
          <Button onClick={handleSettings} className="w-full" variant="secondary">Beállítások</Button>
          <Button onClick={handleExit} className="w-full" variant="destructive">Kilépés</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameMenuScreen;