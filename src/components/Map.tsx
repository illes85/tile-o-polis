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
}

interface MapProps {
  buildings: BuildingData[];
  gridSize: number; // pl. 20 a 20x20-as rácshoz
  cellSizePx: number; // pl. 40 pixel
}

const Map: React.FC<MapProps> = ({ buildings, gridSize, cellSizePx }) => {
  const mapWidthPx = gridSize * cellSizePx;
  const mapHeightPx = gridSize * cellSizePx;

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
        />
      ))}
    </div>
  );
};

export default Map;