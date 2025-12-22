"use client";

import React, { useEffect, useState } from "react"; // useEffect és useState importálása
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CropType } from "./Building";
import { Wheat, Coins, Sprout } from "lucide-react";

interface FarmlandActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  tileX: number;
  tileY: number;
  cropType: CropType;
  cropProgress: number; // Ez az érték nem frissül automatikusan
  onPlant: (farmId: string, x: number, y: number, cropType: CropType) => void;
  onHarvest: (farmId: string, x: number, y: number) => void;
  playerMoney: number;
}

const FarmlandActionDialog: React.FC<FarmlandActionDialogProps> = ({
  isOpen,
  onClose,
  farmId,
  tileX,
  tileY,
  cropType,
  cropProgress: initialCropProgress, // Átnevezés, hogy jelezzük, ez a kezdeti érték
  onPlant,
  onHarvest,
  playerMoney,
}) => {
  // Belső állapot a cropProgress számára, hogy frissíthető legyen
  const [cropProgress, setCropProgress] = useState(initialCropProgress);
  
  // Effekt a cropProgress frissítésére, ha a kezdeti érték megváltozik
  useEffect(() => {
    setCropProgress(initialCropProgress);
  }, [initialCropProgress]);

  const WHEAT_SEED_COST = 5;
  const WHEAT_GROW_TIME_MS = 60000;

  const handlePlantWheat = () => {
    if (playerMoney < WHEAT_SEED_COST) {
      alert(`Nincs elég pénzed búza vetőmagra! Szükséges: ${WHEAT_SEED_COST} pénz.`);
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
                disabled={playerMoney < WHEAT_SEED_COST}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Wheat className="h-4 w-4 mr-2" /> Búza vetése ({WHEAT_SEED_COST} <Coins className="inline-block h-3 w-3 ml-0.5 mr-0.5" />)
              </Button>
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