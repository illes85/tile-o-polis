"use client";

import React from "react";
import { User, Home, Hammer, Briefcase } from "lucide-react";
import { Progress } from "@/components/ui/progress"; // Import Progress component

interface BuildingProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "house" | "office"; // Új típus
  cellSizePx: number;
  onClick: (buildingId: string) => void;
  rentalPrice?: number;
  salary?: number; // Új prop irodákhoz
  capacity: number; // Max lakók/dolgozók
  occupancy: number; // Aktuális lakók/dolgozók
  ownerId?: string; // Új: tulajdonos ID-ja
  renterId?: string; // Új: bérlő ID-ja
  employeeIds: string[]; // Új: dolgozók ID-i
  isGhost?: boolean;
  isUnderConstruction?: boolean; // Új prop
  buildProgress?: number; // Új prop
  currentPlayerId: string; // Új: az aktuális játékos ID-ja
}

const Building: React.FC<BuildingProps> = ({
  id,
  x,
  y,
  width,
  height,
  type,
  cellSizePx,
  onClick,
  occupancy,
  capacity,
  ownerId,
  renterId,
  employeeIds,
  isGhost = false,
  isUnderConstruction = false,
  buildProgress = 0,
  currentPlayerId,
}) => {
  const style: React.CSSProperties = {
    position: "absolute",
    left: x * cellSizePx,
    top: y * cellSizePx,
    width: width * cellSizePx,
    height: height * cellSizePx,
  };

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
            Ház
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