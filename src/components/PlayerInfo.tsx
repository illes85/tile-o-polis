"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Wheat, Droplet, Shirt, User, Leaf, Square as BrickIcon, Briefcase, Gem, Pickaxe, Drill } from "lucide-react";
import { BuildingData } from "@/components/Map";
import { Progress } from "@/components/ui/progress";
import { ProductType } from "@/utils/products";

interface PlayerInfoProps {
  playerName: string;
  money: number;
  inventory: Record<string, number>;
  workplace: string;
  workplaceSalary: number;
  ownedBusinesses: BuildingData[];
  playerSettingsButton: React.ReactNode;
  nextTickProgress: number;
  timeRemaining: number;
  isMayor?: boolean;
  buildings: BuildingData[];
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({
  playerName,
  money,
  inventory,
  workplace,
  workplaceSalary,
  ownedBusinesses,
  playerSettingsButton,
  nextTickProgress,
  timeRemaining,
  isMayor,
  buildings
}) => {
  const workplaceBuilding = buildings.find(b => b.name === workplace);
  const workplaceText = workplaceBuilding ? `${workplace} (#${workplaceBuilding.houseNumber})` : workplace;

  const inventoryItems = Object.entries(inventory)
    .filter(([, quantity]) => quantity > 0)
    .map(([type, quantity]) => ({ type, quantity }));

  const resourceIcons: Record<string, React.ReactNode> = {
    [ProductType.Wheat]: <span className="mr-1.5 h-3 w-3 text-amber-600 flex items-center justify-center">🌾</span>,
    [ProductType.Corn]: <span className="mr-1.5 h-3 w-3 text-yellow-500 flex items-center justify-center">🌽</span>,
    [ProductType.Flour]: <span className="mr-1.5 h-3 w-3 text-yellow-400 flex items-center justify-center">🍚</span>,
    [ProductType.CornFlour]: <span className="mr-1.5 h-3 w-3 text-yellow-600 flex items-center justify-center">🥣</span>,
    [ProductType.Popcorn]: <span className="mr-1.5 h-3 w-3 text-red-500 flex items-center justify-center">🍿</span>,
    [ProductType.Water]: <Droplet className="mr-1.5 h-3 w-3 text-blue-500" />,
    [ProductType.Wood]: <span className="mr-1.5 h-3 w-3 text-yellow-700 flex items-center justify-center">🌳</span>,
    [ProductType.Stone]: <Gem className="mr-1.5 h-3 w-3 text-gray-500" />,
    [ProductType.Pickaxe]: <Pickaxe className="mr-1.5 h-3 w-3 text-gray-400" />,
    [ProductType.Brick]: <span className="mr-1.5 h-3 w-3 text-orange-500 flex items-center justify-center">🧱</span>,
    [ProductType.Axe]: <span className="mr-1.5 h-3 w-3 text-amber-700 flex items-center justify-center">🪓</span>,
    [ProductType.WheatSeed]: <span className="mr-1.5 h-3 w-3 text-green-600 flex items-center justify-center">🌱</span>,
    [ProductType.CornSeed]: <span className="mr-1.5 h-3 w-3 text-yellow-300 flex items-center justify-center">🌱</span>,
    [ProductType.Clothes]: <span className="mr-1.5 h-3 w-3 text-pink-400 flex items-center justify-center">👚</span>,
    "hoe": <Pickaxe className="mr-1.5 h-3 w-3 text-amber-700" />,
  };
  
  const resourceNames: Record<string, string> = {
    [ProductType.Wheat]: "Búza",
    [ProductType.Corn]: "Kukorica",
    [ProductType.Flour]: "Liszt",
    [ProductType.CornFlour]: "Kukoricaliszt",
    [ProductType.Popcorn]: "Popcorn",
    [ProductType.Water]: "Víz",
    [ProductType.Wood]: "Fa",
    [ProductType.Stone]: "Kő",
    [ProductType.Pickaxe]: "Csákány",
    [ProductType.Brick]: "Tégla",
    [ProductType.Axe]: "Fejsze",
    [ProductType.WheatSeed]: "Búza vetőmag",
    [ProductType.CornSeed]: "Kukorica vetőmag",
    [ProductType.Clothes]: "Ruha",
    "hoe": "Kapa",
  };

  return (
    <Card className="w-full bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Játékos adatok</CardTitle>
        {playerSettingsButton}
      </CardHeader>
      <CardContent className="text-sm">
        <div className="flex items-center mb-2">
          <User className="mr-2 h-4 w-4 text-gray-500" />
          <span>Név: {playerName}</span>
          {isMayor && <span className="ml-2 bg-yellow-500 text-black text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold">Polgármester</span>}
        </div>
        <div className="flex items-center mb-2 font-bold text-lg">
          <Coins className="mr-2 h-5 w-5 text-green-500" />
          <span>Pénz: {money}</span>
        </div>
        <div className="flex items-center mb-2">
          <Briefcase className="mr-2 h-4 w-4 text-gray-500" />
          <span>Munkahely: {workplaceText}</span>
        </div>
        
        {/* Fizetési ciklus folyamatjelzője */}
        <div className="mt-3 mb-4 p-2 bg-black/5 rounded-md border border-sidebar-border/50">
          <div className="flex justify-between text-[0.7rem] mb-1 font-medium">
            <span className="flex items-center">
              <Coins className="h-3 w-3 mr-1 text-yellow-600" />
              Gazdasági ciklus
            </span>
            <span>{timeRemaining}mp</span>
          </div>
          <Progress value={nextTickProgress} className="h-1.5" />
          <p className="text-[0.6rem] text-muted-foreground mt-1 text-center">
            Fizetések és bérleti díjak rendezése
          </p>
        </div>
        
        <div className="mb-2">
          <h3 className="font-medium mb-1">Készlet:</h3>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1 ml-1">
            {inventoryItems.map(({ type, quantity }) => (
              <li key={type} className="flex items-center text-[0.75rem]">
                {resourceIcons[type] || <span className="mr-1.5 h-3 w-3" />}
                {resourceNames[type] || type}: {quantity}
              </li>
            ))}
          </ul>
        </div>
        
        {ownedBusinesses.length > 0 && (
          <div className="mt-3 pt-2 border-t border-sidebar-border/30">
            <h3 className="font-medium mb-1 flex items-center">
              <Briefcase className="mr-2 h-3 w-3" />
              Vállalkozásaid:
            </h3>
            <ul className="ml-4 list-disc list-inside text-[0.75rem]">
              {ownedBusinesses.map(business => (
                <li key={business.id} className="truncate">
                  {business.name} (#{business.houseNumber})
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
