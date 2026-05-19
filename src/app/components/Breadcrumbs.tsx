import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        sx={{
          '& .MuiBreadcrumbs-separator': {
            mx: 1
          }
        }}
      >
        <Link
          component="button"
          onClick={items[0]?.onClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'primary.main',
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          <Home sx={{ fontSize: 18 }} />
          <Typography variant="body2">Venue</Typography>
        </Link>

        {items.slice(1).map((item, index) => {
          const isLast = index === items.length - 2;

          if (isLast) {
            return (
              <Typography
                key={index}
                variant="body2"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              component="button"
              onClick={item.onClick}
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              <Typography variant="body2">{item.label}</Typography>
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}
