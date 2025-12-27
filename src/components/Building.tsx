"use client";

import React, { useState, useEffect } from "react";
import { User, Home, Hammer, Briefcase, Leaf, Tent, Factory, Sprout, Building as BuildingIcon, Route, ShoppingBag, Trash2, Wheat, Warehouse, Popcorn } from "lucide-react"; 
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils"; 
import satorImage from "@/images/sator.png"; 
import hazikoImage from "@/images/haziko.png"; 
import farmImage from "@/images/farm.png"; 
import valyoghazImage from "@/images/vályogház 2.png"; // ÚJ VÁLYOGHÁZ KÉP IMPORTÁLÁSA
import cropTileset from "@/assets/48x48/Tilesets (Compact)/vectoraith_tileset_farmingsims_crops_48x48.png";
import detailsTileset from "@/assets/32x32/Tilesets (Modular)/vectoraith_tileset_farmingsims_details_summer_32x32.png";
import buildingTileset32 from "@/assets/32x32/Tilesets (Modular)/vectoraith_tileset_farmingsims_buildings_32x32.png";

// Tileset elérési utak
const CROP_TILESET = cropTileset;
const DETAILS_TILESET = detailsTileset;
const BUILDING_TILESET_32 = buildingTileset32;

export enum CropType {
  None = "none",
  Wheat = "wheat",
  Corn = "corn", // ÚJ: Kukorica
}

export interface FarmlandTile {
  x: number;
  y: number;
  ownerId: string;
  isUnderConstruction?: boolean; 
  buildProgress?: number; 
  constructionEta?: number; // Építkezés befejezési ideje (timestamp)
  originalDuration?: number; // Eredeti építési időtartam (ms)
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
  type: "house" | "office" | "forestry" | "farm" | "farmland" | "road" | "shop" | "mill" | "popcorn_stand" | "bank"; 
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
  constructionEta?: number; // Építkezés befejezési ideje (timestamp)
  originalDuration?: number; // Eredeti építési időtartam (ms)
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
  constructionEta, 
  originalDuration, // ÚJ PROP
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
  const [now, setNow] = useState(Date.now());

  // Frissítjük az időt másodpercenként a progressz számításához
  useEffect(() => {
    if (isUnderConstruction) {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isUnderConstruction]);

  const actualX = x * cellSizePx;
  const actualY = y * cellSizePx;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: actualX,
    top: actualY,
    width: width * cellSizePx,
    height: height * cellSizePx,
    zIndex: isGhost ? 50 : (type === "farmland" ? 0 : 1), 
    opacity: isGhost ? 0.5 : 1,
    pointerEvents: isGhost ? 'none' : 'auto',
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
  };

  const occupancy = type === "house" ? residentIds.length : employeeIds.length;
  const isRentedByPlayer = renterId === currentPlayerId;
  const isOwnedByPlayer = ownerId === currentPlayerId;
  const isPlayerEmployedHere = employeeIds.includes(currentPlayerId);

  let content;
  let baseClasses = "flex flex-col items-center justify-center text-xs text-white relative";
  if (type !== "farmland") {
    baseClasses += " overflow-hidden";
  }
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

