import { Box, Paper, Typography } from '@mui/material';
import phantomPoster from '../../assets/phantom-poster.png';
import { M3Chip } from './M3Chip';
import { Icon } from './Icon';

export function EventHeader() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        backgroundColor: '#ffffff',
        color: '#11002b',
        border: '1px solid #e9e7ed',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Event Poster */}
        <Box
          component="img"
          src={phantomPoster}
          alt="Phantom of the Opera — Prezero Arena Gliwice"
          sx={{
            width: { xs: '100%', md: 280 },
            height: { xs: 'auto', md: 250 },
            flexShrink: 0,
            borderRadius: 2,
            objectFit: 'cover',
            display: 'block',
            border: '1px solid #e9e7ed',
          }}
        />

        {/* Event Details */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
            <M3Chip label="Musical" size="sm" style="filled" />
            <M3Chip label="18+" size="sm" style="filled" />
            <M3Chip label="English" size="sm" style="outlined" />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            The Phantom of the Opera
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Andrew Lloyd Webber's mesmerizing musical masterpiece. Experience the haunting tale of love, obsession, and mystery beneath the Paris Opera House.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Icon name="location-pin-1" size={20} color="#06d373" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Gliwice Arena
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ul. Akademicka 50, 44-100 Gliwice, Poland
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Icon name="blank-calendar" size={20} color="#06d373" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Friday, May 29, 2026
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Doors open at 18:30
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Icon name="circle-clock" size={20} color="#06d373" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  19:00 - 22:00
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Duration: ~3 hours (including intermission)
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Icon name="ticket-extra" size={20} color="#06d373" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  290 tickets remaining
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last updated: 2 minutes ago
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
