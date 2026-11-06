import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useBlocker, useNavigate, useParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import NotFound from '../NotFound.jsx';
import { useAdminProduct, useSaveProduct } from '../../api/hooks.js';
import { useUi } from '../../store/ui.js';
import { tokens } from '../../theme/tokens.js';

const ANCHORS = ['upper', 'overlay', 'eyelets', 'collar', 'footbed', 'midsole', 'outsole'];
const STAGES = ['callout', 'layer'];
const BADGES = ['', 'support', 'cushion', 'grip'];
const CATEGORY_OPTIONS = ['trek-collection', 'women', 'men', 'casual', 'new-arrival', 'trending', 'in-stock'];
const SIZE_OPTIONS = ['4', '5', '6', '7', '8', '9', '10', '11'];

const blankColour = () => ({ key: '', name: '', nameNe: '', hex: '#888888', price: 0, regularPrice: 0, sizes: [], inStock: true, images: [], productUrl: 'https://goldstarshoes.com/', wooIds: [], _new: true });
const blankCallout = (order) => ({ key: '', title: '', body: '', anchor: 'upper', stage: 'callout', badge: '', order, position: null });
const blank = () => ({ slug: '', name: '', series: '', categories: [], description: '', shortSpecs: [], featured: false, active: true, sortOrder: 100, colourways: [blankColour()], specCallouts: [] });

const fromApi = (p) => ({
  ...p,
  series: p.series || '',
  colourways: p.colourways.map((c) => ({ ...c, nameNe: c.nameNe || '' })),
  specCallouts: p.specCallouts.map((s) => ({ ...s, badge: s.badge || '' })),
});

function toBody(f, isNew) {
  const num = (v) => Number(v) || 0;
  const body = {
    name: f.name.trim(),
    categories: f.categories,
    description: f.description,
    shortSpecs: f.shortSpecs,
    featured: f.featured,
    active: f.active,
    sortOrder: num(f.sortOrder),
    colourways: f.colourways.map((c) => {
      const o = { key: c.key.trim(), name: c.name.trim(), hex: c.hex, price: num(c.price), regularPrice: num(c.regularPrice) || num(c.price), sizes: c.sizes, inStock: c.inStock, images: c.images, productUrl: c.productUrl, wooIds: c.wooIds || [] };
      o.nameNe = c.nameNe.trim() ? c.nameNe.trim() : null;
      o.images = c.images.map((im) => ({ src: im.src, thumb: im.thumb, alt: im.alt || '' }));
      return o;
    }),
    specCallouts: f.specCallouts.map((s) => ({ key: s.key.trim(), title: s.title.trim(), body: s.body.trim(), anchor: s.anchor, stage: s.stage, badge: s.badge || null, order: num(s.order), position: s.position && s.position.every((n) => n !== '' && Number.isFinite(Number(n))) ? s.position.map(Number) : null })),
  };
  body.series = f.series.trim() ? f.series.trim() : null;
  if (isNew) body.slug = f.slug.trim();
  return body;
}

export function Component() {
  return <AdminProductEdit />;
}

