import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import { ChevronDown, Plus, Trash2, ArrowLeft, ArrowRight, ImagePlus, Star } from 'lucide-react';
import AdminNotFound from './AdminNotFound.jsx';
import { useAdminProduct, useSaveProduct } from '../../api/hooks.js';
import { useUi } from '../../store/ui.js';
import { formatNPR } from '../../lib/format.js';
import { LOW_STOCK } from '../../lib/adminStats.js';
import { ErrorState, Panel, useAdminPage } from './kit.jsx';

const ANCHORS = ['upper', 'overlay', 'eyelets', 'collar', 'footbed', 'midsole', 'outsole'];
const STAGES = ['callout', 'layer'];
const BADGES = ['', 'support', 'cushion', 'grip'];
const CATEGORY_OPTIONS = ['trek-collection', 'women', 'men', 'casual', 'new-arrival', 'trending', 'in-stock'];
const SIZE_OPTIONS = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9A-Fa-f]{6}$/;

const blankColour = () => ({ key: '', name: '', nameNe: '', hex: '#6B6B6B', price: '', regularPrice: '', sizes: [], stock: {}, inStock: true, images: [], productUrl: 'https://goldstarshoes.com/', wooIds: [], _new: true });
const blankCallout = (order) => ({ key: '', title: '', body: '', anchor: 'upper', stage: 'callout', badge: '', order, position: null });
const blank = () => ({ slug: '', name: '', series: '', categories: [], description: '', shortSpecs: [], featured: false, active: true, sortOrder: 100, colourways: [blankColour()], specCallouts: [] });

const fromApi = (p) => ({
  ...p,
  series: p.series || '',
  colourways: p.colourways.map((c) => ({ ...c, nameNe: c.nameNe || '', stock: { ...(c.stock || {}) }, _tracked: !!c.stock })),
  specCallouts: (p.specCallouts || []).map((s) => ({ ...s, badge: s.badge || '' })),
});
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const num = (v) => (v === '' || v == null ? NaN : Number(v));

/** Client-side checks mirroring the server schema, so most mistakes are caught before saving. */
export function validateProduct(f, isNew) {
  const e = [];
  const add = (path, message) => e.push({ path, message });
  if (!f.name.trim()) add('name', 'Enter a product name.');
  if (isNew && !/^[a-z0-9-]+$/.test(f.slug.trim())) add('slug', 'Use lowercase letters, numbers and hyphens.');
  else if (isNew && f.slug.trim().length > 80) add('slug', 'Keep the slug to 80 characters or fewer.');
  if (!f.colourways.length) add('colourways', 'Add at least one colour.');
  const keys = new Set();
  f.colourways.forEach((c, i) => {
    const p = `colourways.${i}`;
    if (!KEBAB.test(c.key.trim())) add(`${p}.key`, 'Use a short key like olive or kathmandu-black.');
    else if (keys.has(c.key.trim())) add(`${p}.key`, 'Each colour needs a different key.');
    keys.add(c.key.trim());
    if (!c.name.trim()) add(`${p}.name`, 'Enter a colour name.');
    if (!HEX.test(c.hex)) add(`${p}.hex`, 'Use a hex colour like #1E1E1E.');
    const price = num(c.price);
    if (!Number.isInteger(price) || price < 0) add(`${p}.price`, 'Enter a whole number of rupees.');
    const reg = c.regularPrice === '' ? price : num(c.regularPrice);
    if (c.regularPrice !== '' && (!Number.isInteger(reg) || reg < 0)) add(`${p}.regularPrice`, 'Enter a whole number of rupees.');
    else if (Number.isInteger(price) && reg < price) add(`${p}.regularPrice`, 'Compare-at price must be the same as or higher than the price.');
    if (!c.sizes.length) add(`${p}.sizes`, 'Offer at least one size.');
    c.sizes.forEach((s) => {
      const q = c.stock?.[s];
      if (q !== '' && q != null && (!Number.isInteger(Number(q)) || Number(q) < 0)) add(`${p}.stock.${s}`, `Stock for UK ${s} must be 0 or more.`);
    });
    if (!c.productUrl.startsWith('https://goldstarshoes.com/')) add(`${p}.productUrl`, 'Must start with https://goldstarshoes.com/');
    c.images.forEach((im, n) => { if (!im.src.trim() || !im.thumb.trim()) add(`${p}.images.${n}`, 'Each image needs an image and a thumbnail URL.'); });
  });
  return e;
}

