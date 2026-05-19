import { useState } from 'react';
import { Box, Typography, Paper, Chip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Map, ViewModule, Accessible } from '@mui/icons-material';
import type { Sector, SelectedSeat } from './VenueMap';

const sectorColors = {
  vip: '#9c27b0',
  premium: '#f44336',
  standard: '#2196f3',
  balcony: '#4caf50'
};

interface PureMapViewProps {
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onSectorClick: (sector: Sector) => void;
  filters: any;
  selectedSeats: SelectedSeat[];
}

// Detailed venue map with realistic section shapes
const generateDetailedSectors = (): Sector[] => [
  // VIP Orchestra sections
  { id: 'orch-1', name: '101', x: 280, y: 480, width: 80, height: 60, rotation: -5, priceCategory: 'vip', startingPrice: 299, totalSeats: 32, availableSeats: 24, isGA: false, accessible: true },
  { id: 'orch-2', name: '102', x: 365, y: 480, width: 80, height: 60, rotation: 0, priceCategory: 'vip', startingPrice: 299, totalSeats: 32, availableSeats: 20, isGA: false, accessible: true },
  { id: 'orch-3', name: '103', x: 450, y: 480, width: 80, height: 60, rotation: 5, priceCategory: 'vip', startingPrice: 299, totalSeats: 32, availableSeats: 18, isGA: false, accessible: true },

  // Premium Mezzanine sections
  { id: 'mezz-left-1', name: '201', x: 150, y: 380, width: 100, height: 70, rotation: -15, priceCategory: 'premium', startingPrice: 199, totalSeats: 48, availableSeats: 36, isGA: false, accessible: true },
  { id: 'mezz-left-2', name: '202', x: 240, y: 360, width: 90, height: 70, rotation: -8, priceCategory: 'premium', startingPrice: 199, totalSeats: 44, availableSeats: 32, isGA: false, accessible: false },
  { id: 'mezz-center-1', name: '203', x: 330, y: 350, width: 150, height: 80, rotation: 0, priceCategory: 'premium', startingPrice: 199, totalSeats: 64, availableSeats: 45, isGA: false, accessible: true },
  { id: 'mezz-right-1', name: '204', x: 480, y: 360, width: 90, height: 70, rotation: 8, priceCategory: 'premium', startingPrice: 199, totalSeats: 44, availableSeats: 38, isGA: false, accessible: false },
  { id: 'mezz-right-2', name: '205', x: 560, y: 380, width: 100, height: 70, rotation: 15, priceCategory: 'premium', startingPrice: 199, totalSeats: 48, availableSeats: 40, isGA: false, accessible: true },

  // Standard sections
  { id: 'std-left-1', name: '301', x: 100, y: 260, width: 110, height: 80, rotation: -20, priceCategory: 'standard', startingPrice: 149, totalSeats: 72, availableSeats: 58, isGA: false, accessible: false },
  { id: 'std-left-2', name: '302', x: 200, y: 240, width: 100, height: 80, rotation: -12, priceCategory: 'standard', startingPrice: 149, totalSeats: 64, availableSeats: 52, isGA: false, accessible: true },
  { id: 'std-center-1', name: '303', x: 300, y: 230, width: 210, height: 90, rotation: 0, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 72, isGA: false, accessible: true },
  { id: 'std-right-1', name: '304', x: 510, y: 240, width: 100, height: 80, rotation: 12, priceCategory: 'standard', startingPrice: 149, totalSeats: 64, availableSeats: 48, isGA: false, accessible: true },
  { id: 'std-right-2', name: '305', x: 600, y: 260, width: 110, height: 80, rotation: 20, priceCategory: 'standard', startingPrice: 149, totalSeats: 72, availableSeats: 60, isGA: false, accessible: false },

  // Balcony sections
  { id: 'balc-left', name: '401', x: 150, y: 120, width: 150, height: 65, rotation: -5, priceCategory: 'balcony', startingPrice: 99, totalSeats: 80, availableSeats: 68, isGA: false, accessible: false },
  { id: 'balc-center', name: '402', x: 305, y: 110, width: 200, height: 70, rotation: 0, priceCategory: 'balcony', startingPrice: 99, totalSeats: 96, availableSeats: 82, isGA: false, accessible: true },
  { id: 'balc-right', name: '403', x: 510, y: 120, width: 150, height: 65, rotation: 5, priceCategory: 'balcony', startingPrice: 99, totalSeats: 80, availableSeats: 70, isGA: false, accessible: false },

  // Standing/GA
  { id: 'ga-floor', name: 'GA Floor', x: 320, y: 560, width: 170, height: 60, rotation: 0, priceCategory: 'standard', startingPrice: 79, totalSeats: 150, availableSeats: 120, isGA: true, accessible: false },
];

export function PureMapView({ zoom, pan, onPanChange, onSectorClick, filters, selectedSeats }: PureMapViewProps) {
  const [sectors] = useState<Sector[]>(generateDetailedSectors());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'sections' | 'pure'>('sections');

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.sector')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
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

  const getAvailabilityRatio = (sector: Sector) => {
    return sector.availableSeats / sector.totalSeats;
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* View Mode Toggle */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          p: 1
        }}
      >
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, value) => value && setViewMode(value)}
          size="small"
        >
          <ToggleButton value="sections">
            <ViewModule sx={{ mr: 0.5 }} />
            Sections
          </ToggleButton>
          <ToggleButton value="pure">
            <Map sx={{ mr: 0.5 }} />
            Pure Map
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

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
          viewBox="0 0 810 700"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s'
          }}
        >
          {/* Venue Background */}
          <rect
            x="50"
            y="50"
            width="710"
            height="600"
            fill="#fafafa"
            stroke="#ddd"
            strokeWidth="2"
            rx="12"
          />

          {/* Stage with detailed styling */}
          <g>
            <defs>
              <linearGradient id="stageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#616161" />
                <stop offset="100%" stopColor="#424242" />
              </linearGradient>
            </defs>
            <rect
              x="280"
              y="615"
              width="250"
              height="70"
              fill="url(#stageGradient)"
              stroke="#212121"
              strokeWidth="2"
              rx="6"
            />
            {/* Stage curtain effect */}
            <path
              d="M 285 620 Q 290 625, 295 620 T 305 620 T 315 620 T 325 620 T 335 620 T 345 620 T 355 620 T 365 620 T 375 620 T 385 620 T 395 620 T 405 620 T 415 620 T 425 620 T 435 620 T 445 620 T 455 620 T 465 620 T 475 620 T 485 620 T 495 620 T 505 620 T 515 620 T 525 620"
              fill="none"
              stroke="#9e9e9e"
              strokeWidth="3"
            />
            <text
              x="405"
              y="655"
              textAnchor="middle"
              fill="white"
              fontSize="24"
              fontWeight="bold"
              letterSpacing="2"
            >
              STAGE
            </text>
          </g>

          {/* Sections with different rendering based on view mode */}
          {sectors.map(sector => {
            const isFiltered = isSectorFiltered(sector);
            const color = sectorColors[sector.priceCategory];
            const isHovered = hoveredSector === sector.id;
            const availRatio = getAvailabilityRatio(sector);

            return (
              <g
                key={sector.id}
                className="sector"
                transform={`translate(${sector.x}, ${sector.y}) rotate(${sector.rotation})`}
                style={{ cursor: 'pointer' }}
                onClick={() => !isFiltered && onSectorClick(sector)}
                onMouseEnter={() => setHoveredSector(sector.id)}
                onMouseLeave={() => setHoveredSector(null)}
              >
                {viewMode === 'sections' ? (
                  // Sections View - Color-coded blocks
                  <>
                    <rect
                      x={0}
                      y={0}
                      width={sector.width}
                      height={sector.height}
                      fill={isFiltered ? '#e0e0e0' : color}
                      stroke={isHovered ? '#ff6f00' : 'white'}
                      strokeWidth={isHovered ? 3 : 2}
                      rx="6"
                      opacity={isFiltered ? 0.3 : availRatio > 0.5 ? 0.8 : availRatio > 0.2 ? 0.6 : 0.4}
                      style={{ transition: 'all 0.2s' }}
                    />

                    {/* Section Number */}
                    <text
                      x={sector.width / 2}
                      y={sector.height / 2}
                      textAnchor="middle"
                      fill="white"
                      fontSize="18"
                      fontWeight="bold"
                    >
                      {sector.name}
                    </text>

                    {/* Price tag */}
                    {!isFiltered && (
                      <g>
                        <rect
                          x={sector.width / 2 - 40}
                          y={sector.height - 22}
                          width="80"
                          height="18"
                          fill="rgba(0,0,0,0.7)"
                          rx="9"
                        />
                        <text
                          x={sector.width / 2}
                          y={sector.height - 9}
                          textAnchor="middle"
                          fill="white"
                          fontSize="10"
                          fontWeight="600"
                        >
                          {sector.startingPrice} PLN
                        </text>
                      </g>
                    )}

                    {/* Accessible icon */}
                    {sector.accessible && (
                      <circle
                        cx={8}
                        cy={8}
                        r="6"
                        fill="white"
                        opacity="0.9"
                      />
                    )}
                  </>
                ) : (
                  // Pure Map View - Realistic venue layout
                  <>
                    <rect
                      x={0}
                      y={0}
                      width={sector.width}
                      height={sector.height}
                      fill={isFiltered ? '#e0e0e0' : '#fff'}
                      stroke={isFiltered ? '#ccc' : color}
                      strokeWidth={isHovered ? 4 : 2}
                      rx="4"
                      opacity={isFiltered ? 0.3 : 1}
                      style={{ transition: 'all 0.2s' }}
                    />

                    {/* Section number in corner */}
                    <text
                      x={8}
                      y={18}
                      fill={color}
                      fontSize="14"
                      fontWeight="bold"
                    >
                      {sector.name}
                    </text>

                    {/* Seat rows representation */}
                    {!isFiltered && !sector.isGA && (
                      <g>
                        {Array.from({ length: 6 }).map((_, rowIdx) => (
                          <line
                            key={rowIdx}
                            x1={10}
                            y1={25 + rowIdx * (sector.height - 30) / 6}
                            x2={sector.width - 10}
                            y2={25 + rowIdx * (sector.height - 30) / 6}
                            stroke={color}
                            strokeWidth="2"
                            opacity="0.3"
                          />
                        ))}
                      </g>
                    )}

                    {/* Availability indicator */}
                    <rect
                      x={sector.width - 25}
                      y={sector.height - 25}
                      width="20"
                      height="20"
                      fill={availRatio > 0.5 ? '#4caf50' : availRatio > 0.2 ? '#ff9800' : '#f44336'}
                      rx="10"
                      opacity="0.8"
                    />

                    {/* Accessible icon */}
                    {sector.accessible && (
                      <circle
                        cx={sector.width - 15}
                        cy={15}
                        r="8"
                        fill="#2196f3"
                        opacity="0.9"
                      />
                    )}
                  </>
                )}
              </g>
            );
          })}

          {/* Venue labels */}
          <text x="75" y="640" fill="#666" fontSize="14" fontWeight="600">
            Entrance A
          </text>
          <text x="680" y="640" fill="#666" fontSize="14" fontWeight="600">
            Entrance B
          </text>

          {/* Aisle markers */}
          <text x="250" y="320" fill="#999" fontSize="12" fontStyle="italic">
            Aisle 1
          </text>
          <text x="540" y="320" fill="#999" fontSize="12" fontStyle="italic">
            Aisle 2
          </text>
        </svg>
      </Box>

      {/* Sector Hover Info */}
      {hoveredSector && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            p: 2,
            minWidth: 280,
            maxWidth: 350
          }}
        >
          {(() => {
            const sector = sectors.find(s => s.id === hoveredSector);
            if (!sector) return null;
            const availRatio = getAvailabilityRatio(sector);
            return (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Section {sector.name}
                  </Typography>
                  <Chip
                    label={sector.priceCategory.toUpperCase()}
                    size="small"
                    sx={{ backgroundColor: sectorColors[sector.priceCategory], color: 'white' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  {sector.accessible && (
                    <Chip icon={<Accessible />} label="Accessible" size="small" variant="outlined" />
                  )}
                  {sector.isGA && (
                    <Chip label="General Admission" size="small" variant="outlined" />
                  )}
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Starting from
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {sector.startingPrice} PLN
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Availability
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {sector.availableSeats} / {sector.totalSeats}
                  </Typography>
                </Box>

                {/* Availability bar */}
                <Box sx={{ width: '100%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width: `${availRatio * 100}%`,
                      height: '100%',
                      backgroundColor: availRatio > 0.5 ? '#4caf50' : availRatio > 0.2 ? '#ff9800' : '#f44336',
                      transition: 'width 0.3s'
                    }}
                  />
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  Click to select seats in this section
                </Typography>
              </>
            );
          })()}
        </Paper>
      )}
    </Box>
  );
}
