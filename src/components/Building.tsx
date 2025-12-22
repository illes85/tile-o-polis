"use client";

import React, { useState } from "react";
import { User, Home, Hammer, Briefcase, Leaf, Tent, Factory, Sprout, Building as BuildingIcon, Route, ShoppingBag, Trash2, Wheat } from "lucide-react"; // ShoppingBag ikon a bolthoz, Trash2 ikon a bontáshoz, Wheat ikon a búzához
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils"; // Importáljuk a cn segédfüggvényt
import satorImage from "@/images/sator.png"; // Importáljuk a sator.png képet
import hazikoImage from "@/images/haziko.png"; // Importáljuk a haziko.png képet

export enum CropType {
  None = "none",
  Wheat = "wheat",
}

export interface FarmlandTile {
  x: number;
  y: number;
  ownerId: string;
  isUnderConstruction?: boolean; // Új: szántóföld csempe építés alatt
  buildProgress?: number; // Új: szántóföld csempe építési folyamat
  cropType: CropType; // Új: vetemény típusa
  cropProgress?: number; // Új: vetemény növekedési állapota (0-100)
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
  farmlandTiles?: FarmlandTile[]; // Ezt a propot most már csak a Map.tsx használja az adatok kinyerésére, de a Building komponensben nem rendereljük
  // Új propok az út csempékhez
  hasRoadNeighborTop?: boolean;
  hasRoadNeighborBottom?: boolean;
  hasRoadNeighborLeft?: boolean;
  hasRoadNeighborRight?: boolean;
  isPlacementMode: boolean; // Új: jelzi, ha a játékos éppen építési módban van
  isDemolishingRoad: boolean; // Új: jelzi, ha a játékos út bontási módban van
  // Crop adatok a farmland csempékhez
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
    zIndex: isGhost ? 50 : (type === "farmland" ? 0 : 1), // Szántóföld legyen a legalul (Z-index 0)
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
  // Alapértelmezett osztályok, de a padding-et kivesszük, ha kép alapú házról van szó
  let baseClasses = "flex flex-col items-center justify-center text-xs text-white relative overflow-hidden";
  let visualClasses = ""; // Ide kerülnek a háttér, keret, árnyék, hover stílusok

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
      <div className="flex flex-col items-center justify-center h-full w-full p-1"> {/* Padding vissza a tartalomra */}
        <Hammer className="h-6 w-6 text-white mb-1" />
        <span className="text-white text-xs">Épül...</span>
        <Progress value={buildProgress} className="w-3/4 h-2 mt-1" indicatorColor="bg-yellow-400" />
        <span className="text-white text-xs">{Math.floor(buildProgress)}%</span>
      </div>
    );
  } else {
    visualClasses = "rounded-md shadow-md cursor-pointer transition-colors"; // Közös stílusok nem építés alatt álló épületeknek

    switch (type) {
      case "house":
        if (name === "Sátor" || name === "Házikó") {
          // Kép alapú házak: háttér és keret csak egérráhúzásra
          if (isHovered) {
            visualClasses += " bg-stone-400 border border-gray-500 hover:bg-stone-500";
          }
        } else {
          // Nem kép alapú házak: mindig van háttér és keret
          visualClasses += " bg-stone-400 border border-gray-500 hover:bg-stone-500";
          baseClasses += " p-1"; // Padding vissza a nem kép alapú házakra
        }
        content = (
          <>
            {name === "Sátor" && <img src={satorImage} alt="Sátor" className="h-full w-full object-cover" />}
            {name === "Házikó" && <img src={hazikoImage} alt="Házikó" className="h-full w-full object-cover" />}
            
            {(name === "Sátor" || name === "Házikó") && isHovered && (
              <span className="text-white text-xs absolute bottom-1 left-1 bg-black bg-opacity-50 px-1 rounded">{name}</span>
            )}
            {name !== "Sátor" && name !== "Házikó" && (
              <span className="text-white text-xs">{name}</span>
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
        visualClasses += " bg-blue-600 border border-gray-500 hover:bg-blue-700";
        baseClasses += " p-1"; // Padding vissza
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
        visualClasses += " bg-green-700 border border-gray-500 hover:bg-green-800";
        baseClasses += " p-1"; // Padding vissza
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
        visualClasses += " bg-yellow-600 border border-gray-500 hover:bg-yellow-700";
        baseClasses += " p-1"; // Padding vissza
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
          </>
        );
        break;
      case "farmland":
        visualClasses += " bg-yellow-800/50 border border-yellow-900"; // Farmlandnek mindig van háttér és keret
        baseClasses += " p-1"; // Padding vissza
        
        let cropIcon = null;
        let cropText = null;
        
        if (cropType === CropType.Wheat) {
            cropIcon = <Wheat className="h-full w-full text-amber-700 p-1" />;
            cropText = "Búza";
        } else {
            cropIcon = <Sprout className="h-full w-full text-green-300 p-1" />;
            cropText = "Szántóföld";
        }

        content = isUnderConstruction ? (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <Hammer className="h-4 w-4 text-gray-700 mb-0.5" />
            <Progress value={buildProgress} className="w-3/4 h-1 mt-0.5" indicatorColor="bg-yellow-400" />
            <span className="text-gray-700 text-[0.6rem]">{Math.floor(buildProgress || 0)}%</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full">
            {cropIcon}
            {cropType !== CropType.None && (
                <div className="absolute bottom-0 w-full bg-black/50 text-white text-[0.6rem] text-center">
                    {cropText} ({Math.floor(cropProgress || 0)}%)
                </div>
            )}
          </div>
        );
        break;
      case "road":
        // Az út speciális renderelése miatt itt nem adunk hozzá visualClasses-t,
        // hanem a belső div-ben kezeljük a stílusokat.
        break;
      case "shop":
        visualClasses += " bg-purple-600 border border-gray-500 hover:bg-purple-700";
        baseClasses += " p-1"; // Padding vissza
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
        visualClasses += " bg-stone-400 border border-gray-500 hover:bg-stone-500";
        baseClasses += " p-1"; // Padding vissza
        content = "Ismeretlen épület";
    }
  }

  // Speciális kezelés az út típushoz, mivel az egy belső div-et használ
  if (type === "road" && !isUnderConstruction) {
    // Az "összeolvadás" logikája
    const roadWidth = cellSizePx * 0.6; // Alap szélesség
    const roadHeight = cellSizePx * 0.6; // Alap magasság
    const offset = (cellSizePx - roadWidth) / 2; // Középre igazítás

    const currentInnerStyle: React.CSSProperties = { // Deklaráljuk itt az innerStyle-t
      left: offset,
      top: offset,
      width: roadWidth,
      height: roadHeight,
    };

    // Ha van szomszéd, akkor kiterjesztjük a belső elemet a szomszéd felé
    if (hasRoadNeighborTop) {
      currentInnerStyle.top = 0;
      currentInnerStyle.height = (currentInnerStyle.height as number) + offset;
    }
    if (hasRoadNeighborBottom) {
      currentInnerStyle.height = (currentInnerStyle.height as number) + offset;
    }
    if (hasRoadNeighborLeft) {
      currentInnerStyle.left = 0;
      currentInnerStyle.width = (currentInnerStyle.width as number) + offset;
    }
    if (hasRoadNeighborRight) {
      currentInnerStyle.width = (currentInnerStyle.width as number) + offset;
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
      <div className="flex flex-col items-center justify-center h-full w-full p-1"> {/* Padding vissza a tartalomra */}
        <Hammer className="h-4 w-4 text-gray-700 mb-0.5" />
        <Progress value={buildProgress} className="w-3/4 h-1 mt-0.5" indicatorColor="bg-yellow-400" />
        <span className="text-gray-700 text-[0.6rem]">{Math.floor(buildProgress)}%</span>
      </div>
    ) : null; // Nincs ikon, ha kész az út

    return (
      <div style={baseStyle} className="absolute">
        <div
          style={currentInnerStyle} // Itt használjuk a helyesen deklarált innerStyle-t
          className={cn(
            "absolute bg-gray-300/80 border border-gray-400",
            isUnderConstruction && "opacity-70 bg-gray-400",
            roundedClasses,
            isDemolishingRoad && isOwnedByPlayer && "border-2 border-red-500" // Piros keret bontási módban
          )}
          onClick={handleClick}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      style={baseStyle}
      className={cn(baseClasses, visualClasses)} // Itt egyesítjük az alap és vizuális osztályokat
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content}
    </div>
  );
};

export default Building;