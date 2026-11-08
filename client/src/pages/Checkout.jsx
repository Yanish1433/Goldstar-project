import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import { Banknote, Check, Lock, ShoppingBag } from 'lucide-react';
import { PageBox, useTitle } from '../components/Page.jsx';
import { Panel, Steps, Thumb, TrustRow } from '../components/shop/kit.jsx';
import { useCart, cartSubtotal } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { useMe, usePlaceOrder, useQuote } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import { detailsToErrors, focusFirstInvalid, PHONE_RE, cleanPhone } from '../lib/forms.js';
import { shop } from '../theme/tokens.js';

const emptyForm = { fullName: '', phone: '', addressLine: '', area: '', city: '', landmark: '', notes: '' };

export function Component() {
  return <Checkout />;
}

const two = { display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2, minmax(0,1fr))' }, gap: 2.5 };

// A numbered form section on a white panel.
function Section({ n, title, children }) {
  return (
    <Panel component="fieldset" sx={{ border: 0, m: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box component="legend" sx={{ float: 'left', width: '100%', p: 0, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5, '& + *': { clear: 'both' } }}>
        <Box component="span" aria-hidden="true" sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: shop.ink, color: '#FFFFFF', display: 'inline-grid', placeItems: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{n}</Box>
        <Typography component="span" variant="h4">{title}</Typography>
      </Box>
      {children}
    </Panel>
  );
}

export default function Checkout() {
  useTitle('Checkout');
  const navigate = useNavigate();
  const me = useMe();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const replacePrices = useCart((s) => s.replacePrices);
  const localSubtotal = useCart(cartSubtotal);
  const openCart = useUi((s) => s.openCart);
  const place = usePlaceOrder();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [problems, setProblems] = useState([]);
  const [formError, setFormError] = useState('');
  const ref = useRef(null);
  const submitting = useRef(false);

  const items = useMemo(() => lines.map((l) => ({ productId: l.productId, colourwayKey: l.colourwayKey, size: l.size, qty: l.qty })), [lines]);
  const quote = useQuote(items);

  useEffect(() => {
    if (me.data) setForm((f) => ({ ...f, fullName: f.fullName || me.data.name || '', phone: f.phone || me.data.phone || '' }));
  }, [me.data]);
  useEffect(() => {
    if (quote.data?.lines) replacePrices(quote.data.lines);
  }, [quote.data, replacePrices]);

  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };

  // Validate on blur (S7), not on every key. Messages are the same ones the submit uses.
  const rules = {
    fullName: (v) => (v.trim().length < 2 ? 'Enter your full name.' : ''),
    phone: (v) => (PHONE_RE.test(cleanPhone(v)) ? '' : 'Enter a Nepali mobile number, e.g. 98XXXXXXXX.'),
    addressLine: (v) => (v.trim().length < 3 ? 'Enter the street, tole or house.' : ''),
    area: (v) => (v.trim().length < 2 ? 'Enter your area, e.g. Maharajgunj.' : ''),
    city: (v) => (v.trim().length < 2 ? 'Enter your city, e.g. Kathmandu.' : ''),
  };
  const blur = (k) => () => {
    if (!rules[k]) return;
    const msg = rules[k](form[k]);
    setErrors((e) => {
      const n = { ...e };
      if (msg) n[k] = msg;
      else delete n[k];
      return n;
    });
  };
  const phoneValid = form.phone && !errors.phone && PHONE_RE.test(cleanPhone(form.phone));

  const submit = async (e) => {
    e.preventDefault();
    if (submitting.current || place.isPending || lines.length === 0) return;
    const local = {};
    if (form.fullName.trim().length < 2) local.fullName = 'Enter your full name.';
    if (!PHONE_RE.test(cleanPhone(form.phone))) local.phone = 'Enter a Nepali mobile number, e.g. 98XXXXXXXX.';
    if (form.addressLine.trim().length < 3) local.addressLine = 'Enter the street, tole or house.';
    if (form.area.trim().length < 2) local.area = 'Enter your area, e.g. Maharajgunj.';
    if (form.city.trim().length < 2) local.city = 'Enter your city, e.g. Kathmandu.';
    setErrors(local);
    setProblems([]);
    setFormError('');
    if (Object.keys(local).length) return focusFirstInvalid(ref.current);
    const shipping = { fullName: form.fullName.trim(), phone: cleanPhone(form.phone), addressLine: form.addressLine.trim(), area: form.area.trim(), city: form.city.trim() };
    if (form.landmark.trim()) shipping.landmark = form.landmark.trim();
    if (form.notes.trim()) shipping.notes = form.notes.trim();
    submitting.current = true;
    try {
      const { order } = await place.mutateAsync({ items, shipping, paymentMethod: 'cod' });
      clear();
      navigate(`/order/${order.id}`, { replace: true });
    } catch (err) {
      if (err.code === 'CART_PROBLEM') {
        setProblems((err.details || []).map((d) => ({ index: Number(String(d.path).split('.')[1]), message: d.message })));
      } else if (err.code === 'UNAUTHENTICATED') {
        navigate('/login?next=/checkout');
      } else {
        const fe = detailsToErrors(err, 'shipping.');
        setErrors(fe);
        setFormError(Object.keys(fe).length ? '' : err.message);
        focusFirstInvalid(ref.current);
      }
    } finally {
      submitting.current = false;
    }
  };

  const tf = (k, label, props = {}) => (
    <TextField
      label={label}
      name={k}
      value={form[k]}
      onChange={set(k)}
      onBlur={blur(k)}
      error={!!errors[k]}
      helperText={errors[k]}
      fullWidth
      slotProps={{
        htmlInput: { 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-error` : undefined, ...(k === 'phone' ? { inputMode: 'tel' } : null) },
        formHelperText: { id: `${k}-error` },
        input: k === 'phone' && phoneValid ? { endAdornment: <InputAdornment position="end"><Check size={20} strokeWidth={2.25} color={shop.success} aria-label="Looks valid" role="img" /></InputAdornment> } : undefined,
      }}
      {...props}
    />
  );

  if (lines.length === 0) {
    return (
      <PageBox sx={{ py: { xs: 6, md: 12 } }}>
        <Panel sx={{ maxWidth: 560, mx: 'auto', py: { xs: 6, md: 8 }, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center' }}>
          <Box sx={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: shop.saffron, display: 'grid', placeItems: 'center' }}>
            <ShoppingBag size={30} strokeWidth={1.75} aria-hidden="true" />
          </Box>
          <Typography variant="h3" component="h1">Checkout</Typography>
          <Typography sx={{ color: shop.ink2 }}>Your cart is empty.</Typography>
          <Button component={RouterLink} to="/shop" variant="contained" size="large">Shop all</Button>
        </Panel>
      </PageBox>
    );
  }

  const subtotal = quote.data?.subtotal ?? localSubtotal;
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const imageFor = (l) => l.image || quote.data?.lines?.find((q) => q.productId === l.productId && q.colourwayKey === l.colourwayKey)?.image || null;

  return (
    <PageBox sx={{ pt: { xs: 3, md: 5 }, pb: { xs: 8, md: 12 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' }, justifyContent: 'space-between', gap: 2.5, mb: { xs: 3, md: 5 } }}>
        <Box>
          <Typography variant="h1" component="h1" sx={{ fontSize: { xs: 40, md: 64 } }}>Checkout</Typography>
          <Typography sx={{ mt: 1, color: shop.ink2, display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 14, fontWeight: 600 }}>
            <Lock size={14} strokeWidth={2.5} aria-hidden="true" /> Demo checkout · nothing is charged online
          </Typography>
        </Box>
        <Steps current={1} />
      </Box>
      <Box component="form" ref={ref} noValidate onSubmit={submit} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,7fr) minmax(0,5fr)' }, gap: { xs: 2.5, md: 4, lg: 6 }, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>
          {formError ? <Alert severity="error" role="alert">{formError}</Alert> : null}
          <Section n={1} title="Contact">
            <Box sx={two}>
              {tf('fullName', 'Full name', { autoComplete: 'name' })}
              {tf('phone', 'Mobile number', { type: 'tel', autoComplete: 'tel' })}
            </Box>
          </Section>
          <Section n={2} title="Delivery address">
            {tf('addressLine', 'Address line', { autoComplete: 'address-line1' })}
            <Box sx={two}>
              {tf('area', 'Area', { autoComplete: 'address-line2' })}
              {tf('city', 'City', { autoComplete: 'address-level2' })}
            </Box>
            {tf('landmark', 'Landmark (optional)')}
            {tf('notes', 'Notes for delivery (optional)', { multiline: true, minRows: 3 })}
          </Section>
          <Section n={3} title="Payment">
            <RadioGroup value="cod" aria-label="Payment method">
              <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: `${shop.radius.md}px`, boxShadow: `inset 0 0 0 2px ${shop.blue}`, backgroundColor: shop.blueWash, cursor: 'pointer' }}>
                <Radio value="cod" sx={{ p: 0.5 }} slotProps={{ input: { 'aria-label': 'Cash on delivery' } }} />
                <Box sx={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: shop.surface, display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: `inset 0 0 0 1px ${shop.line}` }}>
                  <Banknote size={22} strokeWidth={2} aria-hidden="true" />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>Cash on delivery</Typography>
                  <Typography variant="body2" sx={{ color: shop.ink2 }}>Pay in cash when the shoes arrive.</Typography>
                </Box>
              </Box>
            </RadioGroup>
          </Section>
        </Box>

        <Panel sx={{ position: { md: 'sticky' }, top: { md: 'calc(var(--appbar-h, 64px) + 24px)' }, display: 'flex', flexDirection: 'column', gap: 2, boxShadow: `inset 0 0 0 1px ${shop.line}, ${shop.shadowCard}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="h4" component="h2">Order summary</Typography>
            <Button variant="text" size="small" onClick={openCart} sx={{ minHeight: 40, textDecoration: 'underline', textUnderlineOffset: 4 }}>Edit cart</Button>
          </Box>
          {problems.length ? (
            <Alert severity="error" role="alert">
              Some items need attention:
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {problems.map((p) => (
                  <li key={p.index}>{lines[p.index] ? `${lines[p.index].name} ${lines[p.index].colourwayName} UK ${lines[p.index].size}: ` : ''}{p.message}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
          {quote.data?.problems?.length && !problems.length ? <Alert severity="warning">Some items in your cart are no longer available.</Alert> : null}
          <Box component="ul" aria-label={`${count} ${count === 1 ? 'item' : 'items'}`} sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {lines.map((l) => (
              <Box component="li" key={`${l.productId}${l.colourwayKey}${l.size}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ position: 'relative' }}>
                  <Thumb src={imageFor(l)} size={64} />
                  <Box component="span" aria-hidden="true" sx={{ position: 'absolute', top: -6, right: -6, minWidth: 22, height: 22, px: 0.5, boxSizing: 'border-box', borderRadius: '11px', backgroundColor: shop.ink, color: '#FFFFFF', fontSize: 12, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{l.qty}</Box>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>{l.name}</Typography>
                  <Typography variant="body2" sx={{ color: shop.ink2 }}>{l.colourwayName} · UK {l.size} &times; {l.qty}</Typography>
                </Box>
                <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 15 }}>{formatNPR(l.qty * l.unitPrice)}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ borderTop: `1px solid ${shop.line}`, pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: shop.ink2 }}>Subtotal</Typography>
              <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{formatNPR(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: shop.ink2 }}>Delivery</Typography>
              <Typography sx={{ color: shop.ink2, fontWeight: 600 }}>Confirmed by phone</Typography>
            </Box>
          </Box>
          <Box sx={{ borderTop: `1px solid ${shop.line}`, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 17 }}>Total</Typography>
            <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 28, fontStretch: '108%', fontVariationSettings: '"wdth" 108' }}>{formatNPR(subtotal)}</Typography>
          </Box>
          <Button type="submit" variant="contained" size="large" aria-disabled={place.isPending} startIcon={place.isPending ? <CircularProgress size={18} color="inherit" /> : <Lock size={18} strokeWidth={2.25} aria-hidden="true" />}>
            Place order (cash on delivery)
          </Button>
          <Box sx={{ pt: 2, borderTop: `1px solid ${shop.line}` }}>
            <TrustRow variant="stack" />
          </Box>
        </Panel>
      </Box>
    </PageBox>
  );
}
