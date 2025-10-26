"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Hammer, Users, Briefcase, Leaf, Square as BrickIcon } from "lucide-react"; // Importáljuk a Leaf és BrickIcon ikonokat
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Importáljuk a Tabs komponenseket

export interface BuildingOption {
  type: "house" | "office" | "forestry" | "farm"; // Új típus
  category: "residential" | "business"; // Új kategória
  name: string;
  cost: number;
  woodCost?: number; // Új: fa költség
  brickCost?: number; // Új: tégla költség
  duration: number; // in ms
  width: number;
  height: number;
  rentalPrice?: number; // Házakhoz
  salary?: number; // Irodákhoz
  capacity: number; // Max lakók/dolgozók
}

interface BuildMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuilding: (buildingName: string) => void; // Módosítva: buildingName-et ad át
  availableBuildings: BuildingOption[];
  playerMoney: number;
  playerWood: number; // Új: játékos fa mennyisége
  playerBrick: number; // Új: játékos tégla mennyisége
  isBuildingInProgress: boolean;
}

const BuildMenu: React.FC<BuildMenuProps> = ({
  isOpen,
  onClose,
  onSelectBuilding,
  availableBuildings,
  playerMoney,
  playerWood,
  playerBrick,
  isBuildingInProgress,
}) => {
  const residentialBuildings = availableBuildings.filter(b => b.category === "residential");
  const businessBuildings = availableBuildings.filter(b => b.category === "business");

  const renderBuildingCard = (building: BuildingOption) => {
    const canAffordMoney = playerMoney >= building.cost;
    const canAffordWood = building.woodCost ? playerWood >= building.woodCost : true;
    const canAffordBrick = building.brickCost ? playerBrick >= building.brickCost : true;
    // Az isBuildingInProgress ellenőrzés eltávolítva a disabled propból
    const isDisabled = !canAffordMoney || !canAffordWood || !canAffordBrick;

    return (
      <Card key={building.name} className="flex items-center justify-between p-4">
        <div>
          <CardTitle className="text-lg">{building.name}</CardTitle>
          <p className="text-sm text-muted-foreground flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-green-500" /> {building.cost} pénz
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
          onClick={() => onSelectBuilding(building.name)} // Módosítva: building.name-et ad át
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
          <TabsContent value="residential" className="grid gap-4 py-4">
            {residentialBuildings.map(renderBuildingCard)}
          </TabsContent>
          <TabsContent value="business" className="grid gap-4 py-4">
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