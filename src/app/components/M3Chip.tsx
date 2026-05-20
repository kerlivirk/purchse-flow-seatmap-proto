import type { ReactNode, MouseEvent } from 'react';
import { Box, Chip } from '@mui/material';
import { Check } from '@mui/icons-material';

export type M3ChipStyle = 'outlined' | 'elevated' | 'filled' | 'text';
export type M3ChipSize = 'sm' | 'md';

interface M3ChipProps {
  label: ReactNode;
  selected?: boolean;
  /** Visual style when NOT selected. When selected, chip flips to filled dark by default. */
  style?: M3ChipStyle;
  size?: M3ChipSize;
  rounded?: boolean;
  /** Leading icon (e.g. <Add />). When `selected` is true and no leadingIcon is passed, a Check is shown. */
  leadingIcon?: ReactNode;
  /** Trailing icon (e.g. <KeyboardArrowDown />). */
  trailingIcon?: ReactNode;
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  sx?: object;
}

const SIZE_STYLES: Record<M3ChipSize, { height: number; px: number; pxIcon: number; fontSize: number; iconSize: number; gap: number }> = {
  sm: { height: 32, px: 12, pxIcon: 8, fontSize: 13, iconSize: 16, gap: 6 },
  md: { height: 40, px: 16, pxIcon: 10, fontSize: 14, iconSize: 18, gap: 8 },
};

export function M3Chip({
  label,
  selected = false,
  style = 'outlined',
  size = 'sm',
  rounded = false,
  leadingIcon,
  trailingIcon,
  disabled = false,
  onClick,
  sx,
}: M3ChipProps) {
  const s = SIZE_STYLES[size];
  const radius = rounded ? 100 : 8;
  const showLeading = leadingIcon ?? (selected ? <Check sx={{ fontSize: s.iconSize }} /> : null);

  let bg = '#ffffff';
  let bgHover = '#f4f2f5';
  let color = '#11002b';
  let border = '#e9e7ed';

  if (selected) {
    bg = '#11002b';
    bgHover = '#27143e';
    color = '#ffffff';
    border = '#11002b';
  } else if (style === 'filled') {
    bg = '#f4f2f5';
    bgHover = '#e9e7ed';
    border = '#f4f2f5';
  } else if (style === 'elevated') {
    bg = '#ffffff';
    bgHover = '#f4f2f5';
    border = 'transparent';
  } else if (style === 'text') {
    bg = 'transparent';
    bgHover = 'rgba(17,0,43,0.06)';
    border = 'transparent';
  }

  return (
    <Chip
      onClick={onClick}
      disabled={disabled}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${s.gap}px`, lineHeight: 1 }}>
          {showLeading}
          <Box component="span" sx={{ fontWeight: 700, letterSpacing: '0.1px', fontSize: s.fontSize, whiteSpace: 'nowrap' }}>
            {label}
          </Box>
          {trailingIcon}
        </Box>
      }
      sx={{
        height: s.height,
        minHeight: s.height,
        px: `${trailingIcon ? s.pxIcon : s.px}px`,
        paddingLeft: showLeading ? `${s.pxIcon}px` : `${s.px}px`,
        paddingRight: trailingIcon ? `${s.pxIcon}px` : `${s.px}px`,
        borderRadius: `${radius}px`,
        bgcolor: bg,
        color,
        border: `1px solid ${border}`,
        cursor: onClick && !disabled ? 'pointer' : 'default',
        boxShadow: style === 'elevated' && !selected ? '0 1px 2px rgba(17,0,43,0.08)' : 'none',
        transition: 'all 120ms',
        '&:hover': onClick && !disabled ? {
          bgcolor: bgHover,
          borderColor: selected ? '#11002b' : '#11002b',
        } : {},
        '& .MuiChip-label': { px: 0 },
        '&.Mui-disabled': {
          opacity: 0.5,
        },
        ...sx,
      }}
    />
  );
}
