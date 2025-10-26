"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PlayerInfo from "@/components/PlayerInfo";
import RoleSelector from "@/components/RoleSelector";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Map, { BuildingData } from "@/components/Map"; // Import Map and BuildingData

const MAP_GRID_SIZE = 20; // 20x20-as rács
const CELL_SIZE_PX = 40; // Minden cella 40x40 pixel

const Game = () => {
  const [playerMoney, setPlayerMoney] = useState(1000);
  const [playerInventory, setPlayerInventory] = useState({
    potato: 3,
    water: 2,
    clothes: 1,
  });
  const [playerRole, setPlayerRole] = useState("Munkanélküli");
  const [buildings, setBuildings] = useState<BuildingData[]>([]);

  useEffect(() => {
    // Helyezzünk el egy 2x2-es házat véletlenszerűen
    const houseWidth = 2;
    const houseHeight = 2;

    const randomX = Math.floor(Math.random() * (MAP_GRID_SIZE - houseWidth));
    const randomY = Math.floor(Math.random() * (MAP_GRID_SIZE - houseHeight));

    const newHouse: BuildingData = {
      id: "house-1",
      x: randomX,
      y: randomY,
      width: houseWidth,
      height: houseHeight,
      type: "house",
    };
    setBuildings([newHouse]);
  }, []); // Csak egyszer fusson le a komponens betöltésekor

  const handleRoleChange = (newRole: string) => {
    setPlayerRole(newRole);
    console.log(`Szerepkör megváltoztatva: ${newRole}`);
  };

  const sidebarContent = (
    <>
      <h2 className="text-2xl font-bold mb-6 text-sidebar-primary-foreground">Város Szimulátor</h2>
      <PlayerInfo money={playerMoney} inventory={playerInventory} role={playerRole} />
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
        <Map buildings={buildings} gridSize={MAP_GRID_SIZE} cellSizePx={CELL_SIZE_PX} />
      </div>
    </div>
  );

  return <MainLayout sidebarContent={sidebarContent} mainContent={mainContent} />;
};

export default Game;