"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CropType } from "./Building";
import { Wheat, Coins, Sprout, Popcorn } from "lucide-react";
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

  const handlePlant = (type: CropType) => {
    const seedType = type === CropType.Wheat ? ProductType.WheatSeed : ProductType.CornSeed;
    const seedCount = playerInventory[seedType] || 0;
    
    if (seedCount < 1) {
      alert(`Nincs ${seedType === ProductType.WheatSeed ? 'búzavetőmagod' : 'kukorica vetőmagod'}! Szükséges: 1 db. Vásárolj a boltban.`);
      return;
    }
    onPlant(farmId, tileX, tileY, type);
    onClose();
  };

  const handleHarvest = () => {
    onHarvest(farmId, tileX, tileY);
    onClose();
  };

  const isReadyToHarvest = cropType !== CropType.None && cropProgress >= 100;
  const wheatSeedCount = playerInventory[ProductType.WheatSeed] || 0;
  const cornSeedCount = playerInventory[ProductType.CornSeed] || 0; // Kukorica vetőmag

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Szántóföld csempe ({tileX}, {tileY})</DialogTitle>
          <DialogDescription>
            {cropType === CropType.None ? "Ez a csempe üres. Vess el valamit!" : `Vetemény: ${cropType === CropType.Wheat ? "Búza" : cropType === CropType.Corn ? "Kukorica" : "Ismeretlen"}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {cropType === CropType.None && (
            <div className="flex flex-col space-y-2">
              <h4 className="font-semibold">Vetés:</h4>
              
              {/* Búza vetése */}
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Búzavetőmag készlet:</span>
                <span className="font-semibold">{wheatSeedCount} db</span>
              </div>
              <Button 
                onClick={() => handlePlant(CropType.Wheat)} 
                disabled={wheatSeedCount < 1}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Wheat className="h-4 w-4 mr-2" />
                Búza vetése (1 mag)
              </Button>
              {wheatSeedCount < 1 && (
                <p className="text-xs text-red-500">Nincs búzavetőmagod!</p>
              )}

              {/* Kukorica vetése */}
              <div className="flex items-center justify-between text-sm mt-4 mb-1">
                <span>Kukorica vetőmag készlet:</span>
                <span className="font-semibold">{cornSeedCount} db</span>
              </div>
              <Button 
                onClick={() => handlePlant(CropType.Corn)} 
                disabled={cornSeedCount < 1}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                <Popcorn className="h-4 w-4 mr-2" />
                Kukorica vetése (1 mag)
              </Button>
              {cornSeedCount < 1 && (
                <p className="text-xs text-red-500">Nincs kukorica vetőmagod!</p>
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