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
  inventory: { 
    potato: number; 
    water: number; 
    clothes: number; 
    wood: number; 
    brick: number; 
    stone: number; 
    hoe: number; 
    tractor: number;
    wheat: number;
    [ProductType.WheatSeed]: number;
    flour: number;
    corn: number; // ÚJ
    corn_flour: number; // ÚJ
    popcorn: number; // ÚJ
  };
  workplace: string;
  workplaceSalary: number;
  ownedBusinesses: BuildingData[];
  playerSettingsButton: React.ReactNode;
  nextTickProgress: number;
  timeRemaining: number;
  isMayor?: boolean;
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
  isMayor
}) => {
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
        <div className="flex items-center mb-2">
          <Coins className="mr-2 h-4 w-4 text-green-500" />
          <span>Pénz: {money}</span>
        </div>
        <div className="flex items-center mb-2">
          <Briefcase className="mr-2 h-4 w-4 text-gray-500" />
          <span>Munkahely: {workplace}</span>
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
            <li className="flex items-center text-[0.75rem]">
              <span className="mr-1.5 h-3 w-3 text-amber-600 flex items-center justify-center">🌾</span>
              Búza: {inventory.wheat}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <span className="mr-1.5 h-3 w-3 text-yellow-500 flex items-center justify-center">🌽</span>
              Kukorica: {inventory.corn || 0}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <span className="mr-1.5 h-3 w-3 text-yellow-400 flex items-center justify-center">🍚</span>
              Liszt: {inventory.flour || 0}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <span className="mr-1.5 h-3 w-3 text-yellow-600 flex items-center justify-center">🥣</span>
              Kukoricaliszt: {inventory.corn_flour || 0}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <span className="mr-1.5 h-3 w-3 text-red-500 flex items-center justify-center">🍿</span>
              Popcorn: {inventory.popcorn || 0}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <Droplet className="mr-1.5 h-3 w-3 text-blue-500" />
              Víz: {inventory.water}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <span className="mr-1.5 h-3 w-3 text-yellow-700 flex items-center justify-center">🌳</span>
              Fa: {inventory.wood}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <span className="mr-1.5 h-3 w-3 text-orange-500 flex items-center justify-center">🧱</span>
              Tégla: {inventory.brick}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <Gem className="mr-1.5 h-3 w-3 text-gray-500" />
              Kő: {inventory.stone}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <Pickaxe className="mr-1.5 h-3 w-3 text-amber-700" />
              Kapa: {inventory.hoe}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <span className="mr-1.5 h-3 w-3 text-green-600 flex items-center justify-center">🌱</span>
              Búza vetőmag: {inventory[ProductType.WheatSeed] || 0}
            </li>
            <li className="flex items-center text-[0.75rem]">
              <span className="mr-1.5 h-3 w-3 text-pink-400 flex items-center justify-center">👚</span>
              Ruha: {inventory.clothes || 0}
            
            </li>
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
                  {business.name}
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