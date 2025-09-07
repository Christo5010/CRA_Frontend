import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { User, Lock } from 'lucide-react';

const AccountSettingsPage = () => {
  const { user, updateProfile, changePassword, requestEmailChange, verifyEmailChange } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailStep, setEmailStep] = useState('edit'); // 'edit' | 'verify'
  const [pendingEmail, setPendingEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      // If email changed, trigger verification flow
      if (profileForm.email && profileForm.email !== user?.email) {
        const resp = await requestEmailChange(profileForm.email);
        if (resp.success) {
          setPendingEmail(profileForm.email);
          setEmailStep('verify');
          toast({ title: 'Code envoyé', description: 'Saisissez le code reçu par email.' });
        } else {
          toast({ variant: 'destructive', title: 'Erreur', description: resp.error || "Impossible d'envoyer le code" });
        }
        setLoading(false);
        return;
      }

      const result = await updateProfile({ name: profileForm.name });
      if (result.success) {
        toast({ title: "Profil mis à jour avec succès." });
        setIsEditing(false);
      } else {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: result.error || "Impossible de mettre à jour le profil." 
        });
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Une erreur est survenue lors de la mise à jour du profil." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailCode) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Entrez le code de vérification.' });
      return;
    }
    setLoading(true);
    const result = await verifyEmailChange(emailCode);
    setLoading(false);
    if (result.success) {
      toast({ title: 'Email mis à jour' });
      setIsEditing(false);
      setEmailStep('edit');
      setEmailCode('');
      setPendingEmail('');
    } else {
      toast({ variant: 'destructive', title: 'Erreur', description: result.error || 'Code invalide' });
    }
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Les mots de passe ne correspondent pas." 
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Le nouveau mot de passe doit contenir au moins 6 caractères." 
      });
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        toast({ title: "Mot de passe modifié avec succès." });
        setIsChangingPassword(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: result.error || "Impossible de modifier le mot de passe." 
        });
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Une erreur est survenue lors de la modification du mot de passe." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || ''
    });
  };

  const handlePasswordCancel = () => {
    setIsChangingPassword(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }} 
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold">Paramètres du compte</h1>
        <p className="text-gray-600 mt-2">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Informations du profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailStep === 'edit' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Votre nom complet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  disabled={!isEditing}
                  placeholder="votre@email.com"
                />
              </div>
            </div>
          )}

          {emailStep === 'verify' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email-code">Code de vérification pour {pendingEmail}</Label>
                <Input
                  id="email-code"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Entrez le code reçu par email"
                />
                <div className="text-sm text-gray-500">Un code vous a été envoyé. Entrez-le pour confirmer le changement d'email.</div>
              </div>
            </div>
          )}
          

          <div className="flex justify-end space-x-2 pt-4">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Modifier le profil
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
                {emailStep === 'verify' ? (
                  <Button onClick={handleVerifyEmail} disabled={loading}>
                    {loading ? 'Vérification...' : 'Vérifier et sauvegarder'}
                  </Button>
                ) : (
                  <Button onClick={handleProfileSave} disabled={loading}>
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="border-t border-gray-200 my-6"></div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Sécurité du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isChangingPassword ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Mot de passe</p>
                <p className="text-sm text-gray-600">Modifiez votre mot de passe pour sécuriser votre compte</p>
              </div>
              <Button onClick={() => setIsChangingPassword(true)}>
                Changer le mot de passe
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Votre mot de passe actuel"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Votre nouveau mot de passe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirmez votre nouveau mot de passe"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handlePasswordCancel}>
                  Annuler
                </Button>
                <Button onClick={handlePasswordSave} disabled={loading}>
                  {loading ? 'Modification...' : 'Modifier le mot de passe'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="border-t border-gray-200 my-6"></div>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Statut du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Rôle</p>
              <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Statut</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Actif
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Compte créé le: {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
            <p>Dernière connexion: {user?.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'N/A'}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AccountSettingsPage;
