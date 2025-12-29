import { useState, useEffect, useRef } from 'react';

export const usePerformanceMonitor = (enabled: boolean = true) => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const [metrics, setMetrics] = useState<{ fps: number; memory?: number }>({ fps: 0 });

  useEffect(() => {
    if (!enabled) return;

    const loop = () => {
      frameCount.current++;
      const now = performance.now();
      const diff = now - lastTime.current;

      if (diff >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / diff);
        setFps(currentFps);
        
        // Memory usage (Chrome specific)
        const memory = (performance as any).memory;
        
        setMetrics({
          fps: currentFps,
          memory: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : undefined
        });

        frameCount.current = 0;
        lastTime.current = now;
      }

      requestAnimationFrame(loop);
    };

    const animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [enabled]);

  return metrics;
};
