import { Box, Typography, Stack, IconButton, Tooltip } from '@mui/material';
import { FilterAltOff } from '@mui/icons-material';
import type { PriceCategory, VenueFilters } from './VenueMap';
import { M3Chip } from './M3Chip';
import { Icon } from './Icon';

interface TicketType {
  id: PriceCategory | 'accessible' | 'ga';
  name: string;
  price: string;
  color: string;
  icon: React.ReactNode;
  available: number;
}

const ticketTypes: TicketType[] = [
  { id: 'vip', name: 'VIP', price: '299 PLN', color: '#a855f7', icon: <Icon name="star-1" size={16} />, available: 24 },
  { id: 'premium', name: 'Premium', price: '199 PLN', color: '#7c3aed', icon: <Icon name="gift-2" size={16} />, available: 48 },
  { id: 'standard', name: 'Standard', price: '149 PLN', color: '#6b7280', icon: <Icon name="chair-3" size={16} />, available: 120 },
  { id: 'balcony', name: 'Balcony', price: '99 PLN', color: '#9ca3af', icon: <Icon name="few-tickets" size={16} />, available: 86 },
  { id: 'ga', name: 'Standing GA', price: '79 PLN', color: '#4b5563', icon: <Icon name="user-multiple-group" size={16} />, available: 156 },
  { id: 'accessible', name: 'Accessible', price: '149 PLN', color: '#c084fc', icon: <Icon name="house-key-access" size={16} />, available: 12 },
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
    <Box
      sx={{
        p: { xs: 1.5, md: 2.5 },
        backgroundColor: '#ffffff',
        color: '#11002b',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: 15, md: 18 } }}>
          Select ticket type
        </Typography>
        {!allCategoriesSelected && (
          <Tooltip title="Show all ticket types">
            <IconButton size="small" onClick={resetAll} sx={{ color: '#06d373' }}>
              <FilterAltOff fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.75, md: 1 } }}>
        <M3Chip
          size="md"
          selected={allCategoriesSelected}
          leadingIcon={<Box sx={{ display: 'flex', alignItems: 'center', color: allCategoriesSelected ? '#ffffff' : '#11002b' }}><Icon name="thumbnail-view" size={16} /></Box>}
          onClick={resetAll}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, md: 1 } }}>
              <Box component="span" sx={{ fontWeight: 800, fontSize: { xs: 12, md: 14 } }}>All types</Box>
              <Box
                component="span"
                sx={{
                  bgcolor: allCategoriesSelected ? 'rgba(255,255,255,0.18)' : '#f4f2f5',
                  color: allCategoriesSelected ? '#ffffff' : '#5a5062',
                  px: 0.75,
                  py: 0.1,
                  borderRadius: 1,
                  fontSize: { xs: 9, md: 11 },
                  fontWeight: 700,
                }}
              >
                338 total
              </Box>
            </Box>
          }
        />
        {ticketTypes.map((type) => {
          const active = isActive(type, filters);
          return (
            <M3Chip
              key={type.id}
              size="md"
              selected={active}
              leadingIcon={<Box sx={{ display: 'flex', alignItems: 'center', color: active ? '#ffffff' : '#11002b' }}>{type.icon}</Box>}
              onClick={() => handleClick(type)}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, md: 1 } }}>
                  <Box component="span" sx={{ fontWeight: 800, fontSize: { xs: 12, md: 14 } }}>{type.name}</Box>
                  <Box component="span" sx={{ opacity: 0.7, fontWeight: 600, fontSize: { xs: 10, md: 12 } }}>{type.price}</Box>
                  <Box
                    component="span"
                    sx={{
                      bgcolor: active ? 'rgba(255,255,255,0.18)' : '#f4f2f5',
                      color: active ? '#ffffff' : '#5a5062',
                      px: 0.75,
                      py: 0.1,
                      borderRadius: 1,
                      fontSize: { xs: 9, md: 11 },
                      fontWeight: 700,
                    }}
                  >
                    {type.available} left
                  </Box>
                </Box>
              }
            />
          );
        })}
      </Box>
    </Box>
  );
}
