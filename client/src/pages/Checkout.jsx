import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import CircularProgress from '@mui/material/CircularProgress';
import { PageBox, useTitle } from '../components/Page.jsx';
import { useCart, cartSubtotal } from '../store/cart.js';
import { useMe, usePlaceOrder, useQuote } from '../api/hooks.js';
import { formatNPR } from '../lib/format.js';
import { detailsToErrors, focusFirstInvalid, PHONE_RE, cleanPhone } from '../lib/forms.js';
import { tokens } from '../theme/tokens.js';
import InputAdornment from '@mui/material/InputAdornment';
import { Check } from 'lucide-react';

const emptyForm = { fullName: '', phone: '', addressLine: '', area: '', city: '', landmark: '', notes: '' };

export function Component() {
  return <Checkout />;
}

export default function Checkout() {
  useTitle('Checkout');
  const navigate = useNavigate();
  const me = useMe();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const replacePrices = useCart((s) => s.replacePrices);
  const localSubtotal = useCart(cartSubtotal);
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
      slotProps={{
        htmlInput: { 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-error` : undefined },
        formHelperText: { id: `${k}-error` },
        input: k === 'phone' && phoneValid ? { endAdornment: <InputAdornment position="end"><Check size={20} strokeWidth={1.75} color={tokens.success} aria-label="Looks valid" role="img" /></InputAdornment> } : undefined,
      }}
      {...props}
    />
  );

  if (lines.length === 0) {
    return (
      <PageBox sx={{ py: { xs: 6, md: 12 }, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
        <Typography variant="h3" component="h1">Checkout</Typography>
        <Typography>Your cart is empty.</Typography>
        <Button component={RouterLink} to="/shop" variant="contained">Shop all</Button>
      </PageBox>
    );
  }

  const subtotal = quote.data?.subtotal ?? localSubtotal;

  return (
    <PageBox sx={{ py: { xs: 4, md: 10 } }}>
      <Typography variant="h3" component="h1" sx={{ mb: { xs: 3, md: 5 } }}>Checkout</Typography>
      <Box component="form" ref={ref} noValidate onSubmit={submit} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,7fr) minmax(0,5fr)' }, gap: { xs: 5, md: 10 }, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {formError ? <Alert severity="error" role="alert">{formError}</Alert> : null}
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography component="legend" variant="h4" sx={{ mb: 3, p: 0 }}>Contact</Typography>
            {tf('fullName', 'Full name', { autoComplete: 'name' })}
            {tf('phone', 'Mobile number', { type: 'tel', autoComplete: 'tel' })}
          </Box>
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography component="legend" variant="h4" sx={{ mb: 3, p: 0 }}>Delivery address</Typography>
            {tf('addressLine', 'Address line', { autoComplete: 'address-line1' })}
            {tf('area', 'Area', { autoComplete: 'address-line2' })}
            {tf('city', 'City', { autoComplete: 'address-level2' })}
            {tf('landmark', 'Landmark (optional)')}
            {tf('notes', 'Notes for delivery (optional)', { multiline: true, minRows: 3 })}
          </Box>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ color: 'text.primary', typography: 'h4', mb: 2 }}>Payment</FormLabel>
            <RadioGroup value="cod" aria-label="Payment method">
              <FormControlLabel
                value="cod"
                control={<Radio sx={{ '&.Mui-checked': { color: tokens.blue }, '& .MuiSvgIcon-root': { fontSize: 28 } }} />}
                label="Cash on delivery"
              />
            </RadioGroup>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Pay in cash when the shoes arrive.</Typography>
          </FormControl>
        </Box>

        <Paper sx={{ p: { xs: 2.5, md: 4 }, position: { md: 'sticky' }, top: { md: 'calc(var(--appbar-h, 64px) + 24px)' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h4" component="h2">Order summary</Typography>
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
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {lines.map((l) => (
              <Box component="li" key={`${l.productId}${l.colourwayKey}${l.size}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2">{l.name}, {l.colourwayName}, UK {l.size} &times; {l.qty}</Typography>
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatNPR(l.qty * l.unitPrice)}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', pt: 1 }}>
            <Typography variant="h6" component="p">Subtotal</Typography>
            <Typography variant="h4" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatNPR(subtotal)}</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">Cash on delivery. Delivery fee confirmed by phone.</Typography>
          <Button type="submit" variant="contained" size="large" aria-disabled={place.isPending} startIcon={place.isPending ? <CircularProgress size={18} color="inherit" /> : null}>
            Place order (cash on delivery)
          </Button>
        </Paper>
      </Box>
    </PageBox>
  );
}