export default function AdminProductEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { data, isLoading, error } = useAdminProduct(id);
  const save = useSaveProduct();
  const showSnackbar = useUi((s) => s.showSnackbar);
  const [form, setForm] = useState(null);
  const initial = useRef('');
  const [errors, setErrors] = useState([]);
  const [saved, setSaved] = useState(false);
  const barRef = useRef(null);

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

  const dirty = useMemo(() => form && JSON.stringify(form) !== initial.current, [form]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saved && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!isNew && isLoading) return <Skeleton variant="rectangular" height={400} />;
  if (!isNew && (error || !data)) return <NotFound />;
  if (!form) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setIn = (list, i, patch) => setForm((f) => ({ ...f, [list]: f[list].map((x, n) => (n === i ? { ...x, ...patch } : x)) }));
  const fe = (path) => errors.find((e) => e.path === path)?.message;
  const fieldProps = (path) => ({ error: !!fe(path), helperText: fe(path) });

  const submit = async () => {
    setErrors([]);
    try {
      let body = toBody(form, isNew);
      if (!isNew) {
        // PATCH sends only the fields that changed (Addendum A.1).
        const before = toBody(JSON.parse(initial.current), false);
        body = Object.fromEntries(Object.entries(body).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(before[k])));
      }
      const res = await save.mutateAsync({ id: isNew ? undefined : id, body });
      setSaved(true);
      showSnackbar({ message: 'Product saved' });
      const f = fromApi(res.product);
      initial.current = JSON.stringify(f);
      setForm(f);
      if (isNew) navigate(`/admin/products/${res.product.id}`, { replace: true });
      else setTimeout(() => setSaved(false), 0);
    } catch (e) {
      setErrors(e.details?.length ? e.details : [{ path: '', message: e.message }]);
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 14 }}>
      <Link component={RouterLink} to="/admin/products" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start' }}>Back to products</Link>
      <Typography variant="h3" component="h1">{isNew ? 'New product' : form.name || 'Edit product'}</Typography>
      {errors.length ? (
        <Alert severity="error" role="alert">
          Check the highlighted fields.
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{errors.map((e, i) => <li key={i}>{e.path ? `${e.path}: ` : ''}{e.message}</li>)}</ul>
        </Alert>
      ) : null}

      <Box component="section" aria-labelledby="sec-details" sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 720 }}>
        <Typography id="sec-details" variant="h4" component="h2">Details</Typography>
        <TextField label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} {...fieldProps('name')} />
        <TextField label="Slug" value={form.slug} disabled={!isNew} onChange={(e) => set('slug', e.target.value)} helperText={isNew ? fe('slug') || 'Lowercase letters, numbers and hyphens. Cannot be changed later.' : 'Slug cannot be changed.'} error={!!fe('slug')} />
        <TextField label="Series" value={form.series} onChange={(e) => set('series', e.target.value)} {...fieldProps('series')} />
        <Autocomplete multiple freeSolo options={CATEGORY_OPTIONS} value={form.categories} onChange={(_, v) => set('categories', v)} renderInput={(p) => <TextField {...p} label="Categories" />} />
        <TextField label="Description" multiline minRows={4} value={form.description} onChange={(e) => set('description', e.target.value)} {...fieldProps('description')} />
        <Autocomplete multiple freeSolo options={[]} value={form.shortSpecs} onChange={(_, v) => set('shortSpecs', v)} renderInput={(p) => <TextField {...p} label="Short specs" helperText="Type a line and press Enter." />} />
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControlLabel control={<Switch checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />} label="Featured" />
          <FormControlLabel control={<Switch checked={form.active} onChange={(e) => set('active', e.target.checked)} />} label="Active (shown in the shop)" />
          <TextField label="Sort order" type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} sx={{ width: 160 }} {...fieldProps('sortOrder')} />
        </Box>
      </Box>

      <Box component="section" aria-labelledby="sec-colours" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography id="sec-colours" variant="h4" component="h2">Colourways</Typography>
        {form.colourways.map((c, i) => (
          <Accordion key={i} defaultExpanded={form.colourways.length === 1 || isNew}>
            <AccordionSummary expandIcon={<ChevronDown size={20} aria-hidden="true" />} aria-controls={`cw-${i}`} id={`cw-h-${i}`}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ width: 20, height: 20, backgroundColor: c.hex, outline: `1px solid ${tokens.fieldBorder}` }} />
                <Typography sx={{ fontWeight: 600 }}>{c.name || 'New colourway'}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails id={`cw-${i}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField label="Key" value={c.key} disabled={!c._new && !isNew} onChange={(e) => setIn('colourways', i, { key: e.target.value })} helperText={fe(`colourways.${i}.key`) || 'Kebab-case, e.g. olive. Read-only after save.'} error={!!fe(`colourways.${i}.key`)} />
              <TextField label="Name" value={c.name} onChange={(e) => setIn('colourways', i, { name: e.target.value })} {...fieldProps(`colourways.${i}.name`)} />
              <TextField label="Nepali name" value={c.nameNe} onChange={(e) => setIn('colourways', i, { nameNe: e.target.value })} slotProps={{ htmlInput: { lang: 'ne', style: { fontFamily: 'Mukta' } } }} />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box component="input" type="color" aria-label="Swatch colour" value={c.hex} onChange={(e) => setIn('colourways', i, { hex: e.target.value })} sx={{ width: 52, height: 52, p: 0, border: 0, background: 'none' }} />
                <TextField label="Swatch hex" value={c.hex} onChange={(e) => setIn('colourways', i, { hex: e.target.value })} sx={{ flex: 1 }} {...fieldProps(`colourways.${i}.hex`)} />
              </Box>
              <TextField label="Price (NPR)" type="number" value={c.price} onChange={(e) => setIn('colourways', i, { price: e.target.value })} {...fieldProps(`colourways.${i}.price`)} />
              <TextField label="Regular price (NPR)" type="number" value={c.regularPrice} onChange={(e) => setIn('colourways', i, { regularPrice: e.target.value })} {...fieldProps(`colourways.${i}.regularPrice`)} />
              <Autocomplete multiple freeSolo options={SIZE_OPTIONS} value={c.sizes} onChange={(_, v) => setIn('colourways', i, { sizes: v })} renderInput={(p) => <TextField {...p} label="UK sizes" {...fieldProps(`colourways.${i}.sizes`)} />} />
              <FormControlLabel control={<Switch checked={c.inStock} onChange={(e) => setIn('colourways', i, { inStock: e.target.checked })} />} label="In stock" />
              <TextField label="Product URL" value={c.productUrl} onChange={(e) => setIn('colourways', i, { productUrl: e.target.value })} sx={{ gridColumn: { md: '1 / -1' } }} {...fieldProps(`colourways.${i}.productUrl`)} />
              <Box sx={{ gridColumn: { md: '1 / -1' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" component="h3">Images</Typography>
                {c.images.map((im, n) => (
                  <Box key={n} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 2fr 1fr auto' }, gap: 1.5, alignItems: 'center' }}>
                    <TextField label="Image URL" value={im.src} onChange={(e) => setIn('colourways', i, { images: c.images.map((x, k) => (k === n ? { ...x, src: e.target.value } : x)) })} />
                    <TextField label="Thumbnail URL" value={im.thumb} onChange={(e) => setIn('colourways', i, { images: c.images.map((x, k) => (k === n ? { ...x, thumb: e.target.value } : x)) })} />
                    <TextField label="Alt text" value={im.alt} onChange={(e) => setIn('colourways', i, { images: c.images.map((x, k) => (k === n ? { ...x, alt: e.target.value } : x)) })} />
                    <IconButton aria-label={`Remove image ${n + 1}`} onClick={() => setIn('colourways', i, { images: c.images.filter((_, k) => k !== n) })}><Trash2 size={20} aria-hidden="true" /></IconButton>
                  </Box>
                ))}
                <Button variant="outlined" startIcon={<Plus size={18} aria-hidden="true" />} sx={{ alignSelf: 'flex-start' }} onClick={() => setIn('colourways', i, { images: [...c.images, { src: 'https://', thumb: 'https://', alt: '' }] })}>Add image</Button>
              </Box>
              {form.colourways.length > 1 ? <Button variant="text" sx={{ justifySelf: 'start' }} onClick={() => set('colourways', form.colourways.filter((_, n) => n !== i))}>Remove colourway</Button> : null}
            </AccordionDetails>
          </Accordion>
        ))}
        <Button variant="outlined" startIcon={<Plus size={18} aria-hidden="true" />} sx={{ alignSelf: 'flex-start' }} onClick={() => set('colourways', [...form.colourways, blankColour()])}>Add colourway</Button>
      </Box>

      <Box component="section" aria-labelledby="sec-callouts" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography id="sec-callouts" variant="h4" component="h2">Spec callouts</Typography>
        {form.specCallouts.length === 0 ? <Typography color="text.secondary">No callouts for this product.</Typography> : null}
        {form.specCallouts.map((s, i) => (
          <Box key={i} role="group" aria-label={`Callout ${s.title || i + 1}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(6, 1fr)' }, gap: 2, p: 2, backgroundColor: 'background.paper' }}>
            <TextField label="Key" value={s.key} onChange={(e) => setIn('specCallouts', i, { key: e.target.value })} sx={{ gridColumn: { md: 'span 2' } }} {...fieldProps(`specCallouts.${i}.key`)} />
            <TextField label="Title" value={s.title} onChange={(e) => setIn('specCallouts', i, { title: e.target.value })} sx={{ gridColumn: { md: 'span 4' } }} {...fieldProps(`specCallouts.${i}.title`)} />
            <TextField label="Body" value={s.body} multiline minRows={2} onChange={(e) => setIn('specCallouts', i, { body: e.target.value })} sx={{ gridColumn: { md: '1 / -1' } }} {...fieldProps(`specCallouts.${i}.body`)} />
            <FormControl sx={{ gridColumn: { md: 'span 2' } }}><InputLabel id={`an-${i}`}>Anchor</InputLabel><Select labelId={`an-${i}`} label="Anchor" value={s.anchor} onChange={(e) => setIn('specCallouts', i, { anchor: e.target.value })}>{ANCHORS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}</Select></FormControl>
            <FormControl><InputLabel id={`st-${i}`}>Stage</InputLabel><Select labelId={`st-${i}`} label="Stage" value={s.stage} onChange={(e) => setIn('specCallouts', i, { stage: e.target.value })}>{STAGES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}</Select></FormControl>
            <FormControl><InputLabel id={`bd-${i}`}>Badge</InputLabel><Select labelId={`bd-${i}`} label="Badge" value={s.badge} onChange={(e) => setIn('specCallouts', i, { badge: e.target.value })}>{BADGES.map((a) => <MenuItem key={a || 'none'} value={a}>{a || 'none'}</MenuItem>)}</Select></FormControl>
            <TextField label="Order" type="number" value={s.order} onChange={(e) => setIn('specCallouts', i, { order: e.target.value })} {...fieldProps(`specCallouts.${i}.order`)} />
            {['x', 'y', 'z'].map((ax, n) => (
              <TextField key={ax} label={`Position ${ax}`} type="number" value={s.position?.[n] ?? ''} onChange={(e) => { const pos = [...(s.position || ['', '', ''])]; pos[n] = e.target.value; setIn('specCallouts', i, { position: pos.every((v) => v === '') ? null : pos }); }} {...fieldProps(`specCallouts.${i}.position`)} />
            ))}
            <Box sx={{ gridColumn: { md: '1 / -1' } }}><Button variant="text" onClick={() => set('specCallouts', form.specCallouts.filter((_, n) => n !== i))}>Remove callout</Button></Box>
          </Box>
        ))}
        <Button variant="outlined" startIcon={<Plus size={18} aria-hidden="true" />} sx={{ alignSelf: 'flex-start' }} onClick={() => set('specCallouts', [...form.specCallouts, blankCallout(form.specCallouts.length + 1)])}>Add callout</Button>
      </Box>

      <Box ref={barRef} sx={{ position: 'sticky', bottom: 0, zIndex: 5, backgroundColor: 'background.default', py: 2, display: 'flex', gap: 2, alignItems: 'center', boxShadow: `0 -1px 0 ${tokens.divider}` }}>
        <Button variant="contained" size="large" onClick={submit} aria-disabled={save.isPending || !dirty} startIcon={save.isPending ? <CircularProgress size={18} color="inherit" /> : null}>Save changes</Button>
        <Button variant="outlined" size="large" disabled={!dirty} onClick={() => { setForm(JSON.parse(initial.current)); setErrors([]); }}>Discard</Button>
        {dirty ? <Typography variant="body2" color="text.secondary">Unsaved changes</Typography> : null}
      </Box>

      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()} aria-labelledby="unsaved-title">
        <DialogTitle id="unsaved-title">Leave without saving?</DialogTitle>
        <DialogContent><Typography color="text.secondary">Your changes to this product will be lost.</Typography></DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => blocker.reset?.()}>Keep editing</Button>
          <Button variant="contained" onClick={() => blocker.proceed?.()}>Leave</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
