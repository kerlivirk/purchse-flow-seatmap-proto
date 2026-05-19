import { Box, Paper, Typography, Chip, LinearProgress, IconButton, Collapse } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useState } from 'react';

interface PriceCategory {
  name: string;
  color: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  availability: number;
  total: number;
}

const priceCategories: PriceCategory[] = [
  { name: 'VIP', color: '#9c27b0', minPrice: 299, maxPrice: 349, avgPrice: 315, availability: 74, total: 144 },
  { name: 'Premium', color: '#f44336', minPrice: 199, maxPrice: 249, avgPrice: 215, availability: 195, total: 320 },
  { name: 'Standard', color: '#2196f3', minPrice: 149, maxPrice: 179, avgPrice: 159, availability: 312, total: 480 },
  { name: 'Balcony', color: '#4caf50', minPrice: 99, maxPrice: 129, avgPrice: 109, availability: 238, total: 320 }
];

export function PriceComparison() {
  const [expanded, setExpanded] = useState(true);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: { xs: 80, md: 16 },
        right: { xs: 8, md: 16 },
        zIndex: 10,
        minWidth: { xs: 280, md: 300 },
        maxWidth: { xs: 'calc(100vw - 32px)', md: 340 },
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Price Overview
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {priceCategories.map(category => {
          const availabilityPercent = (category.availability / category.total) * 100;
          const trend = availabilityPercent > 60 ? 'high' : availabilityPercent > 30 ? 'medium' : 'low';

          return (
            <Box key={category.name}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: category.color
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {category.name}
                  </Typography>
                </Box>
                <Chip
                  label={`${category.minPrice} PLN`}
                  size="small"
                  sx={{
                    backgroundColor: category.color,
                    color: 'white',
                    fontWeight: 600,
                    height: 22
                  }}
                />
              </Box>

              <Box sx={{ mb: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={availabilityPercent}
                  sx={{
                    height: 6,
                    borderRadius: 1,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: trend === 'high' ? '#4caf50' : trend === 'medium' ? '#ff9800' : '#f44336',
                      borderRadius: 1
                    }
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {category.availability} / {category.total} seats
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {trend === 'high' && <TrendingUp sx={{ fontSize: 14, color: '#4caf50' }} />}
                  {trend === 'medium' && <TrendingFlat sx={{ fontSize: 14, color: '#ff9800' }} />}
                  {trend === 'low' && <TrendingDown sx={{ fontSize: 14, color: '#f44336' }} />}
                  <Typography variant="caption" color="text.secondary">
                    {availabilityPercent.toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}

        <Box
          sx={{
            mt: 1,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Total Available
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {priceCategories.reduce((sum, cat) => sum + cat.availability, 0)} seats
          </Typography>
        </Box>
      </Box>
      </Collapse>
    </Paper>
  );
}
