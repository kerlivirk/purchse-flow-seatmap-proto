import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { Accessible, Warning, ErrorOutline } from '@mui/icons-material';
import type { Sector, Seat, SelectedSeat } from './VenueMap';

const seatColors = {
  vip: '#9c27b0',
  premium: '#f44336',
  standard: '#2196f3',
  balcony: '#4caf50'
};

interface SeatDetailViewProps {
  sector: Sector;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  selectedSeats: SelectedSeat[];
  onSeatsChange: (seats: SelectedSeat[]) => void;
  filters: any;
}

// Generate seats for a sector
const generateSeatsForSector = (sector: Sector): Seat[] => {
  const seats: Seat[] = [];
  const rows = 8;
  const seatsPerRow = 12;
  const startX = 150;
  const startY = 100;
  const seatSpacing = 35;
  const rowSpacing = 30;

  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row);
    for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
      const isAccessible = seatNum <= 2 && row === rows - 1;
      const isLimitedView = row === 0 && (seatNum === 1 || seatNum === seatsPerRow);
      const randomStatus = Math.random();

      seats.push({
        id: `${sector.id}-${rowLetter}-${seatNum}`,
        sectorId: sector.id,
        row: rowLetter,
        number: seatNum,
        x: startX + (seatNum - 1) * seatSpacing,
        y: startY + row * rowSpacing,
        price: sector.startingPrice,
        priceCategory: sector.priceCategory,
        status: randomStatus > 0.6 ? 'unavailable' : 'available',
        accessible: isAccessible,
        limitedView: isLimitedView,
        note: isLimitedView ? 'Limited view' : undefined
      });
    }
  }

  return seats;
};

