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
  onGridMouseMove: (gridX: number, gridY: number) => void;
  onMapClick: (x: number, y: number) => void;
  onMapMouseDown: (x: number, y: number) => void;
  onMapMouseUp: (x: number, y: number) => void;
  currentPlayerId: string;
  currentBuildingRotation: number;
  isPlacingFarmland: boolean;
  selectedFarmId: string | null;
  onFarmlandClick: (farmId: string, x: number, y: number) => void;
  ghostFarmlandTiles: { x: number; y: number }[];
  isPlacingRoad: boolean;
  ghostRoadTiles: { x: number; y: number }[];
  isDemolishingRoad: boolean;
  mapOffsetX: number;
  mapOffsetY: number;
  isPlacementMode: boolean;
  isDragging: boolean;
  trees: { x: number; y: number }[];
  stumps?: { x: number; y: number }[];
  stones?: { x: number; y: number; stoneQuantity?: number }[];
  playerAvatars?: { id: string; name: string; x: number; y: number; renderX?: number; renderY?: number; dir: "down" | "left" | "right" | "up"; frame: number; carryingStone?: number; carryingWood?: number }[];
  isSelectingTree?: boolean;
  isSelectingStone?: boolean;
  isTreeChoppingMode: boolean;
  isStoneMiningMode: boolean;
  treeChopProgress?: number;
  stoneMineProgress?: number;
  activeChopTree?: { x: number; y: number } | null;
  activeMineStone?: { x: number; y: number } | null;
  avatarSize?: number;
  axeAnimation?: { x: number; y: number; active: boolean } | null;
  pickaxeAnimation?: { x: number; y: number; active: boolean } | null;
  shopInventories?: Record<string, any[]>;
  bankConfigs?: Record<string, { interestRate: number; maxLoanAmount: number }>;
  exploredTiles: Set<string>;
}


