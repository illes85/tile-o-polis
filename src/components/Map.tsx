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
  type: "house" | "office"; // Új típus
  rentalPrice?: number; // Hozzáadva: bérleti díj (házakhoz)
  salary?: number; // Új: fizetés (irodákhoz)
  capacity: number; // Max lakók/dolgozók száma
  occupancy: number; // Aktuális lakók/dolgozók száma
  isRentedByPlayer: boolean; // Jelzi, ha az aktuális játékos bérelte (házakhoz)
  isOwnedByPlayer: boolean; // Jelzi, ha az aktuális játékos tulajdonában van
  isUnderConstruction: boolean; // Új: jelzi, ha építés alatt áll
  buildProgress?: number; // Új: építési folyamat (0-100)
  isPlayerEmployedHere: boolean; // Új: jelzi, ha a játékos itt dolgozik (irodákhoz)
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
        />
      ))}
      {isPlacingBuilding && buildingToPlace && ghostBuildingCoords && (
        <Building
          id="ghost-building"
          x={ghostBuildingCoords.x}
          y={ghostBuildingCoords.y}
          width={buildingToPlace.width}
          height={buildingToPlace.height}
          type={buildingToPlace.type as "house" | "office"}
          cellSizePx={cellSizePx}
          onClick={() => {}}
          occupancy={0}
          capacity={buildingToPlace.capacity}
          isRentedByPlayer={false}
          isOwnedByPlayer={true}
          isGhost={true}
          isUnderConstruction={false} // A szellem épület nem építés alatt áll
          buildProgress={0}
          isPlayerEmployedHere={false}
        />
      )}
    </div>
  );
};

export default Map;