import { createTheme } from '@mui/material/styles';
import { shop as s, motionTokens as m, FONT_STACK } from './tokens.js';

// Light commerce theme (Shop, Product, Cart, Checkout, Account, auth pages). Same type family and motion as the story;
// Archivo 800 at 112 % width for display, pill controls, soft radii, warm off-white ground.
const stretch = (w) => ({ fontStretch: `${w}%`, fontVariationSettings: `"wdth" ${w}` });
const type = (size, weight, w, lh, ls, extra = {}) => ({
  fontFamily: FONT_STACK, textTransform: 'none', fontSize: size, fontWeight: weight, lineHeight: lh, letterSpacing: ls, ...stretch(w), ...extra,
});
const focusRing = { outline: `3px solid ${s.blue}`, outlineOffset: 2 };

export const shopTheme = createTheme({
  palette: {
    mode: 'light',
    background: { default: s.ground, paper: s.surface },
    primary: { main: s.blue, light: '#5D5BFF', dark: s.bluePress, contrastText: '#FFFFFF' },
    secondary: { main: s.ink, light: '#3A332B', dark: '#000000', contrastText: '#FFFFFF' },
    error: { main: s.error },
    success: { main: s.success },
    warning: { main: '#9A5B00' },
    info: { main: s.blue },
    text: { primary: s.ink, secondary: s.ink2, disabled: 'rgba(22,18,14,0.38)' },
    divider: s.line,
  },
  shape: { borderRadius: s.radius.md },
  spacing: 8,
  transitions: {
    duration: { shortest: m.press, shorter: m.hover, short: m.ui, standard: m.ui, complex: m.drawer, enteringScreen: m.drawer, leavingScreen: 220 },
    easing: { easeInOut: m.css.easeInOut, easeOut: m.css.easeOut, easeIn: m.css.easeExit, sharp: m.css.easeExit },
  },
  typography: {
    fontFamily: FONT_STACK,
    h1: type('clamp(40px, 6vw, 88px)', 800, 112, 0.94, '-0.03em', { textTransform: 'uppercase' }),
    h2: type('clamp(28px, 3vw, 40px)', 800, 112, 1, '-0.02em'),
    h3: type('clamp(24px, 2.4vw, 32px)', 800, 112, 1.05, '-0.02em'),
    h4: type('22px', 800, 108, 1.15, '-0.01em'),
    h5: type('18px', 700, 104, 1.25, 0),
    h6: type('16px', 700, 100, 1.35, 0),
    body1: type('16px', 400, 100, 1.6, 0),
    body2: type('15px', 400, 100, 1.5, 0),
    subtitle1: type('16px', 600, 100, 1.5, 0),
    subtitle2: type('14px', 700, 100, 1.45, 0),
    button: type('16px', 700, 104, 1, '0.005em'),
    caption: type('13px', 400, 100, 1.45, 0),
    overline: type('12px', 800, 108, 1.3, '0.1em', { textTransform: 'uppercase' }),
    display: type('clamp(40px, 6vw, 88px)', 800, 112, 0.94, '-0.03em', { textTransform: 'uppercase' }),
    price: type('clamp(26px, 2.6vw, 34px)', 800, 108, 1, '-0.01em', { fontVariantNumeric: 'tabular-nums' }),
  },
  components: {
    MuiTypography: { defaultProps: { variantMapping: { display: 'h1', price: 'p' } } },
    MuiButtonBase: { styleOverrides: { root: { '&.Mui-focusVisible': focusRing } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: s.radius.pill, minHeight: 48, padding: '0 24px', textTransform: 'none', whiteSpace: 'nowrap',
          transition: `background-color ${m.hover}ms ease, color ${m.hover}ms ease, transform ${m.press}ms ${m.css.easeOut}, border-color ${m.hover}ms ease, box-shadow ${m.hover}ms ease`,
          '&:active': { transform: 'scale(0.98)' },
          '&.Mui-disabled': { backgroundColor: s.sunk, color: 'rgba(22,18,14,0.38)' },
        },
        sizeLarge: { minHeight: 56, fontSize: 17, padding: '0 32px' },
        sizeSmall: { minHeight: 40, padding: '0 16px', fontSize: 14 },
        containedPrimary: { backgroundColor: s.blue, color: '#FFFFFF', '&:hover': { backgroundColor: s.blueHover, boxShadow: '0 8px 20px rgba(42,39,233,0.28)' }, '&:active': { backgroundColor: s.bluePress } },
        containedSecondary: { backgroundColor: s.ink, color: '#FFFFFF', '&:hover': { backgroundColor: '#2C261F' } },
        outlined: { border: `2px solid ${s.lineInk}`, color: s.ink, '&:hover': { border: `2px solid ${s.ink}`, backgroundColor: s.ink, color: '#FFFFFF' } },
        text: { color: s.ink, padding: '0 12px', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 5 } },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: s.radius.pill, minWidth: 44, minHeight: 44, color: s.ink, '&:hover': { backgroundColor: s.sunk } } },
    },
    MuiTextField: { defaultProps: { variant: 'outlined' } },
    MuiInputLabel: { styleOverrides: { root: { color: s.ink2, '&.Mui-focused': { color: s.blue }, '&.Mui-error': { color: s.error } } } },
    MuiFormHelperText: { styleOverrides: { root: { fontSize: 14, marginLeft: 4, marginTop: 6 } } },
    // Phones: every text field is at least 16px (smaller makes iOS zoom the page on focus). Scoped to phones, so
    // desktop input sizes stay as they are.
    MuiInputBase: {
      styleOverrides: {
        input: { '@media (max-width:899.95px), (max-height:500px) and (orientation:landscape)': { fontSize: 'max(16px, 1em)' } },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: s.radius.md, backgroundColor: s.surface, fontSize: 16,
          '& .MuiOutlinedInput-notchedOutline': { border: `1.5px solid ${s.lineStrong}`, transition: `border-color ${m.hover}ms ease` },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(22,18,14,0.45)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: `2px solid ${s.blue}` },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: s.error },
        },
        input: { height: 54, padding: '0 16px', boxSizing: 'border-box' },
        inputMultiline: { height: 'auto', padding: 0 },
      },
    },
    MuiSelect: { styleOverrides: { icon: { color: s.ink } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundColor: 'transparent', borderRadius: 0, boxShadow: 'none', backgroundImage: 'none' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' }, rounded: { borderRadius: s.radius.lg } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: s.ground, boxShadow: s.shadowFloat, border: 0, backgroundImage: 'none' } } },
    MuiBackdrop: { styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: s.scrim, backdropFilter: 'blur(2px)' } } } },
    MuiDialog: { styleOverrides: { paper: { backgroundColor: s.surface, borderRadius: s.radius.xl, boxShadow: s.shadowFloat, backgroundImage: 'none' } } },
    MuiDialogTitle: { styleOverrides: { root: { ...type('22px', 800, 108, 1.2, 0), padding: '28px 28px 8px' } } },
    MuiDialogContent: { styleOverrides: { root: { padding: '8px 28px' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '16px 28px 28px', gap: 8 } } },
    MuiTableCell: {
      styleOverrides: {
        // Touch: a link in a cell (the account's "View" order link) gets a 44 px hit band without changing the row height.
        root: { borderBottom: `1px solid ${s.line}`, padding: '14px 16px', fontSize: 15, color: s.ink, '@media (pointer: coarse)': { '& a:not(.MuiButtonBase-root)': { display: 'inline-block', paddingBlock: 14, marginBlock: -14, minWidth: 44 } } },
        head: { fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.ink2, backgroundColor: 'transparent' },
        alignRight: { fontVariantNumeric: 'tabular-nums' },
      },
    },
    MuiTableRow: { styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: s.sunk } } } },
    MuiChip: { styleOverrides: { root: { height: 28, borderRadius: s.radius.pill, fontSize: 13, fontWeight: 700 }, label: { padding: '0 12px' } } },
    MuiAppBar: {
      defaultProps: { position: 'sticky', elevation: 0 },
      styleOverrides: { root: { backgroundColor: 'rgba(246,242,234,0.86)', backdropFilter: 'saturate(1.4) blur(14px)', backgroundImage: 'none', boxShadow: `inset 0 -1px 0 ${s.line}`, color: s.ink } },
    },
    MuiToolbar: { styleOverrides: { root: { minHeight: 56, '@media (min-width:600px)': { minHeight: 64 } } } },
    MuiBadge: { styleOverrides: { badge: { backgroundColor: s.blue, color: '#FFFFFF', fontSize: 12, fontWeight: 700 } } },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: s.radius.pill, minWidth: 48, minHeight: 44, border: `1.5px solid ${s.lineStrong}`, color: s.ink, textTransform: 'none', fontSize: 15, fontWeight: 700, padding: '0 16px',
          transition: `background-color ${m.hover}ms ease, color ${m.hover}ms ease, border-color ${m.hover}ms ease`,
          '&:hover': { backgroundColor: s.sunk },
          '&.Mui-selected': { borderColor: s.ink, color: '#FFFFFF', backgroundColor: s.ink, '&:hover': { backgroundColor: '#2C261F' } },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { gap: 8, flexWrap: 'wrap' },
        grouped: {
          borderRadius: s.radius.pill, border: `1.5px solid ${s.lineStrong}`,
          '&:not(:first-of-type)': { marginLeft: 0, borderLeft: `1.5px solid ${s.lineStrong}`, borderRadius: s.radius.pill },
          '&:not(:last-of-type)': { borderRadius: s.radius.pill },
          '&.Mui-selected, &.Mui-selected:not(:first-of-type)': { borderColor: s.ink },
        },
      },
    },
    MuiPopover: { styleOverrides: { paper: { backgroundColor: s.surface, borderRadius: s.radius.lg, boxShadow: s.shadowFloat } } },
    MuiMenu: { styleOverrides: { paper: { backgroundColor: s.surface, borderRadius: s.radius.md, boxShadow: s.shadowFloat, marginTop: 6 } } },
    MuiMenuItem: { styleOverrides: { root: { minHeight: 44, fontSize: 15, fontWeight: 600, borderRadius: s.radius.sm, margin: '0 6px', '&.Mui-selected': { backgroundColor: s.blueWash, color: s.blue } } } },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: s.radius.md, alignItems: 'center', color: s.ink },
        standardError: { backgroundColor: '#FBE9E7', '& .MuiAlert-icon': { color: s.error } },
        standardInfo: { backgroundColor: '#ECEBFF', '& .MuiAlert-icon': { color: s.blue } },
        standardSuccess: { backgroundColor: '#E3F3EC', '& .MuiAlert-icon': { color: s.success } },
        standardWarning: { backgroundColor: '#FFF3D6', '& .MuiAlert-icon': { color: '#9A5B00' } },
      },
    },
    MuiSnackbarContent: { styleOverrides: { root: { backgroundColor: s.ink, color: '#FFFFFF', borderRadius: s.radius.md, boxShadow: s.shadowFloat } } },
    MuiSkeleton: { defaultProps: { animation: 'wave' }, styleOverrides: { root: { backgroundColor: s.sunk, borderRadius: s.radius.sm } } },
    MuiTabs: { styleOverrides: { root: { minHeight: 44 }, indicator: { height: 3, backgroundColor: s.blue } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontSize: 15, fontWeight: 700, minHeight: 44, color: s.ink2, '&.Mui-selected': { color: s.ink } } } },
    MuiLink: { defaultProps: { underline: 'hover' }, styleOverrides: { root: { color: s.blue, fontWeight: 600, textUnderlineOffset: 4, textDecorationThickness: 2 } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: s.ink, color: '#FFFFFF', fontSize: 13, borderRadius: s.radius.sm }, arrow: { color: s.ink } } },
    MuiPaginationItem: { styleOverrides: { root: { borderRadius: s.radius.pill, minWidth: 44, height: 44, fontSize: 15, fontWeight: 700, '&.Mui-selected': { backgroundColor: s.ink, color: '#FFFFFF', '&:hover': { backgroundColor: s.ink } } } } },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: { root: { backgroundColor: 'transparent', borderRadius: 0, boxShadow: 'none', backgroundImage: 'none', borderTop: `1px solid ${s.line}`, '&:last-of-type': { borderBottom: `1px solid ${s.line}`, borderRadius: 0 }, '&:first-of-type': { borderRadius: 0 }, '&:before': { display: 'none' } } },
    },
    MuiAccordionSummary: { styleOverrides: { root: { padding: 0, minHeight: 60 }, content: { margin: '16px 0', fontWeight: 800, fontSize: 16 } } },
    MuiAccordionDetails: { styleOverrides: { root: { padding: '0 0 20px' } } },
    MuiSwitch: { styleOverrides: { switchBase: { '&.Mui-checked': { color: s.blue }, '&.Mui-checked + .MuiSwitch-track': { backgroundColor: s.blue, opacity: 0.5 } } } },
    MuiRadio: { styleOverrides: { root: { color: s.ink2, '&.Mui-checked': { color: s.blue } } } },
    MuiCheckbox: { styleOverrides: { root: { color: s.ink2, '&.Mui-checked': { color: s.blue } } } },
    MuiDivider: { styleOverrides: { root: { borderColor: s.line } } },
  },
});
