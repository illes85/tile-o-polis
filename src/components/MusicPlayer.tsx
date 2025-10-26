"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  return (
    <Card className="w-full mt-4 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Háttérzene</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm">Vidékies Country</p>
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayPause}
          className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border hover:bg-sidebar-primary/80"
        >
          {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        <audio ref={audioRef} src="/country_music.mp3" loop preload="auto" />
      </CardContent>
    </Card>
  );
};

export default MusicPlayer;