import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const ResetPasswordPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialStepParam = parseInt(searchParams.get('step') || '1', 10);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(initialEmail ? Math.max(initialStepParam, 2) : initialStepParam); // 1=email, 2=code, 3=new
  const { forgotPassword, verifyResetCode, resendResetCode, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // keep URL in sync with step and email
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('step', String(step));
    if (email) params.set('email', email); else params.delete('email');
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const canSubmitPassword = useMemo(() => {
    return password && confirmPassword && password === confirmPassword;
  }, [password, confirmPassword]);

  const handleRequestCode = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Email requis', description: "Renseignez l'email." });
      return;
    }
    setRequesting(true);
    try {
      const res = await forgotPassword(email);
      console.log("forgotPassword response:", isMountedRef);
        if (res.success) {
          toast({ title: 'Code envoyé', description: 'Vérifiez votre mail.' });
          setStep(2);
          navigate(`/reset-password?email=${encodeURIComponent(email)}&step=2`, { replace: true });
        } else {
          toast({ variant: 'destructive', title: 'Erreur', description: res.error || "Échec de l'envoi." });
        }

    } finally {
      setRequesting(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code) {
      toast({ variant: 'destructive', title: 'Code requis' });
      return;
    }
    setVerifying(true);
    try {
      const res = await verifyResetCode(email, code);
        if (res.success) {
          setStep(3);
          navigate(`/reset-password?email=${encodeURIComponent(email)}&step=3`, { replace: true });
          toast({ title: 'Code vérifié', description: 'Entrez votre nouveau mot de passe.' });
        } else {
          toast({ variant: 'destructive', title: 'Code invalide', description: res.error || 'Vérifiez le code' });
        }
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitNewPassword = async (e) => {
    e.preventDefault();
    if (!canSubmitPassword) return;
    setSubmitting(true);
    try {
      const res = await resetPassword(email, code, password);
        if (res.success) {
          toast({ title: 'Mot de passe mis à jour', description: 'Vous pouvez vous connecter.' });
          navigate('/', { replace: true });
        } else {
          toast({ variant: 'destructive', title: 'Erreur', description: res.error || 'Échec de la réinitialisation.' });
        }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setRequesting(true);
    try {
      const res = await resendResetCode(email);
      if (isMountedRef.current) {
        if (res.success) {
          toast({ title: 'Code renvoyé', description: 'Vérifiez votre mail.' });
        } else {
          toast({ variant: 'destructive', title: 'Erreur', description: res.error || "Échec de l'envoi." });
        }
      }
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-6">Réinitialiser le mot de passe</h1>

        {step === 1 && (
          <div>
            <div className="space-y-2 mb-4">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
            </div>
            <Button onClick={handleRequestCode} disabled={requesting || !email} className="w-full">
              {requesting ? 'Envoi...' : 'Envoyer le code'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={verifying}>{verifying ? 'Vérification...' : 'Vérifier le code'}</Button>
              <Button type="button" variant="secondary" onClick={handleResend} disabled={requesting}>
                {requesting ? 'Renvoi...' : 'Renvoyer'}
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmitNewPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={!canSubmitPassword || submitting} className="w-full">
              {submitting ? 'En cours...' : 'Réinitialiser'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
