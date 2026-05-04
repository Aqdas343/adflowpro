import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../api/axios';
import { useToast } from '../context/ToastContext';

const ROLES = [
  { value: 'client', label: 'Client', sub: 'I want to hire' },
  { value: 'provider', label: 'Provider', sub: 'I want to offer services' },
];

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function RegisterPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await registerApi(form);
      login(data.token, data.user);
      addToast(`Welcome to GigMarket, ${data.user.name}!`, 'success');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 bg-gray-50 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-1.5 mb-8">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
          <span className="text-xl font-bold text-gray-900">GigMarket</span>
        </div>

        <div className="bg-white rounded-2xl shadow-auth border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">Join thousands of freelancers and clients</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => { window.location.href = `${BACKEND_URL}/api/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors mb-5"
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <input id="name" name="name" type="text" autoComplete="name" required
                className="input" placeholder="Jane Doe" value={form.name} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input id="email" name="email" type="email" autoComplete="email" required
                className="input" placeholder="you@example.com" value={form.email} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required
                className="input" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={handleChange} />
            </div>

            <div>
              <label className="label">I am joining as</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.role === r.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                      onChange={handleChange} className="sr-only" />
                    <span className={`text-sm font-semibold ${form.role === r.value ? 'text-brand-700' : 'text-gray-800'}`}>
                      {r.label}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">{r.sub}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base mt-1">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
