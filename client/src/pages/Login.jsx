import { useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import { useTitle } from '../components/Page.jsx';
import AuthShell, { authFormSx } from '../components/AuthShell.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { useLogin } from '../api/hooks.js';
import { detailsToErrors, focusFirstInvalid } from '../lib/forms.js';
import { landingFor } from '../lib/paths.js';

export default function Login() {
  useTitle('Log in');
  const [params] = useSearchParams();
  const next = params.get('next');
  const navigate = useNavigate();
  const login = useLogin();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const ref = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (login.isPending) return;
    const local = {};
    if (!form.email.trim()) local.email = 'Enter your email address.';
    if (!form.password) local.password = 'Enter your password.';
    setErrors(local);
    setFormError('');
    if (Object.keys(local).length) return focusFirstInvalid(ref.current);
    try {
      const d = await login.mutateAsync({ email: form.email.trim(), password: form.password });
      navigate(landingFor(d?.user, next), { replace: true });
    } catch (err) {
      const fe = detailsToErrors(err);
      setErrors(fe);
      setFormError(err.message);
      focusFirstInvalid(ref.current);
    }
  };

  return (
    <AuthShell eyebrow="Welcome back" headline="Walk the world" title="Log in" intro="Log in to track your orders and check out faster.">
      <Box component="form" ref={ref} noValidate onSubmit={submit} sx={authFormSx}>
        {formError ? <Alert severity="error" role="alert">{formError}</Alert> : null}
        <TextField id="login-email" label="Email" type="email" name="email" autoComplete="email" value={form.email} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, email: v })); }} error={!!errors.email} helperText={errors.email} slotProps={{ htmlInput: { 'aria-invalid': !!errors.email } }} />
        <PasswordField label="Password" name="password" autoComplete="current-password" value={form.password} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, password: v })); }} error={errors.password} />
        <Button type="submit" variant="contained" size="large" aria-disabled={login.isPending} startIcon={login.isPending ? <CircularProgress size={18} color="inherit" /> : null}>
          {login.isPending ? 'Logging in' : 'Log in'}
        </Button>
        <Typography variant="body2" sx={{ color: '#3A4466', fontSize: 15 }}>
          New here? <Link component={RouterLink} to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>Create an account</Link>
        </Typography>
      </Box>
    </AuthShell>
  );
}
