import { Box, Button, Drawer, Typography, List, ListItem, ListItemText, Divider, IconButton } from '@mui/material';
import { Close, ShoppingCart } from '@mui/icons-material';

interface MobileCheckoutProps {
  open: boolean;
  onClose: () => void;
  selectedSeats: Array<{
    id: string;
    row: string;
    number: number;
    type: string;
    price: number;
  }>;
}

export function MobileCheckout({ open, onClose, selectedSeats }: MobileCheckoutProps) {
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '80vh'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Selected Seats ({selectedSeats.length})
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {selectedSeats.map((seat, index) => (
            <ListItem key={seat.id} disablePadding sx={{ py: 1 }}>
              <ListItemText
                primary={`Row ${seat.row}, Seat ${seat.number}`}
                secondary={seat.type.toUpperCase()}
              />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {seat.price} PLN
              </Typography>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Total
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {total} PLN
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<ShoppingCart />}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2
          }}
        >
          Continue to Checkout
        </Button>
      </Box>
    </Drawer>
  );
}
