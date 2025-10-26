"use client";

import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PlayerInfo from "@/components/PlayerInfo";
import RoleSelector from "@/components/RoleSelector";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Game = () => {
  const [playerMoney, setPlayerMoney] = useState(1000);
  const [playerInventory, setPlayerInventory] = useState({
    potato: 3,
    water: 2,
    clothes: 1,
  });
  const [playerRole, setPlayerRole] = useState("Munkanélküli");

  const handleRoleChange = (newRole: string) => {
    setPlayerRole(newRole);
    // Here you would add logic to update player stats/abilities based on the new role
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
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold mb-6 text-primary">Üdv a játékban!</h1>
      <p className="text-lg text-muted-foreground mb-4">
        Ez a játék világa. Itt fognak megjelenni az interakciók, a térkép és a különböző események.
      </p>
      <p className="text-md text-muted-foreground">
        Válaszd ki a szerepkört az oldalsávon, és kezdődjön a kaland!
      </p>
      {/* Placeholder for the actual game world/map */}
      <div className="flex-grow bg-gray-100 dark:bg-gray-800 rounded-lg mt-6 p-4 flex items-center justify-center text-gray-400 dark:text-gray-600">
        <p>A játék világa itt fog megjelenni...</p>
      </div>
    </div>
  );

  return <MainLayout sidebarContent={sidebarContent} mainContent={mainContent} />;
};

export default Game;