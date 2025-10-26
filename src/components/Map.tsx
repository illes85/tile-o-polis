"use client";

import React from "react";
import Building from "./Building";

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
}

interface MapProps {
  buildings: BuildingData[];
  gridSize: number; // pl. 20 a 20x20-as rácshoz
  cellSizePx: number; // pl. 40 pixel
  onBuildingClick: (buildingId: string) => void; // Új prop a kattintás kezeléséhez
}

const Map: React.FC<MapProps> = ({ buildings, gridSize, cellSizePx, onBuildingClick }) => {
  const mapWidthPx = gridSize * cellSizePx;
  const mapHeightPx = gridSize * cellSizePx * 1.5; // Kijavítva: cellSize helyett cellSizePx

  return (
    <div
      className="relative border border-gray-300 dark:border-gray-700 bg-green-200 dark:bg-green-800 overflow-hidden"
      style={{ width: mapWidthPx, height: mapHeightPx }}
    >
      {buildings.map((building) => (
        <Building
          key={building.id}
          {...building}
          cellSizePx={cellSizePx}
          onClick={onBuildingClick}
        />
      ))}
    </div>
  );
};

export default Map;