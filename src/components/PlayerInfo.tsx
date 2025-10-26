"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wheat, Droplet, Shirt } from "lucide-react";

interface PlayerInfoProps {
  money: number;
  inventory: {
    potato: number;
    water: number;
    clothes: number;
    // Add more items as needed
  };
  role: string;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ money, inventory, role }) => {
  return (
    <Card className="w-full bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Játékos adatok</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="flex items-center mb-2">
          <DollarSign className="mr-2 h-4 w-4 text-green-500" />
          <span>Pénz: {money}</span>
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
            {/* Add more inventory items here */}
          </ul>
        </div>
        <div className="flex items-center">
          <span className="font-medium mr-2">Szerepkör:</span>
          <span className="text-primary-foreground">{role}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerInfo;