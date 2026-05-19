import { Box, CircularProgress, Typography, Fade } from '@mui/material';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export function LoadingOverlay({ show, message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <Fade in={show}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)'
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>
          {message}
        </Typography>
      </Box>
    </Fade>
  );
}