function toBody(f, isNew) {
  const n = (v) => Number(v) || 0;
  const body = {
    name: f.name.trim(),
    categories: f.categories,
    description: f.description,
    shortSpecs: f.shortSpecs,
    featured: f.featured,
    active: f.active,
    sortOrder: n(f.sortOrder),
    colourways: f.colourways.map((c) => {
      const o = {
        key: c.key.trim(), name: c.name.trim(), nameNe: c.nameNe.trim() ? c.nameNe.trim() : null, hex: c.hex, price: n(c.price), regularPrice: c.regularPrice === '' ? n(c.price) : n(c.regularPrice),
        sizes: [...c.sizes].sort((a, b) => parseFloat(a) - parseFloat(b)), inStock: c.inStock, images: c.images.map((im) => ({ src: im.src.trim(), thumb: im.thumb.trim(), alt: im.alt || '' })), productUrl: c.productUrl.trim(), wooIds: c.wooIds || [],
      };
      const tracked = c._tracked || Object.values(c.stock || {}).some((v) => v !== '' && v != null);
      if (tracked) o.stock = Object.fromEntries(o.sizes.map((s) => [s, n(c.stock?.[s])]));
      return o;
    }),
    specCallouts: f.specCallouts.map((s) => ({ key: s.key.trim(), title: s.title.trim(), body: s.body.trim(), anchor: s.anchor, stage: s.stage, badge: s.badge || null, order: n(s.order), position: s.position && s.position.every((v) => v !== '' && Number.isFinite(Number(v))) ? s.position.map(Number) : null })),
  };
  body.series = f.series.trim() ? f.series.trim() : null;
  if (isNew) body.slug = f.slug.trim();
  return body;
}

const fid = (path) => `f-${path.replace(/\./g, '-')}`;

function Section({ id, title, desc, children, action }) {
  return (
    <Panel id={id} title={title} action={action} sx={{ scrollMarginTop: 80 }}>
      {desc ? <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2, mt: -1, mb: 2 })}>{desc}</Typography> : null}
      {children}
    </Panel>
  );
}

