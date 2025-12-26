"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, SkipForward, SkipBack, Volume1, Shuffle, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface MusicPlayerProps {
  tracks: string[];
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ tracks }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true); // Alapértelmezetten bekapcsolva
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.4); // Kezdeti hangerő 40%
  const [isShuffling, setIsShuffling] = useState(true); // Alapértelmezetten keverés aktív
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('all'); // Alapértelmezetten összes ismétlése aktív

  const playNextTrack = useCallback(() => {
    if (tracks.length === 0) return;

    setCurrentTrackIndex(prevIndex => {
      if (repeatMode === 'one') {
        return prevIndex; // Marad az aktuális track
      }
      
      if (isShuffling) {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * tracks.length);
        } while (newIndex === prevIndex && tracks.length > 1);
        return newIndex;
      }

      const nextIndex = (prevIndex + 1) % tracks.length;
      
      if (repeatMode === 'none' && nextIndex === 0) {
        setIsPlaying(false); // Leáll, ha vége a listának és nincs ismétlés
        return prevIndex;
      }
      
      return nextIndex;
    });
    setIsPlaying(true);
  }, [tracks, isShuffling, repeatMode]);

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
      audioRef.current.src = tracks[currentTrackIndex];
      audioRef.current.load(); // Reload the new source
      
      // Ha isPlaying true, indítsuk el a lejátszást
      if (isPlaying) { 
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
    }
  }, [currentTrackIndex, tracks, isPlaying]);

  // Effect to handle play/pause toggle and initial volume setting
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume; // Hangerő beállítása
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume]); // Hozzáadtam a volume-ot a függőségekhez

  // Effect to handle track ending
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('ended', playNextTrack);
      return () => audio.removeEventListener('ended', playNextTrack);
    }
  }, [playNextTrack]);


  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const playPreviousTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex(prevIndex => (prevIndex - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0] / 100); // A Slider 0-100 közötti értéket ad vissza
  };

  const toggleShuffle = () => {
    setIsShuffling(prev => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode(prevMode => {
      if (prevMode === 'none') return 'all';
      if (prevMode === 'all') return 'one';
      return 'none';
    });
  };

  if (tracks.length === 0) {
    return null;
  }

  // URL dekódolás és fájlnév tisztítása
  const rawTrackName = tracks[currentTrackIndex].split('/').pop()?.replace('.mp3', '') || `Track ${currentTrackIndex + 1}`;
  const currentTrackName = decodeURIComponent(rawTrackName);

  return (
    <Card className="w-full mt-4 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Háttérzene</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
        <p className="text-sm truncate" title={currentTrackName}>
          {currentTrackName}
        </p>
        
        {/* Vezérlő gombok: Shuffle és Repeat külön sorban, balra igazítva */}
        <div className="flex justify-start space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleShuffle}
            className={cn(
              "h-8 w-8",
              isShuffling ? "text-primary" : "text-gray-500 hover:text-primary"
            )}
            title="Keverés"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRepeat}
            className={cn(
              "h-8 w-8",
              repeatMode !== 'none' ? "text-primary" : "text-gray-500 hover:text-primary"
            )}
            title={repeatMode === 'one' ? "Ismétlés: egy dal" : repeatMode === 'all' ? "Ismétlés: összes" : "Ismétlés kikapcsolva"}
          >
            <Repeat className="h-4 w-4" />
            {repeatMode === 'one' && <span className="absolute text-[0.6rem] bottom-1 right-1">1</span>}
          </Button>
        </div>
        
        {/* Lejátszás gombok: középre igazítva */}
        <div className="flex justify-center space-x-2">
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
        
        {/* Hangerő csúszka */}
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
        <audio ref={audioRef} preload="auto" />
      </CardContent>
    </Card>
  );
};

export default MusicPlayer;
