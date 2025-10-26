"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PlayerInfo from "@/components/PlayerInfo";
import { MadeWithDyad } = "@/components/made-with-dyad";
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
import { musicTracks } from "@/utils/musicFiles";
import PlayerSettings from "@/components/PlayerSettings";
import { RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

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
  const { initialPlayer, allPlayers } = (location.state || {}) as { initialPlayer?: Player, allPlayers?: Player[] };

  const [players, setPlayers] = useState<Player[]>(allPlayers || [
    { id: "player-1", name: "Játékos 1", money: 1000, inventory: { potato: 3, water: 2, clothes: 1, wood: 10, brick: 5 }, workplace: "Munkanélküli" },
    { id: "player-2", name: "Játékos 2", money: 750, inventory: { potato: 1, water: 1, clothes: 0, wood: 5, brick: 3 }, workplace: "Munkanélküli" },
    { id: "player-3", name: "Játékos 3", money: 1200, inventory: { potato: 5, water: 3, clothes: 2, wood: 15, brick: 8 }, workplace: "Munkanélküli" },
    { id: "player-4", name: "Játékos 4", money: 600, inventory: { potato: 0, water: 0, clothes: 0, wood: 0, brick: 0 }, workplace: "Munkanélküli" },
    { id: "player-5", name: "Játékos 5", money: 900, inventory: { potato: 2, water: 1, clothes: 1, wood: 8, brick: 4 }, workplace: "Munkanélküli" },
  ]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>(initialPlayer?.id || players[0].id);
  const currentPlayer = players.find(p => p.id === currentPlayerId)!;

  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [isBuildingInProgress, setIsBuildingInProgress] = useState(false);
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);

  const [isPlacingBuilding, setIsPlacingBuilding] = useState(false);
  const [buildingToPlace, setBuildingToPlace] = useState<BuildingOption | null>(null);
  const [ghostBuildingCoords, setGhostBuildingCoords] = useState<{ x: number; y: number } | null>(null);
  const [currentBuildingRotation, setCurrentBuildingRotation] = useState<number>(0);

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
    const initialBuildings: BuildingData[] = [];
    const tempOccupiedCells = new Set<string>();

    const placeInitialBuilding = (
      buildingId: string,
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
          };
        }
      }
      console.warn(`Nem sikerült elhelyezni az épületet ${buildingId} ${maxAttempts} próbálkozás után.`);
      return null;
    };

    for (let i = 0; i < 4; i++) {
      const house = placeInitialBuilding(`house-${i + 1}`, "house", 2, 2, 10, undefined, 2, undefined, 0);
      if (house) {
        initialBuildings.push(house);
      }
    }
    setBuildings(initialBuildings);
  }, []);

  useEffect(() => {
    const gameTickTimer = setInterval(() => {
      setPlayers(prevPlayers => prevPlayers.map(player => {
        let newMoney = player.money;
        let totalRent = 0;
        let totalSalary = 0;

        const playerRentedBuildings = buildings.filter(b => b.renterId === player.id && b.ownerId !== player.id);
        playerRentedBuildings.forEach(building => {
          if (building.rentalPrice) {
            totalRent += building.rentalPrice;
          }
        });

        const playerEmployedOffices = buildings.filter(b => b.employeeIds.includes(player.id));
        playerEmployedOffices.forEach(building => {
          if (building.salary) {
            totalSalary += building.salary;
          }
        });

        if (totalRent > 0) {
          if (newMoney >= totalRent) {
            newMoney -= totalRent;
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
          if (player.id === currentPlayerId) showSuccess(`Jóváírva ${totalSalary} pénz fizetésként.`);
        }

        return { ...player, money: newMoney };
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
      showSuccess(`Sikeresen beköltöztél a saját házadba!`);
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
    if (currentPlayer.money < selectedBuilding.rentalPrice) {
      showError("Nincs elég pénzed a bérléshez!");
      return;
    }

    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === currentPlayerId ? { ...p, money: p.money - selectedBuilding.rentalPrice! } : p
      )
    );
    setBuildings(prevBuildings =>
      prevBuildings.map(b =>
        b.id === selectedBuilding.id
          ? { ...b, renterId: currentPlayerId, residentIds: [...b.residentIds, currentPlayerId] }
          : b
      )
    );
    showSuccess(`Sikeresen kibérelted a ${selectedBuilding.id} házat ${selectedBuilding.rentalPrice} pénz/perc áron!`);
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
        p.id === currentPlayerId ? { ...p, workplace: selectedBuilding.name } : p
      )
    );
    showSuccess(`Sikeresen beléptél alkalmazottként a ${selectedBuilding.id} épületbe! Fizetés: ${selectedBuilding.salary} pénz/perc.`);
    setSelectedBuilding(null);
  };

  const handleBuildBuilding = (buildingType: "house" | "office" | "forestry" | "farm") => {
    const buildingOption = availableBuildingOptions.find(opt => opt.type === buildingType && opt.name === (buildingType === "house" ? (opt.name === "Sátor" ? "Sátor" : "Házikó") : opt.name));

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
      const mouseX = event.clientX - mapRect.left;
      const mouseY = event.clientY - mapRect.top;

      const gridX = Math.floor(mouseX / CELL_SIZE_PX);
      const gridY = Math.floor(mouseY / CELL_SIZE_PX);

      setGhostBuildingCoords({ x: gridX, y: gridY });
    }
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
        setIsBuildingInProgress(true);

        const newBuildingId = `player-${buildingToPlace.type}-${Date.now()}`;
        const tempBuilding: BuildingData = {
          id: newBuildingId,
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
        };

        setBuildings(prevBuildings => [...prevBuildings, tempBuilding]);
        const toastId = showLoading(`${buildingToPlace.name} építése folyamatban...`);

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
        }, buildingToPlace.duration);
      } else {
        showError("Nem építhetsz ide! A hely foglalt vagy a térképen kívül van.");
      }
    }
  };

  const cancelBuildingPlacement = () => {
    setIsPlacingBuilding(false);
    setBuildingToPlace(null);
    setGhostBuildingCoords(null);
    showError("Építés megszakítva.");
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
        onPlayerNameChange={updatePlayerName}
      />
      <div className="mt-4">
        <Button
          onClick={() => setIsBuildMenuOpen(true)}
          disabled={isPlacingBuilding}
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
        <Button
          onClick={() => navigate('/')}
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
    <div className="flex flex-col h-full items-center justify-center">
      <h1 className="text-3xl font-bold mb-6 text-primary">Üdv a játékban!</h1>
      <p className="text-lg text-muted-foreground mb-4">
        Ez a játék világa. Itt fognak megjelenni az interakciók, a térkép és a különböző események.
      </p>
      <p className="text-md text-muted-foreground mb-6">
        Válaszd ki a szerepköröd az oldalsávon, és kezdődjön a kaland!
      </p>
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
        />
      </div>

      {selectedBuilding && (
        <Dialog open={!!selectedBuilding} onOpenChange={() => setSelectedBuilding(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Épület részletei: {selectedBuilding.id}</DialogTitle>
              <DialogDescription>
                Ez egy {selectedBuilding.width}x{selectedBuilding.height} méretű {selectedBuilding.type === "house" ? "ház" : selectedBuilding.type === "office" ? "iroda" : selectedBuilding.type === "forestry" ? "erdészház" : "farm"}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p>Tulajdonos: <span className="font-semibold">{selectedBuilding.ownerId ? (players.find(p => p.id === selectedBuilding.ownerId)?.name || "Ismeretlen") : "Nincs"}</span></p>

              {selectedBuilding.type === "house" && selectedBuilding.rentalPrice !== undefined && (
                <p>Bérleti díj: <span className="font-semibold">{selectedBuilding.rentalPrice} pénz/perc</span></p>
              )}
              {(selectedBuilding.type === "office" || selectedBuilding.type === "forestry" || selectedBuilding.type === "farm") && selectedBuilding.salary !== undefined && (
                <p>Fizetés: <span className="font-semibold">{selectedBuilding.salary} pénz/perc</span></p>
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
    </div>
  );

  return <MainLayout sidebarContent={sidebarContent} mainContent={mainContent} />;
};

export default Game;