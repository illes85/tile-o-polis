"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

interface PlayerSettingsProps {
  playerName: string;
  onPlayerNameChange: (newName: string) => void;
  filterZeroTransactions: boolean;
  onFilterZeroTransactionsChange: (checked: boolean) => void;
}

const PlayerSettings: React.FC<PlayerSettingsProps> = ({ 
  playerName, 
  onPlayerNameChange,
  filterZeroTransactions,
  onFilterZeroTransactionsChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editedName, setEditedName] = useState(playerName);
  const [editedFilter, setEditedFilter] = useState(filterZeroTransactions);

  // Sync state when prop changes or dialog opens
  React.useEffect(() => {
    setEditedName(playerName);
    setEditedFilter(filterZeroTransactions);
  }, [playerName, filterZeroTransactions, isOpen]);

  const handleSave = () => {
    onPlayerNameChange(editedName);
    onFilterZeroTransactionsChange(editedFilter);
    setIsOpen(false);
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="rounded-full h-10 w-10">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-avatar.png" alt="Player Avatar" />
          <AvatarFallback>
            <UserIcon className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Játékos beállítások</DialogTitle>
            <DialogDescription>
              Itt módosíthatod a játékosod beállításait.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Név
              </Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filterZero" className="text-right">
                0 értékű tranzakciók szűrése
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox 
                  id="filterZero" 
                  checked={editedFilter}
                  onCheckedChange={(c) => setEditedFilter(c === true)}
                />
                <label htmlFor="filterZero" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Bekapcsolva
                </label>
              </div>
            </div>
            {/* További beállítások jöhetnek ide */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Mégsem</Button>
            <Button onClick={handleSave}>Mentés</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlayerSettings;