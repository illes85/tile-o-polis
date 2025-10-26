export const musicTracks: string[] = [
  "/country_music.mp3", // Kérlek, helyezd el ezt a fájlt a public mappába
  // Ha a zenék az src/music mappában vannak, akkor így add hozzá:
  // import track1 from "@/music/track1.mp3";
  // import track2 from "@/music/track2.mp3";
  // export const musicTracks: string[] = [track1, track2];
  // Fontos: a Vite build rendszernek tudnia kell kezelni az .mp3 importokat.
  // Ha a public mappába teszed, akkor közvetlenül hivatkozhatsz rájuk:
  // "/track1.mp3",
  // "/track2.mp3",
];