"use client";

import React from "react";
import Building, { FarmlandTile, CropType } from "./Building";
import { BuildingOption } from "./BuildMenu";
import { Sprout, Route } from "lucide-react";

export interface BuildingData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "house" | "office" | "forestry" | "farm" | "farmland" | "road" | "shop" | "mill";
  rentalPrice?: number;
  salary?: number;
  capacity: number;
  ownerId?: string;
  renterId?: string;
  residentIds: string[];
  employeeIds: string[];
  isUnderConstruction: boolean;
  buildProgress?: number;
  rotation: number;
  farmlandTiles?: FarmlandTile[];
  hasRoadNeighborTop?: boolean;
  hasRoadNeighborBottom?: boolean;
  hasRoadNeighborLeft?: boolean;
  hasRoadNeighborRight?: boolean;
  level?: number; // Hozzáadva a szinthez
}

interface MapProps {
  buildings: BuildingData[];
  gridSize: number;
  cellSizePx: number;
  onBuildingClick: (buildingId: string) => void;
  isPlacingBuilding: boolean;
  buildingToPlace: BuildingOption | null;
  ghostBuildingCoords: { x: number; y: number } | null;
  onGridMouseMove: (gridX: number, gridY: number) => void; // Módosítva, hogy ne adja át az eseményt
  onMapClick: (x: number, y: number) => void; // Módosítva, hogy ne adja át az eseményt
  onMapMouseDown: (x: number, y: number) => void; // Új prop
  onMapMouseUp: (x: number, y: number) => void; // Új prop
  currentPlayerId: string;
  currentBuildingRotation: number;
  isPlacingFarmland: boolean;
  selectedFarmId: string | null;
  onFarmlandClick: (farmId: string, x: number, y: number) => void;
  ghostFarmlandTiles: { x: number; y: number }[]; // Új prop a húzott szellem csempékhez
  isPlacingRoad: boolean;
  ghostRoadTiles: { x: number; y: number }[];
  isDemolishingRoad: boolean;
  mapOffsetX: number;
  mapOffsetY: number;
  isPlacementMode: boolean;
}

