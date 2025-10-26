"use client";

import React from "react";
import { User, Home } from "lucide-react";

interface BuildingProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "house";
  cellSizePx: number;
  rentalPrice?: number;
  onClick: (buildingId: string) => void;
  currentResidents: number;
  maxResidents: number;
  isRentedByPlayer: boolean;
  isOwnedByPlayer: boolean;
  isGhost?: boolean; // Új prop a szellem épülethez
}

const Building: React.FC<BuildingProps> = ({ id, x, y, width, height, type, cellSizePx, onClick, currentResidents, maxResidents, isRentedByPlayer, isOwnedByPlayer, isGhost = false }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    left: x * cellSizePx,
    top: y * cellSizePx,
    width: width * cellSizePx,
    height: height * cellSizePx,
  };

  let content;
  let classes = "border border-gray-500 flex flex-col items-center justify-center text-xs text-white p-1 relative";

  if (isGhost) {
    classes += " bg-blue-400 opacity-50 pointer-events-none"; // Átlátszó és nem kattintható
  } else {
    classes += " bg-stone-400 rounded-md shadow-md cursor-pointer hover:bg-stone-500 transition-colors";
  }

  switch (type) {
    case "house":
      content = (
        <>
          Ház
          {!isGhost && currentResidents > 0 && (
            <div className="absolute bottom-1 right-1 flex items-center space-x-0.5">
              {Array.from({ length: currentResidents }).map((_, index) => (
                <User key={index} className="h-3 w-3 text-blue-200" />
              ))}
            </div>
          )}
          {!isGhost && isRentedByPlayer && (
            <span className="absolute top-1 left-1 text-[0.6rem] text-blue-700 font-bold">Bérelt</span>
          )}
          {!isGhost && isOwnedByPlayer && (
            <Home className="absolute top-1 right-1 h-3 w-3 text-yellow-400" />
          )}
        </>
      );
      break;
    default:
      content = "Ismeretlen épület";
  }

  return (
    <div style={style} className={classes} onClick={isGhost ? undefined : () => onClick(id)}>
      {content}
    </div>
  );
};

export default Building;