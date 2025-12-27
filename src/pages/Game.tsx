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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import BuildMenu, { BuildingOption } from "@/components/BuildMenu";
import MusicPlayer from "@/components/MusicPlayer";
import SfxPlayer, { SfxPlayerRef } from "@/components/SfxPlayer";
import { musicTracks } from "@/utils/musicFiles";
import { sfxUrls } from "@/utils/sfxFiles";
import PlayerSettings from "@/components/PlayerSettings";
import { RotateCw, ChevronLeft, ChevronRight, Sprout, Coins, Building as BuildingIcon, Route, Wrench, Trash2, ChevronUp, ChevronDown, X, Users, Wheat, Factory, Clock, DollarSign, Popcorn, Briefcase as BriefcaseIcon, Home as HomeIcon, Leaf } from "lucide-react";
import { allProducts, ProductType, getProductByType } from "@/utils/products";
import FarmlandActionDialog from "@/components/FarmlandActionDialog";
import { CropType, FarmlandTile } from "@/components/Building";
import ShopMenu from "@/components/ShopMenu";
import MarketplaceMenu from "@/components/MarketplaceMenu";
import BankMenu, { Loan, BankConfig } from "@/components/BankMenu";
import { useNavigate, useLocation } from "react-router-dom";
import MoneyHistory, { Transaction } from "@/components/MoneyHistory";
import JobHousingFinder from "@/components/JobHousingFinder";

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

const MAP_GRID_SIZE = 32;
const CELL_SIZE_PX = 32; 
const RENT_INTERVAL_MS = 30000;
const AVATAR_TICK_MS = 50;
const AVATAR_SPEED_PX = 8;
const BUILD_HOUSE_COST = 500;
const BUILD_HOUSE_DURATION_MS = 10000;
const OFFICE_SALARY_PER_INTERVAL = 10;
const DEMOLISH_REFUND_PERCENTAGE = 0.5;
const WHEAT_GROW_TIME_MS = 60000;
const WHEAT_HARVEST_YIELD = 10; 
const CORN_GROW_TIME_MS = 90000; 
const MILL_WHEAT_CONSUMPTION_PER_PROCESS = 5;
const MILL_FLOUR_PRODUCTION_PER_PROCESS = 3;
const MILL_CORN_CONSUMPTION_PER_PROCESS = 4; 
const MILL_CORNFLOUR_PRODUCTION_PER_PROCESS = 3; 
const MILL_PROCESSING_TIME_MS = 10000;
const MILL_WHEAT_BUY_PRICE = 5;
const POPCORN_CORN_CONSUMPTION = 2; 
const POPCORN_PRODUCTION = 5; 
const POPCORN_PROCESSING_TIME_MS = 5000;
const ROAD_STONE_COST_PER_TILE = 1;
const FARMLAND_COST_PER_TILE = 3; 
const ROAD_COST_PER_TILE = 5; 
const FARMLAND_BUILD_DURATION_MS = 3000; // Egységes építési idő a szántóföld csempéknek
const CHOP_DURATION_MS = 3000;
const DEMOLISH_DURATION_MS = 5000;

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
  commissionType?: 'percent' | 'fixed';
  commissionValue?: number;
}

