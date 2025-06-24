import React, { useState, useRef } from 'react';

interface ZoomPanWrapperProps {
  children: React.ReactNode;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export const ZoomPanWrapper: React.FC<ZoomPanWrapperProps> = ({ children }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const pinchInfo = useRef<{ distance: number; scale: number } | null>(null);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = -e.deltaY;
    setScale((s) => clamp(s + delta * 0.001, MIN_SCALE, MAX_SCALE));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!lastPos.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    lastPos.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchInfo.current = { distance, scale };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchInfo.current) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = clamp(
        pinchInfo.current.scale * (distance / pinchInfo.current.distance),
        MIN_SCALE,
        MAX_SCALE
      );
      setScale(newScale);
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    pinchInfo.current = null;
  };

  const zoomIn = () => setScale((s) => clamp(s + 0.1, MIN_SCALE, MAX_SCALE));
  const zoomOut = () => setScale((s) => clamp(s - 0.1, MIN_SCALE, MAX_SCALE));

  const isDesktop =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches;

  return (
    <div
      className="relative overflow-hidden touch-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0'
        }}
      >
        {children}
      </div>
      {isDesktop && (
        <div className="absolute bottom-2 right-2 bg-white rounded shadow flex flex-col">
          <button className="px-2" onClick={zoomIn} aria-label="Zoom in">
            +
          </button>
          <button className="px-2" onClick={zoomOut} aria-label="Zoom out">
            -
          </button>
        </div>
      )}
    </div>
  );
};

export default ZoomPanWrapper;
