"use client";

import React, { useEffect, useRef, useMemo } from "react";
import Building, { FarmlandTile, CropType } from "./Building";
import { BuildingOption } from "./BuildMenu";
import { Sprout, Route } from "lucide-react";
import tilesetImage from "@/assets/32x32/Tilesets (Modular)/vectoraith_tileset_farmingsims_terrain_A5_summer_32x32.png";

export interface BuildingData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "house" | "office" | "forestry" | "farm" | "farmland" | "road" | "shop" | "mill" | "popcorn_stand";
  rentalPrice?: number;
  salary?: number;
  capacity: number;
  ownerId?: string;
  renterId?: string;
  residentIds: string[];
  employeeIds: string[];
  isUnderConstruction: boolean;
  buildProgress?: number;
  constructionEta?: number; // Építkezés befejezési ideje (timestamp)
  originalDuration?: number; // Eredeti építési időtartam (ms)
  rotation: number;
  farmlandTiles?: FarmlandTile[];
  hasRoadNeighborTop?: boolean;
  hasRoadNeighborBottom?: boolean;
  hasRoadNeighborLeft?: boolean;
  hasRoadNeighborRight?: boolean;
  level?: number; // Hozzáadva a szinthez
  millInventory?: { wheat: number; flour: number }; // Malom készlete
  popcornStandInventory?: { corn: number; popcorn: number }; // ÚJ: Popcorn Árus készlete
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
  isDragging: boolean;
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
  isDragging,
}) => {
  const mapWidthPx = gridSize * cellSizePx;
  const mapHeightPx = gridSize * cellSizePx * 1.5;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Háttér textúra térkép generálása (csak egyszer, vagy ha változik a gridSize)
  const backgroundMap = useMemo(() => {
    const map = [];
    for (let x = 0; x < gridSize; x++) {
      const row = [];
      for (let y = 0; y < gridSize; y++) {
        // Véletlenszerűen választunk a 2. (index 1) és 3. (index 2) csempe közül
        // A 3. csempe (index 2) ritkább legyen (pl. 20% esély)
        const isRare = Math.random() < 0.2;
        row.push(isRare ? 2 : 1);
      }
      map.push(row);
    }
    return map;
  }, [gridSize]);

  // Canvas kirajzolása
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = tilesetImage;
    img.onload = () => {
      // Törlés
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Kirajzolás
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          const tileType = backgroundMap[x][y]; // 1 vagy 2
          // Forrás koordináták a tileset-en (32x32 tile méret feltételezve)
          // Index 1 -> x=32, y=0
          // Index 2 -> x=64, y=0
          const srcX = tileType * 32; 
          const srcY = 0;

          // Cél koordináták a vásznon
          const destX = x * cellSizePx;
          const destY = y * cellSizePx;

          ctx.drawImage(
            img,
            srcX, srcY, 32, 32, // Forrás
            destX, destY, cellSizePx, cellSizePx // Cél
          );
        }
      }
    };
  }, [backgroundMap, gridSize, cellSizePx]);

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
      {/* Háttér Canvas */}
      <canvas
        ref={canvasRef}
        width={mapWidthPx}
        height={mapHeightPx} // Csak a látható területre rajzolunk, vagy a teljes térképre?
        // A mapHeightPx jelenleg 1.5x a grid-nek (scrollozáshoz?), de a grid csak gridSize * cellSizePx
        // Javítsuk a canvas méretét, hogy pontosan fedje a rácsot.
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none", // Ne zavarja az egéreseményeket
          width: mapWidthPx,
          height: mapHeightPx, // Itt marad a container mérete
        }}
      />

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
          constructionEta={tile.constructionEta} // Átadjuk az új prop-ot
          originalDuration={tile.originalDuration} // Átadjuk az új prop-ot
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