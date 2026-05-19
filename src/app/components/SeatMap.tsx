import { useState, useRef } from 'react';
import { Box, Paper, IconButton, Chip, Typography, useMediaQuery, useTheme, Fab, Tooltip } from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  MyLocation,
  ShoppingCart
} from '@mui/icons-material';
import { MobileCheckout } from './MobileCheckout';

interface Seat {
  id: string;
  row: string;
  number: number;
  x: number;
  y: number;
  type: 'vip' | 'premium' | 'standard' | 'balcony' | 'accessible';
  status: 'available' | 'selected' | 'occupied';
  price: number;
}

const seatColors = {
  vip: '#9c27b0',
  premium: '#f44336',
  standard: '#2196f3',
  balcony: '#4caf50',
  accessible: '#ff9800'
};

export function SeatMap() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [zoom, setZoom] = useState(isMobile ? 0.8 : 1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [userLocation] = useState({ x: 400, y: 500 });
  const [mobileCheckoutOpen, setMobileCheckoutOpen] = useState(false);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate seat layout
  const generateSeats = (): Seat[] => {
    const seats: Seat[] = [];
    const centerX = 400;
    const centerY = 300;

    // VIP section (front center)
    for (let row = 0; row < 3; row++) {
      for (let seat = 0; seat < 12; seat++) {
        const angle = (seat / 12) * Math.PI - Math.PI / 2;
        const radius = 80 + row * 30;
        seats.push({
          id: `vip-${row}-${seat}`,
          row: String.fromCharCode(65 + row),
          number: seat + 1,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          type: 'vip',
          status: Math.random() > 0.7 ? 'occupied' : 'available',
          price: 299
        });
      }
    }

    // Premium section
    for (let row = 0; row < 4; row++) {
      for (let seat = 0; seat < 16; seat++) {
        const angle = (seat / 16) * Math.PI * 1.2 - (Math.PI * 1.2) / 2;
        const radius = 180 + row * 25;
        seats.push({
          id: `premium-${row}-${seat}`,
          row: String.fromCharCode(68 + row),
          number: seat + 1,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          type: 'premium',
          status: Math.random() > 0.6 ? 'occupied' : 'available',
          price: 199
        });
      }
    }

    // Standard section
    for (let row = 0; row < 5; row++) {
      for (let seat = 0; seat < 20; seat++) {
        const angle = (seat / 20) * Math.PI * 1.4 - (Math.PI * 1.4) / 2;
        const radius = 280 + row * 22;
        seats.push({
          id: `standard-${row}-${seat}`,
          row: String.fromCharCode(72 + row),
          number: seat + 1,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          type: 'standard',
          status: Math.random() > 0.5 ? 'occupied' : 'available',
          price: 149
        });
      }
    }

    // Balcony section (top)
    for (let row = 0; row < 3; row++) {
      for (let seat = 0; seat < 24; seat++) {
        seats.push({
          id: `balcony-${row}-${seat}`,
          row: String.fromCharCode(77 + row),
          number: seat + 1,
          x: 100 + seat * 25,
          y: 50 + row * 20,
          type: 'balcony',
          status: Math.random() > 0.4 ? 'occupied' : 'available',
          price: 99
        });
      }
    }

    return seats;
  };

  const [seats] = useState<Seat[]>(generateSeats());

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.target as HTMLElement).closest('.seat')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSeatClick = (seatId: string, status: string) => {
    if (status === 'occupied') return;

    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && !(e.target as HTMLElement).closest('.seat')) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const getSelectedSeatsDetails = () => {
    return selectedSeats.map(id => {
      const seat = seats.find(s => s.id === id);
      return seat ? {
        id: seat.id,
        row: seat.row,
        number: seat.number,
        type: seat.type,
        price: seat.price
      } : null;
    }).filter(Boolean) as Array<{
      id: string;
      row: string;
      number: number;
      type: string;
      price: number;
    }>;
  };

  const getSeatStatus = (seat: Seat) => {
    if (selectedSeats.includes(seat.id)) return 'selected';
    return seat.status;
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Controls */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          p: 1,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2
        }}
      >
        <Tooltip title="Zoom In" placement="left">
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out" placement="left">
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset View" placement="left">
          <IconButton onClick={handleResetView} size="small">
            <MyLocation />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Legend */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          bottom: { xs: 80, md: 16 },
          left: 16,
          zIndex: 10,
          p: 2,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
          Legend
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            size="small"
            label="Available"
            sx={{ backgroundColor: '#e0e0e0' }}
          />
          <Chip
            size="small"
            label="Selected"
            sx={{ backgroundColor: '#ffd700', color: '#000' }}
          />
          <Chip
            size="small"
            label="Occupied"
            sx={{ backgroundColor: '#9e9e9e', color: 'white' }}
          />
        </Box>
      </Paper>

      {/* Selected Seats Summary - Desktop */}
      {selectedSeats.length > 0 && !isMobile && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 10,
            p: 2,
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            minWidth: 200
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
            Selected Seats: {selectedSeats.length}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Total: {selectedSeats.reduce((sum, id) => {
              const seat = seats.find(s => s.id === id);
              return sum + (seat?.price || 0);
            }, 0)} PLN
          </Typography>
        </Paper>
      )}

      {/* Mobile Checkout FAB */}
      {selectedSeats.length > 0 && isMobile && (
        <Fab
          color="primary"
          variant="extended"
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            left: 16,
            zIndex: 10,
            borderRadius: 2,
            py: 2
          }}
          onClick={() => setMobileCheckoutOpen(true)}
        >
          <ShoppingCart sx={{ mr: 1 }} />
          {selectedSeats.length} Seats - {selectedSeats.reduce((sum, id) => {
            const seat = seats.find(s => s.id === id);
            return sum + (seat?.price || 0);
          }, 0)} PLN
        </Fab>
      )}

      {/* Mobile Checkout Drawer */}
      <MobileCheckout
        open={mobileCheckoutOpen}
        onClose={() => setMobileCheckoutOpen(false)}
        selectedSeats={getSelectedSeatsDetails()}
      />

      {/* Custom Tooltip */}
      {hoveredSeat && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 40,
            zIndex: 1000,
            p: 1.5,
            backgroundColor: 'rgba(33, 33, 33, 0.95)',
            color: 'white',
            borderRadius: 1,
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
            Row {hoveredSeat.row}, Seat {hoveredSeat.number}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
            {hoveredSeat.type.toUpperCase()} - {hoveredSeat.price} PLN
          </Typography>
        </Paper>
      )}

      {/* Seat Map Canvas */}
      <Box
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: '#f5f5f5',
          position: 'relative',
          touchAction: 'none'
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s'
          }}
        >
          {/* Stage */}
          <rect
            x="250"
            y="250"
            width="300"
            height="80"
            fill="#424242"
            rx="8"
          />
          <text
            x="400"
            y="295"
            textAnchor="middle"
            fill="white"
            fontSize="18"
            fontWeight="bold"
          >
            STAGE
          </text>

          {/* Seats */}
          {seats.map(seat => {
            const status = getSeatStatus(seat);
            const color =
              status === 'selected'
                ? '#ffd700'
                : status === 'occupied'
                ? '#9e9e9e'
                : seatColors[seat.type];

            return (
              <circle
                key={seat.id}
                className="seat"
                cx={seat.x}
                cy={seat.y}
                r={hoveredSeat?.id === seat.id ? 10 : 8}
                fill={color}
                stroke={status === 'selected' ? '#ff6f00' : 'white'}
                strokeWidth={status === 'selected' ? 2 : 1}
                style={{
                  cursor: status === 'occupied' ? 'not-allowed' : 'pointer',
                  opacity: status === 'occupied' ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeatClick(seat.id, status);
                }}
                onMouseEnter={(e) => {
                  if (status !== 'occupied') {
                    setHoveredSeat(seat);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPosition({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    }
                  }
                }}
                onMouseMove={(e) => {
                  if (hoveredSeat?.id === seat.id) {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPosition({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    }
                  }
                }}
                onMouseLeave={() => {
                  if (hoveredSeat?.id === seat.id) {
                    setHoveredSeat(null);
                  }
                }}
              />
            );
          })}

          {/* User Location Indicator */}
          <g>
            <circle
              cx={userLocation.x}
              cy={userLocation.y}
              r="15"
              fill="#2196f3"
              opacity="0.3"
            >
              <animate
                attributeName="r"
                from="15"
                to="25"
                dur="1.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.3"
                to="0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={userLocation.x}
              cy={userLocation.y}
              r="8"
              fill="#2196f3"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={userLocation.x}
              y={userLocation.y - 20}
              textAnchor="middle"
              fill="#2196f3"
              fontSize="12"
              fontWeight="bold"
            >
              You are here
            </text>
          </g>
        </svg>
      </Box>
    </Box>
  );
}
