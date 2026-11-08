import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { statusLabel } from '../../lib/orders.js';
import { fmtInt, fmtNPRCompact } from './kit.jsx';

const dateLabel = (key, opts = { day: 'numeric', month: 'short' }) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
};

/** Round the max up to a 1/2/2.5/5 × 10^n step so the y-axis has 4 clean ticks. */
export function niceTicks(max, count = 4) {
  if (!(max > 0)) return [0, 1, 2, 3, 4].slice(0, count + 1);
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw);
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step * 100) / 100);
}

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => setW(el.getBoundingClientRect().width);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/**
 * One series over time: 2 px line + soft area, recessive grid, crosshair + tooltip on hover, arrow keys to step
 * through days when focused. (Revenue and orders never share an axis: the caller switches the measure.)
 */
export function TrendChart({ data, measure = 'revenue', height = 260, label }) {
  const th = useTheme();
  const t = th.admin;
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const fmt = measure === 'revenue' ? fmtNPRCompact : fmtInt;
  const pad = { top: 12, right: 12, bottom: 28, left: measure === 'revenue' ? 72 : 36 };
  const w = Math.max(0, width);
  const iw = Math.max(1, w - pad.left - pad.right);
  const ih = height - pad.top - pad.bottom;
  const values = data.map((d) => d[measure]);
  const ticks = niceTicks(Math.max(...values, 0));
  const top = ticks[ticks.length - 1] || 1;
  const x = (i) => pad.left + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => pad.top + ih - (v / top) * ih;

  const path = useMemo(() => values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(''), [values.join(','), w, top]); // eslint-disable-line react-hooks/exhaustive-deps
  const area = data.length ? `${path}L${x(data.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z` : '';
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 72))));

  const pick = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    const px = clientX - rect.left - pad.left;
    const i = Math.round((px / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setHover((h) => {
        const base = h == null ? data.length - 1 : h;
        return Math.max(0, Math.min(data.length - 1, base + (e.key === 'ArrowRight' ? 1 : -1)));
      });
    } else if (e.key === 'Escape') setHover(null);
  };
  const hv = hover != null ? data[hover] : null;
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <Box
      ref={ref}
      tabIndex={0}
      role="img"
      aria-label={`${label}: ${data.length} days, total ${fmt(total)}. Use the left and right arrow keys to read each day.`}
      onPointerMove={(e) => width && pick(e.clientX)}
      onPointerLeave={() => setHover(null)}
      onKeyDown={onKey}
      onBlur={() => setHover(null)}
      sx={{ position: 'relative', width: '100%', height, touchAction: 'pan-y', borderRadius: '8px', '&:focus-visible': { outline: `2px solid ${t.accentText}`, outlineOffset: 4 } }}
    >
      {w > 0 ? (
        <svg width={w} height={height} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={pad.left} x2={w - pad.right} y1={y(v)} y2={y(v)} stroke={t.line} strokeWidth={1} />
              <text x={pad.left - 10} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11.5} fill={t.ink3} style={{ fontVariantNumeric: 'tabular-nums' }}>{measure === 'revenue' ? fmtNPRCompact(v).replace('NPR ', '') : fmtInt(v)}</text>
            </g>
          ))}
          {data.map((d, i) => (i % every === (data.length - 1) % every ? (
            <text key={d.date} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11.5} fill={t.ink3}>{dateLabel(d.date)}</text>
          ) : null))}
          <path d={area} fill={t.chartSoft} />
          <path d={path} fill="none" stroke={t.chart} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {hv ? (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + ih} stroke={t.ink3} strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(hv[measure])} r={5} fill={t.chart} stroke={t.surface} strokeWidth={2} />
            </g>
          ) : null}
        </svg>
      ) : null}
      {hv ? (
        <Box
          aria-live="polite"
          sx={{
            position: 'absolute', top: 0, pointerEvents: 'none', transform: x(hover) > w * 0.62 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)', left: x(hover),
            backgroundColor: t.raised, border: `1px solid ${t.line}`, boxShadow: t.shadowFloat, borderRadius: '8px', px: 1.5, py: 1, whiteSpace: 'nowrap',
          }}
        >
          <Typography variant="caption" sx={{ color: t.ink2, display: 'block' }}>{dateLabel(hv.date, { weekday: 'short', day: 'numeric', month: 'short' })}</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{measure === 'revenue' ? `NPR ${fmtInt(hv.revenue)}` : `${hv.orders} ${hv.orders === 1 ? 'order' : 'orders'}`}</Typography>
          <Typography variant="caption" sx={{ color: t.ink2 }}>{measure === 'revenue' ? `${hv.orders} ${hv.orders === 1 ? 'order' : 'orders'}` : `NPR ${fmtInt(hv.revenue)}`}</Typography>
        </Box>
      ) : null}
    </Box>
  );
}

/** Day-by-day table: the accessible (and exact) view of the trend chart. */
export function TrendTable({ data }) {
  return (
    <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
      <Box component="table" sx={(th) => ({ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, fontVariantNumeric: 'tabular-nums', '& th, & td': { textAlign: 'right', py: 0.75, px: 1.5, borderBottom: `1px solid ${th.admin.line}` }, '& th:first-of-type, & td:first-of-type': { textAlign: 'left' }, '& thead th': { position: 'sticky', top: 0, backgroundColor: th.admin.surface, color: th.admin.ink2, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.07em' } })}>
        <thead><tr><th scope="col">Day</th><th scope="col">Orders</th><th scope="col">Revenue</th></tr></thead>
        <tbody>
          {[...data].reverse().map((d) => (
            <tr key={d.date}><td>{dateLabel(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td><td>{d.orders}</td><td>NPR {fmtInt(d.revenue)}</td></tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

/** Magnitude per status in one hue, with the count and share written out (never colour alone). */
export function StatusBars({ rows, onPick }) {
  const total = rows.reduce((a, r) => a + r.count, 0) || 1;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      {rows.map((r) => (
        <Box component="li" key={r.status}>
          <Box
            component={onPick ? 'button' : 'div'}
            type={onPick ? 'button' : undefined}
            onClick={onPick ? () => onPick(r.status) : undefined}
            aria-label={onPick ? `${statusLabel(r.status)}: ${r.count} orders, ${Math.round((r.count / total) * 100)}%. Show these orders` : undefined}
            sx={(th) => ({
              all: 'unset', boxSizing: 'border-box', width: '100%', display: 'block', cursor: onPick ? 'pointer' : 'default', borderRadius: '6px', p: 0.5, m: -0.5,
              '&:hover .bar': { opacity: 0.85 }, '&:focus-visible': { outline: `2px solid ${th.admin.accentText}`, outlineOffset: 2 },
            })}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{statusLabel(r.status)}</Typography>
              <Typography variant="body2" sx={(th) => ({ fontVariantNumeric: 'tabular-nums', color: th.admin.ink2 })}>
                <Box component="span" sx={(th) => ({ color: th.admin.ink, fontWeight: 700 })}>{r.count}</Box> · {Math.round((r.count / total) * 100)}%
              </Typography>
            </Box>
            <Box sx={(th) => ({ height: 8, borderRadius: 999, backgroundColor: th.admin.sunk, overflow: 'hidden' })}>
              <Box className="bar" sx={(th) => ({ height: '100%', width: `${(r.count / max) * 100}%`, minWidth: r.count ? 4 : 0, borderRadius: 999, backgroundColor: th.admin.chart, transition: 'width 300ms ease, opacity 160ms ease' })} />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
