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
import SfxPlayer, { SfxPlayerRef } from "@/components/SfxPlayer"; // Importáljuk az SfxPlayer-t
import { musicTracks } from "@/utils/musicFiles"; // Dinamikusan betöltött zenék
import { sfxUrls } from "@/utils/sfxFiles"; // Dinamikusan betöltött hangeffektek
import PlayerSettings from "@/components/PlayerSettings";
import { RotateCw, ChevronLeft, ChevronRight, Sprout, Coins, Building as BuildingIcon, Route, Wrench, Trash2 } from "lucide-react"; // Coins ikon importálása, Building és Road ikonok, Wrench és Trash2 ikonok
import { allProducts, ProductType, getProductByType } from "@/utils/products"; // Importáljuk a termékdefiníciókat

import { useNavigate, useLocation } from "react-router-dom";
import MoneyHistory, { Transaction } from "@/components/MoneyHistory";

const MAP_GRID_SIZE = 40; // Növeltük a térkép méretét
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
const ROAD_COST_PER_TILE = 5; // Új konstans az útépítés költségéhez
const ROAD_BUILD_DURATION_MS = 6000; // Új konstans az útépítés idejéhez (6 másodperc)
const ROAD_STONE_COST_PER_TILE = 1; // Új konstans az útépítés kő költségéhez
const FARMLAND_HOE_BUILD_DURATION_MS = 15000; // Szántóföld építési ideje kapával (15 másodperc)
const FARMLAND_TRACTOR_BUILD_DURATION_MS = 5000; // Szántóföld építési ideje traktorral (5 másodperc)
const FARMLAND_MAX_DISTANCE = 3; // Szántóföld max távolsága a farmtól
const DEMOLISH_REFUND_PERCENTAGE = 0.5; // 50% visszatérítés bontáskor

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
    stone: number; // Új: kő nyersanyag
    hoe: number; // Új: kapa
    tractor: number; // Új: traktor
  };
  workplace: string;
  workplaceSalary: number;
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
  { // Új épület: Polgármesteri Hivatal
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
  { // Új épület: Bolt
    type: "shop",
    category: "business",
    name: "Bolt",
    cost: 1500,
    woodCost: 8,
    brickCost: 10,
    duration: 20000,
    width: 3,
    height: 3,
    salary: 10, // A boltos fizetése
    capacity: 3, // Max alkalmazottak száma
  },
];

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialPlayer, allPlayers, buildings: initialBuildingsState, currentPlayerId: initialCurrentPlayerId } = (location.state || {}) as { initialPlayer?: Player, allPlayers?: Player[], buildings?: BuildingData[], currentPlayerId?: string };

  const [players, setPlayers] = useState<Player[]>(allPlayers || [
    { id: "player-1", name: "Játékos 1", money: 1000, inventory: { potato: 3, water: 2, clothes: 1, wood: 10, brick: 5, stone: 0, hoe: 0, tractor: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-2", name: "Játékos 2", money: 750, inventory: { potato: 1, water: 1, clothes: 0, wood: 5, brick: 3, stone: 0, hoe: 0, tractor: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-3", name: "Játékos 3", money: 1200, inventory: { potato: 5, water: 3, clothes: 2, wood: 15, brick: 8, stone: 0, hoe: 0, tractor: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-4", name: "Játékos 4", money: 600, inventory: { potato: 0, water: 0, clothes: 0, wood: 0, brick: 0, stone: 0, hoe: 0, tractor: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-5", name: "Játékos 5", money: 900, inventory: { potato: 2, water: 1, clothes: 1, wood: 8, brick: 4, stone: 0, hoe: 0, tractor: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-test", name: "Teszt Játékos", money: 100000, inventory: { potato: 100, water: 100, clothes: 50, wood: 500, brick: 200, stone: 100, hoe: 10, tractor: 2 }, workplace: "Tesztelő", workplaceSalary: 0 }, // Teszt játékos
  ]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>(initialCurrentPlayerId || initialPlayer?.id || players[0].id);
  const currentPlayer = players.find(p => p.id === currentPlayerId)!;

  const [buildings, setBuildings] = useState<BuildingData[]>(initialBuildingsState || []);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [isBuildingInProgress, setIsBuildingInProgress] = useState(false); // Ez jelzi, ha BÁRMILYEN építés folyamatban van
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);
  const [isMoneyHistoryOpen, setIsMoneyHistoryOpen] = useState(false);

  const [isPlacingBuilding, setIsPlacingBuilding] = useState(false); // Ez jelzi, ha a játékos éppen egy épületet helyez el
  const [buildingToPlace, setBuildingToPlace] = useState<BuildingOption | null>(null);
  const [ghostBuildingCoords, setGhostBuildingCoords] = useState<{ x: number; y: number } | null>(null); // Rács koordináták
  const [currentBuildingRotation, setCurrentBuildingRotation] = useState<number>(0);

  const [isPlacingFarmland, setIsPlacingFarmland] = useState(false); // Új állapot: szántóföld elhelyezési mód
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [ghostFarmlandTiles, setGhostFarmlandTiles] = useState<{ x: number; y: number }[]>([]); // Szellem szántóföld csempék
  const [isFarmlandDragging, setIsFarmlandDragging] = useState(false); // Szántóföld építés húzással

  const [isPlacingRoad, setIsPlacingRoad] = useState(false); // Új állapot az útépítéshez
  const [ghostRoadTiles, setGhostRoadTiles] = useState<{ x: number; y: number }[]>([]); // Új: szellem út csempék a folyamatos építéshez
  const [isRoadDragging, setIsRoadDragging] = useState(false); // Új: útépítés húzással

  const [isDemolishingRoad, setIsDemolishingRoad] = useState(false); // Új állapot: út bontási mód

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Térkép húzogatás állapotok
  const [mapOffsetX, setMapOffsetX] = useState(0);
  const [mapOffsetY, setMapOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null); // Pixel koordináták a húzáshoz

  // Ref a fő tartalom div-hez a méretek lekéréséhez
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Hangeffekt referencia
  const sfxPlayerRef = useRef<SfxPlayerRef>(null);

  // Összesített placement mód
  const isPlacementMode = isPlacingBuilding || isPlacingFarmland || isPlacingRoad || isDemolishingRoad;

  // Kamera pozicionálása a pálya közepére a játék elején
  useEffect(() => {
    if (mainContentRef.current) {
      const viewportWidth = mainContentRef.current.clientWidth;
      const viewportHeight = mainContentRef.current.clientHeight;

      const mapTotalWidthPx = MAP_GRID_SIZE * CELL_SIZE_PX;
      const mapTotalHeightPx = MAP_GRID_SIZE * 1.5 * CELL_SIZE_PX;

      // A térkép középpontjának kiszámítása pixelekben (a térkép saját bal felső sarkához képest)
      const mapCenterPxX = mapTotalWidthPx / 2;
      const mapCenterPxY = mapTotalHeightPx / 2;

      // Az eltolás kiszámítása, hogy a térkép középpontja a viewport középpontjába kerüljön
      const initialOffsetX = (viewportWidth / 2) - mapCenterPxX;
      const initialOffsetY = (viewportHeight / 2) - mapCenterPxY;

      setMapOffsetX(initialOffsetX);
      setMapOffsetY(initialOffsetY);
    }
  }, []); // Csak egyszer fusson le a komponens mountolásakor

  const addTransaction = (playerId: string, type: "income" | "expense", description: string, amount: number) => {
    setTransactions(prev => [...prev, { id: `tx-${Date.now()}-${Math.random()}`, playerId, type, description, amount, timestamp: Date.now() }]);
  };

  const getOccupiedCells = (currentBuildings: BuildingData[]) => {
    const occupied = new Set<string>();
    currentBuildings.forEach(b => {
      if (!b.isUnderConstruction && !b.isGhost) {
        const effectiveWidth = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
        const effectiveHeight = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;

        for (let x = b.x; x < b.x + effectiveWidth; x++) {
          for (let y = b.y; y < b.y + effectiveHeight; y++) {
            occupied.add(`${x},${y}`);
          }
        }
      }
    });
    return occupied;
  };

  const isCellOccupied = (x: number, y: number, currentBuildings: BuildingData[]): boolean => {
    return currentBuildings.some(b => {
      if (b.isUnderConstruction || b.isGhost) return false;
      const effectiveWidth = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
      const effectiveHeight = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
      return x >= b.x && x < b.x + effectiveWidth && y >= b.y && y < b.y + effectiveHeight;
    });
  };

  const isRoadAt = (checkX: number, checkY: number, currentBuildings: BuildingData[], currentGhostRoadTiles: { x: number; y: number }[]): boolean => {
    // Ellenőrizzük a már felépült utakat
    const existingRoad = currentBuildings.some(b =>
      b.type === "road" && b.x === checkX && b.y === checkY && !b.isUnderConstruction && !b.isGhost
    );
    // Ellenőrizzük a szellem út csempéket is
    const ghostRoad = currentGhostRoadTiles.some(t => t.x === checkX && t.y === checkY);
    return existingRoad || ghostRoad;
  };

  const isAdjacentToRoad = (targetX: number, targetY: number, buildingWidth: number, buildingHeight: number, rotation: number, currentBuildings: BuildingData[], currentGhostRoadTiles: { x: number; y: number }[]): boolean => {
    const effectiveWidth = (rotation === 90 || rotation === 270) ? buildingHeight : buildingWidth;
    const effectiveHeight = (rotation === 90 || rotation === 270) ? buildingWidth : buildingHeight;

    for (let x = targetX; x < targetX + effectiveWidth; x++) {
      for (let y = targetY; y < targetY + effectiveHeight; y++) {
        // Check all 8 surrounding cells
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue; // Skip the cell itself
            const checkX = x + dx;
            const checkY = y + dy;

            if (isRoadAt(checkX, checkY, currentBuildings, currentGhostRoadTiles)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  const canPlaceBuilding = (
    targetX: number,
    targetY: number,
    buildingWidth: number,
    buildingHeight: number,
    rotation: number,
    buildingType: "house" | "office" | "forestry" | "farm" | "shop", // Hozzáadva a buildingType
    currentBuildings: BuildingData[],
    currentGhostRoadTiles: { x: number; y: number }[] // Átadjuk a szellem út csempéket
  ): boolean => {
    const effectiveWidth = (rotation === 90 || rotation === 270) ? buildingHeight : buildingWidth;
    const effectiveHeight = (rotation === 90 || rotation === 270) ? buildingWidth : buildingHeight;

    if (
      targetX < 0 ||
      targetY < 0 ||
      targetX + effectiveWidth > MAP_GRID_SIZE ||
      targetY + effectiveHeight > MAP_GRID_SIZE * 1.5
    ) {
      return false;
    }

    for (let x = targetX; x < targetX + effectiveWidth; x++) {
      for (let y = targetY; y < targetY + effectiveHeight; y++) {
        if (isCellOccupied(x, y, currentBuildings)) {
          return false;
        }
      }
    }

    // Új szabály: épületek csak út mentén épülhetnek, kivéve Sátor és Erdészház
    // if (buildingType !== "house" || (buildingType === "house" && buildingWidth !== 2 && buildingHeight !== 1)) { // Sátor kivétel
    //   if (buildingType !== "forestry") { // Erdészház kivétel
    //     if (!isAdjacentToRoad(targetX, targetY, buildingWidth, buildingHeight, rotation, currentBuildings, currentGhostRoadTiles)) {
    //       showError("Az épületet csak út mentén lehet elhelyezni!");
    //       return false;
    //     }
    //   }
    // }
    
    return true;
  };

  // Segédfüggvény a távolság ellenőrzéséhez
  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
  };

  const isFarmlandWithinRange = (farmX: number, farmY: number, farmWidth: number, farmHeight: number, farmRotation: number, targetX: number, targetY: number): boolean => {
    const effectiveFarmWidth = (farmRotation === 90 || farmRotation === 270) ? farmHeight : farmWidth;
    const effectiveFarmHeight = (farmRotation === 90 || farmRotation === 270) ? farmWidth : farmHeight;

    // A farm épület határai
    const farmMinX = farmX;
    const farmMaxX = farmX + effectiveFarmWidth - 1;
    const farmMinY = farmY;
    const farmMaxY = farmY + effectiveFarmHeight - 1;

    // Kiterjesztett határok a FARMLAND_MAX_DISTANCE alapján
    const extendedMinX = farmMinX - FARMLAND_MAX_DISTANCE;
    const extendedMaxX = farmMaxX + effectiveFarmWidth - 1 + FARMLAND_MAX_DISTANCE;
    const extendedMinY = farmMinY - FARMLAND_MAX_DISTANCE;
    const extendedMaxY = farmMaxY + effectiveFarmHeight - 1 + FARMLAND_MAX_DISTANCE;

    return (
      targetX >= extendedMinX &&
      targetX <= extendedMaxX &&
      targetY >= extendedMinY &&
      targetY <= extendedMaxY
    );
  };

  useEffect(() => {
    // Csak akkor generálunk kezdeti épületeket, ha még nincsenek betöltve (pl. új játék esetén)
    if (buildings.length === 0 && !initialBuildingsState) {
      const initialBuildings: BuildingData[] = [];
      const tempOccupiedCells = new Set<string>();

      const placeInitialBuilding = (
        buildingId: string,
        buildingName: string,
        buildingType: "house" | "office" | "forestry" | "farm" | "road" | "shop", // Új: shop típus
        buildingWidth: number,
        buildingHeight: number,
        rentalPrice?: number,
        salary?: number,
        capacity: number = 0,
        ownerId?: string,
        rotation: number = 0,
        maxAttempts = 200,
        initialX?: number, // Opcionális kezdeti X koordináta
        initialY?: number  // Opcionális kezdeti Y koordináta
      ): BuildingData | null => {
        const effectiveWidth = (rotation === 90 || rotation === 270) ? buildingHeight : buildingWidth;
        const effectiveHeight = (rotation === 90 || rotation === 270) ? buildingWidth : buildingHeight;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const randomX = initialX !== undefined ? initialX : Math.floor(Math.random() * (MAP_GRID_SIZE - effectiveWidth + 1));
          const randomY = initialY !== undefined ? initialY : Math.floor(Math.random() * (MAP_GRID_SIZE * 1.5 - effectiveHeight + 1)); // MAP_GRID_SIZE * 1.5 a magasság

          let overlaps = false;
          for (let x = randomX; x < randomX + effectiveWidth; x++) {
            for (let y = randomY; y < randomY + effectiveHeight; y++) {
              if (tempOccupiedCells.has(`${x},${y}`)) {
                overlaps = true;
                break;
              }
            }
            if (overlaps) break;
          }

          if (!overlaps) {
            for (let x = randomX; x < randomX + effectiveWidth; x++) {
              for (let y = randomY; y < randomY + effectiveHeight; y++) {
                tempOccupiedCells.add(`${x},${y}`);
              }
            }
            return {
              id: buildingId,
              name: buildingName,
              x: randomX,
              y: randomY,
              width: buildingWidth,
              height: buildingHeight,
              type: buildingType,
              rentalPrice: rentalPrice,
              salary: salary,
              capacity: capacity,
              ownerId: ownerId,
              renterId: undefined,
              residentIds: [],
              employeeIds: [],
              isUnderConstruction: false,
              buildProgress: 100,
              rotation: rotation,
              farmlandTiles: buildingType === "farm" ? [] : undefined,
            };
          }
          if (initialX !== undefined && initialY !== undefined) break; // Ha fix koordinátát adtunk meg, csak egyszer próbáljuk
        }
        console.warn(`Nem sikerült elhelyezni az épületet ${buildingId} ${maxAttempts} próbálkozás után.`);
        return null;
      };

      // Kezdeti épületek létrehozása
      const initialHouseOptions = availableBuildingOptions.filter(opt => opt.type === "house");
      for (let i = 0; i < 4; i++) {
        const houseOption = initialHouseOptions[Math.floor(Math.random() * initialHouseOptions.length)];
        const house = placeInitialBuilding(
          `house-${i + 1}`,
          houseOption.name,
          houseOption.type,
          houseOption.width,
          houseOption.height,
          houseOption.rentalPrice,
          houseOption.salary,
          houseOption.capacity,
          undefined,
          0
        );
        if (house) {
          initialBuildings.push(house);
        }
      }
      // Kezdeti út csempe elhelyezése a pálya közepén
      const centerRoad = placeInitialBuilding(
        "road-center",
        "Út",
        "road",
        1,
        1,
        undefined,
        undefined,
        0,
        undefined,
        0,
        1, // Csak 1 próbálkozás
        Math.floor(MAP_GRID_SIZE / 2),
        Math.floor(MAP_GRID_SIZE * 1.5 / 2)
      );
      if (centerRoad) {
        initialBuildings.push(centerRoad);
      }

      setBuildings(initialBuildings);
    }
  }, [buildings.length, initialBuildingsState]);

  useEffect(() => {
    const gameTickTimer = setInterval(() => {
      setPlayers(prevPlayers => prevPlayers.map(player => {
        let newMoney = player.money;
        let totalRent = 0;
        let totalSalary = 0;
        let currentWorkplaceSalary = 0;

        const playerRentedBuildings = buildings.filter(b => b.renterId === player.id && b.ownerId !== player.id);
        playerRentedBuildings.forEach(building => {
          if (building.rentalPrice) {
            totalRent += building.rentalPrice;
          }
        });

        const playerEmployedBuildings = buildings.filter(b => b.employeeIds.includes(player.id));
        playerEmployedBuildings.forEach(building => {
          if (building.salary) {
            totalSalary += building.salary;
            currentWorkplaceSalary = building.salary;
          }
        });

        if (totalRent > 0) {
          if (newMoney >= totalRent) {
            newMoney -= totalRent;
            addTransaction(player.id, "expense", "Bérleti díj fizetése", totalRent);
            if (player.id === currentPlayerId) showSuccess(`Levonva ${totalRent} pénz bérleti díjként.`);
          } else {
            if (player.id === currentPlayerId) showError(`Nincs elég pénz a bérleti díjra (${totalRent} pénz). A bérelt házak kiürültek.`);
            setBuildings(prevBuildings =>
              prevBuildings.map(b =>
                b.renterId === player.id && b.ownerId !== player.id
                  ? { ...b, renterId: undefined, residentIds: b.residentIds.filter(id => id !== player.id) }
                  : b
              )
            );
          }
        }

        if (totalSalary > 0) {
          newMoney += totalSalary;
          addTransaction(player.id, "income", `Fizetés (${player.workplace})`, totalSalary);
          if (player.id === currentPlayerId) showSuccess(`Jóváírva ${totalSalary} pénz fizetésként.`);
        }

        return { ...player, money: newMoney, workplaceSalary: currentWorkplaceSalary };
      }));
    }, RENT_INTERVAL_MS);

    return () => clearInterval(gameTickTimer);
  }, [buildings, currentPlayerId]);

  const updatePlayerName = (newName: string) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === currentPlayerId ? { ...p, name: newName } : p
      )
    );
  };

  const handleBuildingClick = (buildingId: string) => {
    if (isPlacementMode) return; // Ne lehessen kattintani épületekre, ha építési módban vagyunk
    const building = buildings.find(b => b.id === buildingId);
    setSelectedBuilding(building || null);
    setIsPlacingFarmland(false);
    setSelectedFarmId(null);
    setIsFarmlandDragging(false);
    setGhostFarmlandTiles([]);
    setIsPlacingRoad(false); // Új: útépítés mód kikapcsolása
    setIsRoadDragging(false);
    setGhostRoadTiles([]);
    setIsDemolishingRoad(false); // Új: bontási mód kikapcsolása
  };

  const handleRentBuilding = () => {
    if (!selectedBuilding || selectedBuilding.type !== "house" || selectedBuilding.rentalPrice === undefined) {
      return;
    }

    const isOwner = selectedBuilding.ownerId === currentPlayerId;
    const isAlreadyRentedByPlayer = selectedBuilding.renterId === currentPlayerId;
    const isAlreadyResident = selectedBuilding.residentIds.includes(currentPlayerId);

    if (isOwner) {
      if (isAlreadyResident) {
        showError("Már beköltöztél a saját házadba!");
        return;
      }
      if (selectedBuilding.residentIds.length >= selectedBuilding.capacity) {
        showError("Ez a ház már tele van!");
        return;
      }
      setBuildings(prevBuildings =>
        prevBuildings.map(b =>
          b.id === selectedBuilding.id
            ? { ...b, renterId: currentPlayerId, residentIds: [...b.residentIds, currentPlayerId] }
            : b
        )
      );
      showSuccess(`Sikeresen beköltöztél a saját ${selectedBuilding.name} házadba!`);
      setSelectedBuilding(null);
      return;
    }

    if (isAlreadyRentedByPlayer) {
      showError("Ezt a házat már kibérelted!");
      return;
    }
    if (selectedBuilding.residentIds.length >= selectedBuilding.capacity) {
      showError("Ez a ház már tele van!");
      return;
    }
    if (selectedBuilding.rentalPrice > 0 && currentPlayer.money < selectedBuilding.rentalPrice) { // Ellenőrzés, ha az ár > 0
      showError("Nincs elég pénzed a bérléshez!");
      return;
    }

    if (selectedBuilding.rentalPrice && selectedBuilding.rentalPrice > 0) {
      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.id === currentPlayerId ? { ...p, money: p.money - selectedBuilding.rentalPrice! } : p
        )
      );
      addTransaction(currentPlayerId, "expense", `Bérleti díj (${selectedBuilding.name})`, selectedBuilding.rentalPrice);
    }
    
    setBuildings(prevBuildings =>
      prevBuildings.map(b =>
        b.id === selectedBuilding.id
          ? { ...b, renterId: currentPlayerId, residentIds: [...b.residentIds, currentPlayerId] }
          : b
      )
    );
    showSuccess(`Sikeresen kibérelted a ${selectedBuilding.name} házat ${selectedBuilding.rentalPrice === 0 ? "ingyen" : `${selectedBuilding.rentalPrice} pénz/perc`} áron!`);
    setSelectedBuilding(null);
  };

  const handleJoinOffice = () => {
    if (!selectedBuilding || (selectedBuilding.type !== "office" && selectedBuilding.type !== "forestry" && selectedBuilding.type !== "farm" && selectedBuilding.type !== "shop") || selectedBuilding.salary === undefined) {
      return;
    }

    if (selectedBuilding.employeeIds.includes(currentPlayerId)) {
      showError("Már dolgozol ebben az épületben!");
      return;
    }
    if (selectedBuilding.employeeIds.length >= selectedBuilding.capacity) {
      showError("Ez az épület már tele van!");
      return;
    }

    setBuildings(prevBuildings =>
      prevBuildings.map(b =>
        b.id === selectedBuilding.id
          ? { ...b, employeeIds: [...b.employeeIds, currentPlayerId] }
          : b
      )
    );
    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === currentPlayerId ? { ...p, workplace: selectedBuilding.name, workplaceSalary: selectedBuilding.salary! } : p
      )
    );
    showSuccess(`Sikeresen beléptél alkalmazottként a ${selectedBuilding.name} épületbe! Fizetés: ${selectedBuilding.salary === 0 ? "Ingyenes" : `${selectedBuilding.salary} pénz/perc`}.`);
    setSelectedBuilding(null);
  };

  const handleBuildBuilding = (buildingName: string) => {
    const buildingOption = availableBuildingOptions.find(opt => opt.name === buildingName);

    if (!buildingOption) {
      showError("Ismeretlen épület típus!");
      return;
    }

    if (currentPlayer.money < buildingOption.cost) {
      showError(`Nincs elég pénzed ${buildingOption.name} építéséhez! Szükséges: ${buildingOption.cost} pénz.`);
      return;
    }
    if (buildingOption.woodCost && currentPlayer.inventory.wood < buildingOption.woodCost) {
      showError(`Nincs elég fa ${buildingOption.name} építéséhez! Szükséges: ${buildingOption.woodCost} fa.`);
      return;
    }
    if (buildingOption.brickCost && currentPlayer.inventory.brick < buildingOption.brickCost) {
      showError(`Nincs elég tégla ${buildingOption.name} építéséhez! Szükséges: ${buildingOption.brickCost} tégla.`);
      return;
    }

    setIsBuildMenuOpen(false);
    setBuildingToPlace(buildingOption);
    setIsPlacingBuilding(true);
    setCurrentBuildingRotation(0);
    showSuccess(`Kattints a térképre, ahova a ${buildingOption.name} épületet szeretnéd helyezni. Használd a 'Forgatás' gombot az irány megváltoztatásához.`);
  };

  const handleRotateBuilding = () => {
    setCurrentBuildingRotation(prevRotation => (prevRotation + 90) % 360);
  };

  const handleMapMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const mapRect = event.currentTarget.getBoundingClientRect();
    // A kurzor pozíciója a nem eltolt térképhez képest:
    const mouseXRelativeToMap = event.clientX - mapRect.left - mapOffsetX;
    const mouseYRelativeToMap = event.clientY - mapRect.top - mapOffsetY;

    const gridX = Math.floor(mouseXRelativeToMap / CELL_SIZE_PX);
    const gridY = Math.floor(mouseYRelativeToMap / CELL_SIZE_PX);

    if (isPlacingBuilding && buildingToPlace) {
      setGhostBuildingCoords({ x: gridX, y: gridY }); // Rács koordinátákat tárolunk
    } else if (isPlacingFarmland && selectedFarmId && isFarmlandDragging && lastMousePos) {
      // A húzás kezdőpontjának rács koordinátái (figyelembe véve az eltolást)
      const startGridX = Math.floor((lastMousePos.x - mapRect.left - mapOffsetX) / CELL_SIZE_PX);
      const startGridY = Math.floor((lastMousePos.y - mapRect.top - mapOffsetY) / CELL_SIZE_PX);

      const minX = Math.min(startGridX, gridX);
      const maxX = Math.max(startGridX, gridX);
      const minY = Math.min(startGridY, gridY);
      const maxY = Math.max(startGridY, gridY);

      const newGhostTiles: { x: number; y: number }[] = [];
      const farm = buildings.find(b => b.id === selectedFarmId);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          if (farm && isFarmlandWithinRange(farm.x, farm.y, farm.width, farm.height, farm.rotation, x, y)) {
            newGhostTiles.push({ x, y });
          }
        }
      }
      setGhostFarmlandTiles(newGhostTiles);
    } else if (isPlacingFarmland && selectedFarmId && !isFarmlandDragging) {
      const farm = buildings.find(b => b.id === selectedFarmId);
      if (farm && isFarmlandWithinRange(farm.x, farm.y, farm.width, farm.height, farm.rotation, gridX, gridY)) {
        setGhostBuildingCoords({ x: gridX, y: gridY }); // Rács koordinátákat tárolunk
      } else {
        setGhostBuildingCoords(null);
      }
    } else if (isPlacingRoad && isRoadDragging && lastMousePos) {
      // A húzás kezdőpontjának rács koordinátái (figyelembe véve az eltolást)
      const startGridX = Math.floor((lastMousePos.x - mapRect.left - mapOffsetX) / CELL_SIZE_PX);
      const startGridY = Math.floor((lastMousePos.y - mapRect.top - mapOffsetY) / CELL_SIZE_PX);

      const newGhostTiles: { x: number; y: number }[] = [];
      const dx = Math.abs(gridX - startGridX);
      const dy = Math.abs(gridY - startGridY);
      const sx = (startGridX < gridX) ? 1 : -1;
      const sy = (startGridY < gridY) ? 1 : -1;
      let err = dx - dy;

      let x = startGridX;
      let y = startGridY;

      while (true) {
        // Csak akkor adjuk hozzá a szellem csempét, ha nincs rajta már épület
        if (!isCellOccupied(x, y, buildings)) {
          newGhostTiles.push({ x, y });
        }
        if (x === gridX && y === gridY) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }
      
      setGhostRoadTiles(newGhostTiles);
    } else if (isPlacingRoad && !isRoadDragging) {
      setGhostBuildingCoords({ x: gridX, y: gridY }); // Rács koordinátákat tárolunk
    } else if (isDemolishingRoad) {
      // Nincs szellem épület bontáskor, de a kurzor változhat
      setGhostBuildingCoords(null);
    }
    else if (isDragging && lastMousePos) {
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;
      setMapOffsetX(prev => prev + deltaX);
      setMapOffsetY(prev => prev + deltaY);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMapMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const mapRect = event.currentTarget.getBoundingClientRect();
    const mouseXRelativeToMap = event.clientX - mapRect.left;
    const mouseYRelativeToMap = event.clientY - mapRect.top;

    if (isPlacingRoad) {
      setIsRoadDragging(true);
      // A húzás kezdőpontját a viewport-hoz képest tároljuk, hogy a delta mozgás helyes legyen a handleMapMouseMove-ban
      setLastMousePos({ x: event.clientX, y: event.clientY }); 
      
      // Rács koordináták számítása a nem eltolt térképhez képest
      const gridX = Math.floor((mouseXRelativeToMap - mapOffsetX) / CELL_SIZE_PX);
      const gridY = Math.floor((mouseYRelativeToMap - mapOffsetY) / CELL_SIZE_PX);
      
      // Csak akkor kezdjük el a húzást, ha a kezdő csempe nem foglalt
      if (!isCellOccupied(gridX, gridY, buildings)) {
        setGhostRoadTiles([{ x: gridX, y: gridY }]);
      } else {
        showError("Nem lehet utat építeni foglalt területekre!");
        setIsRoadDragging(false); // Megszakítjuk a húzást, ha foglalt a kezdőpont
      }
    } else if (isPlacingFarmland && selectedFarmId) {
      setIsFarmlandDragging(true);
      setLastMousePos({ x: event.clientX, y: event.clientY }); 
      
      // Rács koordináták számítása a nem eltolt térképhez képest
      const gridX = Math.floor((mouseXRelativeToMap - mapOffsetX) / CELL_SIZE_PX);
      const gridY = Math.floor((mouseYRelativeToMap - mapOffsetY) / CELL_SIZE_PX);
      
      const farm = buildings.find(b => b.id === selectedFarmId);
      if (farm && isFarmlandWithinRange(farm.x, farm.y, farm.width, farm.height, farm.rotation, gridX, gridY)) {
        setGhostFarmlandTiles([{ x: gridX, y: gridY }]);
      } else {
        showError(`A szántóföldet csak a farmtól számított ${FARMLAND_MAX_DISTANCE} mezőn belül lehet elhelyezni!`);
        setIsFarmlandDragging(false);
      }
    } else if (!isPlacementMode) {
      setIsDragging(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMapMouseUp = () => {
    setIsDragging(false);
    setLastMousePos(null);

    if (isPlacingRoad && isRoadDragging) {
      setIsRoadDragging(false);
      // Szűrjük ki a foglalt csempéket a ghostRoadTiles-ból, mielőtt építjük őket
      const buildableRoadTiles = ghostRoadTiles.filter(tile => !isCellOccupied(tile.x, tile.y, buildings));

      if (buildableRoadTiles.length === 0) {
        showError("Nem lehet utat építeni foglalt területekre!");
        setGhostRoadTiles([]);
        setIsPlacingRoad(false); // Kilépünk az útépítési módból
        return;
      }

      const totalCost = buildableRoadTiles.length * ROAD_COST_PER_TILE;
      const totalStoneCost = buildableRoadTiles.length * ROAD_STONE_COST_PER_TILE;

      if (currentPlayer.money < totalCost) {
        showError(`Nincs elég pénzed az utak építéséhez! Szükséges: ${totalCost} pénz.`);
        setGhostRoadTiles([]);
        setIsPlacingRoad(false); // Kilépünk az útépítési módból
        return;
      }
      if (currentPlayer.inventory.stone < totalStoneCost) {
        showError(`Nincs elég kő az utak építéséhez! Szükséges: ${totalStoneCost} kő.`);
        setGhostRoadTiles([]);
        setIsPlacingRoad(false); // Kilépünk az útépítési módból
        return;
      }

      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.id === currentPlayerId ? { ...p, money: p.money - totalCost, inventory: { ...p.inventory, stone: p.inventory.stone - totalStoneCost } } : p
        )
      );
      addTransaction(currentPlayerId, "expense", `Út építése (${buildableRoadTiles.length} csempe)`, totalCost);
      addTransaction(currentPlayerId, "expense", `Kő felhasználás útépítéshez (${buildableRoadTiles.length} csempe)`, totalStoneCost);

      setIsBuildingInProgress(true);

      const newRoads: BuildingData[] = buildableRoadTiles.map(tile => ({
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
        isUnderConstruction: true,
        buildProgress: 0,
        rotation: 0,
      }));

      setBuildings(prevBuildings => [...prevBuildings, ...newRoads]);
      const toastId = showLoading(`Út építése folyamatban (${buildableRoadTiles.length} csempe)...`);

      if (sfxPlayerRef.current) {
        sfxPlayerRef.current.stopAllSfx(); // Leállítjuk az előző SFX-et, ha volt
        sfxPlayerRef.current.playSfx("construction-01", true); // Építési hang loopolva
      }

      const progressIntervals: NodeJS.Timeout[] = [];
      newRoads.forEach(road => {
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += (100 / (ROAD_BUILD_DURATION_MS / 100));
          if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(interval);
          }
          setBuildings(prevBuildings =>
            prevBuildings.map(b =>
              b.id === road.id ? { ...b, buildProgress: Math.floor(currentProgress) } : b
            )
          );
        }, 100);
        progressIntervals.push(interval);
      });

      setTimeout(() => {
        progressIntervals.forEach(clearInterval);
        dismissToast(toastId);
        setIsBuildingInProgress(false);

        setBuildings(prevBuildings =>
          prevBuildings.map(b =>
            newRoads.some(nr => nr.id === b.id)
              ? { ...b, isUnderConstruction: false, buildProgress: 100 }
              : b
          )
        );
        showSuccess(`Út sikeresen felépült (${buildableRoadTiles.length} csempe)!`);

        if (sfxPlayerRef.current) {
          sfxPlayerRef.current.stopAllSfx();
        }
      }, ROAD_BUILD_DURATION_MS);
      setGhostRoadTiles([]);
      setIsPlacingRoad(false);
    } else if (isPlacingFarmland && selectedFarmId && isFarmlandDragging) {
      setIsFarmlandDragging(false);
      if (ghostFarmlandTiles.length > 0) {
        const farm = buildings.find(b => b.id === selectedFarmId);
        if (!farm || farm.type !== "farm" || farm.ownerId !== currentPlayerId) {
          showError("Ez nem a te farmod, vagy nem farm típusú épület!");
          setGhostFarmlandTiles([]);
          return;
        }

        const hasHoe = currentPlayer.inventory.hoe > 0;
        const hasTractor = currentPlayer.inventory.tractor > 0;
        const buildDuration = hasTractor ? FARMLAND_TRACTOR_BUILD_DURATION_MS : FARMLAND_HOE_BUILD_DURATION_MS;
        const toolName = hasTractor ? "traktorral" : "kapával";

        if (!hasHoe && !hasTractor) {
          showError("Nincs kapád vagy traktorod a szántóföld létrehozásához!");
          setGhostFarmlandTiles([]);
          return;
        }

        const totalCost = ghostFarmlandTiles.length * FARMLAND_COST_PER_TILE;
        if (currentPlayer.money < totalCost) {
          showError(`Nincs elég pénzed szántóföld létrehozásához! Szükséges: ${totalCost} pénz.`);
          setGhostFarmlandTiles([]);
          return;
        }

        setPlayers(prevPlayers =>
          prevPlayers.map(p =>
            p.id === currentPlayerId ? { ...p, money: p.money - totalCost } : p
          )
        );
        addTransaction(currentPlayerId, "expense", `Szántóföld létrehozása (${farm.name}, ${ghostFarmlandTiles.length} csempe)`, totalCost);

        setIsBuildingInProgress(true);

        const newFarmlandTiles: FarmlandTile[] = ghostFarmlandTiles.map(tile => ({
          x: tile.x,
          y: tile.y,
          ownerId: currentPlayerId,
          isUnderConstruction: true,
          buildProgress: 0,
        }));

        setBuildings(prevBuildings =>
          prevBuildings.map(b =>
            b.id === selectedFarmId
              ? { ...b, farmlandTiles: [...(b.farmlandTiles || []), ...newFarmlandTiles] }
              : b
          )
        );
        const toastId = showLoading(`Szántóföld építése folyamatban (${ghostFarmlandTiles.length} csempe, ${toolName})...`);

        if (sfxPlayerRef.current) {
          sfxPlayerRef.current.stopAllSfx();
          sfxPlayerRef.current.playSfx("construction-01", true);
        }

        const progressIntervals: NodeJS.Timeout[] = [];
        newFarmlandTiles.forEach(tile => {
          let currentProgress = 0;
          const interval = setInterval(() => {
            currentProgress += (100 / (buildDuration / 100));
            if (currentProgress >= 100) {
              currentProgress = 100;
              clearInterval(interval);
            }
            setBuildings(prevBuildings =>
              prevBuildings.map(b =>
                b.id === selectedFarmId
                  ? {
                      ...b,
                      farmlandTiles: b.farmlandTiles?.map(ft =>
                        ft.x === tile.x && ft.y === tile.y ? { ...ft, buildProgress: Math.floor(currentProgress) } : ft
                      ),
                    }
                  : b
              )
            );
          }, 100);
          progressIntervals.push(interval);
        });

        setTimeout(() => {
          progressIntervals.forEach(clearInterval);
          dismissToast(toastId);
          setIsBuildingInProgress(false);

          setBuildings(prevBuildings =>
            prevBuildings.map(b =>
              b.id === selectedFarmId
                ? {
                    ...b,
                    farmlandTiles: b.farmlandTiles?.map(ft =>
                      newFarmlandTiles.some(nft => nft.x === ft.x && nft.y === ft.y)
                        ? { ...ft, isUnderConstruction: false, buildProgress: 100 }
                        : ft
                    ),
                  }
                : b
            )
          );
          showSuccess(`Szántóföld sikeresen létrehozva (${ghostFarmlandTiles.length} csempe, ${toolName})!`);

          if (sfxPlayerRef.current) {
            sfxPlayerRef.current.stopAllSfx();
          }
        }, buildDuration);
      }
      setGhostFarmlandTiles([]);
      setIsPlacingFarmland(false);
      setSelectedFarmId(null);
    }
  };

  const handleMapClick = (gridX: number, gridY: number) => { // Itt már rács koordinátákat kapunk
    if (isPlacingBuilding && buildingToPlace) {
      if (canPlaceBuilding(gridX, gridY, buildingToPlace.width, buildingToPlace.height, currentBuildingRotation, buildingToPlace.type, buildings, ghostRoadTiles)) {
        setIsPlacingBuilding(false);
        setBuildingToPlace(null);
        setGhostBuildingCoords(null);

        setPlayers(prevPlayers =>
          prevPlayers.map(p =>
            p.id === currentPlayerId
              ? {
                  ...p,
                  money: p.money - buildingToPlace.cost,
                  inventory: {
                    ...p.inventory,
                    wood: p.inventory.wood - (buildingToPlace.woodCost || 0),
                    brick: p.inventory.brick - (buildingToPlace.brickCost || 0),
                  },
                }
              : p
          )
        );
        addTransaction(currentPlayerId, "expense", `Építés: ${buildingToPlace.name}`, buildingToPlace.cost);
        if (buildingToPlace.woodCost) addTransaction(currentPlayerId, "expense", `Fa felhasználás: ${buildingToPlace.name}`, buildingToPlace.woodCost);
        if (buildingToPlace.brickCost) addTransaction(currentPlayerId, "expense", `Tégla felhasználás: ${buildingToPlace.name}`, buildingToPlace.brickCost);

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
          renterId: undefined,
          residentIds: [],
          employeeIds: [],
          isUnderConstruction: true,
          buildProgress: 0,
          rotation: currentBuildingRotation,
          farmlandTiles: buildingToPlace.type === "farm" ? [] : undefined,
        };

        setBuildings(prevBuildings => [...prevBuildings, tempBuilding]);
        const toastId = showLoading(`${buildingToPlace.name} építése folyamatban...`);

        if (sfxPlayerRef.current) {
          sfxPlayerRef.current.stopAllSfx();
          const sfxKey = buildingToPlace.type === "house" ? "construction-01" : "construction-02";
          sfxPlayerRef.current.playSfx(sfxKey, true);
        }

        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += (100 / (buildingToPlace.duration / 100));
          if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(interval);
          }
          setBuildings(prevBuildings =>
            prevBuildings.map(b =>
              b.id === newBuildingId ? { ...b, buildProgress: Math.floor(currentProgress) } : b
            )
          );
        }, 100);

        setTimeout(() => {
          clearInterval(interval);
          dismissToast(toastId);
          setIsBuildingInProgress(false);

          setBuildings(prevBuildings =>
            prevBuildings.map(b =>
              b.id === newBuildingId
                ? { ...b, isUnderConstruction: false, buildProgress: 100 }
                : b
            )
          );
          showSuccess(`Új ${buildingToPlace.name} sikeresen felépült!`);

          if (sfxPlayerRef.current) {
            sfxPlayerRef.current.stopAllSfx();
          }
        }, buildingToPlace.duration);
      } else {
        // Hibaüzenet már a canPlaceBuilding-ben megjelenik
      }
    } else if (isPlacingRoad && !isRoadDragging) { // Ha csak kattintunk útépítés módban, de nem húzunk
      if (!isCellOccupied(gridX, gridY, buildings)) {
        if (currentPlayer.money < ROAD_COST_PER_TILE) {
          showError(`Nincs elég pénzed út építéséhez! Szükséges: ${ROAD_COST_PER_TILE} pénz.`);
          return;
        }
        if (currentPlayer.inventory.stone < ROAD_STONE_COST_PER_TILE) {
          showError(`Nincs elég kő út építéséhez! Szükséges: ${ROAD_STONE_COST_PER_TILE} kő.`);
          return;
        }

        setPlayers(prevPlayers =>
          prevPlayers.map(p =>
            p.id === currentPlayerId ? { ...p, money: p.money - ROAD_COST_PER_TILE, inventory: { ...p.inventory, stone: p.inventory.stone - ROAD_STONE_COST_PER_TILE } } : p
          )
        );
        addTransaction(currentPlayerId, "expense", "Út építése", ROAD_COST_PER_TILE);
        addTransaction(currentPlayerId, "expense", "Kő felhasználás útépítéshez", ROAD_STONE_COST_PER_TILE);

        setIsBuildingInProgress(true);

        const newRoadId = `road-${Date.now()}`;
        const newRoad: BuildingData = {
          id: newRoadId,
          name: "Út",
          x: gridX,
          y: gridY,
          width: 1,
          height: 1,
          type: "road",
          capacity: 0,
          ownerId: currentPlayerId,
          residentIds: [],
          employeeIds: [],
          isUnderConstruction: true,
          buildProgress: 0,
          rotation: 0,
        };
        setBuildings(prevBuildings => [...prevBuildings, newRoad]);
        const toastId = showLoading(`Út építése folyamatban...`);

        if (sfxPlayerRef.current) {
          sfxPlayerRef.current.stopAllSfx();
          sfxPlayerRef.current.playSfx("construction-01", true);
        }

        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += (100 / (ROAD_BUILD_DURATION_MS / 100));
          if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(interval);
          }
          setBuildings(prevBuildings =>
            prevBuildings.map(b =>
              b.id === newRoadId ? { ...b, buildProgress: Math.floor(currentProgress) } : b
            )
          );
        }, 100);

        setTimeout(() => {
          clearInterval(interval);
          dismissToast(toastId);
          setIsBuildingInProgress(false);

          setBuildings(prevBuildings =>
            prevBuildings.map(b =>
              b.id === newRoadId
                ? { ...b, isUnderConstruction: false, buildProgress: 100 }
                : b
            )
          );
          showSuccess("Út csempe sikeresen elhelyezve!");

          if (sfxPlayerRef.current) {
            sfxPlayerRef.current.stopAllSfx();
          }
        }, ROAD_BUILD_DURATION_MS);
      } else {
        showError("Ez a hely már foglalt!");
      }
    } else if (isDemolishingRoad) { // Új: út bontása
      const roadToDemolish = buildings.find(b => b.type === "road" && b.x === gridX && b.y === gridY && b.ownerId === currentPlayerId && !b.isUnderConstruction);

      if (roadToDemolish) {
        const refundAmount = Math.floor(ROAD_COST_PER_TILE * DEMOLISH_REFUND_PERCENTAGE);
        const refundStone = Math.floor(ROAD_STONE_COST_PER_TILE * DEMOLISH_REFUND_PERCENTAGE);

        setPlayers(prevPlayers =>
          prevPlayers.map(p =>
            p.id === currentPlayerId ? { ...p, money: p.money + refundAmount, inventory: { ...p.inventory, stone: p.inventory.stone + refundStone } } : p
          )
        );
        addTransaction(currentPlayerId, "income", `Út bontása (visszatérítés)`, refundAmount);
        addTransaction(currentPlayerId, "income", `Kő visszatérítés út bontásakor`, refundStone);

        setBuildings(prevBuildings => prevBuildings.filter(b => b.id !== roadToDemolish.id));
        showSuccess(`Út sikeresen lebontva! Visszatérítve: ${refundAmount} pénz és ${refundStone} kő.`);

        if (sfxPlayerRef.current) {
          sfxPlayerRef.current.playSfx("demolition-01"); // Bontási hang
        }
      } else {
        showError("Nincs itt út, amit lebontani lehetne, vagy nem a te tulajdonod!");
      }
    } else if (isPlacingFarmland && selectedFarmId && !isFarmlandDragging) { // Ha csak kattintunk szántóföld építés módban, de nem húzunk
      const farm = buildings.find(b => b.id === selectedFarmId);
      if (!farm || farm.type !== "farm" || farm.ownerId !== currentPlayerId) {
        showError("Ez nem a te farmod, vagy nem farm típusú épület!");
        return;
      }

      if (!isFarmlandWithinRange(farm.x, farm.y, farm.width, farm.height, farm.rotation, gridX, gridY)) {
        showError(`A szántóföldet csak a farmtól számított ${FARMLAND_MAX_DISTANCE} mezőn belül lehet elhelyezni!`);
        return;
      }

      const isTileOccupied = farm.farmlandTiles?.some(tile => tile.x === gridX && tile.y === gridY);
      if (isTileOccupied) {
        showError("Ez a szántóföld csempe már foglalt!");
        return;
      }

      const hasHoe = currentPlayer.inventory.hoe > 0;
      const hasTractor = currentPlayer.inventory.tractor > 0;
      const buildDuration = hasTractor ? FARMLAND_TRACTOR_BUILD_DURATION_MS : FARMLAND_HOE_BUILD_DURATION_MS;
      const toolName = hasTractor ? "traktorral" : "kapával";

      if (!hasHoe && !hasTractor) {
        showError("Nincs kapád vagy traktorod a szántóföld létrehozásához!");
        return;
      }

      if (currentPlayer.money < FARMLAND_COST_PER_TILE) {
        showError(`Nincs elég pénzed szántóföld létrehozásához! Szükséges: ${FARMLAND_COST_PER_TILE} pénz.`);
        return;
      }

      setPlayers(prevPlayers =>
          prevPlayers.map(p =>
            p.id === currentPlayerId ? { ...p, money: p.money - FARMLAND_COST_PER_TILE } : p
          )
        );
      addTransaction(currentPlayerId, "expense", `Szántóföld létrehozása (${farm.name})`, FARMLAND_COST_PER_TILE);

      setIsBuildingInProgress(true);

      const newFarmlandTile: FarmlandTile = {
        x: gridX,
        y: gridY,
        ownerId: currentPlayerId,
        isUnderConstruction: true,
        buildProgress: 0,
      };

      setBuildings(prevBuildings =>
        prevBuildings.map(b =>
          b.id === selectedFarmId
            ? { ...b, farmlandTiles: [...(b.farmlandTiles || []), newFarmlandTile] }
            : b
        )
      );
      const toastId = showLoading(`Szántóföld építése folyamatban (${toolName})...`);

      if (sfxPlayerRef.current) {
        sfxPlayerRef.current.stopAllSfx();
        sfxPlayerRef.current.playSfx("construction-01", true);
      }

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += (100 / (buildDuration / 100));
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
        }
        setBuildings(prevBuildings =>
          prevBuildings.map(b =>
            b.id === selectedFarmId
              ? {
                  ...b,
                  farmlandTiles: b.farmlandTiles?.map(ft =>
                    ft.x === gridX && ft.y === gridY ? { ...ft, buildProgress: Math.floor(currentProgress) } : ft
                  ),
                }
              : b
          )
        );
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        dismissToast(toastId);
        setIsBuildingInProgress(false);

        setBuildings(prevBuildings =>
          prevBuildings.map(b =>
            b.id === selectedFarmId
              ? {
                  ...b,
                  farmlandTiles: b.farmlandTiles?.map(ft =>
                    ft.x === gridX && ft.y === gridY ? { ...ft, isUnderConstruction: false, buildProgress: 100 } : ft
                  ),
                }
              : b
          )
        );
        showSuccess(`Szántóföld csempe sikeresen létrehozva (${toolName})!`);

        if (sfxPlayerRef.current) {
          sfxPlayerRef.current.stopAllSfx();
        }
      }, buildDuration);
    }
  };

  const handleFarmlandClick = (farmId: string, x: number, y: number) => {
    // Ez a függvény már nem lesz közvetlenül meghívva a Map-ből, hanem a handleMapClick kezeli.
    // A folyamatos építés miatt a handleMapMouseUp fogja feldolgozni a ghostFarmlandTiles-t.
    // Azonban a single-tile kattintásos logikát meghagyom a handleMapClick-ben.
  };

  const cancelBuildingPlacement = () => {
    setIsPlacingBuilding(false);
    setBuildingToPlace(null);
    setGhostBuildingCoords(null);
    showError("Építés megszakítva.");
    if (sfxPlayerRef.current) {
      sfxPlayerRef.current.stopAllSfx();
    }
  };

  const cancelFarmlandPlacement = () => {
    setIsPlacingFarmland(false);
    setSelectedFarmId(null);
    setGhostFarmlandTiles([]);
    setIsFarmlandDragging(false);
    setGhostBuildingCoords(null);
    showError("Szántóföld építés megszakítva.");
    if (sfxPlayerRef.current) {
      sfxPlayerRef.current.stopAllSfx();
    }
  };

  const cancelRoadMode = () => { // Új: útépítés és út bontás megszakítása
    setIsPlacingRoad(false);
    setIsRoadDragging(false);
    setGhostRoadTiles([]);
    setIsDemolishingRoad(false);
    setGhostBuildingCoords(null);
    showError("Út mód megszakítva.");
    if (sfxPlayerRef.current) {
      sfxPlayerRef.current.stopAllSfx();
    }
  };

  const handleNextPlayer = () => {
    const currentIndex = players.findIndex(p => p.id === currentPlayerId);
    const nextIndex = (currentIndex + 1) % players.length;
    setCurrentPlayerId(players[nextIndex].id);
  };

  const handlePreviousPlayer = () => {
    const currentIndex = players.findIndex(p => p.id === currentPlayerId);
    const prevIndex = (currentIndex - 1 + players.length) % players.length;
    setCurrentPlayerId(players[prevIndex].id);
  };

  const handleGoToMenu = () => {
    navigate('/', { state: { players: players, buildings: buildings, currentPlayerId: currentPlayerId, transactions: transactions } });
  };

  const ownedBusinesses = buildings.filter(b => b.ownerId === currentPlayerId && (b.type === "office" || b.type === "forestry" || b.type === "farm" || b.type === "shop"));
  const ownedMayorsOffice = buildings.find(b => b.ownerId === currentPlayerId && b.name === "Polgármesteri Hivatal");

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-sidebar-primary-foreground">Tile-o-polis</h2>
        {/* PlayerSettings áthelyezve a PlayerInfo komponensbe */}
      </div>

      <div className="mb-4">
        <Label htmlFor="player-switcher" className="text-sidebar-foreground mb-2 block">Játékos váltása:</Label>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePreviousPlayer} className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border hover:bg-sidebar-primary/80">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select onValueChange={setCurrentPlayerId} value={currentPlayerId}>
            <SelectTrigger id="player-switcher" className="w-full bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border">
              <SelectValue placeholder="Válassz játékost" />
            </SelectTrigger>
            <SelectContent className="bg-sidebar text-sidebar-foreground border-sidebar-border">
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleNextPlayer} className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border hover:bg-sidebar-primary/80">
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
        ownedBusinesses={ownedBusinesses}
        playerSettingsButton={
          <PlayerSettings playerName={currentPlayer.name} onPlayerNameChange={updatePlayerName} />
        }
      />
      <div className="mt-4">
        <Button
          onClick={() => setIsBuildMenuOpen(true)}
          disabled={isPlacementMode} // Csak akkor inaktív, ha a játékos éppen helyez el valamit
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Építés
        </Button>
        {isPlacingBuilding && (
          <>
            <Button
              onClick={handleRotateBuilding}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-2"
            >
              <RotateCw className="h-4 w-4 mr-2" /> Forgatás ({currentBuildingRotation}°)
            </Button>
            <Button
              onClick={cancelBuildingPlacement}
              className="w-full bg-red-600 hover:bg-red-700 text-white mt-2"
            >
              Építés megszakítása
            </Button>
          </>
        )}
        {isPlacingFarmland && (
          <Button
            onClick={cancelFarmlandPlacement}
            className="w-full bg-red-600 hover:bg-red-700 text-white mt-2"
          >
            Szántóföld építés megszakítása
          </Button>
        )}
        {(isPlacingRoad || isDemolishingRoad) && ( // Új: útépítés/bontás megszakítása gomb
          <Button
            onClick={cancelRoadMode}
            className="w-full bg-red-600 hover:bg-red-700 text-white mt-2"
          >
            Út mód megszakítása
          </Button>
        )}
        <Button
          onClick={() => setIsMoneyHistoryOpen(true)}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white mt-2"
        >
          Pénzmozgások
        </Button>
        <Button
          onClick={handleGoToMenu}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white mt-4"
        >
          Menü
        </Button>
      </div>
      <MusicPlayer tracks={musicTracks} />
      <SfxPlayer ref={sfxPlayerRef} sfxUrls={sfxUrls} /> {/* SFX lejátszó hozzáadása */}
      <div className="mt-auto">
        <MadeWithDyad />
      </div>
    </>
  );

  const mainContent = (
    <div
      ref={mainContentRef} // Hozzáadva a ref
      className="flex flex-col h-full items-center justify-center relative"
    >
      <div className="flex-grow flex items-center justify-center">
        <Map
          buildings={buildings}
          gridSize={MAP_GRID_SIZE}
          cellSizePx={CELL_SIZE_PX}
          onBuildingClick={handleBuildingClick}
          isPlacingBuilding={isPlacingBuilding}
          buildingToPlace={buildingToPlace}
          ghostBuildingCoords={ghostBuildingCoords} // Rács koordinátákat adunk át
          onMapMouseMove={handleMapMouseMove}
          onMapClick={handleMapClick}
          currentPlayerId={currentPlayerId}
          currentBuildingRotation={currentBuildingRotation}
          isPlacingFarmland={isPlacingFarmland}
          selectedFarmId={selectedFarmId}
          onFarmlandClick={handleFarmlandClick}
          ghostFarmlandTiles={ghostFarmlandTiles} // Átadjuk a szellem szántóföld csempéket
          isPlacingRoad={isPlacingRoad} // Átadjuk az útépítés állapotát
          ghostRoadTiles={ghostRoadTiles} // Átadjuk a szellem út csempéket
          isDemolishingRoad={isDemolishingRoad} // Új: átadjuk a bontási módot
          mapOffsetX={mapOffsetX} // Átadjuk az eltolást a Map komponensnek
          mapOffsetY={mapOffsetY} // Átadjuk az eltolást a Map komponensnek
          isPlacementMode={isPlacementMode} // Átadjuk az isPlacementMode állapotot
          onMapMouseDown={handleMapMouseDown} // Átadjuk a Map komponensnek
          onMapMouseUp={handleMapMouseUp}     // Átadjuk a Map komponensnek
          onMapMouseLeave={handleMapMouseUp}  // Átadjuk a Map komponensnek
        />
      </div>

      {selectedBuilding && (
        <Dialog open={!!selectedBuilding} onOpenChange={() => setSelectedBuilding(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Épület részletei: {selectedBuilding.name}</DialogTitle>
              <DialogDescription>
                Ez egy {selectedBuilding.width}x{selectedBuilding.height} méretű {selectedBuilding.type === "house" ? "ház" : selectedBuilding.type === "office" ? "iroda" : selectedBuilding.type === "forestry" ? "erdészház" : selectedBuilding.type === "farm" ? "farm" : selectedBuilding.type === "shop" ? "bolt" : "út"}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p>Tulajdonos: <span className="font-semibold">{selectedBuilding.ownerId ? (players.find(p => p.id === selectedBuilding.ownerId)?.name || "Ismeretlen") : "Nincs"}</span></p>

              {selectedBuilding.type === "house" && selectedBuilding.rentalPrice !== undefined && (
                <p>Bérleti díj: <span className="font-semibold">{selectedBuilding.rentalPrice === 0 ? "Ingyenes" : `${selectedBuilding.rentalPrice} pénz/perc`}</span></p>
              )}
              {(selectedBuilding.type === "office" || selectedBuilding.type === "forestry" || selectedBuilding.type === "farm" || selectedBuilding.type === "shop") && selectedBuilding.salary !== undefined && (
                <p>Fizetés: <span className="font-semibold">{selectedBuilding.salary === 0 ? "Ingyenes" : `${selectedBuilding.salary} pénz/perc`}</span></p>
              )}
              <p>{selectedBuilding.type === "house" ? "Lakók" : "Dolgozók"}: <span className="font-semibold">{selectedBuilding.type === "house" ? selectedBuilding.residentIds.length : selectedBuilding.employeeIds.length}/{selectedBuilding.capacity}</span></p>

              {selectedBuilding.type === "house" && selectedBuilding.residentIds.length > 0 && (
                <div>
                  <h4 className="font-medium mt-2">Lakók:</h4>
                  <ul className="list-disc list-inside ml-4">
                    {selectedBuilding.residentIds.map(residentId => (
                      <li key={residentId}>{players.find(p => p.id === residentId)?.name || "Ismeretlen"}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(selectedBuilding.type === "office" || selectedBuilding.type === "forestry" || selectedBuilding.type === "farm" || selectedBuilding.type === "shop") && selectedBuilding.employeeIds.length > 0 && (
                <div>
                  <h4 className="font-medium mt-2">Dolgozók:</h4>
                  <ul className="list-disc list-inside ml-4">
                    {selectedBuilding.employeeIds.map(employeeId => (
                      <li key={employeeId}>{players.find(p => p.id === employeeId)?.name || "Ismeretlen"}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedBuilding.type === "farm" && selectedBuilding.ownerId === currentPlayerId && (
                <Button
                  onClick={() => {
                    setIsPlacingFarmland(true);
                    setSelectedFarmId(selectedBuilding.id);
                    setSelectedBuilding(null);
                    showSuccess(`Kattints a farm területére szántóföld csempe létrehozásához (${FARMLAND_COST_PER_TILE} pénz/csempe), vagy húzd az egeret a folyamatos építéshez.`);
                  }}
                  className="w-full mt-4 bg-green-500 hover:bg-green-600"
                >
                  Szántóföld létrehozása
                  <span className="ml-2 text-xs opacity-80">
                    ({FARMLAND_COST_PER_TILE} <Coins className="inline-block h-3 w-3 ml-0.5 mr-0.5" />/csempe, {FARMLAND_HOE_BUILD_DURATION_MS / 1000} mp)
                  </span>
                </Button>
              )}

              {selectedBuilding.name === "Polgármesteri Hivatal" && selectedBuilding.ownerId === currentPlayerId && (
                <div className="flex flex-col space-y-2 mt-4">
                  <Button
                    onClick={() => {
                      setIsPlacingRoad(true);
                      setSelectedBuilding(null);
                      showSuccess(`Kattints a térképre út csempe elhelyezéséhez (${ROAD_COST_PER_TILE} pénz/csempe, ${ROAD_STONE_COST_PER_TILE} kő/csempe), vagy húzd az egeret a folyamatos építéshez.`);
                    }}
                    className="w-full bg-gray-500 hover:bg-gray-600"
                  >
                    <Route className="h-4 w-4 mr-2" /> Út építése
                    <span className="ml-2 text-xs opacity-80">
                      ({ROAD_COST_PER_TILE} <Coins className="inline-block h-3 w-3 ml-0.5 mr-0.5" /> + {ROAD_STONE_COST_PER_TILE} kő/csempe, {ROAD_BUILD_DURATION_MS / 1000} mp)
                    </span>
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDemolishingRoad(true);
                      setSelectedBuilding(null);
                      showSuccess("Kattints egy útcsempére a lebontásához. A költség 50%-át visszakapod.");
                    }}
                    className="w-full bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Út bontása
                  </Button>
                </div>
              )}

              {selectedBuilding.renterId === currentPlayerId && selectedBuilding.ownerId !== currentPlayerId && (
                <p className="text-blue-600 font-medium">Ezt a házat már kibérelted!</p>
              )}
              {selectedBuilding.ownerId === currentPlayerId && !selectedBuilding.residentIds.includes(currentPlayerId) && (
                <p className="text-yellow-600 font-medium">Ez az épület a te tulajdonod!</p>
              )}
              {selectedBuilding.employeeIds.includes(currentPlayerId) && (
                <p className="text-green-600 font-medium">Itt dolgozol!</p>
              )}
              {(selectedBuilding.type === "house" && selectedBuilding.residentIds.length >= selectedBuilding.capacity && !selectedBuilding.residentIds.includes(currentPlayerId)) ||
               ((selectedBuilding.type === "office" || selectedBuilding.type === "forestry" || selectedBuilding.type === "farm" || selectedBuilding.type === "shop") && selectedBuilding.employeeIds.length >= selectedBuilding.capacity && !selectedBuilding.employeeIds.includes(currentPlayerId)) && (
                <p className="text-red-600 font-medium">Ez az épület tele van!</p>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <BuildMenu
        isOpen={isBuildMenuOpen}
        onClose={() => setIsBuildMenuOpen(false)}
        onSelectBuilding={handleBuildBuilding}
        availableBuildings={availableBuildingOptions}
        playerMoney={currentPlayer.money}
        playerWood={currentPlayer.inventory.wood}
        playerBrick={currentPlayer.inventory.brick}
        playerStone={currentPlayer.inventory.stone} // Átadjuk a kő mennyiségét
        isBuildingInProgress={isPlacementMode} // Csak akkor inaktív, ha a játékos éppen helyez el valamit
      />

      <MoneyHistory
        isOpen={isMoneyHistoryOpen}
        onClose={() => setIsMoneyHistoryOpen(false)}
        transactions={transactions}
        currentPlayerId={currentPlayerId}
      />
    </div>
  );

  return <MainLayout sidebarContent={sidebarContent} mainContent={mainContent} />;
};

export default Game;