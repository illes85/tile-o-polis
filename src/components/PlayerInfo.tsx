"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wheat, Droplet, Shirt, User, Pencil, Leaf } from "lucide-react"; // Importáljuk a Leaf ikont
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PlayerInfoProps {
  playerName: string;
  money: number;
  inventory: {
    potato: number;
    water: number;
    clothes: number;
    wood: number; // Új: fa
  };
  workplace: string;
  onPlayerNameChange: (newName: string) => void;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ playerName, money, inventory, workplace, onPlayerNameChange }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(playerName);

  const handleEditToggle = () => {
    setIsEditingName(prev => !prev);
    if (isEditingName) {
      onPlayerNameChange(editedName);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onPlayerNameChange(editedName);
      setIsEditingName(false);
    }
  };

  const handleBlur = () => {
    onPlayerNameChange(editedName);
    setIsEditingName(false);
  };

  return (
    <Card className="w-full bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Játékos adatok</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="flex items-center mb-2">
          <User className="mr-2 h-4 w-4 text-gray-500" />
          <div className="flex items-center group">
            {isEditingName ? (
              <Input
                value={editedName}
                onChange={handleNameChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="h-6 px-2 py-1 text-sm bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border"
                autoFocus
              />
            ) : (
              <span className="mr-1">{playerName}</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEditToggle}
              className="h-6 w-6 p-0 opacity-50 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        </div>
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
            <li className="flex items-center">
              <Leaf className="mr-2 h-3 w-3 text-yellow-700" /> Fa: {inventory.wood} {/* Új: fa */}
            </li>
          </ul>
        </div>
        <div className="flex items-center">
          <span className="font-medium mr-2">Alkalmazott:</span>
          <span className="text-primary-foreground">{workplace}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerInfo;