import { Box, Paper } from '@mui/material';

interface MinimapProps {
  sectors: any[];
  currentView: 'sector' | 'seat';
  zoom: number;
  pan: { x: number; y: number };
}

export function Minimap({ currentView, zoom, pan }: MinimapProps) {
  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 10,
        width: 150,
        height: 100,
        overflow: 'hidden',
        border: '2px solid',
        borderColor: 'primary.main'
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f5f5f5',
          position: 'relative'
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 150 100">
          {/* Stage indicator */}
          <rect
            x="50"
            y="80"
            width="50"
            height="15"
            fill="#424242"
            rx="2"
          />

          {/* Venue outline */}
          <rect
            x="10"
            y="10"
            width="130"
            height="70"
            fill="none"
            stroke="#2196f3"
            strokeWidth="1"
          />

          {/* Viewport indicator */}
          <rect
            x="30"
            y="25"
            width={50 / zoom}
            height={30 / zoom}
            fill="rgba(33, 150, 243, 0.2)"
            stroke="#2196f3"
            strokeWidth="2"
          />
        </svg>
      </Box>
    </Paper>
  );
}
