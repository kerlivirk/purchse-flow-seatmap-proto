import { Box } from '@mui/material';

interface IconProps {
  /** Glyph name (e.g. "ticket-extra", "chair-3", "filter-text"). Maps to `.sti-{name}` class. */
  name: string;
  /** Font-size in px. Defaults to 20. */
  size?: number;
  /** Color (CSS color). Defaults to currentColor. */
  color?: string;
  /** Inline display. Defaults to 'inline-block'. */
  display?: 'inline-block' | 'block' | 'flex';
  className?: string;
  sx?: object;
}

export function Icon({ name, size = 20, color = 'currentColor', display = 'inline-block', className, sx }: IconProps) {
  return (
    <Box
      component="i"
      aria-hidden="true"
      className={`sti sti-${name}${className ? ` ${className}` : ''}`}
      sx={{
        fontSize: `${size}px`,
        color,
        lineHeight: 1,
        display,
        verticalAlign: display === 'inline-block' ? 'middle' : undefined,
        ...sx,
      }}
    />
  );
}
