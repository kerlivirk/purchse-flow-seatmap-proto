import { useState } from 'react';
import { Box, Chip, Typography, Paper, Fade } from '@mui/material';
import { Accessible, LocalActivity } from '@mui/icons-material';
import { VenueFacilities, FacilitiesLegend } from './VenueFacilities';
import type { Sector, SelectedSeat } from './VenueMap';

const sectorColors = {
  vip: '#9c27b0',
  premium: '#f44336',
  standard: '#2196f3',
  balcony: '#4caf50'
};

interface SectorViewProps {
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onSectorClick: (sector: Sector) => void;
  filters: any;
  selectedSeats: SelectedSeat[];
}

// Mock sectors data
const generateSectors = (): Sector[] => [
  { id: 'vip-1', name: 'VIP Center', x: 350, y: 450, width: 200, height: 100, rotation: 0, priceCategory: 'vip', startingPrice: 299, totalSeats: 48, availableSeats: 32, isGA: false, accessible: true },
  { id: 'premium-1', name: 'Premium Left', x: 150, y: 400, width: 180, height: 120, rotation: -15, priceCategory: 'premium', startingPrice: 199, totalSeats: 64, availableSeats: 45, isGA: false, accessible: true },
  { id: 'premium-2', name: 'Premium Right', x: 570, y: 400, width: 180, height: 120, rotation: 15, priceCategory: 'premium', startingPrice: 199, totalSeats: 64, availableSeats: 38, isGA: false, accessible: true },
  { id: 'standard-1', name: 'Standard Left', x: 100, y: 250, width: 200, height: 130, rotation: -20, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 72, isGA: false, accessible: false },
  { id: 'standard-2', name: 'Standard Center', x: 320, y: 200, width: 260, height: 140, rotation: 0, priceCategory: 'standard', startingPrice: 149, totalSeats: 120, availableSeats: 85, isGA: false, accessible: true },
  { id: 'standard-3', name: 'Standard Right', x: 600, y: 250, width: 200, height: 130, rotation: 20, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 68, isGA: false, accessible: false },
  { id: 'balcony-1', name: 'Balcony', x: 250, y: 80, width: 400, height: 80, rotation: 0, priceCategory: 'balcony', startingPrice: 99, totalSeats: 144, availableSeats: 118, isGA: false, accessible: true },
  { id: 'ga-standing', name: 'Standing GA', x: 350, y: 580, width: 200, height: 80, rotation: 0, priceCategory: 'standard', startingPrice: 79, totalSeats: 200, availableSeats: 156, isGA: true, accessible: false }
];

export function SectorView({ zoom, pan, onPanChange, onSectorClick, filters, selectedSeats }: SectorViewProps) {
  const [sectors] = useState<Sector[]>(generateSectors());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onPanChange({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const isSectorFiltered = (sector: Sector) => {
    if (!filters.categories.includes(sector.priceCategory)) return true;
    if (sector.startingPrice < filters.priceRange[0] || sector.startingPrice > filters.priceRange[1]) return true;
    if (filters.accessibleOnly && !sector.accessible) return true;
    return false;
  };

  const getAvailabilityColor = (sector: Sector) => {
    const ratio = sector.availableSeats / sector.totalSeats;
    if (ratio > 0.5) return sectorColors[sector.priceCategory];
    if (ratio > 0.2) return '#ff9800';
    return '#9e9e9e';
  };

  return (
    <>
      <FacilitiesLegend />
      <Box
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        sx={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          position: 'relative'
        }}
      >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 900 700"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s'
        }}
      >
        {/* Stage */}
        <g>
          <rect
            x="300"
            y="600"
            width="300"
            height="80"
            fill="#424242"
            rx="8"
          />
          <text
            x="450"
            y="645"
            textAnchor="middle"
            fill="white"
            fontSize="20"
            fontWeight="bold"
          >
            STAGE
          </text>
        </g>

        {/* Sectors */}
        {sectors.map(sector => {
          const isFiltered = isSectorFiltered(sector);
          const color = getAvailabilityColor(sector);
          const isHovered = hoveredSector === sector.id;

          return (
            <g
              key={sector.id}
              transform={`translate(${sector.x}, ${sector.y}) rotate(${sector.rotation})`}
              style={{ cursor: 'pointer' }}
              onClick={() => !isFiltered && onSectorClick(sector)}
              onMouseEnter={() => setHoveredSector(sector.id)}
              onMouseLeave={() => setHoveredSector(null)}
            >
              <rect
                x={0}
                y={0}
                width={sector.width}
                height={sector.height}
                fill={isFiltered ? '#e0e0e0' : color}
                stroke={isHovered ? '#ff6f00' : 'white'}
                strokeWidth={isHovered ? 3 : 2}
                rx="8"
                opacity={isFiltered ? 0.3 : isHovered ? 0.9 : 0.7}
                style={{ transition: 'all 0.2s' }}
              />

              {/* Sector Name */}
              <text
                x={sector.width / 2}
                y={sector.height / 2 - 10}
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                {sector.name}
              </text>

              {/* Price Badge */}
              {!isFiltered && (
                <g>
                  <rect
                    x={sector.width / 2 - 45}
                    y={sector.height / 2 + 5}
                    width="90"
                    height="22"
                    fill="rgba(0,0,0,0.6)"
                    rx="11"
                  />
                  <text
                    x={sector.width / 2}
                    y={sector.height / 2 + 20}
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="600"
                  >
                    from {sector.startingPrice} PLN
                  </text>
                </g>
              )}

              {/* Availability Badge */}
              <g>
                <rect
                  x={sector.width / 2 - 35}
                  y={sector.height / 2 + 30}
                  width="70"
                  height="18"
                  fill="rgba(255,255,255,0.9)"
                  rx="9"
                />
                <text
                  x={sector.width / 2}
                  y={sector.height / 2 + 43}
                  textAnchor="middle"
                  fill={color}
                  fontSize="10"
                  fontWeight="600"
                >
                  {sector.availableSeats}/{sector.totalSeats}
                </text>
              </g>

              {/* Icons */}
              {sector.accessible && (
                <circle
                  cx={10}
                  cy={10}
                  r="8"
                  fill="rgba(255,255,255,0.9)"
                />
              )}
              {sector.isGA && (
                <circle
                  cx={sector.width - 10}
                  cy={10}
                  r="8"
                  fill="rgba(255,255,255,0.9)"
                />
              )}
            </g>
          );
        })}

        {/* Venue Facilities */}
        <VenueFacilities show={true} />
      </svg>

      {/* Sector Hover Tooltip */}
      {hoveredSector && (
        <Fade in={true}>
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              bottom: 100,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              p: 2,
              minWidth: 250,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%)',
              backdropFilter: 'blur(10px)'
            }}
          >
          {(() => {
            const sector = sectors.find(s => s.id === hoveredSector);
            if (!sector) return null;
            return (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {sector.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={sector.priceCategory.toUpperCase()}
                    size="small"
                    sx={{ backgroundColor: sectorColors[sector.priceCategory], color: 'white' }}
                  />
                  {sector.accessible && (
                    <Chip icon={<Accessible />} label="Accessible" size="small" />
                  )}
                  {sector.isGA && (
                    <Chip icon={<LocalActivity />} label="General Admission" size="small" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Starting at <strong>{sector.startingPrice} PLN</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sector.availableSeats} of {sector.totalSeats} seats available
                </Typography>
              </>
            );
          })()}
          </Paper>
        </Fade>
      )}
      </Box>
    </>
  );
}
