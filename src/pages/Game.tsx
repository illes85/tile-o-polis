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
import { RotateCw, ChevronLeft, ChevronRight, Sprout, Coins, Building as BuildingIcon, Route, Wrench, Trash2, ChevronUp, ChevronDown, X, Users, Wheat, Factory, Clock, DollarSign, Popcorn } from "lucide-react";
import { allProducts, ProductType, getProductByType } from "@/utils/products";
import FarmlandActionDialog from "@/components/FarmlandActionDialog";
import { CropType, FarmlandTile } from "@/components/Building";
import ShopMenu from "@/components/ShopMenu";
import MarketplaceMenu from "@/components/MarketplaceMenu";
import { useNavigate, useLocation } from "react-router-dom";
import MoneyHistory, { Transaction } from "@/components/MoneyHistory";

const MAP_GRID_SIZE = 40;
const CELL_SIZE_PX = 32; // ÁTÁLLÍTVA 32x32-re
const RENT_INTERVAL_MS = 30000;
const BUILD_HOUSE_COST = 500;
const BUILD_HOUSE_DURATION_MS = 10000;
const OFFICE_SALARY_PER_INTERVAL = 10;
const DEMOLISH_REFUND_PERCENTAGE = 0.5;
const WHEAT_GROW_TIME_MS = 60000;
const CORN_GROW_TIME_MS = 90000; // ÚJ: Kukorica növekedési idő
const MILL_WHEAT_CONSUMPTION_PER_PROCESS = 5;
const MILL_FLOUR_PRODUCTION_PER_PROCESS = 3;
const MILL_CORN_CONSUMPTION_PER_PROCESS = 4; // ÚJ: Kukorica fogyasztás
const MILL_CORNFLOUR_PRODUCTION_PER_PROCESS = 3; // ÚJ: Kukoricaliszt termelés
const MILL_PROCESSING_TIME_MS = 10000;
const MILL_WHEAT_BUY_PRICE = 5;
const POPCORN_CORN_CONSUMPTION = 2; // Popcorn árus fogyasztás
const POPCORN_PRODUCTION = 5; // Popcorn árus termelés
const POPCORN_PROCESSING_TIME_MS = 5000;
const ROAD_STONE_COST_PER_TILE = 1;

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

export interface MarketOffer {
  id: string;
  sellerId: string;
  sellerName: string;
  sellingType: ProductType | 'money';
  sellingQuantity: number;
  buyingType: ProductType | 'money';
  buyingQuantity: number;
}

interface MillProcess {
  id: string;
  millId: string;
  startTime: number;
  duration: number;
  wheatConsumed: number;
  flourProduced: number;
}

interface PopcornProcess {
  id: string;
  standId: string;
  startTime: number;
  duration: number;
  cornConsumed: number;
  popcornProduced: number;
}

