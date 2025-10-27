"use client";

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SfxPlayerProps {
  sfxUrls: { [key: string]: string };
}

export interface SfxPlayerRef {
  playSfx: (key: string, loop?: boolean) => void;
  stopAllSfx: () => void;
}

const SfxPlayer = forwardRef<SfxPlayerRef, SfxPlayerProps>(({ sfxUrls }, ref) => {
  const [volume, setVolume] = useState(0.5); // Kezdeti hangerő 50%
  const activeAudios = useRef<HTMLAudioElement[]>([]);

  const playSfx = (key: string, loop: boolean = false) => {
    const url = sfxUrls[key];
    if (url) {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.loop = loop;
      audio.play().catch(e => console.error(`Error playing SFX '${key}':`, e));

      activeAudios.current.push(audio);
      audio.onended = () => {
        activeAudios.current = activeAudios.current.filter(a => a !== audio);
      };
    } else {
      console.warn(`SFX '${key}' not found.`);
    }
  };

  const stopAllSfx = () => {
    activeAudios.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    activeAudios.current = [];
  };

  // Hangerő frissítése az aktív hangeffekteken
  useEffect(() => {
    activeAudios.current.forEach(audio => {
      audio.volume = volume;
    });
  }, [volume]);

  useImperativeHandle(ref, () => ({
    playSfx,
    stopAllSfx,
  }));

  return (
    <Card className="w-full mt-4 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Hangeffektek</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          {volume === 0 ? <VolumeX className="h-4 w-4 text-gray-500" /> : volume < 0.5 ? <Volume1 className="h-4 w-4 text-gray-500" /> : <Volume2 className="h-4 w-4 text-gray-500" />}
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={(newVolume) => setVolume(newVolume[0] / 100)}
            className="w-[60%]"
          />
        </div>
      </CardContent>
    </Card>
  );
});

export default SfxPlayer;