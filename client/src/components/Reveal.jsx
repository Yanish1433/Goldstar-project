import Box from '@mui/material/Box';
import { motion, useReducedMotion } from 'motion/react';
import { motionTokens } from '../theme/tokens.js';

const MBox = motion.create(Box);

// Entrance for a block as it scrolls into view: rises 20px and fades once. Plain block under reduced motion.
export default function Reveal({ children, delay = 0, sx, component = 'div', ...rest }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <Box component={component} sx={sx} {...rest}>
        {children}
      </Box>
    );
  }
  return (
    <MBox
      component={component}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: motionTokens.reveal / 1000, delay, ease: motionTokens.easeOut }}
      sx={sx}
      {...rest}
    >
      {children}
    </MBox>
  );
}
