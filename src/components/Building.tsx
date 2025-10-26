"use client";

import React from "react";
import { User, Home, Hammer, Briefcase, Leaf, Tent, Factory, Sprout } from "lucide-react"; // Importáljuk a Leaf, Tent, Factory és Sprout ikonokat
import { Progress } from "@/components/ui/progress"; // Import Progress component

export interface FarmlandTile {
  x: number;
  y: number;
  ownerId: string;
}

interface BuildingProps {
  id: string;
  name: string; // Új: épület neve
  x: number;
  y: number;
  width: number;
  height: number;
  type: "house" | "office" | "forestry" | "farm" | "farmland"; // Új típus: farmland
  cellSizePx: number;
  onClick: (buildingId: string) => void;
  rentalPrice?: number;
  salary?: number; // Új prop irodákhoz
  capacity: number; // Max lakók/dolgozók
  ownerId?: string; // Új: tulajdonos ID-ja
  renterId?: string; // Új: bérlő ID-ja
  residentIds: string[]; // Új: lakók ID-i
  employeeIds: string[]; // Új: dolgozók ID-i
  isGhost?: boolean;
  isUnderConstruction?: boolean; // Új prop
  buildProgress?: number; // Új prop
  currentPlayerId: string; // Új: az aktuális játékos ID-ja
  rotation: number; // Új: forgatás szöge (0, 90, 180, 270)
  farmlandTiles?: FarmlandTile[]; // Új: szántóföld csempék (csak farmokhoz)
}

const Building: React.FC<BuildingProps> = ({
  id,
  name, // Hozzáadva a name prop
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
}) => {
  const style: React.CSSProperties = {
    position: "absolute",
    left: x * cellSizePx,
    top: y * cellSizePx,
    width: width * cellSizePx,
    height: height * cellSizePx,
    transform: `rotate(${rotation}deg)`, // Forgatás alkalmazása
    transformOrigin: 'center center', // Középpont körüli forgatás
  };

  const occupancy = type === "house" ? residentIds.length : employeeIds.length;
  const isRentedByPlayer = renterId === currentPlayerId;
  const isOwnedByPlayer = ownerId === currentPlayerId;
  const isPlayerEmployedHere = employeeIds.includes(currentPlayerId);

  let content;
  let classes = "border border-gray-500 flex flex-col items-center justify-center text-xs text-white p-1 relative overflow-hidden";

  if (isGhost) {
    classes += " bg-blue-400 opacity-50 pointer-events-none";
  } else if (isUnderConstruction) {
    classes += " bg-gray-600 opacity-70"; // Építés alatt álló épület
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
            {name === "Sátor" ? <Tent className="h-4 w-4 mb-1" /> : null} {/* Sátor ikon csak a Sátorhoz */}
            <span className="text-white text-xs">{name}</span> {/* Az épület neve */}
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
        classes = classes.replace("bg-stone-400", "bg-blue-600"); // Kék szín az irodának
        content = (
          <>
            Iroda
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
        classes = classes.replace("bg-stone-400", "bg-green-700"); // Zöld szín az erdészháznak
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
      case "farm": // Új farm típus
        classes = classes.replace("bg-stone-400", "bg-yellow-600"); // Sárga szín a farmnak
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
      case "farmland": // Szántóföld csempe
        classes = "bg-yellow-800/50 border border-yellow-900 flex items-center justify-center text-xs text-white p-1 relative overflow-hidden";
        content = <Sprout className="h-full w-full text-green-300 p-1" />;
        break;
      default:
        content = "Ismeretlen épület";
    }
  }

  return (
    <div style={style} className={classes} onClick={isGhost || isUnderConstruction ? undefined : () => onClick(id)}>
      {content}
    </div>
  );
};

export default Building;