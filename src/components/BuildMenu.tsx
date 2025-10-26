"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Hammer } from "lucide-react";

interface BuildingOption {
  type: string;
  name: string;
  cost: number;
  duration: number; // in ms
  width: number;
  height: number;
  rentalPrice: number;
  maxResidents: number;
}

interface BuildMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuilding: (buildingType: string) => void;
  availableBuildings: BuildingOption[];
  playerMoney: number;
  isBuildingInProgress: boolean;
}

const BuildMenu: React.FC<BuildMenuProps> = ({
  isOpen,
  onClose,
  onSelectBuilding,
  availableBuildings,
  playerMoney,
  isBuildingInProgress,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Építés</DialogTitle>
          <DialogDescription>Válassz egy épületet, amit fel szeretnél építeni.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {availableBuildings.map((building) => (
            <Card key={building.type} className="flex items-center justify-between p-4">
              <div>
                <CardTitle className="text-lg">{building.name}</CardTitle>
                <p className="text-sm text-muted-foreground flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-green-500" /> {building.cost} pénz
                </p>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Hammer className="h-4 w-4 mr-1 text-gray-500" /> {building.duration / 1000} másodperc
                </p>
              </div>
              <Button
                onClick={() => onSelectBuilding(building.type)}
                disabled={playerMoney < building.cost || isBuildingInProgress}
              >
                Épít
              </Button>
            </Card>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Mégsem</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuildMenu;