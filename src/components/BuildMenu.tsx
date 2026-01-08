"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Hammer, Users, Briefcase, Leaf, Square as BrickIcon, Gem } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface BuildingOption {
  type: "house" | "office" | "forestry" | "farm" | "farmland" | "road" | "shop" | "mill" | "popcorn_stand" | "quarry" | "bank" | "custom";
  customType?: "house" | "office"; // For custom buildings to know behavior
  customGraphics?: {
    tileset: string;
    x: number;
    y: number;
    tileSize?: number;
    customUrl?: string;
    customBase64?: string;
  };
  productionConfig?: {
    produces: string; // ProductType
    quantity: number;
    consumes?: string; // ProductType
    consumesQuantity?: number;
    duration: number; // ms
  };
  category: "residential" | "business";
  name: string;
  cost: number;
  woodCost?: number;
  brickCost?: number;
  stoneCost?: number;
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
  playerStone: number;
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
  playerStone,
  isBuildingInProgress,
}) => {
  const residentialBuildings = availableBuildings.filter(b => b.category === "residential");
  const businessBuildings = availableBuildings.filter(b => b.category === "business");

  const renderBuildingCard = (building: BuildingOption) => {
    const canAffordMoney = playerMoney >= building.cost;
    const canAffordWood = building.woodCost ? playerWood >= building.woodCost : true;
    const canAffordBrick = building.brickCost ? playerBrick >= building.brickCost : true;
    const canAffordStone = building.stoneCost ? playerStone >= building.stoneCost : true;
    const isDisabled = !canAffordMoney || !canAffordWood || !canAffordBrick || !canAffordStone || isBuildingInProgress;

    return (
      <Card key={building.name} className="flex items-center justify-between p-4">
        <div>
          <CardTitle className="text-lg">{building.name}</CardTitle>
          <p className={`text-sm flex items-center ${canAffordMoney ? "text-muted-foreground" : "text-red-500 font-bold"}`}>
            <Coins className="h-4 w-4 mr-1 text-green-500" />
            {building.cost === 0 ? "Ingyenes" : `${building.cost} pénz`}
          </p>
          {building.woodCost !== undefined && (
            <p className={`text-sm flex items-center ${canAffordWood ? "text-muted-foreground" : "text-red-500 font-bold"}`}>
              <Leaf className="h-4 w-4 mr-1 text-yellow-700" />
              {building.woodCost} fa
            </p>
          )}
          {building.brickCost !== undefined && (
            <p className={`text-sm flex items-center ${canAffordBrick ? "text-muted-foreground" : "text-red-500 font-bold"}`}>
              <BrickIcon className="h-4 w-4 mr-1 text-orange-500" />
              {building.brickCost} tégla
            </p>
          )}
          {building.stoneCost !== undefined && (
            <p className={`text-sm flex items-center ${canAffordStone ? "text-muted-foreground" : "text-red-500 font-bold"}`}>
              <Gem className="h-4 w-4 mr-1 text-gray-500" />
              {building.stoneCost} kő
            </p>
          )}
          <p className="text-sm text-muted-foreground flex items-center">
            Méret: {building.width}x{building.height}
          </p>
          {building.type === "house" && building.rentalPrice !== undefined && (
            <p className="text-sm text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-1 text-gray-500" />
              Max lakók: {building.capacity}
            </p>
          )}
          {(building.type === "office" || building.type === "forestry" || building.type === "farm" || building.type === "shop" || building.type === "mill" || building.type === "popcorn_stand") && building.salary !== undefined && (
            <>
              <p className="text-sm text-muted-foreground flex items-center">
                <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                Max dolgozók: {building.capacity}
              </p>
              <p className="text-sm text-muted-foreground flex items-center font-semibold text-blue-600">
                <Coins className="h-4 w-4 mr-1 text-blue-600" />
                Fizetés: {building.salary} pénz/ciklus
              </p>
            </>
          )}
        </div>
        <Button onClick={() => onSelectBuilding(building.name)} disabled={isDisabled}>
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
            {residentialBuildings.map((building, index) => (
              <div key={`${building.name}-${index}`}>{renderBuildingCard(building)}</div>
            ))}
          </TabsContent>
          <TabsContent value="business" className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {businessBuildings.map((building, index) => (
              <div key={`${building.name}-${index}`}>{renderBuildingCard(building)}</div>
            ))}
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