import { useState } from 'react';
import { Box, Chip, Typography, Paper } from '@mui/material';
import { ConfirmationNumber, Star, Weekend, Accessible } from '@mui/icons-material';

interface TicketType {
  id: string;
  name: string;
  price: string;
  color: string;
  icon: React.ReactNode;
  available: number;
}

const ticketTypes: TicketType[] = [
  {
    id: 'vip',
    name: 'VIP',
    price: '299 PLN',
    color: '#9c27b0',
    icon: <Star />,
    available: 24
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '199 PLN',
    color: '#7c3aed',
    icon: <Weekend />,
    available: 48
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '149 PLN',
    color: '#6b7280',
    icon: <ConfirmationNumber />,
    available: 120
  },
  {
    id: 'balcony',
    name: 'Balcony',
    price: '99 PLN',
    color: '#9ca3af',
    icon: <ConfirmationNumber />,
    available: 86
  },
  {
    id: 'accessible',
    name: 'Accessible',
    price: '149 PLN',
    color: '#c084fc',
    icon: <Accessible />,
    available: 12
  }
];

export function TicketTypeSelector() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, md: 3 },
        mb: 2,
        backgroundColor: '#111113',
        color: 'white',
        border: '1px solid #27272a',
        borderRadius: 2
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Select Ticket Type
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        {ticketTypes.map((type) => (
          <Chip
            key={type.id}
            icon={<Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>{type.icon}</Box>}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {type.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {type.price}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1
                  }}
                >
                  {type.available} left
                </Typography>
              </Box>
            }
            onClick={() => setSelectedType(type.id)}
            sx={{
              backgroundColor: selectedType === type.id ? type.color : '#18181b',
              color: 'white',
              px: 2,
              py: 3,
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: selectedType === type.id ? type.color : '#27272a',
                transform: 'translateY(-2px)',
                boxShadow: 2
              },
              '& .MuiChip-icon': {
                color: 'inherit'
              }
            }}
          />
        ))}
      </Box>
    </Paper>
  );
}
