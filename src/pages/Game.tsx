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
import { RotateCw, ChevronLeft, ChevronRight, Sprout, Coins, Building as BuildingIcon, Route, Wrench, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { allProducts, ProductType, getProductByType } from "@/utils/products";
import FarmlandActionDialog from "@/components/FarmlandActionDialog";
import { CropType, FarmlandTile } from "@/components/Building";
import ShopMenu from "@/components/ShopMenu";

import { useNavigate, useLocation } from "react-router-dom";
import MoneyHistory, { Transaction } from "@/components/MoneyHistory";

const MAP_GRID_SIZE = 40;
const CELL_SIZE_PX = 48; 
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
  {
    type: "house",
    category: "residential",
    name: "Sátor",
    cost: 200,
    duration: 4000,
    width: 2,
    height: 1,
    rentalPrice: 0,
    capacity: 1,
  },
  {
    type: "house",
    category: "residential",
    name: "Házikó",
    cost: BUILD_HOUSE_COST,
    duration: BUILD_HOUSE_DURATION_MS,
    width: 2,
    height: 2,
    rentalPrice: 10,
    capacity: 2,
  },
  {
    type: "house",
    category: "residential",
    name: "Normál Ház",
    cost: 750,
    duration: 15000,
    width: 3,
    height: 2,
    rentalPrice: 15,
    capacity: 3,
  },
  {
    type: "house",
    category: "residential",
    name: "Kádárkocka",
    cost: 1200,
    duration: 20000,
    width: 3,
    height: 3,
    rentalPrice: 25,
    capacity: 4,
  },
  {
    type: "house",
    category: "residential",
    name: "Családi Ház",
    cost: 1800,
    duration: 25000,
    width: 4,
    height: 2,
    rentalPrice: 35,
    capacity: 5,
  },
  {
    type: "house",
    category: "residential",
    name: "Villa (kétszintes)",
    cost: 2500,
    duration: 30000,
    width: 3,
    height: 3,
    rentalPrice: 50,
    capacity: 6,
  },
  {
    type: "house",
    category: "residential",
    name: "Nagy Villa",
    cost: 3500,
    duration: 40000,
    width: 4,
    height: 4,
    rentalPrice: 70,
    capacity: 8,
  },
  {
    type: "office",
    category: "business",
    name: "Közszolgálati Iroda",
    cost: BUILD_OFFICE_COST,
    duration: BUILD_OFFICE_DURATION_MS,
    width: 3,
    height: 8,
    salary: OFFICE_SALARY_PER_INTERVAL,
    capacity: OFFICE_MAX_EMPLOYEES,
  },
  {
    type: "forestry",
    category: "business",
    name: "Erdészház",
    cost: BUILD_FORESTRY_HOUSE_COST,
    woodCost: BUILD_FORESTRY_HOUSE_WOOD_COST,
    duration: BUILD_FORESTRY_HOUSE_DURATION_MS,
    width: 4,
    height: 4,
    salary: FORESTRY_HOUSE_SALARY_PER_INTERVAL,
    capacity: FORESTRY_HOUSE_MAX_EMPLOYEES,
  },
  {
    type: "farm",
    category: "business",
    name: "Farm",
    cost: 1000,
    brickCost: 5,
    woodCost: 3,
    duration: 10000,
    width: 4,
    height: 4,
    salary: 5,
    capacity: 2,
  },
  {
    type: "office",
    category: "business",
    name: "Polgármesteri Hivatal",
    cost: 2500,
    woodCost: 10,
    brickCost: 15,
    duration: 30000,
    width: 4,
    height: 3,
    salary: 20,
    capacity: 5,
  },
  {
    type: "shop",
    category: "business",
    name: "Bolt",
    cost: 1500,
    woodCost: 8,
    brickCost: 10,
    duration: 20000,
    width: 3,
    height: 3,
    salary: 10,
    capacity: 3,
  },
];

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialPlayer, allPlayers, buildings: initialBuildingsState, currentPlayerId: initialCurrentPlayerId, transactions: initialTransactions } = (location.state || {}) as { initialPlayer?: Player, allPlayers?: Player[], buildings?: BuildingData[], currentPlayerId?: string, transactions?: Transaction[] };

  const [players, setPlayers] = useState<Player[]>(allPlayers || [
    { id: "player-1", name: "Játékos 1", money: 1000, inventory: { potato: 3, water: 2, clothes: 1, wood: 10, brick: 5, stone: 0, hoe: 0, tractor: 0, wheat: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-2", name: "Játékos 2", money: 750, inventory: { potato: 1, water: 1, clothes: 0, wood: 5, brick: 3, stone: 0, hoe: 0, tractor: 0, wheat: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-3", name: "Játékos 3", money: 1200, inventory: { potato: 5, water: 3, clothes: 2, wood: 15, brick: 8, stone: 0, hoe: 0, tractor: 0, wheat: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-test", name: "Teszt Játékos", money: 100000, inventory: { potato: 100, water: 100, clothes: 50, wood: 500, brick: 200, stone: 100, hoe: 10, tractor: 2, wheat: 50 }, workplace: "Tesztelő", workplaceSalary: 0 },
  ]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>(initialCurrentPlayerId || initialPlayer?.id || players[0].id);
  const currentPlayer = players.find(p => p.id === currentPlayerId)!;

  const [buildings, setBuildings] = useState<BuildingData[]>(initialBuildingsState || []);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [isBuildingInProgress, setIsBuildingInProgress] = useState(false);
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);
  const [isMoneyHistoryOpen, setIsMoneyHistoryOpen] = useState(false);

  // Időzítő állapota
  const [msUntilNextTick, setMsUntilNextTick] = useState(RENT_INTERVAL_MS);

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

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);

  const [farmlandActionState, setFarmlandActionState] = useState<{
    isOpen: boolean;
    farmId: string;
    tileX: number;
    tileY: number;
    cropType: CropType;
    cropProgress: number;
  } | null>(null);

  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [selectedShopBuilding, setSelectedShopBuilding] = useState<BuildingData | null>(null);
  const [shopInventories, setShopInventories] = useState<Record<string, ShopItem[]>>({});

  const [mapOffsetX, setMapOffsetX] = useState(0);
  const [mapOffsetY, setMapOffsetY] = useState(0);

  const mainContentRef = useRef<HTMLDivElement>(null);
  const sfxPlayerRef = useRef<SfxPlayerRef>(null);

  const isPlacementMode = isPlacingBuilding || isPlacingFarmland || isPlacingRoad || isDemolishingRoad;

  const addTransaction = (playerId: string, type: "income" | "expense", description: string, amount: number) => {
    setTransactions(prev => [...prev, { id: `tx-${Date.now()}-${Math.random()}`, playerId, type, description, amount, timestamp: Date.now() }]);
  };

  // Növekedési időzítő fix: biztosítjuk, hogy a state frissüljön
  useEffect(() => {
    const growthTimer = setInterval(() => {
      setBuildings(prevBuildings => prevBuildings.map(b => {
        if (b.type === 'farm' && b.farmlandTiles) {
          const updatedTiles = b.farmlandTiles.map(ft => {
            if (ft.cropType === CropType.Wheat && !ft.isUnderConstruction && (ft.cropProgress || 0) < 100) {
              const progressIncrease = (1000 / WHEAT_GROW_TIME_MS) * 100;
              const newProgress = Math.min(100, (ft.cropProgress || 0) + progressIncrease);
              return { ...ft, cropProgress: newProgress };
            }
            return ft;
          });
          return { ...b, farmlandTiles: updatedTiles };
        }
        return b;
      }));
    }, 1000);
    return () => clearInterval(growthTimer);
  }, []);

  // Gazdasági Tick Feldolgozása
  const processEconomyTick = useCallback(() => {
    setPlayers(prevPlayers => {
      const playerBalanceChanges: Record<string, number> = {};
      prevPlayers.forEach(p => playerBalanceChanges[p.id] = 0);

      buildings.forEach(building => {
        if (building.type === "house" && building.renterId && building.ownerId && building.rentalPrice) {
          const tenant = prevPlayers.find(p => p.id === building.renterId);
          if (tenant && tenant.money >= building.rentalPrice) {
            playerBalanceChanges[building.renterId] -= building.rentalPrice;
            playerBalanceChanges[building.ownerId] += building.rentalPrice;
            
            if (building.renterId === currentPlayerId) showSuccess(`Levonva ${building.rentalPrice} pénz bérleti díjként (${building.name}).`);
            if (building.ownerId === currentPlayerId && building.renterId !== currentPlayerId) showSuccess(`Beérkezett ${building.rentalPrice} pénz lakbér!`);
            
            addTransaction(building.renterId, "expense", `Bérleti díj: ${building.name}`, building.rentalPrice);
            addTransaction(building.ownerId, "income", `Lakbér bevétel: ${building.name}`, building.rentalPrice);
          }
        }

        if ((building.type === "office" || building.type === "forestry" || building.type === "farm" || building.type === "shop") && building.salary) {
          building.employeeIds.forEach(empId => {
            playerBalanceChanges[empId] += building.salary!;
            if (empId === currentPlayerId) showSuccess(`Megkaptad a fizetésed: ${building.salary} pénz (${building.name}).`);
            addTransaction(empId, "income", `Fizetés: ${building.name}`, building.salary!);
          });
        }
      });

      return prevPlayers.map(player => ({
        ...player,
        money: player.money + (playerBalanceChanges[player.id] || 0)
      }));
    });
  }, [buildings, currentPlayerId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsUntilNextTick(prev => {
        if (prev <= 1000) {
          processEconomyTick();
          return RENT_INTERVAL_MS;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [processEconomyTick]);

  const tickProgress = ((RENT_INTERVAL_MS - msUntilNextTick) / RENT_INTERVAL_MS) * 100;
  const secondsRemaining = Math.ceil(msUntilNextTick / 1000);

  useEffect(() => {
    if (mainContentRef.current) {
      const viewportWidth = mainContentRef.current.clientWidth;
      const viewportHeight = mainContentRef.current.clientHeight;
      const mapTotalWidthPx = MAP_GRID_SIZE * CELL_SIZE_PX;
      const mapTotalHeightPx = MAP_GRID_SIZE * 1.5 * CELL_SIZE_PX;
      setMapOffsetX((viewportWidth / 2) - (mapTotalWidthPx / 2));
      setMapOffsetY((viewportHeight / 2) - (mapTotalHeightPx / 2));
    }
  }, []);

  const moveViewport = useCallback((dx: number, dy: number) => {
    if (!mainContentRef.current) return;
    const step = CELL_SIZE_PX * 5;
    setMapOffsetX(prev => prev + (dx * step));
    setMapOffsetY(prev => prev + (dy * step));
  }, []);

  const isCellOccupied = (x: number, y: number, currentBuildings: BuildingData[]): boolean => {
    return currentBuildings.some(b => {
      const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
      const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
      return x >= b.x && x < b.x + w && y >= b.y && y < b.y + h;
    }) || currentBuildings.some(b => b.farmlandTiles?.some(ft => ft.x === x && ft.y === y));
  };

  const isAreaOccupied = (startX: number, startY: number, width: number, height: number, rotation: number, currentBuildings: BuildingData[]): boolean => {
    const effectiveWidth = (rotation === 90 || rotation === 270) ? height : width;
    const effectiveHeight = (rotation === 90 || rotation === 270) ? width : height;

    for (let x = startX; x < startX + effectiveWidth; x++) {
      for (let y = startY; y < startY + effectiveHeight; y++) {
        if (isCellOccupied(x, y, currentBuildings)) return true;
      }
    }
    return false;
  };

  const handleBuildingClick = (buildingId: string) => {
    if (isPlacementMode) return;
    const building = buildings.find(b => b.id === buildingId);
    setSelectedBuilding(building || null);
  };

  const handleGridMouseMove = (gridX: number, gridY: number) => {
    if (isPlacingBuilding && buildingToPlace) {
      setGhostBuildingCoords({ x: gridX, y: gridY });
    } else if (isPlacingFarmland || isPlacingRoad) {
      setGhostBuildingCoords({ x: gridX, y: gridY });
    }
  };

  const handleMapClick = (gridX: number, gridY: number) => {
    if (isPlacingBuilding && buildingToPlace) {
      if (isAreaOccupied(gridX, gridY, buildingToPlace.width, buildingToPlace.height, currentBuildingRotation, buildings)) {
        showError("Ez a terület már foglalt!");
        return;
      }
      
      setIsPlacingBuilding(false);
      setBuildingToPlace(null);
      setGhostBuildingCoords(null);
      setIsBuildingInProgress(true);

      const newBuildingId = `${buildingToPlace.name}-${Date.now()}`;
      const tempBuilding: BuildingData = {
        id: newBuildingId,
        name: buildingToPlace.name,
        x: gridX,
        y: gridY,
        width: buildingToPlace.width,
        height: buildingToPlace.height,
        type: buildingToPlace.type,
        rentalPrice: buildingToPlace.rentalPrice,
        salary: buildingToPlace.salary,
        capacity: buildingToPlace.capacity,
        ownerId: currentPlayerId,
        residentIds: [],
        employeeIds: [],
        isUnderConstruction: true,
        buildProgress: 0,
        rotation: currentBuildingRotation,
        farmlandTiles: buildingToPlace.type === "farm" ? [] : undefined
      };

      setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, money: p.money - buildingToPlace.cost } : p));
      setBuildings(prev => [...prev, tempBuilding]);
      
      const toastId = showLoading(`${buildingToPlace.name} építése...`);
      
      if (sfxPlayerRef.current) {
        sfxPlayerRef.current.stopAllSfx();
        const sfxKey = buildingToPlace.category === "residential" ? "construction-01" : "construction-02";
        sfxPlayerRef.current.playSfx(sfxKey, true);
      }

      let progress = 0;
      const interval = setInterval(() => {
        progress += (100 / (buildingToPlace.duration / 100));
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setBuildings(prev => prev.map(b => b.id === newBuildingId ? { ...b, buildProgress: Math.floor(progress) } : b));
      }, 100);

      setTimeout(() => {
        dismissToast(toastId);
        setIsBuildingInProgress(false);
        if (sfxPlayerRef.current) sfxPlayerRef.current.stopAllSfx();
        setBuildings(prev => prev.map(b => b.id === newBuildingId ? { ...b, isUnderConstruction: false, buildProgress: 100 } : b));
        showSuccess(`${buildingToPlace.name} felépült!`);
      }, buildingToPlace.duration);

    } else if (isPlacingFarmland && selectedFarmId) {
       if (isCellOccupied(gridX, gridY, buildings)) {
           showError("Ez a hely már foglalt!");
           return;
       }
       if (currentPlayer.money < FARMLAND_COST_PER_TILE) {
           showError("Nincs elég pénzed!");
           return;
       }

       setIsPlacingFarmland(false);
       setGhostBuildingCoords(null);
       setIsBuildingInProgress(true);

       const buildTime = FARMLAND_HOE_BUILD_DURATION_MS;
       const tileX = gridX;
       const tileY = gridY;

       setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, money: p.money - FARMLAND_COST_PER_TILE } : p));
       
       setBuildings(prev => prev.map(b => {
           if (b.id === selectedFarmId) {
               return {
                   ...b,
                   farmlandTiles: [...(b.farmlandTiles || []), {
                       x: tileX,
                       y: tileY,
                       ownerId: currentPlayerId,
                       isUnderConstruction: true,
                       buildProgress: 0,
                       cropType: CropType.None,
                       cropProgress: 0
                   }]
               };
           }
           return b;
       }));

       const toastId = showLoading(`Szántóföld kialakítása...`);
       let progress = 0;
       const interval = setInterval(() => {
         progress += (100 / (buildTime / 100));
         setBuildings(prev => prev.map(b => b.id === selectedFarmId ? {
             ...b,
             farmlandTiles: b.farmlandTiles?.map(t => t.x === tileX && t.y === tileY ? { ...t, buildProgress: Math.floor(progress) } : t)
         } : b));
         if (progress >= 100) clearInterval(interval);
       }, 100);

       setTimeout(() => {
           dismissToast(toastId);
           setIsBuildingInProgress(false);
           setBuildings(prev => prev.map(b => b.id === selectedFarmId ? {
               ...b,
               farmlandTiles: b.farmlandTiles?.map(t => t.x === tileX && t.y === tileY ? { ...t, isUnderConstruction: false, buildProgress: 100 } : t)
           } : b));
           showSuccess("Szántóföld kész!");
       }, buildTime);
    }
  };

  const handleRentBuilding = () => {
    if (!selectedBuilding || selectedBuilding.type !== "house" || selectedBuilding.rentalPrice === undefined) return;
    if (selectedBuilding.residentIds.length >= selectedBuilding.capacity) {
      showError("Ez a ház már tele van!");
      return;
    }
    setBuildings(prev => prev.map(b => b.id === selectedBuilding.id ? { ...b, renterId: currentPlayerId, residentIds: [...b.residentIds, currentPlayerId] } : b));
    showSuccess(`Sikeresen beköltöztél!`);
    setSelectedBuilding(null);
  };

  const handleJoinOffice = () => {
    if (!selectedBuilding || !selectedBuilding.salary) return;
    
    // Munkahely korlát: egyszerre csak egy munkahely
    if (currentPlayer.workplace !== "Munkanélküli") {
        showError("Már van munkahelyed! Előbb mondj fel (placeholder).");
        return;
    }

    if (selectedBuilding.employeeIds.length >= selectedBuilding.capacity) {
      showError("Nincs több szabad álláshely!");
      return;
    }
    setBuildings(prev => prev.map(b => b.id === selectedBuilding.id ? { ...b, employeeIds: [...b.employeeIds, currentPlayerId] } : b));
    setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, workplace: selectedBuilding.name, workplaceSalary: selectedBuilding.salary! } : p));
    showSuccess(`Munkába álltál!`);
    setSelectedBuilding(null);
  };

  const handleBuildBuilding = (buildingName: string) => {
    const opt = availableBuildingOptions.find(o => o.name === buildingName);
    if (!opt || currentPlayer.money < opt.cost) return;
    setIsBuildMenuOpen(false);
    setBuildingToPlace(opt);
    setIsPlacingBuilding(true);
  };

  const handleOpenShopMenu = (shopBuilding: BuildingData) => {
    setSelectedShopBuilding(shopBuilding);
    setIsShopMenuOpen(true);
    setSelectedBuilding(null);
  };

  const handleAddShopItem = (shopId: string, item: any) => {
    setShopInventories(prev => ({
      ...prev,
      [shopId]: [...(prev[shopId] || []), { ...item, stock: 0, orderedStock: 0, isDelivering: false }]
    }));
  };

  const handleOrderStock = (shopId: string, type: ProductType, quantity: number) => {
    const item = shopInventories[shopId]?.find(i => i.type === type);
    if (!item) return;
    const cost = item.wholesalePrice * quantity;
    if (currentPlayer.money < cost) {
      showError("Nincs elég pénzed a rendeléshez!");
      return;
    }
    setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, money: p.money - cost } : p));
    setShopInventories(prev => ({
      ...prev,
      [shopId]: (prev[shopId] || []).map(i => i.type === type ? { ...i, orderedStock: i.orderedStock + quantity, isDelivering: true, deliveryEta: Date.now() + i.deliveryTimeMs } : i)
    }));
  };

  const handleUpdatePrice = (shopId: string, type: ProductType, newPrice: number) => {
    setShopInventories(prev => ({
      ...prev,
      [shopId]: (prev[shopId] || []).map(i => i.type === type ? { ...i, sellPrice: newPrice } : i)
    }));
  };

  const handleRestock = (shopId: string, type: ProductType, quantity: number) => {
    setShopInventories(prev => ({
      ...prev,
      [shopId]: (prev[shopId] || []).map(i => i.type === type ? { ...i, stock: i.stock + quantity, orderedStock: Math.max(0, i.orderedStock - quantity), isDelivering: i.orderedStock > quantity } : i)
    }));
  };

  const handleBuyProduct = (shopId: string, productType: ProductType, quantity: number) => {
    const shopBuilding = buildings.find(b => b.id === shopId);
    if (!shopBuilding || shopBuilding.employeeIds.length === 0) {
      showError("A bolt zárva van, mert nincs alkalmazott!");
      return;
    }

    const item = shopInventories[shopId]?.find(i => i.type === productType);
    if (!item || item.stock < quantity) return;
    const cost = item.sellPrice * quantity;
    setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { 
      ...p, 
      money: p.money - cost, 
      inventory: { ...p.inventory, [productType]: (p.inventory[productType as keyof typeof p.inventory] as number || 0) + quantity } 
    } : p));
    handleRestock(shopId, productType, -quantity);
  };

  // Kiszállítások figyelése
  useEffect(() => {
    const timer = setInterval(() => {
      Object.entries(shopInventories).forEach(([shopId, items]) => {
        items.forEach(item => {
          if (item.isDelivering && item.deliveryEta && Date.now() >= item.deliveryEta) {
            handleRestock(shopId, item.type, item.orderedStock);
            showSuccess(`Megérkezett a rendelés a boltba: ${item.name} (${item.orderedStock} db)`);
          }
        });
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [shopInventories]);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-sidebar-primary-foreground">Tile-o-polis</h2>
        <PlayerSettings playerName={currentPlayer.name} onPlayerNameChange={(n) => setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, name: n } : p))} />
      </div>

      <div className="mb-4">
        <Label className="text-sidebar-foreground mb-2 block">Játékos váltása:</Label>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentPlayerId(players[(players.findIndex(p => p.id === currentPlayerId) - 1 + players.length) % players.length].id)} className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select onValueChange={setCurrentPlayerId} value={currentPlayerId}>
            <SelectTrigger className="w-full bg-sidebar-primary text-sidebar-primary-foreground">
              <SelectValue placeholder="Válassz játékost" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setCurrentPlayerId(players[(players.findIndex(p => p.id === currentPlayerId) + 1) % players.length].id)} className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PlayerInfo
        playerName={currentPlayer.name}
        money={currentPlayer.money}
        inventory={currentPlayer.inventory}
        workplace={currentPlayer.workplace}
        workplaceSalary={currentPlayer.workplaceSalary}
        ownedBusinesses={buildings.filter(b => b.ownerId === currentPlayerId && b.type !== "house")}
        playerSettingsButton={null}
        nextTickProgress={tickProgress}
        timeRemaining={secondsRemaining}
      />
      <div className="mt-4 space-y-2">
        {!isPlacementMode ? (
          <Button onClick={() => setIsBuildMenuOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">Építés</Button>
        ) : (
          <div className="space-y-2">
            {isPlacingBuilding && (
              <Button 
                onClick={() => setCurrentBuildingRotation(prev => (prev + 90) % 360)} 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                <RotateCw className="h-4 w-4 mr-2" /> Forgatás
              </Button>
            )}
            <Button 
              onClick={() => {
                setIsPlacingBuilding(false);
                setIsPlacingFarmland(false);
                setIsPlacingRoad(false);
                setBuildingToPlace(null);
                setGhostBuildingCoords(null);
                showError("Művelet megszakítva.");
              }} 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <X className="h-4 w-4 mr-2" /> Mégsem
            </Button>
          </div>
        )}
        <Button onClick={() => setIsMoneyHistoryOpen(true)} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold">Pénzmozgások</Button>
        <Button onClick={() => navigate('/', { state: { players, buildings, currentPlayerId, transactions } })} className="w-full bg-gray-600 hover:bg-gray-700 text-white">Főmenü</Button>
      </div>
      <MusicPlayer tracks={musicTracks} />
      <SfxPlayer ref={sfxPlayerRef} sfxUrls={sfxUrls} />
    </>
  );

  const mainContent = (
    <div ref={mainContentRef} className="flex flex-col h-full items-center justify-center relative overflow-hidden">
      <Button variant="outline" className="absolute top-0 left-0 right-0 z-10 bg-white/80 h-8 rounded-none" onClick={() => moveViewport(0, 1)}><ChevronUp className="h-5 w-5" /></Button>
      <Button variant="outline" className="absolute bottom-0 left-0 right-0 z-10 bg-white/80 h-8 rounded-none" onClick={() => moveViewport(0, -1)}><ChevronDown className="h-5 w-5" /></Button>
      <Button variant="outline" className="absolute left-0 top-0 bottom-0 z-10 bg-white/80 w-8 rounded-none" onClick={() => moveViewport(1, 0)}><ChevronLeft className="h-5 w-5" /></Button>
      <Button variant="outline" className="absolute right-0 top-0 bottom-0 z-10 bg-white/80 w-8 rounded-none" onClick={() => moveViewport(-1, 0)}><ChevronRight className="h-5 w-5" /></Button>

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
          onFarmlandClick={(fid, x, y) => {
            const b = buildings.find(b => b.id === fid);
            const tile = b?.farmlandTiles?.find(t => t.x === x && t.y === y);
            if (tile && tile.ownerId === currentPlayerId) {
               setFarmlandActionState({ isOpen: true, farmId: fid, tileX: x, tileY: y, cropType: tile.cropType, cropProgress: tile.cropProgress || 0 });
            }
          }}
          ghostFarmlandTiles={[]}
          isPlacingRoad={isPlacingRoad}
          ghostRoadTiles={[]}
          isDemolishingRoad={isDemolishingRoad}
          mapOffsetX={mapOffsetX}
          mapOffsetY={mapOffsetY}
          isPlacementMode={isPlacementMode}
        />
      </div>

      {selectedBuilding && (
        <Dialog open={!!selectedBuilding} onOpenChange={() => setSelectedBuilding(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedBuilding.name}</DialogTitle>
              <DialogDescription>
                 {selectedBuilding.ownerId === currentPlayerId ? "Ez az épület a te tulajdonod!" : `Tulajdonos: ${players.find(p => p.id === selectedBuilding.ownerId)?.name || "Nincs"}`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              {selectedBuilding.type === "house" && <p>Bérleti díj: {selectedBuilding.rentalPrice} pénz / ciklus</p>}
              {selectedBuilding.salary && <p>Fizetés: {selectedBuilding.salary} pénz / ciklus</p>}
              <p>Férőhely: {selectedBuilding.type === "house" ? selectedBuilding.residentIds.length : selectedBuilding.employeeIds.length} / {selectedBuilding.capacity}</p>
              
              {/* Lakók/Dolgozók nevei a tulajdonosnak */}
              {selectedBuilding.ownerId === currentPlayerId && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <p className="font-semibold">{selectedBuilding.type === "house" ? "Lakók:" : "Dolgozók:"}</p>
                      <ul className="list-disc list-inside">
                          {(selectedBuilding.type === "house" ? selectedBuilding.residentIds : selectedBuilding.employeeIds).map(id => (
                              <li key={id}>{players.find(p => p.id === id)?.name}</li>
                          ))}
                          {(selectedBuilding.type === "house" ? selectedBuilding.residentIds : selectedBuilding.employeeIds).length === 0 && <li>Senki</li>}
                      </ul>
                  </div>
              )}

              {selectedBuilding.type === "shop" && (
                <Button onClick={() => handleOpenShopMenu(selectedBuilding)} className="w-full bg-purple-600 text-white font-bold">Bolt megnyitása</Button>
              )}

              {selectedBuilding.type === "farm" && selectedBuilding.ownerId === currentPlayerId && (
                <Button 
                  onClick={() => {
                    setSelectedFarmId(selectedBuilding.id);
                    setIsPlacingFarmland(true);
                    setSelectedBuilding(null);
                  }} 
                  className="w-full bg-green-600 text-white font-bold"
                >
                  Szántóföld bővítése
                </Button>
              )}
            </div>
            <DialogFooter>
              {selectedBuilding.type === "house" && !selectedBuilding.residentIds.includes(currentPlayerId) && (
                <Button onClick={handleRentBuilding}>Bérlés</Button>
              )}
              {selectedBuilding.salary && !selectedBuilding.employeeIds.includes(currentPlayerId) && (
                <Button onClick={handleJoinOffice}>Munkába állás</Button>
              )}
              <Button variant="outline" onClick={() => setSelectedBuilding(null)}>Bezárás</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedShopBuilding && (
        <ShopMenu
          isOpen={isShopMenuOpen}
          onClose={() => setIsShopMenuOpen(false)}
          shopOwnerId={selectedShopBuilding.ownerId || ""}
          currentPlayerId={currentPlayerId}
          currentPlayerMoney={currentPlayer.money}
          shopItems={shopInventories[selectedShopBuilding.id] || []}
          onAddItem={(item) => handleAddShopItem(selectedShopBuilding.id, item)}
          onOrderStock={(type, quantity) => handleOrderStock(selectedShopBuilding.id, type, quantity)}
          onUpdatePrice={(type, newPrice) => handleUpdatePrice(selectedShopBuilding.id, type, newPrice)}
          onBuyProduct={(type, quantity) => handleBuyProduct(selectedShopBuilding.id, type, quantity)}
        />
      )}

      <BuildMenu
        isOpen={isBuildMenuOpen}
        onClose={() => setIsBuildMenuOpen(false)}
        onSelectBuilding={handleBuildBuilding}
        availableBuildings={availableBuildingOptions}
        playerMoney={currentPlayer.money}
        playerWood={currentPlayer.inventory.wood}
        playerBrick={currentPlayer.inventory.brick}
        playerStone={currentPlayer.inventory.stone}
        isBuildingInProgress={isPlacementMode}
      />

      <MoneyHistory
        isOpen={isMoneyHistoryOpen}
        onClose={() => setIsMoneyHistoryOpen(false)}
        transactions={transactions}
        currentPlayerId={currentPlayerId}
      />

      {farmlandActionState && (
        <FarmlandActionDialog
          {...farmlandActionState}
          onClose={() => setFarmlandActionState(null)}
          playerMoney={currentPlayer.money}
          onPlant={(fid, x, y, type) => {
            setBuildings(prev => prev.map(b => b.id === fid ? { ...b, farmlandTiles: b.farmlandTiles?.map(t => t.x === x && t.y === y ? { ...t, cropType: type, cropProgress: 0 } : t) } : b));
          }}
          onHarvest={(fid, x, y) => {
            setBuildings(prev => prev.map(b => b.id === fid ? { ...b, farmlandTiles: b.farmlandTiles?.map(t => t.x === x && t.y === y ? { ...t, cropType: CropType.None, cropProgress: 0 } : t) } : b));
            setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, inventory: { ...p.inventory, wheat: p.inventory.wheat + 10 } } : p));
            showSuccess("Leltárba került 10 búza!");
          }}
        />
      )}
    </div>
  );

  return <MainLayout sidebarContent={sidebarContent} mainContent={mainContent} />;
};

export default Game;