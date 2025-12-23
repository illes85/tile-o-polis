"use client";

import React, { useState } from "react";
import { User, Home, Hammer, Briefcase, Leaf, Tent, Factory, Sprout, Building as BuildingIcon, Route, ShoppingBag, Trash2, Wheat, Warehouse } from "lucide-react"; 
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils"; 
import satorImage from "@/images/sator.png"; 
import hazikoImage from "@/images/haziko.png"; 

// Búza tileset elérési útja (feltételezve, hogy a projektben van)
const CROP_TILESET = "/src/assets/48x48/Tilesets (Compact)/vectoraith_tileset_farmingsims_crops_48x48.png";

export enum CropType {
  None = "none",
  Wheat = "wheat",
}

export interface FarmlandTile {
  x: number;
  y: number;
  ownerId: string;
  isUnderConstruction?: boolean; 
  buildProgress?: number; 
  cropType: CropType; 
  cropProgress?: number; 
}

interface BuildingProps {
  id: string;
  name: string;
  x: number; 
  y: number; 
  width: number;
  height: number;
  type: "house" | "office" | "forestry" | "farm" | "farmland" | "road" | "shop" | "mill"; 
  cellSizePx: number;
  onClick: (buildingId: string) => void;
  rentalPrice?: number;
  salary?: number;
  capacity: number;
  ownerId?: string;
  renterId?: string;
  residentIds: string[];
  employeeIds: string[];
  isGhost?: boolean;
  isUnderConstruction?: boolean;
  buildProgress?: number;
  currentPlayerId: string;
  rotation: number;
  hasRoadNeighborTop?: boolean;
  hasRoadNeighborBottom?: boolean;
  hasRoadNeighborLeft?: boolean;
  hasRoadNeighborRight?: boolean;
  isPlacementMode: boolean; 
  isDemolishingRoad: boolean; 
  cropType?: CropType;
  cropProgress?: number;
}

