import { Box } from '@mui/material';

/** Brand-navy "STAGE" pill anchored to the left edge of the map area.
 *  Stays visible no matter which sector is zoomed, so users keep their
 *  orientation when the SVG viewBox animates into a single section. */
export function StageMarker() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        left: { xs: 6, md: 10 },
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 4,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          bgcolor: '#11002b',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: { xs: 9, md: 10 },
          letterSpacing: { xs: 3, md: 4 },
          px: { xs: 0.5, md: 0.75 },
          py: { xs: 1.25, md: 1.75 },
          borderRadius: 1,
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          boxShadow: '0 2px 6px rgba(17,0,43,0.18)',
        }}
      >
        STAGE
      </Box>
    </Box>
  );
}
