"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PlayerInfo from "@/components/PlayerInfo";
import RoleSelector from "@/components/RoleSelector";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Map, { BuildingData } from "@/components/Map";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input for player name
import { Label } from "@/components/ui/label"; // Import Label for player name
import { showSuccess, showError } from "@/utils/toast"; // Import toast utilities

const MAP_GRID_SIZE = 20; // 20x20-as rács
const CELL_SIZE_PX = 40; // Minden cella 40x40 pixel
const RENT_INTERVAL_MS = 30000; // 30 másodperc = 1 játékperc (korábban 5000 ms volt)

const Game = () => {
  const [playerName, setPlayerName] = useState("Játékos"); // Új állapot a játékos nevének
  const [playerMoney, setPlayerMoney] = useState(1000);
  const [playerInventory, setPlayerInventory] = useState({
    potato: 3,
    water: 2,
    clothes: 1,
  });
  const [playerRole, setPlayerRole] = useState("Munkanélküli");
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);

  useEffect(() => {
    const newBuildings: BuildingData[] = [];
    const occupiedCells = new Set<string>();

    const isCellOccupied = (x: number, y: number) => occupiedCells.has(`${x},${y}`);

    const tryPlaceBuilding = (
      buildingId: string,
      buildingType: "house",
      buildingWidth: number,
      buildingHeight: number,
      price: number,
      maxResidents: number,
      maxAttempts = 200
    ): BuildingData | null => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const randomX = Math.floor(Math.random() * (MAP_GRID_SIZE - buildingWidth + 1));
        const randomY = Math.floor(Math.random() * (MAP_GRID_SIZE - buildingHeight + 1));

        let overlaps = false;
        for (let x = randomX; x < randomX + buildingWidth; x++) {
          for (let y = randomY; y < randomY + buildingHeight; y++) {
            if (isCellOccupied(x, y)) {
              overlaps = true;
              break;
            }
          }
          if (overlaps) break;
        }

        if (!overlaps) {
          for (let x = randomX; x < randomX + buildingWidth; x++) {
            for (let y = randomY; y < randomY + buildingHeight; y++) {
              occupiedCells.add(`${x},${y}`);
            }
          }
          return {
            id: buildingId,
            x: randomX,
            y: randomY,
            width: buildingWidth,
            height: buildingHeight,
            type: buildingType,
            rentalPrice: price,
            maxResidents: maxResidents,
            currentResidents: 0,
            isRentedByPlayer: false,
          };
        }
      }
      console.warn(`Nem sikerült elhelyezni az épületet ${buildingId} ${maxAttempts} próbálkozás után.`);
      return null;
    };

    // Helyezzünk el 4 házat
    for (let i = 0; i < 4; i++) {
      const house = tryPlaceBuilding(`house-${i + 1}`, "house", 2, 2, 10, 2); // 2 lakóhely
      if (house) {
        newBuildings.push(house);
      }
    }
    setBuildings(newBuildings);
  }, []);

  // Bérleti díj levonása időzítővel
  useEffect(() => {
    const rentTimer = setInterval(() => {
      setPlayerMoney((prevMoney) => {
        let totalRent = 0;
        const rentedByPlayer = buildings.filter(b => b.isRentedByPlayer);
        rentedByPlayer.forEach(building => {
          if (building.rentalPrice) {
            totalRent += building.rentalPrice;
          }
        });

        if (totalRent > 0) {
          if (prevMoney >= totalRent) {
            showSuccess(`Levonva ${totalRent} pénz bérleti díjként.`);
            return prevMoney - totalRent;
          } else {
            showError(`Nincs elég pénz a bérleti díjra (${totalRent} pénz). A bérelt házak kiürültek.`);
            // Ha nincs elég pénz, "kiürítjük" a bérelt házakat
            setBuildings(prevBuildings =>
              prevBuildings.map(b =>
                b.isRentedByPlayer
                  ? { ...b, isRentedByPlayer: false, currentResidents: 0 }
                  : b
              )
            );
            return prevMoney; // A pénz nem megy mínuszba
          }
        }
        return prevMoney;
      });
    }, RENT_INTERVAL_MS);

    return () => clearInterval(rentTimer); // Tisztítás
  }, [buildings]); // Függőségként a buildings, hogy frissüljön, ha változik a bérelt házak listája

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
    if (selectedBuilding && selectedBuilding.rentalPrice !== undefined) {
      if (selectedBuilding.isRentedByPlayer) {
        showError("Ezt a házat már kibérelted!");
        return;
      }
      if (selectedBuilding.currentResidents >= selectedBuilding.maxResidents) {
        showError("Ez a ház már tele van!");
        return;
      }
      if (playerMoney >= selectedBuilding.rentalPrice) {
        setPlayerMoney(prevMoney => prevMoney - selectedBuilding.rentalPrice!);
        setBuildings(prevBuildings =>
          prevBuildings.map(b =>
            b.id === selectedBuilding.id
              ? { ...b, isRentedByPlayer: true, currentResidents: b.currentResidents + 1 }
              : b
          )
        );
        showSuccess(`Sikeresen kibérelted a ${selectedBuilding.id} házat ${selectedBuilding.rentalPrice} pénz/perc áron!`);
        setSelectedBuilding(null);
      } else {
        showError("Nincs elég pénzed a bérléshez!");
      }
    }
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
        <Map buildings={buildings} gridSize={MAP_GRID_SIZE} cellSizePx={CELL_SIZE_PX} onBuildingClick={handleBuildingClick} />
      </div>

      {selectedBuilding && (
        <Dialog open={!!selectedBuilding} onOpenChange={() => setSelectedBuilding(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Épület részletei: {selectedBuilding.id}</DialogTitle>
              <DialogDescription>
                Ez egy {selectedBuilding.width}x{selectedBuilding.height} méretű ház.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p>Bérleti díj: <span className="font-semibold">{selectedBuilding.rentalPrice} pénz/perc</span></p>
              <p>Lakók: <span className="font-semibold">{selectedBuilding.currentResidents}/{selectedBuilding.maxResidents}</span></p>
              {selectedBuilding.isRentedByPlayer && (
                <p className="text-blue-600 font-medium">Ezt a házat már kibérelted!</p>
              )}
              {selectedBuilding.currentResidents >= selectedBuilding.maxResidents && !selectedBuilding.isRentedByPlayer && (
                <p className="text-red-600 font-medium">Ez a ház tele van!</p>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleRentBuilding}
                disabled={selectedBuilding.isRentedByPlayer || selectedBuilding.currentResidents >= selectedBuilding.maxResidents}
              >
                Kibérlem
              </Button>
              <Button variant="outline" onClick={() => setSelectedBuilding(null)}>Mégsem</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  return <MainLayout sidebarContent={sidebarContent} mainContent={mainContent} />;
};

export default Game;