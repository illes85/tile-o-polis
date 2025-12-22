"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PlayerInfo from "@/components/PlayerInfo";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Map, { BuildingData } from "@/components/Map";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import BuildMenu, { BuildingOption } from "@/components/BuildMenu";
import MusicPlayer from "@/components/MusicPlayer";
import SfxPlayer, { SfxPlayerRef } from "@/components/SfxPlayer";
import { musicTracks } from "@/utils/musicFiles";
import { sfxUrls } from "@/utils/sfxFiles";
import PlayerSettings from "@/components/PlayerSettings";
import { RotateCw, ChevronLeft, ChevronRight, Sprout, Coins, Building as BuildingIcon, Route, Wrench, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { allProducts, ProductType, getProductByType } from "@/utils/products";
import FarmlandActionDialog from "@/components/FarmlandActionDialog";
import { CropType, FarmlandTile } from "@/components/Building";
import ShopMenu from "@/components/ShopMenu";
import ShopInventory from "@/components/ShopInventory";

import { useNavigate, useLocation } from "react-router-dom";
import MoneyHistory, { Transaction } from "@/components/MoneyHistory";

const MAP_GRID_SIZE = 40;
const CELL_SIZE_PX = 40;
const RENT_INTERVAL_MS = 30000;
const BUILD_HOUSE_COST = 500;
const BUILD_HOUSE_DURATION_MS = 10000;
const BUILD_OFFICE_COST = 1000;
const BUILD_OFFICE_DURATION_MS = 15000;
const OFFICE_SALARY_PER_INTERVAL = 10;
const OFFICE_MAX_EMPLOYEES = 4;
const BUILD_FORESTRY_HOUSE_COST = 850;
const BUILD_FORESTRY_HOUSE_WOOD_COST = 5;
const BUILD_FORESTRY_HOUSE_DURATION_MS = 12000;
const FORESTRY_HOUSE_SALARY_PER_INTERVAL = 8;
const FORESTRY_HOUSE_MAX_EMPLOYEES = 1;
const FARMLAND_COST_PER_TILE = 3;
const ROAD_COST_PER_TILE = 5;
const ROAD_BUILD_DURATION_MS = 6000;
const ROAD_STONE_COST_PER_TILE = 1;
const FARMLAND_HOE_BUILD_DURATION_MS = 15000;
const FARMLAND_TRACTOR_BUILD_DURATION_MS = 5000;
const FARMLAND_MAX_DISTANCE = 3;
const DEMOLISH_REFUND_PERCENTAGE = 0.5;

// Termelési konstansok
const WHEAT_SEED_COST = 5;
const WHEAT_GROW_TIME_MS = 60000;
const WHEAT_HARVEST_YIELD = 10;

interface Player {
  id: string;
  name: string;
  money: number;
  inventory: {
    potato: number;
    water: number;
    clothes: number;
    wood: number;
    brick: number;
    stone: number;
    hoe: number;
    tractor: number;
    wheat: number;
  };
  workplace: string;
  workplaceSalary: number;
}

interface ShopItem {
  type: ProductType;
  name: string;
  wholesalePrice: number;
  deliveryTimeMs: number;
  sellPrice: number;
  stock: number;
  orderedStock: number;
  isDelivering: boolean;
  deliveryEta?: number;
}

const availableBuildingOptions: BuildingOption[] = [
  // ... (épület opciók - változatlanok) ...
];

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialPlayer, allPlayers, buildings: initialBuildingsState, currentPlayerId: initialCurrentPlayerId } = (location.state || {}) as { initialPlayer?: Player, allPlayers?: Player[], buildings?: BuildingData[], currentPlayerId?: string };

  const [players, setPlayers] = useState<Player[]>(allPlayers || [
    // ... (játékosok - változatlanok) ...
  ]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>(initialCurrentPlayerId || initialPlayer?.id || players[0].id);
  const currentPlayer = players.find(p => p.id === currentPlayerId)!;

  const [buildings, setBuildings] = useState<BuildingData[]>(initialBuildingsState || []);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [isBuildingInProgress, setIsBuildingInProgress] = useState(false);
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);
  const [isMoneyHistoryOpen, setIsMoneyHistoryOpen] = useState(false);

  const [isPlacingBuilding, setIsPlacingBuilding] = useState(false);
  const [buildingToPlace, setBuildingToPlace] = useState<BuildingOption | null>(null);
  const [ghostBuildingCoords, setGhostBuildingCoords] = useState<{ x: number; y: number } | null>(null);
  const [currentBuildingRotation, setCurrentBuildingRotation] = useState<number>(0);

  const [isPlacingFarmland, setIsPlacingFarmland] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [ghostFarmlandTiles, setGhostFarmlandTiles] = useState<{ x: number; y: number }[]>([]);
  const [isFarmlandDragging, setIsFarmlandDragging] = useState(false);

  const [isPlacingRoad, setIsPlacingRoad] = useState(false);
  const [ghostRoadTiles, setGhostRoadTiles] = useState<{ x: number; y: number }[]>([]);
  const [isRoadDragging, setIsRoadDragging] = useState(false);

  const [isDemolishingRoad, setIsDemolishingRoad] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Szántóföld akció dialógus állapota
  const [farmlandActionState, setFarmlandActionState] = useState<{
    isOpen: boolean;
    farmId: string;
    tileX: number;
    tileY: number;
    cropType: CropType;
    cropProgress: number;
  } | null>(null);

  // Új state a ShopMenu-hoz
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [selectedShopBuilding, setSelectedShopBuilding] = useState<BuildingData | null>(null);

  // Új state a bolt készlethez
  const [shopInventories, setShopInventories] = useState<Record<string, ShopItem[]>>({});

  // Térkép pozícionálás állapotok
  const [mapOffsetX, setMapOffsetX] = useState(0);
  const [mapOffsetY, setMapOffsetY] = useState(0);

  // Ref a fő tartalom div-hez a méretek lekéréséhez
  const mainContentRef = useRef<HTMLDivElement>(null);
  const sfxPlayerRef = useRef<SfxPlayerRef>(null);

  const isPlacementMode = isPlacingBuilding || isPlacingFarmland || isPlacingRoad || isDemolishingRoad;

  // ... (useEffect, segédfüggvények - változatlanok) ...

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
  };

  const canPlaceFarmlandAt = (farm: BuildingData, targetX: number, targetY: number): boolean => {
    // Ellenőrizzük, hogy a cél mező foglalt-e
    if (isCellOccupied(targetX, targetY, buildings)) {
        return false;
    }

    // Ellenőrizzük, hogy a cél mező a farm épületén belül van-e
    const effectiveFarmWidth = (farm.rotation === 90 || farm.rotation === 270) ? farm.height : farm.width;
    const effectiveFarmHeight = (farm.rotation === 90 || farm.rotation === 270) ? farm.width : farm.height;
    
    const isInsideFarmBuilding = 
        targetX >= farm.x && 
        targetX < farm.x + effectiveFarmWidth && 
        targetY >= farm.y && 
        targetY < farm.y + effectiveFarmHeight;
    
    // Ha a cél mező a farm épületén belül van, akkor nem helyezhetünk szántóföldet
    if (isInsideFarmBuilding) {
        return false;
    }

    // Ellenőrizzük, hogy a cél mező a farmtól 3 csempényi távolságon belül van-e
    let isWithinRangeOfFarm = false;
    for (let fx = farm.x - FARMLAND_MAX_DISTANCE; fx < farm.x + effectiveFarmWidth + FARMLAND_MAX_DISTANCE; fx++) {
        for (let fy = farm.y - FARMLAND_MAX_DISTANCE; fy < farm.y + effectiveFarmHeight + FARMLAND_MAX_DISTANCE; fy++) {
            if (fx === targetX && fy === targetY) {
                isWithinRangeOfFarm = true;
                break;
            }
        }
        if (isWithinRangeOfFarm) break;
    }

    if (!isWithinRangeOfFarm) return false;

    // Ellenőrizzük a szomszédságot
    const existingFarmlandTiles = farm.farmlandTiles || [];
    let isAdjacentToExistingFarmland = false;
    let isAdjacentToFarmBuilding = false;

    // Szomszédság ellenőrzése a már létező szántóföld csempékkel
    for (const tile of existingFarmlandTiles) {
        if (getDistance(tile.x, tile.y, targetX, targetY) === 1) {
            isAdjacentToExistingFarmland = true;
            break;
        }
    }

    // Szomszédság ellenőrzése a farm épület csempéivel
    for (let fx = farm.x; fx < farm.x + effectiveFarmWidth; fx++) {
        for (let fy = farm.y; fy < farm.y + effectiveFarmHeight; fy++) {
            if (getDistance(fx, fy, targetX, targetY) === 1) {
                isAdjacentToFarmBuilding = true;
                break;
            }
        }
        if (isAdjacentToFarmBuilding) break;
    }

    const isConnected = isAdjacentToFarmBuilding || isAdjacentToExistingFarmland;

    return isConnected;
  };

  // ... (többi függvény - változatlanok) ...

  // Új handler függvények a ShopMenu-hoz
  const handleOpenShopMenu = (shopBuilding: BuildingData) => {
    setSelectedShopBuilding(shopBuilding);
    setIsShopMenuOpen(true);
    setSelectedBuilding(null);
  };

  const handleAddShopItem = (shopId: string, item: Omit<ShopItem, 'stock' | 'orderedStock' | 'isDelivering'>) => {
    setShopInventories(prev => {
      const currentInventory = prev[shopId] || [];
      const newItem: ShopItem = {
        ...item,
        stock: 0,
        orderedStock: 0,
        isDelivering: false,
      };
      return {
        ...prev,
        [shopId]: [...currentInventory, newItem]
      };
    });
  };

  const handleOrderStock = (shopId: string, type: ProductType, quantity: number) => {
    setShopInventories(prev => {
      const currentInventory = prev[shopId] || [];
      const updatedInventory = currentInventory.map(item => {
        if (item.type === type) {
          // Ellenőrizzük, hogy van-e elég pénz a rendeléshez
          const totalCost = item.wholesalePrice * quantity;
          const player = players.find(p => p.id === currentPlayerId);
          if (player && player.money >= totalCost) {
            // Levonjuk a pénzt
            setPlayers(prevPlayers =>
              prevPlayers.map(p =>
                p.id === currentPlayerId ? { ...p, money: p.money - totalCost } : p
              )
            );
            addTransaction(currentPlayerId, "expense", `Rendelés: ${quantity} db ${item.name}`, totalCost);
            
            // Frissítjük a rendelés alatti készletet
            return {
              ...item,
              orderedStock: item.orderedStock + quantity,
              isDelivering: true,
              deliveryEta: Date.now() + item.deliveryTimeMs
            };
          } else {
            showError("Nincs elég pénzed a rendeléshez!");
            return item;
          }
        }
        return item;
      });
      return {
        ...prev,
        [shopId]: updatedInventory
      };
    });
  };

  const handleUpdatePrice = (shopId: string, type: ProductType, newPrice: number) => {
    setShopInventories(prev => {
      const currentInventory = prev[shopId] || [];
      const updatedInventory = currentInventory.map(item => {
        if (item.type === type) {
          return {
            ...item,
            sellPrice: newPrice
          };
        }
        return item;
      });
      return {
        ...prev,
        [shopId]: updatedInventory
      };
    });
  };

  const handleRestock = (shopId: string, type: ProductType, quantity: number) => {
    setShopInventories(prev => {
      const currentInventory = prev[shopId] || [];
      const updatedInventory = currentInventory.map(item => {
        if (item.type === type) {
          return {
            ...item,
            stock: item.stock + quantity,
            orderedStock: item.isDelivering ? item.orderedStock - quantity : item.orderedStock,
            isDelivering: item.isDelivering && item.orderedStock > quantity ? true : false
          };
        }
        return item;
      });
      return {
        ...prev,
        [shopId]: updatedInventory
      };
    });
  };

  const handleBuyProduct = (shopId: string, productType: ProductType, quantity: number) => {
    setShopInventories(prev => {
      const currentInventory = prev[shopId] || [];
      const updatedInventory = currentInventory.map(item => {
        if (item.type === productType && item.stock >= quantity) {
          // Játékos pénzének frissítése
          setPlayers(prevPlayers =>
            prevPlayers.map(p =>
              p.id === currentPlayerId
                ? {
                    ...p,
                    money: p.money - item.sellPrice * quantity,
                    inventory: {
                      ...p.inventory,
                      [productType]: (p.inventory[productType] || 0) + quantity
                    }
                  }
                : p
            )
          );
          addTransaction(currentPlayerId, "expense", `Vásárlás: ${quantity} db ${item.name}`, item.sellPrice * quantity);
          
          // Bolt készletének frissítése
          return {
            ...item,
            stock: item.stock - quantity
          };
        }
        return item;
      });
      return {
        ...prev,
        [shopId]: updatedInventory
      };
    });
  };

  // Szállítási időzítő
  useEffect(() => {
    const deliveryTimer = setInterval(() => {
      Object.entries(shopInventories).forEach(([shopId, items]) => {
        items.forEach(item => {
          if (item.isDelivering && item.deliveryEta && Date.now() >= item.deliveryEta) {
            // Szállítás befejezve
            handleRestock(shopId, item.type, item.orderedStock);
            showSuccess(`Szállítás befejezve: ${item.orderedStock} db ${item.name} érkezett a ${shopId} boltba!`);
          }
        });
      });
    }, 1000);

    return () => clearInterval(deliveryTimer);
  }, [shopInventories]);

  // ... (többi függvény - változatlanok) ...

  const mainContent = (
    <div
      ref={mainContentRef}
      className="flex flex-col h-full items-center justify-center relative overflow-hidden"
    >
      {/* ... (navigációs gombok - változatlanok) ... */}

      <div className="flex-grow flex items-center justify-center">
        <Map
          buildings={buildings}
          gridSize={MAP_GRID_SIZE}
          cellSizePx={CELL_SIZE_PX}
          onBuildingClick={handleBuildingClick}
          isPlacingBuilding={isPlacingBuilding}
          buildingToPlace={buildingToPlace}
          ghostBuildingCoords={ghostBuildingCoords}
          onGridMouseMove={handleGridMouseMove}
          onMapClick={handleMapClick}
          currentPlayerId={currentPlayerId}
          currentBuildingRotation={currentBuildingRotation}
          isPlacingFarmland={isPlacingFarmland}
          selectedFarmId={selectedFarmId}
          onFarmlandClick={handleFarmlandClick}
          ghostFarmlandTiles={ghostFarmlandTiles}
          isPlacingRoad={isPlacingRoad}
          ghostRoadTiles={ghostRoadTiles}
          isDemolishingRoad={isDemolishingRoad}
          mapOffsetX={mapOffsetX}
          mapOffsetY={mapOffsetY}
          isPlacementMode={isPlacementMode}
        />
      </div>

      {/* ... (dialógusok - változatlanok) ... */}

      {/* Új ShopMenu dialógus */}
      {selectedShopBuilding && (
        <ShopMenu
          isOpen={isShopMenuOpen}
          onClose={() => {
            setIsShopMenuOpen(false);
            setSelectedShopBuilding(null);
          }}
          shopOwnerId={selectedShopBuilding.ownerId || ""}
          currentPlayerId={currentPlayerId}
          currentPlayerMoney={currentPlayer.money}
          shopItems={shopInventories[selectedShopBuilding.id] || []}
          onAddItem={(item) => handleAddShopItem(selectedShopBuilding.id, item)}
          onOrderStock={(type, quantity) => handleOrderStock(selectedShopBuilding.id, type, quantity)}
          onUpdatePrice={(type, newPrice) => handleUpdatePrice(selectedShopBuilding.id, type, newPrice)}
          onRestock={(type, quantity) => handleRestock(selectedShopBuilding.id, type, quantity)}
          onBuyProduct={(type, quantity) => handleBuyProduct(selectedShopBuilding.id, type, quantity)}
        />
      )}

      {/* ... (többi dialógus - változatlanok) ... */}
    </div>
  );

  return <MainLayout sidebarContent={sidebarContent} mainContent={mainContent} />;
};

export default Game;