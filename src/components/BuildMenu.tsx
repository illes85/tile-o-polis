"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Hammer, Users, Briefcase, Leaf, Square as BrickIcon, Gem } from "lucide-react"; // DollarSign helyett Coins, Gem ikon a kőhöz
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface BuildingOption {
  type: "house" | "office" | "forestry" | "farm";
  category: "residential" | "business";
  name: string;
  cost: number;
  woodCost?: number;
  brickCost?: number;
  stoneCost?: number; // Új: kő költség
  duration: number;
  width: number;
  height: number;
  rentalPrice?: number;
  salary?: number;
  capacity: number;
}

interface BuildMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuilding: (buildingName: string) => void;
  availableBuildings: BuildingOption[];
  playerMoney: number;
  playerWood: number;
  playerBrick: number;
  playerStone: number; // Új: játékos kő mennyisége
  isBuildingInProgress: boolean; // Ez most már csak azt jelzi, ha a játékos éppen helyez el valamit
}

const BuildMenu: React.FC<BuildMenuProps> = ({
  isOpen,
  onClose,
  onSelectBuilding,
  availableBuildings,
  playerMoney,
  playerWood,
  playerBrick,
  playerStone, // Hozzáadva
  isBuildingInProgress,
}) => {
  const residentialBuildings = availableBuildings.filter(b => b.category === "residential");
  const businessBuildings = availableBuildings.filter(b => b.category === "business");

  const renderBuildingCard = (building: BuildingOption) => {
    const canAffordMoney = playerMoney >= building.cost;
    const canAffordWood = building.woodCost ? playerWood >= building.woodCost : true;
    const canAffordBrick = building.brickCost ? playerBrick >= building.brickCost : true;
    const canAffordStone = building.stoneCost ? playerStone >= building.stoneCost : true; // Új: kő ellenőrzés
    const isDisabled = !canAffordMoney || !canAffordWood || !canAffordBrick || !canAffordStone || isBuildingInProgress; // Hozzáadva a kő és az isBuildingInProgress ellenőrzés

    return (
      <Card key={building.name} className="flex items-center justify-between p-4">
        <div>
          <CardTitle className="text-lg">{building.name}</CardTitle>
          <p className="text-sm text-muted-foreground flex items-center">
            <Coins className="h-4 w-4 mr-1 text-green-500" /> {building.cost === 0 ? "Ingyenes" : `${building.cost} pénz`}
          </p>
          {building.woodCost !== undefined && (
            <p className="text-sm text-muted-foreground flex items-center">
              <Leaf className="h-4 w-4 mr-1 text-yellow-700" /> {building.woodCost} fa
            </p>
          )}
          {building.brickCost !== undefined && (
            <p className="text-sm text-muted-foreground flex items-center">
              <BrickIcon className="h-4 w-4 mr-1 text-orange-500" /> {building.brickCost} tégla
            </p>
          )}
          {building.stoneCost !== undefined && ( // Új: kő költség megjelenítése
            <p className="text-sm text-muted-foreground flex items-center">
              <Gem className="h-4 w-4 mr-1 text-gray-500" /> {building.stoneCost} kő
            </p>
          )}
          <p className="text-sm text-muted-foreground flex items-center">
            <Hammer className="h-4 w-4 mr-1 text-gray-500" /> {building.duration / 1000} másodperc
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
            Méret: {building.width}x{building.height}
          </p>
          {building.type === "house" && building.rentalPrice !== undefined && (
            <p className="text-sm text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-1 text-gray-500" /> Max lakók: {building.capacity}
            </p>
          )}
          {(building.type === "office" || building.type === "forestry" || building.type === "farm") && building.salary !== undefined && (
            <p className="text-sm text-muted-foreground flex items-center">
              <Briefcase className="h-4 w-4 mr-1 text-gray-500" /> Max dolgozók: {building.capacity}
            </p>
          )}
        </div>
        <Button
          onClick={() => onSelectBuilding(building.name)}
          disabled={isDisabled}
        >
          Épít
        </Button>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Építés</DialogTitle>
          <DialogDescription>Válassz egy épületet, amit fel szeretnél építeni.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="residential" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="residential">Lakóház</TabsTrigger>
            <TabsTrigger value="business">Vállalkozás</TabsTrigger>
          </TabsList>
          <TabsContent value="residential" className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {residentialBuildings.map(renderBuildingCard)}
          </TabsContent>
          <TabsContent value="business" className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {businessBuildings.map(renderBuildingCard)}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Mégsem</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuildMenu;