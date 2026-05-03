import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';

type AuthPageProps = {
  token: string | null;
  onAuthenticated: (token: string) => void;
};

type AuthMode = 'login' | 'register';

export function AuthPage({ token, onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  useEffect(() => {
    setError('');
  }, [mode]);

  const title = useMemo(
    () => (mode === 'login' ? 'Sign in to continue' : 'Create your workspace account'),
    [mode],
  );

  if (token) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response =
        mode === 'login'
          ? await api.login({
              email: form.email,
              password: form.password,
            })
          : await api.register({
              email: form.email,
              password: form.password,
              name: form.name,
              phone: form.phone,
            });

      onAuthenticated(response.accessToken);
    } catch (error) {
      setError(
        error instanceof ApiError ? error.message : 'Authentication failed',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <div className="brand-mark large">PM</div>
        <h1>PromoCode Manager</h1>
        <p>
          Lightweight operations cockpit for promo campaigns, order flows, and
          ClickHouse-backed analytics.
        </p>
        <ul className="auth-points">
          <li>JWT-based protected workflows</li>
          <li>MongoDB write model with ClickHouse analytics</li>
          <li>Redis lock and cache for promo operations</li>
        </ul>
      </section>

      <section className="auth-panel">
        <div className="auth-toggle">
          <button
            className={mode === 'login' ? 'toggle-active' : ''}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === 'register' ? 'toggle-active' : ''}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
        </div>

        <div className="auth-copy">
          <h2>{title}</h2>
          <p>Use the same backend contracts as the NestJS API.</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === 'register' ? (
            <>
              <label>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  minLength={2}
                  required
                />
              </label>

              <label>
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  minLength={5}
                  required
                />
              </label>
            </>
          ) : null}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              minLength={8}
              required
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button className="primary-button" disabled={submitting} type="submit">
            {submitting
              ? 'Working...'
              : mode === 'login'
                ? 'Enter workspace'
                : 'Create account'}
          </button>
        </form>
      </section>
    </div>
  );
}
