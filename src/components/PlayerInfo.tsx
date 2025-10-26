"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Wheat, Droplet, Shirt, User, Leaf, Square as BrickIcon, Briefcase } from "lucide-react"; // DollarSign helyett Coins
import { BuildingData } from "@/components/Map"; // Importáljuk a BuildingData interfészt

interface PlayerInfoProps {
  playerName: string;
  money: number;
  inventory: {
    potato: number;
    water: number;
    clothes: number;
    wood: number;
    brick: number;
  };
  workplace: string;
  workplaceSalary: number; // Új: munkahelyi fizetés
  ownedBusinesses: BuildingData[]; // Új: tulajdonában lévő vállalkozások
  playerSettingsButton: React.ReactNode; // Új prop az avatár gombnak
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ playerName, money, inventory, workplace, workplaceSalary, ownedBusinesses, playerSettingsButton }) => {
  return (
    <Card className="w-full bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Játékos adatok</CardTitle> {/* Megtartjuk a címet, de mellé tesszük az avatárt */}
        {playerSettingsButton}
      </CardHeader>
      <CardContent className="text-sm">
        <div className="flex items-center mb-2">
          <User className="mr-2 h-4 w-4 text-gray-500" />
          <span>Név: {playerName}</span>
        </div>
        <div className="flex items-center mb-2">
          <Coins className="mr-2 h-4 w-4 text-green-500" /> {/* DollarSign helyett Coins */}
          <span>Pénz: {money}</span>
        </div>
        <div className="flex items-center mb-2">
          <Briefcase className="mr-2 h-4 w-4 text-gray-500" />
          <span>Alkalmazott: {workplace} {workplaceSalary > 0 && `(${workplaceSalary} pénz/perc)`}</span>
        </div>
        <div className="mb-2">
          <h3 className="font-medium mb-1">Készlet:</h3>
          <ul className="ml-4 list-disc list-inside">
            <li className="flex items-center">
              <Wheat className="mr-2 h-3 w-3 text-yellow-600" /> Burgonya: {inventory.potato}
            </li>
            <li className="flex items-center">
              <Droplet className="mr-2 h-3 w-3 text-blue-500" /> Víz: {inventory.water}
            </li>
            <li className="flex items-center">
              <Shirt className="mr-2 h-3 w-3 text-gray-400" /> Ruha: {inventory.clothes}
            </li>
            <li className="flex items-center">
              <Leaf className="mr-2 h-3 w-3 text-yellow-700" /> Fa: {inventory.wood}
            </li>
            <li className="flex items-center">
              <BrickIcon className="mr-2 h-3 w-3 text-orange-500" /> Tégla: {inventory.brick}
            </li>
          </ul>
        </div>
        {ownedBusinesses.length > 0 && (
          <div className="mb-2">
            <h3 className="font-medium mb-1">Vállalkozások:</h3>
            <ul className="ml-4 list-disc list-inside">
              {ownedBusinesses.map(business => (
                <li key={business.id} className="flex items-center">
                  <Briefcase className="mr-2 h-3 w-3 text-gray-500" /> {business.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerInfo;