import React, { useRef, useState, useEffect, useCallback } from 'react';

// Lightweight SVG-based signature pad (no canvas)
// Props:
// - width, height
// - strokeWidth, strokeColor, backgroundColor
// - onChange(svgString)
// - onClear()
// - className
export default function SignaturePad({
  width = 600,
  height = 220,
  strokeWidth = 2,
  strokeColor = '#111827',
  backgroundColor = '#ffffff',
  className = '',
  onChange,
  onClear
}) {
  const svgRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState([]); // each path = array of points

  const getPoint = (e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x: Math.max(0, Math.min(x, rect.width)), y: Math.max(0, Math.min(y, rect.height)) };
  };

  const toPathD = (pts) => {
    if (!pts || pts.length === 0) return '';
    const [p0, ...rest] = pts;
    return `M ${p0.x} ${p0.y}` + rest.map(p => ` L ${p.x} ${p.y}`).join('');
  };

  const exportSvg = useCallback(() => {
    const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>`;
    const content = `\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <rect width="100%" height="100%" fill="${backgroundColor}"/>\n  ${paths.map(pts => `<path d="${toPathD(pts)}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`).join('\n  ')}\n</svg>`;
    return svgHeader + content;
  }, [paths, width, height, strokeColor, strokeWidth, backgroundColor]);

  useEffect(() => {
    if (onChange) onChange(paths.length ? exportSvg() : '');
  }, [paths, onChange, exportSvg]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const p = getPoint(e);
    setPaths(prev => [...prev, [p]]);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const p = getPoint(e);
    setPaths(prev => {
      const next = [...prev];
      next[next.length - 1] = [...next[next.length - 1], p];
      return next;
    });
  };

  const handlePointerUp = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
  };

  const clear = () => {
    setPaths([]);
    if (onClear) onClear();
    if (onChange) onChange('');
  };

  return (
    <div className={className}>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          background: backgroundColor,
          touchAction: 'none',
          width: width,
          height: height,
          userSelect: 'none'
        }}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          {paths.map((pts, idx) => (
            <path
              key={idx}
              d={toPathD(pts)}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={clear} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Effacer</button>
      </div>
    </div>
  );
}
