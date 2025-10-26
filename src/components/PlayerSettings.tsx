"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserIcon } from "lucide-react";

interface PlayerSettingsProps {
  playerName: string;
  onPlayerNameChange: (newName: string) => void;
}

const PlayerSettings: React.FC<PlayerSettingsProps> = ({ playerName, onPlayerNameChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editedName, setEditedName] = useState(playerName);

  const handleSave = () => {
    onPlayerNameChange(editedName);
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