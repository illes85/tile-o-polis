import React, { useRef, useEffect } from 'react';
import { BuildingData } from '@/components/Map';

interface MiniMapProps {
  buildings: BuildingData[];
  trees: { x: number; y: number }[];
  stones: { x: number; y: number }[];
  players: { id: string; x: number; y: number; color: string }[];
  currentPlayerId: string;
  mapGridSize: number;
  cameraOffset: { x: number; y: number };
  onJumpTo: (x: number, y: number) => void;
  viewportSize: { width: number; height: number };
  cellSizePx: number;
}

const MiniMap: React.FC<MiniMapProps> = ({
  buildings,
  trees,
  stones,
  players,
  currentPlayerId,
  mapGridSize,
  cameraOffset,
  onJumpTo,
  viewportSize,
  cellSizePx,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 150; // MiniMap pixel size (width/height)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background with non-distracting green
    ctx.fillStyle = '#2d4a22'; 
    ctx.fillRect(0, 0, size, size);

    const scale = size / mapGridSize;

    // Draw Buildings
    buildings.forEach(b => {
      if (b.type === 'road') {
        ctx.fillStyle = '#ccc';
      } else if (b.type === 'house') {
        ctx.fillStyle = '#facc15'; // Yellow
      } else if (b.type === 'office' || b.type === 'shop' || b.type === 'bank' || b.type === 'mill' || b.type === 'popcorn_stand') {
        ctx.fillStyle = '#f97316'; // Orange
      } else if (b.type === 'forestry') {
        ctx.fillStyle = '#166534'; // Dark Green
      } else if (b.type === 'farm') {
        ctx.fillStyle = '#84cc16'; // Lime Green
      } else {
        ctx.fillStyle = '#888';
      }
      
      // Handle rotation for correct dimension
      const w = (b.rotation === 90 || b.rotation === 270) ? b.height : b.width;
      const h = (b.rotation === 90 || b.rotation === 270) ? b.width : b.height;
      ctx.fillRect(b.x * scale, b.y * scale, w * scale, h * scale);
    });

    // Draw Trees
    ctx.fillStyle = '#2d6a4f';
    trees.forEach(t => {
      ctx.fillRect(t.x * scale, t.y * scale, 3 * scale, 3 * scale);
    });

    // Draw Stones
    ctx.fillStyle = '#555';
    stones.forEach(s => {
      ctx.fillRect(s.x * scale, s.y * scale, 2 * scale, 2 * scale);
    });

    // Draw Players
    players.forEach(p => {
      ctx.fillStyle = p.id === currentPlayerId ? '#00f' : '#f00';
      const playerSize = Math.max(2, 1 * scale);
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, playerSize, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Viewport Rect
    // cameraOffset is usually negative (scrolling moves map left/up)
    // mapOffsetX = -100 means we see starting from x=100.
    const viewX = -cameraOffset.x / cellSizePx;
    const viewY = -cameraOffset.y / cellSizePx;
    const viewW = viewportSize.width / cellSizePx;
    const viewH = viewportSize.height / cellSizePx;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(viewX * scale, viewY * scale, viewW * scale, viewH * scale);

  }, [buildings, trees, stones, players, currentPlayerId, mapGridSize, cameraOffset, viewportSize, cellSizePx]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = (x / size) * mapGridSize;
    const gridY = (y / size) * mapGridSize;

    onJumpTo(gridX, gridY);
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 border-2 border-gray-600 bg-black rounded overflow-hidden shadow-lg">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onClick={handleClick}
        className="cursor-pointer block"
      />
    </div>
  );
};

export default MiniMap;