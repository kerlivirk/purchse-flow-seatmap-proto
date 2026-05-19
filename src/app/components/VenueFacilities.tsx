import { Box, Paper, Typography, Chip, IconButton, Collapse } from '@mui/material';
import {
  Restaurant,
  LocalBar,
  Wc,
  LocalParking,
  MeetingRoom,
  ExpandMore,
  ExpandLess,
  Accessible,
  LocalActivity
} from '@mui/icons-material';
import { useState } from 'react';

interface Facility {
  id: string;
  name: string;
  type: 'entrance' | 'toilet' | 'bar' | 'restaurant' | 'parking' | 'vip-lounge';
  x: number;
  y: number;
  accessible?: boolean;
}

const facilities: Facility[] = [
  { id: 'ent-a', name: 'Entrance A', type: 'entrance', x: 100, y: 650 },
  { id: 'ent-b', name: 'Entrance B', type: 'entrance', x: 700, y: 650 },
  { id: 'toilet-1', name: 'Toilets', type: 'toilet', x: 50, y: 400, accessible: true },
  { id: 'toilet-2', name: 'Toilets', type: 'toilet', x: 750, y: 400, accessible: true },
  { id: 'bar-1', name: 'Bar', type: 'bar', x: 150, y: 150 },
  { id: 'bar-2', name: 'Bar', type: 'bar', x: 650, y: 150 },
  { id: 'restaurant-1', name: 'Restaurant', type: 'restaurant', x: 400, y: 80 },
  { id: 'vip-1', name: 'VIP Lounge', type: 'vip-lounge', x: 250, y: 550 },
  { id: 'parking-1', name: 'Parking', type: 'parking', x: 400, y: 50 },
];

const facilityIcons = {
  entrance: MeetingRoom,
  toilet: Wc,
  bar: LocalBar,
  restaurant: Restaurant,
  parking: LocalParking,
  'vip-lounge': LocalActivity
};

const facilityColors = {
  entrance: '#2196f3',
  toilet: '#ff9800',
  bar: '#9c27b0',
  restaurant: '#f44336',
  parking: '#4caf50',
  'vip-lounge': '#ffd700'
};

interface VenueFacilitiesProps {
  show: boolean;
}

export function VenueFacilities({ show }: VenueFacilitiesProps) {
  if (!show) return null;

  return (
    <g>
      {facilities.map(facility => {
        const Icon = facilityIcons[facility.type];
        const color = facilityColors[facility.type];

        return (
          <g key={facility.id}>
            {/* Facility marker */}
            <circle
              cx={facility.x}
              cy={facility.y}
              r="12"
              fill={color}
              opacity="0.9"
              stroke="white"
              strokeWidth="2"
            />
            <foreignObject
              x={facility.x - 8}
              y={facility.y - 8}
              width="16"
              height="16"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Icon style={{ fontSize: 12, color: 'white' }} />
              </div>
            </foreignObject>

            {/* Accessible icon */}
            {facility.accessible && (
              <circle
                cx={facility.x + 10}
                cy={facility.y - 10}
                r="5"
                fill="#2196f3"
                stroke="white"
                strokeWidth="1"
              />
            )}

            {/* Label */}
            <text
              x={facility.x}
              y={facility.y + 25}
              textAnchor="middle"
              fill="#666"
              fontSize="11"
              fontWeight="600"
            >
              {facility.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function FacilitiesLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: { xs: 8, md: 16 },
        left: { xs: 8, md: 16 },
        zIndex: 10,
        maxWidth: 200,
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Facilities
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {Object.entries(facilityIcons).map(([type, Icon]) => (
            <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon sx={{ fontSize: 16, color: facilityColors[type as keyof typeof facilityColors] }} />
              <Typography variant="caption">
                {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, pt: 0.5, borderTop: 1, borderColor: 'divider' }}>
            <Accessible sx={{ fontSize: 16, color: '#2196f3' }} />
            <Typography variant="caption">Accessible</Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
