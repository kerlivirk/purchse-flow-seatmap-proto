import { Box } from '@mui/material';
import { categoryColors } from '../../data/sectors';
import type { Sector } from '../../types';

interface MinimapProps {
  /** All visible sectors — passed in so the minimap doesn't have to know about
   *  v1/v2/v3 selection (the parent already filters by `locked` / unlock state). */
  sectors: Sector[];
  /** Currently-focused sector (when zoomed in). Drives the highlight. */
  selectedSector: Sector | null;
  /** Layout flags so the canvas size + stage marker match the main map. */
  fanLayout: boolean;
  gridLayout: boolean;
  /** Current CSS zoom/pan so the viewport indicator rectangle stays in sync. */
  zoom: number;
  pan: { x: number; y: number };
  /** Click handler — currently used to reset the view back to the full venue. */
  onBackToVenue: () => void;
}

/** Floating thumbnail in the map corner. Shows the whole venue, the focused
 *  sector at full opacity (others dimmed), and a translucent rectangle for the
 *  current CSS viewport. Clicking anywhere on it returns to the full overview. */
export function Minimap({ sectors, selectedSector, fanLayout, gridLayout, zoom, pan, onBackToVenue }: MinimapProps) {
  const vbCanvasW = fanLayout ? 1280 : 900;
  const vbCanvasH = fanLayout ? 900 : 720;
  const vbW = vbCanvasW / zoom;
  const vbH = vbCanvasH / zoom;
  const cx = vbCanvasW / 2 - pan.x * (vbCanvasW / 700);
  const cy = vbCanvasH / 2 - pan.y * (vbCanvasH / 540);
  const x = Math.max(0, Math.min(vbCanvasW - vbW, cx - vbW / 2));
  const y = Math.max(0, Math.min(vbCanvasH - vbH, cy - vbH / 2));

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label="Back to full venue"
      onClick={onBackToVenue}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onBackToVenue(); }}
      sx={{
        position: 'absolute',
        right: 12,
        bottom: { xs: 'auto', md: 16 },
        top: { xs: 12, md: 'auto' },
        width: { xs: 96, md: 120 },
        height: { xs: 64, md: 80 },
        bgcolor: '#ffffff',
        border: '1px solid #e9e7ed',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(17,0,43,0.08), 0 1px 3px rgba(17,0,43,0.06)',
        overflow: 'hidden',
        zIndex: 5,
        cursor: 'pointer',
        transition: 'box-shadow 150ms, transform 150ms',
        '&:hover': { boxShadow: '0 6px 20px rgba(17,0,43,0.14), 0 1px 3px rgba(17,0,43,0.08)', transform: 'translateY(-1px)' },
        '&::after': {
          content: '"Back to venue"',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 0.5,
          textAlign: 'center',
          color: '#11002b',
          bgcolor: 'rgba(255,255,255,0.92)',
          py: 0.25,
          borderTop: '1px solid #e9e7ed',
        },
      }}
    >
      <svg width="100%" height="100%" viewBox={fanLayout ? '0 0 1280 900' : '0 0 900 720'} preserveAspectRatio="xMidYMid meet">
        <rect width="100%" height="100%" fill={fanLayout ? '#e7e7e7' : '#f8f8fa'} />
        {/* Stage marker */}
        {fanLayout ? (
          <path d="M0 287 L24 287 C58 391 58 492 24 594 L0 594 Z" fill="#222" />
        ) : (
          <rect x={gridLayout ? 220 : 250} y={gridLayout ? 30 : 58} width={gridLayout ? 460 : 400} height={gridLayout ? 50 : 58} rx="8" fill="#11002b" />
        )}
        {/* Sector thumbnails — focused sector at full opacity with stroke, others dimmed */}
        {sectors.map((sector) => {
          const isFocused = selectedSector?.id === sector.id;
          const dim = !!selectedSector && !isFocused;
          const baseFill = sector.path
            ? (sector.id === 'mezzanine' ? '#7b5aa8' : sector.id === 'orchestra' || sector.id === 'balcony' ? '#9d85d0' : '#5a5062')
            : categoryColors[sector.priceCategory];
          const opacity = isFocused ? 1 : dim ? 0.22 : 0.85;
          return sector.path ? (
            <path
              key={sector.id}
              d={sector.path}
              fill={baseFill}
              opacity={opacity}
              stroke={isFocused ? '#11002b' : 'none'}
              strokeWidth={isFocused ? 14 : 0}
            />
          ) : (
            <rect
              key={sector.id}
              x={sector.x}
              y={sector.y}
              width={sector.width}
              height={sector.height}
              rx={gridLayout ? 14 : 12}
              transform={sector.rotation ? `rotate(${sector.rotation} ${sector.x + sector.width / 2} ${sector.y + sector.height / 2})` : undefined}
              fill={baseFill}
              opacity={opacity}
              stroke={isFocused ? '#11002b' : 'none'}
              strokeWidth={isFocused ? 8 : 0}
            />
          );
        })}
        {/* Viewport indicator — translucent rectangle showing the current visible area */}
        <rect
          x={x}
          y={y}
          width={vbW}
          height={vbH}
          fill="rgba(123,90,168,0.22)"
          stroke="#7b5aa8"
          strokeWidth={6}
          rx="6"
        />
      </svg>
    </Box>
  );
}
