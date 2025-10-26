"use client";

import React from "react";
import Building from "./Building";
import { BuildingOption } from "./BuildMenu";

export interface BuildingData {
  id: string;
  x: number; // rács x koordinátája
  y: number; // rács y koordinátája
  width: number; // rács egységekben
  height: number; // rács egységekben
  type: "house" | "office" | "forestry"; // Új típus
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
}) => {
  const mapWidthPx = gridSize * cellSizePx;
  const mapHeightPx = gridSize * cellSizePx * 1.5;

  const handleMapClickInternal = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPlacingBuilding && ghostBuildingCoords) {
      onMapClick(ghostBuildingCoords.x, ghostBuildingCoords.y);
    }
  };

  return (
    <div
      className="relative border border-gray-300 dark:border-gray-700 bg-green-200 dark:bg-green-800 overflow-hidden"
      style={{ width: mapWidthPx, height: mapHeightPx }}
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
          x={ghostBuildingCoords.x}
          y={ghostBuildingCoords.y}
          width={buildingToPlace.width}
          height={buildingToPlace.height}
          type={buildingToPlace.type as "house" | "office" | "forestry"}
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
    </div>
  );
};

export default Map;