const Map = React.memo<MapProps>(({
  buildings,
  gridSize,
  cellSizePx,
  onBuildingClick,
  isPlacingBuilding,
  buildingToPlace,
  ghostBuildingCoords,
  onGridMouseMove,
  onMapClick,
  onMapMouseDown,
  onMapMouseUp,
  currentPlayerId,
  currentBuildingRotation,
  isPlacingFarmland,
  selectedFarmId,
  onFarmlandClick,
  ghostFarmlandTiles,
  isPlacingRoad,
  ghostRoadTiles,
  isDemolishingRoad,
  mapOffsetX,
  mapOffsetY,
  isPlacementMode,
  isDragging,
  trees,
  stumps = [],
  stones = [],
  playerAvatars,
  isSelectingTree,
  isSelectingStone,
  isTreeChoppingMode,
  isStoneMiningMode,
  treeChopProgress = 0,
  stoneMineProgress = 0,
  activeChopTree,
  activeMineStone,
  avatarSize = 100,
  axeAnimation,
  pickaxeAnimation,
  shopInventories = {},
  bankConfigs = {},
  exploredTiles,
}) => {
  const mapWidthPx = gridSize * cellSizePx;
  const mapHeightPx = gridSize * cellSizePx;
  
  const terrainCanvasRef = useRef<HTMLCanvasElement>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);

  const backgroundMap = useMemo(() => {
    const map = [];
    for (let x = 0; x < gridSize; x++) {
      const row = [];
      for (let y = 0; y < gridSize; y++) {
        const isRare = Math.random() < 0.2;
        row.push(isRare ? 2 : 1);
      }
      map.push(row);
    }
    return map;
  }, [gridSize]);

  // Draw Terrain & Objects (Background Layer)
  useEffect(() => {
    const canvas = terrainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const terrainImg = new Image();
    terrainImg.src = tilesetImage;
    const detailsImg = new Image();
    detailsImg.src = detailsImage;

    const drawTerrain = () => {
      if (!terrainImg.complete || !detailsImg.complete) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Terrain
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
      
      // Draw Stumps
      const STUMP_SRC_X = 3 * 32; 
      const STUMP_SRC_Y = 5 * 32;
      stumps.forEach(s => {
        const destX = s.x * cellSizePx;
        const destY = s.y * cellSizePx;
        ctx.drawImage(detailsImg, STUMP_SRC_X, STUMP_SRC_Y, 32, 32, destX, destY, cellSizePx, cellSizePx);
      });

      // Draw Stones
      const STONE_SRC_X = 1 * 32;
      const STONE_SRC_Y = 4 * 32;
      stones.forEach(s => {
        const qty = s.stoneQuantity !== undefined ? s.stoneQuantity : 100;
        const scale = Math.max(0.3, qty / 100);
        const size = cellSizePx * 2 * scale;
        const offset = (cellSizePx * 2 - size) / 2;
        const destX = s.x * cellSizePx + offset;
        const destY = s.y * cellSizePx + offset;
        ctx.drawImage(detailsImg, STONE_SRC_X, STONE_SRC_Y, 64, 64, destX, destY, size, size);
      });

      // Draw Trees
      const TREE_SRC_X = 32 * 1;
      const TREE_SRC_Y = 32 * 6;
      treePositions.forEach(pos => {
        const destX = pos.x * cellSizePx;
        const destY = pos.y * cellSizePx;
        ctx.drawImage(detailsImg, TREE_SRC_X, TREE_SRC_Y, 32 * 3, 32 * 3, destX, destY, cellSizePx * 3, cellSizePx * 3);
      });
    };

    terrainImg.onload = drawTerrain;
    detailsImg.onload = drawTerrain;
    if (terrainImg.complete && detailsImg.complete) drawTerrain();
  }, [backgroundMap, gridSize, cellSizePx, trees, stumps, stones]);

  // Draw Fog of War (Overlay Layer)
  useEffect(() => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create a "brush" for soft edges (Radial Gradient)
    // This avoids the expensive ctx.filter = 'blur()' operation
    const brushSize = cellSizePx * 2; // Overlap for smoothness
    const brush = document.createElement('canvas');
    brush.width = brushSize;
    brush.height = brushSize;
    const bCtx = brush.getContext('2d');
    if (bCtx) {
        const gradient = bCtx.createRadialGradient(
            brushSize / 2, brushSize / 2, 0, 
            brushSize / 2, brushSize / 2, brushSize / 2
        );
        // Alpha 1 removes fog (destination-out), Alpha 0 keeps fog
        gradient.addColorStop(0, 'rgba(0,0,0,1)');   // Solid clear center
        gradient.addColorStop(0.5, 'rgba(0,0,0,1)'); // Extend solid area to cover tile fully
        gradient.addColorStop(1, 'rgba(0,0,0,0)');   // Fade out
        bCtx.fillStyle = gradient;
        bCtx.fillRect(0, 0, brushSize, brushSize);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill with black fog
    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Cut holes using the brush
    ctx.globalCompositeOperation = "destination-out";
    
    const offset = (brushSize - cellSizePx) / 2;

    exploredTiles.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        ctx.drawImage(brush, x * cellSizePx - offset, y * cellSizePx - offset);
    });
    
    ctx.restore();

    // Draw UI Overlays on top of Fog (Progress Bars)
    if (isTreeChoppingMode && treeChopProgress > 0 && activeChopTree) {
        if (exploredTiles.has(`${activeChopTree.x},${activeChopTree.y}`)) {
            const progressBarX = activeChopTree.x * cellSizePx;
            const progressBarY = activeChopTree.y * cellSizePx;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(progressBarX + cellSizePx * 0.5, progressBarY + cellSizePx * 1.5, cellSizePx * 2, 8);
            ctx.fillStyle = '#00cc00';
            ctx.fillRect(progressBarX + cellSizePx * 0.5, progressBarY + cellSizePx * 1.5, (cellSizePx * 2) * (treeChopProgress / 100), 8);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(progressBarX + cellSizePx * 0.5, progressBarY + cellSizePx * 1.5, cellSizePx * 2, 8);
        }
    }

    if (isStoneMiningMode && stoneMineProgress > 0 && activeMineStone) {
        if (exploredTiles.has(`${activeMineStone.x},${activeMineStone.y}`)) {
            const progressBarX = activeMineStone.x * cellSizePx;
            const progressBarY = activeMineStone.y * cellSizePx;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(progressBarX, progressBarY - 10, cellSizePx, 6);
            ctx.fillStyle = '#888888';
            ctx.fillRect(progressBarX, progressBarY - 10, cellSizePx * (stoneMineProgress / 100), 6);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(progressBarX, progressBarY - 10, cellSizePx, 6);
        }
    }

  }, [exploredTiles, gridSize, cellSizePx, isTreeChoppingMode, treeChopProgress, activeChopTree, isStoneMiningMode, stoneMineProgress, activeMineStone]);

  const treePositions = trees;

  const getGridCoordsFromMouseEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    const mapRect = event.currentTarget.getBoundingClientRect();
    const mouseXRelativeToMap = event.clientX - mapRect.left;
    const mouseYRelativeToMap = event.clientY - mapRect.top;

    const gridX = Math.floor(mouseXRelativeToMap / cellSizePx);
    const gridY = Math.floor(mouseYRelativeToMap / cellSizePx);
    return { gridX, gridY };
  };

  const [hoveredAsset, setHoveredAsset] = useState<{ x: number; y: number; name: string; quantity: React.ReactNode } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMapMouseMoveInternal = (event: React.MouseEvent<HTMLDivElement>) => {
    const { gridX, gridY } = getGridCoordsFromMouseEvent(event);
    onGridMouseMove(gridX, gridY);

    const mapRect = event.currentTarget.getBoundingClientRect();
    setMousePos({ x: event.clientX - mapRect.left, y: event.clientY - mapRect.top });

    // Fog of War Check for Hover
    if (!exploredTiles.has(`${gridX},${gridY}`)) {
        setHoveredAsset(null);
        return;
    }

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
        // Check farmland tiles
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
    if (isPlacingBuilding) return "none";
    if (isPlacingFarmland || isPlacingRoad) return "crosshair";
    if (isDemolishingRoad) return "cell";
    if (isSelectingTree || isSelectingStone) return "none";
    return "default";
  };

  const getAbbreviatedName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    const lastName = parts.pop();
    const abbreviatedParts = parts.map(part => `${part.charAt(0)}.`);
    return `${abbreviatedParts.join(" ")} ${lastName}`;
  };

  return (
    <div
      className="relative border border-gray-300 dark:border-gray-700 bg-black overflow-hidden"
      style={{
        width: mapWidthPx,
        height: mapHeightPx,
        transform: `translate(${mapOffsetX}px, ${mapOffsetY}px)`,
        cursor: getCursorStyle(),
      }}
      onMouseMove={handleMapMouseMoveInternal}
      onMouseDown={handleMapMouseDownInternal}
      onMouseUp={handleMapMouseUpInternal}
      onClick={(e) => {
        if (isPlacingBuilding && buildingToPlace && ghostBuildingCoords && !isDragging) {
          const { gridX, gridY } = getGridCoordsFromMouseEvent(e);
          onMapClick(gridX, gridY);
        }
      }}
    >
      {/* Terrain Layer (Z-0) */}
      <canvas
        ref={terrainCanvasRef}
        width={mapWidthPx}
        height={mapHeightPx}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 0, 
        }}
      />

      {/* Buildings & React Components Layer (Z-10) */}
      {/* Note: React components are rendered in DOM order, so they are naturally above Z-0 canvas if no z-index is set, 
          but let's be explicit if possible. Actually, children of this div are stacked. 
          Canvas is first child. Following elements are on top.
      */}

      {/* Ghost & Cursor Overlays */}
      {isPlacingBuilding && ghostBuildingCoords && (
        <div style={{ position: "absolute", left: ghostBuildingCoords.x * cellSizePx, top: ghostBuildingCoords.y * cellSizePx, pointerEvents: "none", zIndex: 100, fontSize: "24px" }}>🔨</div>
      )}
      {isSelectingTree && ghostBuildingCoords && (
        <div style={{ position: "absolute", left: ghostBuildingCoords.x * cellSizePx + cellSizePx * 0.4, top: ghostBuildingCoords.y * cellSizePx + cellSizePx * 0.4, pointerEvents: "none", zIndex: 100, fontSize: "14px" }}>🪓</div>
      )}
      {isSelectingStone && ghostBuildingCoords && (
        <div style={{ position: "absolute", left: ghostBuildingCoords.x * cellSizePx + cellSizePx * 0.2, top: ghostBuildingCoords.y * cellSizePx + cellSizePx * 0.2, pointerEvents: "none", zIndex: 100, fontSize: "14px" }}>⛏️</div>
      )}

      {/* Tooltip */}
      {hoveredAsset && mousePos && (
        <div style={{ position: "absolute", left: mousePos.x + 15, top: mousePos.y + 15, backgroundColor: "rgba(0, 0, 0, 0.8)", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", zIndex: 100, pointerEvents: "none", whiteSpace: "nowrap" }}>
          <div className="font-bold">{hoveredAsset.name}</div>
          <div>{hoveredAsset.quantity}</div>
        </div>
      )}

      {/* Farmlands */}
      {allFarmlandTiles.map((tile, index) => (
        <Building
          key={`farmland-${tile.farmId}-${tile.x}-${tile.y}`}
          id={`farmland-${tile.farmId}-${tile.x}-${tile.y}`}
          name="Szántóföld"
          x={tile.x} y={tile.y} width={1} height={1} type="farmland" cellSizePx={cellSizePx}
          onClick={() => onFarmlandClick(tile.farmId, tile.x, tile.y)}
          capacity={0} ownerId={tile.ownerId} residentIds={[]} employeeIds={[]}
          isGhost={false} isUnderConstruction={tile.isUnderConstruction} buildProgress={tile.buildProgress}
          currentPlayerId={currentPlayerId} rotation={0}
          isPlacementMode={isPlacementMode} isDemolishingRoad={isDemolishingRoad}
          cropType={tile.cropType} cropProgress={tile.cropProgress}
          constructionEta={tile.constructionEta} originalDuration={tile.originalDuration}
        />
      ))}

      {/* Buildings */}
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
      
      {/* Ghosts */}
      {isPlacingBuilding && buildingToPlace && ghostBuildingCoords && (
        <Building
          id="ghost-building" key="ghost-building" name={buildingToPlace.name}
          x={ghostBuildingCoords.x} y={ghostBuildingCoords.y} width={buildingToPlace.width} height={buildingToPlace.height}
          type={buildingToPlace.type} customGraphics={buildingToPlace.customGraphics}
          cellSizePx={cellSizePx} onClick={() => {}} capacity={buildingToPlace.capacity} ownerId={currentPlayerId} residentIds={[]} employeeIds={[]}
          isGhost={true} isUnderConstruction={false} buildProgress={0} currentPlayerId={currentPlayerId} rotation={currentBuildingRotation}
          isPlacementMode={isPlacementMode} isDemolishingRoad={isDemolishingRoad}
        />
      )}
      {isPlacingFarmland && selectedFarmId && ghostBuildingCoords && (
        ghostFarmlandTiles.map((tile, index) => (
          <Building id={`ghost-farmland-${index}`} key={`ghost-farmland-${index}`} name="Szántóföld" x={tile.x} y={tile.y} width={1} height={1} type="farmland" cellSizePx={cellSizePx} onClick={() => {}} capacity={0} ownerId={currentPlayerId} residentIds={[]} employeeIds={[]} isGhost={true} isUnderConstruction={false} buildProgress={0} currentPlayerId={currentPlayerId} rotation={0} isPlacementMode={isPlacementMode} isDemolishingRoad={isDemolishingRoad} cropType={CropType.None} cropProgress={0} />
        ))
      )}
      {isPlacingRoad && ghostBuildingCoords && (
        ghostRoadTiles.length > 0 ? (
          ghostRoadTiles.map((tile, index) => (
            <Building id={`ghost-road-${index}`} key={`ghost-road-${index}`} name="Út" x={tile.x} y={tile.y} width={1} height={1} type="road" cellSizePx={cellSizePx} onClick={() => {}} capacity={0} ownerId={currentPlayerId} residentIds={[]} employeeIds={[]} isGhost={true} isUnderConstruction={false} buildProgress={0} currentPlayerId={currentPlayerId} rotation={0} isPlacementMode={isPlacementMode} isDemolishingRoad={isDemolishingRoad} />
          ))
        ) : (
          <Building id={`ghost-road-single`} name="Út" x={ghostBuildingCoords.x} y={ghostBuildingCoords.y} width={1} height={1} type="road" cellSizePx={cellSizePx} onClick={() => {}} capacity={0} ownerId={currentPlayerId} residentIds={[]} employeeIds={[]} isGhost={true} isUnderConstruction={false} buildProgress={0} currentPlayerId={currentPlayerId} rotation={0} isPlacementMode={isPlacementMode} isDemolishingRoad={isDemolishingRoad} />
        )
      )}

      {/* Avatars */}
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
          <div key={`avatar-${p.id}`} style={{ position: "absolute", left, top, width: frameWidth, height: frameHeight, zIndex: 5 }}>
            <div style={{ width: "100%", height: "100%", backgroundImage: `url(${farmerSprite})`, backgroundPosition: `-${srcX}px -${srcY}px`, backgroundSize: `${frameWidth * 3}px ${frameHeight * 4}px`, backgroundRepeat: "no-repeat", imageRendering: "pixelated", transform: `scale(${scale})`, transformOrigin: "bottom center" }} aria-label="player-avatar" />
            <div style={{ position: "absolute", top: labelTopOffset, left: "50%", transform: "translateX(-50%)", backgroundColor: "rgba(0,0,0,0.5)", color: "white", padding: "1px 4px", borderRadius: "4px", fontSize: "10px", whiteSpace: "nowrap", pointerEvents: "none" }}>{getAbbreviatedName(p.name)}</div>
            {p.carryingStone && p.carryingStone > 0 && (
               <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", zIndex: 20, fontSize: "12px", animation: "bounce 1s infinite" }}>🪨</div>
            )}
            {p.carryingWood && p.carryingWood > 0 && (
               <div style={{ position: "absolute", top: -32, left: "50%", transform: "translateX(-50%)", zIndex: 20, fontSize: "12px", animation: "bounce 1s infinite" }}>🪵</div>
            )}
          </div>
        );
      })}

      {/* Fog of War Layer (Z-20) */}
      <canvas
        ref={fogCanvasRef}
        width={mapWidthPx}
        height={mapHeightPx}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 20, 
        }}
      />
    </div>
  );
});

export default Map;