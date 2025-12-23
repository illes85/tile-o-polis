"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { Coins } from "lucide-react";
import { ProductType } from "@/utils/products";

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
    stone: number;
    hoe: number;
    tractor: number;
    wheat: number;
    [ProductType.WheatSeed]: number;
    [ProductType.CornSeed]: number; // ÚJ
    flour: number;
    [ProductType.Corn]: number;
    [ProductType.CornFlour]: number;
    [ProductType.Popcorn]: number;
  };
  workplace: string;
}

const createInitialInventory = (base: Partial<Player['inventory']> = {}) => ({
    potato: 0,
    water: 0,
    clothes: 0,
    wood: 0,
    brick: 0,
    stone: 0,
    hoe: 0,
    tractor: 0,
    wheat: 0,
    [ProductType.WheatSeed]: 0,
    [ProductType.CornSeed]: 0,
    flour: 0,
    [ProductType.Corn]: 0,
    [ProductType.CornFlour]: 0,
    [ProductType.Popcorn]: 0,
    ...base,
});

const initialPlayers: Player[] = [
  { id: "player-1", name: "Játékos 1", money: 2000, inventory: createInitialInventory({ potato: 3, water: 2, clothes: 1, wood: 10, brick: 5, [ProductType.WheatSeed]: 5 }), workplace: "Munkanélküli" },
  { id: "player-2", name: "Játékos 2", money: 1500, inventory: createInitialInventory({ potato: 1, water: 1, wood: 5, brick: 3 }), workplace: "Munkanélküli" },
  { id: "player-3", name: "Játékos 3", money: 2500, inventory: createInitialInventory({ potato: 5, water: 3, clothes: 2, wood: 15, brick: 8, [ProductType.WheatSeed]: 10 }), workplace: "Munkanélküli" },
  { id: "player-4", name: "Játékos 4", money: 1000, inventory: createInitialInventory(), workplace: "Munkanélküli" },
  { id: "player-5", name: "Játékos 5", money: 1800, inventory: createInitialInventory({ potato: 2, water: 1, clothes: 1, wood: 8, brick: 4, [ProductType.WheatSeed]: 5 }), workplace: "Munkanélküli" },
  { id: "player-test", name: "Teszt Játékos", money: 50000, inventory: createInitialInventory({ potato: 100, water: 100, clothes: 50, wood: 500, brick: 200, stone: 100, hoe: 10, tractor: 2, wheat: 50, [ProductType.WheatSeed]: 100, flour: 20, [ProductType.CornSeed]: 50, [ProductType.Corn]: 50, [ProductType.CornFlour]: 10, [ProductType.Popcorn]: 5 }), workplace: "Tesztelő" }, // Teszt játékos
  { id: "player-rich-1", name: "Gazdag Gazda", money: 8000, inventory: createInitialInventory({ wood: 50, brick: 50, stone: 50, wheat: 20, [ProductType.WheatSeed]: 20, [ProductType.CornSeed]: 10 }), workplace: "Munkanélküli" },
  { id: "player-rich-2", name: "Városatyja", money: 12000, inventory: createInitialInventory({ wood: 100, brick: 100, stone: 100 }), workplace: "Munkanélküli" },
  { id: "player-rich-3", name: "Tökmagolaj", money: 7000, inventory: createInitialInventory({ wood: 75, brick: 75, stone: 75, [ProductType.WheatSeed]: 50, [ProductType.CornSeed]: 20 }), workplace: "Munkanélküli" },
  { id: "player-rich-4", name: "Búzabáró", money: 9500, inventory: createInitialInventory({ wood: 150, brick: 150, stone: 150, [ProductType.WheatSeed]: 100 }), workplace: "Munkanélküli" },
  { id: "player-rich-5", name: "Kalászkirály", money: 11000, inventory: createInitialInventory({ wood: 200, brick: 200, stone: 200, [ProductType.WheatSeed]: 200 }), workplace: "Munkanélküli" },
  { id: "player-rich-6", name: "Gabonagazda", money: 15000, inventory: createInitialInventory({ wood: 300, brick: 300, stone: 300, [ProductType.WheatSeed]: 300, wheat: 100, flour: 50 }), workplace: "Munkanélküli" },
  { id: "player-rich-7", name: "Mezőgazdász Mester", money: 18000, inventory: createInitialInventory({ wood: 500, brick: 500, stone: 500, [ProductType.WheatSeed]: 500, wheat: 200, hoe: 10, flour: 100 }), workplace: "Munkanélküli" },
  { id: "player-rich-8", name: "Aranykalász", money: 22000, inventory: createInitialInventory({ wood: 750, brick: 750, stone: 750, [ProductType.WheatSeed]: 750, wheat: 300, tractor: 2, flour: 150 }), workplace: "Munkanélküli" },
  { id: "player-rich-9", name: "Liszt Király", money: 28000, inventory: createInitialInventory({ wood: 1000, brick: 1000, stone: 1000, [ProductType.WheatSeed]: 1000, wheat: 500, hoe: 20, tractor: 5, flour: 250 }), workplace: "Munkanélküli" },
  { id: "player-rich-10", name: "Gabona Mágus", money: 35000, inventory: createInitialInventory({ wood: 2000, brick: 2000, stone: 2000, [ProductType.WheatSeed]: 2000, wheat: 1000, hoe: 50, tractor: 10, flour: 500 }), workplace: "Munkanélküli" },
];

const PlayerSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isCreatePlayerDialogOpen, setIsCreatePlayerDialogOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");

  const getInitialResources = (selectedDifficulty: "easy" | "normal" | "hard") => {
    switch (selectedDifficulty) {
      case "easy":
        return { money: 3000, wood: 20, brick: 10, stone: 5, hoe: 1, tractor: 0, wheat: 0, [ProductType.WheatSeed]: 10, [ProductType.CornSeed]: 5, flour: 0 };
      case "hard":
        return { money: 800, wood: 0, brick: 0, stone: 0, hoe: 0, tractor: 0, wheat: 0, [ProductType.WheatSeed]: 0, [ProductType.CornSeed]: 0, flour: 0 };
      case "normal":
      default:
        return { money: 2000, wood: 5, brick: 2, stone: 0, hoe: 0, tractor: 0, wheat: 0, [ProductType.WheatSeed]: 5, [ProductType.CornSeed]: 2, flour: 0 };
    }
  };

  const handleSelectPlayer = (player: Player) => {
    navigate("/game", { state: { initialPlayer: player, allPlayers: players } });
  };

  const handleCreateNewPlayer = () => {
    if (!newPlayerName.trim()) {
      showError("A játékos neve nem lehet üres!");
      return;
    }

    const { money, wood, brick, stone, hoe, tractor, wheat, [ProductType.WheatSeed]: wheatSeed, [ProductType.CornSeed]: cornSeed, flour } = getInitialResources(difficulty);

    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: newPlayerName.trim(),
      money: money,
      inventory: createInitialInventory({ wood, brick, stone, hoe, tractor, wheat, [ProductType.WheatSeed]: wheatSeed, [ProductType.CornSeed]: cornSeed, flour }),
      workplace: "Munkanélküli",
    };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    showSuccess(`Új játékos létrehozva: ${newPlayer.name} (${difficulty} nehézség)!`);
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
              {player.name} (<Coins className="inline-block h-4 w-4 mr-1 text-green-500" /> {player.money})
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
              Adj nevet az új játékosnak és válassz nehézségi szintet.
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Nehézség
              </Label>
              <Select onValueChange={(value: "easy" | "normal" | "hard") => setDifficulty(value)} defaultValue={difficulty}>
                <SelectTrigger id="difficulty" className="col-span-3">
                  <SelectValue placeholder="Válassz nehézséget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Könnyű (3000 <Coins className="inline-block h-4 w-4 ml-1 text-green-500" /> , 20 fa, 10 tégla, 5 kő, 1 kapa, 10 búza vetőmag, 5 kukorica vetőmag)</SelectItem>
                  <SelectItem value="normal">Normál (2000 <Coins className="inline-block h-4 w-4 ml-1 text-green-500" /> , 5 fa, 2 tégla, 0 kő, 0 kapa, 5 búza vetőmag, 2 kukorica vetőmag)</SelectItem>
                  <SelectItem value="hard">Nehéz (800 <Coins className="inline-block h-4 w-4 ml-1 text-green-500" /> , 0 fa, 0 tégla, 0 kő, 0 kapa, 0 vetőmag)</SelectItem>
                </SelectContent>
              </Select>
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