const Map: React.FC<MapProps> = ({
  buildings,
  gridSize,
  cellSizePx,
  onBuildingClick,
  isPlacingBuilding,
  buildingToPlace,
  ghostBuildingCoords,
  onGridMouseMove,
  onMapClick, // Ezt már nem használjuk közvetlenül a lerakáshoz
  onMapMouseDown, // Új
  onMapMouseUp, // Új
  currentPlayerId,
  currentBuildingRotation,
  isPlacingFarmland,
  selectedFarmId,
  onFarmlandClick,
  ghostFarmlandTiles, // Új
  isPlacingRoad,
  ghostRoadTiles,
  isDemolishingRoad,
  mapOffsetX,
  mapOffsetY,
  isPlacementMode,
}) => {
  const mapWidthPx = gridSize * cellSizePx;
  const mapHeightPx = gridSize * cellSizePx * 1.5;

  const getGridCoordsFromMouseEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    const mapRect = event.currentTarget.getBoundingClientRect();
    const mouseXRelativeToMap = event.clientX - mapRect.left;
    const mouseYRelativeToMap = event.clientY - mapRect.top;

    const gridX = Math.floor((mouseXRelativeToMap - mapOffsetX) / cellSizePx);
    const gridY = Math.floor((mouseYRelativeToMap - mapOffsetY) / cellSizePx);
    return { gridX, gridY };
  };

  const handleMapMouseMoveInternal = (event: React.MouseEvent<HTMLDivElement>) => {
    const { gridX, gridY } = getGridCoordsFromMouseEvent(event);
    onGridMouseMove(gridX, gridY);
  };

  const handleMapMouseDownInternal = (event: React.MouseEvent<HTMLDivElement>) => {
    const { gridX, gridY } = getGridCoordsFromMouseEvent(event);
    onMapMouseDown(gridX, gridY);
  };

  const handleMapMouseUpInternal = (event: React.MouseEvent<HTMLDivElement>) => {
    const { gridX, gridY } = getGridCoordsFromMouseEvent(event);
    onMapMouseUp(gridX, gridY);
  };

  const isRoadAt = (x: number, y: number, currentBuildings: BuildingData[], currentGhostRoadTiles: { x: number; y: number }[]): boolean => {
    return currentBuildings.some(b => b.type === "road" && b.x === x && b.y === y && !b.isUnderConstruction) ||
           currentGhostRoadTiles.some(t => t.x === x && t.y === y);
  };

  const allFarmlandTiles: (FarmlandTile & { farmId: string })[] = [];
  buildings.forEach(b => {
    if (b.type === 'farm' && b.farmlandTiles) {
      b.farmlandTiles.forEach(ft => {
        allFarmlandTiles.push({ ...ft, farmId: b.id });
      });
    }
  });

  const getCursorStyle = () => {
    if (isPlacingBuilding || isPlacingFarmland || isPlacingRoad) {
      return "crosshair";
    }
    if (isDemolishingRoad) {
      return "cell";
    }
    return "default";
  };

  return (
    <div
      className="relative border border-gray-300 dark:border-gray-700 bg-green-200 dark:bg-green-800 overflow-hidden"
      style={{
        width: mapWidthPx,
        height: mapHeightPx,
        transform: `translate(${mapOffsetX}px, ${mapOffsetY}px)`,
        cursor: getCursorStyle(),
      }}
      onMouseMove={handleMapMouseMoveInternal}
      onMouseDown={handleMapMouseDownInternal} // Hozzáadva
      onMouseUp={handleMapMouseUpInternal}     // Hozzáadva
      onClick={(e) => { // Az onMapClick most már csak az egyedi épület lerakásához kell, ha nincs húzás
        if (isPlacingBuilding && buildingToPlace && ghostBuildingCoords && !isDragging) {
          const { gridX, gridY } = getGridCoordsFromMouseEvent(e);
          onMapClick(gridX, gridY);
        }
      }}
    >
      {allFarmlandTiles.map((tile, index) => (
        <Building
          key={`farmland-${tile.farmId}-${tile.x}-${tile.y}`}
          id={`farmland-${tile.farmId}-${tile.x}-${tile.y}`}
          name="Szántóföld"
          x={tile.x}
          y={tile.y}
          width={1}
          height={1}
          type="farmland"
          cellSizePx={cellSizePx}
          onClick={() => onFarmlandClick(tile.farmId, tile.x, tile.y)}
          capacity={0}
          ownerId={tile.ownerId}
          residentIds={[]}
          employeeIds={[]}
          isGhost={false}
          isUnderConstruction={tile.isUnderConstruction}
          buildProgress={tile.buildProgress}
          currentPlayerId={currentPlayerId}
          rotation={0}
          isPlacementMode={isPlacementMode}
          isDemolishingRoad={isDemolishingRoad}
          cropType={tile.cropType}
          cropProgress={tile.cropProgress}
        />
      ))}

      {buildings.map((building) => {
        const commonProps = {
          ...building,
          cellSizePx: cellSizePx,
          onClick: onBuildingClick,
          currentPlayerId: currentPlayerId,
          isPlacementMode: isPlacementMode,
          isDemolishingRoad: isDemolishingRoad,
        };

        if (building.type === "road") {
          return (
            <Building
              key={building.id}
              {...commonProps}
              hasRoadNeighborTop={isRoadAt(building.x, building.y - 1, buildings, ghostRoadTiles)}
              hasRoadNeighborBottom={isRoadAt(building.x, building.y + 1, buildings, ghostRoadTiles)}
              hasRoadNeighborLeft={isRoadAt(building.x - 1, building.y, buildings, ghostRoadTiles)}
              hasRoadNeighborRight={isRoadAt(building.x + 1, building.y, buildings, ghostRoadTiles)}
            />
          );
        }
        
        return <Building key={building.id} {...commonProps} />;
      })}
      
      {isPlacingBuilding && buildingToPlace && ghostBuildingCoords && (
        <Building
          id="ghost-building"
          key="ghost-building"
          name={buildingToPlace.name}
          x={ghostBuildingCoords.x}
          y={ghostBuildingCoords.y}
          width={buildingToPlace.width}
          height={buildingToPlace.height}
          type={buildingToPlace.type as any}
          cellSizePx={cellSizePx}
          onClick={() => {}}
          capacity={buildingToPlace.capacity}
          ownerId={currentPlayerId}
          residentIds={[]}
          employeeIds={[]}
          isGhost={true}
          isUnderConstruction={false}
          buildProgress={0}
          currentPlayerId={currentPlayerId}
          rotation={currentBuildingRotation}
          isPlacementMode={isPlacementMode}
          isDemolishingRoad={isDemolishingRoad}
        />
      )}
      {isPlacingFarmland && selectedFarmId && ghostBuildingCoords && (
        // Ha húzunk, akkor a draggedTiles alapján rajzoljuk a szellem csempéket
        ghostFarmlandTiles.map((tile, index) => (
          <Building
            id={`ghost-farmland-${index}`}
            key={`ghost-farmland-${index}`}
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
            isDemolishingRoad={isDemolishingRoad}
            cropType={CropType.None}
            cropProgress={0}
          />
        ))
      )}
    </div>
  );
};

export default Map;