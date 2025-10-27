"use client";

import React from "react";
import Building, { FarmlandTile } from "./Building"; // Importáljuk a FarmlandTile interfészt
import { BuildingOption } from "./BuildMenu";
import { Sprout, Route } from "lucide-react"; // Importáljuk a Sprout és Route ikonokat

export interface BuildingData {
  id: string;
  name: string; // Új: épület neve
  x: number; // rács x koordinátája
  y: number; // rács y koordinátája
  width: number; // rács egységekben
  height: number; // rács egységekben
  type: "house" | "office" | "forestry" | "farm" | "farmland" | "road"; // Új típus: farmland és road
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
  // Új propok az út csempékhez
  hasRoadNeighborTop?: boolean;
  hasRoadNeighborBottom?: boolean;
  hasRoadNeighborLeft?: boolean;
  hasRoadNeighborRight?: boolean;
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
  isPlacingRoad: boolean; // Új: útépítés mód
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
  isPlacingRoad, // Hozzáadva
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
    } else if (isPlacingRoad && ghostBuildingCoords) { // Új: útépítés mód
      onMapClick(ghostBuildingCoords.x, ghostBuildingCoords.y);
    }
  };

  const isRoadAt = (x: number, y: number) => {
    return buildings.some(b => b.type === "road" && b.x === x && b.y === y && !b.isUnderConstruction && !b.isGhost);
  };

  return (
    <div
      className="relative border border-gray-300 dark:border-gray-700 bg-green-200 dark:bg-green-800 overflow-hidden"
      style={{
        width: mapWidthPx,
        height: mapHeightPx,
        transform: `translate(${mapOffsetX}px, ${mapOffsetY}px)`, // Térkép eltolása
        cursor: isPlacingBuilding || isPlacingFarmland || isPlacingRoad ? "crosshair" : "grab", // Kurzor változtatása
      }}
      onMouseMove={onMapMouseMove}
      onClick={handleMapClickInternal}
    >
      {buildings.map((building) => {
        const commonProps = {
          key: building.id,
          ...building,
          cellSizePx: cellSizePx,
          onClick: onBuildingClick,
          currentPlayerId: currentPlayerId,
        };

        if (building.type === "road") {
          return (
            <Building
              {...commonProps}
              hasRoadNeighborTop={isRoadAt(building.x, building.y - 1)}
              hasRoadNeighborBottom={isRoadAt(building.x, building.y + 1)}
              hasRoadNeighborLeft={isRoadAt(building.x - 1, building.y)}
              hasRoadNeighborRight={isRoadAt(building.x + 1, building.y)}
            />
          );
        }
        return <Building {...commonProps} />;
      })}
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
      {isPlacingRoad && ghostBuildingCoords && ( // Új: szellem út csempe
        <Building
          id="ghost-road"
          name="Út"
          x={ghostBuildingCoords.x}
          y={ghostBuildingCoords.y}
          width={1}
          height={1}
          type="road"
          cellSizePx={cellSizePx}
          onClick={() => {}}
          capacity={0}
          ownerId={currentPlayerId}
          residentIds={[]}
          employeeIds={[]}
          isGhost={true}
          isUnderConstruction={false}
          buildProgress={0}
          currentPlayerId={currentPlayerId}
          rotation={0}
          hasRoadNeighborTop={isRoadAt(ghostBuildingCoords.x, ghostBuildingCoords.y - 1)}
          hasRoadNeighborBottom={isRoadAt(ghostBuildingCoords.x, ghostBuildingCoords.y + 1)}
          hasRoadNeighborLeft={isRoadAt(ghostBuildingCoords.x - 1, ghostBuildingCoords.y)}
          hasRoadNeighborRight={isRoadAt(ghostBuildingCoords.x + 1, ghostBuildingCoords.y)}
        />
      )}
    </div>
  );
};

export default Map;