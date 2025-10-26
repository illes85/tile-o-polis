"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PlayerInfo from "@/components/PlayerInfo";
// import RoleSelector from "@/components/RoleSelector"; // Eltávolítva
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
import { musicTracks } from "@/utils/musicFiles";
import PlayerSettings from "@/components/PlayerSettings";

const MAP_GRID_SIZE = 20;
const CELL_SIZE_PX = 40;
const RENT_INTERVAL_MS = 30000; // 30 másodperc = 1 játékperc
const BUILD_HOUSE_COST = 500;
const BUILD_HOUSE_DURATION_MS = 10000;
const BUILD_OFFICE_COST = 1000;
const BUILD_OFFICE_DURATION_MS = 15000;
const OFFICE_SALARY_PER_INTERVAL = 10;
const OFFICE_MAX_EMPLOYEES = 4;

interface Player {
  id: string;
  name: string;
  money: number;
  inventory: {
    potato: number;
    water: number;
    clothes: number;
  };
  workplace: string; // Módosítva: role helyett workplace
}

const availableBuildingOptions: BuildingOption[] = [
  {
    type: "house",
    name: "Házikó",
    cost: BUILD_HOUSE_COST,
    duration: BUILD_HOUSE_DURATION_MS,
    width: 2,
    height: 2,
    rentalPrice: 10,
    capacity: 2, // Max lakók
  },
  {
    type: "office",
    name: "Közszolgálati Iroda",
    cost: BUILD_OFFICE_COST,
    duration: BUILD_OFFICE_DURATION_MS,
    width: 3,
    height: 8,
    salary: OFFICE_SALARY_PER_INTERVAL,
    capacity: OFFICE_MAX_EMPLOYEES, // Max dolgozók
  },
];