const availableBuildingOptions: BuildingOption[] = [
  { type: "house", category: "residential", name: "Sátor", cost: 200, duration: 4000, width: 2, height: 1, rentalPrice: 0, capacity: 1 },
  { type: "house", category: "residential", name: "Házikó", cost: BUILD_HOUSE_COST, duration: BUILD_HOUSE_DURATION_MS, width: 2, height: 2, rentalPrice: 10, capacity: 2 },
  { type: "house", category: "residential", name: "Normál Ház", cost: 750, duration: 15000, width: 3, height: 2, rentalPrice: 15, capacity: 3 },
  { type: "house", category: "residential", name: "Kádárkocka", cost: 1200, duration: 20000, width: 3, height: 3, rentalPrice: 25, capacity: 4 },
  { type: "house", category: "residential", name: "Családi Ház", cost: 1800, duration: 25000, width: 4, height: 2, rentalPrice: 35, capacity: 5 },
  { type: "house", category: "residential", name: "Villa (kétszintes)", cost: 2500, duration: 30000, width: 3, height: 3, rentalPrice: 50, capacity: 6 },
  { type: "house", category: "residential", name: "Nagy Villa", cost: 3500, duration: 40000, width: 4, height: 4, rentalPrice: 70, capacity: 8 },
  { type: "office", category: "business", name: "Közszolgálati Iroda", cost: 1000, duration: 15000, width: 3, height: 8, salary: OFFICE_SALARY_PER_INTERVAL, capacity: 4 },
  { type: "forestry", category: "business", name: "Erdészház", cost: 850, woodCost: 5, duration: 12000, width: 4, height: 4, salary: 8, capacity: 1 },
  { type: "farm", category: "business", name: "Farm", cost: 1000, brickCost: 5, woodCost: 3, duration: 10000, width: 4, height: 4, salary: 5, capacity: 2 },
  { type: "office", category: "business", name: "Polgármesteri Hivatal", cost: 2500, woodCost: 10, brickCost: 15, duration: 30000, width: 4, height: 3, salary: 20, capacity: 5 },
  { type: "shop", category: "business", name: "Bolt", cost: 1500, woodCost: 8, brickCost: 10, duration: 20000, width: 3, height: 3, salary: 10, capacity: 3 },
  { type: "mill", category: "business", name: "Malom", cost: 2000, woodCost: 10, brickCost: 15, stoneCost: 5, duration: 25000, width: 4, height: 4, salary: 15, capacity: 3 },
  { type: "office", category: "business", name: "Piac", cost: 3000, woodCost: 15, brickCost: 15, duration: 35000, width: 5, height: 5, salary: 25, capacity: 5 },
  { type: "popcorn_stand", category: "business", name: "Popcorn Árus", cost: 500, woodCost: 2, duration: 8000, width: 2, height: 2, salary: 5, capacity: 1 }, // ÚJ ÉPÜLET
];

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialPlayer, allPlayers, buildings: initialBuildingsState, currentPlayerId: initialCurrentPlayerId, transactions: initialTransactions } = (location.state || {}) as { initialPlayer?: Player, allPlayers?: Player[], buildings?: BuildingData[], currentPlayerId?: string, transactions?: Transaction[] };

  const [players, setPlayers] = useState<Player[]>(allPlayers || [
    { id: "player-1", name: "Játékos 1", money: 2000, inventory: { potato: 3, water: 2, wood: 10, brick: 5, stone: 0, hoe: 0, tractor: 0, wheat: 0, [ProductType.WheatSeed]: 5, flour: 0, clothes: 0, [ProductType.Corn]: 0, [ProductType.CornFlour]: 0, [ProductType.Popcorn]: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-test", name: "Teszt Játékos", money: 50000, inventory: { [ProductType.WheatSeed]: 100, wheat: 50, wood: 500, stone: 100, flour: 20, clothes: 5, [ProductType.Corn]: 50, [ProductType.CornFlour]: 10, [ProductType.Popcorn]: 5 }, workplace: "Tesztelő", workplaceSalary: 0 },
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
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [marketOffers, setMarketOffers] = useState<MarketOffer[]>([]);
  const [mapOffsetX, setMapOffsetX] = useState(0);
  const [mapOffsetY, setMapOffsetY] = useState(0);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const sfxPlayerRef = useRef<SfxPlayerRef>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false); // ÚJ: Shift állapot
  const [isPlacingRoad, setIsPlacingRoad] = useState(false); // ÚJ: Útépítés mód
  const [ghostRoadTiles, setGhostRoadTiles] = useState<{ x: number; y: number }[]>([]); // ÚJ: Útépítés húzott csempék

  const isPlacementMode = isPlacingBuilding || isPlacingFarmland || isPlacingRoad;

  // Malom és Popcorn folyamatok
  const [millProcesses, setMillProcesses] = useState<MillProcess[]>([]);
  const [popcornProcesses, setPopcornProcesses] = useState<PopcornProcess[]>([]); // ÚJ: Popcorn folyamatok

  // --- Event Listeners a Shift gombhoz ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftPressed(true);
      if (event.key === 'Escape' && isPlacementMode) {
        setIsPlacingBuilding(false);
        setIsPlacingFarmland(false);
        setIsPlacingRoad(false);
        setGhostBuildingCoords(null);
        setIsDragging(false);
        setDraggedTiles([]);
        setGhostRoadTiles([]);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlacementMode]);
  // ---------------------------------------

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
    const newTransactions: Transaction[] = [];
    const playerBalanceChanges: Record<string, number> = {};
    players.forEach(p => playerBalanceChanges[p.id] = 0);

    buildings.forEach(building => {
      if (building.type === "house" && building.renterId && building.ownerId && building.rentalPrice) {
        const tenant = players.find(p => p.id === building.renterId);
        if (tenant && tenant.money >= building.rentalPrice) {
          playerBalanceChanges[building.renterId] -= building.rentalPrice;
          playerBalanceChanges[building.ownerId] += building.rentalPrice;
          newTransactions.push({ id: `tx-${Date.now()}-${Math.random()}-rent-exp`, playerId: building.renterId, type: "expense", description: `Bérleti díj: ${building.name}`, amount: building.rentalPrice, timestamp: Date.now() });
          newTransactions.push({ id: `tx-${Date.now()}-${Math.random()}-rent-inc`, playerId: building.ownerId, type: "income", description: `Lakbér: ${building.name}`, amount: building.rentalPrice, timestamp: Date.now() });
        }
      }

      if (building.salary && building.employeeIds.length > 0) {
        building.employeeIds.forEach(empId => {
          playerBalanceChanges[empId] += building.salary!;
          newTransactions.push({ id: `tx-${Date.now()}-${Math.random()}-salary`, playerId: empId, type: "income", description: `Fizetés: ${building.name}`, amount: building.salary!, timestamp: Date.now() });
        });
      }
    });

    setPlayers(prevPlayers => prevPlayers.map(p => ({
      ...p,
      money: Math.max(0, p.money + (playerBalanceChanges[p.id] || 0))
    })));
    
    setTransactions(prev => [...prev, ...newTransactions]);
    
  }, [buildings, players]);

  // Malom feldolgozási időzítő (Progress bar és befejezés)
  useEffect(() => {
    const processTimer = setInterval(() => {
      const now = Date.now();
      let completedMillProcesses: MillProcess[] = [];
      let activeMillProcesses: MillProcess[] = [];
      let completedPopcornProcesses: PopcornProcess[] = [];
      let activePopcornProcesses: PopcornProcess[] = [];

      millProcesses.forEach(process => {
        if (process.startTime + process.duration <= now) {
          completedMillProcesses.push(process);
        } else {
          activeMillProcesses.push(process);
        }
      });
      
      popcornProcesses.forEach(process => {
        if (process.startTime + process.duration <= now) {
          completedPopcornProcesses.push(process);
        } else {
          activePopcornProcesses.push(process);
        }
      });

      if (completedMillProcesses.length > 0) {
        setMillProcesses(activeMillProcesses);

        setBuildings(prevBuildings => 
          prevBuildings.map(b => {
            if (b.type === 'mill' && b.ownerId) {
              const completedForThisMill = completedMillProcesses.filter(p => p.millId === b.id);
              if (completedForThisMill.length > 0) {
                const totalFlour = completedForThisMill.reduce((sum, p) => sum + p.flourProduced, 0);
                
                showSuccess(`${b.name}: ${totalFlour} liszt előállítva!`);
                
                return {
                  ...b,
                  millInventory: {
                    wheat: b.millInventory?.wheat || 0,
                    flour: (b.millInventory?.flour || 0) + totalFlour
                  }
                };
              }
            }
            return b;
          })
        );
      }
      
      if (completedPopcornProcesses.length > 0) {
        setPopcornProcesses(activePopcornProcesses);

        setBuildings(prevBuildings => 
          prevBuildings.map(b => {
            if (b.type === 'popcorn_stand' && b.ownerId) {
              const completedForThisStand = completedPopcornProcesses.filter(p => p.standId === b.id);
              if (completedForThisStand.length > 0) {
                const totalPopcorn = completedForThisStand.reduce((sum, p) => sum + p.popcornProduced, 0);
                
                showSuccess(`${b.name}: ${totalPopcorn} popcorn előállítva!`);
                
                return {
                  ...b,
                  popcornStandInventory: {
                    corn: b.popcornStandInventory?.corn || 0,
                    popcorn: (b.popcornStandInventory?.popcorn || 0) + totalPopcorn
                  }
                };
              }
            }
            return b;
          })
        );
      }
    }, 1000);

    return () => clearInterval(processTimer);
  }, [millProcesses, popcornProcesses]);


  // Gazdasági ciklus időzítő (Stabilizált setInterval)
  useEffect(() => {
    const interval = setInterval(() => {
      setMsUntilNextTick(prev => {
        const newPrev = prev - 1000;
        
        if (newPrev <= 0) {
          processEconomyTick();
          return RENT_INTERVAL_MS;
        }
        return newPrev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [processEconomyTick]);


  // Növekedési időzítő
  useEffect(() => {
    const growthTimer = setInterval(() => {
      setBuildings(prevBuildings => 
        prevBuildings.map(b => {
          if (b.type === 'farm' && b.farmlandTiles) {
            const updatedTiles = b.farmlandTiles.map(ft => {
              let progressIncrease = 0;
              let maxProgress = 100;
              let growTime = 0;

              if (ft.cropType === CropType.Wheat) {
                growTime = WHEAT_GROW_TIME_MS;
              } else if (ft.cropType === CropType.Corn) {
                growTime = CORN_GROW_TIME_MS;
              }

              if (growTime > 0 && (ft.cropProgress || 0) < maxProgress) {
                progressIncrease = (1000 / growTime) * 100;
                return {
                  ...ft,
                  cropProgress: Math.min(maxProgress, (ft.cropProgress || 0) + progressIncrease)
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

  const tickProgress = 100 - ((msUntilNextTick / RENT_INTERVAL_MS) * 100); // Progress bar növekszik, ahogy az idő telik
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
    
    if (building?.type === 'office' && building.name === 'Piac') {
      setIsMarketplaceOpen(true);
    }
  };

  // Segédfüggvény a húzott csempék kiszámításához
  const getTilesInDrag = (start: { x: number; y: number }, end: { x: number; y: number }): { x: number; y: number }[] => {
    const tiles: { x: number; y: number }[] = [];
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    // Egyszerű téglalap alakú kijelölés
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        tiles.push({ x, y });
      }
    }
    return tiles;
  };

  const handleMapMouseDown = (gridX: number, gridY: number) => {
    if (isPlacingFarmland && selectedFarmId) {
      setIsDragging(true);
      setDragStartCoords({ x: gridX, y: gridY });
      setDraggedTiles([{ x: gridX, y: gridY }]);
    } else if (isPlacingRoad) {
      setIsDragging(true);
      setDragStartCoords({ x: gridX, y: gridY });
      setGhostRoadTiles([{ x: gridX, y: gridY }]);
    }
  };

  const handleMapMouseMove = (gridX: number, gridY: number) => {
    setGhostBuildingCoords({ x: gridX, y: gridY }); // Mindig frissítjük a szellem épület pozícióját

    if (isDragging) {
      if (isPlacingFarmland && selectedFarmId && dragStartCoords) {
        const currentDraggedTiles = getTilesInDrag(dragStartCoords, { x: gridX, y: gridY });
        setDraggedTiles(currentDraggedTiles);
      } else if (isPlacingRoad && dragStartCoords) {
        const currentDraggedTiles = getTilesInDrag(dragStartCoords, { x: gridX, y: gridY });
        setGhostRoadTiles(currentDraggedTiles);
      }
    }
  };

  const handleMapMouseUp = (gridX: number, gridY: number) => {
    if (isDragging) {
      if (isPlacingFarmland && selectedFarmId && dragStartCoords) {
        // Farmland lerakás logikája (marad a régi)
        // ... (Farmland logic)
        
        const finalDraggedTiles = getTilesInDrag(dragStartCoords, { x: gridX, y: gridY });
        
        const farm = buildings.find(b => b.id === selectedFarmId);
        if (!farm || farm.employeeIds.length === 0) {
          showError("A farm zárva van! Nincs alkalmazott.");
          setDraggedTiles([]);
          setIsDragging(false);
          return;
        }

        const placeableTiles = finalDraggedTiles.filter(tile => 
          !isCellOccupied(tile.x, tile.y, buildings) &&
          isFarmlandPlaceable(tile.x, tile.y, selectedFarmId)
        );

        if (placeableTiles.length === 0) {
          showError("Nem lehet ide szántóföldet tenni, vagy a hely foglalt!");
          setDraggedTiles([]);
          setIsDragging(false);
          return;
        }

        const totalCost = placeableTiles.length * FARMLAND_COST_PER_TILE;
        if (currentPlayer.money < totalCost) {
          showError(`Nincs elég pénzed! Szükséges: ${totalCost} pénz.`);
          setDraggedTiles([]);
          setIsDragging(false);
          return;
        }

        setPlayers(prev => prev.map(p => 
          p.id === currentPlayerId ? {
            ...p,
            money: p.money - totalCost
          } : p
        ));
        
        addTransaction(currentPlayerId, "expense", `Szántóföld vásárlás (${placeableTiles.length} csempe)`, totalCost);


        setBuildings(prev => prev.map(b => {
          if (b.id === selectedFarmId) {
            const newFarmlandTiles = placeableTiles.map(tile => ({
              x: tile.x,
              y: tile.y,
              ownerId: currentPlayerId,
              cropType: CropType.None,
              cropProgress: 0,
              isUnderConstruction: true,
              buildProgress: 0
            }));
            return {
              ...b,
              farmlandTiles: [...(b.farmlandTiles || []), ...newFarmlandTiles]
            };
          }
          return b;
        }));

        if (sfxPlayerRef.current) sfxPlayerRef.current.playSfx("construction-02", true);

        placeableTiles.forEach(tile => {
          let prog = 0;
          const inv = setInterval(() => {
            prog += 20;
            setBuildings(prev => prev.map(b => 
              b.id === selectedFarmId ? {
                ...b,
                farmlandTiles: b.farmlandTiles?.map(t => 
                  t.x === tile.x && t.y === tile.y ? { ...t, buildProgress: prog } : t
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
                    t.x === tile.x && t.y === tile.y ? { ...t, isUnderConstruction: false } : t
                  )
                } : b
              ));
              showSuccess(`Szántóföld kész: (${tile.x}, ${tile.y})!`);
            }
          }, 600);
        });

        setDraggedTiles([]);
        setIsPlacingFarmland(isShiftPressed); // Folytatás, ha Shift le van nyomva
        setIsDragging(false);
        
      } else if (isPlacingRoad && dragStartCoords) {
        // Útépítés logikája
        const finalDraggedTiles = getTilesInDrag(dragStartCoords, { x: gridX, y: gridY });
        
        const placeableRoads = finalDraggedTiles.filter(tile => 
          !isCellOccupied(tile.x, tile.y, buildings)
        );

        if (placeableRoads.length === 0) {
          showError("Nem lehet ide utat építeni, vagy a hely foglalt!");
          setGhostRoadTiles([]);
          setIsDragging(false);
          return;
        }

        const totalCost = placeableRoads.length * ROAD_COST_PER_TILE;
        const totalStoneCost = placeableRoads.length * ROAD_STONE_COST_PER_TILE;

        if (currentPlayer.money < totalCost || (currentPlayer.inventory.stone || 0) < totalStoneCost) {
          showError(`Nincs elég pénz vagy kő! Szükséges: ${totalCost} pénz és ${totalStoneCost} kő.`);
          setGhostRoadTiles([]);
          setIsDragging(false);
          return;
        }

        setPlayers(prev => prev.map(p => 
          p.id === currentPlayerId ? {
            ...p,
            money: p.money - totalCost,
            inventory: {
              ...p.inventory,
              stone: (p.inventory.stone || 0) - totalStoneCost
            }
          } : p
        ));
        
        addTransaction(currentPlayerId, "expense", `Útépítés (${placeableRoads.length} csempe)`, totalCost);

        const newRoads: BuildingData[] = placeableRoads.map(tile => ({
          id: `road-${Date.now()}-${tile.x}-${tile.y}`,
          name: "Út",
          x: tile.x,
          y: tile.y,
          width: 1,
          height: 1,
          type: "road",
          capacity: 0,
          ownerId: currentPlayerId,
          residentIds: [],
          employeeIds: [],
          isUnderConstruction: false, // Utat azonnal lerakjuk
          rotation: 0,
        }));

        setBuildings(prev => [...prev, ...newRoads]);
        showSuccess(`${placeableRoads.length} út csempe lerakva!`);

        setGhostRoadTiles([]);
        setIsPlacingRoad(isShiftPressed); // Folytatás, ha Shift le van nyomva
        setIsDragging(false);

      }
    } else if (isPlacingBuilding && buildingToPlace && ghostBuildingCoords) {
      // Egyszeri épület lerakás (ha nem volt húzás)
      handleMapMouseUpForSingleBuilding(gridX, gridY);
    }
  };
  
  const handleMapMouseUpForSingleBuilding = (gridX: number, gridY: number) => {
    if (!buildingToPlace) return;

    if (isCellOccupied(gridX, gridY, buildings)) {
      showError("Hely foglalt!");
      return;
    }

    if (currentPlayer.money < buildingToPlace.cost) {
      showError("Nincs elég pénzed!");
      return;
    }

    // ... (A többi építési logika, ami a Game.tsx-ben volt)
    
    setIsPlacingBuilding(isShiftPressed); // Folytatás, ha Shift le van nyomva
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
    
    addTransaction(currentPlayerId, "expense", `Építés: ${buildingToPlace.name}`, buildingToPlace.cost);


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
      level: 1,
      millInventory: buildingToPlace.type === "mill" ? { wheat: 0, flour: 0 } : undefined,
      popcornStandInventory: buildingToPlace.type === "popcorn_stand" ? { corn: 0, popcorn: 0 } : undefined,
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
  };

  const handleStartRoadPlacement = (officeId: string) => {
    const office = buildings.find(b => b.id === officeId);
    if (!office || office.name !== 'Polgármesteri Hivatal' || office.ownerId !== currentPlayerId) return;

    setSelectedBuilding(null);
    setIsPlacingRoad(true);
    showSuccess("Útépítési mód aktiválva. Húzd az egeret az út lerakásához! (Shift: folyamatos)");
  };

  const handleStartPopcornProcess = (standId: string, quantity: number) => {
    const stand = buildings.find(b => b.id === standId);
    if (!stand || !stand.ownerId || stand.employeeIds.length === 0) {
      showError("A Popcorn Árus zárva van, vagy nincs alkalmazott!");
      return;
    }

    const requiredCorn = quantity * POPCORN_CORN_CONSUMPTION;
    const producedPopcorn = quantity * POPCORN_PRODUCTION;
    const totalDuration = quantity * POPCORN_PROCESSING_TIME_MS;

    const currentCorn = stand.popcornStandInventory?.corn || 0;

    if (currentCorn < requiredCorn) {
      showError(`Nincs elég kukorica a készletben! Szükséges: ${requiredCorn} db.`);
      return;
    }

    // 1. Kukorica levonása a készletből
    setBuildings(prev => prev.map(b => {
      if (b.id === standId && b.type === 'popcorn_stand') {
        return {
          ...b,
          popcornStandInventory: {
            corn: currentCorn - requiredCorn,
            popcorn: b.popcornStandInventory?.popcorn || 0,
          }
        };
      }
      return b;
    }));

    // 2. Feldolgozási folyamat elindítása
    const newProcess: PopcornProcess = {
      id: `popcorn-proc-${Date.now()}-${Math.random()}`,
      standId: standId,
      startTime: Date.now(),
      duration: totalDuration,
      cornConsumed: requiredCorn,
      popcornProduced: producedPopcorn,
    };

    setPopcornProcesses(prev => [...prev, newProcess]);
    showSuccess(`${quantity} adag popcorn készítése elindult (${totalDuration / 1000} mp).`);
  };

  // ... (többi logika)

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
            onGridMouseMove={handleMapMouseMove} 
            onMapClick={handleMapMouseUp}
            onMapMouseDown={handleMapMouseDown}
            onMapMouseUp={handleMapMouseUp}
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
            ghostFarmlandTiles={draggedTiles}
            isPlacingRoad={isPlacingRoad} 
            ghostRoadTiles={ghostRoadTiles} 
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
                  {/* Bérleti díj / Fizetés megjelenítése */}
                  {(selectedBuilding.rentalPrice !== undefined || selectedBuilding.salary !== undefined) && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                      {selectedBuilding.rentalPrice !== undefined && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold flex items-center"><DollarSign className="h-4 w-4 mr-1 text-red-500" /> Bérleti díj (Lakóknak):</span>
                          <span className="font-bold text-red-500">{selectedBuilding.rentalPrice} pénz/ciklus</span>
                        </div>
                      )}
                      {selectedBuilding.salary !== undefined && (
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="font-semibold flex items-center"><DollarSign className="h-4 w-4 mr-1 text-green-500" /> Fizetés (Alkalmazottaknak):</span>
                          <span className="font-bold text-green-500">{selectedBuilding.salary} pénz/ciklus</span>
                        </div>
                      )}
                    </div>
                  )}
                  
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
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-2 text-sm rounded border border-dashed">
                        <div className="flex items-center gap-2 mb-1">
                          <Factory className="h-4 w-4 text-amber-600" />
                          <span className="font-semibold">Malom információk:</span>
                        </div>
                        <p className="text-xs">
                          Búza feldolgozás: {MILL_WHEAT_CONSUMPTION_PER_PROCESS} búza → {MILL_FLOUR_PRODUCTION_PER_PROCESS} liszt<br />
                          Kukorica feldolgozás: {MILL_CORN_CONSUMPTION_PER_PROCESS} kukorica → {MILL_CORNFLOUR_PRODUCTION_PER_PROCESS} kukoricaliszt<br />
                          Időtartam: {MILL_PROCESSING_TIME_MS / 1000} másodperc<br />
                          Szükséges: alkalmazott
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <p>Búza készlet: **{selectedBuilding.millInventory?.wheat || 0}** db</p>
                            <p>Liszt készlet: **{selectedBuilding.millInventory?.flour || 0}** db</p>
                        </div>
                        {selectedBuilding.employeeIds.length === 0 && (
                          <p className="text-red-500 text-xs mt-2">Nincs alkalmazott a malomban, a feldolgozás szünetel!</p>
                        )}
                      </div>
                      
                      {/* Búza feldolgozás indítása (csak tulajdonosnak) */}
                      {selectedBuilding.ownerId === currentPlayerId && (
                        <div className="p-3 border rounded-md bg-yellow-50/50 dark:bg-yellow-900/20 space-y-2">
                          <h4 className="font-semibold flex items-center">
                            <Wheat className="h-4 w-4 mr-2 text-amber-700" /> Feldolgozás indítása
                          </h4>
                          
                          {/* Búza -> Liszt */}
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              defaultValue={1} 
                              min={1} 
                              max={Math.floor((selectedBuilding.millInventory?.wheat || 0) / MILL_WHEAT_CONSUMPTION_PER_PROCESS)}
                              id="mill-wheat-qty"
                              className="w-20 h-8"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => {
                                const qty = Number((document.getElementById('mill-wheat-qty') as HTMLInputElement)?.value || 1);
                                handleStartMillProcess(selectedBuilding.id, qty);
                                setSelectedBuilding(null);
                              }}
                              disabled={selectedBuilding.employeeIds.length === 0 || (selectedBuilding.millInventory?.wheat || 0) < MILL_WHEAT_CONSUMPTION_PER_PROCESS}
                            >
                              Búza → Liszt
                            </Button>
                          </div>
                          <p className="text-xs mt-1 text-muted-foreground">Feldolgozható búza adag: {Math.floor((selectedBuilding.millInventory?.wheat || 0) / MILL_WHEAT_CONSUMPTION_PER_PROCESS)}</p>
                        </div>
                      )}

                      {/* Aktív folyamatok */}
                      {millProcesses.filter(p => p.millId === selectedBuilding.id).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center">
                            <Clock className="h-4 w-4 mr-2" /> Aktív folyamatok:
                          </h4>
                          {millProcesses.filter(p => p.millId === selectedBuilding.id).map(process => {
                            const elapsed = Date.now() - process.startTime;
                            const progress = Math.min(100, (elapsed / process.duration) * 100);
                            const remainingTime = Math.ceil((process.duration - elapsed) / 1000);
                            return (
                              <div key={process.id} className="border p-2 rounded text-xs">
                                <p className="font-medium">
                                  {process.wheatConsumed} búza → {process.flourProduced} liszt
                                </p>
                                <Progress value={progress} className="h-2 mt-1" indicatorColor="bg-amber-500" />
                                <p className="text-right text-muted-foreground mt-1">
                                  {remainingTime > 0 ? `${remainingTime} mp hátra` : 'Befejezés...'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Búza eladás a malomnak (mindenki számára) */}
                      <div className="p-3 border rounded-md bg-green-50/50 dark:bg-green-900/20">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Wheat className="h-4 w-4 mr-2 text-amber-700" /> Búza eladása a malomnak
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          A malom megvásárolja a búzát tőled. Ár: {MILL_WHEAT_BUY_PRICE} pénz/db.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            defaultValue={1} 
                            min={1} 
                            max={currentPlayer.inventory.wheat || 0}
                            id="wheat-sell-qty-public"
                            className="w-20 h-8"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const qty = Number((document.getElementById('wheat-sell-qty-public') as HTMLInputElement)?.value || 1);
                              handleSellWheatToMill(selectedBuilding.id, qty);
                              setSelectedBuilding(null);
                            }}
                            disabled={(currentPlayer.inventory.wheat || 0) === 0}
                          >
                            Eladás
                          </Button>
                        </div>
                        <p className="text-xs mt-1">Készleten: {currentPlayer.inventory.wheat || 0} db</p>
                      </div>
                    </div>
                  )}
                  {selectedBuilding.type === 'office' && selectedBuilding.name === 'Polgármesteri Hivatal' && selectedBuilding.ownerId === currentPlayerId && (
                    <Button 
                      onClick={() => handleStartRoadPlacement(selectedBuilding.id)} 
                      className="w-full bg-gray-600"
                    >
                      <Route className="h-4 w-4 mr-2" /> Útépítés (Kő: {ROAD_STONE_COST_PER_TILE} / csempe)
                    </Button>
                  )}
                  {selectedBuilding.type === 'office' && selectedBuilding.name === 'Piac' && (
                    <Button 
                      onClick={() => {
                        setIsMarketplaceOpen(true);
                        setSelectedBuilding(null);
                      }} 
                      className="w-full bg-indigo-600"
                    >
                      Piac megnyitása
                    </Button>
                  )}
                  {selectedBuilding.type === 'popcorn_stand' && (
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-2 text-sm rounded border border-dashed">
                        <div className="flex items-center gap-2 mb-1">
                          <Popcorn className="h-4 w-4 text-red-500" />
                          <span className="font-semibold">Popcorn Árus információk:</span>
                        </div>
                        <p className="text-xs">
                          Feldolgozás: {POPCORN_CORN_CONSUMPTION} kukorica → {POPCORN_PRODUCTION} popcorn<br />
                          Időtartam: {POPCORN_PROCESSING_TIME_MS / 1000} másodperc<br />
                          Szükséges: alkalmazott
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <p>Kukorica készlet: **{selectedBuilding.popcornStandInventory?.corn || 0}** db</p>
                            <p>Popcorn készlet: **{selectedBuilding.popcornStandInventory?.popcorn || 0}** db</p>
                        </div>
                        {selectedBuilding.employeeIds.length === 0 && (
                          <p className="text-red-500 text-xs mt-2">Nincs alkalmazott, a termelés szünetel!</p>
                        )}
                      </div>
                      
                      {/* Kukorica feldolgozás indítása (csak tulajdonosnak) */}
                      {selectedBuilding.ownerId === currentPlayerId && (
                        <div className="p-3 border rounded-md bg-yellow-50/50 dark:bg-yellow-900/20 space-y-2">
                          <h4 className="font-semibold flex items-center">
                            <Popcorn className="h-4 w-4 mr-2 text-red-700" /> Popcorn készítés indítása
                          </h4>
                          
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              defaultValue={1} 
                              min={1} 
                              max={Math.floor((selectedBuilding.popcornStandInventory?.corn || 0) / POPCORN_CORN_CONSUMPTION)}
                              id="popcorn-qty"
                              className="w-20 h-8"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => {
                                const qty = Number((document.getElementById('popcorn-qty') as HTMLInputElement)?.value || 1);
                                handleStartPopcornProcess(selectedBuilding.id, qty);
                                setSelectedBuilding(null);
                              }}
                              disabled={selectedBuilding.employeeIds.length === 0 || (selectedBuilding.popcornStandInventory?.corn || 0) < POPCORN_CORN_CONSUMPTION}
                            >
                              Készítés
                            </Button>
                          </div>
                          <p className="text-xs mt-1 text-muted-foreground">Feldolgozható adag: {Math.floor((selectedBuilding.popcornStandInventory?.corn || 0) / POPCORN_CORN_CONSUMPTION)}</p>
                        </div>
                      )}
                      
                      {/* Aktív Popcorn folyamatok */}
                      {popcornProcesses.filter(p => p.standId === selectedBuilding.id).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center">
                            <Clock className="h-4 w-4 mr-2" /> Aktív folyamatok:
                          </h4>
                          {popcornProcesses.filter(p => p.standId === selectedBuilding.id).map(process => {
                            const elapsed = Date.now() - process.startTime;
                            const progress = Math.min(100, (elapsed / process.duration) * 100);
                            const remainingTime = Math.ceil((process.duration - elapsed) / 1000);
                            return (
                              <div key={process.id} className="border p-2 rounded text-xs">
                                <p className="font-medium">
                                  {process.cornConsumed} kukorica → {process.popcornProduced} popcorn
                                </p>
                                <Progress value={progress} className="h-2 mt-1" indicatorColor="bg-red-500" />
                                <p className="text-right text-muted-foreground mt-1">
                                  {remainingTime > 0 ? `${remainingTime} mp hátra` : 'Befejezés...'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {selectedBuilding.type === "house" && !selectedBuilding.residentIds.includes(currentPlayerId) && selectedBuilding.residentIds.length < selectedBuilding.capacity && (
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
                  {selectedBuilding.type === "house" && selectedBuilding.residentIds.length >= selectedBuilding.capacity && !selectedBuilding.residentIds.includes(currentPlayerId) && (
                    <Button disabled>
                      Megtelt
                    </Button>
                  )}
                  {selectedBuilding.salary && !selectedBuilding.employeeIds.includes(currentPlayerId) && currentPlayer.workplace === "Munkanélküli" && selectedBuilding.employeeIds.length < selectedBuilding.capacity && (
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
                  {selectedBuilding.salary && selectedBuilding.employeeIds.length >= selectedBuilding.capacity && !selectedBuilding.employeeIds.includes(currentPlayerId) && (
                    <Button disabled>
                      Megtelt
                    </Button>
                  )}
                  {selectedBuilding.salary && selectedBuilding.employeeIds.includes(currentPlayerId) && (
                    <Button variant="destructive" onClick={() => handleResignFromJob(selectedBuilding.id)}>
                      Felmondás
                    </Button>
                  )}
                  {selectedBuilding.ownerId === currentPlayerId && (
                    <Button variant="destructive" onClick={() => handleDemolishBuilding(selectedBuilding.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Lebontás
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedBuilding(null)}>
                    Bezárás
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {/* ... (többi menü) */}
        </div>
      } 
    />
  );
};

export default Game;