import { Box, Paper, Typography, Slider, FormGroup, FormControlLabel, Checkbox, Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface MapFiltersProps {
  filters: {
    priceRange: [number, number];
    categories: string[];
    accessibleOnly: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export function MapFilters({ filters, onFiltersChange, onClose }: MapFiltersProps) {
  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    onFiltersChange({ ...filters, priceRange: newValue as [number, number] });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleReset = () => {
    onFiltersChange({
      priceRange: [0, 300],
      categories: ['vip', 'premium', 'standard', 'balcony'],
      accessibleOnly: false
    });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 1,
        backgroundColor: 'background.paper',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Filters
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      {/* Price Range */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Price Range
        </Typography>
        <Slider
          value={filters.priceRange}
          onChange={handlePriceChange}
          valueLabelDisplay="auto"
          min={0}
          max={300}
          valueLabelFormat={(value) => `${value} PLN`}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">{filters.priceRange[0]} PLN</Typography>
          <Typography variant="caption">{filters.priceRange[1]} PLN</Typography>
        </Box>
      </Box>

      {/* Categories */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Ticket Categories
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.categories.includes('vip')}
                onChange={() => handleCategoryToggle('vip')}
                sx={{ '&.Mui-checked': { color: '#9c27b0' } }}
              />
            }
            label="VIP"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.categories.includes('premium')}
                onChange={() => handleCategoryToggle('premium')}
                sx={{ '&.Mui-checked': { color: '#f44336' } }}
              />
            }
            label="Premium"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.categories.includes('standard')}
                onChange={() => handleCategoryToggle('standard')}
                sx={{ '&.Mui-checked': { color: '#2196f3' } }}
              />
            }
            label="Standard"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.categories.includes('balcony')}
                onChange={() => handleCategoryToggle('balcony')}
                sx={{ '&.Mui-checked': { color: '#4caf50' } }}
              />
            }
            label="Balcony"
          />
        </FormGroup>
      </Box>

      {/* Accessible Seats */}
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.accessibleOnly}
              onChange={(e) => onFiltersChange({ ...filters, accessibleOnly: e.target.checked })}
            />
          }
          label="Accessible Seats Only"
        />
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="outlined" onClick={handleReset} size="small" fullWidth>
          Reset
        </Button>
        <Button variant="contained" onClick={onClose} size="small" fullWidth>
          Apply
        </Button>
      </Box>
    </Paper>
  );
}
