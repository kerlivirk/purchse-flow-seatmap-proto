import { Box, Paper, Typography, Button, TextField, Badge } from '@mui/material';
import { ShoppingCart, Stars, Clear } from '@mui/icons-material';
import { useState } from 'react';
import type { SelectedSeat } from './VenueMap';

interface MapToolbarProps {
  selectedSeats: SelectedSeat[];
  totalPrice: number;
  onBestAvailable: (count: number) => void;
  onClearSelection: () => void;
}

export function MapToolbar({ selectedSeats, totalPrice, onBestAvailable, onClearSelection }: MapToolbarProps) {
  const [bestAvailableCount, setBestAvailableCount] = useState(2);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mt: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
        backgroundColor: 'background.paper',
        borderRadius: 2
      }}
    >
      {/* Selected Seats Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        <Badge badgeContent={selectedSeats.length} color="primary">
          <ShoppingCart />
        </Badge>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {totalPrice} PLN
          </Typography>
        </Box>
      </Box>

      {/* Best Available */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          type="number"
          value={bestAvailableCount}
          onChange={(e) => setBestAvailableCount(parseInt(e.target.value) || 1)}
          size="small"
          sx={{ width: 80 }}
          inputProps={{ min: 1, max: 10 }}
        />
        <Button
          variant="outlined"
          startIcon={<Stars />}
          onClick={() => onBestAvailable(bestAvailableCount)}
          size="small"
        >
          Best Available
        </Button>
      </Box>

      {/* Clear Selection */}
      {selectedSeats.length > 0 && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<Clear />}
          onClick={onClearSelection}
          size="small"
        >
          Clear
        </Button>
      )}

      {/* Proceed to Checkout */}
      <Button
        variant="contained"
        disabled={selectedSeats.length === 0}
        size="large"
        sx={{ px: 4 }}
      >
        Proceed to Checkout
      </Button>
    </Paper>
  );
}
