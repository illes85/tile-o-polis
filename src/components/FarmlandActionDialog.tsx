"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CropType } from "./Building";
import { Wheat, Coins, Sprout } from "lucide-react";
import { ProductType } from "@/utils/products";

interface FarmlandActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  tileX: number;
  tileY: number;
  cropType: CropType;
  cropProgress: number;
  onPlant: (farmId: string, x: number, y: number, cropType: CropType) => void;
  onHarvest: (farmId: string, x: number, y: number) => void;
  playerMoney: number;
  playerInventory: Record<string, number>;
}

const FarmlandActionDialog: React.FC<FarmlandActionDialogProps> = ({
  isOpen,
  onClose,
  farmId,
  tileX,
  tileY,
  cropType,
  cropProgress: initialCropProgress,
  onPlant,
  onHarvest,
  playerMoney,
  playerInventory,
}) => {
  const [cropProgress, setCropProgress] = useState(initialCropProgress);

  useEffect(() => {
    setCropProgress(initialCropProgress);
  }, [initialCropProgress]);

  const WHEAT_SEED_COST = 5;
  const WHEAT_GROW_TIME_MS = 60000;

  const handlePlantWheat = () => {
    const seedCount = playerInventory[ProductType.WheatSeed] || 0;
    if (seedCount < 1) {
      alert(`Nincs búzavetőmagod! Szükséges: 1 db. Vásárolj a boltban.`);
      return;
    }
    onPlant(farmId, tileX, tileY, CropType.Wheat);
    onClose();
  };

  const handleHarvest = () => {
    onHarvest(farmId, tileX, tileY);
    onClose();
  };

  const isReadyToHarvest = cropType === CropType.Wheat && cropProgress >= 100;
  const hasSeed = (playerInventory[ProductType.WheatSeed] || 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Szántóföld csempe ({tileX}, {tileY})</DialogTitle>
          <DialogDescription>
            {cropType === CropType.None ? "Ez a csempe üres. Vess el valamit!" : `Vetemény: ${cropType === CropType.Wheat ? "Búza" : "Ismeretlen"}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {cropType === CropType.None && (
            <div className="flex flex-col space-y-2">
              <h4 className="font-semibold">Vetés:</h4>
              <Button 
                onClick={handlePlantWheat} 
                disabled={!hasSeed}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Wheat className="h-4 w-4 mr-2" />
                Búza vetése (1 <span className="inline-flex items-center"><Coins className="h-3 w-3 ml-0.5 mr-0.5" /></span> mag)
              </Button>
              {!hasSeed && (
                <p className="text-xs text-red-500">Nincs búzavetőmagod! Szükséges: 1 db.</p>
              )}
            </div>
          )}
          {cropType !== CropType.None && (
            <div className="space-y-2">
              <h4 className="font-semibold">Növekedés:</h4>
              <div className="flex items-center space-x-2">
                <Sprout className="h-5 w-5 text-green-600" />
                <span>{Math.floor(cropProgress)}% kész</span>
              </div>
              <div className="w-full">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500" 
                    style={{ width: `${cropProgress}%` }} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {isReadyToHarvest && (
            <Button onClick={handleHarvest} className="bg-green-600 hover:bg-green-700">
              Aratás
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Bezárás</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FarmlandActionDialog;