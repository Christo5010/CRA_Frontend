import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const NewPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { resetPasswordWithToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log('NewPasswordPage - URL params:', { email: initialEmail, token });
    console.log('Token details:', { 
      token, 
      tokenLength: token?.length, 
      tokenType: typeof token,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
    });
  }, [initialEmail, token]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = (setter, value) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  const canSubmit = useMemo(() => {
    return email && token && password && confirmPassword && password === confirmPassword;
  }, [email, token, password, confirmPassword]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    safeSetState(setSubmitting, true);
    try {
      const res = await resetPasswordWithToken(email, password, token);
        if (res.success) {
          toast({ title: 'Bienvenue', description: 'Connexion réussie.' });
          navigate('/');
        } else {
          toast({ variant: 'destructive', title: 'Erreur', description: res.error || 'Échec.' });
        }
    } finally {
      safeSetState(setSubmitting, false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-6">Créer votre mot de passe</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmer le mot de passe</Label>
            <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={!canSubmit} isLoading={submitting} loadingText="Création..." className="w-full">
            Créer le mot de passe
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NewPasswordPage;
