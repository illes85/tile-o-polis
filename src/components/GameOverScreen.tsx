"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GameOverScreenProps {
  status: "win" | "loss";
  onClose: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ status, onClose }) => {
  const title = status === "win" ? "Győzelem!" : "Vesztettél!";
  const description = status === "win"
    ? "Gratulálunk, teljesítetted a játék céljait!"
    : "Sajnos nem sikerült teljesíteni a játék céljait. Próbáld újra!";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold ${status === "win" ? "text-green-500" : "text-red-500"}`}>
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Vissza a főmenübe</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverScreen;
