import { useEffect } from 'react';
import Box from '@mui/material/Box';

export const PAGE_PX = { xs: 2, sm: 3, lg: 4 };

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Goldstar concept` : 'Goldstar concept';
  }, [title]);
}

// Equal outer margins 16 / 24 / 32, max width 1440 centred.
export function PageBox({ children, sx, component = 'div', ...rest }) {
  return (
    <Box component={component} sx={{ px: PAGE_PX, mx: 'auto', width: '100%', maxWidth: 1440, boxSizing: 'border-box', ...sx }} {...rest}>
      {children}
    </Box>
  );
}

export const visuallyHidden = {
  position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};
