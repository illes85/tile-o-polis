"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PlayerInfo from "@/components/PlayerInfo";
import RoleSelector from "@/components/RoleSelector";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Map, { BuildingData } from "@/components/Map"; // Import BuildingData
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import BuildMenu, { BuildingOption } from "@/components/BuildMenu";
import MusicPlayer from "@/components/MusicPlayer";
import { musicTracks } from "@/utils/musicFiles";

const MAP_GRID_SIZE = 20;
const CELL_SIZE_PX = 40;
const RENT_INTERVAL_MS = 30000; // 30 másodperc = 1 játékperc
const BUILD_HOUSE_COST = 500;
const BUILD_HOUSE_DURATION_MS = 10000;
const BUILD_OFFICE_COST = 1000;
const BUILD_OFFICE_DURATION_MS = 15000;
const OFFICE_SALARY_PER_INTERVAL = 10;
const OFFICE_MAX_EMPLOYEES = 4;

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
  const [playerName, setPlayerName] = useState("Játékos");
  const [playerMoney, setPlayerMoney] = useState(1000);
  const [playerInventory, setPlayerInventory] = useState({
    potato: 3,
    water: 2,
    clothes: 1,
  });
  const [playerRole, setPlayerRole] = useState("Munkanélküli");
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [isBuildingInProgress, setIsBuildingInProgress] = useState(false); // Ez most a globális állapotot jelzi, hogy folyik-e bármilyen építés
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);

  // Új állapotok az interaktív építéshez
  const [isPlacingBuilding, setIsPlacingBuilding] = useState(false);
  const [buildingToPlace, setBuildingToPlace] = useState<BuildingOption | null>(null);
  const [ghostBuildingCoords, setGhostBuildingCoords] = useState<{ x: number; y: number } | null>(null);

  // Segédfüggvény a foglalt cellák meghatározásához
  const getOccupiedCells = (currentBuildings: BuildingData[]) => {
    const occupied = new Set<string>();
    currentBuildings.forEach(b => {
      // Csak a már felépült és nem szellem épületeket vesszük figyelembe
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

  // Ellenőrzi, hogy egy épület elhelyezhető-e egy adott helyen
  const canPlaceBuilding = (
    targetX: number,
    targetY: number,
    buildingWidth: number,
    buildingHeight: number,
    currentBuildings: BuildingData[]
  ): boolean => {
    // Ellenőrizzük, hogy a célkoordináták a térképen belül vannak-e
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
          return false; // Ütközés van
        }
      }
    }
    return true; // Nincs ütközés, elhelyezhető
  };

  // Kezdeti épületek elhelyezése
  useEffect(() => {
    const initialBuildings: BuildingData[] = [];
    const tempOccupiedCells = new Set<string>(); // Ideiglenes halmaz az inicializáláshoz

    const placeInitialBuilding = (
      buildingId: string,
      buildingType: "house" | "office",
      buildingWidth: number,
      buildingHeight: number,
      rentalPrice?: number,
      salary?: number,
      capacity: number = 0,
      isOwned: boolean = false,
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
            isRentedByPlayer: false,
            isOwnedByPlayer: isOwned,
            isUnderConstruction: false,
            buildProgress: 100,
            isPlayerEmployedHere: false,
          };
        }
      }
      console.warn(`Nem sikerült elhelyezni az épületet ${buildingId} ${maxAttempts} próbálkozás után.`);
      return null;
    };

    // Helyezzünk el 4 házat
    for (let i = 0; i < 4; i++) {
      const house = placeInitialBuilding(`house-${i + 1}`, "house", 2, 2, 10, undefined, 2, false);
      if (house) {
        initialBuildings.push(house);
      }
    }
    setBuildings(initialBuildings);
  }, []);

  // Bérleti díj levonása és fizetés időzítővel
  useEffect(() => {
    const gameTickTimer = setInterval(() => {
      setPlayerMoney((prevMoney) => {
        let newMoney = prevMoney;
        let totalRent = 0;
        let totalSalary = 0;

        // Bérleti díjak levonása
        const rentedByPlayer = buildings.filter(b => b.isRentedByPlayer);
        rentedByPlayer.forEach(building => {
          if (building.rentalPrice) {
            totalRent += building.rentalPrice;
          }
        });

        if (totalRent > 0) {
          if (newMoney >= totalRent) {
            newMoney -= totalRent;
            showSuccess(`Levonva ${totalRent} pénz bérleti díjként.`);
          } else {
            showError(`Nincs elég pénz a bérleti díjra (${totalRent} pénz). A bérelt házak kiürültek.`);
            setBuildings(prevBuildings =>
              prevBuildings.map(b =>
                b.isRentedByPlayer
                  ? { ...b, isRentedByPlayer: false, occupancy: 0 }
                  : b
              )
            );
          }
        }

        // Fizetések kifizetése
        const employedByPlayer = buildings.filter(b => b.isPlayerEmployedHere);
        employedByPlayer.forEach(building => {
          if (building.salary) {
            totalSalary += building.salary;
          }
        });

        if (totalSalary > 0) {
          newMoney += totalSalary;
          showSuccess(`Jóváírva ${totalSalary} pénz fizetésként.`);
        }

        return newMoney;
      });
    }, RENT_INTERVAL_MS);

    return () => clearInterval(gameTickTimer);
  }, [buildings]); // Függőségként a buildings, hogy frissüljön, ha változik a bérelt/foglalkoztatott házak/irodák listája

  const handleRoleChange = (newRole: string) => {
    setPlayerRole(newRole);
    console.log(`Szerepkör megváltoztatva: ${newRole}`);
  };

  const handlePlayerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(event.target.value);
  };

  const handleBuildingClick = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    setSelectedBuilding(building || null);
  };

  const handleRentBuilding = () => {
    if (!selectedBuilding || selectedBuilding.type !== "house" || selectedBuilding.rentalPrice === undefined) {
      return;
    }

    if (selectedBuilding.isOwnedByPlayer) {
      showError("Nem bérelheted ki a saját házadat!");
      return;
    }
    if (selectedBuilding.isRentedByPlayer) {
      showError("Ezt a házat már kibérelted!");
      return;
    }
    if (selectedBuilding.occupancy >= selectedBuilding.capacity) {
      showError("Ez a ház már tele van!");
      return;
    }
    if (playerMoney < selectedBuilding.rentalPrice) {
      showError("Nincs elég pénzed a bérléshez!");
      return;
    }

    setPlayerMoney(prevMoney => prevMoney - selectedBuilding.rentalPrice!);
    setBuildings(prevBuildings =>
      prevBuildings.map(b =>
        b.id === selectedBuilding.id
          ? { ...b, isRentedByPlayer: true, occupancy: b.occupancy + 1 }
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

    if (selectedBuilding.isPlayerEmployedHere) {
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
          ? { ...b, isPlayerEmployedHere: true, occupancy: b.occupancy + 1 }
          : b
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

    if (playerMoney < buildingOption.cost) {
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

        setPlayerMoney(prevMoney => prevMoney - buildingToPlace.cost);
        setIsBuildingInProgress(true); // Globális építési állapot beállítása

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
          isRentedByPlayer: false,
          isOwnedByPlayer: true,
          isUnderConstruction: true, // Építés alatt áll
          buildProgress: 0,
          isPlayerEmployedHere: false,
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
          setIsBuildingInProgress(false); // Globális építési állapot visszaállítása

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
      <h2 className="text-2xl font-bold mb-6 text-sidebar-primary-foreground">Város Szimulátor</h2>
      <div className="mb-4">
        <Label htmlFor="playerName" className="text-sidebar-foreground mb-2 block">Játékos neve:</Label>
        <Input
          id="playerName"
          value={playerName}
          onChange={handlePlayerNameChange}
          placeholder="Add meg a neved"
          className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border"
        />
      </div>
      <PlayerInfo playerName={playerName} money={playerMoney} inventory={playerInventory} role={playerRole} />
      <RoleSelector currentRole={playerRole} onRoleChange={handleRoleChange} />
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
              {selectedBuilding.isRentedByPlayer && (
                <p className="text-blue-600 font-medium">Ezt a házat már kibérelted!</p>
              )}
              {selectedBuilding.isOwnedByPlayer && (
                <p className="text-yellow-600 font-medium">Ez az épület a te tulajdonod!</p>
              )}
              {selectedBuilding.isPlayerEmployedHere && (
                <p className="text-green-600 font-medium">Itt dolgozol!</p>
              )}
              {selectedBuilding.occupancy >= selectedBuilding.capacity && !selectedBuilding.isRentedByPlayer && !selectedBuilding.isPlayerEmployedHere && (
                <p className="text-red-600 font-medium">Ez az épület tele van!</p>
              )}
            </div>
            <DialogFooter>
              {selectedBuilding.type === "house" && (
                <Button
                  onClick={handleRentBuilding}
                  disabled={selectedBuilding.isRentedByPlayer || selectedBuilding.occupancy >= selectedBuilding.capacity || selectedBuilding.isOwnedByPlayer}
                >
                  Kibérlem
                </Button>
              )}
              {selectedBuilding.type === "office" && (
                <Button
                  onClick={handleJoinOffice}
                  disabled={selectedBuilding.isPlayerEmployedHere || selectedBuilding.occupancy >= selectedBuilding.capacity}
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
        playerMoney={playerMoney}
        isBuildingInProgress={isBuildingInProgress || isPlacingBuilding}
      />
    </div>
  );

  return <MainLayout sidebarContent={sidebarContent} mainContent={mainContent} />;
};

export default Game;