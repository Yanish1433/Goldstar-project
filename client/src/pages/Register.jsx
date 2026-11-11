import { useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import { PageBox, useTitle } from '../components/Page.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { useRegister } from '../api/hooks.js';
import { detailsToErrors, focusFirstInvalid, PHONE_RE, cleanPhone } from '../lib/forms.js';
import { landingFor } from '../lib/paths.js';

const RULE = '8 or more characters, with a letter and a number';

export default function Register() {
  useTitle('Create an account');
  const [params] = useSearchParams();
  const next = params.get('next');
  const navigate = useNavigate();
  const reg = useRegister();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const ref = useRef(null);
  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };

  const submit = async (e) => {
    e.preventDefault();
    if (reg.isPending) return;
    const local = {};
    if (form.name.trim().length < 2) local.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) local.email = 'Enter a valid email address.';
    if (form.phone && !PHONE_RE.test(cleanPhone(form.phone))) local.phone = 'Enter a Nepali mobile number, e.g. 98XXXXXXXX.';
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(form.password)) local.password = RULE + '.';
    setErrors(local);
    setFormError('');
    if (Object.keys(local).length) return focusFirstInvalid(ref.current);
    const body = { name: form.name.trim(), email: form.email.trim(), password: form.password };
    if (form.phone) body.phone = cleanPhone(form.phone);
    try {
      const d = await reg.mutateAsync(body);
      navigate(landingFor(d?.user, next), { replace: true });
    } catch (err) {
      setErrors(detailsToErrors(err));
      setFormError(err.message);
      focusFirstInvalid(ref.current);
    }
  };

  // Validate on blur (S7), not on every key.
  const check = {
    name: (v) => (v.trim().length < 2 ? 'Enter your name.' : ''),
    email: (v) => (/^\S+@\S+\.\S+$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
    phone: (v) => (v && !PHONE_RE.test(cleanPhone(v)) ? 'Enter a Nepali mobile number, e.g. 98XXXXXXXX.' : ''),
  };
  const blur = (k) => () => {
    if (!check[k]) return;
    const msg = check[k](form[k]);
    setErrors((e) => {
      const n = { ...e };
      if (msg) n[k] = msg;
      else delete n[k];
      return n;
    });
  };
  const field = (k, label, extra = {}) => (
    <TextField label={label} name={k} value={form[k]} onChange={set(k)} onBlur={blur(k)} error={!!errors[k]} helperText={errors[k] || extra.help} slotProps={{ htmlInput: { 'aria-invalid': !!errors[k] } }} {...extra.props} />
  );

  return (
    <PageBox sx={{ py: { xs: 6, md: 12 } }}>
      <Box component="form" ref={ref} noValidate onSubmit={submit} sx={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h3" component="h1">Create an account</Typography>
        {formError ? <Alert severity="error" role="alert">{formError}</Alert> : null}
        {field('name', 'Full name', { props: { autoComplete: 'name' } })}
        {field('email', 'Email', { props: { type: 'email', autoComplete: 'email' } })}
        {field('phone', 'Mobile number (optional)', { props: { type: 'tel', autoComplete: 'tel' }, help: 'For delivery calls, e.g. 98XXXXXXXX.' })}
        <PasswordField label="Password" name="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} rule={RULE} />
        <Button type="submit" variant="contained" size="large" aria-disabled={reg.isPending} startIcon={reg.isPending ? <CircularProgress size={18} color="inherit" /> : null}>
          {reg.isPending ? 'Creating account' : 'Create account'}
        </Button>
        <Typography variant="body2" color="text.secondary">
          Already have an account? <Link component={RouterLink} to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>Log in</Link>
        </Typography>
      </Box>
    </PageBox>
  );
}
