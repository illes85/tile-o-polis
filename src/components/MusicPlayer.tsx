"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, SkipForward } from "lucide-react"; // Importáljuk a SkipForward ikont
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MusicPlayerProps {
  tracks: string[];
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ tracks }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = tracks[currentTrackIndex];
      console.log("Attempting to load music from:", audioRef.current.src); // Debug log
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
    }
  }, [currentTrackIndex, tracks]); // Frissül, ha a szám vagy a lejátszási lista változik

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const playNextTrack = () => {
    setCurrentTrackIndex(prevIndex => (prevIndex + 1) % tracks.length);
    setIsPlaying(true); // Automatikusan elindítja a következő számot
  };

  if (tracks.length === 0) {
    return null; // Ha nincs zene, ne jelenjen meg a lejátszó
  }

  return (
    <Card className="w-full mt-4 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Háttérzene</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm">
          {`Track ${currentTrackIndex + 1}/${tracks.length}`}
        </p>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayPause}
            className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border hover:bg-sidebar-primary/80"
          >
            {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={playNextTrack}
            className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border hover:bg-sidebar-primary/80"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        <audio ref={audioRef} loop preload="auto" controls /> {/* Hozzáadva a controls attribútum */}
      </CardContent>
    </Card>
  );
};

export default MusicPlayer;