const Game = () => {
  const [players, setPlayers] = useState<Player[]>([
    { id: "player-1", name: "Játékos 1", money: 1000, inventory: { potato: 3, water: 2, clothes: 1 }, workplace: "Munkanélküli" }, // Frissítve
    { id: "player-2", name: "Játékos 2", money: 750, inventory: { potato: 1, water: 1, clothes: 0 }, workplace: "Munkanélküli" }, // Frissítve
  ]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>(players[0].id);
  const currentPlayer = players.find(p => p.id === currentPlayerId)!;

  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [isBuildingInProgress, setIsBuildingInProgress] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);

  const [isPlacingBuilding, setIsPlacingBuilding] = useState(false);
  const [buildingToPlace, setBuildingToPlace] = useState<BuildingOption | null>(null);
  const [ghostBuildingCoords, setGhostBuildingCoords] = useState<{ x: number; y: number } | null>(null);

  const getOccupiedCells = (currentBuildings: BuildingData[]) => {
    const occupied = new Set<string>();
    currentBuildings.forEach(b => {
      if (!b.isUnderConstruction && !b.isGhost) {
        for (let x = b.x; x < b.x + b.width; x++) {
          for (let y = b.y; y < b.y + b.height; y++) {
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
    currentBuildings: BuildingData[]
  ): boolean => {
    if (
      targetX < 0 ||
      targetY < 0 ||
      targetX + buildingWidth > MAP_GRID_SIZE ||
      targetY + buildingHeight > MAP_GRID_SIZE * 1.5
    ) {
      return false;
    }

    const occupiedCells = getOccupiedCells(currentBuildings);

    for (let x = targetX; x < targetX + buildingWidth; x++) {
      for (let y = targetY; y < targetY + buildingHeight; y++) {
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
      buildingType: "house" | "office",
      buildingWidth: number,
      buildingHeight: number,
      rentalPrice?: number,
      salary?: number,
      capacity: number = 0,
      ownerId?: string,
      maxAttempts = 200
    ): BuildingData | null => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const randomX = Math.floor(Math.random() * (MAP_GRID_SIZE - buildingWidth + 1));
        const randomY = Math.floor(Math.random() * (MAP_GRID_SIZE * 1.5 - buildingHeight + 1));

        let overlaps = false;
        for (let x = randomX; x < randomX + buildingWidth; x++) {
          for (let y = randomY; y < randomY + buildingHeight; y++) {
            if (tempOccupiedCells.has(`${x},${y}`)) {
              overlaps = true;
              break;
            }
          }
          if (overlaps) break;
        }

        if (!overlaps) {
          for (let x = randomX; x < randomX + buildingWidth; x++) {
            for (let y = randomY; y < randomY + buildingHeight; y++) {
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
            occupancy: 0,
            ownerId: ownerId,
            renterId: undefined,
            employeeIds: [],
            isUnderConstruction: false,
            buildProgress: 100,
          };
        }
      }
      console.warn(`Nem sikerült elhelyezni az épületet ${buildingId} ${maxAttempts} próbálkozás után.`);
      return null;
    };

    for (let i = 0; i < 4; i++) {
      const house = placeInitialBuilding(`house-${i + 1}`, "house", 2, 2, 10, undefined, 2, undefined);
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

        const playerRentedBuildings = buildings.filter(b => b.renterId === player.id);
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
                b.renterId === player.id
                  ? { ...b, renterId: undefined, occupancy: b.occupancy - 1 }
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

  // handleRoleChange függvény eltávolítva

  const handleBuildingClick = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    setSelectedBuilding(building || null);
  };

  const handleRentBuilding = () => {
    if (!selectedBuilding || selectedBuilding.type !== "house" || selectedBuilding.rentalPrice === undefined) {
      return;
    }

    if (selectedBuilding.ownerId === currentPlayerId) {
      showError("Nem bérelheted ki a saját házadat!");
      return;
    }
    if (selectedBuilding.renterId === currentPlayerId) {
      showError("Ezt a házat már kibérelted!");
      return;
    }
    if (selectedBuilding.occupancy >= selectedBuilding.capacity) {
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
          ? { ...b, renterId: currentPlayerId, occupancy: b.occupancy + 1 }
          : b
      )
    );
    showSuccess(`Sikeresen kibérelted a ${selectedBuilding.id} házat ${selectedBuilding.rentalPrice} pénz/perc áron!`);
    setSelectedBuilding(null);
  };

  const handleJoinOffice = () => {
    if (!selectedBuilding || selectedBuilding.type !== "office" || selectedBuilding.salary === undefined) {
      return;
    }

    if (selectedBuilding.employeeIds.includes(currentPlayerId)) {
      showError("Már dolgozol ebben az irodában!");
      return;
    }
    if (selectedBuilding.occupancy >= selectedBuilding.capacity) {
      showError("Ez az iroda már tele van!");
      return;
    }

    setBuildings(prevBuildings =>
      prevBuildings.map(b =>
        b.id === selectedBuilding.id
          ? { ...b, employeeIds: [...b.employeeIds, currentPlayerId], occupancy: b.occupancy + 1 }
          : b
      )
    );
    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === currentPlayerId ? { ...p, workplace: selectedBuilding.name } : p // Frissítve
      )
    );
    showSuccess(`Sikeresen beléptél alkalmazottként a ${selectedBuilding.id} irodába! Fizetés: ${selectedBuilding.salary} pénz/perc.`);
    setSelectedBuilding(null);
  };

  const handleBuildBuilding = (buildingType: "house" | "office") => {
    const buildingOption = availableBuildingOptions.find(opt => opt.type === buildingType);

    if (!buildingOption) {
      showError("Ismeretlen épület típus!");
      return;
    }

    if (currentPlayer.money < buildingOption.cost) {
      showError(`Nincs elég pénzed ${buildingOption.name} építéséhez! Szükséges: ${buildingOption.cost} pénz.`);
      return;
    }

    setIsBuildMenuOpen(false);
    setBuildingToPlace(buildingOption);
    setIsPlacingBuilding(true);
    showSuccess(`Kattints a térképre, ahova a ${buildingOption.name} épületet szeretnéd helyezni.`);
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
      if (canPlaceBuilding(x, y, buildingToPlace.width, buildingToPlace.height, buildings)) {
        setIsPlacingBuilding(false);
        setBuildingToPlace(null);
        setGhostBuildingCoords(null);

        setPlayers(prevPlayers =>
          prevPlayers.map(p =>
            p.id === currentPlayerId ? { ...p, money: p.money - buildingToPlace.cost } : p
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
          occupancy: 0,
          ownerId: currentPlayerId,
          renterId: undefined,
          employeeIds: [],
          isUnderConstruction: true,
          buildProgress: 0,
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

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-sidebar-primary-foreground">Város Szimulátor</h2>
        <PlayerSettings playerName={currentPlayer.name} onPlayerNameChange={updatePlayerName} />
      </div>

      <div className="mb-4">
        <Label htmlFor="player-switcher" className="text-sidebar-foreground mb-2 block">Játékos váltása:</Label>
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
      </div>

      <PlayerInfo
        playerName={currentPlayer.name}
        money={currentPlayer.money}
        inventory={currentPlayer.inventory}
        workplace={currentPlayer.workplace} // Módosítva: role helyett workplace
        onPlayerNameChange={updatePlayerName}
      />
      {/* RoleSelector eltávolítva */}
      <div className="mt-4">
        <Button
          onClick={() => setIsBuildMenuOpen(true)}
          disabled={isBuildingInProgress || isPlacingBuilding}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Építés
        </Button>
        {isPlacingBuilding && (
          <Button
            onClick={cancelBuildingPlacement}
            className="w-full bg-red-600 hover:bg-red-700 text-white mt-2"
          >
            Építés megszakítása
          </Button>
        )}
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
        Válaszd ki a szerepkört az oldalsávon, és kezdődjön a kaland!
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
        />
      </div>

      {selectedBuilding && (
        <Dialog open={!!selectedBuilding} onOpenChange={() => setSelectedBuilding(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Épület részletei: {selectedBuilding.id}</DialogTitle>
              <DialogDescription>
                Ez egy {selectedBuilding.width}x{selectedBuilding.height} méretű {selectedBuilding.type === "house" ? "ház" : "iroda"}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedBuilding.type === "house" && selectedBuilding.rentalPrice !== undefined && (
                <p>Bérleti díj: <span className="font-semibold">{selectedBuilding.rentalPrice} pénz/perc</span></p>
              )}
              {selectedBuilding.type === "office" && selectedBuilding.salary !== undefined && (
                <p>Fizetés: <span className="font-semibold">{selectedBuilding.salary} pénz/perc</span></p>
              )}
              <p>{selectedBuilding.type === "house" ? "Lakók" : "Dolgozók"}: <span className="font-semibold">{selectedBuilding.occupancy}/{selectedBuilding.capacity}</span></p>
              {selectedBuilding.renterId === currentPlayerId && (
                <p className="text-blue-600 font-medium">Ezt a házat már kibérelted!</p>
              )}
              {selectedBuilding.ownerId === currentPlayerId && (
                <p className="text-yellow-600 font-medium">Ez az épület a te tulajdonod!</p>
              )}
              {selectedBuilding.employeeIds.includes(currentPlayerId) && (
                <p className="text-green-600 font-medium">Itt dolgozol!</p>
              )}
              {selectedBuilding.occupancy >= selectedBuilding.capacity && selectedBuilding.renterId !== currentPlayerId && !selectedBuilding.employeeIds.includes(currentPlayerId) && (
                <p className="text-red-600 font-medium">Ez az épület tele van!</p>
              )}
            </div>
            <DialogFooter>
              {selectedBuilding.type === "house" && (
                <Button
                  onClick={handleRentBuilding}
                  disabled={selectedBuilding.renterId === currentPlayerId || selectedBuilding.occupancy >= selectedBuilding.capacity || selectedBuilding.ownerId === currentPlayerId}
                >
                  Kibérlem
                </Button>
              )}
              {selectedBuilding.type === "office" && (
                <Button
                  onClick={handleJoinOffice}
                  disabled={selectedBuilding.employeeIds.includes(currentPlayerId) || selectedBuilding.occupancy >= selectedBuilding.capacity}
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
        isBuildingInProgress={isBuildingInProgress || isPlacingBuilding}
      />
    </div>
  );

  return <MainLayout sidebarContent={sidebarContent} mainContent={mainContent} />;
};

export default Game;