  if (isUnderConstruction && constructionEta && originalDuration) {
    visualClasses = "bg-gray-600 opacity-70 border border-gray-500";
    
    const timeElapsed = now - (constructionEta - originalDuration);
    const progressValue = Math.min(100, Math.max(0, (timeElapsed / originalDuration) * 100));
    const remainingTimeSec = Math.ceil(Math.max(0, (constructionEta - now) / 1000));

    content = (
      <div className="flex flex-col items-center justify-center h-full w-full p-1"> 
        <Hammer className="h-6 w-6 text-white mb-1" />
        <span className="text-white text-xs">Épül...</span>
        <Progress value={progressValue} className="w-3/4 h-2 mt-1" />
        <span className="text-white text-[0.6rem] mt-1">{remainingTimeSec} mp</span>
      </div>
    );
  } else {
    visualClasses = "rounded-md shadow-md cursor-pointer transition-colors"; 

    switch (type) {
      case "house":
        if (name === "Sátor") {
          content = <img src={satorImage} alt="Sátor" className="h-full w-full object-cover" />;
        } else if (name === "Házikó") {
          content = <img src={hazikoImage} alt="Házikó" className="h-full w-full object-cover" />;
        } else if (name === "Vályogház") {
          content = <img src={valyoghazImage} alt="Vályogház" className="h-full w-full object-cover" />;
        } else {
          visualClasses += " bg-stone-400 border border-gray-500 hover:bg-stone-500";
          baseClasses += " p-1";
          content = <span className="text-white text-xs">{name}</span>;
        }
        
        if (name !== "Sátor" && name !== "Házikó" && name !== "Vályogház") {
            visualClasses += " bg-stone-400 border border-gray-500 hover:bg-stone-500";
            baseClasses += " p-1";
        }

        if (occupancy > 0) {
          content = (
            <>
              {content}
              <div className="absolute bottom-1 right-1 flex items-center space-x-0.5">
                {Array.from({ length: occupancy }).map((_, index) => <User key={index} className="h-3 w-3 text-blue-200" />)}
              </div>
            </>
          );
        }
        if (isOwnedByPlayer) {
            content = (
                <>
                    {content}
                    <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />
                </>
            );
        }
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
        // Farm képének használata
        visualClasses = "shadow-md cursor-pointer transition-colors"; 
        content = (
          <img src={farmImage} alt="Farm" className="h-full w-full object-cover" />
        );
        break;
      case "farmland": {
        visualClasses += " bg-yellow-800/40 border border-yellow-900/50 hover:bg-yellow-800/60";
        let cropVisual = null;
        
        if (cropType !== CropType.None) {
          if (cropType === CropType.Corn) {
            // Corn logic: 32x64px (1x2 tiles), growing upwards.
            // Stages based on progress: 0-25 (Stage 1), 25-50 (Stage 2), 50-85 (Stage 3), 85+ (Stage 4)
            // Rows 9-16 (Indices 8-15 0-based? User said 9-16. Let's assume 1-based indices 8-15).
            // Each stage is 2 tiles high (64px).
            // Stage 1: Rows 9-10 (Index 8-9) -> Y = 8 * 32 = 256
            // Stage 2: Rows 11-12 (Index 10-11) -> Y = 10 * 32 = 320
            // Stage 3: Rows 13-14 (Index 12-13) -> Y = 12 * 32 = 384
            // Stage 4: Rows 15-16 (Index 14-15) -> Y = 14 * 32 = 448
            // Column 1 (Index 0) -> X = 0
            
            let stageY = 256; // Default Stage 1
            if (cropProgress >= 25 && cropProgress < 50) stageY = 320;
            else if (cropProgress >= 50 && cropProgress < 85) stageY = 384;
            else if (cropProgress >= 85) stageY = 448;

            // Variation logic: use column 1 or 2 based on position
            // Column 1 is 0px, Column 2 is 32px
            const variant = (x + y) % 2;
            const bgX = variant * 32;

            cropVisual = (
              <div 
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '32px',
                  height: '64px',
                  backgroundImage: `url("${DETAILS_TILESET}")`,
                  backgroundPosition: `-${bgX}px -${stageY}px`, 
                  imageRendering: 'pixelated',
                  zIndex: 10, // Ensure it overlaps if needed
                  pointerEvents: 'none'
                }}
              />
            );
          } else {
             // Wheat logic (existing)
             cropVisual = (
                <div 
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    width: '48px',
                    height: '48px',
                    backgroundImage: `url("${CROP_TILESET}")`, // Visszaállítva CROP_TILESET-re
                    backgroundPosition: `-${(Math.min(3, Math.floor((cropProgress || 0) / 25))) * 48}px 0px`,
                    imageRendering: 'pixelated',
                    zIndex: 10,
                    pointerEvents: 'none',
                    transform: 'scale(0.66)', // 48px -> 32px
                    transformOrigin: 'bottom left'
                  }}
                />
             );
          }
        }
 else {
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
      }
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
      case "popcorn_stand":
        visualClasses += " bg-red-500 border border-red-600 hover:bg-red-600";
        baseClasses += " p-1";
        content = (
          <>
            <Popcorn className="h-4 w-4 mb-1" />
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
