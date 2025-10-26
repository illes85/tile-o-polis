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
import { musicTracks } from "@/utils/musicFiles"; // Dinamikusan betöltött zenék
import { sfxUrls } from "@/utils/sfxFiles"; // Dinamikusan betöltött hangeffektek
import PlayerSettings from "@/components/PlayerSettings";
import { RotateCw, ChevronLeft, ChevronRight, Sprout, Coins } from "lucide-react"; // Coins ikon importálása
import { useNavigate, useLocation } from "react-router-dom";
import MoneyHistory, { Transaction } from "@/components/MoneyHistory";

const MAP_GRID_SIZE = 20;
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
];

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialPlayer, allPlayers, buildings: initialBuildingsState, currentPlayerId: initialCurrentPlayerId } = (location.state || {}) as { initialPlayer?: Player, allPlayers?: Player[], buildings?: BuildingData[], currentPlayerId?: string };

  const [players, setPlayers] = useState<Player[]>(allPlayers || [
    { id: "player-1", name: "Játékos 1", money: 1000, inventory: { potato: 3, water: 2, clothes: 1, wood: 10, brick: 5 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-2", name: "Játékos 2", money: 750, inventory: { potato: 1, water: 1, clothes: 0, wood: 5, brick: 3 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-3", name: "Játékos 3", money: 1200, inventory: { potato: 5, water: 3, clothes: 2, wood: 15, brick: 8 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-4", name: "Játékos 4", money: 600, inventory: { potato: 0, water: 0, clothes: 0, wood: 0, brick: 0 }, workplace: "Munkanélküli", workplaceSalary: 0 },
    { id: "player-5", name: "Játékos 5", money: 900, inventory: { potato: 2, water: 1, clothes: 1, wood: 8, brick: 4 }, workplace: "Munkanélküli", workplaceSalary: 0 },
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

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Térkép húzogatás állapotok
  const [mapOffsetX, setMapOffsetX] = useState(0);
  const [mapOffsetY, setMapOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null);

  // Hangeffekt referencia
  const currentSfxAudioRef = useRef<HTMLAudioElement | null>(null);

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

  const canPlaceBuilding = (
    targetX: number,
    targetY: number,
    buildingWidth: number,
    buildingHeight: number,
    rotation: number,
    currentBuildings: BuildingData[]
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

    const occupiedCells = getOccupiedCells(currentBuildings);

    for (let x = targetX; x < targetX + effectiveWidth; x++) {
      for (let y = targetY; y < targetY + effectiveHeight; y++) {
        if (occupiedCells.has(`${x},${y}`)) {
          return false;
        }
      }
    }
    return true;
  };

  useEffect(() => {
    // Csak akkor generálunk kezdeti épületeket, ha még nincsenek betöltve (pl. új játék esetén)
    if (buildings.length === 0 && !initialBuildingsState) {
      const initialBuildings: BuildingData[] = [];
      const tempOccupiedCells = new Set<string>();

      const placeInitialBuilding = (
        buildingId: string,
        buildingName: string,
        buildingType: "house" | "office" | "forestry" | "farm",
        buildingWidth: number,
        buildingHeight: number,
        rentalPrice?: number,
        salary?: number,
        capacity: number = 0,
        ownerId?: string,
        rotation: number = 0,
        maxAttempts = 200
      ): BuildingData | null => {
        const effectiveWidth = (rotation === 90 || rotation === 270) ? buildingHeight : buildingWidth;
        const effectiveHeight = (rotation === 90 || rotation === 270) ? buildingWidth : buildingHeight;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const randomX = Math.floor(Math.random() * (MAP_GRID_SIZE - effectiveWidth + 1));
          const randomY = Math.floor(Math.random() * (MAP_GRID_SIZE * 1.5 - effectiveHeight + 1));

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
    const building = buildings.find(b => b.id === buildingId);
    setSelectedBuilding(building || null);
    setIsPlacingFarmland(false);
    setSelectedFarmId(null);
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
    if (!selectedBuilding || (selectedBuilding.type !== "office" && selectedBuilding.type !== "forestry" && selectedBuilding.type !== "farm") || selectedBuilding.salary === undefined) {
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
    if (isPlacingBuilding && buildingToPlace) {
      const mapRect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - mapRect.left - mapOffsetX; // Figyelembe vesszük az eltolást
      const mouseY = event.clientY - mapRect.top - mapOffsetY; // Figyelembe vesszük az eltolást

      const gridX = Math.floor(mouseX / CELL_SIZE_PX);
      const gridY = Math.floor(mouseY / CELL_SIZE_PX);

      setGhostBuildingCoords({ x: gridX, y: gridY });
    } else if (isPlacingFarmland && selectedFarmId) {
      const mapRect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - mapRect.left - mapOffsetX;
      const mouseY = event.clientY - mapRect.top - mapOffsetY;

      const gridX = Math.floor(mouseX / CELL_SIZE_PX);
      const gridY = Math.floor(mouseY / CELL_SIZE_PX);

      setGhostBuildingCoords({ x: gridX, y: gridY });
    } else if (isDragging && lastMousePos) {
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;
      setMapOffsetX(prev => prev + deltaX);
      setMapOffsetY(prev => prev + deltaY);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMapMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingBuilding && !isPlacingFarmland) {
      setIsDragging(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMapMouseUp = () => {
    setIsDragging(false);
    setLastMousePos(null);
  };

  const handleMapClick = (x: number, y: number) => {
    if (isPlacingBuilding && buildingToPlace) {
      if (canPlaceBuilding(x, y, buildingToPlace.width, buildingToPlace.height, currentBuildingRotation, buildings)) {
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
          x: x,
          y: y,
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

        // Hangeffekt lejátszása
        const sfxKey = buildingToPlace.type === "house" ? "construction-01" : "construction-02";
        if (sfxUrls[sfxKey]) {
          if (currentSfxAudioRef.current) {
            currentSfxAudioRef.current.pause();
            currentSfxAudioRef.current.currentTime = 0;
          }
          const audio = new Audio(sfxUrls[sfxKey]);
          audio.loop = true;
          audio.volume = 0.5; // Kicsit halkabban
          audio.play().catch(e => console.error("Hiba a hangeffekt lejátszásakor:", e));
          currentSfxAudioRef.current = audio;
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

          // Hangeffekt leállítása
          if (currentSfxAudioRef.current) {
            currentSfxAudioRef.current.pause();
            currentSfxAudioRef.current.currentTime = 0;
            currentSfxAudioRef.current = null;
          }
        }, buildingToPlace.duration);
      } else {
        showError("Nem építhetsz ide! A hely foglalt vagy a térképen kívül van.");
      }
    }
  };

  const handleFarmlandClick = (farmId: string, x: number, y: number) => {
    const farm = buildings.find(b => b.id === farmId);
    if (!farm || farm.type !== "farm" || farm.ownerId !== currentPlayerId) {
      showError("Ez nem a te farmod, vagy nem farm típusú épület!");
      return;
    }

    // Ellenőrizzük, hogy a csempe már foglalt-e
    const isTileOccupied = farm.farmlandTiles?.some(tile => tile.x === x && tile.y === y);
    if (isTileOccupied) {
      showError("Ez a szántóföld csempe már foglalt!");
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

    setBuildings(prevBuildings =>
      prevBuildings.map(b =>
        b.id === farmId
          ? { ...b, farmlandTiles: [...(b.farmlandTiles || []), { x, y, ownerId: currentPlayerId }] }
          : b
      )
    );
    showSuccess(`Szántóföld csempe létrehozva a ${farm.name} farmon!`);
  };

  const cancelBuildingPlacement = () => {
    setIsPlacingBuilding(false);
    setBuildingToPlace(null);
    setGhostBuildingCoords(null);
    showError("Építés megszakítva.");
    if (currentSfxAudioRef.current) {
      currentSfxAudioRef.current.pause();
      currentSfxAudioRef.current.currentTime = 0;
      currentSfxAudioRef.current = null;
    }
  };

  const cancelFarmlandPlacement = () => {
    setIsPlacingFarmland(false);
    setSelectedFarmId(null);
    setGhostBuildingCoords(null);
    showError("Szántóföld építés megszakítva.");
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

  const ownedBusinesses = buildings.filter(b => b.ownerId === currentPlayerId && (b.type === "office" || b.type === "forestry" || b.type === "farm"));

  // Teszt gomb a hangeffektekhez
  const handleTestSfxPlay = (sfxKey: "construction-01" | "construction-02") => {
    if (sfxUrls[sfxKey]) {
      const audio = new Audio(sfxUrls[sfxKey]);
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.error(`Hiba a '${sfxKey}' hangeffekt lejátszásakor:`, error);
        showError(`Nem sikerült lejátszani a '${sfxKey}' hangeffektet. Ellenőrizd a konzolt!`);
      });
    } else {
      showError(`A '${sfxKey}' hangeffekt URL nem található.`);
    }
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-sidebar-primary-foreground">Város Szimulátor</h2>
        <PlayerSettings playerName={currentPlayer.name} onPlayerNameChange={updatePlayerName} />
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
        onPlayerNameChange={updatePlayerName}
        ownedBusinesses={ownedBusinesses}
      />
      <div className="mt-4">
        <Button
          onClick={() => setIsBuildMenuOpen(true)}
          disabled={isPlacingBuilding || isPlacingFarmland}
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
        <Button
          onClick={() => setIsMoneyHistoryOpen(true)}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white mt-2"
        >
          Pénzmozgások
        </Button>
        {/* Teszt gombok a hangeffektekhez */}
        <Button
          onClick={() => handleTestSfxPlay("construction-01")}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white mt-2"
        >
          Teszt: Ház építési hang
        </Button>
        <Button
          onClick={() => handleTestSfxPlay("construction-02")}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white mt-2"
        >
          Teszt: Vállalkozás építési hang
        </Button>
        <Button
          onClick={handleGoToMenu}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white mt-4"
        >
          Menü
        </Button>
      </div>
      <MusicPlayer tracks={musicTracks} />
      <div className="mt-auto">
        <MadeWithDyad />
      </div>
    </>
  );

  const mainContent = (
    <div
      className="flex flex-col h-full items-center justify-center relative"
      onMouseDown={handleMapMouseDown}
      onMouseUp={handleMapMouseUp}
      onMouseLeave={handleMapMouseUp} // Ha az egér elhagyja a térképet, állítsuk le a húzást
    >
      <div className="flex-grow flex items-center justify-center">
        <Map
          buildings={buildings}
          gridSize={MAP_GRID_SIZE}
          cellSizePx={CELL_SIZE_PX}
          onBuildingClick={handleBuildingClick}
          isPlacingBuilding={isPlacingBuilding}
          buildingToPlace={buildingToPlace}
          ghostBuildingCoords={ghostBuildingCoords}
          onMapMouseMove={handleMapMouseMove}
          onMapClick={handleMapClick}
          currentPlayerId={currentPlayerId}
          currentBuildingRotation={currentBuildingRotation}
          isPlacingFarmland={isPlacingFarmland}
          selectedFarmId={selectedFarmId}
          onFarmlandClick={handleFarmlandClick}
          mapOffsetX={mapOffsetX} // Átadjuk az eltolást a Map komponensnek
          mapOffsetY={mapOffsetY} // Átadjuk az eltolást a Map komponensnek
        />
      </div>

      {selectedBuilding && (
        <Dialog open={!!selectedBuilding} onOpenChange={() => setSelectedBuilding(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Épület részletei: {selectedBuilding.name}</DialogTitle>
              <DialogDescription>
                Ez egy {selectedBuilding.width}x{selectedBuilding.height} méretű {selectedBuilding.type === "house" ? "ház" : selectedBuilding.type === "office" ? "iroda" : selectedBuilding.type === "forestry" ? "erdészház" : "farm"}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p>Tulajdonos: <span className="font-semibold">{selectedBuilding.ownerId ? (players.find(p => p.id === selectedBuilding.ownerId)?.name || "Ismeretlen") : "Nincs"}</span></p>

              {selectedBuilding.type === "house" && selectedBuilding.rentalPrice !== undefined && (
                <p>Bérleti díj: <span className="font-semibold">{selectedBuilding.rentalPrice === 0 ? "Ingyenes" : `${selectedBuilding.rentalPrice} pénz/perc`}</span></p>
              )}
              {(selectedBuilding.type === "office" || selectedBuilding.type === "forestry" || selectedBuilding.type === "farm") && selectedBuilding.salary !== undefined && (
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

              {(selectedBuilding.type === "office" || selectedBuilding.type === "forestry" || selectedBuilding.type === "farm") && selectedBuilding.employeeIds.length > 0 && (
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
                    showSuccess(`Kattints a farm területére szántóföld csempe létrehozásához (${FARMLAND_COST_PER_TILE} pénz/csempe).`);
                  }}
                  className="w-full mt-4 bg-green-500 hover:bg-green-600"
                >
                  Szántóföld létrehozása
                </Button>
              )}

              {selectedBuilding.renterId === currentPlayerId && selectedBuilding.ownerId !== currentPlayerId && (
                <p className="text-blue-600 font-medium">Ezt a házat már kibérelted!</p>
              )}
              {selectedBuilding.ownerId === currentPlayerId && selectedBuilding.residentIds.includes(currentPlayerId) && (
                <p className="text-yellow-600 font-medium">Itt laksz a saját házadban!</p>
              )}
              {selectedBuilding.ownerId === currentPlayerId && !selectedBuilding.residentIds.includes(currentPlayerId) && (
                <p className="text-yellow-600 font-medium">Ez az épület a te tulajdonod!</p>
              )}
              {selectedBuilding.employeeIds.includes(currentPlayerId) && (
                <p className="text-green-600 font-medium">Itt dolgozol!</p>
              )}
              {(selectedBuilding.type === "house" && selectedBuilding.residentIds.length >= selectedBuilding.capacity && !selectedBuilding.residentIds.includes(currentPlayerId)) ||
               ((selectedBuilding.type === "office" || selectedBuilding.type === "forestry" || selectedBuilding.type === "farm") && selectedBuilding.employeeIds.length >= selectedBuilding.capacity && !selectedBuilding.employeeIds.includes(currentPlayerId)) && (
                <p className="text-red-600 font-medium">Ez az épület tele van!</p>
              )}
            </div>
            <DialogFooter>
              {selectedBuilding.type === "house" && (
                <Button
                  onClick={handleRentBuilding}
                  disabled={
                    (selectedBuilding.ownerId === currentPlayerId && selectedBuilding.residentIds.includes(currentPlayerId)) ||
                    (!selectedBuilding.ownerId && selectedBuilding.renterId === currentPlayerId) ||
                    selectedBuilding.residentIds.length >= selectedBuilding.capacity
                  }
                >
                  {selectedBuilding.ownerId === currentPlayerId ? "Beköltözik" : "Kibérlem"}
                </Button>
              )}
              {(selectedBuilding.type === "office" || selectedBuilding.type === "forestry" || selectedBuilding.type === "farm") && (
                <Button
                  onClick={handleJoinOffice}
                  disabled={selectedBuilding.employeeIds.includes(currentPlayerId) || selectedBuilding.employeeIds.length >= selectedBuilding.capacity}
                >
                  Belépés alkalmazottként
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedBuilding(null)}>Mégsem</Button>
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
        isBuildingInProgress={isBuildingInProgress || isPlacingBuilding}
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