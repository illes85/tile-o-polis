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
import { ProductType, allProducts } from "@/utils/products";

interface Player {
  id: string;
  name: string;
  money: number;
  inventory: Record<string, number>;
  workplace: string;
}

const createInitialInventory = (base: Record<string, number> = {}) => {
  const defaults = allProducts.reduce((acc, p) => ({ ...acc, [p.type]: 0 }), {} as Record<string, number>);
  return { ...defaults, ...base };
};

const testInventoryBase = allProducts.reduce((acc, p) => ({ ...acc, [p.type]: 1 }), {} as Record<string, number>);

const initialPlayers: Player[] = [
  { 
    id: "player-test", 
    name: "Teszt Elek", 
    money: 50000, 
    inventory: createInitialInventory({ 
      ...testInventoryBase,
      wood: 500, stone: 100, flour: 20, clothes: 5, 
      [ProductType.WheatSeed]: 100, wheat: 50, 
      [ProductType.Corn]: 50, [ProductType.CornFlour]: 10, [ProductType.Popcorn]: 5, [ProductType.CornSeed]: 50 
    }), 
    workplace: "Munkanélküli" 
  },
  { 
    id: "player-2", 
    name: "Lyukas Zsebű Lajos", 
    money: 300, 
    inventory: createInitialInventory({ 
      potato: 2, water: 1, hoe: 1, 
      [ProductType.WheatSeed]: 2, clothes: 1 
    }), 
    workplace: "Munkanélküli" 
  },
  { 
    id: "player-3", 
    name: "Gróf Csekkfüzet", 
    money: 15000, 
    inventory: createInitialInventory({ 
      potato: 10, water: 10, wood: 50, brick: 50, stone: 20, hoe: 1, tractor: 1, 
      wheat: 20, [ProductType.WheatSeed]: 20, flour: 10, clothes: 10, 
      [ProductType.Corn]: 10, [ProductType.CornFlour]: 5, [ProductType.Popcorn]: 5, [ProductType.CornSeed]: 10 
    }), 
    workplace: "Munkanélküli" 
  },
  { 
    id: "player-4", 
    name: "Krajcár Kázmér", 
    money: 2000, 
    inventory: createInitialInventory({ 
      potato: 5, water: 3, wood: 10, brick: 5, stone: 2, hoe: 1, 
      wheat: 5, [ProductType.WheatSeed]: 5, flour: 2, clothes: 2, 
      [ProductType.Corn]: 2, [ProductType.CornFlour]: 1, [ProductType.CornSeed]: 2 
    }), 
    workplace: "Munkanélküli" 
  },
  { 
    id: "player-5", 
    name: "Zsírosbödön Ödön", 
    money: 8000, 
    inventory: createInitialInventory({ 
      potato: 8, water: 8, wood: 30, brick: 20, stone: 10, hoe: 1, 
      wheat: 15, [ProductType.WheatSeed]: 15, flour: 5, clothes: 5, 
      [ProductType.Corn]: 5, [ProductType.CornFlour]: 2, [ProductType.Popcorn]: 2, [ProductType.CornSeed]: 5 
    }), 
    workplace: "Munkanélküli" 
  },
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