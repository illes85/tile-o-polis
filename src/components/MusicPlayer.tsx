"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, SkipForward, SkipBack, Volume1, Volume } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider"; // Importáljuk a Slider komponenst

interface MusicPlayerProps {
  tracks: string[];
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ tracks }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5); // Kezdeti hangerő 50%

  // Effect to load new track when currentTrackIndex or tracks change
  useEffect(() => {
    if (tracks.length === 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      const wasPlaying = !audioRef.current.paused; // Check if it was playing before src change
      audioRef.current.src = tracks[currentTrackIndex];
      audioRef.current.load(); // Reload the new source
      if (wasPlaying) { // If it was playing, try to play again
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
    }
  }, [currentTrackIndex, tracks]); // Removed 'volume' from dependencies

  // Effect to handle play/pause toggle
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Effect to update volume without restarting playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const playNextTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex(prevIndex => (prevIndex + 1) % tracks.length);
    setIsPlaying(true);
  };

  const playPreviousTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex(prevIndex => (prevIndex - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0] / 100); // A Slider 0-100 közötti értéket ad vissza
  };

  if (tracks.length === 0) {
    return null;
  }

  return (
    <Card className="w-full mt-4 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Háttérzene</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            {`Track ${currentTrackIndex + 1}/${tracks.length}`}
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={playPreviousTrack}
              className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border hover:bg-sidebar-primary/80"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
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
        </div>
        <div className="flex items-center space-x-2">
          {volume === 0 ? <VolumeX className="h-4 w-4 text-gray-500" /> : volume < 0.5 ? <Volume1 className="h-4 w-4 text-gray-500" /> : <Volume2 className="h-4 w-4 text-gray-500" />}
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="w-[60%]"
          />
        </div>
        <audio ref={audioRef} loop preload="auto" />
      </CardContent>
    </Card>
  );
};

export default MusicPlayer;