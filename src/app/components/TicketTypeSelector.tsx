import { Box, Chip, Typography, Paper, Stack, IconButton, Tooltip } from '@mui/material';
import { ConfirmationNumber, Star, Weekend, Accessible, FilterAltOff } from '@mui/icons-material';
import type { PriceCategory, VenueFilters } from './VenueMap';

interface TicketType {
  id: PriceCategory | 'accessible' | 'ga';
  name: string;
  price: string;
  color: string;
  icon: React.ReactNode;
  available: number;
}

const ticketTypes: TicketType[] = [
  { id: 'vip', name: 'VIP', price: '299 PLN', color: '#a855f7', icon: <Star />, available: 24 },
  { id: 'premium', name: 'Premium', price: '199 PLN', color: '#7c3aed', icon: <Weekend />, available: 48 },
  { id: 'standard', name: 'Standard', price: '149 PLN', color: '#6b7280', icon: <ConfirmationNumber />, available: 120 },
  { id: 'balcony', name: 'Balcony', price: '99 PLN', color: '#9ca3af', icon: <ConfirmationNumber />, available: 86 },
  { id: 'ga', name: 'Standing GA', price: '79 PLN', color: '#4b5563', icon: <ConfirmationNumber />, available: 156 },
  { id: 'accessible', name: 'Accessible', price: '149 PLN', color: '#c084fc', icon: <Accessible />, available: 12 },
];

const ALL_CATEGORIES: PriceCategory[] = ['vip', 'premium', 'standard', 'balcony', 'ga'];

interface TicketTypeSelectorProps {
  filters: VenueFilters;
  onFiltersChange: (next: VenueFilters) => void;
}

function isActive(type: TicketType, filters: VenueFilters) {
  if (type.id === 'accessible') return filters.accessibleOnly;
  const onlyThisCategory =
    filters.categories.length === 1 && filters.categories[0] === type.id && !filters.accessibleOnly;
  return onlyThisCategory;
}

export function TicketTypeSelector({ filters, onFiltersChange }: TicketTypeSelectorProps) {
  const allCategoriesSelected =
    filters.categories.length === ALL_CATEGORIES.length && !filters.accessibleOnly;

  const handleClick = (type: TicketType) => {
    if (type.id === 'accessible') {
      onFiltersChange({ ...filters, accessibleOnly: !filters.accessibleOnly });
      return;
    }
    const cat = type.id as PriceCategory;
    if (isActive(type, filters)) {
      onFiltersChange({ ...filters, categories: ALL_CATEGORIES, accessibleOnly: false });
      return;
    }
    onFiltersChange({ ...filters, categories: [cat], accessibleOnly: false });
  };

  const resetAll = () =>
    onFiltersChange({ ...filters, categories: ALL_CATEGORIES, accessibleOnly: false });

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 1.5, md: 3 },
        mb: 2,
        backgroundColor: '#f4f4f5',
        color: '#0a0a0a',
        border: '1px solid #d4d4d8',
        borderRadius: 2,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: 15, md: 18 } }}>
          Select ticket type
        </Typography>
        {!allCategoriesSelected && (
          <Tooltip title="Show all ticket types">
            <IconButton size="small" onClick={resetAll} sx={{ color: '#7c3aed' }}>
              <FilterAltOff fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.75, md: 1.5 } }}>
        {ticketTypes.map((type) => {
          const active = isActive(type, filters);
          return (
            <Chip
              key={type.id}
              icon={<Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>{type.icon}</Box>}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 }, py: 0.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: 12, md: 14 } }}>
                    {type.name}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85, fontSize: { xs: 10, md: 12 } }}>
                    {type.price}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      backgroundColor: active ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.08)',
                      px: 0.75,
                      py: 0.1,
                      borderRadius: 1,
                      fontSize: { xs: 9, md: 11 },
                    }}
                  >
                    {type.available} left
                  </Typography>
                </Box>
              }
              onClick={() => handleClick(type)}
              sx={{
                backgroundColor: active ? type.color : '#e4e4e7',
                color: active ? 'white' : '#0a0a0a',
                px: { xs: 1, md: 2 },
                py: { xs: 2, md: 3 },
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: active ? type.color : '#d4d4d8',
                  transform: 'translateY(-1px)',
                },
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
}
