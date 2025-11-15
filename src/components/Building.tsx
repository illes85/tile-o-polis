"use client";

import React, { useState } from "react";
import { User, Home, Hammer, Briefcase, Leaf, Tent, Factory, Sprout, Building as BuildingIcon, Route, ShoppingBag, Trash2 } from "lucide-react"; // ShoppingBag ikon a bolthoz, Trash2 ikon a bontáshoz
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils"; // Importáljuk a cn segédfüggvényt
import satorImage from "@/images/sator.png"; // Importáljuk a sator.png képet

export interface FarmlandTile {
  x: number;
  y: number;
  ownerId: string;
  isUnderConstruction?: boolean; // Új: szántóföld csempe építés alatt
  buildProgress?: number; // Új: szántóföld csempe építési folyamat
}

interface BuildingProps {
  id: string;
  name: string;
  x: number; // Rács x koordinátája
  y: number; // Rács y koordinátája
  width: number;
  height: number;
  type: "house" | "office" | "forestry" | "farm" | "farmland" | "road" | "shop"; // Új: shop típus
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
  isPlacementMode: boolean; // Új: jelzi, ha a játékos éppen építési módban van
  isDemolishingRoad: boolean; // Új: jelzi, ha a játékos út bontási módban van
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
  isPlacementMode,
  isDemolishingRoad, // Hozzáadva
}) => {
  const [isHovered, setIsHovered] = useState(false); // Új állapot az egérráhúzáshoz

  // Az x és y propok mostantól mindig rácskoordináták, így egyszerűen megszorozzuk őket cellSizePx-szel.
  const actualX = x * cellSizePx;
  const actualY = y * cellSizePx;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: actualX,
    top: actualY,
    width: width * cellSizePx,
    height: height * cellSizePx,
    zIndex: isGhost ? 50 : 1, // Magasabb z-index a szellem épületnek
    opacity: isGhost ? 0.7 : 1, // Átlátszóság a szellem épületnek
    pointerEvents: isGhost ? 'none' : 'auto', // Ne lehessen rákattintani a szellem épületre
    transform: `rotate(${rotation}deg)`, // Mindig alkalmazzuk a forgatást, szellem épületre is
    transformOrigin: 'center center',
  };

  const occupancy = type === "house" ? residentIds.length : employeeIds.length;
  const isRentedByPlayer = renterId === currentPlayerId;
  const isOwnedByPlayer = ownerId === currentPlayerId;
  const isPlayerEmployedHere = employeeIds.includes(currentPlayerId);

  let content;
  let classes = "border border-gray-500 flex flex-col items-center justify-center text-xs text-white p-1 relative overflow-hidden";
  let innerStyle: React.CSSProperties = {};

  // Ha építési módban vagyunk, és ez nem egy szellem épület, akkor ne legyen kattintható
  const handleClick = (event: React.MouseEvent) => {
    if (!isGhost && !isUnderConstruction && isPlacementMode) {
      event.stopPropagation(); // Megakadályozza, hogy a kattintás tovább terjedjen a térképre
      return;
    }
    if (!isGhost && !isUnderConstruction) {
      onClick(id);
    }
  };

  if (isUnderConstruction) {
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
            {name === "Sátor" ? <img src={satorImage} alt="Sátor" className="h-full w-full object-cover" /> : null}
            {name === "Sátor" && isHovered && ( // Csak Sátor esetén és egérráhúzásra
              <span className="text-white text-xs absolute bottom-1 left-1 bg-black bg-opacity-50 px-1 rounded">{name}</span>
            )}
            {occupancy > 0 && (
              <div className="absolute bottom-1 right-1 flex items-center space-x-0.5">
                {Array.from({ length: occupancy }).map((_, index) => (
                  <User key={index} className="h-3 w-3 text-blue-200" />
                ))}
              </div>
            )}
            {isRentedByPlayer && (
              <span className="absolute top-1 left-1 text-[0.6rem] text-blue-700 font-bold bg-black bg-opacity-50 px-1 rounded">Bérelt</span>
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
                    className={cn(
                      "bg-yellow-800/50 border border-yellow-900",
                      tile.isUnderConstruction && "opacity-70 bg-gray-400"
                    )}
                    style={{
                      position: 'absolute',
                      left: (tile.x - x) * cellSizePx,
                      top: (tile.y - y) * cellSizePx,
                      width: cellSizePx,
                      height: cellSizePx,
                    }}
                  >
                    {tile.isUnderConstruction ? (
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <Hammer className="h-4 w-4 text-gray-700 mb-0.5" />
                        <Progress value={tile.buildProgress} className="w-3/4 h-1 mt-0.5" indicatorColor="bg-yellow-400" />
                        <span className="text-gray-700 text-[0.6rem]">{Math.floor(tile.buildProgress || 0)}%</span>
                      </div>
                    ) : (
                      <Sprout className="h-full w-full text-green-300 p-1" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        );
        break;
      case "farmland":
        classes = cn(
          "bg-yellow-800/50 border border-yellow-900 flex items-center justify-center text-xs text-white p-1 relative overflow-hidden",
          isUnderConstruction && "opacity-70 bg-gray-400"
        );
        content = isUnderConstruction ? (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <Hammer className="h-4 w-4 text-gray-700 mb-0.5" />
            <Progress value={buildProgress} className="w-3/4 h-1 mt-0.5" indicatorColor="bg-yellow-400" />
            <span className="text-gray-700 text-[0.6rem]">{Math.floor(buildProgress)}%</span>
          </div>
        ) : (
          <Sprout className="h-full w-full text-green-300 p-1" />
        );
        break;
      case "road":
        // Alap stílus: kicsit kisebb, lekerekített szürke négyszög
        classes = cn(
          "absolute bg-gray-300/80 border border-gray-400", // Világosabb szürke, enyhe átlátszósággal
          isUnderConstruction && "opacity-70 bg-gray-400", // Építés alatt álló út
          isDemolishingRoad && isOwnedByPlayer && "border-2 border-red-500 cursor-cell" // Piros keret bontási módban
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

        // Ha van szomszéd, akkor kiterjesztjük a belső elemet a szomszéd felé
        if (hasRoadNeighborTop) {
          innerStyle.top = 0;
          innerStyle.height = (innerStyle.height as number) + offset;
        }
        if (hasRoadNeighborBottom) {
          innerStyle.height = (innerStyle.height as number) + offset;
        }
        if (hasRoadNeighborLeft) {
          innerStyle.left = 0;
          innerStyle.width = (innerStyle.width as number) + offset;
        }
        if (hasRoadNeighborRight) {
          innerStyle.width = (innerStyle.width as number) + offset;
        }

        // Lekerekítés szabályozása: csak akkor legyen lekerekített, ha nincs szomszéd abban az irányban
        const roundedClasses = cn(
          !hasRoadNeighborTop && "rounded-t-md",
          !hasRoadNeighborBottom && "rounded-b-md",
          !hasRoadNeighborLeft && "rounded-l-md",
          !hasRoadNeighborRight && "rounded-r-md",
          (hasRoadNeighborTop && hasRoadNeighborBottom && hasRoadNeighborLeft && hasRoadNeighborRight) && "rounded-none" // Ha mindenhol van szomszéd, akkor ne legyen lekerekítés
        );

        content = isUnderConstruction ? (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <Hammer className="h-4 w-4 text-gray-700 mb-0.5" />
            <Progress value={buildProgress} className="w-3/4 h-1 mt-0.5" indicatorColor="bg-yellow-400" />
            <span className="text-gray-700 text-[0.6rem]">{Math.floor(buildProgress)}%</span>
          </div>
        ) : null; // Nincs ikon, ha kész az út

        return (
          <div style={baseStyle} className="absolute">
            <div
              style={innerStyle}
              className={cn(
                "absolute bg-gray-300/80 border border-gray-400",
                isUnderConstruction && "opacity-70 bg-gray-400",
                roundedClasses,
                isDemolishingRoad && isOwnedByPlayer && "border-2 border-red-500" // Piros keret bontási módban
              )}
              onClick={handleClick} // Használjuk az új handleClick-et
            >
              {content}
            </div>
          </div>
        );
      case "shop":
        classes = classes.replace("bg-stone-400", "bg-purple-600");
        content = (
          <>
            <ShoppingBag className="h-4 w-4 mb-1" />
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
      default:
        content = "Ismeretlen épület";
    }
  }

  return (
    <div
      style={baseStyle}
      className={classes}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)} // Egérráhúzás esemény
      onMouseLeave={() => setIsHovered(false)} // Egér elhagyása esemény
    >
      {content}
    </div>
  );
};

export default Building;