interface MillProcess {
  id: string;
  millId: string;
  startTime: number;
  duration: number;
  wheatConsumed: number;
  flourProduced: number;
  productType: ProductType;
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
  { type: "house", category: "residential", name: "Sátor", cost: 200, duration: 5000, width: 2, height: 1, rentalPrice: 0, capacity: 1 },
  { type: "house", category: "residential", name: "Házikó", cost: BUILD_HOUSE_COST, duration: 10000, width: 2, height: 2, rentalPrice: 10, capacity: 2 },
  { type: "house", category: "residential", name: "Vályogház", cost: 750, duration: 15000, width: 3, height: 2, rentalPrice: 15, capacity: 3 }, // Név frissítve
  { type: "house", category: "residential", name: "Kádárkocka", cost: 1200, duration: 25000, width: 3, height: 3, rentalPrice: 25, capacity: 4 },
  { type: "house", category: "residential", name: "Családi Ház", cost: 1800, duration: 35000, width: 4, height: 2, rentalPrice: 35, capacity: 5 },
  { type: "house", category: "residential", name: "Villa (kétszintes)", cost: 2500, duration: 45000, width: 3, height: 3, rentalPrice: 50, capacity: 6 },
  { type: "house", category: "residential", name: "Nagy Villa", cost: 3500, duration: 60000, width: 4, height: 4, rentalPrice: 70, capacity: 8 },
  { type: "office", category: "business", name: "Közszolgálati Iroda", cost: 1000, duration: 20000, width: 3, height: 8, salary: OFFICE_SALARY_PER_INTERVAL, capacity: 4 },
  { type: "forestry", category: "business", name: "Erdészház", cost: 850, woodCost: 5, duration: 15000, width: 4, height: 4, salary: 8, capacity: 1 },
  { type: "quarry", category: "business", name: "Kőfejtő", cost: 1200, woodCost: 10, duration: 25000, width: 3, height: 3, salary: 12, capacity: 1 },
  { type: "farm", category: "business", name: "Farm", cost: 1000, brickCost: 5, woodCost: 3, duration: 15000, width: 4, height: 4, salary: 5, capacity: 2 },
  { type: "office", category: "business", name: "Polgármesteri Hivatal", cost: 2500, woodCost: 10, brickCost: 15, duration: 40000, width: 4, height: 3, salary: 20, capacity: 5 },
  { type: "shop", category: "business", name: "Bolt", cost: 1500, woodCost: 8, brickCost: 10, duration: 30000, width: 3, height: 3, salary: 10, capacity: 3 },
  { type: "mill", category: "business", name: "Malom", cost: 2000, woodCost: 10, brickCost: 15, stoneCost: 5, duration: 35000, width: 4, height: 4, salary: 15, capacity: 3 },
  { type: "office", category: "business", name: "Piac", cost: 3000, woodCost: 15, brickCost: 15, duration: 50000, width: 5, height: 5, salary: 25, capacity: 5 },
  { type: "popcorn_stand", category: "business", name: "Popcorn Árus", cost: 500, woodCost: 2, duration: 10000, width: 2, height: 2, salary: 5, capacity: 1 }, 
];

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

  const [players, setPlayers] = useState<Player[]>(incomingPlayers && incomingPlayers.length > 0 ? incomingPlayers : DEFAULT_PLAYERS);

  const [currentPlayerId, setCurrentPlayerId] = useState<string>(() => {
    const source = incomingPlayers && incomingPlayers.length > 0 ? incomingPlayers : DEFAULT_PLAYERS;
    const fallbackId = source[0].id;
    if (initialCurrentPlayerId && source.some(p => p.id === initialCurrentPlayerId)) {
      return initialCurrentPlayerId;
    }
    return fallbackId;
  });
  const currentPlayer = players.find(p => p.id === currentPlayerId) || players[0];
  const [buildings, setBuildings] = useState<BuildingData[]>(initialBuildingsState || []);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [isBuildingInProgress, setIsBuildingInProgress] = useState(false); 
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);
  const [isMoneyHistoryOpen, setIsMoneyHistoryOpen] = useState(false);
  const [isJobHousingFinderOpen, setIsJobHousingFinderOpen] = useState(false); // ÚJ ÁLLAPOT
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

  const [bankConfigs, setBankConfigs] = useState<Record<string, BankConfig>>({});
  const [loans, setLoans] = useState<Loan[]>([]);
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
  const [isSelectingTree, setIsSelectingTree] = useState(false);
  const [stumps, setStumps] = useState<{ x: number; y: number; cyclesRemaining?: number }[]>([]);
  const [axeWoodCounter, setAxeWoodCounter] = useState<Record<string, number>>({});
  const [pickaxeStoneCounter, setPickaxeStoneCounter] = useState<Record<string, number>>({});
  const [chopProcess, setChopProcess] = useState<{
    id: string;
    playerId: string;
    treeIndex: number;
    treeX: number;
    treeY: number;
    startTime: number;
    duration: number;
  } | null>(null);
  const [chopProgressPct, setChopProgressPct] = useState(0);

  const [isSelectingStone, setIsSelectingStone] = useState(false);
  const [stoneMineProcess, setStoneMineProcess] = useState<{
    id: string;
    playerId: string;
    stoneIndex: number;
    stoneX: number;
    stoneY: number;
    startTime: number;
    duration: number;
  } | null>(null);
  const [stoneMineProgressPct, setStoneMineProgressPct] = useState(0);
  
  const [axeAnimation, setAxeAnimation] = useState<{ x: number; y: number; active: boolean } | null>(null);
  const [pickaxeAnimation, setPickaxeAnimation] = useState<{ x: number; y: number; active: boolean } | null>(null);

  // Stop axe animation after some time
  useEffect(() => {
    if (axeAnimation?.active) {
      const timer = setTimeout(() => {
        setAxeAnimation(null);
      }, 1500); // 3 chops (0.5s each)
      return () => clearTimeout(timer);
    }
  }, [axeAnimation]);

  // Stop pickaxe animation after some time
  useEffect(() => {
    if (pickaxeAnimation?.active) {
      const timer = setTimeout(() => {
        setPickaxeAnimation(null);
      }, 1500); // 3 chops (0.5s each)
      return () => clearTimeout(timer);
    }
  }, [pickaxeAnimation]);

  const generateInitialTrees = (gridSize: number, initialBuildings: BuildingData[]) => {
    const positions: { x: number; y: number }[] = [];
    const occ = new Set<string>();
    (initialBuildings || []).forEach(b => {
      const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
      const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
      for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) occ.add(`${b.x+dx},${b.y+dy}`);
      b.farmlandTiles?.forEach(ft => occ.add(`${ft.x},${ft.y}`));
    });
    const maxTrees = Math.max(3, Math.floor(gridSize / 6));
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
    const positions: { x: number; y: number }[] = [];
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

    const maxStones = Math.max(5, Math.floor(gridSize / 1.5)); // More stones for gameplay
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
        positions.push({ x, y });
        cells.forEach(c => occ.add(c));
      }
    }
    return positions;
  };

  const [trees, setTrees] = useState<{ x: number; y: number }[]>(() => generateInitialTrees(MAP_GRID_SIZE, initialBuildingsState || []));
  const [stones, setStones] = useState<{ x: number; y: number }[]>(() => generateInitialStones(MAP_GRID_SIZE, initialBuildingsState || [], trees));
  
  const findPath = useCallback((start: { x: number; y: number }, goal: { x: number; y: number }) => {
    const inBounds = (x: number, y: number) => x >= 0 && x < MAP_GRID_SIZE && y >= 0 && y < MAP_GRID_SIZE;
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
    stumps.forEach(s => blocked.add(`${s.x},${s.y}`));
    stones.forEach(s => blocked.add(`${s.x},${s.y}`)); // Stones block path
    Object.entries(playerPositions).forEach(([pid, pos]) => {
      if (pid !== currentPlayerId) blocked.add(`${pos.x},${pos.y}`);
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
  }, [buildings, trees, stumps, playerPositions, currentPlayerId]);

  const executeAtBuilding = useCallback((buildingId: string, action: () => void) => {
    const b = buildings.find(bb => bb.id === buildingId);
    if (!b) return;
    const pos = playerPositions[currentPlayerId] || { x: 0, y: 0, dir: "down" as const, frame: 0, path: [] };
    const inBounds = (x: number, y: number) => x >= 0 && x < MAP_GRID_SIZE && y >= 0 && y < MAP_GRID_SIZE;
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
    const sortedByDistance = uniquePerimeter.sort((a, b2) => {
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
      const path = findPath({ x: pos.x, y: pos.y }, { x: target.x, y: target.y });
      if (path.length > 0) {
        chosenPath = path;
        break;
      }
    }
    if (chosenPath.length === 0) {
      showError("Nem találtam útvonalat a célhoz.");
      return;
    }
    setPlayerPositions(prev => ({ ...prev, [currentPlayerId]: { ...pos, path: chosenPath } }));
    setPendingActions(prev => ({ ...prev, [currentPlayerId]: action }));
    showSuccess("Elindultál a célhoz.");
  }, [buildings, playerPositions, currentPlayerId, findPath]);

  const executeAtTile = useCallback((tileX: number, tileY: number, action: () => void) => {
    const pos = playerPositions[currentPlayerId] || { x: 0, y: 0, dir: "down" as const, frame: 0, path: [] };
    if (pos.x === tileX && pos.y === tileY) {
      action();
      return;
    }
    const path = findPath({ x: pos.x, y: pos.y }, { x: tileX, y: tileY });
    if (path.length === 0) {
      showError("Nem találtam útvonalat a célhoz.");
      return;
    }
    setPlayerPositions(prev => ({ ...prev, [currentPlayerId]: { ...pos, path } }));
    setPendingActions(prev => ({ ...prev, [currentPlayerId]: action }));
    showSuccess("Elindultál a célhoz.");
  }, [playerPositions, currentPlayerId, findPath]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setPlayerPositions(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(pid => {
          const pos = next[pid];
          if (pos.path.length > 0) {
            const step = pos.path[0];
            const targetXpx = step.x * CELL_SIZE_PX;
            const targetYpx = step.y * CELL_SIZE_PX;
            let dir: "down" | "left" | "right" | "up" = pos.dir;
            let newRenderX = pos.renderX;
            let newRenderY = pos.renderY;
            if (targetXpx > pos.renderX) { dir = "right"; newRenderX = Math.min(targetXpx, pos.renderX + AVATAR_SPEED_PX); }
            else if (targetXpx < pos.renderX) { dir = "left"; newRenderX = Math.max(targetXpx, pos.renderX - AVATAR_SPEED_PX); }
            else if (targetYpx > pos.renderY) { dir = "down"; newRenderY = Math.min(targetYpx, pos.renderY + AVATAR_SPEED_PX); }
            else if (targetYpx < pos.renderY) { dir = "up"; newRenderY = Math.max(targetYpx, pos.renderY - AVATAR_SPEED_PX); }
            const arrived = newRenderX === targetXpx && newRenderY === targetYpx;
            const frame = (pos.frame + 1) % 3;
            if (arrived) {
              next[pid] = { ...pos, x: step.x, y: step.y, renderX: targetXpx, renderY: targetYpx, dir, frame, path: pos.path.slice(1) };
            } else {
              next[pid] = { ...pos, renderX: newRenderX, renderY: newRenderY, dir, frame };
            }
          } else {
            const action = pendingActions[pid];
            if (action) {
              setPendingActions(prevActs => ({ ...prevActs, [pid]: null }));
              action();
            }
          }
        });
        return next;
      });
    }, AVATAR_TICK_MS);
    return () => clearInterval(timer);
  }, [pendingActions]);
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

  const [millProcesses, setMillProcesses] = useState<MillProcess[]>([]);
  const [popcornProcesses, setPopcornProcesses] = useState<PopcornProcess[]>([]); 

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCoords, setDragStartCoords] = useState<{ x: number; y: number } | null>(null);
  const [draggedTiles, setDraggedTiles] = useState<{ x: number; y: number }[]>([]); 

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

  const handleCutTree = (forestryId: string) => {
    const forestry = buildings.find(b => b.id === forestryId);
    if (!forestry || forestry.type !== 'forestry') return;
    if ((currentPlayer.inventory[ProductType.Axe] || 0) < 1) {
      showError("Szükséges eszköz: Fejsze 🪓");
      return;
    }
    setIsSelectingTree(true);
    setSelectedBuilding(null);
    showSuccess("Válassz ki egy fát a térképen kivágáshoz!");
  };

  const handleMineStone = (quarryId: string) => {
    const quarry = buildings.find(b => b.id === quarryId);
    if (!quarry || quarry.type !== 'quarry') return;
    if ((currentPlayer.inventory[ProductType.Pickaxe] || 0) < 1) {
      showError("Szükséges eszköz: Csákány ⛏️");
      return;
    }
    setIsSelectingStone(true);
    setSelectedBuilding(null);
    showSuccess("Válassz ki egy követ a térképen bányászáshoz!");
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

  useEffect(() => {
    if (!chopProcess) {
      setChopProgressPct(0);
      return;
    }
    const timer = setInterval(() => {
      const elapsed = Date.now() - chopProcess.startTime;
      const pct = Math.min(100, (elapsed / chopProcess.duration) * 100);
      setChopProgressPct(pct);
      if (elapsed >= chopProcess.duration) {
        clearInterval(timer);
        const idx = chopProcess.treeIndex;
        const tx = chopProcess.treeX;
        const ty = chopProcess.treeY;
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
        setChopProcess(null);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [chopProcess, axeWoodCounter, currentPlayerId]);

  useEffect(() => {
    if (!stoneMineProcess) {
      setStoneMineProgressPct(0);
      return;
    }
    const timer = setInterval(() => {
      const elapsed = Date.now() - stoneMineProcess.startTime;
      const pct = Math.min(100, (elapsed / stoneMineProcess.duration) * 100);
      setStoneMineProgressPct(pct);
      if (elapsed >= stoneMineProcess.duration) {
        clearInterval(timer);
        const idx = stoneMineProcess.stoneIndex;
        // const sx = stoneMineProcess.stoneX;
        // const sy = stoneMineProcess.stoneY;
        setStones(prev => prev.filter((_, i) => i !== idx));
        
        const gain = 10; 
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
            inventory: {
              ...p.inventory,
              [ProductType.Stone]: (p.inventory[ProductType.Stone] || 0) + gain,
              [ProductType.Pickaxe]: Math.max(0, (p.inventory[ProductType.Pickaxe] || 0) - pickaxeDec)
            }
          } : p
        ));
        addTransaction(currentPlayerId, "income", `Kőbányászat (kő)`, 0);
        showSuccess(`Kő kibányászva. +${gain} kő. ${pickaxeDec > 0 ? "A csákány elhasználódott." : "A csákány kopott."}`);
        setStoneMineProcess(null);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [stoneMineProcess, pickaxeStoneCounter, currentPlayerId]);

  // Tönkök élettartamának kezelése (ciklusok)
  useEffect(() => {
    const timer = setInterval(() => {
      setStumps(prev => {
        const nextStumps: typeof prev = [];
        let hasChanges = false;
        
        prev.forEach(stump => {
          if (stump.cyclesRemaining !== undefined) {
            if (stump.cyclesRemaining > 1) {
              nextStumps.push({ ...stump, cyclesRemaining: stump.cyclesRemaining - 1 });
              hasChanges = true;
            } else {
              // Ha 1 vagy kevesebb, akkor eltűnik
              hasChanges = true;
            }
          } else {
            // Ha nincs cyclesRemaining (régi tönk), akkor maradjon, vagy adjunk neki?
            // Tegyük fel, hogy végtelen, vagy adjunk neki defaultot.
            // Most inkább hagyjuk békén, vagy töröljük?
            // A feladat szerint "fa kivágása után... 10 ciklus".
            // A meglévő tönkökkel mit kezdjünk? Tegyük fel, hogy örök életűek voltak eddig,
            // de mostantól eltűnnek. Adjunk nekik 10-et ha nincs.
            nextStumps.push({ ...stump, cyclesRemaining: 9 });
            hasChanges = true;
          }
        });
        
        return hasChanges ? nextStumps : prev;
      });
    }, 1000); // 1 másodperc = 1 ciklus a tönköknek
    return () => clearInterval(timer);
  }, []);

  // Építkezés befejezése és feldolgozási időzítők
  useEffect(() => {
    const processTimer = setInterval(() => {
      const now = Date.now();
      const completedMillProcesses: MillProcess[] = [];
      const activeMillProcesses: MillProcess[] = [];
      const completedPopcornProcesses: PopcornProcess[] = [];
      const activePopcornProcesses: PopcornProcess[] = [];

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
        const flourByOwner: Record<string, number> = {};
        completedMillProcesses.forEach(proc => {
          const mill = buildings.find(b => b.id === proc.millId);
          if (mill?.ownerId && proc.productType === ProductType.Flour) {
            flourByOwner[mill.ownerId] = (flourByOwner[mill.ownerId] || 0) + proc.flourProduced;
          }
        });
        if (Object.keys(flourByOwner).length > 0) {
          setPlayers(prev => prev.map(pl => {
            const add = flourByOwner[pl.id] || 0;
            if (add > 0) {
              return { ...pl, inventory: { ...pl.inventory, [ProductType.Flour]: (pl.inventory[ProductType.Flour] || 0) + add } };
            }
            return pl;
          }));
          showSuccess("Liszt elkészült és a készletbe került");
        }
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
  }, [millProcesses, popcornProcesses, buildings]); 

  // Ref a processEconomyTick függvényhez, hogy az interval ne induljon újra minden renderkor
  const processEconomyTickRef = useRef(processEconomyTick);
  
  const buildingsRef = useRef(buildings);
  useEffect(() => {
    buildingsRef.current = buildings;
  }, [buildings]);
  
  useEffect(() => {
    processEconomyTickRef.current = processEconomyTick;
  }, [processEconomyTick]);

  // Gazdasági ciklus időzítő (Stabilizált setInterval)
  useEffect(() => {
    const interval = setInterval(() => {
      setMsUntilNextTick(prev => {
        const newPrev = prev - 1000;
        
        if (newPrev <= 0) {
          processEconomyTickRef.current(); // A ref-en keresztül hívjuk a friss függvényt
          return RENT_INTERVAL_MS;
        }
        return newPrev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Üres dependency array = stabil interval!

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


  // Növekedési időzítő
  useEffect(() => {
    const growthTimer = setInterval(() => {
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
    }, 1000);

    return () => clearInterval(growthTimer);
  }, []);

  // Építkezés és Bontás ellenőrzése
  useEffect(() => {
    const constructionChecker = setInterval(() => {
      const now = Date.now();
      const currentBuildings = buildingsRef.current;
      
      const finishedDemolitions: BuildingData[] = [];

      // Először összegyűjtjük a kész bontásokat és visszatérítünk
      currentBuildings.forEach(b => {
        if (b.isDemolishing && b.demolishEta && now >= b.demolishEta) {
            finishedDemolitions.push(b);
        }
      });

      if (finishedDemolitions.length > 0) {
          finishedDemolitions.forEach(building => {
              const buildingOption = availableBuildingOptions.find(o => o.type === building.type && o.name === building.name);
              if (buildingOption) {
                  const refundMoney = Math.floor(buildingOption.cost * DEMOLISH_REFUND_PERCENTAGE);
                  const refundWood = Math.floor((buildingOption.woodCost || 0) * DEMOLISH_REFUND_PERCENTAGE);
                  const refundBrick = Math.floor((buildingOption.brickCost || 0) * DEMOLISH_REFUND_PERCENTAGE);
                  const refundStone = Math.floor((buildingOption.stoneCost || 0) * DEMOLISH_REFUND_PERCENTAGE);

                  setPlayers(prev => prev.map(p => 
                      p.id === currentPlayerId ? {
                          ...p,
                          money: p.money + refundMoney,
                          inventory: {
                              ...p.inventory,
                              wood: (p.inventory.wood || 0) + refundWood,
                              brick: (p.inventory.brick || 0) + refundBrick,
                              stone: (p.inventory.stone || 0) + refundStone,
                          }
                      } : p
                  ));
                  showSuccess(`${building.name} lebontva. Visszatérítés: ${refundMoney} pénz.`);
              }
          });
      }

      setBuildings(prevBuildings => {
        // Töröljük a lebontottakat
        let nextBuildings = prevBuildings.filter(b => !finishedDemolitions.some(fd => fd.id === b.id));
        
        // Frissítjük a folyamatban lévőket (építés és bontás)
        let localHasChanges = finishedDemolitions.length > 0;
        let isAnyBuildingUnderConstruction = false;

        nextBuildings = nextBuildings.map(b => {
          let updatedBuilding = { ...b };
          
          // Bontás progress
          if (b.isDemolishing && b.demolishEta) {
             const duration = b.demolishDuration || DEMOLISH_DURATION_MS;
             const elapsed = now - (b.demolishEta - duration);
             const progress = Math.min(100, (elapsed / duration) * 100);
             if (Math.abs((b.demolishProgress || 0) - progress) > 0.5) {
                 localHasChanges = true;
                 updatedBuilding.demolishProgress = progress;
             }
             isAnyBuildingUnderConstruction = true; // Bontás is "munka"
          }

          // Építkezés ellenőrzése
          if (b.isUnderConstruction && b.constructionEta) {
            if (now >= b.constructionEta) {
              // Épület kész
              showSuccess(`${b.name} kész!`);
              localHasChanges = true;
              updatedBuilding = { 
                ...updatedBuilding, 
                isUnderConstruction: false, 
                constructionEta: undefined, 
                originalDuration: undefined, 
                buildProgress: 100 
              };
            } else {
               // Még épül
               isAnyBuildingUnderConstruction = true;
               if (b.originalDuration) {
                 const elapsed = now - (b.constructionEta - b.originalDuration);
                 const progress = Math.min(100, (elapsed / b.originalDuration) * 100);
                 if (Math.abs((b.buildProgress || 0) - progress) > 0.5) {
                   localHasChanges = true;
                   updatedBuilding = { ...updatedBuilding, buildProgress: progress };
                 }
               }
            }
          }

          // Szántóföld csempék ellenőrzése
          if (updatedBuilding.type === 'farm' && updatedBuilding.farmlandTiles) {
            let tilesChanged = false;
            const newFarmlandTiles = updatedBuilding.farmlandTiles.map(ft => {
              if (ft.isUnderConstruction && ft.constructionEta) {
                if (now >= ft.constructionEta) {
                   showSuccess(`Szántóföld kész: (${ft.x}, ${ft.y})!`);
                   tilesChanged = true;
                   return { ...ft, isUnderConstruction: false, constructionEta: undefined, originalDuration: undefined, buildProgress: 100 };
                } else {
                   // Még épül
                   isAnyBuildingUnderConstruction = true;
                   if (ft.originalDuration) {
                      const elapsed = now - (ft.constructionEta - ft.originalDuration);
                      const progress = Math.min(100, (elapsed / ft.originalDuration) * 100);
                      if (Math.abs((ft.buildProgress || 0) - progress) > 0.5) {
                        tilesChanged = true;
                        return { ...ft, buildProgress: progress };
                      }
                   }
                }
              }
              return ft;
            });

            if (tilesChanged) {
              localHasChanges = true;
              updatedBuilding = { ...updatedBuilding, farmlandTiles: newFarmlandTiles };
            }
          }

          return updatedBuilding;
        });

        // SFX leállítása ha minden kész
        if (!isAnyBuildingUnderConstruction && sfxPlayerRef.current) {
             const wasAnyConstruction = prevBuildings.some(b => 
                (b.isUnderConstruction && b.constructionEta) || 
                (b.isDemolishing) ||
                (b.type === 'farm' && b.farmlandTiles?.some(ft => ft.isUnderConstruction && ft.constructionEta))
             );
             
             if (wasAnyConstruction) {
                 sfxPlayerRef.current.stopAllSfx();
             }
        }

        if (localHasChanges) return nextBuildings;
        return prevBuildings;
      });
      
      // Ha volt törlés, és a kijelölt épület is törlődött, akkor deselect
      if (finishedDemolitions.length > 0 && selectedBuilding) {
          if (finishedDemolitions.some(fd => fd.id === selectedBuilding.id)) {
              setSelectedBuilding(null);
          }
      }

    }, 100);

    return () => clearInterval(constructionChecker);
  }, [currentPlayerId]); 


  const tickProgress = 100 - ((msUntilNextTick / RENT_INTERVAL_MS) * 100); 
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
    if (gridX + effectiveWidth > MAP_GRID_SIZE || gridY + effectiveHeight > MAP_GRID_SIZE) {
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
        if (isCellOccupied(gridX + x, gridY + y, buildings)) {
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

    executeAtTile(gridX, gridY, () => {
      // Biztonsági újraellenőrzés érkezéskor
      const effectiveWidthArrive = (currentBuildingRotation === 90 || currentBuildingRotation === 270) ? buildingToPlace.height : buildingToPlace.width;
      const effectiveHeightArrive = (currentBuildingRotation === 90 || currentBuildingRotation === 270) ? buildingToPlace.width : buildingToPlace.height;
      for (let x = 0; x < effectiveWidthArrive; x++) {
        for (let y = 0; y < effectiveHeightArrive; y++) {
          if (isCellOccupied(gridX + x, gridY + y, buildings)) {
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
      
      const target = possibleTargets.find(t => 
        t.x >= 0 && t.x < MAP_GRID_SIZE && t.y >= 0 && t.y < MAP_GRID_SIZE &&
        !trees.some(otherT => otherT !== tree && t.x >= otherT.x && t.x < otherT.x + 3 && t.y >= otherT.y && t.y < otherT.y + 3) &&
        !stumps.some(s => s.x === t.x && s.y === t.y) &&
        !buildings.some(b => {
           const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
           const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
           return t.x >= b.x && t.x < b.x + w && t.y >= b.y && t.y < b.y + h;
        })
      ) || possibleTargets[0]; // Fallback to bottom if all blocked (pathfinder might still fail but better than inside)

      executeAtTile(target.x, target.y, () => {
        if ((currentPlayer.inventory[ProductType.Axe] || 0) < 1) {
          showError("Nincs fejszéd a kivágáshoz!");
          setIsSelectingTree(false);
          return;
        }
        setChopProcess({
          id: `chop-${Date.now()}-${Math.random()}`,
          playerId: currentPlayerId,
          treeIndex: idx,
          treeX: tree.x,
          treeY: tree.y,
          startTime: Date.now(),
          duration: CHOP_DURATION_MS,
        });
        setAxeAnimation({ x: tree.x + 1, y: tree.y + 1, active: true }); // Center of 3x3 tree
        showSuccess("Fa kivágása megkezdve...");
        setIsSelectingTree(false);
      });
    } else if (isSelectingStone) {
      const idx = stones.findIndex(s => s.x === gridX && s.y === gridY);
      if (idx === -1) {
        showError("Nem kőre kattintottál. Próbáld újra.");
        return;
      }
      const stone = stones[idx];
      const possibleTargets = [
        { x: stone.x + 1, y: stone.y },
        { x: stone.x - 1, y: stone.y },
        { x: stone.x, y: stone.y + 1 },
        { x: stone.x, y: stone.y - 1 },
      ];
      const target = possibleTargets.find(t => 
        t.x >= 0 && t.x < MAP_GRID_SIZE && t.y >= 0 && t.y < MAP_GRID_SIZE &&
        !stones.some(s => s.x === t.x && s.y === t.y) &&
        !isCellOccupied(t.x, t.y, buildings)
      ) || possibleTargets[0];

      executeAtTile(target.x, target.y, () => {
        if ((currentPlayer.inventory[ProductType.Pickaxe] || 0) < 1) {
          showError("Nincs csákányod a bányászathoz!");
          setIsSelectingStone(false);
          return;
        }
        setStoneMineProcess({
          id: `mine-${Date.now()}-${Math.random()}`,
          playerId: currentPlayerId,
          stoneIndex: idx,
          stoneX: stone.x,
          stoneY: stone.y,
          startTime: Date.now(),
          duration: 5000, 
        });
        setPickaxeAnimation({ x: stone.x, y: stone.y, active: true }); 
        showSuccess("Kőbányászat megkezdve...");
        setIsSelectingStone(false);
      });
    } else if (!isPlacementMode) {
      executeAtTile(gridX, gridY, () => {});
    }
  };

  const handleBuildBuilding = (buildingName: string) => {
    const opt = availableBuildingOptions.find(o => o.name === buildingName);
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

  const handleDemolishBuilding = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building || building.ownerId !== currentPlayerId) return;

    const buildingOption = availableBuildingOptions.find(o => o.type === building.type && o.name === building.name);
    if (!buildingOption) return;

    const refundMoney = Math.floor(buildingOption.cost * DEMOLISH_REFUND_PERCENTAGE);
    const refundWood = Math.floor((buildingOption.woodCost || 0) * DEMOLISH_REFUND_PERCENTAGE);
    const refundBrick = Math.floor((buildingOption.brickCost || 0) * DEMOLISH_REFUND_PERCENTAGE);
    const refundStone = Math.floor((buildingOption.stoneCost || 0) * DEMOLISH_REFUND_PERCENTAGE);

    setPlayers(prev => prev.map(p => 
      p.id === currentPlayerId ? {
        ...p,
        money: p.money + refundMoney,
        inventory: {
          ...p.inventory,
          wood: (p.inventory.wood || 0) + refundWood,
          brick: (p.inventory.brick || 0) + refundBrick,
          stone: (p.inventory.stone || 0) + refundStone,
        }
      } : p
    ));

    addTransaction(currentPlayerId, "income", `Épületbontás visszatérítés: ${building.name}`, refundMoney);
    showSuccess(`${building.name} lebontva. Visszatérítés: ${refundMoney} pénz, ${refundWood} fa, ${refundBrick} tégla, ${refundStone} kő.`);

    setBuildings(prev => prev.filter(b => b.id !== buildingId));
    setSelectedBuilding(null);
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
    if (!building || !building.residentIds.includes(currentPlayerId)) return;

    setBuildings(prev => prev.map(b => 
      b.id === buildingId ? { 
        ...b, 
        residentIds: b.residentIds.filter(id => id !== currentPlayerId),
        renterId: b.renterId === currentPlayerId ? undefined : b.renterId
      } : b
    ));

    showSuccess(`Sikeresen kiköltöztél a(z) ${building.name} ingatlanból.`);
    setSelectedBuilding(null);
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
        />
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
          Pénzmozgások
        </Button>
        <Button onClick={() => navigate('/')} className="w-full bg-gray-600">
          Főmenü
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
      <MusicPlayer tracks={musicTracks} initialDelay={3000} />
      <SfxPlayer ref={sfxPlayerRef} sfxUrls={sfxUrls} />
    </>
  );

  return (
    <ErrorBoundary>
      <MainLayout 
        sidebarContent={sidebarContent} 
      mainContent={
      <div ref={mainContentRef} className="flex flex-col h-full items-center justify-center relative overflow-hidden">
          <GameMap 
            avatarSize={avatarSize}
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
          isDragging={isDragging}
          trees={trees}
          stumps={stumps}
          isSelectingTree={isSelectingTree}
          isTreeChoppingMode={!!chopProcess}
          activeChopTree={chopProcess ? { x: chopProcess.treeX, y: chopProcess.treeY } : null}
          treeChopProgress={chopProgressPct}
          isSelectingStone={isSelectingStone}
          isStoneMiningMode={!!stoneMineProcess}
          activeMineStone={stoneMineProcess ? { x: stoneMineProcess.stoneX, y: stoneMineProcess.stoneY } : null}
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
          }))}
          shopInventories={shopInventories}
          bankConfigs={bankConfigs}
          />

          {(isSelectingTree || isSelectingStone) && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl z-50 flex gap-4 items-center border border-gray-200 dark:border-gray-700">
               <span className="font-semibold">{isSelectingTree ? "Válassz ki egy fát a kivágáshoz!" : "Válassz ki egy követ a bányászáshoz!"}</span>
               <Button variant="destructive" size="sm" onClick={() => { setIsSelectingTree(false); setIsSelectingStone(false); }}>Mégsem</Button>
            </div>
          )}
          
          {chopProcess && (
            <div className="absolute bottom-4 left-4 bg-muted/70 dark:bg-black/50 backdrop-blur-sm border rounded p-3 w-64">
              <div className="text-sm font-medium flex items-center gap-2">
                <span>🪓</span>
                <span>Fa kivágása...</span>
              </div>
              <Progress value={chopProgressPct} className="h-2 mt-2" />
            </div>
          )}

          {stoneMineProcess && (
            <div className="absolute bottom-4 left-4 bg-muted/70 dark:bg-black/50 backdrop-blur-sm border rounded p-3 w-64">
              <div className="text-sm font-medium flex items-center gap-2">
                <span>⛏️</span>
                <span>Kő bányászata...</span>
              </div>
              <Progress value={stoneMineProgressPct} className="h-2 mt-2" />
            </div>
          )}
          
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
                  {selectedBuilding.type === "forestry" && (
                    <div className="space-y-3 p-3 border rounded-md bg-green-50/50 dark:bg-green-900/20">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-700" />
                        <span className="font-semibold">Erdészház műveletek</span>
                      </div>
                      <p className="text-xs">Fák kivágása a pályáról. Szükséges eszköz: Fejsze 🪓</p>
                      <p className="text-xs">Fejsze készlet: {currentPlayer.inventory[ProductType.Axe] || 0} db</p>
                      <Button 
                        className="bg-green-700"
                        onClick={() => handleCutTree(selectedBuilding.id)}
                        disabled={(currentPlayer.inventory[ProductType.Axe] || 0) < 1}
                      >
                        Fa kivágása (kattints fára)
                      </Button>
                    </div>
                  )}
                  {selectedBuilding.type === "quarry" && (
                    <div className="space-y-3 p-3 border rounded-md bg-stone-50/50 dark:bg-stone-900/20">
                      <div className="flex items-center gap-2">
                        <Hammer className="h-4 w-4 text-stone-700" />
                        <span className="font-semibold">Kőfejtő műveletek</span>
                      </div>
                      <p className="text-xs">Kövek bányászása a pályáról. Szükséges eszköz: Csákány ⛏️</p>
                      <p className="text-xs">Csákány készlet: {currentPlayer.inventory[ProductType.Pickaxe] || 0} db</p>
                      <Button 
                        className="bg-stone-600 w-full mb-2"
                        onClick={() => handleMineStone(selectedBuilding.id)}
                        disabled={(currentPlayer.inventory[ProductType.Pickaxe] || 0) < 1}
                      >
                        Kőfejtés (kattints kőre)
                      </Button>
                      <Button 
                        variant="destructive"
                        className="w-full"
                        onClick={() => {
                          if (confirm("Biztosan le akarod bontani ezt az épületet?")) {
                             const refund = Math.floor(selectedBuilding.cost * DEMOLISH_REFUND_PERCENTAGE);
                             setPlayers(prev => prev.map(p => 
                               p.id === currentPlayerId ? { ...p, money: p.money + refund } : p
                             ));
                             addTransaction(currentPlayerId, "income", `Bontás visszatérítés: ${selectedBuilding.name}`, refund);
                             setBuildings(prev => prev.filter(b => b.id !== selectedBuilding.id));
                             setSelectedBuilding(null);
                             showSuccess(`Épület lebontva. +${refund} pénz visszatérítve.`);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Lebontás
                      </Button>
                    </div>
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
                          <h4 className="font-semibold mb-2 flex items-center">
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
                              }}
                              disabled={selectedBuilding.employeeIds.length === 0 || (selectedBuilding.millInventory?.wheat || 0) < MILL_WHEAT_CONSUMPTION_PER_PROCESS}
                            >
                              Búza → Liszt
                            </Button>
          </div>
          <p className="text-xs mt-1 text-muted-foreground">Feldolgozható búza adag: {Math.floor((selectedBuilding.millInventory?.wheat || 0) / MILL_WHEAT_CONSUMPTION_PER_PROCESS)}</p>
          
          <div className="flex items-center gap-2 mt-3">
            <Input 
              type="number" 
              defaultValue={1} 
              min={1} 
              max={Math.floor((selectedBuilding.millInventory?.corn || 0) / MILL_CORN_CONSUMPTION_PER_PROCESS)}
              id="mill-corn-qty"
              className="w-20 h-8"
            />
            <Button 
              size="sm" 
              onClick={() => {
                const qty = Number((document.getElementById('mill-corn-qty') as HTMLInputElement)?.value || 1);
                const mill = buildings.find(b => b.id === selectedBuilding.id);
                if (!mill || !mill.ownerId || mill.employeeIds.length === 0) return;
                const requiredCorn = qty * MILL_CORN_CONSUMPTION_PER_PROCESS;
                const producedCornFlour = qty * MILL_CORNFLOUR_PRODUCTION_PER_PROCESS;
                const totalDuration = qty * MILL_PROCESSING_TIME_MS;
                const currentCorn = mill.millInventory?.corn || 0;
                if (currentCorn < requiredCorn) {
                  showError(`Nincs elég kukorica a malom készletében! Szükséges: ${requiredCorn} db.`);
                  return;
                }
                executeAtBuilding(selectedBuilding.id, () => {
                  setBuildings(prev => prev.map(b => {
                    if (b.id === selectedBuilding.id && b.type === 'mill') {
                      return {
                        ...b,
                        millInventory: {
                          wheat: b.millInventory?.wheat || 0,
                          flour: b.millInventory?.flour || 0,
                          corn: currentCorn - requiredCorn,
                        }
                      };
                    }
                    return b;
                  }));
                  const newProcess: MillProcess = {
                    id: `mill-proc-${Date.now()}-${Math.random()}`,
                    millId: selectedBuilding.id,
                    startTime: Date.now(),
                    duration: totalDuration,
                    wheatConsumed: 0,
                    flourProduced: producedCornFlour,
                    productType: ProductType.CornFlour,
                  };
                  setMillProcesses(prev => [...prev, newProcess]);
                  showSuccess(`${qty} adag kukorica őrlése elindult (${totalDuration / 1000} mp).`);
                });
              }}
              disabled={selectedBuilding.employeeIds.length === 0 || (selectedBuilding.millInventory?.corn || 0) < MILL_CORN_CONSUMPTION_PER_PROCESS}
            >
              Kukorica → Kukoricaliszt
            </Button>
          </div>
          <p className="text-xs mt-1 text-muted-foreground">Feldolgozható kukorica adag: {Math.floor((selectedBuilding.millInventory?.corn || 0) / MILL_CORN_CONSUMPTION_PER_PROCESS)}</p>
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
                                <Progress value={progress} className="h-2 mt-1" />
                                <p className="text-right text-muted-foreground mt-1">
                                  {remainingTime > 0 ? `${remainingTime} mp hátra` : 'Befejezés...'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Búza hozzáadása a malomhoz (mindenki számára) */}
                      <div className="p-3 border rounded-md bg-green-50/50 dark:bg-green-900/20">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Wheat className="h-4 w-4 mr-2 text-amber-700" /> Búza hozzáadása
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Búza hozzáadása a malom készletéhez a termeléshez.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            defaultValue={1} 
                            min={1} 
                            max={currentPlayer.inventory.wheat || 0}
                            id="wheat-add-qty-public"
                            className="w-20 h-8"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const qty = Number((document.getElementById('wheat-add-qty-public') as HTMLInputElement)?.value || 1);
                              handleAddWheatToMill(selectedBuilding.id, qty);
                            }}
                            disabled={(currentPlayer.inventory.wheat || 0) === 0}
                          >
                            Hozzáadás
                          </Button>
                        </div>
                        <p className="text-xs mt-1">Készleten: {currentPlayer.inventory.wheat || 0} db</p>
                      </div>
                      
                      <div className="p-3 border rounded-md bg-green-50/50 dark:bg-green-900/20">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Sprout className="h-4 w-4 mr-2 text-green-700" /> Kukorica hozzáadása
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Kukorica hozzáadása a malom készletéhez a termeléshez.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            defaultValue={1} 
                            min={1} 
                            max={currentPlayer.inventory[ProductType.Corn] || 0}
                            id="corn-add-qty-public"
                            className="w-20 h-8"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const qty = Number((document.getElementById('corn-add-qty-public') as HTMLInputElement)?.value || 1);
                              const mill = buildings.find(b => b.id === selectedBuilding.id);
                              if (!mill) return;
                              executeAtBuilding(selectedBuilding.id, () => {
                                setPlayers(prev => prev.map(p => 
                                  p.id === currentPlayerId ? {
                                    ...p,
                                    inventory: { ...p.inventory, [ProductType.Corn]: (p.inventory[ProductType.Corn] || 0) - qty }
                                  } : p
                                ));
                                setBuildings(prev => prev.map(b => {
                                  if (b.id === selectedBuilding.id && b.type === 'mill') {
                                    return {
                                      ...b,
                                      millInventory: {
                                        wheat: b.millInventory?.wheat || 0,
                                        flour: b.millInventory?.flour || 0,
                                        corn: (b.millInventory?.corn || 0) + qty,
                                      }
                                    };
                                  }
                                  return b;
                                }));
                                const available = (mill.millInventory?.corn || 0) + qty;
                                const batches = Math.floor(available / MILL_CORN_CONSUMPTION_PER_PROCESS);
                                if (batches > 0 && mill.employeeIds.length > 0) {
                                  const proc: MillProcess = {
                                    id: `mill-proc-${Date.now()}-${Math.random()}`,
                                    millId: selectedBuilding.id,
                                    startTime: Date.now(),
                                    duration: batches * MILL_PROCESSING_TIME_MS,
                                    wheatConsumed: 0,
                                    flourProduced: batches * MILL_CORNFLOUR_PRODUCTION_PER_PROCESS,
                                    productType: ProductType.CornFlour,
                                  };
                                  setMillProcesses(prev => [...prev, proc]);
                                  setBuildings(prev => prev.map(b => {
                                    if (b.id === selectedBuilding.id && b.type === 'mill') {
                                      return {
                                        ...b,
                                        millInventory: {
                                          wheat: b.millInventory?.wheat || 0,
                                          flour: b.millInventory?.flour || 0,
                                          corn: available - (batches * MILL_CORN_CONSUMPTION_PER_PROCESS),
                                        }
                                      };
                                    }
                                    return b;
                                  }));
                                }
                                showSuccess(`${qty} kukorica hozzáadva a malom készletéhez!`);
                              });
                            }}
                            disabled={(currentPlayer.inventory[ProductType.Corn] || 0) === 0}
                          >
                            Hozzáadás
                          </Button>
                        </div>
                        <p className="text-xs mt-1">Készleten: {currentPlayer.inventory[ProductType.Corn] || 0} db</p>
                      </div>
                    </div>
                  )}
                  {selectedBuilding.type === "popcorn_stand" && (
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-2 text-sm rounded border border-dashed">
                        <div className="flex items-center gap-2 mb-1">
                          <Popcorn className="h-4 w-4 text-red-600" />
                          <span className="font-semibold">Popcorn Árus információk:</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <p>Kukorica készlet: {selectedBuilding.popcornStandInventory?.corn || 0} db</p>
                          <p>Popcorn készlet: {selectedBuilding.popcornStandInventory?.popcorn || 0} db</p>
                        </div>
                      </div>
                      <div className="p-3 border rounded-md bg-red-50/50 dark:bg-red-900/20 space-y-2">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Package className="h-4 w-4 mr-2 text-red-700" /> Kukorica betöltése a készletbe
                        </h4>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            defaultValue={1} 
                            min={1} 
                            max={currentPlayer.inventory[ProductType.Corn] || 0}
                            id="popcorn-corn-qty"
                            className="w-20 h-8"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const qty = Number((document.getElementById('popcorn-corn-qty') as HTMLInputElement)?.value || 1);
                              handleAddCornToPopcornStand(selectedBuilding.id, qty);
                            }}
                            disabled={(currentPlayer.inventory[ProductType.Corn] || 0) < 1}
                          >
                            Kukorica hozzáadása
                          </Button>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">Készletben: {currentPlayer.inventory[ProductType.Corn] || 0} db kukorica</p>
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
                                <Progress value={progress} className="h-2 mt-1" />
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
                
                {selectedBuilding.isDemolishing && (
                    <div className="p-3 border rounded-md bg-red-50/50 dark:bg-red-900/20 mb-4 mx-4">
                         <h4 className="font-semibold mb-2 flex items-center text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" /> Bontás folyamatban...
                         </h4>
                         <Progress value={selectedBuilding.demolishProgress || 0} className="h-2" />
                         <p className="text-xs text-center mt-1 text-muted-foreground">
                              {Math.max(0, Math.ceil(((selectedBuilding.demolishEta || 0) - Date.now()) / 1000))} mp hátra
                         </p>
                    </div>
                )}

                <DialogFooter>
                  {!selectedBuilding.isDemolishing && (
                    <>
                      {selectedBuilding.type === "house" && !selectedBuilding.residentIds.includes(currentPlayerId) && selectedBuilding.residentIds.length < selectedBuilding.capacity && (
                        <Button onClick={() => handleRentHouse(selectedBuilding.id)}>
                          Beköltözés
                        </Button>
                      )}
                      {selectedBuilding.type === "house" && selectedBuilding.residentIds.length >= selectedBuilding.capacity && !selectedBuilding.residentIds.includes(currentPlayerId) && (
                        <Button disabled>
                          Megtelt
                        </Button>
                      )}
                      {selectedBuilding.type === "house" && selectedBuilding.residentIds.includes(currentPlayerId) && (
                        <Button variant="destructive" onClick={() => handleMoveOut(selectedBuilding.id)}>
                          Kiköltözés
                        </Button>
                      )}
                      
                      {selectedBuilding.salary && !selectedBuilding.employeeIds.includes(currentPlayerId) && selectedBuilding.employeeIds.length < selectedBuilding.capacity && (
                        <Button onClick={() => handleApplyForJob(selectedBuilding.id)}>
                          {currentPlayer.workplace === "Munkanélküli" ? "Munkába állás" : "Átjelentkezés ide"}
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
                    </>
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
            availableBuildings={availableBuildingOptions.filter(b => b.name !== 'Polgármesteri Hivatal' || !buildings.some(existing => existing.name === 'Polgármesteri Hivatal'))}
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
          />
        </div>
      } 
    />
    </ErrorBoundary>
  );
};

export default Game;
