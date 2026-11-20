import { useId, useState } from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Eye, EyeOff } from 'lucide-react';

// `rule` is the always-visible rule text tied to the field with aria-describedby.
export default function PasswordField({ error, rule, label = 'Password', enterKeyHint, ...rest }) {
  const [show, setShow] = useState(false);
  const id = useId();
  const helperId = `${id}-help`;
  return (
    <TextField
      {...rest}
      id={id}
      label={label}
      type={show ? 'text' : 'password'}
      error={!!error}
      helperText={error || rule}
      slotProps={{
        htmlInput: { 'aria-invalid': !!error, 'aria-describedby': error || rule ? helperId : undefined, autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false, enterKeyHint },
        formHelperText: { id: helperId },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)} edge="end">
                {show ? <EyeOff size={20} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={20} strokeWidth={1.75} aria-hidden="true" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
