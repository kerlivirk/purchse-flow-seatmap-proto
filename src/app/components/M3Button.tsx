import type { ReactNode, MouseEvent } from 'react';
import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';

export type M3ButtonType = 'accent' | 'filled' | 'outlined' | 'text';
export type M3ButtonSize = 'xs' | 'sm' | 'md';

interface M3ButtonProps extends Omit<ButtonProps, 'variant' | 'size' | 'color'> {
  buttonType?: M3ButtonType;
  size?: M3ButtonSize;
  rounded?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

const TYPE_STYLES: Record<M3ButtonType, {
  bg: string;
  bgHover: string;
  bgPressed: string;
  bgDisabled: string;
  color: string;
  colorDisabled: string;
  border?: string;
  borderHover?: string;
}> = {
  accent: {
    bg: '#06d373',
    bgHover: '#05b863',
    bgPressed: '#04a058',
    bgDisabled: '#e9e7ed',
    color: '#11002b',
    colorDisabled: '#a09aa8',
  },
  filled: {
    bg: '#11002b',
    bgHover: '#27143e',
    bgPressed: '#3b2a51',
    bgDisabled: '#e9e7ed',
    color: '#ffffff',
    colorDisabled: '#a09aa8',
  },
  outlined: {
    bg: 'transparent',
    bgHover: '#f4f4f5',
    bgPressed: '#e9e7ed',
    bgDisabled: 'transparent',
    color: '#11002b',
    colorDisabled: '#a09aa8',
    border: '#e9e7ed',
    borderHover: '#11002b',
  },
  text: {
    bg: 'transparent',
    bgHover: 'rgba(17,0,43,0.06)',
    bgPressed: 'rgba(17,0,43,0.12)',
    bgDisabled: 'transparent',
    color: '#11002b',
    colorDisabled: '#a09aa8',
  },
};

const SIZE_STYLES: Record<M3ButtonSize, { height: number; px: number; fontSize: number }> = {
  xs: { height: 32, px: 12, fontSize: 12 },
  sm: { height: 40, px: 14, fontSize: 13 },
  md: { height: 48, px: 16, fontSize: 14 },
};

export function M3Button({
  buttonType = 'accent',
  size = 'sm',
  rounded = true,
  startIcon,
  endIcon,
  children,
  sx,
  ...rest
}: M3ButtonProps) {
  const t = TYPE_STYLES[buttonType];
  const s = SIZE_STYLES[size];
  const radius = rounded ? 100 : 8;

  return (
    <Button
      {...rest}
      startIcon={startIcon}
      endIcon={endIcon}
      disableElevation
      sx={{
        height: s.height,
        minHeight: s.height,
        px: `${s.px}px`,
        py: 0,
        fontSize: s.fontSize,
        fontWeight: 700,
        letterSpacing: '0.1px',
        textTransform: 'none',
        borderRadius: `${radius}px`,
        bgcolor: t.bg,
        color: t.color,
        border: t.border ? `1px solid ${t.border}` : 'none',
        boxShadow: 'none',
        '&:hover': {
          bgcolor: t.bgHover,
          borderColor: t.borderHover ?? t.border,
          boxShadow: 'none',
        },
        '&:active': {
          bgcolor: t.bgPressed,
        },
        '&.Mui-disabled': {
          bgcolor: t.bgDisabled,
          color: t.colorDisabled,
          borderColor: t.border ? t.bgDisabled : undefined,
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}
