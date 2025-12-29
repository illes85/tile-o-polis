import { useEffect, useRef } from 'react';

export const useAutoSave = <T>(key: string, data: T, intervalMs: number = 30000) => {
  const dataRef = useRef(data);

  // Keep ref updated to avoid resetting interval on data change
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(key, JSON.stringify(dataRef.current));
        console.log(`[AutoSave] Saved ${key}`);
      } catch (e) {
        console.error(`[AutoSave] Error saving ${key}`, e);
      }
    };

    const timer = setInterval(save, intervalMs);
    
    // Save on unmount/re-render cleanup is debatable for auto-save, 
    // but we want to ensure latest state is saved if component unmounts.
    return () => {
      clearInterval(timer);
      save(); 
    };
  }, [key, intervalMs]);
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`[AutoSave] Error loading ${key}`, e);
    return defaultValue;
  }
};
