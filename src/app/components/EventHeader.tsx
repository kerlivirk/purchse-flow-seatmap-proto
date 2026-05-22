import { Box, Paper, Stack, Typography } from '@mui/material';
import phantomPoster from '../../assets/phantom-poster.png';
import { M3Chip } from './M3Chip';
import { Icon } from './Icon';

interface EventHeaderProps {
  variant?: 'v1' | 'v2' | 'v3';
}

export function EventHeader({ variant = 'v1' }: EventHeaderProps) {
  if (variant === 'v2' || variant === 'v3') {
    return (
      <Paper
        elevation={0}
        sx={{
          px: { xs: 1.5, md: 2 },
          py: { xs: 1, md: 1.25 },
          backgroundColor: '#ffffff',
          color: '#11002b',
          border: '1px solid #e9e7ed',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            component="img"
            src={phantomPoster}
            alt="Phantom of the Opera — Prezero Arena Gliwice"
            sx={{
              width: { xs: 56, md: 72 },
              height: { xs: 56, md: 72 },
              flexShrink: 0,
              borderRadius: 1,
              objectFit: 'cover',
              border: '1px solid #e9e7ed',
            }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25, flexWrap: 'wrap' }}>
              <Typography
                component="h1"
                sx={{ fontFamily: '"Panel Sans", Mulish, sans-serif', fontWeight: 900, fontSize: { xs: 16, md: 20 }, lineHeight: 1.2, mr: 0.5 }}
                noWrap
              >
                The Phantom of the Opera
              </Typography>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
                <M3Chip label="Musical" size="sm" style="filled" />
                <M3Chip label="18+" size="sm" style="filled" />
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: '#5a5062', flexWrap: 'wrap', rowGap: 0.25 }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Icon name="location-pin-1" size={14} color="#06d373" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>Gliwice Arena</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Icon name="blank-calendar" size={14} color="#06d373" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>Fri, May 29, 2026</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Icon name="circle-clock" size={14} color="#06d373" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>19:00–22:00</Typography>
              </Stack>
            </Stack>
          </Box>

          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                border: '1px solid #e9e7ed',
                bgcolor: '#ffffff',
              }}
            >
              <Icon name="ticket-extra" size={14} color="#06d373" />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#11002b' }}>
                290 left
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    );
  }

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
