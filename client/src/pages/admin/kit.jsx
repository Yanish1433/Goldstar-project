import { useEffect } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useAdmin } from '../../store/admin.js';
import { useTitle } from '../../components/Page.jsx';

export { StatusChip } from '../../components/OrderParts.jsx';

/** Sets the shell's page title (the top bar renders it as the page h1) and the document title. */
export function useAdminPage(title, crumbs) {
  const setPage = useAdmin((s) => s.setPage);
  const key = JSON.stringify(crumbs || []);
  useTitle(title ? `${title} · Admin` : 'Admin');
  useEffect(() => {
    setPage(title || '', crumbs || []);
  }, [title, key]); // eslint-disable-line react-hooks/exhaustive-deps
}

const nfCompact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
const nf = new Intl.NumberFormat('en-IN');
export const fmtInt = (n) => nf.format(Math.round(Number(n) || 0));
export const fmtNPRCompact = (n) => `NPR ${Math.abs(n) >= 100000 ? nfCompact.format(n) : nf.format(Math.round(n || 0))}`;
export const fmtDateTime = (iso) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  } catch {
    return '';
  }
};
export const fmtShortDate = (iso) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso));
  } catch {
    return '';
  }
};

/** Card surface used for every admin panel. */
export function Panel({ title, action, children, sx, pad = true, component = 'section', id, ...rest }) {
  const headingId = id || (title ? `panel-${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  return (
    <Box
      component={component}
      aria-labelledby={title ? headingId : undefined}
      sx={(th) => ({ backgroundColor: th.admin.surface, border: `1px solid ${th.admin.line}`, borderRadius: '12px', boxShadow: th.admin.shadow, minWidth: 0, ...(typeof sx === 'function' ? sx(th) : sx) })}
      {...rest}
    >
      {title ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 2.5, pt: 2, pb: pad ? 0 : 1.5, minHeight: 40 }}>
          <Typography id={headingId} variant="h2" sx={{ fontSize: 15 }}>{title}</Typography>
          {action}
        </Box>
      ) : null}
      <Box sx={pad ? { p: 2.5 } : undefined}>{children}</Box>
    </Box>
  );
}

/** Signed change vs the previous period. Colour follows direction × whether up is good, with an icon so it is never colour alone. */
export function Delta({ value, prev, goodWhenUp = true, suffix = 'vs previous 30 days' }) {
  if (prev == null) return null;
  let pct = null;
  if (prev === 0) pct = value === 0 ? 0 : null;
  else pct = ((value - prev) / Math.abs(prev)) * 100;
  const dir = pct == null ? 'new' : Math.abs(pct) < 0.5 ? 'flat' : pct > 0 ? 'up' : 'down';
  const good = dir === 'flat' || dir === 'new' ? null : (dir === 'up') === goodWhenUp;
  const Icon = dir === 'up' || dir === 'new' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
  const label = dir === 'new' ? 'New' : dir === 'flat' ? '0%' : `${pct > 0 ? '+' : '−'}${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
      <Box
        component="span"
        sx={(th) => ({ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums', color: good == null ? th.admin.ink2 : good ? th.admin.good : th.admin.bad })}
      >
        <Icon size={15} aria-hidden="true" />
        {label}
      </Box>
      <Typography component="span" variant="caption" sx={(th) => ({ color: th.admin.ink3 })}>{suffix}</Typography>
    </Box>
  );
}

export function KpiCard({ label, value, delta, icon: Icon, foot, loading }) {
  return (
    <Panel component="article" aria-label={label}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2, fontWeight: 600 })}>{label}</Typography>
        {Icon ? (
          <Box sx={(th) => ({ width: 32, height: 32, borderRadius: '8px', display: 'grid', placeItems: 'center', backgroundColor: th.admin.accentWash, color: th.admin.accentText })}>
            <Icon size={17} aria-hidden="true" />
          </Box>
        ) : null}
      </Box>
      {loading ? <Skeleton width="60%" height={36} /> : <Typography variant="kpi">{value}</Typography>}
      <Box sx={{ mt: 1, minHeight: 20 }}>{loading ? <Skeleton width="80%" /> : delta || foot}</Box>
    </Panel>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <Box sx={{ py: 6, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1 }}>
      {Icon ? (
        <Box sx={(th) => ({ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', backgroundColor: th.admin.sunk, color: th.admin.ink2, mb: 1 })}>
          <Icon size={22} aria-hidden="true" />
        </Box>
      ) : null}
      <Typography variant="h3" component="p">{title}</Typography>
      {body ? <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2, maxWidth: 380 })}>{body}</Typography> : null}
      {action ? <Box sx={{ mt: 1.5 }}>{action}</Box> : null}
    </Box>
  );
}

export function ErrorState({ title = 'Could not load this', body = 'Check the connection and try again.', onRetry }) {
  return (
    <Box role="alert" sx={{ py: 5, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1 }}>
      <Box sx={(th) => ({ width: 44, height: 44, borderRadius: '12px', display: 'grid', placeItems: 'center', backgroundColor: th.admin.warnWash, color: th.admin.warn, mb: 1 })}>
        <AlertTriangle size={22} aria-hidden="true" />
      </Box>
      <Typography variant="h3" component="p">{title}</Typography>
      <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>{body}</Typography>
      {onRetry ? <Button variant="outlined" size="small" onClick={onRetry} sx={{ mt: 1.5 }}>Try again</Button> : null}
    </Box>
  );
}

export function SkeletonRows({ rows = 6, cols = 5 }) {
  return Array.from({ length: rows }, (_, r) => (
    <TableRow key={r} aria-hidden="true">
      {Array.from({ length: cols }, (_, c) => (
        <TableCell key={c}><Skeleton variant="rectangular" height={16} width={c === 0 ? '70%' : '50%'} /></TableCell>
      ))}
    </TableRow>
  ));
}

/** Square product photo on the catalogue's cream tile. */
export function Thumb({ src, size = 40, alt = '' }) {
  return (
    <Box sx={{ width: size, height: size, flex: 'none', borderRadius: '8px', backgroundColor: '#EDE7DC', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
      {src ? <img src={src} alt={alt} width={size} height={size} loading="lazy" referrerPolicy="no-referrer" style={{ width: size, height: size, objectFit: 'contain', mixBlendMode: 'multiply' }} /> : null}
    </Box>
  );
}

export function Avatar({ name = '', size = 32 }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <Box aria-hidden="true" sx={(th) => ({ width: size, height: size, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: th.admin.accentWash, color: th.admin.accentText, fontWeight: 800, fontSize: size * 0.38 })}>
      {initials || '?'}
    </Box>
  );
}

export function PageActions({ children }) {
  return <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>{children}</Box>;
}

export function BackLink({ to, children }) {
  return (
    <Button component={RouterLink} to={to} variant="text" size="small" sx={(th) => ({ alignSelf: 'flex-start', color: th.admin.ink2, ml: -1.5 })}>
      ← {children}
    </Button>
  );
}

/** Two-column label/value list. */
export function DefList({ rows }) {
  return (
    <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'minmax(96px, max-content) 1fr', rowGap: 1, columnGap: 2 }}>
      {rows.filter((r) => r[1] != null && r[1] !== '').map(([k, v]) => (
        <Box key={k} sx={{ display: 'contents' }}>
          <Typography component="dt" variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>{k}</Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0, minWidth: 0, overflowWrap: 'anywhere' }}>{v}</Typography>
        </Box>
      ))}
    </Box>
  );
}
