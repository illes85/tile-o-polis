"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";

interface Player {
  id: string;
  name: string;
  money: number;
  inventory: {
    potato: number;
    water: number;
    clothes: number;
    wood: number;
    brick: number;
  };
  workplace: string;
}

const initialPlayers: Player[] = [
  { id: "player-1", name: "Játékos 1", money: 1000, inventory: { potato: 3, water: 2, clothes: 1, wood: 10, brick: 5 }, workplace: "Munkanélküli" },
  { id: "player-2", name: "Játékos 2", money: 750, inventory: { potato: 1, water: 1, clothes: 0, wood: 5, brick: 3 }, workplace: "Munkanélküli" },
  { id: "player-3", name: "Játékos 3", money: 1200, inventory: { potato: 5, water: 3, clothes: 2, wood: 15, brick: 8 }, workplace: "Munkanélküli" },
  { id: "player-4", name: "Játékos 4", money: 600, inventory: { potato: 0, water: 0, clothes: 0, wood: 0, brick: 0 }, workplace: "Munkanélküli" },
  { id: "player-5", name: "Játékos 5", money: 900, inventory: { potato: 2, water: 1, clothes: 1, wood: 8, brick: 4 }, workplace: "Munkanélküli" },
];

const PlayerSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isCreatePlayerDialogOpen, setIsCreatePlayerDialogOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");

  const handleSelectPlayer = (player: Player) => {
    navigate("/game", { state: { initialPlayer: player, allPlayers: players } });
  };

  const handleCreateNewPlayer = () => {
    if (!newPlayerName.trim()) {
      showError("A játékos neve nem lehet üres!");
      return;
    }
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: newPlayerName.trim(),
      money: 1000,
      inventory: { potato: 0, water: 0, clothes: 0, wood: 5, brick: 2 },
      workplace: "Munkanélküli",
    };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    showSuccess(`Új játékos létrehozva: ${newPlayer.name}`);
    setIsCreatePlayerDialogOpen(false);
    setNewPlayerName("");
    navigate("/game", { state: { initialPlayer: newPlayer, allPlayers: updatedPlayers } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 space-y-4">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Játékos kiválasztása</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-3">
          <h3 className="text-lg font-semibold">Válassz meglévő játékost:</h3>
          {players.map((player) => (
            <Button
              key={player.id}
              onClick={() => handleSelectPlayer(player)}
              className="w-full justify-start"
              variant="outline"
            >
              {player.name} (Pénz: {player.money})
            </Button>
          ))}
          <div className="border-t pt-4 mt-4">
            <Button onClick={() => setIsCreatePlayerDialogOpen(true)} className="w-full bg-green-600 hover:bg-green-700">
              Új játékos létrehozása
            </Button>
          </div>
          <Button onClick={() => navigate('/')} className="w-full mt-4" variant="secondary">
            Vissza a menübe
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isCreatePlayerDialogOpen} onOpenChange={setIsCreatePlayerDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Új játékos létrehozása</DialogTitle>
            <DialogDescription>
              Adj nevet az új játékosnak.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-player-name" className="text-right">
                Név
              </Label>
              <Input
                id="new-player-name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePlayerDialogOpen(false)}>Mégsem</Button>
            <Button onClick={handleCreateNewPlayer}>Létrehozás</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerSelectionScreen;