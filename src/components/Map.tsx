"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import { BuildingData, FarmlandTile, CropType } from "@/types/gameTypes";
import Building from "./Building";
import { BuildingOption } from "./BuildMenu";
import { Sprout, Route } from "lucide-react";
import tilesetImage from "@/assets/vectoraith_tileset_farming_sim_essentials/32x32/Tilesets (Modular)/vectoraith_tileset_farmingsims_terrain_A5_summer_32x32.png";
import farmerSprite from "@/assets/vectoraith_tileset_farming_sim_essentials/32x32/Sprites/$farmer_32x32.png";
import detailsImage from "@/assets/vectoraith_tileset_farming_sim_essentials/32x32/Tilesets (Modular)/vectoraith_tileset_farmingsims_details_summer_32x32.png";

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
  trees: { x: number; y: number }[];
  stumps?: { x: number; y: number }[];
  stones?: { x: number; y: number; stoneQuantity?: number }[]; // Új prop a kövekhez
  playerAvatars?: { id: string; name: string; x: number; y: number; renderX?: number; renderY?: number; dir: "down" | "left" | "right" | "up"; frame: number }[];
  isSelectingTree?: boolean;
  isSelectingStone?: boolean; // Új prop kő kiválasztáshoz
  isTreeChoppingMode: boolean; // Updated to be non-optional
  isStoneMiningMode: boolean; // Updated to be non-optional
  treeChopProgress?: number;
  stoneMineProgress?: number; // Új prop kőbányászat folyamathoz
  activeChopTree?: { x: number; y: number } | null;
  activeMineStone?: { x: number; y: number } | null; // Új prop aktív kőhöz
  avatarSize?: number;
  axeAnimation?: { x: number; y: number; active: boolean } | null;
  pickaxeAnimation?: { x: number; y: number; active: boolean } | null; // Új prop csákány animációhoz
  shopInventories?: Record<string, any[]>; // Shop inventory data
  bankConfigs?: Record<string, { interestRate: number; maxLoanAmount: number }>; // Bank configs
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
  trees,
  stumps = [],
  stones = [], // Új
  playerAvatars,
  isSelectingTree,
  isSelectingStone, // Új
  isTreeChoppingMode,
  isStoneMiningMode, // Új
  treeChopProgress = 0,
  stoneMineProgress = 0, // Új
  activeChopTree,
  activeMineStone, // Új
  avatarSize = 100,
  axeAnimation,
  pickaxeAnimation, // Új
  shopInventories = {},
  bankConfigs = {},
}) => {
  const mapWidthPx = gridSize * cellSizePx;
  const mapHeightPx = gridSize * cellSizePx * 1.5;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const occupiedCells = useMemo(() => {
    const occ = new Set<string>();
    buildings.forEach(b => {
      const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
      const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          occ.add(`${b.x + dx},${b.y + dy}`);
        }
      }
      if (b.farmlandTiles) {
        b.farmlandTiles.forEach(ft => occ.add(`${ft.x},${ft.y}`));
      }
    });
    return occ;
  }, [buildings]);

  const treePositions = trees;

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

    const terrainImg = new Image();
    terrainImg.src = tilesetImage;
    const detailsImg = new Image();
    detailsImg.src = detailsImage;

    const drawAll = () => {
      if (!terrainImg.complete || !detailsImg.complete) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          const tileType = backgroundMap[x][y];
          const srcX = tileType * 32;
          const srcY = 0;
          const destX = x * cellSizePx;
          const destY = y * cellSizePx;
          ctx.drawImage(terrainImg, srcX, srcY, 32, 32, destX, destY, cellSizePx, cellSizePx);
        }
      }
      
      // Tönkök kirajzolása
      // A felhasználó szerint: 4. oszlop (index 3), 6. sor (index 5)
      const STUMP_SRC_X = 3 * 32; 
      const STUMP_SRC_Y = 5 * 32;
      
      stumps.forEach(s => {
        const destX = s.x * cellSizePx;
        const destY = s.y * cellSizePx;
        ctx.drawImage(detailsImg, STUMP_SRC_X, STUMP_SRC_Y, 32, 32, destX, destY, cellSizePx, cellSizePx);
      });

      // Kövek kirajzolása
      // A felhasználó szerint: 2-3. oszlop (index 1-2), 5-6. sor (index 4-5) -> 2x2 blokk
      const STONE_SRC_X = 1 * 32;
      const STONE_SRC_Y = 4 * 32;

      stones.forEach(s => {
        const qty = s.stoneQuantity !== undefined ? s.stoneQuantity : 100;
        const scale = Math.max(0.3, qty / 100); // Minimum 30% size, max 100%
        
        const size = cellSizePx * 2 * scale;
        const offset = (cellSizePx * 2 - size) / 2; // Center it

        const destX = s.x * cellSizePx + offset;
        const destY = s.y * cellSizePx + offset;
        
        // 2x2-es méret (64x64 forrás, 2x cella cél, skálázva)
        ctx.drawImage(detailsImg, STONE_SRC_X, STONE_SRC_Y, 64, 64, destX, destY, size, size);
      });

      const TREE_SRC_X = 32 * 1;
      const TREE_SRC_Y = 32 * 6;
      treePositions.forEach(pos => {
        const destX = pos.x * cellSizePx;
        const destY = pos.y * cellSizePx;
        ctx.drawImage(detailsImg, TREE_SRC_X, TREE_SRC_Y, 32 * 3, 32 * 3, destX, destY, cellSizePx * 3, cellSizePx * 3);
      });

      if (isTreeChoppingMode && treeChopProgress > 0 && activeChopTree) {
        const progressBarX = activeChopTree.x * cellSizePx;
        const progressBarY = activeChopTree.y * cellSizePx;
        
        // Draw background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(progressBarX + cellSizePx * 0.5, progressBarY + cellSizePx * 1.5, cellSizePx * 2, 8);
        
        // Draw progress
        ctx.fillStyle = '#00cc00';
        ctx.fillRect(progressBarX + cellSizePx * 0.5, progressBarY + cellSizePx * 1.5, (cellSizePx * 2) * (treeChopProgress / 100), 8);
        
        // Draw border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(progressBarX + cellSizePx * 0.5, progressBarY + cellSizePx * 1.5, cellSizePx * 2, 8);
      }

      if (isStoneMiningMode && stoneMineProgress > 0 && activeMineStone) {
        const progressBarX = activeMineStone.x * cellSizePx;
        const progressBarY = activeMineStone.y * cellSizePx;
        
        // Draw background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(progressBarX, progressBarY - 10, cellSizePx, 6);
        
        // Draw progress
        ctx.fillStyle = '#888888'; // Grey for stone
        ctx.fillRect(progressBarX, progressBarY - 10, cellSizePx * (stoneMineProgress / 100), 6);
        
        // Draw border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(progressBarX, progressBarY - 10, cellSizePx, 6);
      }
    };
    terrainImg.onload = drawAll;
    detailsImg.onload = drawAll;
    if (terrainImg.complete && detailsImg.complete) drawAll();
  }, [backgroundMap, gridSize, cellSizePx, treePositions, stumps, stones, isTreeChoppingMode, treeChopProgress, activeChopTree, isStoneMiningMode, stoneMineProgress, activeMineStone]);

  const getGridCoordsFromMouseEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    const mapRect = event.currentTarget.getBoundingClientRect();
    const mouseXRelativeToMap = event.clientX - mapRect.left;
    const mouseYRelativeToMap = event.clientY - mapRect.top;

    const gridX = Math.floor((mouseXRelativeToMap - mapOffsetX) / cellSizePx);
    const gridY = Math.floor((mouseYRelativeToMap - mapOffsetY) / cellSizePx);
    return { gridX, gridY };
  };

  const [hoveredAsset, setHoveredAsset] = useState<{ x: number; y: number; name: string; quantity: React.ReactNode } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMapMouseMoveInternal = (event: React.MouseEvent<HTMLDivElement>) => {
    const { gridX, gridY } = getGridCoordsFromMouseEvent(event);
    onGridMouseMove(gridX, gridY);

    const mapRect = event.currentTarget.getBoundingClientRect();
    setMousePos({ x: event.clientX - mapRect.left, y: event.clientY - mapRect.top });

    let found = null;

    // Check trees (3x3)
    for (const t of trees) {
      if (gridX >= t.x && gridX < t.x + 3 && gridY >= t.y && gridY < t.y + 3) {
        found = { x: t.x, y: t.y, name: "Fa", quantity: "12 egység" };
        break;
      }
    }

    // Check stones (2x2)
    if (!found) {
      for (const s of stones) {
        if (gridX >= s.x && gridX < s.x + 2 && gridY >= s.y && gridY < s.y + 2) {
          found = { x: s.x, y: s.y, name: "Kő", quantity: `${s.stoneQuantity ?? 100} egység` };
          break;
        }
      }
    }

    // Check buildings and farmlands
    if (!found) {
      for (const b of buildings) {
        // Check farmland tiles first (more specific)
        if (b.farmlandTiles) {
           const ft = b.farmlandTiles.find(t => t.x === gridX && t.y === gridY);
           if (ft) {
              let name = "Szántóföld";
              let info: React.ReactNode = "Üres";
              if (ft.cropType && ft.cropType !== "none") {
                 const cropNames: Record<string, string> = { "wheat": "Búza", "corn": "Kukorica", "none": "Nincs" };
                 name = cropNames[ft.cropType] || ft.cropType;
                 
                 if (ft.isUnderConstruction) {
                     info = "Művelés alatt...";
                 } else {
                     const progress = Math.floor(ft.cropProgress || 0);
                     info = `Érettség: ${progress}%`;
                     if (progress >= 100) info = "Aratható!";
                 }
              }
              found = { x: gridX, y: gridY, name, quantity: info };
              break;
           }
        }

        // Check main building body
        const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
        const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
        if (gridX >= b.x && gridX < b.x + w && gridY >= b.y && gridY < b.y + h) {
           let info: React.ReactNode = "";
           if (b.isUnderConstruction) {
             info = `Építés alatt (${Math.floor(b.buildProgress || 0)}%)`;
           } else {
             if (b.type === 'mill') {
               info = `Liszt: ${b.millInventory?.flour || 0}, Búza: ${b.millInventory?.wheat || 0}`;
             } else if (b.type === 'popcorn_stand') {
               info = `Popcorn: ${b.popcornStandInventory?.popcorn || 0}`;
             } else if (b.type === 'house') {
                info = `Lakók: ${b.residentIds.length}/${b.capacity}`;
             } else if (b.type === 'shop') {
                const items = shopInventories[b.id] || [];
                // Check if any item has stock > 0
                const hasStock = items.some((item: any) => item.stock > 0);
                
                info = (
                    <div className="flex flex-col gap-0.5 mt-1">
                        <div className="font-bold underline mb-0.5">Kínálat:</div>
                        {items.length > 0 ? (
                            items.map((item: any, idx: number) => (
                                <div key={idx} className={item.stock === 0 ? "line-through text-gray-400" : ""}>
                                    {item.name}: {item.sellPrice} Ft ({item.stock} db)
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-400 italic">Jelenleg nincs áru.</div>
                        )}
                        <div className="mt-1 text-xs text-gray-300">Dolgozók: {b.employeeIds.length}/{b.capacity}</div>
                    </div>
                );
             } else if (b.type === 'bank') {
                const config = bankConfigs[b.id];
                info = (
                  <div className="flex flex-col gap-0.5 mt-1">
                     <div className="font-bold">Bank Információk:</div>
                     <div>Kamatláb: {config?.interestRate ?? 20}%</div>
                     <div>Max Hitel: {config?.maxLoanAmount ?? 10000} Ft</div>
                     <div className="mt-1 text-xs text-gray-300">Dolgozók: {b.employeeIds.length}/{b.capacity}</div>
                  </div>
                );
             } else if (b.type === 'office' || b.type === 'forestry' || b.type === 'farm') {
                info = `Dolgozók: ${b.employeeIds.length}/${b.capacity}`;
             }
           }
           found = { x: b.x, y: b.y, name: `${b.name} (#${b.houseNumber})`, quantity: info };
           break;
        }
      }
    }

    setHoveredAsset(found);
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
    if (isPlacingBuilding) {
      return "none";
    }
    if (isPlacingFarmland || isPlacingRoad) {
      return "crosshair";
    }
    if (isDemolishingRoad) {
      return "cell";
    }
    if (isSelectingTree) {
      return "none";
    }
    if (isSelectingStone) {
      return "none";
    }
    return "default";
  };

  const getAbbreviatedName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    const lastName = parts.pop();
    const abbreviatedParts = parts.map(part => `${part.charAt(0)}.`);
    return `${abbreviatedParts.join(" ")} ${lastName}`;
  };

  const getHouseNumber = (id: string) => {
    const parts = id.split('-');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length > 4) {
      return lastPart.slice(-4);
    }
    return lastPart;
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

      {isPlacingBuilding && ghostBuildingCoords && (
        <div
          style={{
            position: "absolute",
            left: ghostBuildingCoords.x * cellSizePx,
            top: ghostBuildingCoords.y * cellSizePx,
            pointerEvents: "none",
            zIndex: 100,
            fontSize: "24px",
          }}
        >
          🔨
        </div>
      )}

      {isSelectingTree && ghostBuildingCoords && (
        <div
          style={{
            position: "absolute",
            left: ghostBuildingCoords.x * cellSizePx + cellSizePx * 0.4,
            top: ghostBuildingCoords.y * cellSizePx + cellSizePx * 0.4,
            pointerEvents: "none",
            zIndex: 10,
            fontSize: Math.max(14, Math.floor(cellSizePx * 0.6)),
            lineHeight: 1,
          }}
          aria-label="axe-cursor"
        >
          🪓
        </div>
      )}

      {isSelectingStone && ghostBuildingCoords && (
        <div
          style={{
            position: "absolute",
            left: ghostBuildingCoords.x * cellSizePx + cellSizePx * 0.2,
            top: ghostBuildingCoords.y * cellSizePx + cellSizePx * 0.2,
            pointerEvents: "none",
            zIndex: 10,
            fontSize: Math.max(14, Math.floor(cellSizePx * 0.6)),
            lineHeight: 1,
          }}
          aria-label="pickaxe-cursor"
        >
          ⛏️
        </div>
      )}

      {hoveredAsset && mousePos && (
        <div
          style={{
            position: "absolute",
            left: mousePos.x + 15,
            top: mousePos.y + 15,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 100,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <div className="font-bold">{hoveredAsset.name}</div>
          <div>{hoveredAsset.quantity}</div>
        </div>
      )}

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
          type={buildingToPlace.type}
          customGraphics={buildingToPlace.customGraphics}
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

      {isPlacingRoad && ghostBuildingCoords && (
        ghostRoadTiles.length > 0 ? (
          ghostRoadTiles.map((tile, index) => (
            <Building
              id={`ghost-road-${index}`}
              key={`ghost-road-${index}`}
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
              isPlacementMode={isPlacementMode}
              isDemolishingRoad={isDemolishingRoad}
            />
          ))
        ) : (
          <Building
              id={`ghost-road-single`}
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
              isPlacementMode={isPlacementMode}
              isDemolishingRoad={isDemolishingRoad}
            />
        )
      )}

      {Array.isArray(playerAvatars) && playerAvatars.map((p) => {
        const dirRow = p.dir === "down" ? 0 : p.dir === "left" ? 1 : p.dir === "right" ? 2 : 3;
        const frameWidth = cellSizePx;
        const frameHeight = cellSizePx * 2;
        const srcX = p.frame * frameWidth;
        const srcY = dirRow * frameHeight;
        const left = (p.renderX !== undefined ? p.renderX : p.x * cellSizePx);
        const top = (p.renderY !== undefined ? p.renderY - frameHeight : p.y * cellSizePx - frameHeight);
        const scale = (avatarSize || 100) / 100;
        const labelTopOffset = frameHeight * (1 - scale) - 12;

        return (
          <div
            key={`avatar-${p.id}`}
            style={{
              position: "absolute",
              left,
              top,
              width: frameWidth,
              height: frameHeight,
              zIndex: 5,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url(${farmerSprite})`,
                backgroundPosition: `-${srcX}px -${srcY}px`,
                backgroundSize: `${frameWidth * 3}px ${frameHeight * 4}px`,
                backgroundRepeat: "no-repeat",
                imageRendering: "pixelated",
                transform: `scale(${scale})`,
                transformOrigin: "bottom center",
              }}
              aria-label="player-avatar"
            />
            <div
              style={{
                position: "absolute",
                top: labelTopOffset,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0,0,0,0.5)",
                color: "white",
                padding: "1px 4px",
                borderRadius: "4px",
                fontSize: "10px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {getAbbreviatedName(p.name)}
            </div>
            {/* Stone Carrying Icon */}
            {p.carryingStone && p.carryingStone > 0 && (
               <div
                style={{
                  position: "absolute",
                  top: -20, // Above name tag
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 20,
                  fontSize: "12px",
                  animation: "bounce 1s infinite"
                }}
               >
                 🪨
               </div>
            )}
          </div>
        );
      })}

      {/* Axe Animation Overlay */}
      {/*
      {axeAnimation && axeAnimation.active && (
        <div
          style={{
            position: "absolute",
            left: (axeAnimation.x * cellSizePx) + mapOffsetX,
            top: (axeAnimation.y * cellSizePx) + mapOffsetY,
            width: cellSizePx,
            height: cellSizePx,
            zIndex: 200,
            pointerEvents: "none",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "chop 0.5s ease-in-out infinite",
          }}
        >
          🪓
        </div>
      )}
      */}

      {/* Pickaxe Animation Overlay */}
      {/*
      {pickaxeAnimation && pickaxeAnimation.active && (
        <div
          style={{
            position: "absolute",
            left: (pickaxeAnimation.x * cellSizePx) + mapOffsetX,
            top: (pickaxeAnimation.y * cellSizePx) + mapOffsetY,
            width: cellSizePx,
            height: cellSizePx,
            zIndex: 200,
            pointerEvents: "none",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "chop 0.5s ease-in-out infinite", // Reuse chop animation
          }}
        >
          ⛏️
        </div>
      )}
      */}
    </div>
  );
};

export default Map;