export function SeatDetailView({
  sector,
  zoom,
  pan,
  onPanChange,
  selectedSeats,
  onSeatsChange,
  filters
}: SeatDetailViewProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [preReservingSeat, setPreReservingSeat] = useState<string | null>(null);
  const [orphanWarning, setOrphanWarning] = useState<string | null>(null);

  useEffect(() => {
    setSeats(generateSeatsForSector(sector));
  }, [sector]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.seat')) {
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

  const getSeatStatus = (seat: Seat): Seat['status'] => {
    if (preReservingSeat === seat.id) return 'pre-reserving';
    if (selectedSeats.find(s => s.id === seat.id)) return 'selected';
    return seat.status;
  };

  const checkOrphanSeat = (seatId: string, isSelecting: boolean): boolean => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat) return false;

    const sameRow = seats.filter(s => s.row === seat.row);
    const seatIndex = sameRow.findIndex(s => s.id === seatId);

    // Check left neighbor
    const leftSeat = sameRow[seatIndex - 1];
    const rightSeat = sameRow[seatIndex + 1];

    if (isSelecting) {
      // When selecting, check if we'd create an orphan
      const leftIsAvailable = leftSeat && getSeatStatus(leftSeat) === 'available';
      const rightIsAvailable = rightSeat && getSeatStatus(rightSeat) === 'available';
      const leftLeftSeat = sameRow[seatIndex - 2];
      const rightRightSeat = sameRow[seatIndex + 2];

      // Would selecting this seat leave a single available seat on either side?
      if (leftIsAvailable && (!leftLeftSeat || getSeatStatus(leftLeftSeat) !== 'available')) {
        return true;
      }
      if (rightIsAvailable && (!rightRightSeat || getSeatStatus(rightRightSeat) !== 'available')) {
        return true;
      }
    } else {
      // When deselecting, check if we'd create an orphan
      const leftIsSelected = leftSeat && getSeatStatus(leftSeat) === 'selected';
      const rightIsSelected = rightSeat && getSeatStatus(rightSeat) === 'selected';

      if (leftIsSelected && rightIsSelected) {
        // Can't deselect if it would split selected seats
        return true;
      }
    }

    return false;
  };

  const handleSeatClick = async (seat: Seat) => {
    const currentStatus = getSeatStatus(seat);

    if (currentStatus === 'unavailable' || currentStatus === 'pre-reserving') {
      return;
    }

    const isCurrentlySelected = currentStatus === 'selected';

    // Check for orphan seat
    if (checkOrphanSeat(seat.id, !isCurrentlySelected)) {
      setOrphanWarning(`Cannot ${isCurrentlySelected ? 'deselect' : 'select'} this seat as it would leave an orphan seat`);
      setTimeout(() => setOrphanWarning(null), 3000);
      return;
    }

    if (isCurrentlySelected) {
      // Deselect
      onSeatsChange(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      // Pre-reserve
      setPreReservingSeat(seat.id);

      // Simulate API call
      setTimeout(() => {
        setPreReservingSeat(null);

        // Simulate occasional failure
        if (Math.random() > 0.95) {
          setSeats(prev => prev.map(s =>
            s.id === seat.id ? { ...s, status: 'reservation-failed' as const } : s
          ));
          setTimeout(() => {
            setSeats(prev => prev.map(s =>
              s.id === seat.id ? { ...s, status: 'available' as const } : s
            ));
          }, 2000);
        } else {
          onSeatsChange([...selectedSeats, { ...seat, status: 'selected' }]);
        }
      }, 500);
    }
  };

  const isSeatFiltered = (seat: Seat) => {
    if (!filters.categories.includes(seat.priceCategory)) return true;
    if (seat.price < filters.priceRange[0] || seat.price > filters.priceRange[1]) return true;
    if (filters.accessibleOnly && !seat.accessible) return true;
    return false;
  };

  return (
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
      {/* Orphan Warning */}
      {orphanWarning && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            p: 2,
            backgroundColor: '#ff9800',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Warning />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {orphanWarning}
          </Typography>
        </Paper>
      )}

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 400"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s'
        }}
      >
        {/* Stage indicator */}
        <g>
          <rect
            x="200"
            y="20"
            width="200"
            height="50"
            fill="#424242"
            rx="4"
          />
          <text
            x="300"
            y="50"
            textAnchor="middle"
            fill="white"
            fontSize="16"
            fontWeight="bold"
          >
            STAGE
          </text>
        </g>

        {/* Section Label */}
        <text
          x="300"
          y="90"
          textAnchor="middle"
          fill="#666"
          fontSize="14"
          fontWeight="bold"
        >
          {sector.name}
        </text>

        {/* Seats */}
        {seats.map(seat => {
          const status = getSeatStatus(seat);
          const isFiltered = isSeatFiltered(seat);
          const isHovered = hoveredSeat?.id === seat.id;

          let color = seatColors[seat.priceCategory];
          if (status === 'selected') color = '#ffd700';
          else if (status === 'unavailable') color = '#9e9e9e';
          else if (status === 'pre-reserving') color = '#ff9800';
          else if (status === 'reservation-failed') color = '#f44336';
          else if (status === 'reserved-by-other') color = '#e0e0e0';
          else if (isFiltered) color = '#e0e0e0';

          return (
            <g key={seat.id}>
              <circle
                className="seat"
                cx={seat.x}
                cy={seat.y}
                r={isHovered ? 10 : 8}
                fill={color}
                stroke={status === 'selected' ? '#ff6f00' : 'white'}
                strokeWidth={status === 'selected' ? 2 : 1}
                style={{
                  cursor: status === 'unavailable' || isFiltered ? 'not-allowed' : 'pointer',
                  opacity: isFiltered ? 0.3 : status === 'unavailable' ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onClick={() => !isFiltered && handleSeatClick(seat)}
                onMouseEnter={(e) => {
                  setHoveredSeat(seat);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPos({ x: rect.left, y: rect.top });
                }}
                onMouseLeave={() => setHoveredSeat(null)}
              />

              {/* Loading indicator for pre-reserving */}
              {status === 'pre-reserving' && (
                <circle
                  cx={seat.x}
                  cy={seat.y}
                  r="12"
                  fill="none"
                  stroke="#ff9800"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${seat.x} ${seat.y}`}
                    to={`360 ${seat.x} ${seat.y}`}
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Accessible icon */}
              {seat.accessible && (
                <circle
                  cx={seat.x + 6}
                  cy={seat.y - 6}
                  r="4"
                  fill="#2196f3"
                />
              )}

              {/* Limited view warning */}
              {seat.limitedView && (
                <circle
                  cx={seat.x - 6}
                  cy={seat.y - 6}
                  r="4"
                  fill="#ff9800"
                />
              )}
            </g>
          );
        })}

        {/* Row labels */}
        {Array.from(new Set(seats.map(s => s.row))).map((row, idx) => (
          <text
            key={row}
            x="120"
            y={100 + idx * 30 + 5}
            fill="#666"
            fontSize="12"
            fontWeight="600"
          >
            {row}
          </text>
        ))}
      </svg>

      {/* Seat Tooltip */}
      {hoveredSeat && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            left: Math.min(tooltipPos.x + 10, window.innerWidth - 220),
            top: Math.max(20, tooltipPos.y - 60),
            zIndex: 1000,
            p: 1.5,
            backgroundColor: 'rgba(33, 33, 33, 0.95)',
            color: 'white',
            borderRadius: 1,
            pointerEvents: 'none',
            minWidth: 180,
            maxWidth: 200,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
            Row {hoveredSeat.row}, Seat {hoveredSeat.number}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            {hoveredSeat.priceCategory.toUpperCase()} - {hoveredSeat.price} PLN
          </Typography>
          {hoveredSeat.accessible && (
            <Chip
              icon={<Accessible sx={{ fontSize: 12 }} />}
              label="Accessible"
              size="small"
              sx={{ height: 18, fontSize: 10, mb: 0.5 }}
            />
          )}
          {hoveredSeat.limitedView && (
            <Chip
              icon={<Warning sx={{ fontSize: 12 }} />}
              label="Limited View"
              size="small"
              sx={{ height: 18, fontSize: 10, backgroundColor: '#ff9800' }}
            />
          )}
          {hoveredSeat.note && (
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, fontStyle: 'italic' }}>
              {hoveredSeat.note}
            </Typography>
          )}
        </Paper>
      )}

      {/* Legend */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 10,
          p: 1.5
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          Legend
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: seatColors[sector.priceCategory] }} />
            <Typography variant="caption">Available</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffd700' }} />
            <Typography variant="caption">Selected</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#9e9e9e' }} />
            <Typography variant="caption">Unavailable</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Accessible sx={{ fontSize: 14, color: '#2196f3' }} />
            <Typography variant="caption">Accessible</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning sx={{ fontSize: 14, color: '#ff9800' }} />
            <Typography variant="caption">Limited View</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
