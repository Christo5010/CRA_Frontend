
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppData } from '@/contexts/AppContext';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const RoleBadge = ({ role }) => {
  const roleClasses = {
    admin: "bg-red-100 text-red-800",
    manager: "bg-blue-100 text-blue-800",
    consultant: "bg-green-100 text-green-800",
  };
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : role;
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleClasses[role?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>{displayRole}</span>;
};

const AccountsPage = () => {
  const { profiles, clients, fetchData } = useAppData();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentClient, setCurrentClient] = useState(null);
  const [newClientName, setNewClientName] = useState("");

  const openUserModal = (user = null) => {
    const userData = user ? 
      {...user, client_id: user.clients?.id || user.client_id || null} : 
      { name: '', email: '', role: 'consultant', active: true, client_id: null };
    setCurrentUser(userData);
    setIsUserModalOpen(true);
  };
  
  const openClientModal = (client = null) => {
    if (client) {
        setCurrentClient({ ...client });
    } else {
        setCurrentClient({ name: newClientName, address: '' });
    }
    setIsClientModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (currentUser) {
        try {
            if (currentUser.id) {
                // Update existing user
                await apiClient.patch(`/user/${currentUser.id}`, currentUser);
                toast({ title: "Compte mis à jour avec succès." });
            } else {
                // Create new user (no password set by admin)
                const payload = {
                  name: currentUser.name,
                  email: currentUser.email,
                  role: currentUser.role,
                  client_id: currentUser.client_id || null
                };
                await apiClient.post('/user/create', payload);
                toast({ title: "Compte créé. Une invitation a été envoyée par email." });
            }
            fetchData(true);
        } catch (error) {
            toast({ 
                variant: "destructive", 
                title: "Erreur", 
                description: error.response?.data?.message || "Erreur lors de la sauvegarde du compte." 
            });
        }
    }
    setIsUserModalOpen(false);
  };

  const handleSaveClient = async () => {
    if (currentClient) {
        try {
            if (currentClient.id) {
                // Update existing client
                await apiClient.patch(`/client/${currentClient.id}`, currentClient);
                toast({ title: "Client mis à jour avec succès." });
            } else {
                // Create new client
                await apiClient.post('/client', currentClient);
                toast({ title: "Client créé avec succès." });
            }
            fetchData(true);
            setNewClientName("");
        } catch (error) {
            toast({ 
                variant: "destructive", 
                title: "Erreur", 
                description: error.response?.data?.message || "Erreur lors de la sauvegarde du client." 
            });
        }
    }
    setIsClientModalOpen(false);
  }
  
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
        try {
            await apiClient.delete(`/user/${userId}`);
            toast({ title: "Utilisateur supprimé avec succès." });
            fetchData(true);
        } catch (error) {
            toast({ 
                variant: "destructive", 
                title: "Erreur", 
                description: error.response?.data?.message || "Erreur lors de la suppression de l'utilisateur." 
            });
        }
    }
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestion des comptes</h1>
          <Button onClick={() => openUserModal()}><PlusCircle className="w-4 h-4 mr-2" />Créer un compte</Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((user) => {
                  const clientName = clients.find(c => c.id === user.client_id)?.name || 'N/A';

                  return (
                    <TableRow key={user.id} className="table-row-hover">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{clientName}</TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.active ? 'Actif' : 'Inactif'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openUserModal(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Gestion des clients</h2>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Input placeholder="Nom du nouveau client..." value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                    <Button onClick={() => openClientModal()} disabled={!newClientName.trim()}><PlusCircle className="w-4 h-4 mr-2" />Ajouter</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom du client</TableHead>
                            <TableHead>Adresse</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map(client => (
                            <TableRow key={client.id}>
                                <TableCell>{client.name}</TableCell>
                                <TableCell>{client.address || 'Non définie'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => openClientModal(client)}><Edit className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentUser?.id ? "Modifier le compte" : "Créer un compte"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" value={currentUser?.name || ''} onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})} />
            
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={currentUser?.email || ''} onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})} />
            
            {/* Password is not set by admin. Users will receive an invite to set their password. */}
            
            <Label>Rôle</Label>
            <Select value={currentUser?.role} onValueChange={(value) => setCurrentUser({...currentUser, role: value})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="consultant">Consultant</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
            </Select>
            
            {currentUser?.role === 'consultant' && (
              <><Label>Client</Label>
              <Select value={currentUser?.client_id || ''} onValueChange={(value) => setCurrentUser({...currentUser, client_id: value})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                  <SelectContent>{clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent>
              </Select></>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch id="active" checked={currentUser?.active} onCheckedChange={(checked) => setCurrentUser({...currentUser, active: checked})} />
              <Label htmlFor="active">Actif</Label>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsUserModalOpen(false)}>Annuler</Button><Button onClick={handleSaveUser}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{currentClient?.id ? `Modifier ${currentClient.name}`: `Ajouter ${currentClient?.name}`}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Label htmlFor="clientName">Nom du client</Label><Input id="clientName" value={currentClient?.name || ''} onChange={(e) => setCurrentClient({...currentClient, name: e.target.value})} />
                <Label htmlFor="clientAddress">Adresse</Label><Input id="clientAddress" value={currentClient?.address || ''} onChange={(e) => setCurrentClient({...currentClient, address: e.target.value})} />
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsClientModalOpen(false)}>Annuler</Button><Button onClick={handleSaveClient}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AccountsPage;
