import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Search } from 'lucide-react';
import { useAdminCustomers, useAdminOrders, useAdminProducts } from '../../api/hooks.js';
import { formatNPR } from '../../lib/format.js';
import { Avatar, StatusChip, Thumb } from './kit.jsx';

// One field searches orders (number, phone, name), products and customers; results are a keyboard listbox
// (combobox pattern: arrows move, Enter opens, Escape closes). Enter with nothing highlighted searches orders.
export default function GlobalSearch({ autoFocus, onDone }) {
  const [value, setValue] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const anchor = useRef(null);
  const input = useRef(null);
  const navigate = useNavigate();
  const listId = useId();

  useEffect(() => {
    const t = setTimeout(() => setQ(value.trim()), 200);
    return () => clearTimeout(t);
  }, [value]);
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  const enabled = q.length >= 2;
  const orders = useAdminOrders({ q, page: 1, limit: 4 }, { enabled });
  const products = useAdminProducts({ q, page: 1, limit: 3 }, { enabled });
  const customers = useAdminCustomers({ q, page: 1, limit: 3 }, { enabled });
  const loading = enabled && (orders.isFetching || products.isFetching || customers.isFetching);

  const options = useMemo(() => {
    if (!enabled) return [];
    const out = [];
    (orders.data?.items || []).forEach((o) => out.push({ group: 'Orders', id: `o-${o.id}`, to: `/admin/orders/${o.id}`, kind: 'order', o }));
    (products.data?.items || []).forEach((p) => out.push({ group: 'Products', id: `p-${p.id}`, to: `/admin/products/${p.id}`, kind: 'product', p }));
    (customers.data?.items || []).forEach((c) => out.push({ group: 'Customers', id: `c-${c.id}`, to: `/admin/customers/${c.id}`, kind: 'customer', c }));
    return out;
  }, [enabled, orders.data, products.data, customers.data]);

  useEffect(() => setActive(-1), [q]);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };
  const go = (to) => {
    close();
    setValue('');
    navigate(to);
    onDone?.();
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && options[active]) go(options[active].to);
      else if (value.trim()) go(`/admin/orders?q=${encodeURIComponent(value.trim())}`);
    } else if (e.key === 'Escape') {
      if (open) close();
      else onDone?.();
    }
  };

  const showPanel = open && enabled;
  let lastGroup = null;

  return (
    <ClickAwayListener onClickAway={close}>
      <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <Box
          ref={anchor}
          sx={(th) => ({
            display: 'flex', alignItems: 'center', gap: 1, height: 40, px: 1.5, borderRadius: '10px', backgroundColor: th.admin.surface, border: `1px solid ${th.admin.lineStrong}`,
            '&:focus-within': { borderColor: th.admin.accentText, boxShadow: `0 0 0 1px ${th.admin.accentText}` },
          })}
        >
          <Search size={17} aria-hidden="true" style={{ flex: 'none', opacity: 0.7 }} />
          <Box
            component="input"
            ref={input}
            type="search"
            role="combobox"
            aria-label="Search orders, products and customers"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 && options[active] ? `${listId}-${options[active].id}` : undefined}
            placeholder="Search orders, products, customers"
            value={value}
            onChange={(e) => { setValue(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            sx={(th) => ({ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', color: th.admin.ink, font: 'inherit', fontSize: 14.5, '&::placeholder': { color: th.admin.ink3, opacity: 1 }, '&::-webkit-search-cancel-button': { cursor: 'pointer' } })}
          />
          {loading ? <CircularProgress size={14} aria-label="Searching" /> : (
            <Box component="kbd" aria-hidden="true" sx={(th) => ({ display: { xs: 'none', lg: 'block' }, fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, color: th.admin.ink3, border: `1px solid ${th.admin.line}`, borderRadius: '5px', px: 0.75, lineHeight: '18px' })}>Enter</Box>
          )}
        </Box>
        <Popper open={showPanel} anchorEl={anchor.current} placement="bottom-start" style={{ zIndex: 1300 }} modifiers={[{ name: 'offset', options: { offset: [0, 6] } }]}>
          <Box
            id={listId}
            role="listbox"
            aria-label="Search results"
            sx={(th) => ({ width: Math.max(320, anchor.current?.offsetWidth || 320), maxWidth: 'calc(100vw - 24px)', maxHeight: 440, overflowY: 'auto', backgroundColor: th.admin.raised, border: `1px solid ${th.admin.line}`, borderRadius: '12px', boxShadow: th.admin.shadowFloat, py: 1 })}
          >
            {options.length === 0 ? (
              <Typography variant="body2" sx={(th) => ({ px: 2, py: 1.5, color: th.admin.ink2 })}>{loading ? 'Searching…' : `No results for “${q}”.`}</Typography>
            ) : options.map((opt, i) => {
              const header = opt.group !== lastGroup ? opt.group : null;
              lastGroup = opt.group;
              return (
                <Box key={opt.id}>
                  {header ? <Typography role="presentation" variant="overline" component="div" sx={(th) => ({ px: 2, pt: i ? 1.25 : 0.5, pb: 0.5, color: th.admin.ink3 })}>{header}</Typography> : null}
                  <Box
                    id={`${listId}-${opt.id}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(opt.to)}
                    sx={(th) => ({ display: 'flex', alignItems: 'center', gap: 1.5, mx: 1, px: 1, py: 0.75, borderRadius: '8px', cursor: 'pointer', backgroundColor: i === active ? th.admin.sunk : 'transparent' })}
                  >
                    <Result opt={opt} />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

function Result({ opt }) {
  if (opt.kind === 'order') {
    const o = opt.o;
    return (
      <>
        <Thumb src={o.items?.[0]?.image} size={32} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{o.orderNumber}</Typography>
          <Typography variant="caption" sx={(th) => ({ color: th.admin.ink2, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>{o.customer?.name || o.shipping?.fullName} · {formatNPR(o.total)}</Typography>
        </Box>
        <StatusChip status={o.status} />
      </>
    );
  }
  if (opt.kind === 'product') {
    const p = opt.p;
    return (
      <>
        <Thumb src={p.colourways?.[0]?.images?.[0]?.thumb} size={32} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{p.name}</Typography>
          <Typography variant="caption" sx={(th) => ({ color: th.admin.ink2 })}>{p.colourways?.length} colours · from {formatNPR(p.priceFrom)}</Typography>
        </Box>
      </>
    );
  }
  const c = opt.c;
  return (
    <>
      <Avatar name={c.name} size={32} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{c.name}</Typography>
        <Typography variant="caption" sx={(th) => ({ color: th.admin.ink2 })}>{c.orderCount} orders · {c.city || c.email}</Typography>
      </Box>
    </>
  );
}
