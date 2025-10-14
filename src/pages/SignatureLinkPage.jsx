import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

const SignatureLinkPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const craIdParam = params.get('craId');
    if (!token || !craIdParam) {
      navigate('/', { replace: true });
      return;
    }

    const validateAndRedirect = async () => {
      try {
        const resp = await apiClient.get(`/link/cra-signature/validate?token=${encodeURIComponent(token)}`);
        if (!resp?.data?.success) throw new Error('Invalid token');
        const { user_id, cra_id } = resp.data.data || {};

        // Ensure craId from URL matches token payload to avoid tampering
        if (String(cra_id) !== String(craIdParam)) throw new Error('Invalid token');

        // Store intent for CRAPage to act upon
        localStorage.setItem('openSignForCraId', String(cra_id));

        if (isAuthenticated && user) {
          // If logged in, go straight to CRA page
          navigate('/mon-cra', { replace: true });
        } else {
          // Not logged in → set post-login redirect back to this link
          const redirectUrl = `/cra/sign?craId=${encodeURIComponent(cra_id)}&token=${encodeURIComponent(token)}`;
          localStorage.setItem('postLoginRedirect', redirectUrl);
          navigate('/', { replace: true });
        }
      } catch (_) {
        navigate('/', { replace: true });
      }
    };

    if (!loading) {
      validateAndRedirect();
    }
  }, [location.search, isAuthenticated, user, loading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-800"></div>
    </div>
  );
};

export default SignatureLinkPage;


