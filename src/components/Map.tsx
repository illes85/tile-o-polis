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
  type: "house" | "office" | "forestry" | "farm" | "farmland" | "road" | "shop"; // Új típus: farmland, road és shop
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
  ghostBuildingCoords: { x: number; y: number } | null; // Rács koordináták
  onMapMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onGridMouseMove: (gridX: number, gridY: number, event: React.MouseEvent<HTMLDivElement>) => void; // ÚJ: rács koordináták visszaküldése
  onMapClick: (x: number, y: number) => void; // Rács koordinátákat fogad
  currentPlayerId: string; // Új prop
  currentBuildingRotation: number; // Új prop a szellem épület forgatásához
  isPlacingFarmland: boolean; // Új: szántóföld építési mód
  selectedFarmId: string | null; // Új: a kiválasztott farm ID-ja
  onFarmlandClick: (farmId: string, x: number, y: number) => void; // Új: szántóföld kattintás kezelő
  ghostFarmlandTiles: { x: number; y: number }[]; // Új: szellem szántóföld csempék
  isPlacingRoad: boolean; // Új: útépítés mód
  ghostRoadTiles: { x: number; y: number }[]; // Új: szellem út csempék
  isDemolishingRoad: boolean; // Új: út bontási mód
  mapOffsetX: number; // Új: térkép eltolás X irányban
  mapOffsetY: number; // Új: térkép eltolás Y irányban
  isPlacementMode: boolean; // Új: jelzi, ha a játékos éppen építési módban van
  onMapMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void; // Új: egér lenyomás esemény
  onMapMouseUp: (event: React.MouseEvent<HTMLDivElement>) => void;   // Új: egér felengedés esemény
  onMapMouseLeave: (event: React.MouseEvent<HTMLDivElement>) => void; // Új: egér elhagyja az elemet esemény
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
  onGridMouseMove, // Hozzáadva
  onMapClick,
  currentPlayerId,
  currentBuildingRotation,
  isPlacingFarmland,
  selectedFarmId,
  onFarmlandClick,
  ghostFarmlandTiles,
  isPlacingRoad,
  ghostRoadTiles,
  isDemolishingRoad, // Hozzáadva
  mapOffsetX,
  mapOffsetY,
  isPlacementMode,
  onMapMouseDown,
  onMapMouseUp,
  onMapMouseLeave,
}) => {
  const mapWidthPx = gridSize * cellSizePx;
  const mapHeightPx = gridSize * cellSizePx * 1.5;

  const handleMapMouseMoveInternal = (event: React.MouseEvent<HTMLDivElement>) => {
    onMapMouseMove(event); // Továbbítjuk a Game.tsx-nek a húzáshoz

    const mapRect = event.currentTarget.getBoundingClientRect();
    const mouseXRelativeToMap = event.clientX - mapRect.left;
    const mouseYRelativeToMap = event.clientY - mapRect.top;

    // A rács koordináták kiszámítása, figyelembe véve az eltolást
    const gridX = Math.floor((mouseXRelativeToMap - mapOffsetX) / cellSizePx);
    const gridY = Math.floor((mouseYRelativeToMap - mapOffsetY) / cellSizePx);

    // Visszaküldjük a pontos rács koordinátákat a Game.tsx-nek
    onGridMouseMove(gridX, gridY, event);
  };

  const handleMapClickInternal = (event: React.MouseEvent<HTMLDivElement>) => {
    const mapRect = event.currentTarget.getBoundingClientRect();
    const mouseXRelativeToMap = event.clientX - mapRect.left;
    const mouseYRelativeToMap = event.clientY - mapRect.top;

    // A kattintáskor a rács koordinátáit kell kiszámolni, figyelembe véve az eltolást
    const gridX = Math.floor((mouseXRelativeToMap - mapOffsetX) / cellSizePx);
    const gridY = Math.floor((mouseYRelativeToMap - mapOffsetY) / cellSizePx);

    if (isPlacingBuilding && ghostBuildingCoords) {
      onMapClick(gridX, gridY); // Átadjuk a rács koordinátákat
    } else if (isPlacingFarmland && selectedFarmId && ghostBuildingCoords && ghostFarmlandTiles.length === 0) {
      onMapClick(gridX, gridY); // Átadjuk a rács koordinátákat
    } else if (isPlacingRoad && ghostBuildingCoords && ghostRoadTiles.length === 0) {
      onMapClick(gridX, gridY); // Átadjuk a rács koordinátákat
    } else if (isDemolishingRoad) { // Új: bontási mód
      onMapClick(gridX, gridY); // Átadjuk a rács koordinátákat
    }
  };

  const isRoadAt = (x: number, y: number, currentBuildings: BuildingData[], currentGhostRoadTiles: { x: number; y: number }[]): boolean => {
    return currentBuildings.some(b => b.type === "road" && b.x === x && b.y === y && !b.isUnderConstruction && !b.isGhost) ||
           currentGhostRoadTiles.some(t => t.x === x && t.y === y);
  };

  const isFarmlandAt = (x: number, y: number, currentBuildings: BuildingData[], currentGhostFarmlandTiles: { x: number; y: number }[], farmId: string | null): boolean => {
    const targetFarm = currentBuildings.find(b => b.id === farmId);
    if (targetFarm && targetFarm.farmlandTiles) {
      if (targetFarm.farmlandTiles.some(ft => ft.x === x && ft.y === y && !ft.isUnderConstruction)) return true;
    }
    return currentGhostFarmlandTiles.some(t => t.x === x && t.y === y);
  };

  const getCursorStyle = () => {
    if (isPlacingBuilding || isPlacingFarmland || isPlacingRoad) {
      return "crosshair";
    }
    if (isDemolishingRoad) {
      return "url('/public/demolish_cursor.png'), cell"; // Egyedi bontó kurzor, ha van
    }
    return "grab";
  };

  return (
    <div
      className="relative border border-gray-300 dark:border-gray-700 bg-green-200 dark:bg-green-800 overflow-hidden"
      style={{
        width: mapWidthPx,
        height: mapHeightPx,
        transform: `translate(${mapOffsetX}px, ${mapOffsetY}px)`, // Térkép eltolása
        cursor: getCursorStyle(), // Kurzor változtatása
      }}
      onMouseMove={handleMapMouseMoveInternal} // Belső kezelő használata
      onClick={handleMapClickInternal}
      onMouseDown={onMapMouseDown}
      onMouseUp={onMapMouseUp}
      onMouseLeave={onMapMouseLeave}
    >
      {buildings.map((building) => {
        const commonProps = {
          key={building.id}
          ...building,
          cellSizePx: cellSizePx,
          onClick: onBuildingClick,
          currentPlayerId: currentPlayerId,
          isPlacementMode: isPlacementMode,
          isDemolishingRoad: isDemolishingRoad, // Átadjuk a bontási módot
        };

        if (building.type === "road") {
          return (
            <Building
              {...commonProps}
              hasRoadNeighborTop={isRoadAt(building.x, building.y - 1, buildings, ghostRoadTiles)}
              hasRoadNeighborBottom={isRoadAt(building.x, building.y + 1, buildings, ghostRoadTiles)}
              hasRoadNeighborLeft={isRoadAt(building.x - 1, building.y, buildings, ghostRoadTiles)}
              hasRoadNeighborRight={isRoadAt(building.x + 1, building.y, buildings, ghostRoadTiles)}
            />
          );
        }
        return <Building {...commonProps} />;
      })}
      {isPlacingBuilding && buildingToPlace && ghostBuildingCoords && (
        <Building
          id="ghost-building"
          name={buildingToPlace.name}
          x={ghostBuildingCoords.x}
          y={ghostBuildingCoords.y}
          width={buildingToPlace.width}
          height={buildingToPlace.height}
          type={buildingToPlace.type as "house" | "office" | "forestry" | "farm" | "shop"}
          cellSizePx={cellSizePx}
          onClick={() => {}}
          capacity={buildingToPlace.capacity}
          ownerId={currentPlayerId}
          renterId={undefined}
          residentIds={[]}
          employeeIds={[]}
          isGhost={true}
          isUnderConstruction={false}
          buildProgress={0}
          currentPlayerId={currentPlayerId}
          rotation={currentBuildingRotation}
          isPlacementMode={isPlacementMode}
          isDemolishingRoad={isDemolishingRoad} // Átadjuk a bontási módot
        />
      )}
      {isPlacingFarmland && selectedFarmId && ghostFarmlandTiles.map((tile, index) => (
        <Building
          key={`ghost-farmland-${index}`}
          id={`ghost-farmland-${index}`}
          name="Szántóföld"
          x={tile.x}
          y={tile.y}
          width={1}
          height={1}
          type="farmland"
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
          isPlacementMode={isPlacementMode}
          isDemolishingRoad={isDemolishingRoad} // Átadjuk a bontási módot
        />
      ))}
      {isPlacingFarmland && selectedFarmId && !ghostFarmlandTiles.length && ghostBuildingCoords && (
        <Building
          id="ghost-farmland-single"
          name="Szántóföld"
          x={ghostBuildingCoords.x}
          y={ghostBuildingCoords.y}
          width={1}
          height={1}
          type="farmland"
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
          isPlacementMode={isPlacementMode}
          isDemolishingRoad={isDemolishingRoad} // Átadjuk a bontási módot
        />
      )}
      {isPlacingRoad && ghostRoadTiles.map((tile, index) => (
        <Building
          key={`ghost-road-${index}`}
          id={`ghost-road-${index}`}
          name="Út"
          x={tile.x}
          y={tile.y}
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
          hasRoadNeighborTop={isRoadAt(tile.x, tile.y - 1, buildings, ghostRoadTiles)}
          hasRoadNeighborBottom={isRoadAt(tile.x, tile.y + 1, buildings, ghostRoadTiles)}
          hasRoadNeighborLeft={isRoadAt(tile.x - 1, tile.y, buildings, ghostRoadTiles)}
          hasRoadNeighborRight={isRoadAt(tile.x + 1, tile.y, buildings, ghostRoadTiles)}
          isPlacementMode={isPlacementMode}
          isDemolishingRoad={isDemolishingRoad} // Átadjuk a bontási módot
        />
      ))}
      {isPlacingRoad && !ghostRoadTiles.length && ghostBuildingCoords && (
        <Building
          id="ghost-road-single"
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
          hasRoadNeighborTop={isRoadAt(ghostBuildingCoords.x, ghostBuildingCoords.y - 1, buildings, ghostRoadTiles)}
          hasRoadNeighborBottom={isRoadAt(ghostBuildingCoords.x, ghostBuildingCoords.y + 1, buildings, ghostRoadTiles)}
          hasRoadNeighborLeft={isRoadAt(ghostBuildingCoords.x - 1, ghostBuildingCoords.y, buildings, ghostRoadTiles)}
          hasRoadNeighborRight={isRoadAt(ghostBuildingCoords.x + 1, ghostBuildingCoords.y, buildings, ghostRoadTiles)}
          isPlacementMode={isPlacementMode}
          isDemolishingRoad={isDemolishingRoad} // Átadjuk a bontási módot
        />
      )}
    </div>
  );
};

export default Map;