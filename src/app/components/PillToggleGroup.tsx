import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

export interface PillOption<T = string> {
  value: T;
  label: ReactNode;
  /** Optional count badge inside the pill. */
  count?: number | string;
  disabled?: boolean;
}

interface PillToggleGroupProps<T = string> {
  options: PillOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  /** If true, multiple pills can be selected at once (`value` becomes T[]). */
  multiple?: boolean;
  /** Used when multiple=true. */
  values?: T[];
  onValuesChange?: (values: T[]) => void;
  size?: 'sm' | 'md';
  /** Wrap pills in a Figma "Slot": grey rounded container with tight padding. Use for
   *  segmented one-of-N toggles (e.g. view switch). */
  grouped?: boolean;
  sx?: object;
}

const SIZES = {
  sm: { height: 32, px: 12, gap: 8, fontSize: 12, countBg: 18 },
  md: { height: 40, px: 16, gap: 10, fontSize: 13, countBg: 22 },
};

export function PillToggleGroup<T extends string | number = string>({
  options,
  value,
  onChange,
  multiple = false,
  values = [],
  onValuesChange,
  size = 'sm',
  grouped = false,
  sx,
}: PillToggleGroupProps<T>) {
  const s = SIZES[size];
  const isSelected = (v: T) => (multiple ? values.includes(v) : value === v);

  const handle = (v: T) => {
    if (multiple) {
      if (!onValuesChange) return;
      onValuesChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
    } else {
      onChange?.(v);
    }
  };

  return (
    <Stack
      direction="row"
      spacing={grouped ? 0 : 0.75}
      sx={{
        ...(grouped && {
          bgcolor: '#e9e7ed',
          borderRadius: '8px',
          px: '6px',
          py: '4px',
          gap: '4px',
          width: 'fit-content',
        }),
        ...sx,
      }}
    >
      {options.map((opt) => {
        const selected = isSelected(opt.value);
        const dis = opt.disabled;
        return (
          <Box
            key={String(opt.value)}
            onClick={dis ? undefined : () => handle(opt.value)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: `${s.gap}px`,
              height: s.height,
              px: `${s.px}px`,
              borderRadius: 100,
              border: `1px solid ${selected ? '#11002b' : '#e9e7ed'}`,
              bgcolor: selected ? '#11002b' : '#ffffff',
              color: selected ? '#ffffff' : '#11002b',
              cursor: dis ? 'not-allowed' : 'pointer',
              opacity: dis ? 0.5 : 1,
              fontSize: s.fontSize,
              fontWeight: 700,
              transition: 'all 120ms',
              whiteSpace: 'nowrap',
              '&:hover': dis ? {} : {
                bgcolor: selected ? '#27143e' : '#f4f2f5',
              },
            }}
          >
            <Typography component="span" sx={{ fontWeight: 700, fontSize: s.fontSize }}>
              {opt.label}
            </Typography>
            {opt.count !== undefined && (
              <Box
                component="span"
                sx={{
                  minWidth: s.countBg,
                  height: s.countBg,
                  px: 0.75,
                  borderRadius: 100,
                  bgcolor: selected ? 'rgba(255,255,255,0.18)' : '#f4f2f5',
                  color: selected ? '#ffffff' : '#5a5062',
                  fontSize: s.fontSize - 1,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                {opt.count}
              </Box>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
