import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import Spinner from '../components/Spinner';

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        login(token, data.user);
        addToast(`Welcome, ${data.user.name}!`, 'success');
        navigate('/', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=oauth_failed', { replace: true });
      });
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
      <Spinner className="h-10 w-10" />
      <p className="text-gray-500 text-sm">Completing sign-in…</p>
    </div>
  );
}