function Preview({ form }) {
  const [i, setI] = useState(0);
  const c = form.colourways[Math.min(i, form.colourways.length - 1)] || blankColour();
  const img = c.images[0];
  const price = num(c.price);
  const reg = c.regularPrice === '' ? price : num(c.regularPrice);
  return (
    <Box>
      <Box sx={{ aspectRatio: '1', backgroundColor: '#EDE7DC', borderRadius: '10px', display: 'grid', placeItems: 'center', overflow: 'hidden', position: 'relative' }}>
        {img?.thumb ? <img src={img.thumb} alt={img.alt || ''} style={{ width: '86%', height: '86%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : <Typography variant="body2" sx={{ color: '#5A5247' }}>No image yet</Typography>}
        {reg > price ? <Box sx={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#C2124F', color: '#FFFFFF', fontSize: 12, fontWeight: 800, px: 1, borderRadius: 999, lineHeight: '22px' }}>Sale</Box> : null}
        {!form.active ? <Box sx={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#16120E', color: '#FFFFFF', fontSize: 12, fontWeight: 700, px: 1, borderRadius: 999, lineHeight: '22px' }}>Hidden from shop</Box> : null}
      </Box>
      <Typography sx={{ fontWeight: 800, mt: 1.5, fontStretch: '108%', fontVariationSettings: '"wdth" 108' }}>{form.name || 'Product name'}</Typography>
      <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>{c.name || 'Colour'}{c.inStock === false ? ' · Out of stock' : ''}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
        <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{Number.isFinite(price) ? formatNPR(price) : 'NPR –'}</Typography>
        {reg > price ? <Typography variant="body2" sx={(th) => ({ color: th.admin.ink3, textDecoration: 'line-through' })}>{formatNPR(reg)}</Typography> : null}
      </Box>
      {form.colourways.length > 1 ? (
        <Box role="radiogroup" aria-label="Preview colour" sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
          {form.colourways.map((x, n) => (
            <Box
              key={n}
              component="button"
              type="button"
              role="radio"
              aria-checked={n === i}
              aria-label={x.name || `Colour ${n + 1}`}
              onClick={() => setI(n)}
              sx={(th) => ({ width: 26, height: 26, borderRadius: '50%', border: 0, p: 0, cursor: 'pointer', backgroundColor: x.hex, boxShadow: n === i ? `0 0 0 2px ${th.admin.surface}, 0 0 0 4px ${th.admin.ink}` : `inset 0 0 0 1px ${th.admin.lineStrong}` })}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function ImagesEditor({ form, setIn, fe }) {
  const [ci, setCi] = useState(0);
  const [draft, setDraft] = useState({ src: '', thumb: '', alt: '' });
  const [drag, setDrag] = useState(null);
  const idx = Math.min(ci, form.colourways.length - 1);
  const c = form.colourways[idx];
  if (!c) return null;
  const setImages = (images) => setIn('colourways', idx, { images });
  const move = (from, to) => {
    if (to < 0 || to >= c.images.length || from === to) return;
    const next = [...c.images];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setImages(next);
  };
  const add = () => {
    if (!draft.src.trim()) return;
    setImages([...c.images, { src: draft.src.trim(), thumb: (draft.thumb || draft.src).trim(), alt: draft.alt.trim() || `${form.name} in ${c.name}`.trim() }]);
    setDraft({ src: '', thumb: '', alt: '' });
  };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {form.colourways.length > 1 ? (
        <Box role="tablist" aria-label="Colour" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {form.colourways.map((x, n) => (
            <Button key={n} role="tab" aria-selected={n === idx} size="small" variant={n === idx ? 'contained' : 'outlined'} onClick={() => setCi(n)} startIcon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: x.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)' }} />}>
              {x.name || `Colour ${n + 1}`} ({x.images.length})
            </Button>
          ))}
        </Box>
      ) : null}
      {c.images.length === 0 ? (
        <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>No images for this colour yet. The first image is the cover in the shop.</Typography>
      ) : (
        <Box component="ol" aria-label={`Images for ${c.name || 'this colour'}, in display order`} sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))' }}>
          {c.images.map((im, n) => (
            <Box
              component="li"
              key={`${im.src}-${n}`}
              draggable
              onDragStart={() => setDrag(n)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { move(drag, n); setDrag(null); }}
              sx={(th) => ({ border: `1px solid ${fe(`colourways.${idx}.images.${n}`) ? th.admin.bad : th.admin.line}`, borderRadius: '10px', overflow: 'hidden', backgroundColor: th.admin.surface, opacity: drag === n ? 0.5 : 1, cursor: 'grab' })}
            >
              <Box sx={{ aspectRatio: '1', backgroundColor: '#EDE7DC', display: 'grid', placeItems: 'center', position: 'relative' }}>
                {im.thumb ? <img src={im.thumb} alt={im.alt || ''} loading="lazy" style={{ width: '90%', height: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : null}
                <Box sx={{ position: 'absolute', top: 6, left: 6, fontSize: 11, fontWeight: 800, px: 0.75, borderRadius: 999, lineHeight: '18px', backgroundColor: n === 0 ? '#16120E' : 'rgba(255,255,255,0.9)', color: n === 0 ? '#FFFFFF' : '#16120E' }}>{n === 0 ? 'Cover' : n + 1}</Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 0.5 }}>
                <Tooltip title="Move earlier"><span><IconButton size="small" disabled={n === 0} onClick={() => move(n, n - 1)} aria-label={`Move image ${n + 1} earlier`} sx={{ width: 30, height: 30 }}><ArrowLeft size={15} aria-hidden="true" /></IconButton></span></Tooltip>
                <Tooltip title="Make cover"><span><IconButton size="small" disabled={n === 0} onClick={() => move(n, 0)} aria-label={`Make image ${n + 1} the cover`} sx={{ width: 30, height: 30 }}><Star size={15} aria-hidden="true" /></IconButton></span></Tooltip>
                <Tooltip title="Move later"><span><IconButton size="small" disabled={n === c.images.length - 1} onClick={() => move(n, n + 1)} aria-label={`Move image ${n + 1} later`} sx={{ width: 30, height: 30 }}><ArrowRight size={15} aria-hidden="true" /></IconButton></span></Tooltip>
                <Tooltip title="Remove"><IconButton size="small" onClick={() => setImages(c.images.filter((_, k) => k !== n))} aria-label={`Remove image ${n + 1}`} sx={(th) => ({ width: 30, height: 30, '&:hover': { color: th.admin.bad } })}><Trash2 size={15} aria-hidden="true" /></IconButton></Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      <Box sx={(th) => ({ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '2fr 2fr 1.5fr auto' }, alignItems: 'start', p: 1.5, borderRadius: '10px', border: `1px dashed ${th.admin.lineStrong}` })}>
        <TextField size="small" label="Image URL" value={draft.src} onChange={(e) => setDraft((d) => ({ ...d, src: e.target.value }))} placeholder="https://…" />
        <TextField size="small" label="Thumbnail URL (optional)" value={draft.thumb} onChange={(e) => setDraft((d) => ({ ...d, thumb: e.target.value }))} />
        <TextField size="small" label="Alt text" value={draft.alt} onChange={(e) => setDraft((d) => ({ ...d, alt: e.target.value }))} />
        <Button variant="outlined" startIcon={<ImagePlus size={16} aria-hidden="true" />} onClick={add} disabled={!draft.src.trim()}>Add</Button>
      </Box>
      <Typography variant="caption" sx={(th) => ({ color: th.admin.ink3 })}>Drag images, or use the arrows, to change the order. The live API only accepts https:// image URLs.</Typography>
    </Box>
  );
}

export function Component() {
  return <AdminProductEdit />;
}

export default function AdminProductEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useAdminProduct(id);
  const save = useSaveProduct();
  const showSnackbar = useUi((s) => s.showSnackbar);
  const [form, setForm] = useState(null);
  const initial = useRef('');
  const [errors, setErrors] = useState([]);
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState(false);
  const [removeIdx, setRemoveIdx] = useState(null);
  const slugTouched = useRef(false);
  const skipBlock = useRef(false);

  useAdminPage(isNew ? 'New product' : form?.name || data?.name || 'Product', [{ to: '/admin/products', label: 'Products' }]);

  useEffect(() => {
    if (isNew) {
      const b = blank();
      setForm(b);
      initial.current = JSON.stringify(b);
    } else if (data) {
      const f = fromApi(data);
      setForm(f);
      initial.current = JSON.stringify(f);
    }
  }, [data, isNew]);

  const dirty = useMemo(() => !!form && JSON.stringify(form) !== initial.current, [form]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !skipBlock.current && dirty && !saved && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  // Live re-validation once the admin has tried to save.
  useEffect(() => {
    if (tried && form) setErrors((prev) => [...validateProduct(form, isNew), ...prev.filter((e) => e.server)]);
  }, [form, tried, isNew]);

  if (!isNew && isLoading) return <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: '2fr 1fr' } }}><Skeleton variant="rectangular" height={520} sx={{ borderRadius: '12px' }} /><Skeleton variant="rectangular" height={420} sx={{ borderRadius: '12px' }} /></Box>;
  if (!isNew && (error?.status === 404 || (!error && !data))) return <AdminNotFound what="product" />;
  if (!isNew && error) return <Panel><ErrorState title="Could not load this product" error={error} onRetry={refetch} /></Panel>;
  if (!form) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setIn = (list, i, patch) => setForm((f) => ({ ...f, [list]: f[list].map((x, n) => (n === i ? { ...x, ...patch } : x)) }));
  const fe = (path) => errors.find((e) => e.path === path)?.message;
  const fp = (path, help) => ({ id: fid(path), error: !!fe(path), helperText: fe(path) || help });

  const submit = async () => {
    setTried(true);
    const local = validateProduct(form, isNew);
    if (local.length) {
      setErrors(local);
      showSnackbar({ message: `Fix ${local.length} ${local.length === 1 ? 'field' : 'fields'} before saving` });
      setTimeout(() => document.getElementById('form-errors')?.focus(), 0);
      return;
    }
    setErrors([]);
    try {
      let body = toBody(form, isNew);
      if (!isNew) {
        // PATCH sends only the fields that changed.
        const before = toBody(JSON.parse(initial.current), false);
        body = Object.fromEntries(Object.entries(body).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(before[k])));
      }
      const res = await save.mutateAsync({ id: isNew ? undefined : id, body });
      setSaved(true);
      setTried(false);
      showSnackbar({ message: isNew ? `${res.product.name} created` : 'Changes saved' });
      const f = fromApi(res.product);
      initial.current = JSON.stringify(f);
      setForm(f);
      if (isNew) {
        skipBlock.current = true;
        navigate(`/admin/products/${res.product.id}`, { replace: true });
        setTimeout(() => { skipBlock.current = false; }, 0);
      }
      else setTimeout(() => setSaved(false), 0);
    } catch (e) {
      setErrors((e.details?.length ? e.details : [{ path: '', message: e.message }]).map((d) => ({ ...d, server: true })));
      showSnackbar({ message: e.message || 'Could not save the product.' });
      setTimeout(() => document.getElementById('form-errors')?.focus(), 0);
    }
  };

  const toggleSize = (i, s) => {
    const c = form.colourways[i];
    const has = c.sizes.includes(s);
    setIn('colourways', i, { sizes: has ? c.sizes.filter((x) => x !== s) : [...c.sizes, s].sort((a, b) => parseFloat(a) - parseFloat(b)) });
  };
  const totalPairs = form.colourways.reduce((n, c) => n + c.sizes.reduce((m, s) => m + (Number(c.stock?.[s]) || 0), 0), 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, pb: 2 }}>
      {errors.length ? (
        <Alert severity="error" id="form-errors" tabIndex={-1} role="alert">
          <b>{errors.length === 1 ? '1 field needs attention' : `${errors.length} fields need attention`}</b>
          <Box component="ul" sx={{ m: '4px 0 0', pl: 2.5 }}>
            {errors.slice(0, 8).map((e, i) => (
              <li key={i}>{e.path ? <Box component="a" href={`#${fid(e.path)}`} sx={{ color: 'inherit' }} onClick={(ev) => { const el = document.getElementById(fid(e.path)); if (el) { ev.preventDefault(); el.scrollIntoView({ block: 'center' }); el.focus?.(); } }}>{e.message}</Box> : e.message}</li>
            ))}
          </Box>
        </Alert>
      ) : null}

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,1fr) 340px' }, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, minWidth: 0 }}>
          <Section id="details" title="Details">
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: '1fr 1fr' } }}>
              <TextField
                label="Name"
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, ...(isNew && !slugTouched.current ? { slug: slugify(name) } : {}) }));
                }}
                sx={{ gridColumn: '1 / -1' }}
                {...fp('name')}
              />
              <TextField
                label="URL slug"
                value={form.slug}
                disabled={!isNew}
                onChange={(e) => { slugTouched.current = true; set('slug', e.target.value); }}
                {...fp('slug', isNew ? 'Lowercase letters, numbers and hyphens. Cannot be changed later.' : 'The slug cannot be changed.')}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">/product/</InputAdornment> } }}
              />
              <TextField label="Series" value={form.series} onChange={(e) => set('series', e.target.value)} {...fp('series', 'e.g. G10, AX')} />
              <Autocomplete multiple freeSolo options={CATEGORY_OPTIONS} value={form.categories} onChange={(_, v) => set('categories', v.map(slugify).filter(Boolean))} renderInput={(p) => <TextField {...p} label="Categories" helperText="Pick or type, then press Enter." />} sx={{ gridColumn: '1 / -1' }} />
              <TextField label="Description" multiline minRows={4} value={form.description} onChange={(e) => set('description', e.target.value)} sx={{ gridColumn: '1 / -1' }} {...fp('description', `${form.description.length} / 4000`)} slotProps={{ htmlInput: { maxLength: 4000 } }} />
              <Autocomplete multiple freeSolo options={[]} value={form.shortSpecs} onChange={(_, v) => set('shortSpecs', v.slice(0, 12))} renderInput={(p) => <TextField {...p} label="Highlights" helperText="Short spec lines shown on the product page. Type one and press Enter (up to 12)." />} sx={{ gridColumn: '1 / -1' }} />
            </Box>
          </Section>

          <Section id="pricing" title="Pricing" desc="Prices are per colour, in whole rupees. A compare-at price above the price shows the colour as on sale.">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {form.colourways.map((c, i) => {
                const price = num(c.price);
                const reg = num(c.regularPrice);
                const off = Number.isFinite(price) && Number.isFinite(reg) && reg > price ? Math.round((1 - price / reg) * 100) : 0;
                return (
                  <Box key={i} sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', sm: 'minmax(120px,1fr) 1fr 1fr 72px' }, alignItems: 'start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 40, gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
                      <Box sx={(th) => ({ width: 16, height: 16, borderRadius: '50%', backgroundColor: c.hex, boxShadow: `inset 0 0 0 1px ${th.admin.lineStrong}`, flex: 'none' })} />
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{c.name || `Colour ${i + 1}`}</Typography>
                    </Box>
                    <TextField size="small" label="Price" type="number" value={c.price} onChange={(e) => setIn('colourways', i, { price: e.target.value })} slotProps={{ input: { startAdornment: <InputAdornment position="start">NPR</InputAdornment> }, htmlInput: { min: 0, step: 50 } }} {...fp(`colourways.${i}.price`)} />
                    <TextField size="small" label="Compare-at price" type="number" value={c.regularPrice} onChange={(e) => setIn('colourways', i, { regularPrice: e.target.value })} slotProps={{ input: { startAdornment: <InputAdornment position="start">NPR</InputAdornment> }, htmlInput: { min: 0, step: 50 } }} {...fp(`colourways.${i}.regularPrice`)} />
                    <Box sx={{ minHeight: 40, display: 'flex', alignItems: 'center' }}>
                      {off ? <Box component="span" sx={(th) => ({ fontSize: 12.5, fontWeight: 800, px: 1, borderRadius: 999, lineHeight: '22px', color: th.palette.mode === 'dark' ? '#FF9CB9' : '#C2124F', backgroundColor: th.palette.mode === 'dark' ? 'rgba(255,156,185,0.14)' : '#FCE4EC' })}>−{off}%</Box> : null}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Section>

          <Section
            id="variants"
            title="Colours, sizes and stock"
            desc={`Tick the UK sizes each colour comes in and enter the pairs on hand. ${LOW_STOCK} or fewer shows as low stock.`}
            action={<Typography variant="body2" sx={(th) => ({ color: th.admin.ink2, fontVariantNumeric: 'tabular-nums' })}>{totalPairs} pairs</Typography>}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {form.colourways.map((c, i) => (
                <Box key={i} role="group" aria-label={c.name || `Colour ${i + 1}`} sx={(th) => ({ border: `1px solid ${th.admin.line}`, borderRadius: '10px', p: 2, display: 'flex', flexDirection: 'column', gap: 2 })}>
                  <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: '1.2fr 1fr 1fr 1.2fr' }, alignItems: 'start' }}>
                    <TextField size="small" label="Colour name" value={c.name} onChange={(e) => setIn('colourways', i, { name: e.target.value, ...(c._new && !c._keyTouched ? { key: slugify(e.target.value) } : {}) })} {...fp(`colourways.${i}.name`)} />
                    <TextField size="small" label="Nepali name" value={c.nameNe} onChange={(e) => setIn('colourways', i, { nameNe: e.target.value })} slotProps={{ htmlInput: { lang: 'ne', style: { fontFamily: 'Mukta, sans-serif' } } }} />
                    <TextField size="small" label="Key" value={c.key} disabled={!c._new && !isNew} onChange={(e) => setIn('colourways', i, { key: e.target.value, _keyTouched: true })} {...fp(`colourways.${i}.key`, c._new || isNew ? 'e.g. olive' : 'Fixed after saving')} />
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Box component="input" type="color" aria-label={`Swatch colour for ${c.name || `colour ${i + 1}`}`} value={HEX.test(c.hex) ? c.hex : '#000000'} onChange={(e) => setIn('colourways', i, { hex: e.target.value.toUpperCase() })} sx={(th) => ({ width: 40, height: 40, p: 0.25, border: `1px solid ${th.admin.lineStrong}`, borderRadius: '8px', background: 'none', cursor: 'pointer', flex: 'none' })} />
                      <TextField size="small" label="Hex" value={c.hex} onChange={(e) => setIn('colourways', i, { hex: e.target.value })} sx={{ flex: 1 }} {...fp(`colourways.${i}.hex`)} />
                    </Box>
                  </Box>

                  <Box>
                    <Typography id={fid(`colourways.${i}.sizes`)} tabIndex={-1} variant="subtitle2" sx={{ mb: 1 }}>Sizes and pairs on hand</Typography>
                    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))' }}>
                      {SIZE_OPTIONS.map((s) => {
                        const has = c.sizes.includes(s);
                        const q = c.stock?.[s];
                        const qn = q === '' || q == null ? null : Number(q);
                        const tone = !has ? null : c.inStock === false || qn === 0 ? 'out' : qn != null && qn <= LOW_STOCK ? 'low' : null;
                        return (
                          <Box key={s} sx={(th) => ({ border: `1px ${has ? 'solid' : 'dashed'} ${fe(`colourways.${i}.stock.${s}`) ? th.admin.bad : has ? th.admin.lineStrong : th.admin.line}`, borderRadius: '8px', p: 0.75, backgroundColor: has ? th.admin.surface : 'transparent' })}>
                            <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                              <input type="checkbox" checked={has} onChange={() => toggleSize(i, s)} aria-label={`Offer UK ${s} in ${c.name || `colour ${i + 1}`}`} />
                              UK {s}
                            </Box>
                            {has ? (
                              <Box
                                component="input"
                                type="number"
                                min={0}
                                inputMode="numeric"
                                id={fid(`colourways.${i}.stock.${s}`)}
                                aria-label={`Pairs on hand, ${c.name || `colour ${i + 1}`}, UK ${s}`}
                                value={q ?? ''}
                                placeholder="–"
                                onChange={(e) => setIn('colourways', i, { stock: { ...c.stock, [s]: e.target.value === '' ? '' : Number(e.target.value) } })}
                                sx={(th) => ({
                                  mt: 0.5, width: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', textAlign: 'center', borderRadius: '6px', py: 0.5,
                                  border: `1px solid ${th.admin.line}`, color: tone === 'out' ? th.admin.bad : tone === 'low' ? th.admin.warn : th.admin.ink,
                                  backgroundColor: tone === 'out' ? (th.palette.mode === 'dark' ? 'rgba(255,156,148,0.12)' : '#FBE4E2') : tone === 'low' ? th.admin.warnWash : th.admin.sunk,
                                  '&:focus': { outline: `2px solid ${th.admin.accentText}`, outlineOffset: 0 },
                                })}
                              />
                            ) : null}
                          </Box>
                        );
                      })}
                    </Box>
                    {fe(`colourways.${i}.sizes`) ? <Typography variant="caption" sx={(th) => ({ color: th.admin.bad, display: 'block', mt: 0.75 })}>{fe(`colourways.${i}.sizes`)}</Typography> : null}
                  </Box>

                  <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '1fr auto' }, alignItems: 'center' }}>
                    <TextField size="small" label="Product page on goldstarshoes.com" value={c.productUrl} onChange={(e) => setIn('colourways', i, { productUrl: e.target.value })} {...fp(`colourways.${i}.productUrl`)} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControlLabel control={<Switch checked={c.inStock} onChange={(e) => setIn('colourways', i, { inStock: e.target.checked })} />} label="Available to order" />
                      {form.colourways.length > 1 ? <Tooltip title="Remove colour"><IconButton onClick={() => setRemoveIdx(i)} aria-label={`Remove ${c.name || `colour ${i + 1}`}`} sx={(th) => ({ '&:hover': { color: th.admin.bad } })}><Trash2 size={17} aria-hidden="true" /></IconButton></Tooltip> : null}
                    </Box>
                  </Box>
                </Box>
              ))}
              <Button variant="outlined" startIcon={<Plus size={16} aria-hidden="true" />} sx={{ alignSelf: 'flex-start' }} onClick={() => set('colourways', [...form.colourways, blankColour()])}>Add colour</Button>
            </Box>
          </Section>

          <Section id="images" title="Images">
            <ImagesEditor form={form} setIn={setIn} fe={fe} />
          </Section>

          <Accordion sx={(th) => ({ backgroundColor: th.admin.surface, border: `1px solid ${th.admin.line}`, borderRadius: '12px !important', '&:before': { display: 'none' } })}>
            <AccordionSummary expandIcon={<ChevronDown size={18} aria-hidden="true" />} sx={{ px: 2.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 15 }}>3D spec callouts</Typography>
                <Typography variant="caption" sx={(th) => ({ color: th.admin.ink2 })}>Advanced · {form.specCallouts.length} labels pinned to the 3D boot on the home page</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {form.specCallouts.map((s, i) => (
                <Box key={i} role="group" aria-label={`Callout ${s.title || i + 1}`} sx={(th) => ({ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(6, 1fr)' }, gap: 1.5, p: 2, borderRadius: '10px', border: `1px solid ${th.admin.line}` })}>
                  <TextField size="small" label="Key" value={s.key} onChange={(e) => setIn('specCallouts', i, { key: e.target.value })} sx={{ gridColumn: { md: 'span 2' } }} {...fp(`specCallouts.${i}.key`)} />
                  <TextField size="small" label="Title" value={s.title} onChange={(e) => setIn('specCallouts', i, { title: e.target.value })} sx={{ gridColumn: { md: 'span 4' } }} {...fp(`specCallouts.${i}.title`)} />
                  <TextField size="small" label="Body" value={s.body} multiline minRows={2} onChange={(e) => setIn('specCallouts', i, { body: e.target.value })} sx={{ gridColumn: '1 / -1' }} {...fp(`specCallouts.${i}.body`)} />
                  <FormControl size="small" sx={{ gridColumn: { md: 'span 2' } }}><InputLabel id={`an-${i}`}>Anchor</InputLabel><Select labelId={`an-${i}`} label="Anchor" value={s.anchor} onChange={(e) => setIn('specCallouts', i, { anchor: e.target.value })}>{ANCHORS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}</Select></FormControl>
                  <FormControl size="small"><InputLabel id={`st-${i}`}>Stage</InputLabel><Select labelId={`st-${i}`} label="Stage" value={s.stage} onChange={(e) => setIn('specCallouts', i, { stage: e.target.value })}>{STAGES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}</Select></FormControl>
                  <FormControl size="small"><InputLabel id={`bd-${i}`}>Badge</InputLabel><Select labelId={`bd-${i}`} label="Badge" value={s.badge} onChange={(e) => setIn('specCallouts', i, { badge: e.target.value })}>{BADGES.map((a) => <MenuItem key={a || 'none'} value={a}>{a || 'none'}</MenuItem>)}</Select></FormControl>
                  <TextField size="small" label="Order" type="number" value={s.order} onChange={(e) => setIn('specCallouts', i, { order: e.target.value })} {...fp(`specCallouts.${i}.order`)} />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}><Button size="small" variant="text" onClick={() => set('specCallouts', form.specCallouts.filter((_, n) => n !== i))} sx={(th) => ({ color: th.admin.bad })}>Remove</Button></Box>
                  {['x', 'y', 'z'].map((ax, n) => (
                    <TextField key={ax} size="small" label={`Position ${ax}`} type="number" value={s.position?.[n] ?? ''} onChange={(e) => { const pos = [...(s.position || ['', '', ''])]; pos[n] = e.target.value; setIn('specCallouts', i, { position: pos.every((v) => v === '') ? null : pos }); }} sx={{ gridColumn: { md: 'span 2' } }} {...fp(`specCallouts.${i}.position`)} />
                  ))}
                </Box>
              ))}
              <Button variant="outlined" size="small" startIcon={<Plus size={16} aria-hidden="true" />} sx={{ alignSelf: 'flex-start' }} onClick={() => set('specCallouts', [...form.specCallouts, blankCallout(form.specCallouts.length + 1)])}>Add callout</Button>
            </AccordionDetails>
          </Accordion>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, position: { lg: 'sticky' }, top: { lg: 88 } }}>
          <Panel title="Status">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <FormControlLabel control={<Switch checked={form.active} onChange={(e) => set('active', e.target.checked)} />} label={form.active ? 'Active: shown in the shop' : 'Archived: hidden from the shop'} />
              <FormControlLabel control={<Switch checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />} label="Featured first in the shop" />
              <TextField size="small" label="Sort order" type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} sx={{ mt: 1.5 }} {...fp('sortOrder', 'Lower numbers show first.')} />
            </Box>
          </Panel>
          <Panel title="Preview"><Preview form={form} /></Panel>
        </Box>
      </Box>

      <Box
        sx={(th) => ({
          position: 'sticky', bottom: 0, zIndex: 10, mx: { xs: -2, sm: -3, lg: -4 }, mb: { xs: -2, sm: -3 }, px: { xs: 2, sm: 3, lg: 4 }, py: 1.5,
          display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end',
          backgroundColor: th.palette.mode === 'dark' ? 'rgba(26,25,22,0.94)' : 'rgba(255,255,255,0.94)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${th.admin.line}`,
        })}
      >
        <Typography variant="body2" aria-live="polite" sx={(th) => ({ color: dirty ? th.admin.warn : th.admin.ink3, fontWeight: 600, mr: 'auto' })}>{dirty ? 'Unsaved changes' : isNew ? 'New product' : 'All changes saved'}</Typography>
        <Button variant="outlined" disabled={!dirty || save.isPending} onClick={() => { setForm(JSON.parse(initial.current)); setErrors([]); setTried(false); }}>Discard</Button>
        <Button variant="contained" onClick={submit} disabled={save.isPending || (!dirty && !isNew)} startIcon={save.isPending ? <CircularProgress size={15} color="inherit" /> : null}>{isNew ? 'Create product' : 'Save changes'}</Button>
      </Box>

      <Dialog open={removeIdx != null} onClose={() => setRemoveIdx(null)} aria-labelledby="rm-title">
        <DialogTitle id="rm-title">Remove {form.colourways[removeIdx]?.name || 'this colour'}?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">Its sizes, stock and images are removed too. Nothing changes until you save.</Typography></DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setRemoveIdx(null)}>Keep</Button>
          <Button variant="contained" color="error" onClick={() => { set('colourways', form.colourways.filter((_, n) => n !== removeIdx)); setRemoveIdx(null); }}>Remove</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()} aria-labelledby="unsaved-title">
        <DialogTitle id="unsaved-title">Leave without saving?</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">Your changes to this product will be lost.</Typography></DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => blocker.reset?.()}>Keep editing</Button>
          <Button variant="contained" onClick={() => blocker.proceed?.()}>Leave</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
