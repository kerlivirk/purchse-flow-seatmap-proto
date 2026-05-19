import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Search,
  FilterList,
  Accessible,
  LocalActivity,
  ArrowForward,
  SortByAlpha,
  AttachMoney
} from '@mui/icons-material';
import type { Sector, SelectedSeat } from './VenueMap';

interface ListViewProps {
  onSectorClick: (sector: Sector) => void;
  selectedSeats: SelectedSeat[];
  filters: any;
}

const sectorColors = {
  vip: '#9c27b0',
  premium: '#f44336',
  standard: '#2196f3',
  balcony: '#4caf50'
};

// Mock sectors data - same as SectorView
const generateSectors = (): Sector[] => [
  { id: 'vip-1', name: 'VIP Center', x: 350, y: 450, width: 200, height: 100, rotation: 0, priceCategory: 'vip', startingPrice: 299, totalSeats: 48, availableSeats: 32, isGA: false, accessible: true },
  { id: 'premium-1', name: 'Premium Left', x: 150, y: 400, width: 180, height: 120, rotation: -15, priceCategory: 'premium', startingPrice: 199, totalSeats: 64, availableSeats: 45, isGA: false, accessible: true },
  { id: 'premium-2', name: 'Premium Right', x: 570, y: 400, width: 180, height: 120, rotation: 15, priceCategory: 'premium', startingPrice: 199, totalSeats: 64, availableSeats: 38, isGA: false, accessible: true },
  { id: 'standard-1', name: 'Standard Left', x: 100, y: 250, width: 200, height: 130, rotation: -20, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 72, isGA: false, accessible: false },
  { id: 'standard-2', name: 'Standard Center', x: 320, y: 200, width: 260, height: 140, rotation: 0, priceCategory: 'standard', startingPrice: 149, totalSeats: 120, availableSeats: 85, isGA: false, accessible: true },
  { id: 'standard-3', name: 'Standard Right', x: 600, y: 250, width: 200, height: 130, rotation: 20, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 68, isGA: false, accessible: false },
  { id: 'balcony-1', name: 'Balcony', x: 250, y: 80, width: 400, height: 80, rotation: 0, priceCategory: 'balcony', startingPrice: 99, totalSeats: 144, availableSeats: 118, isGA: false, accessible: true },
  { id: 'ga-standing', name: 'Standing GA', x: 350, y: 580, width: 200, height: 80, rotation: 0, priceCategory: 'standard', startingPrice: 79, totalSeats: 200, availableSeats: 156, isGA: true, accessible: false }
];

export function ListView({ onSectorClick, selectedSeats, filters }: ListViewProps) {
  const [sectors] = useState<Sector[]>(generateSectors());
  const [expandedCategory, setExpandedCategory] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'availability'>('name');
  const [groupBy, setGroupBy] = useState<'category' | 'none'>('category');

  const isSectorFiltered = (sector: Sector) => {
    if (!filters.categories.includes(sector.priceCategory)) return true;
    if (sector.startingPrice < filters.priceRange[0] || sector.startingPrice > filters.priceRange[1]) return true;
    if (filters.accessibleOnly && !sector.accessible) return true;
    if (searchQuery && !sector.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    return false;
  };

  const sortSectors = (a: Sector, b: Sector) => {
    switch (sortBy) {
      case 'price':
        return a.startingPrice - b.startingPrice;
      case 'availability':
        return (b.availableSeats / b.totalSeats) - (a.availableSeats / a.totalSeats);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  };

  const filteredSectors = sectors.filter(s => !isSectorFiltered(s)).sort(sortSectors);

  const groupedSectors = groupBy === 'category'
    ? {
        vip: filteredSectors.filter(s => s.priceCategory === 'vip'),
        premium: filteredSectors.filter(s => s.priceCategory === 'premium'),
        standard: filteredSectors.filter(s => s.priceCategory === 'standard'),
        balcony: filteredSectors.filter(s => s.priceCategory === 'balcony')
      }
    : { all: filteredSectors };

  const getAvailabilityPercentage = (sector: Sector) => {
    return Math.round((sector.availableSeats / sector.totalSeats) * 100);
  };

  const getAvailabilityColor = (percentage: number) => {
    if (percentage > 60) return '#4caf50';
    if (percentage > 30) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* List Controls */}
      <Paper elevation={2} sx={{ p: 2, mb: 1 }}>
        <Stack spacing={2}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />

          {/* Sort and Group Controls */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <MenuItem value="name">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SortByAlpha fontSize="small" />
                    Name
                  </Box>
                </MenuItem>
                <MenuItem value="price">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoney fontSize="small" />
                    Price
                  </Box>
                </MenuItem>
                <MenuItem value="availability">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterList fontSize="small" />
                    Availability
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <ToggleButtonGroup
              value={groupBy}
              exclusive
              onChange={(_, value) => value && setGroupBy(value)}
              size="small"
            >
              <ToggleButton value="category">By Category</ToggleButton>
              <ToggleButton value="none">All</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* Results Count */}
          <Typography variant="caption" color="text.secondary">
            {filteredSectors.length} section{filteredSectors.length !== 1 ? 's' : ''} available
          </Typography>
        </Stack>
      </Paper>

      {/* Sections List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ p: 0 }}>
          {Object.entries(groupedSectors).map(([category, categorySectors], categoryIndex) => {
            if (categorySectors.length === 0) return null;

            const categoryName = category === 'all' ? 'All Sections' : category.charAt(0).toUpperCase() + category.slice(1);
            const categoryColor = category !== 'all' ? sectorColors[category as keyof typeof sectorColors] : '#666';
            const isExpanded = expandedCategory === category;

            return (
              <React.Fragment key={`category-${category}-${categoryIndex}`}>
                {groupBy === 'category' && (
                  <ListItem
                    key={`header-${category}`}
                    sx={{
                      backgroundColor: 'background.paper',
                      borderBottom: 2,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      py: 2,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: `${categoryColor}08`,
                        borderColor: categoryColor
                      }
                    }}
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: categoryColor,
                        mr: 2,
                        boxShadow: `0 2px 8px ${categoryColor}40`
                      }}
                    />
                    <ListItemText
                      primary={categoryName}
                      secondary={`${categorySectors.length} section${categorySectors.length !== 1 ? 's' : ''}`}
                      primaryTypographyProps={{
                        fontWeight: 700,
                        fontSize: '1.1rem'
                      }}
                      secondaryTypographyProps={{
                        fontWeight: 600
                      }}
                    />
                    <IconButton size="small">
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </ListItem>
                )}

                <Collapse in={groupBy === 'none' || isExpanded} timeout="auto">
                  {categorySectors.map((sector, sectorIndex) => {
                    const availabilityPct = getAvailabilityPercentage(sector);

                    return (
                      <Paper
                        key={`sector-${sector.id}-${sectorIndex}`}
                        elevation={0}
                        sx={{
                          m: { xs: 1, md: 1.5 },
                          overflow: 'hidden',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)',
                          position: 'relative',
                          '&:hover': {
                            elevation: 4,
                            transform: 'translateY(-4px)',
                            borderColor: sectorColors[sector.priceCategory],
                            boxShadow: `0 8px 24px ${sectorColors[sector.priceCategory]}20`,
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: 4,
                            height: '100%',
                            backgroundColor: sectorColors[sector.priceCategory],
                            opacity: 0.8
                          }
                        }}
                      >
                        <ListItemButton
                          onClick={() => onSectorClick(sector)}
                          sx={{
                            p: { xs: 2, md: 3 },
                            pl: { xs: 3, md: 4 },
                            '&:hover': {
                              backgroundColor: 'transparent'
                            }
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            {/* Header Section */}
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 700,
                                  mb: 1,
                                  color: 'text.primary',
                                  fontSize: { xs: '1.25rem', md: '1.5rem' }
                                }}
                              >
                                {sector.name}
                              </Typography>

                              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip
                                  label={sector.priceCategory.toUpperCase()}
                                  size="small"
                                  sx={{
                                    backgroundColor: sectorColors[sector.priceCategory],
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    height: 24,
                                    letterSpacing: '0.5px'
                                  }}
                                />
                                {sector.accessible && (
                                  <Chip
                                    icon={<Accessible sx={{ fontSize: 16 }} />}
                                    label="Accessible"
                                    size="small"
                                    sx={{
                                      height: 24,
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                      fontWeight: 600,
                                      '& .MuiChip-icon': {
                                        color: '#1976d2'
                                      }
                                    }}
                                  />
                                )}
                                {sector.isGA && (
                                  <Chip
                                    icon={<LocalActivity sx={{ fontSize: 16 }} />}
                                    label="General Admission"
                                    size="small"
                                    sx={{
                                      height: 24,
                                      backgroundColor: '#f3e5f5',
                                      color: '#7b1fa2',
                                      fontWeight: 600,
                                      '& .MuiChip-icon': {
                                        color: '#7b1fa2'
                                      }
                                    }}
                                  />
                                )}
                              </Stack>
                            </Box>

                            {/* Price Section */}
                            <Box
                              sx={{
                                mb: 2,
                                p: 2,
                                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'rgba(25, 118, 210, 0.12)'
                              }}
                            >
                              <Stack direction="row" spacing={1} alignItems="baseline">
                                <Typography
                                  variant="h4"
                                  sx={{
                                    fontWeight: 800,
                                    color: 'primary.main',
                                    fontSize: { xs: '1.75rem', md: '2rem' }
                                  }}
                                >
                                  {sector.startingPrice}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  PLN
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                  starting price
                                </Typography>
                              </Stack>
                            </Box>

                            {/* Availability Section */}
                            <Box sx={{ mb: 2.5 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                  Availability
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      backgroundColor: getAvailabilityColor(availabilityPct)
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 700,
                                      color: getAvailabilityColor(availabilityPct)
                                    }}
                                  >
                                    {availabilityPct}% available
                                  </Typography>
                                </Box>
                              </Stack>

                              <Box
                                sx={{
                                  width: '100%',
                                  height: 8,
                                  backgroundColor: '#0a0a0a',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  position: 'relative',
                                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${availabilityPct}%`,
                                    height: '100%',
                                    background: `linear-gradient(90deg, ${getAvailabilityColor(availabilityPct)}, ${getAvailabilityColor(availabilityPct)}dd)`,
                                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    borderRadius: 2,
                                    boxShadow: `0 0 8px ${getAvailabilityColor(availabilityPct)}40`
                                  }}
                                />
                              </Box>

                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {sector.availableSeats} of {sector.totalSeats} seats remaining
                              </Typography>
                            </Box>

                            {/* Action Button */}
                            <Button
                              variant="contained"
                              size="large"
                              endIcon={<ArrowForward />}
                              fullWidth
                              sx={{
                                py: 1.5,
                                fontWeight: 700,
                                fontSize: '1rem',
                                textTransform: 'none',
                                boxShadow: 2,
                                '&:hover': {
                                  boxShadow: 4,
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              {sector.isGA ? 'Buy GA Ticket' : 'Select Seats'}
                            </Button>
                          </Box>
                        </ListItemButton>
                      </Paper>
                    );
                  })}
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>

        {filteredSectors.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No sections found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
