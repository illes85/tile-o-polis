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
import { RotateCw, ChevronLeft, ChevronRight, Sprout, Coins, Building as BuildingIcon, Route, Wrench, Trash2, ChevronUp, ChevronDown, X, Users, Wheat } from "lucide-react";
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
const WHEAT_GROW_TIME_MS = 60000;
const WHEAT_HARVEST_YIELD = 10;
const MILL_WHEAT_CONSUMPTION_PER_PROCESS = 5;
const MILL_FLOUR_PRODUCTION_PER_PROCESS = 3;
const MILL_PROCESSING_TIME_MS = 10000;

interface Player {
  id: string;
  name: string;
  money: number;
  inventory: Record<string, number>;
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
  { type: "house", category: "residential", name: "Sátor", cost: 200, duration: 4000, width: 2, height: 1, rentalPrice: 0, capacity: 1 },
  { type: "house", category: "residential", name: "Házikó", cost: BUILD_HOUSE_COST, duration: BUILD_HOUSE_DURATION_MS, width: 2, height: 2, rentalPrice: 10, capacity: 2 },
  { type: "house", category: "residential", name: "Normál Ház", cost: 750, duration: 15000, width: 3, height: 2, rentalPrice: 15, capacity: 3 },
  { type: "house", category: "residential", name: "Kádárkocka", cost: 1200, duration: 20000, width: 3, height: 3, rentalPrice: 25, capacity: 4 },
  { type: "house", category: "residential", name: "Családi Ház", cost: 1800, duration: 25000, width: 4, height: 2, rentalPrice: 35, capacity: 5 },
  { type: "house", category: "residential", name: "Villa (kétszintes)", cost: 2500, duration: 30000, width: 3, height: 3, rentalPrice: 50, capacity: 6 },
  { type: "house", category: "residential", name: "Nagy Villa", cost: 3500, duration: 40000, width: 4, height: 4, rentalPrice: 70, capacity: 8 },
  { type: "office", category: "business", name: "Közszolgálati Iroda", cost: BUILD_OFFICE_COST, duration: BUILD_OFFICE_DURATION_MS, width: 3, height: 8, salary: OFFICE_SALARY_PER_INTERVAL, capacity: OFFICE_MAX_EMPLOYEES },
  { type: "forestry", category: "business", name: "Erdészház", cost: BUILD_FORESTRY_HOUSE_COST, woodCost: BUILD_FORESTRY_HOUSE_WOOD_COST, duration: BUILD_FORESTRY_HOUSE_DURATION_MS, width: 4, height: 4, salary: FORESTRY_HOUSE_SALARY_PER_INTERVAL, capacity: FORESTRY_HOUSE_MAX_EMPLOYEES },
  { type: "farm", category: "business", name: "Farm", cost: 1000, brickCost: 5, woodCost: 3, duration: 10000, width: 4, height: 4, salary: 5, capacity: 2 },
  { type: "office", category: "business", name: "Polgármesteri Hivatal", cost: 2500, woodCost: 10, brickCost: 15, duration: 30000, width: 4, height: 3, salary: 20, capacity: 5 },
  { type: "shop", category: "business", name: "Bolt", cost: 1500, woodCost: 8, brickCost: 10, duration: 20000, width: 3, height: 3, salary: 10, capacity: 3 },
  { type: "mill", category: "business", name: "Malom", cost: 2000, woodCost: 10, brickCost: 15, stoneCost: 5, duration: 25000, width: 4, height: 4, salary: 15, capacity: 3 },
];

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialPlayer, allPlayers, buildings: initialBuildingsState, currentPlayerId: initialCurrentPlayerId, transactions: initialTransactions } = (location.state || {}) as { initialPlayer?: Player, allPlayers?: Player[], buildings?: BuildingData[], currentPlayerId?: string, transactions?: Transaction[] };

  const [players, setPlayers] = useState<Player[]>(allPlayers || [
    { id: "player-1", name: "Játékos 1", money: 1000, inventory: { potato: 3, water: 2, wood: 10, brick: 5, stone: 0, hoe: 0, tractor: 0, wheat: 0, [ProductType.WheatSeed]: 5 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-2", name: "Játékos 2", money: 750, inventory: { potato: 1, water: 1, wood: 5, brick: 3, stone: 0, hoe: 0, tractor: 0, wheat: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-test", name: "Teszt Játékos", money: 100000, inventory: { [ProductType.WheatSeed]: 100, wheat: 50, wood: 500, stone: 100 }, workplace: "Tesztelő", workplaceSalary: 0 },
    { id: "player-rich-1", name: "Gazdag Gazda", money: 50000, inventory: { wood: 50, brick: 50, stone: 50, [ProductType.WheatSeed]: 20 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-rich-2", name: "Városatyja", money: 250000, inventory: { wood: 100, brick: 100, stone: 100 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-rich-3", name: "Tökmagolaj", money: 150000, inventory: { wood: 75, brick: 75, stone: 75, [ProductType.WheatSeed]: 50 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-rich-4", name: "Búzabáró", money: 300000, inventory: { wood: 150, brick: 150, stone: 150, [ProductType.WheatSeed]: 100 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-rich-5", name: "Kalászkirály", money: 500000, inventory: { wood: 200, brick: 200, stone: 200, [ProductType.WheatSeed]: 200 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-rich-6", name: "Gabonagazda", money: 750000, inventory: { wood: 300, brick: 300, stone: 300, [ProductType.WheatSeed]: 300, wheat: 100 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-rich-7", name: "Mezőgazdász Mester", money: 1000000, inventory: { wood: 500, brick: 500, stone: 500, [ProductType.WheatSeed]: 500, wheat: 200, hoe: 10 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-rich-8", name: "Aranykalász", money: 1500000, inventory: { wood: 750, brick: 750, stone: 750, [ProductType.WheatSeed]: 750, wheat: 300, tractor: 2 }, workplace: "Munkanélküli", workplaceSalary: 0 },
  ]);

  const [currentPlayerId, setCurrentPlayerId] = useState<string>(initialCurrentPlayerId || initialPlayer?.id || players[0].id);
  const currentPlayer = players.find(p => p.id === currentPlayerId)!;
  const [buildings, setBuildings] = useState<BuildingData[]>(initialBuildingsState || []);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [isBuildingInProgress, setIsBuildingInProgress] = useState(false);
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);
  const [isMoneyHistoryOpen, setIsMoneyHistoryOpen] = useState(false);
  const [msUntilNextTick, setMsUntilNextTick] = useState(RENT_INTERVAL_MS);
  const [isPlacingBuilding, setIsPlacingBuilding] = useState(false);
  const [buildingToPlace, setBuildingToPlace] = useState<BuildingOption | null>(null);
  const [ghostBuildingCoords, setGhostBuildingCoords] = useState<{ x: number; y: number } | null>(null);
  const [currentBuildingRotation, setCurrentBuildingRotation] = useState<number>(0);
  const [isPlacingFarmland, setIsPlacingFarmland] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  const [farmlandActionState, setFarmlandActionState] = useState<{ isOpen: boolean, farmId: string, tileX: number, tileY: number, cropType: CropType, cropProgress: number } | null>(null);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [selectedShopBuilding, setSelectedShopBuilding] = useState<BuildingData | null>(null);
  const [shopInventories, setShopInventories] = useState<Record<string, ShopItem[]>>({});
  const [mapOffsetX, setMapOffsetX] = useState(0);
  const [mapOffsetY, setMapOffsetY] = useState(0);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const sfxPlayerRef = useRef<SfxPlayerRef>(null);
  const isPlacementMode = isPlacingBuilding || isPlacingFarmland;

  const addTransaction = (playerId: string, type: "income" | "expense", description: string, amount: number) => {
    setTransactions(prev => [...prev, {
      id: `tx-${Date.now()}-${Math.random()}`,
      playerId,
      type,
      description,
      amount,
      timestamp: Date.now()
    }]);
  };

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
            addTransaction(building.renterId, "expense", `Bérleti díj: ${building.name}`, building.rentalPrice);
            addTransaction(building.ownerId, "income", `Lakbér: ${building.name}`, building.rentalPrice);
          }
        }

        if (building.salary && building.employeeIds.length > 0) {
          building.employeeIds.forEach(empId => {
            playerBalanceChanges[empId] += building.salary!;
            addTransaction(empId, "income", `Fizetés: ${building.name}`, building.salary!);
          });
        }
      });

      return prevPlayers.map(p => ({
        ...p,
        money: Math.max(0, p.money + (playerBalanceChanges[p.id] || 0))
      }));
    });
  }, [buildings]);

  // Malom feldolgozási logika
  useEffect(() => {
    const millProcessingTimer = setInterval(() => {
      setBuildings(prevBuildings => 
        prevBuildings.map(building => {
          if (building.type === "mill" && building.employeeIds.length > 0) {
            // Ellenőrizzük, hogy van-e elég búza a tulajdonosnak
            const owner = players.find(p => p.id === building.ownerId);
            if (owner && (owner.inventory.wheat || 0) >= MILL_WHEAT_CONSUMPTION_PER_PROCESS) {
              // Frissítjük a tulajdonos búza készletét
              setPlayers(prevPlayers => 
                prevPlayers.map(p => 
                  p.id === building.ownerId ? {
                    ...p,
                    inventory: {
                      ...p.inventory,
                      wheat: (p.inventory.wheat || 0) - MILL_WHEAT_CONSUMPTION_PER_PROCESS,
                      flour: (p.inventory.flour || 0) + MILL_FLOUR_PRODUCTION_PER_PROCESS
                    }
                  } : p
                )
              );
              
              // Tranzakció rögzítése
              addTransaction(building.ownerId!, "expense", `Malom: búza feldolgozása`, 0);
              showSuccess(`${building.name}: Búza feldolgozva, liszt előállítva!`);
            }
          }
          return building;
        })
      );
    }, MILL_PROCESSING_TIME_MS);

    return () => clearInterval(millProcessingTimer);
  }, [buildings, players]);

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

  // Növekedési időzítő
  useEffect(() => {
    const growthTimer = setInterval(() => {
      setBuildings(prevBuildings => 
        prevBuildings.map(b => {
          if (b.type === 'farm' && b.farmlandTiles) {
            const updatedTiles = b.farmlandTiles.map(ft => {
              if (ft.cropType === CropType.Wheat && (ft.cropProgress || 0) < 100) {
                const progressIncrease = (1000 / WHEAT_GROW_TIME_MS) * 100;
                return {
                  ...ft,
                  cropProgress: Math.min(100, (ft.cropProgress || 0) + progressIncrease)
                };
              }
              return ft;
            });
            return {
              ...b,
              farmlandTiles: updatedTiles
            };
          }
          return b;
        })
      );
    }, 1000);

    return () => clearInterval(growthTimer);
  }, []);

  const tickProgress = ((RENT_INTERVAL_MS - msUntilNextTick) / RENT_INTERVAL_MS) * 100;
  const secondsRemaining = Math.ceil(msUntilNextTick / 1000);

  const isCellOccupied = (x: number, y: number, currentBuildings: BuildingData[]): boolean => {
    return currentBuildings.some(b => {
      const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
      const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
      return x >= b.x && x < b.x + w && y >= b.y && y < b.y + h;
    }) || currentBuildings.some(b => 
      b.farmlandTiles?.some(ft => ft.x === x && ft.y === y)
    );
  };

  const isFarmlandPlaceable = (gridX: number, gridY: number, farmId: string) => {
    const farm = buildings.find(b => b.id === farmId);
    if (!farm) return false;

    const inFarmProximity = 
      (gridX >= farm.x - 1 && gridX <= farm.x + farm.width) &&
      (gridY >= farm.y - 1 && gridY <= farm.y + farm.height);

    const nextToOtherTile = farm.farmlandTiles?.some(t => 
      Math.abs(t.x - gridX) + Math.abs(t.y - gridY) === 1
    );

    return inFarmProximity || nextToOtherTile;
  };

  const handleBuildingClick = (buildingId: string) => {
    if (isPlacementMode) return;
    const building = buildings.find(b => b.id === buildingId);
    setSelectedBuilding(building || null);
  };

  const handleMapClick = (gridX: number, gridY: number) => {
    if (isPlacingBuilding && buildingToPlace) {
      if (isCellOccupied(gridX, gridY, buildings)) {
        showError("Hely foglalt!");
        return;
      }

      if (currentPlayer.money < buildingToPlace.cost) {
        showError("Nincs elég pénzed!");
        return;
      }

      setIsPlacingBuilding(false);
      const newId = `${buildingToPlace.name}-${Date.now()}`;

      setPlayers(prev => prev.map(p => 
        p.id === currentPlayerId ? {
          ...p,
          money: p.money - buildingToPlace.cost,
          inventory: {
            ...p.inventory,
            wood: p.inventory.wood - (buildingToPlace.woodCost || 0),
            brick: p.inventory.brick - (buildingToPlace.brickCost || 0),
            stone: p.inventory.stone - (buildingToPlace.stoneCost || 0)
          }
        } : p
      ));

      const newBuilding: BuildingData = {
        id: newId,
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
        farmlandTiles: buildingToPlace.type === "farm" ? [] : undefined,
        level: 1
      };

      setBuildings(prev => [...prev, newBuilding]);

      if (sfxPlayerRef.current) {
        const sound = buildingToPlace.category === "residential" ? "construction-01" : "construction-02";
        sfxPlayerRef.current.playSfx(sound, true);
      }

      let prog = 0;
      const inv = setInterval(() => {
        prog += 10;
        setBuildings(prev => prev.map(b => 
          b.id === newId ? { ...b, buildProgress: prog } : b
        ));

        if (prog >= 100) {
          clearInterval(inv);
          if (sfxPlayerRef.current) sfxPlayerRef.current.stopAllSfx();
          setBuildings(prev => prev.map(b => 
            b.id === newId ? { ...b, isUnderConstruction: false } : b
          ));
          showSuccess(`${buildingToPlace.name} kész!`);
        }
      }, buildingToPlace.duration / 10);
    } else if (isPlacingFarmland && selectedFarmId) {
      const farm = buildings.find(b => b.id === selectedFarmId);
      if (!farm || farm.employeeIds.length === 0) {
        showError("A farm zárva van! Nincs alkalmazott.");
        return;
      }

      if (isCellOccupied(gridX, gridY, buildings)) {
        showError("Hely foglalt!");
        return;
      }

      if (!isFarmlandPlaceable(gridX, gridY, selectedFarmId)) {
        showError("A szántóföldet a farm vagy más szántóföld mellé kell tenni!");
        return;
      }

      if (currentPlayer.money < FARMLAND_COST_PER_TILE) {
        showError("Nincs elég pénzed!");
        return;
      }

      setIsPlacingFarmland(false);
      const tileX = gridX;
      const tileY = gridY;

      setBuildings(prev => prev.map(b => 
        b.id === selectedFarmId ? {
          ...b,
          farmlandTiles: [...(b.farmlandTiles || []), {
            x: tileX,
            y: tileY,
            ownerId: currentPlayerId,
            cropType: CropType.None,
            cropProgress: 0,
            isUnderConstruction: true,
            buildProgress: 0
          }]
        } : b
      ));

      setPlayers(prev => prev.map(p => 
        p.id === currentPlayerId ? {
          ...p,
          money: p.money - FARMLAND_COST_PER_TILE
        } : p
      ));

      if (sfxPlayerRef.current) sfxPlayerRef.current.playSfx("construction-02", true);

      let prog = 0;
      const inv = setInterval(() => {
        prog += 20;
        setBuildings(prev => prev.map(b => 
          b.id === selectedFarmId ? {
            ...b,
            farmlandTiles: b.farmlandTiles?.map(t => 
              t.x === tileX && t.y === tileY ? { ...t, buildProgress: prog } : t
            )
          } : b
        ));

        if (prog >= 100) {
          clearInterval(inv);
          if (sfxPlayerRef.current) sfxPlayerRef.current.stopAllSfx();
          setBuildings(prev => prev.map(b => 
            b.id === selectedFarmId ? {
              ...b,
              farmlandTiles: b.farmlandTiles?.map(t => 
                t.x === tileX && t.y === tileY ? { ...t, isUnderConstruction: false } : t
              )
            } : b
          ));
          showSuccess("Szántóföld kész!");
        }
      }, 600);
    }
  };

  const handleBuildBuilding = (buildingName: string) => {
    const opt = availableBuildingOptions.find(o => o.name === buildingName);
    if (!opt) return;

    if (currentPlayer.money < opt.cost) {
      showError("Nincs elég pénzed!");
      return;
    }

    if (opt.woodCost && (currentPlayer.inventory.wood || 0) < opt.woodCost) {
      showError("Nincs elég fád!");
      return;
    }

    if (opt.brickCost && (currentPlayer.inventory.brick || 0) < opt.brickCost) {
      showError("Nincs elég téglád!");
      return;
    }

    if (opt.stoneCost && (currentPlayer.inventory.stone || 0) < opt.stoneCost) {
      showError("Nincs elég köved!");
      return;
    }

    setIsBuildMenuOpen(false);
    setBuildingToPlace(opt);
    setIsPlacingBuilding(true);
  };

  const handleRestock = useCallback((shopId: string, type: ProductType, quantity: number) => {
    setShopInventories(prev => {
      const items = prev[shopId] || [];
      const updatedItems = items.map(i => {
        if (i.type === type) {
          return {
            ...i,
            stock: i.stock + quantity,
            orderedStock: Math.max(0, i.orderedStock - quantity),
            isDelivering: (i.orderedStock - quantity) > 0
          };
        }
        return i;
      });
      return {
        ...prev,
        [shopId]: updatedItems
      };
    });
  }, []);

  const handleBuyProduct = (shopId: string, type: ProductType, qty: number) => {
    const shop = buildings.find(b => b.id === shopId);
    if (!shop || shop.employeeIds.length === 0) {
      showError("A bolt zárva van! Nincs alkalmazott aki kiszolgáljon.");
      return;
    }

    const item = shopInventories[shopId]?.find(i => i.type === type);
    if (!item || item.stock < qty) return;

    if (currentPlayerId !== shop.ownerId && currentPlayer.money < item.sellPrice * qty) {
      showError("Nincs elég pénzed!");
      return;
    }

    setPlayers(prev => prev.map(p => {
      if (p.id === currentPlayerId) {
        const cost = (p.id === shop.ownerId) ? 0 : item.sellPrice * qty;
        return {
          ...p,
          money: Math.max(0, p.money - cost),
          inventory: {
            ...p.inventory,
            [type]: (p.inventory[type] || 0) + qty
          }
        };
      }
      return p;
    }));

    setShopInventories(prev => ({
      ...prev,
      [shopId]: prev[shopId].map(i => 
        i.type === type ? { ...i, stock: i.stock - qty } : i
      )
    }));
  };

  const handleUpgradeShop = (shopId: string) => {
    const shop = buildings.find(b => b.id === shopId);
    if (!shop) return;

    const currentLevel = shop.level || 1;
    const upgradeCost = currentLevel === 1 ? 1500 : 4000;

    if (currentPlayer.money < upgradeCost) {
      showError("Nincs elég pénzed a fejlesztésre!");
      return;
    }

    setPlayers(prev => prev.map(p => 
      p.id === currentPlayerId ? {
        ...p,
        money: p.money - upgradeCost
      } : p
    ));

    setBuildings(prev => prev.map(b => 
      b.id === shopId ? { ...b, level: currentLevel + 1 } : b
    ));

    addTransaction(currentPlayerId, "expense", `Bolt fejlesztés: ${shop.name} (Lvl ${currentLevel+1})`, upgradeCost);
    showSuccess(`Bolt sikeresen fejlesztve a ${currentLevel + 1}. szintre!`);
  };

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
  }, [shopInventories, handleRestock]);

  const handleNextPlayer = () => {
    const currentIndex = players.findIndex(p => p.id === currentPlayerId);
    const nextIndex = (currentIndex + 1) % players.length;
    setCurrentPlayerId(players[nextIndex].id);
  };

  const handlePrevPlayer = () => {
    const currentIndex = players.findIndex(p => p.id === currentPlayerId);
    const prevIndex = (currentIndex - 1 + players.length) % players.length;
    setCurrentPlayerId(players[prevIndex].id);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-sidebar-primary-foreground">Tile-o-polis</h2>
        <PlayerSettings 
          playerName={currentPlayer.name} 
          onPlayerNameChange={(n) => setPlayers(prev => prev.map(p => 
            p.id === currentPlayerId ? { ...p, name: n } : p
          ))} 
        />
      </div>
      
      <div className="mb-4 space-y-2">
        <Label className="text-xs text-sidebar-foreground">Játékos váltása (Teszt mód):</Label>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevPlayer} className="h-8 w-8 shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select onValueChange={setCurrentPlayerId} value={currentPlayerId}>
            <SelectTrigger className="flex-1 bg-sidebar-accent border-sidebar-border h-8">
              <SelectValue placeholder="Válassz játékost" />
            </SelectTrigger>
            <SelectContent>
              {players.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleNextPlayer} className="h-8 w-8 shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <PlayerInfo 
        playerName={currentPlayer.name} 
        money={currentPlayer.money} 
        inventory={currentPlayer.inventory as any} 
        workplace={currentPlayer.workplace} 
        workplaceSalary={currentPlayer.workplaceSalary} 
        ownedBusinesses={buildings.filter(b => b.ownerId === currentPlayerId && b.type !== "house")} 
        playerSettingsButton={null} 
        nextTickProgress={tickProgress} 
        timeRemaining={secondsRemaining} 
      />
      
      <div className="mt-4 space-y-2">
        {!isPlacementMode ? (
          <Button onClick={() => setIsBuildMenuOpen(true)} className="w-full bg-blue-600 font-bold">
            Építés
          </Button>
        ) : (
          <Button 
            onClick={() => {
              setIsPlacingBuilding(false);
              setIsPlacingFarmland(false);
              setGhostBuildingCoords(null);
            }} 
            className="w-full bg-red-600 flex items-center justify-center"
          >
            <X className="mr-2 h-4 w-4" /> Mégsem
          </Button>
        )}
        <Button onClick={() => setIsMoneyHistoryOpen(true)} className="w-full bg-yellow-600 font-bold">
          Pénzmozgások
        </Button>
        <Button onClick={() => navigate('/')} className="w-full bg-gray-600">
          Főmenü
        </Button>
      </div>
      
      <MusicPlayer tracks={musicTracks} />
      <SfxPlayer ref={sfxPlayerRef} sfxUrls={sfxUrls} />
    </>
  );

  return (
    <MainLayout 
      sidebarContent={sidebarContent} 
      mainContent={
        <div ref={mainContentRef} className="flex flex-col h-full items-center justify-center relative overflow-hidden">
          <Map 
            buildings={buildings} 
            gridSize={MAP_GRID_SIZE} 
            cellSizePx={CELL_SIZE_PX} 
            onBuildingClick={handleBuildingClick} 
            isPlacingBuilding={isPlacingBuilding} 
            buildingToPlace={buildingToPlace} 
            ghostBuildingCoords={ghostBuildingCoords} 
            onGridMouseMove={(x,y) => setGhostBuildingCoords({x,y})} 
            onMapClick={handleMapClick} 
            currentPlayerId={currentPlayerId} 
            currentBuildingRotation={currentBuildingRotation} 
            isPlacingFarmland={isPlacingFarmland} 
            selectedFarmId={selectedFarmId} 
            onFarmlandClick={(fid, x, y) => {
              const b = buildings.find(b => b.id === fid);
              const tile = b?.farmlandTiles?.find(t => t.x === x && t.y === y);
              if (tile && tile.ownerId === currentPlayerId && !tile.isUnderConstruction)
                setFarmlandActionState({
                  isOpen: true,
                  farmId: fid,
                  tileX: x,
                  tileY: y,
                  cropType: tile.cropType,
                  cropProgress: tile.cropProgress || 0
                });
            }} 
            ghostFarmlandTiles={[]} 
            isPlacingRoad={false} 
            ghostRoadTiles={[]} 
            isDemolishingRoad={false} 
            mapOffsetX={mapOffsetX} 
            mapOffsetY={mapOffsetY} 
            isPlacementMode={isPlacementMode} 
          />
          
          {selectedBuilding && (
            <Dialog open={!!selectedBuilding} onOpenChange={() => setSelectedBuilding(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedBuilding.name}</DialogTitle>
                  <DialogDescription>
                    Tulajdonos: {players.find(p => p.id === selectedBuilding.ownerId)?.name || "Nincs"}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {selectedBuilding.type === "house" ? "Lakók:" : "Alkalmazottak:"}
                      </p>
                      <p className="text-lg font-bold">
                        {(selectedBuilding.type === "house" ? selectedBuilding.residentIds.length : selectedBuilding.employeeIds.length)} / {selectedBuilding.capacity}
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 text-sm rounded border border-dashed">
                    <strong>Névsor:</strong> {
                      (selectedBuilding.type === "house" ? selectedBuilding.residentIds : selectedBuilding.employeeIds)
                        .map(id => players.find(p => p.id === id)?.name)
                        .join(", ") || "Senki"
                    }
                  </div>
                  {selectedBuilding.type === "shop" && (
                    <Button 
                      onClick={() => {
                        setSelectedShopBuilding(selectedBuilding);
                        setIsShopMenuOpen(true);
                        setSelectedBuilding(null);
                      }} 
                      className="w-full bg-purple-600"
                    >
                      Bolt megnyitása
                    </Button>
                  )}
                  {selectedBuilding.type === "farm" && selectedBuilding.ownerId === currentPlayerId && (
                    <Button 
                      onClick={() => {
                        if (selectedBuilding.employeeIds.length === 0) {
                          showError("Nincs alkalmazott a farmon!");
                          return;
                        }
                        setSelectedFarmId(selectedBuilding.id);
                        setIsPlacingFarmland(true);
                        setSelectedBuilding(null);
                      }} 
                      className="w-full bg-green-600 font-bold"
                    >
                      {(selectedBuilding.farmlandTiles?.length || 0) > 0 ? "Szántóföld bővítése" : "Szántóföld létrehozása"}
                    </Button>
                  )}
                  {selectedBuilding.type === "mill" && (
                    <div className="bg-muted/50 p-2 text-sm rounded border border-dashed">
                      <div className="flex items-center gap-2 mb-1">
                        <Wheat className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold">Malom információk:</span>
                      </div>
                      <p className="text-xs">
                        Feldolgozás: 5 búza → 3 liszt<br />
                        Időtartam: 10 másodperc<br />
                        Szükséges: alkalmazott
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {selectedBuilding.type === "house" && !selectedBuilding.residentIds.includes(currentPlayerId) && (
                    <Button onClick={() => {
                      setBuildings(prev => prev.map(b => 
                        b.id === selectedBuilding.id ? { 
                          ...b, 
                          residentIds: [...b.residentIds, currentPlayerId],
                          renterId: currentPlayerId
                        } : b
                      ));
                      setSelectedBuilding(null);
                    }}>
                      Beköltözés
                    </Button>
                  )}
                  {selectedBuilding.salary && !selectedBuilding.employeeIds.includes(currentPlayerId) && currentPlayer.workplace === "Munkanélküli" && (
                    <Button onClick={() => {
                      setBuildings(prev => prev.map(b => 
                        b.id === selectedBuilding.id ? { 
                          ...b, 
                          employeeIds: [...b.employeeIds, currentPlayerId]
                        } : b
                      ));
                      setPlayers(prev => prev.map(p => 
                        p.id === currentPlayerId ? { 
                          ...p, 
                          workplace: selectedBuilding.name 
                        } : p
                      ));
                      setSelectedBuilding(null);
                    }}>
                      Munkába állás
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedBuilding(null)}>
                    Bezárás
                  </Button>
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
              shopLevel={selectedShopBuilding.level || 1}
              onAddItem={(it) => setShopInventories(prev => ({
                ...prev,
                [selectedShopBuilding.id]: [...(prev[selectedShopBuilding.id] || []), {
                  ...it,
                  stock: 0,
                  orderedStock: 0,
                  isDelivering: false
                }]
              }))}
              onOrderStock={(t, q) => {
                const it = shopInventories[selectedShopBuilding.id]?.find(i => i.type === t);
                if (it && currentPlayer.money >= it.wholesalePrice * q) {
                  setPlayers(prev => prev.map(p => 
                    p.id === currentPlayerId ? {
                      ...p,
                      money: p.money - (it.wholesalePrice * q)
                    } : p
                  ));
                  setShopInventories(prev => ({
                    ...prev,
                    [selectedShopBuilding.id]: prev[selectedShopBuilding.id].map(i => 
                      i.type === t ? {
                        ...i,
                        orderedStock: i.orderedStock + q,
                        isDelivering: true,
                        deliveryEta: Date.now() + i.deliveryTimeMs
                      } : i
                    )
                  }));
                }
              }}
              onUpdatePrice={(t, p) => setShopInventories(prev => ({
                ...prev,
                [selectedShopBuilding.id]: prev[selectedShopBuilding.id].map(i => 
                  i.type === t ? { ...i, sellPrice: p } : i
                )
              }))}
              onBuyProduct={(t, q) => handleBuyProduct(selectedShopBuilding.id, t, q)}
              onUpgrade={() => handleUpgradeShop(selectedShopBuilding.id)}
            />
          )}
          
          {farmlandActionState && (
            <FarmlandActionDialog 
              {...farmlandActionState}
              onClose={() => setFarmlandActionState(null)}
              playerMoney={currentPlayer.money}
              playerInventory={currentPlayer.inventory}
              onPlant={(fid, x, y, type) => {
                const farm = buildings.find(b => b.id === fid);
                if (!farm || farm.employeeIds.length === 0) {
                  showError("A farmon nincs alkalmazott a vetéshez!");
                  return;
                }
                
                const seedType = ProductType.WheatSeed;
                if ((currentPlayer.inventory[seedType] || 0) < 1) {
                  showError("Nincs búzavetőmagod! Vásárolj a boltban.");
                  return;
                }
                
                setPlayers(prev => prev.map(p => 
                  p.id === currentPlayerId ? {
                    ...p,
                    inventory: {
                      ...p.inventory,
                      [seedType]: p.inventory[seedType] - 1
                    }
                  } : p
                ));
                
                setBuildings(prev => prev.map(b => 
                  b.id === fid ? {
                    ...b,
                    farmlandTiles: b.farmlandTiles?.map(t => 
                      t.x === x && t.y === y ? { ...t, cropType: type, cropProgress: 0 } : t
                    )
                  } : b
                ));
                
                showSuccess("Búza elvetve!");
              }}
              onHarvest={(fid, x, y) => {
                const farm = buildings.find(b => b.id === fid);
                if (!farm || farm.employeeIds.length === 0) {
                  showError("Nincs alkalmazott az aratáshoz!");
                  return;
                }
                
                setBuildings(prev => prev.map(b => 
                  b.id === fid ? {
                    ...b,
                    farmlandTiles: b.farmlandTiles?.map(t => 
                      t.x === x && t.y === y ? { ...t, cropType: CropType.None, cropProgress: 0 } : t
                    )
                  } : b
                ));
                
                setPlayers(prev => prev.map(p => 
                  p.id === currentPlayerId ? {
                    ...p,
                    inventory: {
                      ...p.inventory,
                      wheat: (p.inventory.wheat || 0) + 10
                    }
                  } : p
                ));
                
                showSuccess("Betakarítva 10 búza!");
              }}
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
        </div>
      } 
    />
  );
};

export default Game;