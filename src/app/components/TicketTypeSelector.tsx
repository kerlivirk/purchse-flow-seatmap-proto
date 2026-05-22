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
        px: { xs: 1.25, md: 2 },
        py: { xs: 0.75, md: 1 },
        backgroundColor: '#ffffff',
        color: '#11002b',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 12, color: '#5a5062', letterSpacing: 0.5, mr: 0.5, display: { xs: 'none', sm: 'block' } }}>
        TYPE
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, flex: 1 }}>
        <M3Chip
          size="sm"
          selected={allCategoriesSelected}
          leadingIcon={<Box sx={{ display: 'flex', alignItems: 'center', color: allCategoriesSelected ? '#ffffff' : '#11002b' }}><Icon name="thumbnail-view" size={14} /></Box>}
          onClick={resetAll}
          label={<Box component="span" sx={{ fontWeight: 800, fontSize: 12 }}>All</Box>}
        />
        {ticketTypes.map((type) => {
          const active = isActive(type, filters);
          return (
            <M3Chip
              key={type.id}
              size="sm"
              selected={active}
              leadingIcon={<Box sx={{ display: 'flex', alignItems: 'center', color: active ? '#ffffff' : '#11002b' }}>{type.icon}</Box>}
              onClick={() => handleClick(type)}
              label={
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Box component="span" sx={{ fontWeight: 800, fontSize: 12 }}>{type.name}</Box>
                  <Box component="span" sx={{ opacity: 0.65, fontWeight: 600, fontSize: 10 }}>{type.price}</Box>
                </Box>
              }
            />
          );
        })}
      </Box>
      {!allCategoriesSelected && (
        <Tooltip title="Show all ticket types">
          <IconButton size="small" onClick={resetAll} sx={{ color: '#06d373' }}>
            <FilterAltOff fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
