"use client";

import React from "react";
import Building, { FarmlandTile } from "./Building"; // Importáljuk a FarmlandTile interfészt
import { BuildingOption } from "./BuildMenu";
import { Sprout } from "lucide-react"; // Importáljuk a Sprout ikont

export interface BuildingData {
  id: string;
  name: string; // Új: épület neve
  x: number; // rács x koordinátája
  y: number; // rács y koordinátája
  width: number; // rács egységekben
  height: number; // rács egységekben
  type: "house" | "office" | "forestry" | "farm" | "farmland"; // Új típus
  rentalPrice?: number; // Hozzáadva: bérleti díj (házakhoz)
  salary?: number; // Új: fizetés (irodákhoz)
  capacity: number; // Max lakók/dolgozók száma
  ownerId?: string; // Új: tulajdonos ID-ja
  renterId?: string; // Új: bérlő ID-ja (házakhoz)
  residentIds: string[]; // Új: lakók ID-i (házakhoz)
  employeeIds: string[]; // Új: dolgozók ID-i (irodákhoz)
  isUnderConstruction: boolean; // Új: jelzi, ha építés alatt áll
  buildProgress?: number; // Új: építési folyamat (0-100)
  rotation: number; // Új: forgatás szöge (0, 90, 180, 270)
  farmlandTiles?: FarmlandTile[]; // Új: szántóföld csempék (csak farmokhoz)
}

interface MapProps {
  buildings: BuildingData[];
  gridSize: number; // pl. 20 a 20x20-as rácshoz
  cellSizePx: number; // pl. 40 pixel
  onBuildingClick: (buildingId: string) => void;
  isPlacingBuilding: boolean;
  buildingToPlace: BuildingOption | null;
  ghostBuildingCoords: { x: number; y: number } | null;
  onMapMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMapClick: (x: number, y: number) => void;
  currentPlayerId: string; // Új prop
  currentBuildingRotation: number; // Új prop a szellem épület forgatásához
  isPlacingFarmland: boolean; // Új: szántóföld építési mód
  selectedFarmId: string | null; // Új: a kiválasztott farm ID-ja
  onFarmlandClick: (farmId: string, x: number, y: number) => void; // Új: szántóföld kattintás kezelő
  mapOffsetX: number; // Új: térkép eltolás X irányban
  mapOffsetY: number; // Új: térkép eltolás Y irányban
}

const Map: React.FC<MapProps> = ({
  buildings,
  gridSize,
  cellSizePx,
  onBuildingClick,
  isPlacingBuilding,
  buildingToPlace,
  ghostBuildingCoords,
  onMapMouseMove,
  onMapClick,
  currentPlayerId,
  currentBuildingRotation,
  isPlacingFarmland,
  selectedFarmId,
  onFarmlandClick,
  mapOffsetX, // Hozzáadva
  mapOffsetY, // Hozzáadva
}) => {
  const mapWidthPx = gridSize * cellSizePx;
  const mapHeightPx = gridSize * cellSizePx * 1.5;

  const handleMapClickInternal = (event: React.MouseEvent<HTMLDivElement>) => {
    const mapRect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - mapRect.left;
    const mouseY = event.clientY - mapRect.top;

    // Figyelembe vesszük az eltolást a rács koordinátáinak kiszámításakor
    const gridX = Math.floor((mouseX - mapOffsetX) / cellSizePx);
    const gridY = Math.floor((mouseY - mapOffsetY) / cellSizePx);

    if (isPlacingBuilding && ghostBuildingCoords) {
      onMapClick(ghostBuildingCoords.x, ghostBuildingCoords.y);
    } else if (isPlacingFarmland && selectedFarmId) {
      const selectedFarm = buildings.find(b => b.id === selectedFarmId);
      if (selectedFarm) {
        const effectiveFarmWidth = (selectedFarm.rotation === 90 || selectedFarm.rotation === 270) ? selectedFarm.height : selectedFarm.width;
        const effectiveFarmHeight = (selectedFarm.rotation === 90 || selectedFarm.rotation === 270) ? selectedFarm.width : selectedFarm.height;

        // Ellenőrizzük, hogy a kattintás a farmon belül történt-e
        if (
          gridX >= selectedFarm.x &&
          gridX < selectedFarm.x + effectiveFarmWidth &&
          gridY >= selectedFarm.y &&
          gridY < selectedFarm.y + effectiveFarmHeight
        ) {
          onFarmlandClick(selectedFarmId, gridX, gridY);
        }
      }
    }
  };

  return (
    <div
      className="relative border border-gray-300 dark:border-gray-700 bg-green-200 dark:bg-green-800 overflow-hidden"
      style={{
        width: mapWidthPx,
        height: mapHeightPx,
        transform: `translate(${mapOffsetX}px, ${mapOffsetY}px)`, // Térkép eltolása
        cursor: isPlacingBuilding || isPlacingFarmland ? "crosshair" : "grab", // Kurzor változtatása
      }}
      onMouseMove={onMapMouseMove}
      onClick={handleMapClickInternal}
    >
      {buildings.map((building) => (
        <Building
          key={building.id}
          {...building}
          cellSizePx={cellSizePx}
          onClick={onBuildingClick}
          currentPlayerId={currentPlayerId} // Átadjuk az aktuális játékos ID-ját
        />
      ))}
      {isPlacingBuilding && buildingToPlace && ghostBuildingCoords && (
        <Building
          id="ghost-building"
          name={buildingToPlace.name} // Átadjuk a nevet a szellem épületnek
          x={ghostBuildingCoords.x}
          y={ghostBuildingCoords.y}
          width={buildingToPlace.width}
          height={buildingToPlace.height}
          type={buildingToPlace.type as "house" | "office" | "forestry" | "farm"}
          cellSizePx={cellSizePx}
          onClick={() => {}}
          capacity={buildingToPlace.capacity}
          ownerId={currentPlayerId} // A szellem épület a játékos építési szándékát jelzi
          renterId={undefined}
          residentIds={[]} // Szellem épületnek nincsenek lakói
          employeeIds={[]} // Szellem épületnek nincsenek dolgozói
          isGhost={true}
          isUnderConstruction={false} // A szellem épület nem építés alatt áll
          buildProgress={0}
          currentPlayerId={currentPlayerId}
          rotation={currentBuildingRotation} // Átadjuk a forgatást a szellem épületnek
        />
      )}
      {isPlacingFarmland && selectedFarmId && ghostBuildingCoords && (
        <div
          className="absolute bg-yellow-800/50 border border-yellow-900 opacity-70 pointer-events-none"
          style={{
            left: ghostBuildingCoords.x * cellSizePx,
            top: ghostBuildingCoords.y * cellSizePx,
            width: cellSizePx,
            height: cellSizePx,
          }}
        >
          <Sprout className="h-full w-full text-green-300 p-1" />
        </div>
      )}
    </div>
  );
};

export default Map;