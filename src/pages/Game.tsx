"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PlayerInfo from "@/components/PlayerInfo";
import { MadeWithDyad } from "@/components/made-with-dyad";
import GameMap, { BuildingData } from "@/components/Map";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import BuildMenu, { BuildingOption } from "@/components/BuildMenu";
import SfxPlayer, { SfxPlayerRef } from "@/components/SfxPlayer";
import { sfxUrls } from "@/utils/sfxFiles";
import PlayerSettings from "@/components/PlayerSettings";
import { RotateCw, ChevronLeft, ChevronRight, Sprout, Coins, Building as BuildingIcon, Route, Wrench, Trash2, ChevronUp, ChevronDown, X, Users, Wheat, Factory, Clock, DollarSign, Popcorn, Briefcase as BriefcaseIcon, Home as HomeIcon, Leaf, Hammer } from "lucide-react";
import { availableBuildingOptions, BUILD_HOUSE_COST, OFFICE_SALARY_PER_INTERVAL } from "@/utils/gameData";
import { 
  DEMOLISH_REFUND_PERCENTAGE,
  RENT_INTERVAL_MS,
  CELL_SIZE_PX,
  MAP_GRID_SIZE,
  AVATAR_TICK_MS,
  AVATAR_SPEED_PX,
  DEMOLISH_DURATION_MS,
  WHEAT_GROW_TIME_MS,
  CORN_GROW_TIME_MS,
  WHEAT_HARVEST_YIELD,
  MILL_WHEAT_CONSUMPTION_PER_PROCESS,
  MILL_FLOUR_PRODUCTION_PER_PROCESS,
  MILL_PROCESSING_TIME_MS,
  MILL_CORN_CONSUMPTION_PER_PROCESS,
  MILL_CORNFLOUR_PRODUCTION_PER_PROCESS,
  POPCORN_CORN_CONSUMPTION,
  POPCORN_PRODUCTION,
  POPCORN_PROCESSING_TIME_MS
} from "@/utils/constants";
import { allProducts, ProductType, getProductByType } from "@/utils/products";
import { Player, ShopItem, MarketOffer, MillProcess, PopcornProcess, CustomProcess, CropType, FarmlandTile } from "@/types/gameTypes";
import FarmlandActionDialog from "@/components/FarmlandActionDialog";
import ShopMenu from "@/components/ShopMenu";
import MarketplaceMenu from "@/components/MarketplaceMenu";
import BankMenu, { Loan, BankConfig } from "@/components/BankMenu";
import { useNavigate, useLocation } from "react-router-dom";
import MoneyHistory, { Transaction } from "@/components/MoneyHistory";
import JobHousingFinder from "@/components/JobHousingFinder";
import { SelectedBuildingPanel } from "@/components/game/SelectedBuildingPanel";
import MiniMap from "@/components/MiniMap";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useProcessLogic } from "@/hooks/useProcessLogic";
import { useAutoSave, loadFromStorage } from "@/hooks/useAutoSave";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import useGameLoop from "@/hooks/useGameLoop";
import MusicPlayer from "@/components/MusicPlayer";
import { musicTracks } from "@/utils/musicFiles";
import GameOverScreen from "@/components/GameOverScreen";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorMsg: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, errorMsg: String(error) };
  }
  componentDidCatch(error: unknown, info: unknown) {
    console.error(error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen p-6">
          <div className="max-w-md w-full border rounded p-4 bg-red-50 dark:bg-red-900/20">
            <h2 className="font-bold text-red-700 dark:text-red-300 mb-2">Hiba történt a Játék képernyőn</h2>
            <p className="text-sm break-words">{this.state.errorMsg}</p>
            <button
              className="mt-3 px-3 py-2 bg-red-600 text-white rounded"
              onClick={() => this.setState({ hasError: false, errorMsg: "" })}
            >
              Újrapróbálom
            </button>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}



const TEST_INVENTORY = allProducts.reduce((acc, p) => {
  acc[p.type] = 1;
  return acc;
}, {} as Record<string, number>);

Object.assign(TEST_INVENTORY, {
  [ProductType.Potato]: 5,
  [ProductType.Water]: 5,
  [ProductType.Clothes]: 5,
  [ProductType.Wood]: 50,
  [ProductType.Brick]: 20,
  [ProductType.Stone]: 20,
  [ProductType.WheatSeed]: 10,
  [ProductType.Wheat]: 10,
  [ProductType.Flour]: 5,
  [ProductType.CornSeed]: 10,
  [ProductType.Corn]: 10,
  [ProductType.CornFlour]: 5,
  [ProductType.Popcorn]: 5,
});

const DEFAULT_PLAYERS: Player[] = [
  { id: "player-test", name: "Teszt Elek", money: 50000, inventory: { ...TEST_INVENTORY }, workplace: "Munkanélküli", workplaceSalary: 0 },
  { id: "player-2", name: "Lyukas Zsebű Lajos", money: 300, inventory: { ...TEST_INVENTORY }, workplace: "Munkanélküli", workplaceSalary: 0 },
  { id: "player-3", name: "Gróf Csekkfüzet", money: 15000, inventory: { ...TEST_INVENTORY }, workplace: "Munkanélküli", workplaceSalary: 0 },
  { id: "player-4", name: "Krajcár Kázmér", money: 2000, inventory: { ...TEST_INVENTORY }, workplace: "Munkanélküli", workplaceSalary: 0 },
  { id: "player-5", name: "Zsírosbödön Ödön", money: 8000, inventory: { ...TEST_INVENTORY }, workplace: "Munkanélküli", workplaceSalary: 0 },
];

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as Partial<{
    allPlayers: Player[];
    players: Player[];
    buildings: BuildingData[];
    transactions: Transaction[];
    currentPlayerId: string;
  }>;
  const incomingPlayers: Player[] | undefined = (state?.allPlayers || state?.players);
  const initialBuildingsState: BuildingData[] | undefined = state?.buildings;
  const initialTransactions: Transaction[] | undefined = state?.transactions;
  const initialCurrentPlayerId: string | undefined = state?.currentPlayerId;

  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = loadFromStorage("players", null);
    if (saved) return saved;
    return incomingPlayers && incomingPlayers.length > 0 ? incomingPlayers : DEFAULT_PLAYERS;
  });

  const [currentPlayerId, setCurrentPlayerId] = useState<string>(() => {
    const saved = loadFromStorage("currentPlayerId", null);
    if (saved) return saved;
    const source = incomingPlayers && incomingPlayers.length > 0 ? incomingPlayers : DEFAULT_PLAYERS;
    const fallbackId = source[0].id;
    if (initialCurrentPlayerId && source.some(p => p.id === initialCurrentPlayerId)) {
      return initialCurrentPlayerId;
    }
    return fallbackId;
  });
  const currentPlayer = players.find(p => p.id === currentPlayerId) || players[0];
  const [buildings, setBuildings] = useState<BuildingData[]>(() => {
    const saved = loadFromStorage("buildings", null);
    return saved || initialBuildingsState || [];
  });
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [isBuildingInProgress, setIsBuildingInProgress] = useState(false); 
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);
  const [isMoneyHistoryOpen, setIsMoneyHistoryOpen] = useState(false);
  const [isJobHousingFinderOpen, setIsJobHousingFinderOpen] = useState(false); // ÚJ ÁLLAPOT
  const [customBuildings, setCustomBuildings] = useState<BuildingOption[]>(() => {
    const saved = localStorage.getItem("customBuildings");
    return saved ? JSON.parse(saved) : [];
  });
  const [lastHouseNumber, setLastHouseNumber] = useState(() => {
    const savedBuildings = loadFromStorage<BuildingData[]>("buildings", []);
    return savedBuildings.length;
  });
  const [gameoverState, setGameoverState] = useState<"win" | "loss" | null>(null);

  const [mapGridSize, setMapGridSize] = useState(() => {
    const saved = localStorage.getItem("mapGridSize");
    return saved ? parseInt(saved, 10) : 200;
  });

  useEffect(() => {
    localStorage.setItem("customBuildings", JSON.stringify(customBuildings));
  }, [customBuildings]);

  const [gameRules, setGameRules] = useState({
    cycleTime: 30000,
    winMoney: 0,
    winCompanies: 0,
    loseInsolvencyCycles: 0
  });
  const [insolvencyCounter, setInsolvencyCounter] = useState(0);

  useEffect(() => {
    const savedCycleTime = localStorage.getItem("gameRules_cycleTime");
    const savedWinMoney = localStorage.getItem("gameRules_winMoney");
    const savedWinCompanies = localStorage.getItem("gameRules_winCompanies");
    const savedLoseInsolvencyCycles = localStorage.getItem("gameRules_loseInsolvencyCycles");

    setGameRules({
      cycleTime: savedCycleTime ? parseInt(savedCycleTime, 10) : 30000,
      winMoney: savedWinMoney ? parseInt(savedWinMoney, 10) : 0,
      winCompanies: savedWinCompanies ? parseInt(savedWinCompanies, 10) : 0,
      loseInsolvencyCycles: savedLoseInsolvencyCycles ? parseInt(savedLoseInsolvencyCycles, 10) : 0
    });
  }, []);

  const [msUntilNextTick, setMsUntilNextTick] = useState(RENT_INTERVAL_MS);
  const [isPlacingBuilding, setIsPlacingBuilding] = useState(false);
  const [buildingToPlace, setBuildingToPlace] = useState<BuildingOption | null>(null);
  const [ghostBuildingCoords, setGhostBuildingCoords] = useState<{ x: number; y: number } | null>(null);
  const [currentBuildingRotation, setCurrentBuildingRotation] = useState<number>(0);
  const [isPlacingFarmland, setIsPlacingFarmland] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  const [filterZeroTransactions, setFilterZeroTransactions] = useState(true);
  const { addTransaction, addTransactions } = useGameEconomy(setTransactions, gameRules, filterZeroTransactions);
  const [farmlandActionState, setFarmlandActionState] = useState<{ isOpen: boolean, farmId: string, tileX: number, tileY: number, cropType: CropType, cropProgress: number } | null>(null);
  
  const { fps, memory } = usePerformanceMonitor();
  
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [selectedShopBuilding, setSelectedShopBuilding] = useState<BuildingData | null>(null);
  const [shopInventories, setShopInventories] = useState<Record<string, ShopItem[]>>(() => {
    const saved = loadFromStorage("shopInventories", null);
    return saved || {};
  });

  const [bankConfigs, setBankConfigs] = useState<Record<string, BankConfig>>(() => {
    const saved = loadFromStorage("bankConfigs", null);
    return saved || {};
  });
  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = loadFromStorage("loans", null);
    return saved || [];
  });
  const [isBankMenuOpen, setIsBankMenuOpen] = useState(false);
  const [selectedBankBuilding, setSelectedBankBuilding] = useState<BuildingData | null>(null);
  const [playerPositions, setPlayerPositions] = useState<Record<string, { x: number; y: number; renderX: number; renderY: number; dir: "down" | "left" | "right" | "up"; frame: number; path: { x: number; y: number }[] }>>(() => {
    const init: Record<string, { x: number; y: number; renderX: number; renderY: number; dir: "down" | "left" | "right" | "up"; frame: number; path: { x: number; y: number }[] }> = {};
    const source = incomingPlayers && incomingPlayers.length > 0 ? incomingPlayers : DEFAULT_PLAYERS;
    source.forEach((p, i) => {
      const startX = 1 + i;
      const startY = 1;
      init[p.id] = { x: startX, y: startY, renderX: startX * CELL_SIZE_PX, renderY: startY * CELL_SIZE_PX, dir: "down", frame: 0, path: [] };
    });
    return init;
  });
  const [pendingActions, setPendingActions] = useState<Record<string, (() => void) | null>>({});
  const playerMovementTimer = useRef(0);
  const runPlayerMovement = useCallback(() => {
    setPlayerPositions(prev => {
      const newPlayerPositions = { ...prev };
      const player = newPlayerPositions[currentPlayerId];

      if (!player) return prev;

      if (player.path.length === 0) {
        if (player.frame !== 0) {
          newPlayerPositions[currentPlayerId] = { ...player, frame: 0 };
          return newPlayerPositions;
        }
        return prev;
      }

      const nextTile = player.path[0];
      const currentRenderX = player.renderX;
      const currentRenderY = player.renderY;
      const targetRenderX = nextTile.x * CELL_SIZE_PX;
      const targetRenderY = nextTile.y * CELL_SIZE_PX;

      let newRenderX = currentRenderX;
      let newRenderY = currentRenderY;
      let newDir = player.dir;
      let newFrame = player.frame;

      // Determine speed based on terrain
      const isOnRoad = buildings.some(b => b.type === 'road' && b.x === player.x && b.y === player.y);
      const currentSpeed = isOnRoad ? AVATAR_SPEED_PX * 2 : AVATAR_SPEED_PX;

      // Move towards target
      if (currentRenderX < targetRenderX) {
        newRenderX = Math.min(currentRenderX + currentSpeed, targetRenderX);
        newDir = "right";
      } else if (currentRenderX > targetRenderX) {
        newRenderX = Math.max(currentRenderX - currentSpeed, targetRenderX);
        newDir = "left";
      } else if (currentRenderY < targetRenderY) {
        newRenderY = Math.min(currentRenderY + currentSpeed, targetRenderY);
        newDir = "down";
      } else if (currentRenderY > targetRenderY) {
        newRenderY = Math.max(currentRenderY - currentSpeed, targetRenderY);
        newDir = "up";
      }

      if (newRenderX !== currentRenderX || newRenderY !== currentRenderY) {
        newFrame = (player.frame + 1) % 4;
      } else {
        newFrame = 0;
      }


      // If reached the center of the tile, remove from path
      if (newRenderX === targetRenderX && newRenderY === targetRenderY) {
        player.x = nextTile.x; // Update grid X coordinate
        player.y = nextTile.y; // Update grid Y coordinate
        player.path.shift(); // Remove the current tile
        // If path is empty and there's a pending action, execute it
        if (player.path.length === 0 && pendingActions[currentPlayerId]) {
          pendingActions[currentPlayerId]!();
          setPendingActions(p => ({ ...p, [currentPlayerId]: null }));
        }
      }

      newPlayerPositions[currentPlayerId] = {
        ...player,
        renderX: newRenderX,
        renderY: newRenderY,
        dir: newDir,
        frame: newFrame,
      };

      return newPlayerPositions;
    });
  }, [currentPlayerId, pendingActions, CELL_SIZE_PX, AVATAR_SPEED_PX, buildings]);

  useEffect(() => {
    const timer = setInterval(() => {
        runPlayerMovement();
    }, AVATAR_TICK_MS);
    return () => clearInterval(timer);
  }, [runPlayerMovement]);

  const [isSelectingTree, setIsSelectingTree] = useState(false);
  const [stumps, setStumps] = useState<{ x: number; y: number; cyclesRemaining?: number }[]>([]);
  const [axeWoodCounter, setAxeWoodCounter] = useState<Record<string, number>>({});
  const [pickaxeStoneCounter, setPickaxeStoneCounter] = useState<Record<string, number>>({});
  const chopProcessRef = useRef<{
    id: string;
    playerId: string;
    treeIndex: number;
    treeX: number;
    treeY: number;
    startTime: number;
    duration: number;
  } | null>(null);
  const [isChopping, setIsChopping] = useState(false); // New state
  const [chopProgressPct, setChopProgressPct] = useState(0);

  const [isSelectingStone, setIsSelectingStone] = useState(false);
  const stoneMineProcessRef = useRef<{
    id: string;
    playerId: string;
    stoneIndex: number;
    stoneX: number;
    stoneY: number;
    startTime: number;
    duration: number;
  } | null>(null);
  const [isMining, setIsMining] = useState(false); // New state
  const [stoneMineProgressPct, setStoneMineProgressPct] = useState(0);

  const [demolishProcesses, setDemolishProcesses] = useState<{
    id: string;
    buildingId: string;
    startTime: number;
    duration: number;
  }[]>([]);

  const handleDemolishBuilding = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building || building.ownerId !== currentPlayerId) return;

    // Check if building is empty
    const residentCount = building.residentIds?.length || 0;
    const employeeCount = building.employeeIds?.length || 0;
    
    if (residentCount > 0 || employeeCount > 0) {
      showError("Csak üres épületet lehet lebontani! (Lakók vagy dolgozók vannak benne)");
      return;
    }

    if (building.isUnderConstruction) {
      // If under construction, cancel immediately with refund
       const buildingOption = availableBuildingOptions.find(o => o.type === building.type && o.name === building.name) || 
                              customBuildings.find(o => o.type === building.type && o.name === building.name);
       if (buildingOption) {
          const refundMoney = Math.floor(buildingOption.cost * DEMOLISH_REFUND_PERCENTAGE);
          setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, money: p.money + refundMoney } : p));
                addTransaction(currentPlayerId, "income", `Építés megszakítva: ${building.name}`, refundMoney);
                showSuccess(`${building.name} építése megszakítva. Visszatérítés: ${refundMoney}`);
       }
       setBuildings(prev => prev.filter(b => b.id !== buildingId));
       setSelectedBuilding(null);
       return;
    }

    // Start demolition process
    const processId = `demolish-${Date.now()}`;
    setDemolishProcesses(prev => [...prev, {
      id: processId,
      buildingId: building.id,
      startTime: Date.now(),
      duration: DEMOLISH_DURATION_MS
    }]);
    
    // Mark building as demolishing immediately
    setBuildings(prev => prev.map(b => b.id === buildingId ? { ...b, isDemolishing: true, demolishProgress: 0 } : b));
    
    showSuccess("Bontás megkezdve...");
  };
  
  const [axeAnimation, setAxeAnimation] = useState<{ x: number; y: number; active: boolean } | null>(null);
  const [pickaxeAnimation, setPickaxeAnimation] = useState<{ x: number; y: number; active: boolean } | null>(null);

  // Stop axe animation after some time
  /*
  useEffect(() => {
    if (axeAnimation?.active) {
      const timer = setTimeout(() => {
        setAxeAnimation(null);
      }, 1500); // 3 chops (0.5s each)
      return () => clearTimeout(timer);
    }
  }, [axeAnimation]);
  */

  // Stop pickaxe animation after some time


  const generateInitialTrees = (gridSize: number, initialBuildings: BuildingData[]) => {
    const positions: { x: number; y: number }[] = [];
    const occ = new Set<string>();
    (initialBuildings || []).forEach(b => {
      const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
      const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
      for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) occ.add(`${b.x+dx},${b.y+dy}`);
      b.farmlandTiles?.forEach(ft => occ.add(`${ft.x},${ft.y}`));
    });
    const maxTrees = Math.max(6, Math.floor(gridSize / 3));
    let attempts = 0;
    while (positions.length < maxTrees && attempts < gridSize * gridSize) {
      attempts++;
      const x = Math.floor(Math.random() * (gridSize - 3));
      const y = Math.floor(Math.random() * (gridSize - 3));
      const cells = [
        `${x},${y}`, `${x+1},${y}`, `${x+2},${y}`,
        `${x},${y+1}`, `${x+1},${y+1}`, `${x+2},${y+1}`,
        `${x},${y+2}`, `${x+1},${y+2}`, `${x+2},${y+2}`,
      ];
      if (cells.every(c => !occ.has(c))) {
        positions.push({ x, y });
        cells.forEach(c => occ.add(c));
      }
    }
    return positions;
  };

  const generateInitialStones = (gridSize: number, initialBuildings: BuildingData[], treePositions: { x: number; y: number }[]) => {
    const positions: { x: number; y: number; stoneQuantity: number }[] = [];
    const occ = new Set<string>();
    (initialBuildings || []).forEach(b => {
      const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
      const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
      for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) occ.add(`${b.x+dx},${b.y+dy}`);
      b.farmlandTiles?.forEach(ft => occ.add(`${ft.x},${ft.y}`));
    });
    // Add trees to occupied cells
    treePositions.forEach(t => {
      for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) occ.add(`${t.x+dx},${t.y+dy}`);
    });

    const maxStones = Math.max(3, Math.floor(gridSize / 6)); // Less stones for balanced gameplay
    let attempts = 0;
    while (positions.length < maxStones && attempts < gridSize * gridSize) {
      attempts++;
      const x = Math.floor(Math.random() * (gridSize - 1));
      const y = Math.floor(Math.random() * (gridSize - 1));
      // Check 2x2 area for stones
      const cells = [
        `${x},${y}`, `${x+1},${y}`,
        `${x},${y+1}`, `${x+1},${y+1}`
      ];
      
      if (cells.every(c => !occ.has(c))) {
        positions.push({ x, y, stoneQuantity: 100 });
        cells.forEach(c => occ.add(c));
      }
    }
    return positions;
  };

  const [trees, setTrees] = useState<{ x: number; y: number }[]>(() => generateInitialTrees(mapGridSize, initialBuildingsState || []));
  const [stones, setStones] = useState<{ x: number; y: number; stoneQuantity: number }[]>(() => generateInitialStones(mapGridSize, initialBuildingsState || [], trees));
  
  const isCellOccupied = useCallback((x: number, y: number, ignoreRoads: boolean = false): boolean => {
    // Check buildings
    for (const b of buildings) {
      if (ignoreRoads && b.type === 'road') continue;
      const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
      const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
      if (x >= b.x && x < b.x + w && y >= b.y && y < b.y + h) {
        return true;
      }
      if (b.farmlandTiles?.some(ft => ft.x === x && ft.y === y)) {
        return true;
      }
    }

    // Check trees (3x3)
    for (const t of trees) {
      if (x >= t.x && x < t.x + 3 && y >= t.y && y < t.y + 3) {
        return true;
      }
    }

    // Check stones (2x2)
    for (const s of stones) {
        if (x >= s.x && x < s.x + 2 && y >= s.y && y < s.y + 2) {
            return true;
        }
    }
    
    // Check stumps
    if (stumps.some(s => s.x === x && s.y === y)) {
      return true;
    }

    return false;
  }, [buildings, trees, stones, stumps]);

  const findPath = useCallback((start: { x: number; y: number }, goal: { x: number; y: number }, ignore: Set<string> = new Set()) => {
    const inBounds = (x: number, y: number) => x >= 0 && x < mapGridSize && y >= 0 && y < mapGridSize;
    const blocked = new Set<string>();
    buildings.forEach(b => {
      if (b.type === "road") return;
      const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
      const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
      for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) blocked.add(`${b.x+dx},${b.y+dy}`);
      b.farmlandTiles?.forEach(ft => blocked.add(`${ft.x},${ft.y}`));
    });
    trees.forEach(t => {
      for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) blocked.add(`${t.x+dx},${t.y+dy}`);
    });
    stumps.forEach(s => {
        if (!ignore.has("stumps")) blocked.add(`${s.x},${s.y}`);
    });
    stones.forEach(s => {
      blocked.add(`${s.x},${s.y}`);
      blocked.add(`${s.x + 1},${s.y}`);
      blocked.add(`${s.x},${s.y + 1}`);
      blocked.add(`${s.x + 1},${s.y + 1}`);
    });
    Object.entries(playerPositions).forEach(([pid, pos]) => {
      if (pid !== currentPlayerId && !ignore.has("players")) blocked.add(`${pos.x},${pos.y}`);
    });

    const key = (x: number, y: number) => `${x},${y}`;
    const open: Array<{ x: number; y: number; g: number; f: number }> = [{ x: start.x, y: start.y, g: 0, f: Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y) }];
    const came = new Map<string, { x: number; y: number }>();
    const costs = new Map<string, number>([[key(start.x, start.y), 0]]);
    const visited = new Set<string>();
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (open.length) {
      open.sort((a,b)=>a.f-b.f);
      const current = open.shift()!;
      const ckey = key(current.x, current.y);
      if (visited.has(ckey)) continue;
      visited.add(ckey);
      if (current.x === goal.x && current.y === goal.y) {
        const path: { x:number;y:number }[] = [];
        let curKey = ckey;
        let cur = { x: current.x, y: current.y };
        while (curKey !== key(start.x, start.y)) {
          path.unshift({ x: cur.x, y: cur.y });
          const prev = came.get(curKey)!;
          curKey = key(prev.x, prev.y);
          cur = prev;
        }
        return path;
      }
      dirs.forEach(([dx,dy]) => {
        const nx = current.x + dx, ny = current.y + dy;
        const nkey = key(nx, ny);
        if (!inBounds(nx, ny)) return;
        if (blocked.has(nkey)) return;
        const ng = current.g + 1;
        const cg = costs.get(nkey);
        if (cg === undefined || ng < cg) {
          costs.set(nkey, ng);
          const h = Math.abs(nx - goal.x) + Math.abs(ny - goal.y);
          open.push({ x: nx, y: ny, g: ng, f: ng + h });
          came.set(nkey, { x: current.x, y: current.y });
        }
      });
    }
    return [] as { x: number; y: number }[];
  }, [buildings, trees, stumps, playerPositions, currentPlayerId, mapGridSize]);

  const findPathWithFallbacks = useCallback((start: { x: number; y: number }, goal: { x: number; y: number }) => {
    let path = findPath(start, goal);
    if (path.length > 0) return path;

    console.warn("Pathfinding failed, trying to ignore players.");
    path = findPath(start, goal, new Set(["players"]));
    if (path.length > 0) return path;

    console.warn("Pathfinding failed, trying to ignore stumps.");
    path = findPath(start, goal, new Set(["stumps"]));
    if (path.length > 0) return path;
    
    console.warn("Pathfinding failed, trying to ignore players and stumps.");
    path = findPath(start, goal, new Set(["players", "stumps"]));
    return path;
  }, [findPath]);


  const executeAtBuilding = useCallback((buildingId: string, action: () => void) => {
    const b = buildings.find(bb => bb.id === buildingId);
    if (!b) return;
    const pos = playerPositions[currentPlayerId] || { x: 0, y: 0, dir: "down" as const, frame: 0, path: [] };
    const inBounds = (x: number, y: number) => x >= 0 && x < mapGridSize && y >= 0 && y < mapGridSize;
    const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
    const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
    const perimeter: { x: number; y: number }[] = [];
    for (let dx = 0; dx < w; dx++) {
      const top = { x: b.x + dx, y: b.y - 1 };
      const bottom = { x: b.x + dx, y: b.y + h };
      if (inBounds(top.x, top.y)) perimeter.push(top);
      if (inBounds(bottom.x, bottom.y)) perimeter.push(bottom);
    }
    for (let dy = 0; dy < h; dy++) {
      const left = { x: b.x - 1, y: b.y + dy };
      const right = { x: b.x + w, y: b.y + dy };
      if (inBounds(left.x, left.y)) perimeter.push(left);
      if (inBounds(right.x, right.y)) perimeter.push(right);
    }
    const uniquePerimeter = Array.from(new Set(perimeter.map(p => `${p.x},${p.y}`))).map(k => {
      const [x, y] = k.split(",").map(Number);
      return { x, y };
    });

    // Filter out occupied cells, unless the player is currently on that cell
    const validTargets = uniquePerimeter.filter(t => {
      if (t.x === pos.x && t.y === pos.y) return true;
      return !isCellOccupied(t.x, t.y, true);
    });

    const sortedByDistance = validTargets.sort((a, b2) => {
      const da = Math.abs(a.x - pos.x) + Math.abs(a.y - pos.y);
      const db = Math.abs(b2.x - pos.x) + Math.abs(b2.y - pos.y);
      return da - db;
    });
    const alreadyAdjacent = sortedByDistance.some(t => Math.abs(t.x - pos.x) + Math.abs(t.y - pos.y) === 0);
    if (alreadyAdjacent || (pos.x >= b.x && pos.x < b.x + w && pos.y >= b.y && pos.y < b.y + h)) {
      action();
      return;
    }
    let chosenPath: { x: number; y: number }[] = [];
    for (const target of sortedByDistance) {
      const path = findPathWithFallbacks({ x: pos.x, y: pos.y }, { x: target.x, y: target.y });
      if (path.length > 0) {
        chosenPath = path;
        break;
      }
    }
    if (chosenPath.length === 0) {
      showError("Nem találtam útvonalat a célhoz (lehet, hogy blokkolva van).");
      return;
    }
    setPlayerPositions(prev => ({ ...prev, [currentPlayerId]: { ...pos, path: chosenPath } }));
    setPendingActions(prev => ({ ...prev, [currentPlayerId]: action }));
    showSuccess("Elindultál a célhoz.");
  }, [buildings, playerPositions, currentPlayerId, findPath, findPathWithFallbacks, isCellOccupied, mapGridSize]);

  const executeAtTile = useCallback((tileX: number, tileY: number, action: () => void) => {
    const pos = playerPositions[currentPlayerId] || { x: 0, y: 0, dir: "down" as const, frame: 0, path: [] };
    if (pos.x === tileX && pos.y === tileY) {
      action();
      return;
    }
    const path = findPathWithFallbacks({ x: pos.x, y: pos.y }, { x: tileX, y: tileY });
    if (path.length === 0) {
      showError("Nem találtam útvonalat a célhoz.");
      return;
    }
    setPlayerPositions(prev => ({ ...prev, [currentPlayerId]: { ...pos, path } }));
    setPendingActions(prev => ({ ...prev, [currentPlayerId]: action }));
    showSuccess("Elindultál a célhoz.");
  }, [playerPositions, currentPlayerId, findPath]);
  
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [currentMarketBuildingId, setCurrentMarketBuildingId] = useState<string | null>(null);
  const [marketOffers, setMarketOffers] = useState<MarketOffer[]>([]);
  const [mapOffsetX, setMapOffsetX] = useState(0);
  const [mapOffsetY, setMapOffsetY] = useState(0);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const sfxPlayerRef = useRef<SfxPlayerRef>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false); 
  const [isPlacingRoad, setIsPlacingRoad] = useState(false); 
  const [ghostRoadTiles, setGhostRoadTiles] = useState<{ x: number; y: number }[]>([]); 
  const [buildTarget, setBuildTarget] = useState<{ x: number; y: number } | null>(null);

  const isPlacementMode = isPlacingBuilding || isPlacingFarmland || isPlacingRoad;

  const { 
    millProcesses, setMillProcesses,
    popcornProcesses, setPopcornProcesses,
    customProcesses, setCustomProcesses
  } = useProcessLogic({
    buildings,
    players,
    setPlayers,
    customBuildings,
    initialMillProcesses: loadFromStorage("millProcesses", []),
    initialPopcornProcesses: loadFromStorage("popcornProcesses", []),
    initialCustomProcesses: loadFromStorage("customProcesses", [])
  });

  // --- Auto Save ---
  useAutoSave("players", players);
  useAutoSave("buildings", buildings);
  useAutoSave("currentPlayerId", currentPlayerId);
  useAutoSave("millProcesses", millProcesses);
  useAutoSave("popcornProcesses", popcornProcesses);
  useAutoSave("customProcesses", customProcesses);
  useAutoSave("shopInventories", shopInventories);
  useAutoSave("bankConfigs", bankConfigs);
  useAutoSave("loans", loans);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCoords, setDragStartCoords] = useState<{ x: number; y: number } | null>(null);
  const [draggedTiles, setDraggedTiles] = useState<{ x: number; y: number }[]>([]); 

  // --- Event Listeners ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current[event.key] = true;
      
      if (event.key === 'Shift') {
        setIsShiftPressed(true);
      }
      
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
      keysPressed.current[event.key] = false;
      if (event.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlacementMode]);
  // ---------------------------------------

  // const addTransaction moved to useGameEconomy hook


  const chopProcessTimer = useRef(0);
  const runChopProcess = useCallback(() => {
    if (!chopProcessRef.current) {
      setChopProgressPct(0);
      return;
    }
    const elapsed = Date.now() - chopProcessRef.current.startTime;
    const pct = Math.min(100, (elapsed / chopProcessRef.current.duration) * 100);
    setChopProgressPct(pct);
    if (elapsed >= chopProcessRef.current.duration) {
      const idx = chopProcessRef.current.treeIndex;
      const tx = chopProcessRef.current.treeX;
      const ty = chopProcessRef.current.treeY;
      setTrees(prev => prev.filter((_, i) => i !== idx));
      setStumps(prev => [...prev, { x: tx + 1, y: ty + 1 }]);
      const gain = 12;
      const prevCnt = axeWoodCounter[currentPlayerId] || 0;
      const newCnt = prevCnt + gain;
      let axeDec = 0;
      let remain = newCnt;
      while (remain >= 40) {
        axeDec += 1;
        remain -= 40;
      }
      setAxeWoodCounter(prev => ({ ...prev, [currentPlayerId]: remain }));
      setPlayers(prev => prev.map(p => 
        p.id === currentPlayerId ? {
          ...p,
          inventory: {
            ...p.inventory,
            wood: (p.inventory.wood || 0) + gain,
            [ProductType.Axe]: Math.max(0, (p.inventory[ProductType.Axe] || 0) - axeDec)
          }
        } : p
      ));
      addTransaction(currentPlayerId, "income", `Fa kivágása (nyers fa)`, 0);
      showSuccess(`Fa kivágva. +${gain} fa. ${axeDec > 0 ? "A fejsze elhasználódott." : "A fejsze kopott."}`);
      chopProcessRef.current = null;
      setIsChopping(false);
    }
  }, [axeWoodCounter, currentPlayerId, addTransaction]);

  const stoneMineProcessTimer = useRef(0);
  const runStoneMineProcess = useCallback(() => {
    if (!stoneMineProcessRef.current) {
      setStoneMineProgressPct(0);
      return;
    }
    const elapsed = Date.now() - stoneMineProcessRef.current.startTime;
    const pct = Math.min(100, (elapsed / stoneMineProcessRef.current.duration) * 100);
    setStoneMineProgressPct(pct);
    if (elapsed >= stoneMineProcessRef.current.duration) {
      const idx = stoneMineProcessRef.current.stoneIndex;
      const gain = 5; 
      
      const stone = stones[idx];
      if (!stone) { stoneMineProcessRef.current = null; return; }
      const currentQty = stone.stoneQuantity !== undefined ? stone.stoneQuantity : 100;
      const newQty = Math.max(0, currentQty - gain);
      const willRemain = newQty > 0;

      setStones(prev => {
         const newStones = [...prev];
         if (!newStones[idx]) return prev;
         
         if (newQty <= 0) {
           return newStones.filter((_, i) => i !== idx);
         } else {
           newStones[idx] = { ...stone, stoneQuantity: newQty };
           return newStones;
         }
      });
      
      const prevCnt = pickaxeStoneCounter[currentPlayerId] || 0;
      const newCnt = prevCnt + gain;
      let pickaxeDec = 0;
      let remain = newCnt;
      while (remain >= 40) { 
        pickaxeDec += 1;
        remain -= 40;
      }
      setPickaxeStoneCounter(prev => ({ ...prev, [currentPlayerId]: remain }));
      
      setPlayers(prev => prev.map(p => 
        p.id === currentPlayerId ? {
          ...p,
          carryingStone: gain,
          miningTarget: willRemain ? { x: stone.x, y: stone.y, stoneIndex: idx } : undefined,
          inventory: {
            ...p.inventory,
            [ProductType.Pickaxe]: Math.max(0, (p.inventory[ProductType.Pickaxe] || 0) - pickaxeDec)
          }
        } : p
      ));

      stoneMineProcessRef.current = null;
      setIsMining(false);

      const quarry = buildings.find(b => b.type === 'quarry' && b.ownerId === currentPlayerId);
      
      if (quarry) {
          showSuccess(`Kő kibányászva (+${gain}). Szállítás a kőfejtőhöz...`);
          executeAtBuilding(quarry.id, () => {
              setPlayers(prev => prev.map(p => {
                  if (p.id === currentPlayerId) {
                      const amount = p.carryingStone || 0;
                      return {
                          ...p,
                          carryingStone: 0,
                          inventory: {
                              ...p.inventory,
                              [ProductType.Stone]: (p.inventory[ProductType.Stone] || 0) + amount
                          }
                      };
                  }
                  return p;
              }));
              showSuccess(`Kő leszállítva.`);
              addTransaction(currentPlayerId, "income", `Kőbányászat (kő)`, 0);

              if (willRemain) {
                  executeAtTile(stone.x, stone.y, () => {
                       const currentPickaxe = (currentPlayer.inventory[ProductType.Pickaxe] || 0) - pickaxeDec;
                       if (currentPickaxe < 1) {
                           showError("A csákányod elhasználódott, nem tudod folytatni a bányászatot.");
                           return;
                       }

                       stoneMineProcessRef.current = {
                        id: `mine-${Date.now()}-${Math.random()}`,
                        playerId: currentPlayerId,
                        stoneIndex: idx,
                        stoneX: stone.x,
                        stoneY: stone.y,
                        startTime: Date.now(),
                        duration: 5000, 
                      };
                      setIsMining(true);
                      setPickaxeAnimation({ x: stone.x, y: stone.y, active: true }); 
                      showSuccess("Visszatértél a bányához, folytatás...");
                  });
              }
          });
      } else {
          setPlayers(prev => prev.map(p => 
            p.id === currentPlayerId ? {
              ...p,
              carryingStone: 0,
              inventory: {
                ...p.inventory,
                [ProductType.Stone]: (p.inventory[ProductType.Stone] || 0) + gain
              }
            } : p
          ));
          addTransaction(currentPlayerId, "income", `Kőbányászat (kő)`, 0);
          showSuccess(`Kő kibányászva. +${gain} kő. (Nincs kőfejtő, azonnal jóváírva)`);
          if (willRemain) {
            executeAtTile(stone.x, stone.y, () => {
                  const currentPickaxe = (currentPlayer.inventory[ProductType.Pickaxe] || 0) - pickaxeDec;
                  if (currentPickaxe < 1) {
                      showError("A csákányod elhasználódott, nem tudod folytatni a bányászatot.");
                      return;
                  }

                  stoneMineProcessRef.current = {
                  id: `mine-${Date.now()}-${Math.random()}`,
                  playerId: currentPlayerId,
                  stoneIndex: idx,
                  stoneX: stone.x,
                  stoneY: stone.y,
                  startTime: Date.now(),
                  duration: 5000, 
                };
                setIsMining(true);
                setPickaxeAnimation({ x: stone.x, y: stone.y, active: true }); 
                showSuccess("Folytatódik a bányászat...");
            });
          }
      }
    }
  }, [pickaxeStoneCounter, currentPlayerId, stones, buildings, executeAtBuilding, executeAtTile, currentPlayer, addTransaction]);

  // Építkezés befejezése és feldolgozási időzítők
  // NOTE: Process logic has been moved to useProcessLogic hook
 


  


  const stumpDecayTimer = useRef(0);
  const runStumpDecay = useCallback(() => {
    setStumps(prev => {
      const nextStumps: typeof prev = [];
      let hasChanges = false;
      
      prev.forEach(stump => {
        if (stump.cyclesRemaining !== undefined) {
          if (stump.cyclesRemaining > 1) {
            nextStumps.push({ ...stump, cyclesRemaining: stump.cyclesRemaining - 1 });
          } else {
            hasChanges = true;
          }
        } else {
          nextStumps.push({ ...stump, cyclesRemaining: 10 });
          hasChanges = true;
        }
      });
      return hasChanges ? nextStumps : prev;
    });
  }, []);


  const runProcessEconomyTick = useCallback(() => {
    const newTransactions: Omit<Transaction, "id" | "timestamp">[] = [];
    const playerBalanceChanges: Record<string, number> = {};
    players.forEach(p => playerBalanceChanges[p.id] = 0);

    buildings.forEach(building => {
      if (building.type === "house" && building.ownerId && building.rentalPrice && building.residentIds.length > 0) {
        building.residentIds.forEach(residentId => {
          if (residentId === building.ownerId) return; // Tulajdonos nem fizet magának
          playerBalanceChanges[residentId] -= building.rentalPrice!;
          playerBalanceChanges[building.ownerId!] += building.rentalPrice!;
          newTransactions.push({ playerId: residentId, type: "expense", description: `Bérleti díj: ${building.name}`, amount: building.rentalPrice! });
          newTransactions.push({ playerId: building.ownerId!, type: "income", description: `Lakbér: ${building.name}`, amount: building.rentalPrice! });
        });
      }

      if (building.salary && building.employeeIds.length > 0) {
        building.employeeIds.forEach(empId => {
          playerBalanceChanges[building.ownerId!] -= building.salary!;
          playerBalanceChanges[empId] += building.salary!;
          newTransactions.push({ playerId: building.ownerId!, type: "expense", description: `Munkabér kifizetés: ${building.name}`, amount: building.salary! });
          newTransactions.push({ playerId: empId, type: "income", description: `Fizetés: ${building.name}`, amount: building.salary! });
        });
      }
    });

    setPlayers(prevPlayers => prevPlayers.map(p => {
        const newMoney = p.money + (playerBalanceChanges[p.id] || 0);
        return {
            ...p,
            money: newMoney 
        };
    }));
    
    addTransactions(newTransactions);

    const currentBalanceChange = playerBalanceChanges[currentPlayerId] || 0;
    const newCurrentPlayerMoney = currentPlayer.money + currentBalanceChange;
    
    if (gameRules.loseInsolvencyCycles > 0) {
        if (newCurrentPlayerMoney < 0) {
            const newCounter = insolvencyCounter + 1;
            setInsolvencyCounter(newCounter);
            if (newCounter >= gameRules.loseInsolvencyCycles) {
                setGameoverState("loss");
                return;
            } else {
                showError(`VIGYÁZAT! Fizetésképtelen vagy! (${newCounter}/${gameRules.loseInsolvencyCycles} ciklus)`);
            }
        } else {
            setInsolvencyCounter(0);
        }
    }

    if (gameRules.winMoney > 0 && newCurrentPlayerMoney >= gameRules.winMoney) {
        setGameoverState("win");
        return;
    }

    if (gameRules.winCompanies > 0) {
        const companyCount = buildings.filter(b => b.ownerId === currentPlayerId && b.category === 'business').length;
        if (companyCount >= gameRules.winCompanies) {
            setGameoverState("win");
            return;
        }
    }

  }, [buildings, players, currentPlayerId, gameRules, insolvencyCounter, navigate, currentPlayer.money, addTransactions]);

  const cropGrowthTimer = useRef(0);
  const runCropGrowth = useCallback(() => {
    setBuildings(prevBuildings => 
      prevBuildings.map(b => {
        if (b.type === 'farm' && b.farmlandTiles) {
          const updatedTiles = b.farmlandTiles.map(ft => {
            let progressIncrease = 0;
            const maxProgress = 100;
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
  }, []);



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

  const shopRestockTimer = useRef(0);
  const runShopRestock = useCallback(() => {
    Object.entries(shopInventories).forEach(([shopId, items]) => {
      items.forEach(item => {
        if (item.isDelivering && item.deliveryEta && Date.now() >= item.deliveryEta) {
          handleRestock(shopId, item.type, item.orderedStock);
          showSuccess(`Megérkezett a rendelés a boltba: ${item.name} (${item.orderedStock} db)`);
        }
      });
    });
  }, [shopInventories, handleRestock]);

  const keysPressed = useRef<Record<string, boolean>>({});
  const cameraVelocity = useRef({ x: 0, y: 0 });

  const constructionTimer = useRef(0);
  const runConstructionCheck = useCallback(() => {
    const now = Date.now();

    // Demolition
    if (demolishProcesses.length > 0) {
      const finishedDemolitions: string[] = [];
      setDemolishProcesses(prev => {
        const remaining = prev.filter(p => {
          if (now >= p.startTime + p.duration) {
            finishedDemolitions.push(p.buildingId);
            return false;
          }
          return true;
        });

        if (finishedDemolitions.length > 0) {
          setBuildings(currentBuildings => {
            const buildingsToRemove: BuildingData[] = [];
            const updatedBuildings = currentBuildings.filter(b => {
              if (finishedDemolitions.includes(b.id)) {
                buildingsToRemove.push(b);
                return false;
              }
              return true;
            });

            buildingsToRemove.forEach(b => {
               if (b.ownerId !== currentPlayerId) return;
               const buildingOption = availableBuildingOptions.find(o => o.type === b.type && o.name === b.name) || customBuildings.find(o => o.type === b.type && o.name === b.name);
               if (buildingOption) {
                  const refundMoney = Math.floor(buildingOption.cost * DEMOLISH_REFUND_PERCENTAGE);
                  const refundWood = Math.floor((buildingOption.woodCost || 0) * DEMOLISH_REFUND_PERCENTAGE);
                  const refundBrick = Math.floor((buildingOption.brickCost || 0) * DEMOLISH_REFUND_PERCENTAGE);
                  const refundStone = Math.floor((buildingOption.stoneCost || 0) * DEMOLISH_REFUND_PERCENTAGE);
                  setPlayers(cp => cp.map(player => 
                    player.id === currentPlayerId ? {
                      ...player,
                      money: player.money + refundMoney,
                      inventory: {
                        ...player.inventory,
                        wood: (player.inventory.wood || 0) + refundWood,
                        brick: (player.inventory.brick || 0) + refundBrick,
                        stone: (player.inventory.stone || 0) + refundStone,
                      }
                    } : player
                  ));
                  addTransaction(currentPlayerId, "income", `Épületbontás visszatérítés: ${b.name}`, refundMoney);
                  showSuccess(`${b.name} lebontva.`);
                  if (sfxPlayerRef.current) sfxPlayerRef.current.stopAllSfx();
               }
            });
            return updatedBuildings;
          });
          setSelectedBuilding(null);
        }
        return remaining;
      });
    }

    // Construction & Progress
    setBuildings(prevBuildings => {
      let localHasChanges = false;
      let isAnyBuildingUnderConstructionOrDemolition = false;

      const nextBuildings = prevBuildings.map(b => {
        let updatedBuilding = { ...b };
        let hasChanged = false;

        const demolishProcess = demolishProcesses.find(p => p.buildingId === b.id);
        if (demolishProcess) {
          isAnyBuildingUnderConstructionOrDemolition = true;
          const elapsed = now - demolishProcess.startTime;
          const progress = Math.min(100, (elapsed / demolishProcess.duration) * 100);
           if (Math.abs((b.demolishProgress || 0) - progress) > 0.1) {
              updatedBuilding.demolishProgress = progress;
              hasChanged = true;
           }
        } else if (b.isDemolishing) {
           // Cleanup visual state if process is gone
           updatedBuilding.isDemolishing = false;
           updatedBuilding.demolishProgress = 0;
           hasChanged = true;
        }

        if (b.isUnderConstruction && b.constructionEta) {
          isAnyBuildingUnderConstructionOrDemolition = true;
          if (now >= b.constructionEta) {
            showSuccess(`${b.name} kész!`);
            if (sfxPlayerRef.current) sfxPlayerRef.current.stopAllSfx();
            updatedBuilding = { ...updatedBuilding, isUnderConstruction: false, constructionEta: undefined, originalDuration: undefined, buildProgress: 100 };
            hasChanged = true;
          } else if (b.originalDuration) {
            const elapsed = now - (b.constructionEta - b.originalDuration);
            const progress = Math.min(100, (elapsed / b.originalDuration) * 100);
            if (Math.abs((b.buildProgress || 0) - progress) > 0.1) {
              updatedBuilding.buildProgress = progress;
              hasChanged = true;
            }
          }
        }

        if (b.type === 'farm' && b.farmlandTiles) {
            let tilesChanged = false;
            const newFarmlandTiles = b.farmlandTiles.map(ft => {
                if (ft.isUnderConstruction && ft.constructionEta) {
                    isAnyBuildingUnderConstructionOrDemolition = true;
                    if (now >= ft.constructionEta) {
                        showSuccess(`Szántóföld kész: (${ft.x}, ${ft.y})!`);
                        tilesChanged = true;
                        return { ...ft, isUnderConstruction: false, constructionEta: undefined, originalDuration: undefined, buildProgress: 100 };
                    } else if (ft.originalDuration) {
                        const elapsed = now - (ft.constructionEta - ft.originalDuration);
                        const progress = Math.min(100, (elapsed / ft.originalDuration) * 100);
                        if (Math.abs((ft.buildProgress || 0) - progress) > 0.1) {
                            tilesChanged = true;
                            return { ...ft, buildProgress: progress };
                        }
                    }
                }
                return ft;
            });
            if (tilesChanged) {
                updatedBuilding.farmlandTiles = newFarmlandTiles;
                hasChanged = true;
            }
        }
        
        if (hasChanged) localHasChanges = true;
        return updatedBuilding;
      });

      if (sfxPlayerRef.current && !isAnyBuildingUnderConstructionOrDemolition) {
        const wasAnyConstruction = prevBuildings.some(b => b.isUnderConstruction || b.isDemolishing || b.farmlandTiles?.some(ft => ft.isUnderConstruction));
        if (wasAnyConstruction) {
          sfxPlayerRef.current.stopAllSfx();
        }
      }

      return localHasChanges ? nextBuildings : prevBuildings;
    });

  }, [currentPlayerId, demolishProcesses, customBuildings, addTransaction, sfxPlayerRef, setPlayers, setBuildings, setSelectedBuilding]);

  useGameLoop((deltaTime) => {
    // Camera movement physics
    const ACCEL = 1.5;
    const FRICTION = 0.90;
    const MAX_SPEED = 25;

    let ax = 0;
    let ay = 0;
    
    if (keysPressed.current["ArrowUp"] || keysPressed.current["w"]) ay += ACCEL;
    if (keysPressed.current["ArrowDown"] || keysPressed.current["s"]) ay -= ACCEL;
    if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"]) ax += ACCEL;
    if (keysPressed.current["ArrowRight"] || keysPressed.current["d"]) ax -= ACCEL;

    // Apply acceleration
    cameraVelocity.current.x += ax;
    cameraVelocity.current.y += ay;

    // Apply friction
    cameraVelocity.current.x *= FRICTION;
    cameraVelocity.current.y *= FRICTION;

    // Cap velocity
    cameraVelocity.current.x = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, cameraVelocity.current.x));
    cameraVelocity.current.y = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, cameraVelocity.current.y));

    if (Math.abs(cameraVelocity.current.x) < 0.1) cameraVelocity.current.x = 0;
    if (Math.abs(cameraVelocity.current.y) < 0.1) cameraVelocity.current.y = 0;

    if (cameraVelocity.current.x !== 0 || cameraVelocity.current.y !== 0) {
        const viewportWidth = mainContentRef.current?.clientWidth || window.innerWidth;
        const viewportHeight = mainContentRef.current?.clientHeight || window.innerHeight;

        const mapWidth = mapGridSize * CELL_SIZE_PX;
        const mapHeight = mapGridSize * CELL_SIZE_PX;
        
        setMapOffsetX(prev => {
            const minX = Math.min(0, -(mapWidth - viewportWidth));
            // Velocity X positive -> move map right (show left part)
            // Velocity X negative -> move map left (show right part)
            return Math.max(minX, Math.min(0, prev + cameraVelocity.current.x));
        });
        setMapOffsetY(prev => {
            const minY = Math.min(0, -(mapHeight - viewportHeight));
            return Math.max(minY, Math.min(0, prev + cameraVelocity.current.y));
        });
    }

    constructionTimer.current += deltaTime;
    chopProcessTimer.current += deltaTime;
    stoneMineProcessTimer.current += deltaTime;
    stumpDecayTimer.current += deltaTime;
    setMsUntilNextTick(prev => prev - deltaTime);
    cropGrowthTimer.current += deltaTime;
    shopRestockTimer.current += deltaTime;

    if (constructionTimer.current >= 500) {
      runConstructionCheck();
      constructionTimer.current -= 500;
    }

    if (chopProcessTimer.current >= 100) {
      runChopProcess();
      chopProcessTimer.current -= 100;
    }

    if (stoneMineProcessTimer.current >= 100) {
      runStoneMineProcess();
      stoneMineProcessTimer.current -= 100;
    }

    if (stumpDecayTimer.current >= 1000) {
      runStumpDecay();
      stumpDecayTimer.current -= 1000;
    }

    if (msUntilNextTick <= 0) {
      runProcessEconomyTick();
      setMsUntilNextTick(RENT_INTERVAL_MS);
    }

    if (cropGrowthTimer.current >= 1000) {
      runCropGrowth();
      cropGrowthTimer.current -= 1000;
    }

    if (shopRestockTimer.current >= 1000) {
      runShopRestock();
      shopRestockTimer.current -= 1000;
    }
  });
  
  // Kijelölt épület adatainak frissítése, ha a buildings state változik (pl. beköltözéskor)
  useEffect(() => {
    if (selectedBuilding) {
      const updatedBuilding = buildings.find(b => b.id === selectedBuilding.id);
      // Ha megtaláltuk és változott a referencia, frissítjük a kijelölést
      if (updatedBuilding && updatedBuilding !== selectedBuilding) {
        setSelectedBuilding(updatedBuilding);
      }
    }
  }, [buildings, selectedBuilding]);





  const tickProgress = 100 - ((msUntilNextTick / RENT_INTERVAL_MS) * 100); 
  const secondsRemaining = Math.ceil(msUntilNextTick / 1000);



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

  const handleTakeLoan = (amount: number, lenderId: string, interestRate: number) => {
    // Determine lender name
    let lenderName = "Központi Bank";
    if (lenderId !== 'system') {
      const lender = players.find(p => p.id === lenderId);
      lenderName = lender ? `${lender.name} Bankja` : "Ismeretlen Bank";
    }

    const totalRepayment = Math.floor(amount * (1 + interestRate / 100));
    const newLoan: Loan = {
      id: `loan-${Date.now()}-${Math.random()}`,
      borrowerId: currentPlayerId,
      lenderId,
      lenderName,
      amount,
      interestRate,
      totalRepayment,
      remainingRepayment: totalRepayment,
      dueDate: Date.now() + 10 * 60 * 1000, // 10 perc múlva esedékes (példa)
    };

    setLoans(prev => [...prev, newLoan]);
    setPlayers(prev => prev.map(p => 
      p.id === currentPlayerId ? { ...p, money: p.money + amount } : p
    ));

    // If lender is a player, deduct money from them (if we want realistic bank reserves, but for now let's say banks have infinite money or separate logic)
    // The prompt says "player-built bank... owner decides terms". It doesn't explicitly say the money comes from the player's pocket, but it implies a business. 
    // Usually in these games, bank has its own capital. For simplicity, let's just give money to borrower. 
    // If it's a player bank, maybe the player SHOULD provide the capital? 
    // "Játékos is építhet majd BANK épületet... tulajdonos maga döntheti el az általa nyújtott kölcsönök feltételeit."
    // Let's assume for now the money is "created" by the bank license (game logic) or deducted if we want realism.
    // Given the "high cost" to build, maybe it allows lending "system" money but taking the profit?
    // Or maybe the player has to deposit money?
    // Let's keep it simple: Borrower gets money. If lender is player, they don't lose money immediately (it's a loan), but they will receive the repayment.
    
    addTransaction(currentPlayerId, "income", `Hitel felvétele (${lenderName})`, amount);
    showSuccess(`Sikeresen felvettél ${amount} Ft hitelt!`);
  };

  const handleRepayLoan = (loanId: string, amount: number) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    if (currentPlayer.money < amount) {
      showError("Nincs elég pénzed a törlesztéshez!");
      return;
    }

    const newRemaining = loan.remainingRepayment - amount;
    
    // Update player money
    setPlayers(prev => prev.map(p => 
      p.id === currentPlayerId ? { ...p, money: p.money - amount } : p
    ));

    // If lender is a player, they get the money
    if (loan.lenderId !== 'system') {
       setPlayers(prev => prev.map(p => 
         p.id === loan.lenderId ? { ...p, money: p.money + amount } : p
       ));
       addTransaction(loan.lenderId, "income", `Hitel törlesztés érkezett (${currentPlayer.name})`, amount);
    }

    if (newRemaining <= 0) {
      setLoans(prev => prev.filter(l => l.id !== loanId));
      showSuccess("Hitel teljes egészében törlesztve!");
      addTransaction(currentPlayerId, "expense", `Hitel visszafizetése (${loan.lenderName})`, amount);
    } else {
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, remainingRepayment: newRemaining } : l));
      showSuccess(`Törlesztés sikeres! Hátralék: ${newRemaining} Ft`);
      addTransaction(currentPlayerId, "expense", `Hitel törlesztése (${loan.lenderName})`, amount);
    }
  };

  const handleUpdateBankConfig = (interestRate: number, maxLoanAmount: number) => {
    if (selectedBankBuilding) {
      setBankConfigs(prev => ({
        ...prev,
        [selectedBankBuilding.id]: { interestRate, maxLoanAmount }
      }));
      showSuccess("Bank beállításai frissítve!");
    }
  };

  const handleBuildingClick = (buildingId: string) => {
    if (isPlacementMode) return;
    const building = buildings.find(b => b.id === buildingId);
    
    if (building?.type === 'shop') {
      setSelectedShopBuilding(building);
      setIsShopMenuOpen(true);
      return;
    }

    if (building?.type === 'bank') {
       setSelectedBankBuilding(building);
       setIsBankMenuOpen(true);
       return;
    }
    
    setSelectedBuilding(building || null);
    
    if (building?.type === 'office' && building.name === 'Piac') {
      setCurrentMarketBuildingId(building.id);
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

  const handlePlaceBuilding = (gridX: number, gridY: number, continuous: boolean) => {
    if (!buildingToPlace) return;

    // Calculate effective size based on rotation
    const effectiveWidth = (currentBuildingRotation === 90 || currentBuildingRotation === 270) ? buildingToPlace.height : buildingToPlace.width;
    const effectiveHeight = (currentBuildingRotation === 90 || currentBuildingRotation === 270) ? buildingToPlace.width : buildingToPlace.height;

    // Check map boundaries
    if (gridX + effectiveWidth > mapGridSize || gridY + effectiveHeight > mapGridSize) {
      showError("Az épület kilógna a pályáról!");
      return;
    }

    // Check road adjacency if Town Hall exists
    const townHallExists = buildings.some(b => b.name === 'Polgármesteri Hivatal');
    const isExempt = buildingToPlace.name === 'Sátor' || buildingToPlace.name === 'Erdészház';
    
    if (townHallExists && !isExempt) {
      let isAdjacentToRoad = false;
      const roadTiles = new Set(buildings.filter(b => b.type === 'road').map(b => `${b.x},${b.y}`));
      
      for (let x = 0; x < effectiveWidth; x++) {
        for (let y = 0; y < effectiveHeight; y++) {
          const checkX = gridX + x;
          const checkY = gridY + y;
          
          // Check 4 neighbors
          if (roadTiles.has(`${checkX+1},${checkY}`) || 
              roadTiles.has(`${checkX-1},${checkY}`) || 
              roadTiles.has(`${checkX},${checkY+1}`) || 
              roadTiles.has(`${checkX},${checkY-1}`)) {
            isAdjacentToRoad = true;
            break;
          }
        }
        if (isAdjacentToRoad) break;
      }
      
      if (!isAdjacentToRoad) {
        showError("Az épületet csak út mellé lehet építeni (Polgármesteri rendelet)!");
        return;
      }
    }

    // Check collision for every cell of the new building
    for (let x = 0; x < effectiveWidth; x++) {
      for (let y = 0; y < effectiveHeight; y++) {
        if (isCellOccupied(gridX + x, gridY + y)) {
          showError("Hely foglalt!");
          return;
        }
      }
    }

    if (currentPlayer.money < buildingToPlace.cost) {
      showError("Nincs elég pénzed!");
      return;
    }

    if (buildingToPlace.woodCost && (currentPlayer.inventory.wood || 0) < buildingToPlace.woodCost) {
      showError("Nincs elég fád!");
      return;
    }

    if (buildingToPlace.brickCost && (currentPlayer.inventory.brick || 0) < buildingToPlace.brickCost) {
      showError("Nincs elég téglád!");
      return;
    }

    if (buildingToPlace.stoneCost && (currentPlayer.inventory.stone || 0) < buildingToPlace.stoneCost) {
      showError("Nincs elég köved!");
      return;
    }

    setBuildTarget({ x: gridX, y: gridY });
    setGhostBuildingCoords({ x: gridX, y: gridY });
    setIsPlacingBuilding(true);
    const newId = `${buildingToPlace.name}-${Date.now()}`;
    const duration = buildingToPlace.duration;
    const newHouseNumber = lastHouseNumber + 1;
    setLastHouseNumber(newHouseNumber);

    executeAtTile(gridX, gridY, () => {
      // Biztonsági újraellenőrzés érkezéskor
      const effectiveWidthArrive = (currentBuildingRotation === 90 || currentBuildingRotation === 270) ? buildingToPlace.height : buildingToPlace.width;
      const effectiveHeightArrive = (currentBuildingRotation === 90 || currentBuildingRotation === 270) ? buildingToPlace.width : buildingToPlace.height;
      for (let x = 0; x < effectiveWidthArrive; x++) {
        for (let y = 0; y < effectiveHeightArrive; y++) {
          if (isCellOccupied(gridX + x, gridY + y)) {
            showError("Időközben a hely foglalt lett!");
            return;
          }
        }
      }
      const woodNeed = buildingToPlace.woodCost || 0;
      const brickNeed = buildingToPlace.brickCost || 0;
      const stoneNeed = buildingToPlace.stoneCost || 0;
      if (currentPlayer.money < buildingToPlace.cost || (currentPlayer.inventory.wood || 0) < woodNeed || (currentPlayer.inventory.brick || 0) < brickNeed || (currentPlayer.inventory.stone || 0) < stoneNeed) {
        showError("Nincs elég erőforrásod az építéshez!");
        return;
      }

      setPlayers(prev => prev.map(p => 
        p.id === currentPlayerId ? {
          ...p,
          money: p.money - buildingToPlace.cost,
          inventory: {
            ...p.inventory,
            wood: (p.inventory.wood || 0) - woodNeed,
            brick: (p.inventory.brick || 0) - brickNeed,
            stone: (p.inventory.stone || 0) - stoneNeed
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
        category: buildingToPlace.category,
        rentalPrice: buildingToPlace.rentalPrice,
        salary: buildingToPlace.salary,
        capacity: buildingToPlace.capacity,
        ownerId: currentPlayerId,
        residentIds: [],
        employeeIds: [],
        isUnderConstruction: true,
        buildProgress: 0, 
        constructionEta: Date.now() + duration,
        originalDuration: duration,
        rotation: currentBuildingRotation,
        farmlandTiles: buildingToPlace.type === "farm" ? [] : undefined,
        level: 1,
        millInventory: buildingToPlace.type === "mill" ? { wheat: 0, flour: 0, corn: 0 } : undefined,
        popcornStandInventory: buildingToPlace.type === "popcorn_stand" ? { corn: 0, popcorn: 0 } : undefined,
        marketFeeType: buildingToPlace.name === "Piac" ? "percent" : undefined,
        marketFeeValue: buildingToPlace.name === "Piac" ? 5 : undefined,
        activeMarketTransactions: buildingToPlace.name === "Piac" ? 0 : undefined,
        customGraphics: buildingToPlace.customGraphics,
        productionConfig: buildingToPlace.productionConfig,
        genericInventory: buildingToPlace.productionConfig ? {} : undefined,
        houseNumber: newHouseNumber,
      };

      setBuildings(prev => [...prev, newBuilding]);

      if (sfxPlayerRef.current) {
        const sound = buildingToPlace.category === "residential" ? "construction-01" : "construction-02";
        sfxPlayerRef.current.playSfx(sound, true);
      }
      setBuildTarget(null);
      setIsPlacingBuilding(continuous);
    });
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
    if (!buildTarget) {
      setGhostBuildingCoords({ x: gridX, y: gridY }); 
    }

    if (isDragging) {
      if (isPlacingFarmland && selectedFarmId && dragStartCoords) {
        const currentDraggedTiles = getTilesInDrag(dragStartCoords, { x: gridX, y: gridY });
        setDraggedTiles(currentDraggedTiles);
      } else if (isPlacingRoad && dragStartCoords) {
        const currentDraggedTiles = getTilesInDrag(dragStartCoords, { x: gridX, y: gridY });
        setGhostRoadTiles(currentDraggedTiles);
      }
    } else if (isPlacingRoad) {
      setGhostRoadTiles([{ x: gridX, y: gridY }]);
    }
  };

  const handleMapMouseUp = (gridX: number, gridY: number) => {
    if (isDragging) {
      if (isPlacingFarmland && selectedFarmId && dragStartCoords) {
        const finalDraggedTiles = getTilesInDrag(dragStartCoords, { x: gridX, y: gridY });
        
        const farm = buildings.find(b => b.id === selectedFarmId);
        if (!farm || farm.ownerId !== currentPlayerId) {
          showError("Ez nem a te farmod!");
          setDraggedTiles([]);
          setIsDragging(false);
          return;
        }
        if (farm.employeeIds.length === 0) {
          showError("A farm zárva van! Nincs alkalmazott.");
          setDraggedTiles([]);
          setIsDragging(false);
          return;
        }

        const placeableTiles = finalDraggedTiles.filter(tile => 
          !isCellOccupied(tile.x, tile.y) &&
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

        const duration = FARMLAND_BUILD_DURATION_MS;

        setBuildings(prev => prev.map(b => {
          if (b.id === selectedFarmId) {
            const newFarmlandTiles = placeableTiles.map(tile => ({
              x: tile.x,
              y: tile.y,
              ownerId: currentPlayerId,
              cropType: CropType.None,
              cropProgress: 0,
              isUnderConstruction: true,
              buildProgress: 0, 
              constructionEta: Date.now() + duration, // Befejezési idő
              originalDuration: duration, // Eredeti időtartam
            }));
            return {
              ...b,
              farmlandTiles: [...(b.farmlandTiles || []), ...newFarmlandTiles]
            };
          }
          return b;
        }));

        if (sfxPlayerRef.current) sfxPlayerRef.current.playSfx("construction-02", true);

        setDraggedTiles([]);
        setIsPlacingFarmland(isShiftPressed); 
        setIsDragging(false);
        
      } else if (isPlacingRoad && dragStartCoords) {
        const finalDraggedTiles = getTilesInDrag(dragStartCoords, { x: gridX, y: gridY });
        
        const placeableRoads = finalDraggedTiles.filter(tile => 
          !isCellOccupied(tile.x, tile.y)
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
          isUnderConstruction: false, 
          rotation: 0,
        }));

        setBuildings(prev => [...prev, ...newRoads]);
        showSuccess(`${placeableRoads.length} út csempe lerakva!`);

        setGhostRoadTiles([]);
        setIsPlacingRoad(isShiftPressed); 
        setIsDragging(false);

      }
    } else if (isPlacingBuilding && buildingToPlace && ghostBuildingCoords) {
      handlePlaceBuilding(gridX, gridY, isShiftPressed);
    } else if (isSelectingTree) {
      const idx = trees.findIndex(t => gridX >= t.x && gridX < t.x + 3 && gridY >= t.y && gridY < t.y + 3);
      if (idx === -1) {
        showError("Nem fára kattintottál. Próbáld újra.");
        return;
      }
      const tree = trees[idx];
      // Find a valid adjacent tile to the tree (3x3 area)
      // We'll try a few positions around the tree and pick the first valid one
      // Tree is 3x3 at tree.x, tree.y
      // Positions to try: bottom-center (x+1, y+3), top-center (x+1, y-1), left-center (x-1, y+1), right-center (x+3, y+1)
      const possibleTargets = [
        { x: tree.x + 1, y: tree.y + 3 }, // Bottom
        { x: tree.x + 1, y: tree.y - 1 }, // Top
        { x: tree.x - 1, y: tree.y + 1 }, // Left
        { x: tree.x + 3, y: tree.y + 1 }, // Right
      ];
      
      const target = possibleTargets.find(t => {
        const isOutOfBounds = t.x < 0 || t.x >= mapGridSize || t.y < 0 || t.y >= mapGridSize;
        if (isOutOfBounds) return false;
        
        return !isCellOccupied(t.x, t.y, true);
      });

      if (!target) {
        showError("Nincs szabad hely a fa körül a vágáshoz.");
        return;
      }
      
      executeAtTile(target.x, target.y, () => {
        if ((currentPlayer.inventory[ProductType.Axe] || 0) < 1) {
          showError("Nincs fejszéd a kivágáshoz!");
          setIsSelectingTree(false);
          return;
        }
        chopProcessRef.current = {
          id: `chop-${Date.now()}-${Math.random()}`,
          playerId: currentPlayerId,
          treeIndex: idx,
          treeX: tree.x,
          treeY: tree.y,
          startTime: Date.now(),
          duration: CHOP_DURATION_MS,
        };
        setIsChopping(true);
        setAxeAnimation({ x: tree.x + 1, y: tree.y + 1, active: true }); // Center of 3x3 tree
        showSuccess("Fa kivágása megkezdve...");
        setIsSelectingTree(false);
      });
    } else if (isSelectingStone) {
      const idx = stones.findIndex(s => gridX >= s.x && gridX < s.x + 2 && gridY >= s.y && gridY < s.y + 2);
      if (idx === -1) {
        showError("Nem kőre kattintottál. Próbáld újra.");
        return;
      }
      const stone = stones[idx];
      const possibleTargets = [
        { x: stone.x + 2, y: stone.y }, // Right side
        { x: stone.x - 1, y: stone.y }, // Left side
        { x: stone.x, y: stone.y + 2 }, // Bottom side
        { x: stone.x, y: stone.y - 1 }, // Top side
        { x: stone.x + 1, y: stone.y + 2 }, // Bottom side (2nd tile)
        { x: stone.x + 1, y: stone.y - 1 }, // Top side (2nd tile)
        { x: stone.x + 2, y: stone.y + 1 }, // Right side (2nd tile)
        { x: stone.x - 1, y: stone.y + 1 }, // Left side (2nd tile)
      ];
      const target = possibleTargets.find(t => 
        t.x >= 0 && t.x < mapGridSize && t.y >= 0 && t.y < mapGridSize &&
        !isCellOccupied(t.x, t.y, true)
      ) || possibleTargets[0];

      executeAtTile(target.x, target.y, () => {
        if ((currentPlayer.inventory[ProductType.Pickaxe] || 0) < 1) {
          showError("Nincs csákányod a bányászathoz!");
          setIsSelectingStone(false);
          return;
        }
        stoneMineProcessRef.current = {
          id: `mine-${Date.now()}-${Math.random()}`,
          playerId: currentPlayerId,
          stoneIndex: idx,
          stoneX: stone.x,
          stoneY: stone.y,
          startTime: Date.now(),
          duration: 5000, 
        };
        setIsMining(true);
        setPickaxeAnimation({ x: stone.x, y: stone.y, active: true }); 
        showSuccess("Kőbányászat megkezdve...");
        setIsSelectingStone(false);
      });
    } else if (!isPlacementMode) {
      executeAtTile(gridX, gridY, () => {});
    }
  };

  const handleBuildBuilding = (buildingName: string) => {
    const opt = customBuildings.find(b => b.name === buildingName) || availableBuildingOptions.find(o => o.name === buildingName);
    if (!opt) return;

    if (opt.category === "business") {
      const hasHome = buildings.some(b => b.type === "house" && b.residentIds.includes(currentPlayerId));
      if (!hasHome) {
        showError("Lakóhely nélkül vállalkozást nem építhetsz.");
        return;
      }
    }

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
    setBuildTarget(null);
    showSuccess(`Építés mód aktiválva: ${opt.name}. Kattints a térképre a lerakáshoz. (Shift: folyamatos)`);
  };



  const handleApplyForJob = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building || !building.salary) return;
    if (currentPlayer.workplace !== "Munkanélküli") {
      showError("Előbb fel kell mondanod a jelenlegi munkahelyeden!");
      return;
    }
    if (building.employeeIds.length >= building.capacity) {
      showError("Ez a munkahely már betelt!");
      return;
    }
    executeAtBuilding(buildingId, () => {
      setBuildings(prev => prev.map(b => 
        b.id === buildingId ? { 
          ...b, 
          employeeIds: [...b.employeeIds, currentPlayerId]
        } : b
      ));
      setPlayers(prev => prev.map(p => 
        p.id === currentPlayerId ? { 
          ...p, 
          workplace: building.name,
          workplaceSalary: building.salary!
        } : p
      ));
      showSuccess(`Sikeresen elhelyezkedtél a(z) ${building.name} munkahelyen!`);
      setIsJobHousingFinderOpen(false);
    });
  };

  const handleRentHouse = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building || building.type !== "house") return;
    if (buildings.some(b => b.residentIds.includes(currentPlayer.id))) {
      showError("Már bérelsz egy ingatlant! Előbb ki kell költöznöd.");
      return;
    }
    if (building.residentIds.length >= building.capacity) {
      showError("Ez a lakás már betelt!");
      return;
    }
    const rent = building.rentalPrice ?? 0;
    const isOwner = building.ownerId === currentPlayerId;
    
    if (!isOwner && currentPlayer.money < rent) {
      showError("Nincs elég pénzed az első bérleti díj kifizetéséhez!");
      return;
    }
    executeAtBuilding(buildingId, () => {
      if (!isOwner) {
        setPlayers(prev => prev.map(p => 
          p.id === currentPlayerId ? {
            ...p,
            money: p.money - rent
          } : p
        ));
        addTransaction(currentPlayerId, "expense", `Első bérleti díj: ${building.name}`, rent);
      }
      setBuildings(prev => prev.map(b => 
        b.id === buildingId ? { 
          ...b, 
          residentIds: [...b.residentIds, currentPlayerId],
          renterId: isOwner ? undefined : currentPlayerId
        } : b
      ));
      showSuccess(`Sikeresen beköltöztél a(z) ${building.name} ingatlanba!`);
      setIsJobHousingFinderOpen(false);
    });
  };

  const handleResignFromJob = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building || !building.employeeIds.includes(currentPlayerId)) return;

    setBuildings(prev => prev.map(b => 
      b.id === buildingId ? { 
        ...b, 
        employeeIds: b.employeeIds.filter(id => id !== currentPlayerId)
      } : b
    ));

    setPlayers(prev => prev.map(p => 
      p.id === currentPlayerId ? { 
        ...p, 
        workplace: "Munkanélküli",
        workplaceSalary: 0
      } : p
    ));

    showSuccess(`Felmondtál a(z) ${building.name} munkahelyen.`);
    setSelectedBuilding(null);
  };

  const handleMoveOut = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    setBuildings(prev => prev.map(b => {
      if (b.id === buildingId) {
        return { ...b, residentIds: b.residentIds.filter(id => id !== currentPlayerId) };
      }
      return b;
    }));
    showSuccess(`Kiköltöztél a(z) ${building.name} épületből.`);
    setSelectedBuilding(null);
  };

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
    executeAtBuilding(shopId, () => {
      const cost = (currentPlayerId === shop.ownerId) ? 0 : item.sellPrice * qty;
      setPlayers(prev => prev.map(p => {
        if (p.id === currentPlayerId) {
          return {
            ...p,
            money: Math.max(0, p.money - cost),
            inventory: {
              ...p.inventory,
              [type]: (p.inventory[type] || 0) + qty
            }
          };
        }
        if (p.id === shop.ownerId && currentPlayerId !== shop.ownerId) {
          return {
            ...p,
            money: p.money + cost
          };
        }
        return p;
      }));
      if (currentPlayerId !== shop.ownerId) {
        addTransaction(currentPlayerId, "expense", `Vásárlás: ${item.name} (${qty} db)`, cost);
        addTransaction(shop.ownerId!, "income", `Eladás: ${item.name} (${qty} db)`, cost);
      }
      setShopInventories(prev => ({
        ...prev,
        [shopId]: prev[shopId].map(i => 
          i.type === type ? { ...i, stock: i.stock - qty } : i
        )
      }));
      showSuccess("Vásárlás megtörtént.");
    });
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

  const handleAddWheatToMill = (millId: string, quantity: number) => {
    const mill = buildings.find(b => b.id === millId);
    if (!mill || !mill.ownerId) return;

    if ((currentPlayer.inventory.wheat || 0) < quantity) {
      showError("Nincs elég búzád a művelethez!");
      return;
    }

    executeAtBuilding(millId, () => {
      setPlayers(prev => prev.map(p => {
        if (p.id === currentPlayerId) {
          return {
            ...p,
            inventory: {
              ...p.inventory,
              wheat: (p.inventory.wheat || 0) - quantity
            }
          };
        }
        return p;
      }));
  
      setBuildings(prev => prev.map(b => {
          if (b.id === millId && b.type === 'mill') {
              return {
                  ...b,
                  millInventory: {
                      wheat: (b.millInventory?.wheat || 0) + quantity,
                      flour: b.millInventory?.flour || 0,
                      corn: b.millInventory?.corn || 0,
                  }
              };
          }
          return b;
      }));
      
      showSuccess(`${quantity} búza hozzáadva a malom készletéhez!`);
      const current = buildings.find(b => b.id === millId);
      if (current && current.employeeIds.length > 0) {
        const available = (current.millInventory?.wheat || 0) + quantity;
        const batches = Math.floor(available / MILL_WHEAT_CONSUMPTION_PER_PROCESS);
        if (batches > 0) {
          const totalDuration = batches * MILL_PROCESSING_TIME_MS;
          const proc: MillProcess = {
            id: `mill-proc-${Date.now()}-${Math.random()}`,
            millId,
            startTime: Date.now(),
            duration: totalDuration,
            wheatConsumed: batches * MILL_WHEAT_CONSUMPTION_PER_PROCESS,
            flourProduced: batches * MILL_FLOUR_PRODUCTION_PER_PROCESS,
            productType: ProductType.Flour,
          };
          setMillProcesses(prev => [...prev, proc]);
          setBuildings(prev => prev.map(b => {
            if (b.id === millId && b.type === 'mill') {
              return {
                ...b,
                millInventory: {
                  wheat: available - proc.wheatConsumed,
                  flour: b.millInventory?.flour || 0,
                  corn: b.millInventory?.corn || 0,
                }
              };
            }
            return b;
          }));
        }
      }
    });
  };

  const handleAddCornToPopcornStand = (standId: string, quantity: number) => {
    const stand = buildings.find(b => b.id === standId);
    if (!stand || stand.type !== 'popcorn_stand') return;
    if ((currentPlayer.inventory[ProductType.Corn] || 0) < quantity) {
      showError("Nincs elég kukoricád a művelethez!");
      return;
    }
    executeAtBuilding(standId, () => {
      setPlayers(prev => prev.map(p => {
        if (p.id === currentPlayerId) {
          return {
            ...p,
            inventory: {
              ...p.inventory,
              [ProductType.Corn]: (p.inventory[ProductType.Corn] || 0) - quantity
            }
          };
        }
        return p;
      }));
      setBuildings(prev => prev.map(b => {
        if (b.id === standId && b.type === 'popcorn_stand') {
          return {
            ...b,
            popcornStandInventory: {
              corn: (b.popcornStandInventory?.corn || 0) + quantity,
              popcorn: b.popcornStandInventory?.popcorn || 0,
            }
          };
        }
        return b;
      }));
      showSuccess(`${quantity} kukorica hozzáadva a stand készletéhez!`);
    });
  };

  const handleStartMillProcess = (millId: string, quantity: number) => {
    executeAtBuilding(millId, () => {
      const mill = buildings.find(b => b.id === millId);
      if (!mill || !mill.ownerId || mill.employeeIds.length === 0) {
        showError("A malom zárva van, vagy nincs alkalmazott!");
        return;
      }
  
      const requiredWheat = quantity * MILL_WHEAT_CONSUMPTION_PER_PROCESS;
      const producedFlour = quantity * MILL_FLOUR_PRODUCTION_PER_PROCESS;
      const totalDuration = quantity * MILL_PROCESSING_TIME_MS;
  
      const currentWheat = mill.millInventory?.wheat || 0;
  
      if (currentWheat < requiredWheat) {
        showError(`Nincs elég búza a malom készletében! Szükséges: ${requiredWheat} db.`);
        return;
      }
  
      setBuildings(prev => prev.map(b => {
        if (b.id === millId && b.type === 'mill') {
          return {
            ...b,
            millInventory: {
              wheat: currentWheat - requiredWheat,
              flour: b.millInventory?.flour || 0,
              corn: b.millInventory?.corn || 0,
            }
          };
        }
        return b;
      }));
  
      const newProcess: MillProcess = {
        id: `mill-proc-${Date.now()}-${Math.random()}`,
        millId: millId,
        startTime: Date.now(),
        duration: totalDuration,
        wheatConsumed: requiredWheat,
        flourProduced: producedFlour,
        productType: ProductType.Flour,
      };
  
      setMillProcesses(prev => [...prev, newProcess]);
      showSuccess(`${quantity} adag búza feldolgozása elindult (${totalDuration / 1000} mp).`);
    });
  };

  const handleStartPopcornProcess = (standId: string, quantity: number) => {
    executeAtBuilding(standId, () => {
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
    });
  };

  const handleStartCustomProcess = (buildingId: string, multiplier: number) => {
    executeAtBuilding(buildingId, () => {
      const building = buildings.find(b => b.id === buildingId);
      if (!building || !building.ownerId || !building.productionConfig) return;
      
      if (building.capacity > 0 && building.employeeIds.length === 0) {
        showError("Az épületben nincs alkalmazott!");
        return;
      }

      const config = building.productionConfig;
      const quantity = config.quantity * multiplier;
      const duration = config.duration * multiplier;
      
      if (config.consumes && config.consumesQuantity) {
          const required = config.consumesQuantity * multiplier;
          if ((currentPlayer.inventory[config.consumes] || 0) < required) {
              showError(`Nincs elég ${getProductByType(config.consumes as ProductType)?.name || config.consumes}! Szükséges: ${required}`);
              return;
          }
          
          setPlayers(prev => prev.map(p => {
              if (p.id === currentPlayerId) {
                  return {
                      ...p,
                      inventory: {
                          ...p.inventory,
                          [config.consumes!]: (p.inventory[config.consumes!] || 0) - required
                      }
                  };
              }
              return p;
          }));
      }

      const newProcess: CustomProcess = {
          id: `custom-proc-${Date.now()}-${Math.random()}`,
          buildingId,
          startTime: Date.now(),
          duration,
          produces: config.produces as ProductType,
          quantity,
          consumes: config.consumes as ProductType,
          consumesQuantity: config.consumesQuantity ? config.consumesQuantity * multiplier : undefined
      };

      setCustomProcesses(prev => [...prev, newProcess]);
      showSuccess(`Termelés elindult: ${quantity} ${getProductByType(config.produces as ProductType)?.name || config.produces}`);
    });
  };

  const handleAddOffer = (offer: Omit<MarketOffer, 'id' | 'sellerName'>) => {
    const market = currentMarketBuildingId ? buildings.find(b => b.id === currentMarketBuildingId) : null;
    const level = market?.level || 1;
    const maxOffers = level === 1 ? 2 : level === 2 ? 4 : 8;
    const existingBySeller = marketOffers.filter(o => o.sellerId === currentPlayerId).length;
    if (existingBySeller >= maxOffers) {
      showError("Elérted a maximális egyszerre aktív ajánlatok számát ezen a piacon.");
      return false;
    }
    const newOffer: MarketOffer = {
      ...offer,
      id: `offer-${Date.now()}-${Math.random()}`,
      sellerName: currentPlayer.name,
      sellerId: currentPlayerId,
    };
    if (offer.sellingType !== 'money' && (currentPlayer.inventory[offer.sellingType] || 0) < offer.sellingQuantity) {
      showError(`Nincs elég ${getProductByType(offer.sellingType)?.name || offer.sellingType} a készletben!`);
      return false;
    }
    setPlayers(prev => prev.map(p => {
      if (p.id === currentPlayerId) {
        return {
          ...p,
          inventory: {
            ...p.inventory,
            [offer.sellingType]: (p.inventory[offer.sellingType] || 0) - offer.sellingQuantity
          }
        };
      }
      return p;
    }));
    setMarketOffers(prev => [...prev, newOffer]);
    showSuccess("Ajánlat sikeresen kiírva a piacra!");
    return true;
  };

  const handleAcceptOffer = (offerId: string) => {
    const offer = marketOffers.find(o => o.id === offerId);
    if (!offer) return;

    const buyer = currentPlayer;
    const seller = players.find(p => p.id === offer.sellerId);

    if (!seller) {
      showError("Az eladó már nem elérhető.");
      setMarketOffers(prev => prev.filter(o => o.id !== offerId));
      return;
    }

    if (offer.buyingType === 'money') {
      const market = currentMarketBuildingId ? buildings.find(b => b.id === currentMarketBuildingId) : null;
      const feeType = offer.commissionType || market?.marketFeeType;
      const feeValue = offer.commissionValue ?? market?.marketFeeValue ?? 0;
      let commission = 0;
      if (feeType === 'percent') {
        commission = Math.floor((offer.buyingQuantity * (feeValue as number)) / 100);
      } else if (feeType === 'fixed') {
        commission = Math.floor(feeValue as number);
      }
      const totalCost = offer.buyingQuantity + commission;
      if (buyer.money < totalCost) {
        showError("Nincs elég pénzed a cseréhez!");
        return;
      }
    } else {
      if ((buyer.inventory[offer.buyingType] || 0) < offer.buyingQuantity) {
        showError(`Nincs elég ${getProductByType(offer.buyingType as ProductType)?.name || offer.buyingType} a cseréhez!`);
        return;
      }
    }

    setPlayers(prevPlayers => prevPlayers.map(p => {
      if (p.id === buyer.id) {
        const newInventory = { ...p.inventory };
        if (offer.buyingType === 'money') {
          const market = currentMarketBuildingId ? buildings.find(b => b.id === currentMarketBuildingId) : null;
          const feeType = offer.commissionType || market?.marketFeeType;
          const feeValue = offer.commissionValue ?? market?.marketFeeValue ?? 0;
          let commission = 0;
          if (feeType === 'percent') {
            commission = Math.floor((offer.buyingQuantity * (feeValue as number)) / 100);
          } else if (feeType === 'fixed') {
            commission = Math.floor(feeValue as number);
          }
          const totalCost = offer.buyingQuantity + commission;
          p.money -= totalCost;
          addTransaction(p.id, "expense", `Vásárlás a piactéren: ${offer.sellingQuantity} ${offer.sellingType}`, totalCost);
        } else {
          newInventory[offer.buyingType as ProductType] = (newInventory[offer.buyingType as ProductType] || 0) - offer.buyingQuantity;
        }
        newInventory[offer.sellingType as ProductType] = (newInventory[offer.sellingType as ProductType] || 0) + offer.sellingQuantity;
        return { ...p, inventory: newInventory };
      }
      
      if (p.id === seller.id) {
        const newInventory = { ...p.inventory };
        if (offer.buyingType === 'money') {
          const market = currentMarketBuildingId ? buildings.find(b => b.id === currentMarketBuildingId) : null;
          const feeType = offer.commissionType || market?.marketFeeType;
          const feeValue = offer.commissionValue ?? market?.marketFeeValue ?? 0;
          let commission = 0;
          if (feeType === 'percent') {
            commission = Math.floor((offer.buyingQuantity * (feeValue as number)) / 100);
          } else if (feeType === 'fixed') {
            commission = Math.floor(feeValue as number);
          }
          const netIncome = offer.buyingQuantity;
          p.money += netIncome;
          addTransaction(p.id, "income", `Eladás a piactéren: ${offer.sellingQuantity} ${offer.sellingType}`, netIncome);
          if (market?.ownerId && commission > 0) {
            const ownerId = market.ownerId;
            const owner = prevPlayers.find(pp => pp.id === ownerId);
            if (owner) {
              owner.money += commission;
              addTransaction(ownerId, "income", "Piaci részesedés", commission);
            }
          }
        } else {
          newInventory[offer.buyingType as ProductType] = (newInventory[offer.buyingType as ProductType] || 0) + offer.buyingQuantity;
        }
        return { ...p, inventory: newInventory };
      }
      return p;
    }));

    setMarketOffers(prev => prev.filter(o => o.id !== offerId));
    showSuccess(`Sikeres csere! Megkaptad: ${offer.sellingQuantity} ${getProductByType(offer.sellingType as ProductType)?.name || offer.sellingType}.`);
  };

  const handleCancelOffer = (offerId: string) => {
    const offer = marketOffers.find(o => o.id === offerId);
    if (!offer || offer.sellerId !== currentPlayerId) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === currentPlayerId) {
        return {
          ...p,
          inventory: {
            ...p.inventory,
            [offer.sellingType]: (p.inventory[offer.sellingType] || 0) + offer.sellingQuantity
          }
        };
      }
      return p;
    }));

    setMarketOffers(prev => prev.filter(o => o.id !== offerId));
    showSuccess("Ajánlat visszavonva, termék visszakerült a készletbe.");
  };

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


  const handleStartRoadPlacement = (officeId: string) => {
    const office = buildings.find(b => b.id === officeId);
    if (!office || office.name !== 'Polgármesteri Hivatal' || office.ownerId !== currentPlayerId) return;

    setSelectedBuilding(null);
    setIsPlacingRoad(true);
    showSuccess("Útépítési mód aktiválva. Húzd az egeret az út lerakásához. (Shift: folyamatos)");
  };

  const handlePlantCrop = (farmId: string, x: number, y: number, type: CropType) => {
    const farm = buildings.find(b => b.id === farmId);
    if (!farm || farm.employeeIds.length === 0) {
      showError("A farmon nincs alkalmazott a vetéshez!");
      return;
    }
    
    let seedType: ProductType;
    
    if (type === CropType.Wheat) {
      seedType = ProductType.WheatSeed;
    } else if (type === CropType.Corn) {
      seedType = ProductType.CornSeed; 
    } else {
      return;
    }

    if ((currentPlayer.inventory[seedType] || 0) < 1) {
      showError(`Nincs ${getProductByType(seedType)?.name || seedType} vetőmagod! Vásárolj a boltban.`);
      return;
    }
    
    setPlayers(prev => prev.map(p => 
      p.id === currentPlayerId ? {
        ...p,
        inventory: {
          ...p.inventory,
          [seedType]: (p.inventory[seedType] || 0) - 1
        }
      } : p
    ));
    
    setBuildings(prev => prev.map(b => 
      b.id === farmId ? {
        ...b,
        farmlandTiles: b.farmlandTiles?.map(t => 
          t.x === x && t.y === y ? { ...t, cropType: type, cropProgress: 0 } : t
        )
      } : b
    ));
    
    showSuccess(`${getProductByType(seedType)?.name || seedType} elvetve!`);
  };

  const handleHarvestCrop = (farmId: string, x: number, y: number) => {
    const farm = buildings.find(b => b.id === farmId);
    if (!farm || farm.employeeIds.length === 0) {
      showError("Nincs alkalmazott az aratáshoz!");
      return;
    }
    
    const tile = farm.farmlandTiles?.find(t => t.x === x && t.y === y);
    if (!tile || tile.cropProgress! < 100) return;

    let harvestedProduct: ProductType;
    let yieldAmount: number;

    if (tile.cropType === CropType.Wheat) {
      harvestedProduct = ProductType.Wheat;
      yieldAmount = WHEAT_HARVEST_YIELD;
    } else if (tile.cropType === CropType.Corn) {
      harvestedProduct = ProductType.Corn;
      yieldAmount = 10; 
    } else {
      return;
    }
    
    setBuildings(prev => prev.map(b => 
      b.id === farmId ? {
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
          [harvestedProduct]: (p.inventory[harvestedProduct] || 0) + yieldAmount
        }
      } : p
    ));
    
    showSuccess(`Betakarítva ${yieldAmount} ${getProductByType(harvestedProduct)?.name || harvestedProduct}!`);
  };

  const [playerSwitchEnabled, setPlayerSwitchEnabled] = useState(() => {
    return localStorage.getItem("playerSwitchEnabled") !== "false";
  });
  const [avatarSize] = useState(() => {
    const saved = localStorage.getItem("avatarSize");
    return saved ? parseInt(saved, 10) : 100;
  });

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-sidebar-primary-foreground">Tile-o-polis</h2>
        <PlayerSettings 
          playerName={currentPlayer.name} 
          onPlayerNameChange={(n) => setPlayers(prev => prev.map(p => 
            p.id === currentPlayerId ? { ...p, name: n } : p
          ))}
          filterZeroTransactions={filterZeroTransactions}
          onFilterZeroTransactionsChange={setFilterZeroTransactions}
        />
      </div>
      
      <div className="px-1 mb-2 text-xs text-muted-foreground">
        FPS: {fps} {memory ? `| Mem: ${memory} MB` : ''}
      </div>
      
      {playerSwitchEnabled && (
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
      )}
      
        <PlayerInfo 
          playerName={currentPlayer.name} 
          money={currentPlayer.money} 
          inventory={currentPlayer.inventory} 
          workplace={currentPlayer.workplace} 
          workplaceSalary={currentPlayer.workplaceSalary} 
          ownedBusinesses={buildings.filter(b => b.ownerId === currentPlayerId && b.type !== "house" && b.type !== "road")} 
          playerSettingsButton={null} 
          nextTickProgress={tickProgress} 
        timeRemaining={secondsRemaining} 
        isMayor={buildings.find(b => b.name === 'Polgármesteri Hivatal')?.ownerId === currentPlayerId}
        buildings={buildings}
      />
      
      <div className="mt-4 space-y-2">
        {!isPlacementMode ? (
          <>
            <Button onClick={() => setIsBuildMenuOpen(true)} className="w-full bg-blue-600 font-bold">
              Építés
            </Button>
            <Button onClick={() => setIsJobHousingFinderOpen(true)} className="w-full bg-indigo-600 font-bold flex items-center justify-center">
              <BriefcaseIcon className="h-4 w-4 mr-2" /> Állás/Lakás Kereső
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <Button 
              onClick={() => {
                setIsPlacingBuilding(false);
                setIsPlacingFarmland(false);
                setIsPlacingRoad(false);
                setGhostBuildingCoords(null);
                setIsDragging(false);
                setDraggedTiles([]);
                setGhostRoadTiles([]);
              }} 
              className="w-full bg-red-600 flex items-center justify-center"
            >
              <X className="mr-2 h-4 w-4" /> Mégsem
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {isPlacingBuilding && "Shift: Folyamatos építés"}
              {isPlacingFarmland && "Shift: Folyamatos szántás"}
              {isPlacingRoad && "Shift: Folyamatos útépítés"}
            </p>
          </div>
        )}
        <Button onClick={() => setIsMoneyHistoryOpen(true)} className="w-full bg-yellow-600 font-bold">
          Pénzügyek
        </Button>
        <Button onClick={() => navigate('/')} className="w-full bg-gray-600">
          Főmenü
        </Button>
        <Button 
          onClick={() => {
            if (confirm("Biztosan törölni akarod a játékállást és újrakezdeni? Minden elveszik!")) {
              localStorage.clear();
              window.location.reload();
            }
          }} 
          className="w-full bg-red-800 font-bold mt-4"
        >
          ⚠️ Pálya Törlése (Reset)
        </Button>
      </div>
      
      <BankMenu 
        isOpen={isBankMenuOpen}
        onClose={() => setIsBankMenuOpen(false)}
        bankId={selectedBankBuilding?.id || ""}
        ownerId={selectedBankBuilding?.ownerId}
        isOwner={selectedBankBuilding?.ownerId === currentPlayerId}
        currentPlayerId={currentPlayerId}
        currentPlayerMoney={currentPlayer.money}
        activeLoans={loans.filter(l => l.borrowerId === currentPlayerId)}
        onTakeLoan={handleTakeLoan}
        onRepayLoan={handleRepayLoan}
        onUpdateConfig={handleUpdateBankConfig}
        bankConfig={selectedBankBuilding ? bankConfigs[selectedBankBuilding.id] : undefined}
      />
      <SfxPlayer ref={sfxPlayerRef} sfxUrls={sfxUrls} />
      <MusicPlayer tracks={musicTracks} initialDelay={2000} />
    </>
  );

  return (
    <ErrorBoundary>
      {gameoverState && (
        <GameOverScreen
          status={gameoverState}
          onClose={() => {
            setGameoverState(null);
            navigate("/");
          }}
        />
      )}
            <MainLayout 
              sidebarContent={sidebarContent} 
            mainContent={
            <div ref={mainContentRef} className="block w-full h-full relative overflow-hidden bg-black">
                <GameMap 
                  avatarSize={avatarSize}
                  buildings={buildings}                      gridSize={mapGridSize} 
                      cellSizePx={CELL_SIZE_PX} 
                      onBuildingClick={handleBuildingClick}            isPlacingBuilding={isPlacingBuilding} 
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
          isDragging={isDragging}
          trees={trees}
          stumps={stumps}
          isSelectingTree={isSelectingTree}
          isTreeChoppingMode={!!chopProcessRef.current}
          activeChopTree={chopProcessRef.current ? { x: chopProcessRef.current.treeX, y: chopProcessRef.current.treeY } : null}
          treeChopProgress={chopProgressPct}
          isSelectingStone={isSelectingStone}
          isStoneMiningMode={!!stoneMineProcessRef.current}
          activeMineStone={stoneMineProcessRef.current ? { x: stoneMineProcessRef.current.stoneX, y: stoneMineProcessRef.current.stoneY } : null}
          stoneMineProgress={stoneMineProgressPct}
          pickaxeAnimation={pickaxeAnimation}
          stones={stones}
          avatarSize={avatarSize}
          axeAnimation={axeAnimation}
          playerAvatars={players.map(p => ({
            id: p.id,
            name: p.name,
            x: playerPositions[p.id]?.x || 0,
            y: playerPositions[p.id]?.y || 0,
            renderX: playerPositions[p.id]?.renderX,
            renderY: playerPositions[p.id]?.renderY,
            dir: playerPositions[p.id]?.dir || "down",
            frame: playerPositions[p.id]?.frame || 0,
            carryingStone: p.carryingStone
          }))}
          shopInventories={shopInventories}
          bankConfigs={bankConfigs}
          />

          {(isSelectingTree || isSelectingStone || isPlacingBuilding) && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl z-50 flex gap-4 items-center border border-gray-200 dark:border-gray-700">
               <span className="font-semibold">
                {isPlacingBuilding ? "Kattints a térképre az épület lerakásához." : isSelectingTree ? "Válassz ki egy fát a kivágáshoz!" : "Válassz ki egy követ a bányászáshoz!"}
                </span>
               <Button variant="destructive" size="sm" onClick={() => { 
                setIsSelectingTree(false); 
                setIsSelectingStone(false); 
                setIsPlacingBuilding(false);
                setBuildingToPlace(null);
                }}>Mégsem</Button>
            </div>
          )}
          
          {chopProcessRef.current && (
            <div className="absolute bottom-4 left-4 bg-muted/70 dark:bg-black/50 backdrop-blur-sm border rounded p-3 w-64">
              <div className="text-sm font-medium flex items-center gap-2">
                <span>🪓</span>
                <span>Fa kivágása...</span>
              </div>
              <Progress value={chopProgressPct} className="h-2 mt-2" />
            </div>
          )}

          {stoneMineProcessRef.current && (
            <div className="absolute bottom-4 left-4 bg-muted/70 dark:bg-black/50 backdrop-blur-sm border rounded p-3 w-64">
              <div className="text-sm font-medium flex items-center gap-2">
                <span>⛏️</span>
                <span>Kő bányászata...</span>
              </div>
              <Progress value={stoneMineProgressPct} className="h-2 mt-2" />
            </div>
          )}
          
          <SelectedBuildingPanel
            selectedBuilding={selectedBuilding}
            setSelectedBuilding={setSelectedBuilding}
            players={players}
            setPlayers={setPlayers}
            buildings={buildings}
            setBuildings={setBuildings}
            currentPlayerId={currentPlayerId}
            addTransaction={addTransaction}
            customProcesses={customProcesses}
            setCustomProcesses={setCustomProcesses}
            millProcesses={millProcesses}
            setMillProcesses={setMillProcesses}
            popcornProcesses={popcornProcesses}
            setPopcornProcesses={setPopcornProcesses}
            executeAtBuilding={executeAtBuilding}
            setIsShopMenuOpen={setIsShopMenuOpen}
            setSelectedShopBuilding={setSelectedShopBuilding}
            setIsPlacingFarmland={setIsPlacingFarmland}
            setSelectedFarmId={setSelectedFarmId}
            setIsSelectingTree={setIsSelectingTree}
            setIsSelectingStone={setIsSelectingStone}
            handleStartRoadPlacement={handleStartRoadPlacement}
            setIsMarketplaceOpen={setIsMarketplaceOpen}
            handleDemolishBuilding={handleDemolishBuilding}
            handleResignFromJob={handleResignFromJob}
            handleMoveOut={handleMoveOut}
            handleApplyForJob={handleApplyForJob}
          />
          
          {selectedShopBuilding && (
            <ShopMenu 
              isOpen={isShopMenuOpen}
              onClose={() => setIsShopMenuOpen(false)}
              shopOwnerId={selectedShopBuilding.ownerId || ""}
              currentPlayerId={currentPlayerId}
              currentPlayerMoney={currentPlayer.money}
              shopItems={shopInventories[selectedShopBuilding.id] || []}
              shopLevel={selectedShopBuilding.level || 1}
              onAddItem={(it) => executeAtBuilding(selectedShopBuilding.id, () => {
                setShopInventories(prev => ({
                  ...prev,
                  [selectedShopBuilding.id]: [...(prev[selectedShopBuilding.id] || []), {
                    ...it,
                    stock: 0,
                    orderedStock: 0,
                    isDelivering: false
                  }]
                }));
                showSuccess("Termék felvéve a bolt kínálatába.");
              })}
              onOrderStock={(t, q) => {
                const it = shopInventories[selectedShopBuilding.id]?.find(i => i.type === t);
                if (!it) return;
                if (currentPlayer.money < it.wholesalePrice * q) {
                  showError("Nincs elég pénz a rendeléshez.");
                  return;
                }
                executeAtBuilding(selectedShopBuilding.id, () => {
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
                  addTransaction(currentPlayerId, "expense", `Bolt rendelés: ${it.name} (${q} db)`, it.wholesalePrice * q);
                  showSuccess("Rendelés leadva.");
                });
              }}
              onUpdatePrice={(t, p) => executeAtBuilding(selectedShopBuilding.id, () => {
                setShopInventories(prev => ({
                  ...prev,
                  [selectedShopBuilding.id]: prev[selectedShopBuilding.id].map(i => 
                    i.type === t ? { ...i, sellPrice: p } : i
                  )
                }));
                showSuccess("Ár frissítve.");
              })}
              onBuyProduct={(t, q) => handleBuyProduct(selectedShopBuilding.id, t, q)}
              onUpgrade={() => executeAtBuilding(selectedShopBuilding.id, () => handleUpgradeShop(selectedShopBuilding.id))}
            />
          )}
          
          {farmlandActionState && (
            <FarmlandActionDialog 
              {...farmlandActionState}
              onClose={() => setFarmlandActionState(null)}
              playerMoney={currentPlayer.money}
              playerInventory={currentPlayer.inventory}
              onPlant={handlePlantCrop}
              onHarvest={handleHarvestCrop}
            />
          )}

          {isMarketplaceOpen && (
            <MarketplaceMenu
              isOpen={isMarketplaceOpen}
              onClose={() => setIsMarketplaceOpen(false)}
              currentPlayer={currentPlayer}
              allPlayers={players}
              marketOffers={marketOffers}
              onAddOffer={handleAddOffer}
              onAcceptOffer={handleAcceptOffer}
              onCancelOffer={handleCancelOffer}
            />
          )}
          

          <BuildMenu 
            isOpen={isBuildMenuOpen}
            onClose={() => setIsBuildMenuOpen(false)}
            onSelectBuilding={handleBuildBuilding}
            availableBuildings={[...availableBuildingOptions, ...customBuildings].filter(b => b.name !== 'Polgármesteri Hivatal' || !buildings.some(existing => existing.name === 'Polgármesteri Hivatal'))}
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

          <JobHousingFinder
            isOpen={isJobHousingFinderOpen}
            onClose={() => setIsJobHousingFinderOpen(false)}
            buildings={buildings}
            currentPlayer={currentPlayer}
            onApplyForJob={handleApplyForJob}
            onRentHouse={handleRentHouse}
            onResignFromJob={handleResignFromJob}
            onMoveOut={handleMoveOut}
          />

          <MiniMap
            buildings={buildings}
            trees={trees}
            stones={stones}
            players={players.map(p => ({
              id: p.id,
              x: playerPositions[p.id]?.x || 0,
              y: playerPositions[p.id]?.y || 0,
              color: p.id === currentPlayerId ? 'blue' : 'red'
            }))}
            currentPlayerId={currentPlayerId}
            mapGridSize={mapGridSize}
            cameraOffset={{ x: mapOffsetX, y: mapOffsetY }}
            viewportSize={{
              width: mainContentRef.current?.clientWidth || window.innerWidth,
              height: mainContentRef.current?.clientHeight || window.innerHeight
            }}
            cellSizePx={CELL_SIZE_PX}
            onJumpTo={(targetGridX, targetGridY) => {
              const viewportWidth = mainContentRef.current?.clientWidth || window.innerWidth;
              const viewportHeight = mainContentRef.current?.clientHeight || window.innerHeight;
              
              const targetPixelX = targetGridX * CELL_SIZE_PX;
              const targetPixelY = targetGridY * CELL_SIZE_PX;
              
              let newOffsetX = -(targetPixelX - viewportWidth / 2);
              let newOffsetY = -(targetPixelY - viewportHeight / 2);
              
              const mapWidth = mapGridSize * CELL_SIZE_PX;
              const mapHeight = mapGridSize * CELL_SIZE_PX; // Matches content height
              
              const minX = Math.min(0, -(mapWidth - viewportWidth));
              const minY = Math.min(0, -(mapHeight - viewportHeight));
              
              newOffsetX = Math.max(minX, Math.min(0, newOffsetX));
              newOffsetY = Math.max(minY, Math.min(0, newOffsetY));
              
              setMapOffsetX(newOffsetX);
              setMapOffsetY(newOffsetY);
              cameraVelocity.current = { x: 0, y: 0 };
            }}
          />
        </div>
      } 
    />
    </ErrorBoundary>
  );
};

export default Game;
