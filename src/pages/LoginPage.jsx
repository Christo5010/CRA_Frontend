
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import logo from '../assets/logo.png'
import apiClient from '@/lib/apiClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/mon-cra', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Veuillez renseigner votre email et votre mot de passe.",
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await signIn(email, '', password);
      
      if (result.success) {
        toast({
          title: "Connexion réussie !",
          description: `Bienvenue ! Redirection en cours...`,
        });
        // The useEffect will handle the navigation after auth state update
      } else {
        toast({
          variant: "destructive",
          title: "La connexion a échoué",
          description: result.error || "Email ou mot de passe incorrect.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur s'est produite lors de la connexion.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!authLoading && isAuthenticated)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm animate-fadeInUp">
        <div className="bg-white p-8 rounded-xl shadow-lg">
            {/* <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-800 text-white rounded-lg mb-4">
              <span className="text-2xl font-bold">7</span> 
              </div> */}
            {/* <h1 className="text-2xl font-bold text-gray-800">Seven Opportunity</h1> */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-48 h-24 overflow-hidden">
              <img src={logo} alt="logo" className="max-w-full max-h-full object-contain" />
            </div>
            <p className="text-gray-500">Connectez-vous à votre espace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                isLoading={isSubmitting}
                loadingText="Connexion..."
                className="w-full bg-gray-800 hover:bg-gray-900 text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Se connecter
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <Link to={`/reset-password?email=${encodeURIComponent(email || '')}`} className="hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold mb-1">Besoin d'aide ? Contactez votre administrateur.</p>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
