"use client";

import React from "react";
import { User, Home, Hammer, Briefcase, Leaf, Tent, Factory, Sprout, Building as BuildingIcon, Route } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils"; // Importáljuk a cn segédfüggvényt

export interface FarmlandTile {
  x: number;
  y: number;
  ownerId: string;
}

interface BuildingProps {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "house" | "office" | "forestry" | "farm" | "farmland" | "road";
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
  farmlandTiles?: FarmlandTile[];
  // Új propok az út csempékhez
  hasRoadNeighborTop?: boolean;
  hasRoadNeighborBottom?: boolean;
  hasRoadNeighborLeft?: boolean;
  hasRoadNeighborRight?: boolean;
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
  farmlandTiles,
  hasRoadNeighborTop = false,
  hasRoadNeighborBottom = false,
  hasRoadNeighborLeft = false,
  hasRoadNeighborRight = false,
}) => {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: x * cellSizePx,
    top: y * cellSizePx,
    width: width * cellSizePx,
    height: height * cellSizePx,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
  };

  const occupancy = type === "house" ? residentIds.length : employeeIds.length;
  const isRentedByPlayer = renterId === currentPlayerId;
  const isOwnedByPlayer = ownerId === currentPlayerId;
  const isPlayerEmployedHere = employeeIds.includes(currentPlayerId);

  let content;
  let classes = "border border-gray-500 flex flex-col items-center justify-center text-xs text-white p-1 relative overflow-hidden";
  let innerStyle: React.CSSProperties = {};

  if (isGhost) {
    classes += " bg-blue-400 opacity-50 pointer-events-none";
  } else if (isUnderConstruction) {
    classes += " bg-gray-600 opacity-70";
    content = (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Hammer className="h-6 w-6 text-white mb-1" />
        <span className="text-white text-xs">Épül...</span>
        <Progress value={buildProgress} className="w-3/4 h-2 mt-1" indicatorColor="bg-yellow-400" />
        <span className="text-white text-xs">{Math.floor(buildProgress)}%</span>
      </div>
    );
  } else {
    classes += " bg-stone-400 rounded-md shadow-md cursor-pointer hover:bg-stone-500 transition-colors";
    switch (type) {
      case "house":
        content = (
          <>
            {name === "Sátor" ? <Tent className="h-4 w-4 mb-1" /> : null}
            <span className="text-white text-xs">{name}</span>
            {occupancy > 0 && (
              <div className="absolute bottom-1 right-1 flex items-center space-x-0.5">
                {Array.from({ length: occupancy }).map((_, index) => (
                  <User key={index} className="h-3 w-3 text-blue-200" />
                ))}
              </div>
            )}
            {isRentedByPlayer && (
              <span className="absolute top-1 left-1 text-[0.6rem] text-blue-700 font-bold">Bérelt</span>
            )}
            {isOwnedByPlayer && (
              <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />
            )}
          </>
        );
        break;
      case "office":
        classes = classes.replace("bg-stone-400", "bg-blue-600");
        content = (
          <>
            {name === "Polgármesteri Hivatal" ? <BuildingIcon className="h-4 w-4 mb-1" /> : <Briefcase className="h-4 w-4 mb-1" />}
            <span className="text-white text-xs">{name}</span>
            {occupancy > 0 && (
              <div className="absolute bottom-1 right-1 flex items-center space-x-0.5">
                {Array.from({ length: occupancy }).map((_, index) => (
                  <Briefcase key={index} className="h-3 w-3 text-white" />
                ))}
              </div>
            )}
            {isOwnedByPlayer && (
              <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />
            )}
            {isPlayerEmployedHere && (
              <span className="absolute top-1 left-1 text-[0.6rem] text-green-200 font-bold">Alkalmazott</span>
            )}
          </>
        );
        break;
      case "forestry":
        classes = classes.replace("bg-stone-400", "bg-green-700");
        content = (
          <>
            Erdészház
            {occupancy > 0 && (
              <div className="absolute bottom-1 right-1 flex items-center space-x-0.5">
                {Array.from({ length: occupancy }).map((_, index) => (
                  <Briefcase key={index} className="h-3 w-3 text-white" />
                ))}
              </div>
            )}
            {isOwnedByPlayer && (
              <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />
            )}
            {isPlayerEmployedHere && (
              <span className="absolute top-1 left-1 text-[0.6rem] text-green-200 font-bold">Alkalmazott</span>
            )}
          </>
        );
        break;
      case "farm":
        classes = classes.replace("bg-stone-400", "bg-yellow-600");
        content = (
          <>
            Farm
            {occupancy > 0 && (
              <div className="absolute bottom-1 right-1 flex items-center space-x-0.5">
                {Array.from({ length: occupancy }).map((_, index) => (
                  <Briefcase key={index} className="h-3 w-3 text-white" />
                ))}
              </div>
            )}
            {isOwnedByPlayer && (
              <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />
            )}
            {isPlayerEmployedHere && (
              <span className="absolute top-1 left-1 text-[0.6rem] text-green-200 font-bold">Alkalmazott</span>
            )}
            {farmlandTiles && farmlandTiles.length > 0 && (
              <div className="absolute inset-0 flex flex-wrap opacity-70">
                {farmlandTiles.map((tile, index) => (
                  <div
                    key={index}
                    className="bg-yellow-800/50 border border-yellow-900"
                    style={{
                      position: 'absolute',
                      left: (tile.x - x) * cellSizePx,
                      top: (tile.y - y) * cellSizePx,
                      width: cellSizePx,
                      height: cellSizePx,
                    }}
                  >
                    <Sprout className="h-full w-full text-green-300 p-1" />
                  </div>
                ))}
              </div>
            )}
          </>
        );
        break;
      case "farmland":
        classes = "bg-yellow-800/50 border border-yellow-900 flex items-center justify-center text-xs text-white p-1 relative overflow-hidden";
        content = <Sprout className="h-full w-full text-green-300 p-1" />;
        break;
      case "road":
        // Alap stílus: kicsit kisebb, lekerekített szürke négyszög
        classes = cn(
          "absolute bg-gray-700 rounded-md",
          isGhost && "opacity-50 pointer-events-none"
        );
        
        // Az "összeolvadás" logikája
        const roadWidth = cellSizePx * 0.6; // Alap szélesség
        const roadHeight = cellSizePx * 0.6; // Alap magasság
        const offset = (cellSizePx - roadWidth) / 2; // Középre igazítás

        innerStyle = {
          left: offset,
          top: offset,
          width: roadWidth,
          height: roadHeight,
        };

        if (hasRoadNeighborTop) {
          innerStyle.top = 0;
          innerStyle.height = (innerStyle.height as number) + offset;
          classes = cn(classes, "rounded-t-none");
        }
        if (hasRoadNeighborBottom) {
          innerStyle.height = (innerStyle.height as number) + offset;
          classes = cn(classes, "rounded-b-none");
        }
        if (hasRoadNeighborLeft) {
          innerStyle.left = 0;
          innerStyle.width = (innerStyle.width as number) + offset;
          classes = cn(classes, "rounded-l-none");
        }
        if (hasRoadNeighborRight) {
          innerStyle.width = (innerStyle.width as number) + offset;
          classes = cn(classes, "rounded-r-none");
        }

        content = (
          <div className="h-full w-full flex items-center justify-center">
            <Route className="h-full w-full text-gray-400 p-1" />
          </div>
        );
        
        return (
          <div style={baseStyle} className="absolute">
            <div
              style={innerStyle}
              className={cn(
                "absolute bg-gray-700 rounded-md",
                isGhost && "opacity-50 pointer-events-none",
                !hasRoadNeighborTop && "rounded-t-md",
                !hasRoadNeighborBottom && "rounded-b-md",
                !hasRoadNeighborLeft && "rounded-l-md",
                !hasRoadNeighborRight && "rounded-r-md",
                hasRoadNeighborTop && hasRoadNeighborBottom && "rounded-none", // Ha mindkét irányba van, akkor ne legyen lekerekítés
                hasRoadNeighborLeft && hasRoadNeighborRight && "rounded-none"
              )}
              onClick={isGhost || isUnderConstruction ? undefined : () => onClick(id)}
            >
              {content}
            </div>
          </div>
        );
      default:
        content = "Ismeretlen épület";
    }
  }

  return (
    <div style={baseStyle} className={classes} onClick={isGhost || isUnderConstruction ? undefined : () => onClick(id)}>
      {content}
    </div>
  );
};

export default Building;