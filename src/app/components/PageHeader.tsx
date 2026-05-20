import type { ReactNode } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Icon } from './Icon';

interface PageHeaderProps {
  breadcrumb?: string;
  title?: ReactNode;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({
  breadcrumb = '.../List of events',
  title = (
    <>
      <Box component="span" sx={{ color: '#002b1a' }}>Programme</Box>
      <Box component="span" sx={{ color: '#11002b' }}> of events</Box>
    </>
  ),
  description = 'This is a detailed description that provides insights and information about the subject at hand.',
  actions,
}: PageHeaderProps) {
  return (
    <Stack
      direction="column"
      spacing={2}
      sx={{
        px: { xs: 2, md: 4 },
        py: { xs: 1.5, md: 2 },
        width: '100%',
        bgcolor: '#ffffff',
      }}
    >
      {breadcrumb && (
        <Typography
          sx={{
            color: '#6d5f79',
            fontWeight: 500,
            fontSize: 16,
            lineHeight: '24px',
            letterSpacing: '0.15px',
          }}
        >
          {breadcrumb}
        </Typography>
      )}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2, md: 5 }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        sx={{ width: '100%' }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              color: '#11002b',
              fontFamily: 'Inter, "Panel Sans", Roboto, sans-serif',
              fontSize: 32,
              fontWeight: 900,
              lineHeight: '40px',
              mb: 1,
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{
                color: '#6d5f79',
                fontSize: 18,
                lineHeight: '28px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {description}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexShrink: 0 }}>
          {actions ?? (
            <>
              <Button
                variant="contained"
                startIcon={<Icon name="add-1" size={18} />}
                sx={{
                  bgcolor: '#06d373',
                  color: '#11002b',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '100px',
                  px: 2,
                  py: 1.25,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#05b863', boxShadow: 'none' },
                }}
              >
                Create
              </Button>
              <Button
                variant="outlined"
                endIcon={<Icon name="tailless-line-arrow-down-5" size={16} />}
                sx={{
                  borderColor: '#e9e7ed',
                  color: '#11002b',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '8px',
                  px: 2,
                  py: 1,
                  '&:hover': { borderColor: '#11002b', bgcolor: '#fafafa' },
                }}
              >
                Actions
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