const Building: React.FC<BuildingProps> = ({
  id,
  name,
  x,
  y,
  width,
  height,
  type,
  cellSizePx,
  onClick,
  capacity,
  ownerId,
  renterId,
  residentIds,
  employeeIds,
  isGhost = false,
  isUnderConstruction = false,
  buildProgress = 0,
  currentPlayerId,
  rotation,
  hasRoadNeighborTop = false,
  hasRoadNeighborBottom = false,
  hasRoadNeighborLeft = false,
  hasRoadNeighborRight = false,
  isPlacementMode,
  isDemolishingRoad,
  cropType = CropType.None,
  cropProgress = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const actualX = x * cellSizePx;
  const actualY = y * cellSizePx;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: actualX,
    top: actualY,
    width: width * cellSizePx,
    height: height * cellSizePx,
    zIndex: isGhost ? 50 : (type === "farmland" ? 0 : 1), 
    opacity: isGhost ? 0.7 : 1,
    pointerEvents: isGhost ? 'none' : 'auto',
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
  };

  const occupancy = type === "house" ? residentIds.length : employeeIds.length;
  const isRentedByPlayer = renterId === currentPlayerId;
  const isOwnedByPlayer = ownerId === currentPlayerId;
  const isPlayerEmployedHere = employeeIds.includes(currentPlayerId);

  let content;
  let baseClasses = "flex flex-col items-center justify-center text-xs text-white relative overflow-hidden";
  let visualClasses = ""; 

  const handleClick = (event: React.MouseEvent) => {
    if (!isGhost && !isUnderConstruction && isPlacementMode) {
      event.stopPropagation();
      return;
    }
    if (!isGhost && !isUnderConstruction) {
      onClick(id);
    }
  };

  if (isUnderConstruction) {
    visualClasses = "bg-gray-600 opacity-70 border border-gray-500";
    content = (
      <div className="flex flex-col items-center justify-center h-full w-full p-1"> 
        <Hammer className="h-6 w-6 text-white mb-1" />
        <span className="text-white text-xs">Épül...</span>
        <Progress value={buildProgress} className="w-3/4 h-2 mt-1" indicatorColor="bg-yellow-400" />
      </div>
    );
  } else {
    visualClasses = "rounded-md shadow-md cursor-pointer transition-colors"; 

    switch (type) {
      case "house":
        if (name === "Sátor" || name === "Házikó") {
          if (isHovered) visualClasses += " bg-stone-400 border border-gray-500 hover:bg-stone-500";
        } else {
          visualClasses += " bg-stone-400 border border-gray-500 hover:bg-stone-500";
          baseClasses += " p-1";
        }
        content = (
          <>
            {name === "Sátor" && <img src={satorImage} alt="Sátor" className="h-full w-full object-cover" />}
            {name === "Házikó" && <img src={hazikoImage} alt="Házikó" className="h-full w-full object-cover" />}
            {name !== "Sátor" && name !== "Házikó" && <span className="text-white text-xs">{name}</span>}
            {occupancy > 0 && (
              <div className="absolute bottom-1 right-1 flex items-center space-x-0.5">
                {Array.from({ length: occupancy }).map((_, index) => <User key={index} className="h-3 w-3 text-blue-200" />)}
              </div>
            )}
            {isOwnedByPlayer && <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />}
          </>
        );
        break;
      case "office":
        visualClasses += " bg-blue-600 border border-gray-500 hover:bg-blue-700";
        baseClasses += " p-1";
        content = (
          <>
            <BuildingIcon className="h-4 w-4 mb-1" />
            <span className="text-white text-[0.65rem] text-center">{name}</span>
            {isOwnedByPlayer && <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />}
          </>
        );
        break;
      case "forestry":
        visualClasses += " bg-green-700 border border-gray-500 hover:bg-green-800";
        baseClasses += " p-1";
        content = (
          <>
            <Leaf className="h-4 w-4 mb-1" />
            <span>Erdészház</span>
            {isOwnedByPlayer && <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />}
          </>
        );
        break;
      case "farm":
        visualClasses += " bg-yellow-600 border border-gray-500 hover:bg-yellow-700";
        baseClasses += " p-1";
        content = (
          <>
            <Sprout className="h-4 w-4 mb-1" />
            <span>Farm</span>
            {isOwnedByPlayer && <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />}
          </>
        );
        break;
      case "farmland":
        visualClasses += " bg-yellow-800/40 border border-yellow-900/50 hover:bg-yellow-800/60";
        
        let cropVisual = null;
        if (cropType === CropType.Wheat) {
          // Búza növekedési fázisok (4 szakasz a kompakt tilesetben)
          let stageX = 0;
          if (cropProgress >= 25 && cropProgress < 50) stageX = 1;
          else if (cropProgress >= 50 && cropProgress < 85) stageX = 2;
          else if (cropProgress >= 85) stageX = 3;

          cropVisual = (
            <div 
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${CROP_TILESET})`,
                backgroundPosition: `-${stageX * 48}px -0px`, // Első sor a búza
                backgroundSize: '192px 48px', // 4 fázis x 48px
                imageRendering: 'pixelated'
              }}
            />
          );
        } else {
          cropVisual = <Sprout className="h-4 w-4 text-green-300/50" />;
        }

        content = (
          <div className="flex flex-col items-center justify-center h-full w-full">
            {cropVisual}
            {cropType !== CropType.None && (
                <div className="absolute bottom-0 w-full bg-black/40 text-white text-[0.55rem] text-center">
                    {Math.floor(cropProgress || 0)}%
                </div>
            )}
          </div>
        );
        break;
      case "road":
        // Speciális út renderelés marad...
        break;
      case "shop":
        visualClasses += " bg-purple-600 border border-gray-500 hover:bg-purple-700";
        baseClasses += " p-1";
        content = (
          <>
            <ShoppingBag className="h-4 w-4 mb-1" />
            <span className="text-white text-[0.65rem] text-center">{name}</span>
            {isOwnedByPlayer && <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />}
          </>
        );
        break;
      case "mill":
        visualClasses += " bg-amber-800 border border-amber-900 hover:bg-amber-900";
        baseClasses += " p-1";
        content = (
          <>
            <Warehouse className="h-4 w-4 mb-1" />
            <span className="text-white text-[0.65rem] text-center">{name}</span>
            {isOwnedByPlayer && <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />}
          </>
        );
        break;
    }
  }

  // Út renderelése...
  if (type === "road" && !isUnderConstruction) {
    const roadWidth = cellSizePx * 0.6;
    const roadHeight = cellSizePx * 0.6;
    const offset = (cellSizePx - roadWidth) / 2;
    const currentInnerStyle: React.CSSProperties = { left: offset, top: offset, width: roadWidth, height: roadHeight };
    if (hasRoadNeighborTop) { currentInnerStyle.top = 0; currentInnerStyle.height = (currentInnerStyle.height as number) + offset; }
    if (hasRoadNeighborBottom) { currentInnerStyle.height = (currentInnerStyle.height as number) + offset; }
    if (hasRoadNeighborLeft) { currentInnerStyle.left = 0; currentInnerStyle.width = (currentInnerStyle.width as number) + offset; }
    if (hasRoadNeighborRight) { currentInnerStyle.width = (currentInnerStyle.width as number) + offset; }
    const roundedClasses = cn(!hasRoadNeighborTop && "rounded-t-md", !hasRoadNeighborBottom && "rounded-b-md", !hasRoadNeighborLeft && "rounded-l-md", !hasRoadNeighborRight && "rounded-r-md");
    return (
      <div style={baseStyle} className="absolute">
        <div style={currentInnerStyle} className={cn("absolute bg-gray-400 border border-gray-500", roundedClasses)} onClick={handleClick} />
      </div>
    );
  }

  return (
    <div style={baseStyle} className={cn(baseClasses, visualClasses)} onClick={handleClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {content}
    </div>
  );
};

export default Building;