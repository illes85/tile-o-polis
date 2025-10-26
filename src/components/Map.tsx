"use client";

import React from "react";
import Building from "./Building";
import { BuildingOption } from "./BuildMenu"; // Importáljuk a BuildingOption típust

export interface BuildingData {
  id: string;
  x: number; // rács x koordinátája
  y: number; // rács y koordinátája
  width: number; // rács egységekben
  height: number; // rács egységekben
  type: "house"; // vagy más típusok később
  rentalPrice?: number; // Hozzáadva: bérleti díj
  maxResidents: number; // Új: maximális lakók száma
  currentResidents: number; // Új: aktuális lakók száma
  isRentedByPlayer: boolean; // Új: jelzi, ha az aktuális játékos bérelte
  isOwnedByPlayer: boolean; // Új: jelzi, ha az aktuális játékos tulajdonában van
}

interface MapProps {
  buildings: BuildingData[];
  gridSize: number; // pl. 20 a 20x20-as rácshoz
  cellSizePx: number; // pl. 40 pixel
  onBuildingClick: (buildingId: string) => void;
  isPlacingBuilding: boolean; // Új prop
  buildingToPlace: BuildingOption | null; // Új prop
  ghostBuildingCoords: { x: number; y: number } | null; // Új prop
  onMapMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void; // Új prop
  onMapClick: (x: number, y: number) => void; // Új prop
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
          type={buildingToPlace.type as "house"} // Feltételezzük, hogy a típus 'house'
          cellSizePx={cellSizePx}
          onClick={() => {}} // A szellem épület nem kattintható
          currentResidents={0}
          maxResidents={0}
          isRentedByPlayer={false}
          isOwnedByPlayer={true} // A szellem épület a játékos építési szándékát jelzi
          isGhost={true}
        />
      )}
    </div>
  );
};

export default Map;