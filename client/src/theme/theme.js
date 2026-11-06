import { createTheme } from '@mui/material/styles';
import { tokens as t, motionTokens as m, chipTones, FONT_STACK } from './tokens.js';

const stretch = (w) => ({ fontStretch: `${w}%`, fontVariationSettings: `"wdth" ${w}` });

const type = (size, weight, w, lh, ls, extra = {}) => ({
  fontFamily: FONT_STACK, textTransform: 'none', fontSize: size, fontWeight: weight, lineHeight: lh, letterSpacing: ls, ...stretch(w), ...extra,
});

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: t.ground, paper: t.surface1 },
    primary: { main: t.gold, light: t.goldLight, dark: t.goldDark, contrastText: t.onGold },
    secondary: { main: t.blue, light: t.blueLight, dark: t.blueDark, contrastText: t.white },
    error: { main: t.error },
    success: { main: t.success },
    warning: { main: t.warning },
    info: { main: t.info },
    text: { primary: t.ink, secondary: t.inkSecondary, disabled: t.inkDisabled },
    divider: t.divider,
  },
  shape: { borderRadius: 0 },
  spacing: 8,
  transitions: {
    duration: { shortest: m.press, shorter: m.hover, short: m.ui, standard: m.ui, complex: m.drawer, enteringScreen: m.drawer, leavingScreen: 220 },
    easing: { easeInOut: m.css.easeInOut, easeOut: m.css.easeOut, easeIn: m.css.easeExit, sharp: m.css.easeExit },
  },
  typography: {
    fontFamily: FONT_STACK,
    h1: type('clamp(44px, 6.5vw, 104px)', 600, 115, 0.95, '-0.03em', { textTransform: 'uppercase', color: t.gold }),
    h2: type('clamp(34px, 4.6vw, 76px)', 600, 112, 1, '-0.025em', { textTransform: 'uppercase', color: t.gold }),
    h3: type('clamp(24px, 2.2vw, 32px)', 600, 100, 1.15, '-0.01em'),
    h4: type('22px', 600, 100, 1.2, 0),
    h5: type('18px', 600, 88, 1.3, 0),
    h6: type('16px', 600, 100, 1.4, 0),
    body1: type('17px', 400, 100, 1.6, 0),
    body2: type('15px', 400, 100, 1.55, 0),
    subtitle1: type('17px', 400, 100, 1.6, 0),
    subtitle2: type('15px', 600, 100, 1.5, 0),
    button: type('17px', 600, 105, 1, '0.01em'),
    caption: type('14px', 400, 100, 1.45, 0),
    overline: type('14px', 400, 100, 1.45, 0),
    display: type('clamp(44px, 6.5vw, 104px)', 600, 115, 0.95, '-0.03em', { textTransform: 'uppercase', color: t.gold }),
    price: type('clamp(28px, 3vw, 44px)', 600, 100, 1, '-0.01em', { fontVariantNumeric: 'tabular-nums' }),
  },
  components: {
    MuiTypography: { defaultProps: { variantMapping: { display: 'h1', price: 'p' } } },
    MuiCssBaseline: {
      styleOverrides: {
        html: { colorScheme: 'dark' },
        body: { backgroundColor: t.ground, color: t.ink, WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', overflowX: 'clip' },
        '::selection': { backgroundColor: t.gold, color: t.onGold },
        ':focus-visible': { outline: `2px solid ${t.goldLight}`, outlineOffset: 2 },
        'img, svg, canvas': { display: 'block' },
        'input:-webkit-autofill': { WebkitBoxShadow: `0 0 0 100px ${t.surface2} inset`, WebkitTextFillColor: t.ink, caretColor: t.ink },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': { animationDuration: '0.01ms !important', animationIterationCount: '1 !important', transitionDuration: '0.01ms !important', scrollBehavior: 'auto !important' },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 0, minHeight: 48, padding: '0 24px', textTransform: 'none',
          transition: `background-color ${m.hover}ms ease, transform ${m.press}ms ease, border-color ${m.hover}ms ease`,
          '&:active': { transform: 'scale(0.98)' },
          '& .MuiTouchRipple-child': { backgroundColor: t.goldRipple },
          '&.Mui-disabled': { backgroundColor: t.surface2, color: t.inkDisabled },
        },
        sizeLarge: { minHeight: 56 },
        containedPrimary: { backgroundColor: t.gold, color: t.onGold, '&:hover': { backgroundColor: t.goldLight }, '&:active': { backgroundColor: t.goldDark } },
        outlined: { border: `2px solid ${t.goldBorder}`, color: t.gold, '&:hover': { border: `2px solid ${t.gold}`, backgroundColor: t.goldHoverWash } },
        text: { color: t.gold, '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 4 } },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 0, minWidth: 44, minHeight: 44, color: t.ink, '&:hover': { backgroundColor: t.surface2 } } },
    },
    MuiTextField: { defaultProps: { variant: 'outlined' } },
    MuiInputLabel: { styleOverrides: { root: { color: t.inkSecondary, '&.Mui-focused': { color: t.gold }, '&.Mui-error': { color: t.error } } } },
    MuiFormHelperText: { styleOverrides: { root: { fontSize: 14, marginLeft: 0, marginTop: 6 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0, backgroundColor: t.surface2, fontSize: 17,
          '& .MuiOutlinedInput-notchedOutline': { border: `1px solid ${t.fieldBorder}` },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.fieldBorderHover },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: `2px solid ${t.gold}` },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: t.error },
        },
        input: { height: 52, padding: '0 14px', boxSizing: 'border-box' },
        inputMultiline: { height: 'auto', padding: 0 },
      },
    },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundColor: t.surface1, borderRadius: 0, border: 0, boxShadow: 'none', backgroundImage: 'none' } } },
    MuiCardActionArea: {
      styleOverrides: { root: { '&:hover': { backgroundColor: t.surface2 }, '&.Mui-focusVisible': { outline: `2px solid ${t.goldLight}`, outlineOffset: -4 } } },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: t.surface1, boxShadow: t.shadowFloat, border: 0, backgroundImage: 'none' } } },
    MuiBackdrop: { styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: t.scrim } } } },
    MuiDialog: { styleOverrides: { paper: { backgroundColor: t.surface1, borderRadius: 0, boxShadow: t.shadowFloat, backgroundImage: 'none' } } },
    MuiDialogTitle: { styleOverrides: { root: { ...type('22px', 600, 100, 1.2, 0), padding: '32px 32px 8px' } } },
    MuiDialogContent: { styleOverrides: { root: { padding: '8px 32px' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '16px 32px 32px', gap: 8 } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${t.divider}`, padding: '12px 16px', fontSize: 15, color: t.ink },
        head: { fontSize: 14, fontWeight: 600, color: t.inkSecondary, backgroundColor: 'transparent' },
        alignRight: { fontVariantNumeric: 'tabular-nums' },
      },
    },
    MuiTableRow: { styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: t.surface2 }, '&.Mui-selected': { backgroundColor: t.surface3 } } } },
    MuiChip: { styleOverrides: { root: { height: 26, borderRadius: 13, fontSize: 13, fontWeight: 600 }, label: { padding: '0 10px' } } },
    MuiAppBar: {
      defaultProps: { position: 'sticky', elevation: 0 },
      styleOverrides: { root: { backgroundColor: t.ground, backgroundImage: 'none', boxShadow: 'none', borderBottom: 0, color: t.ink } },
    },
    MuiToolbar: { styleOverrides: { root: { minHeight: 56, '@media (min-width:600px)': { minHeight: 64 } } } },
    MuiBadge: { styleOverrides: { badge: { backgroundColor: t.gold, color: t.onGold, fontSize: 12, fontWeight: 700 } } },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 0, minWidth: 48, minHeight: 48, border: `1px solid ${t.fieldBorder}`, color: t.ink, textTransform: 'none', fontSize: 17, fontWeight: 600,
          '&:hover': { backgroundColor: t.surface2 },
          '&.Mui-selected': { border: `2px solid ${t.gold}`, color: t.gold, backgroundColor: t.goldWash, '&:hover': { backgroundColor: t.goldWash } },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { gap: 8, flexWrap: 'wrap' },
        grouped: {
          borderRadius: 0, border: `1px solid ${t.fieldBorder}`,
          '&:not(:first-of-type)': { marginLeft: 0, borderLeft: `1px solid ${t.fieldBorder}`, borderRadius: 0 },
          '&:not(:last-of-type)': { borderRadius: 0 },
          '&.Mui-selected, &.Mui-selected:not(:first-of-type)': { border: `2px solid ${t.gold}` },
        },
      },
    },
    MuiPopover: { styleOverrides: { paper: { backgroundColor: t.surface3, borderRadius: 0, boxShadow: t.shadowMenu } } },
    MuiMenu: { styleOverrides: { paper: { backgroundColor: t.surface3, borderRadius: 0, boxShadow: t.shadowMenu } } },
    MuiAlert: {
      styleOverrides: {
        root: { backgroundColor: t.surface2, color: t.ink, borderRadius: 0, borderLeft: '4px solid', alignItems: 'center' },
        standardError: { borderLeftColor: t.error, '& .MuiAlert-icon': { color: t.error } },
        standardInfo: { borderLeftColor: t.blueLight, '& .MuiAlert-icon': { color: t.blueLight } },
        standardSuccess: { borderLeftColor: t.success, '& .MuiAlert-icon': { color: t.success } },
        standardWarning: { borderLeftColor: t.warning, '& .MuiAlert-icon': { color: t.warning } },
      },
    },
    MuiSnackbarContent: { styleOverrides: { root: { backgroundColor: t.surface3, color: t.ink, borderRadius: 0, boxShadow: t.shadowMenu } } },
    MuiSkeleton: { defaultProps: { animation: 'wave' }, styleOverrides: { root: { backgroundColor: t.surface2 } } },
    MuiTabs: { styleOverrides: { root: { minHeight: 44 }, indicator: { height: 2, backgroundColor: t.gold } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontSize: 15, fontWeight: 600, minHeight: 44, color: t.inkSecondary, '&.Mui-selected': { color: t.gold } } } },
    MuiLink: { defaultProps: { underline: 'hover' }, styleOverrides: { root: { color: t.gold, textUnderlineOffset: 4, textDecorationThickness: 2 } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: t.surface3, color: t.ink, fontSize: 14, borderRadius: 0 }, arrow: { color: t.surface3 } } },
    MuiPaginationItem: { styleOverrides: { root: { borderRadius: 0, minWidth: 44, height: 44, fontSize: 16, '&.Mui-selected': { backgroundColor: t.goldWash, border: `2px solid ${t.gold}`, color: t.gold } } } },
    MuiAccordion: { styleOverrides: { root: { backgroundColor: t.surface1, borderRadius: 0, boxShadow: 'none', backgroundImage: 'none', '&:before': { display: 'none' }, border: `1px solid ${t.divider}`, '&.Mui-expanded': { margin: 0 } } } },
    MuiSwitch: { styleOverrides: { switchBase: { '&.Mui-checked': { color: t.gold }, '&.Mui-checked + .MuiSwitch-track': { backgroundColor: t.gold } } } },
  },
});

export const statusChipSx = (status) => {
  const c = chipTones[status] || chipTones.placed;
  return { backgroundColor: c.bg, color: c.fg };
};
