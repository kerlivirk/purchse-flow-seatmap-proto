import type { ChangeEvent, KeyboardEvent } from 'react';
import { Box, InputBase } from '@mui/material';
import { Icon } from './Icon';

interface SearchFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  width?: number | string;
  sx?: object;
}

const SIZES: Record<NonNullable<SearchFieldProps['size']>, { height: number; iconSize: number; fontSize: number }> = {
  sm: { height: 36, iconSize: 18, fontSize: 13 },
  md: { height: 44, iconSize: 20, fontSize: 14 },
};

export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  size = 'md',
  fullWidth = true,
  width,
  sx,
}: SearchFieldProps) {
  const s = SIZES[size];
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        height: s.height,
        px: 1.5,
        border: '1px solid #e9e7ed',
        borderRadius: '8px',
        bgcolor: '#ffffff',
        width: fullWidth ? '100%' : width,
        transition: 'border-color 120ms',
        '&:focus-within': { borderColor: '#11002b' },
        '&:hover': { borderColor: '#11002b' },
        ...sx,
      }}
    >
      <Icon name="search-plus" size={s.iconSize} color="#5a5062" />
      <InputBase
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' && onSubmit) onSubmit((e.target as HTMLInputElement).value);
        }}
        placeholder={placeholder}
        sx={{
          flex: 1,
          color: '#11002b',
          fontSize: s.fontSize,
          fontWeight: 600,
          '& input': { p: 0 },
          '& input::placeholder': { color: '#84738f', opacity: 1, fontWeight: 500 },
        }}
      />
    </Box>
  );
}
