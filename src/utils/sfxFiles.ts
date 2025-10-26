// src/utils/sfxFiles.ts
interface SfxUrls {
  [key: string]: string;
}

const sfxModules = import.meta.glob('/src/sfx/*.mp3', { eager: true, as: 'url' });

export const sfxUrls: SfxUrls = Object.keys(sfxModules).reduce((acc: SfxUrls, path: string) => {
  const fileName = path.split('/').pop()?.replace('.mp3', '');
  if (fileName) {
    acc[fileName] = sfxModules[path] as string;
  }
  return acc;
}, {});