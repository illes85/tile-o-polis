// src/utils/musicFiles.ts
const musicModules = import.meta.glob('/src/music/*.mp3', { eager: true, query: '?url', import: 'default' });

export const musicTracks: string[] = Object.values(musicModules) as string[];
