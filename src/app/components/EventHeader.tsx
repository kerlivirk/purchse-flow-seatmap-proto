import { Box, Paper, Typography, Chip } from '@mui/material';
import { Event, Place, AccessTime, ConfirmationNumber, TheaterComedy } from '@mui/icons-material';

export function EventHeader() {
  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, md: 3 },
        mb: 2,
        backgroundColor: '#111113',
        color: 'white',
        border: '1px solid #27272a',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Event Poster */}
        <Box
          sx={{
            width: { xs: '100%', md: 200 },
            height: { xs: 150, md: 250 },
            flexShrink: 0,
            borderRadius: 2,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #18181b 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <TheaterComedy sx={{ fontSize: 80, color: 'rgba(255,255,255,0.3)' }} />
          <Typography
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              color: 'white',
              fontWeight: 700,
              fontSize: '1.1rem',
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            PHANTOM
          </Typography>
        </Box>

        {/* Event Details */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label="Musical"
              size="small"
              sx={{ backgroundColor: '#7c3aed', color: 'white' }}
            />
            <Chip
              label="18+"
              size="small"
              sx={{ backgroundColor: '#3f3f46', color: 'white' }}
            />
            <Chip
              label="English"
              size="small"
              variant="outlined"
            />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            The Phantom of the Opera
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Andrew Lloyd Webber's mesmerizing musical masterpiece. Experience the haunting tale of love, obsession, and mystery beneath the Paris Opera House.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Place sx={{ fontSize: 20, color: 'primary.main' }} />
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
              <Event sx={{ fontSize: 20, color: 'primary.main' }} />
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
              <AccessTime sx={{ fontSize: 20, color: 'primary.main' }} />
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
              <ConfirmationNumber sx={{ fontSize: 20, color: 'primary.main' }} />
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
