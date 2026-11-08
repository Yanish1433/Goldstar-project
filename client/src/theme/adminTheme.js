import { createTheme } from '@mui/material/styles';
import { adminTones, motionTokens as m, FONT_STACK } from './tokens.js';

// Admin console theme: same family and motion as the shop, tuned for dense work — 40 px controls, 10 px radii,
// Archivo at normal width for UI text (wide only for the KPI figures), tabular numbers in tables.
const stretch = (w) => ({ fontStretch: `${w}%`, fontVariationSettings: `"wdth" ${w}` });
const type = (size, weight, w, lh, ls, extra = {}) => ({
  fontFamily: FONT_STACK, textTransform: 'none', fontSize: size, fontWeight: weight, lineHeight: lh, letterSpacing: ls, ...stretch(w), ...extra,
});

export const ADMIN_RADIUS = 10;

export function makeAdminTheme(mode = 'light') {
  const t = adminTones[mode] || adminTones.light;
  const dark = mode === 'dark';
  const focusRing = { outline: `2px solid ${t.accentText}`, outlineOffset: 2 };
  return createTheme({
    admin: t,
    palette: {
      mode,
      background: { default: t.canvas, paper: t.surface },
      primary: { main: t.accent, light: '#5D5BFF', dark: dark ? '#3431D6' : '#1714A8', contrastText: '#FFFFFF' },
      secondary: { main: t.ink, contrastText: dark ? '#16120E' : '#FFFFFF' },
      error: { main: t.bad },
      success: { main: t.good },
      warning: { main: t.warn },
      info: { main: t.accentText },
      text: { primary: t.ink, secondary: t.ink2, disabled: dark ? 'rgba(242,237,227,0.38)' : 'rgba(22,18,14,0.38)' },
      divider: t.line,
      action: { hover: t.sunk, selected: t.accentWash },
    },
    shape: { borderRadius: ADMIN_RADIUS },
    spacing: 8,
    transitions: {
      duration: { shortest: m.press, shorter: m.hover, short: m.ui, standard: m.ui, complex: m.drawer, enteringScreen: m.ui, leavingScreen: 180 },
      easing: { easeInOut: m.css.easeInOut, easeOut: m.css.easeOut, easeIn: m.css.easeExit, sharp: m.css.easeExit },
    },
    typography: {
      fontFamily: FONT_STACK,
      h1: type('22px', 800, 104, 1.2, '-0.01em'),
      h2: type('18px', 800, 104, 1.25, '-0.005em'),
      h3: type('16px', 700, 100, 1.3, 0),
      h4: type('15px', 700, 100, 1.35, 0),
      h5: type('15px', 700, 100, 1.35, 0),
      h6: type('14px', 700, 100, 1.4, 0),
      body1: type('15px', 400, 100, 1.55, 0),
      body2: type('14px', 400, 100, 1.5, 0),
      subtitle1: type('15px', 600, 100, 1.45, 0),
      subtitle2: type('13px', 700, 100, 1.4, 0),
      button: type('14px', 700, 100, 1, '0.005em'),
      caption: type('12.5px', 400, 100, 1.45, 0),
      overline: type('11.5px', 800, 104, 1.3, '0.09em', { textTransform: 'uppercase' }),
      kpi: type('28px', 800, 108, 1.05, '-0.02em', { fontVariantNumeric: 'tabular-nums' }),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { colorScheme: mode },
          body: { backgroundColor: t.canvas, color: t.ink },
          '::selection': { backgroundColor: t.accent, color: '#FFFFFF' },
          ':focus-visible': focusRing,
          '@media print': { body: { backgroundColor: '#FFFFFF', color: '#000000' } },
        },
      },
      MuiTypography: { defaultProps: { variantMapping: { kpi: 'p' } } },
      MuiButtonBase: { styleOverrides: { root: { '&.Mui-focusVisible': focusRing } } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: ADMIN_RADIUS, minHeight: 40, padding: '0 16px', textTransform: 'none', whiteSpace: 'nowrap',
            transition: `background-color ${m.hover}ms ease, color ${m.hover}ms ease, border-color ${m.hover}ms ease, transform ${m.press}ms ${m.css.easeOut}`,
            '&:active': { transform: 'scale(0.98)' },
          },
          sizeSmall: { minHeight: 34, padding: '0 12px', fontSize: 13 },
          sizeLarge: { minHeight: 44, padding: '0 20px', fontSize: 15 },
          containedPrimary: { backgroundColor: t.accent, color: '#FFFFFF', '&:hover': { backgroundColor: dark ? '#5653F5' : '#1F1CC9' } },
          outlined: { border: `1px solid ${t.lineStrong}`, color: t.ink, backgroundColor: t.surface, '&:hover': { borderColor: t.ink2, backgroundColor: t.sunk } },
          text: { color: t.ink, '&:hover': { backgroundColor: t.sunk } },
          startIcon: { marginRight: 6 },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: ADMIN_RADIUS, width: 40, height: 40, color: t.ink2, '&:hover': { backgroundColor: t.sunk, color: t.ink } } },
      },
      MuiTextField: { defaultProps: { variant: 'outlined' } },
      MuiInputLabel: { styleOverrides: { root: { color: t.ink2, '&.Mui-focused': { color: t.accentText }, '&.Mui-error': { color: t.bad } } } },
      MuiFormHelperText: { styleOverrides: { root: { fontSize: 13, marginLeft: 2, marginTop: 4 } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: ADMIN_RADIUS, backgroundColor: t.surface, fontSize: 14.5,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: t.lineStrong, transition: `border-color ${m.hover}ms ease` },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.ink3 },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: t.accentText },
            '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: t.bad },
          },
        },
      },
      MuiSelect: { styleOverrides: { icon: { color: t.ink2 } } },
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: { defaultProps: { elevation: 0 } },
      MuiDrawer: { styleOverrides: { paper: { backgroundColor: t.surface, backgroundImage: 'none', borderColor: t.line } } },
      MuiBackdrop: { styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: 'rgba(16,15,13,0.48)' } } } },
      MuiDialog: { styleOverrides: { paper: { backgroundColor: t.raised, borderRadius: 14, boxShadow: t.shadowFloat, border: `1px solid ${t.line}` } } },
      MuiDialogTitle: { styleOverrides: { root: { ...type('18px', 800, 104, 1.25, 0), padding: '20px 24px 8px' } } },
      MuiDialogContent: { styleOverrides: { root: { padding: '8px 24px' } } },
      MuiDialogActions: { styleOverrides: { root: { padding: '16px 24px 20px', gap: 8 } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${t.line}`, padding: '12px 16px', fontSize: 14, color: t.ink, fontVariantNumeric: 'tabular-nums' },
          head: { fontSize: 11.5, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: t.ink2, backgroundColor: t.surface, whiteSpace: 'nowrap' },
          sizeSmall: { padding: '8px 16px' },
        },
      },
      MuiTableRow: { styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: t.sunk }, '&:last-of-type td': { borderBottom: 0 } } } },
      MuiTableSortLabel: { styleOverrides: { root: { '&.Mui-active': { color: t.ink }, '&:hover': { color: t.ink } }, icon: { fontSize: 16 } } },
      MuiChip: { styleOverrides: { root: { height: 24, borderRadius: 999, fontSize: 12.5, fontWeight: 700 }, label: { padding: '0 10px' } } },
      MuiTabs: { styleOverrides: { root: { minHeight: 40 }, indicator: { height: 2, backgroundColor: t.accentText } } },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontSize: 14, fontWeight: 700, minHeight: 40, minWidth: 0, padding: '0 12px', color: t.ink2, '&.Mui-selected': { color: t.ink } } } },
      MuiMenu: { styleOverrides: { paper: { backgroundColor: t.raised, borderRadius: 12, boxShadow: t.shadowFloat, border: `1px solid ${t.line}`, marginTop: 6 } } },
      MuiPopover: { styleOverrides: { paper: { backgroundColor: t.raised, borderRadius: 12, boxShadow: t.shadowFloat, border: `1px solid ${t.line}` } } },
      MuiMenuItem: { styleOverrides: { root: { minHeight: 40, fontSize: 14, fontWeight: 600, borderRadius: 8, margin: '0 6px', gap: 10, '&.Mui-selected': { backgroundColor: t.accentWash, color: t.accentText } } } },
      MuiListItemIcon: { styleOverrides: { root: { minWidth: 0, color: 'inherit' } } },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: ADMIN_RADIUS, alignItems: 'center', color: t.ink, fontSize: 14 },
          standardError: { backgroundColor: dark ? 'rgba(255,156,148,0.12)' : '#FBE9E7', '& .MuiAlert-icon': { color: t.bad } },
          standardInfo: { backgroundColor: t.accentWash, '& .MuiAlert-icon': { color: t.accentText } },
          standardSuccess: { backgroundColor: dark ? 'rgba(111,211,162,0.12)' : '#E3F3EC', '& .MuiAlert-icon': { color: t.good } },
          standardWarning: { backgroundColor: t.warnWash, '& .MuiAlert-icon': { color: t.warn } },
        },
      },
      MuiSnackbarContent: { styleOverrides: { root: { backgroundColor: dark ? '#F2EDE3' : '#16120E', color: dark ? '#16120E' : '#FFFFFF', borderRadius: ADMIN_RADIUS, boxShadow: t.shadowFloat, fontSize: 14 } } },
      MuiSkeleton: { defaultProps: { animation: 'wave' }, styleOverrides: { root: { backgroundColor: t.sunk, borderRadius: 6 } } },
      MuiLink: { defaultProps: { underline: 'hover' }, styleOverrides: { root: { color: t.accentText, fontWeight: 600, textUnderlineOffset: 3 } } },
      MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: dark ? '#F2EDE3' : '#16120E', color: dark ? '#16120E' : '#FFFFFF', fontSize: 12.5, borderRadius: 6 } } },
      MuiPaginationItem: { styleOverrides: { root: { borderRadius: 8, minWidth: 36, height: 36, fontSize: 14, fontWeight: 700, '&.Mui-selected': { backgroundColor: t.ink, color: t.surface, '&:hover': { backgroundColor: t.ink } } } } },
      MuiSwitch: { styleOverrides: { switchBase: { '&.Mui-checked': { color: t.accentText }, '&.Mui-checked + .MuiSwitch-track': { backgroundColor: t.accentText, opacity: 0.5 } } } },
      MuiCheckbox: { styleOverrides: { root: { color: t.ink2, '&.Mui-checked': { color: t.accentText } } } },
      MuiDivider: { styleOverrides: { root: { borderColor: t.line } } },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontSize: 13, fontWeight: 700, padding: '0 12px', minHeight: 32, color: t.ink2, borderColor: t.lineStrong,
            '&.Mui-selected': { backgroundColor: t.accentWash, color: t.accentText, '&:hover': { backgroundColor: t.accentWash } },
          },
        },
      },
      MuiAccordion: { defaultProps: { disableGutters: true, elevation: 0 } },
    },
  });
}
