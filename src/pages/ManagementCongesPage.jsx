import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LeaveStatusBadge = ({ status }) => {
  const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full inline-block";
  const statusClasses = {
    Demandé: "bg-yellow-100 text-yellow-800",
    Approuvé: "bg-green-100 text-green-800",
    Refusé: "bg-red-100 text-red-800",
  };
  return <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const LeavesTable = ({ leaves, showActions = false, onApprove, onRefuseTrigger }) => (
  <TooltipProvider>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Consultant</TableHead>
          <TableHead>Période</TableHead>
          <TableHead>Motif</TableHead>
          <TableHead>Statut</TableHead>
          {showActions ? <TableHead className="text-right">Actions</TableHead> : <TableHead>Détails</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaves.length > 0 ? (
          leaves.map((leave) => (
            <TableRow key={leave.id}>
              <TableCell>{leave.consultantName}</TableCell>
              <TableCell className="text-sm">
                {leave.start_date} - {leave.end_date}
              </TableCell>
              <TableCell>{leave.type || leave.reason}</TableCell>
              <TableCell><LeaveStatusBadge status={leave.status === 'Approved' ? 'Approuvé' : leave.status === 'Rejected' ? 'Refusé' : 'Demandé'} /></TableCell>
              <TableCell className="text-right">
                {showActions ? (
                  <div className="flex justify-end space-x-2">
                    <Button size="icon" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => onApprove(leave.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => onRefuseTrigger(leave)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                  </div>
                ) : (
                  leave.status === 'Rejected' && leave.manager_comment && (
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-5 w-5 text-red-500 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{leave.manager_comment}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
              Aucune demande dans cette catégorie.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TooltipProvider>
);

const ManagementCongesPage = () => {
  const { profiles, listAllAbsences, decideAbsence } = useAppData();
  const [refusalReason, setRefusalReason] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isRefusalDialogOpen, setRefusalDialogOpen] = useState(false);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch leaves on component mount
  React.useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      const result = await listAllAbsences();
      if (result.success) {
        const leavesWithNames = result.data
          .filter(leave => leave.type === 'Vacances' || leave.type === 'Congés')
          .map(leave => {
            const profile = profiles.find(p => p.id === leave.user_id);
            return { ...leave, consultantName: profile?.name || 'Inconnu' };
          });
        setAllLeaves(leavesWithNames);
      }
      setLoading(false);
    };
    fetchLeaves();
  }, [profiles, listAllAbsences]);

  const pendingLeaves = allLeaves.filter(l => l.status === 'Pending');
  const processedLeaves = allLeaves.filter(l => l.status !== 'Pending');

  const handleApprove = async (leaveId) => {
    const result = await decideAbsence(leaveId, 'approve');
    if (result.success) {
      // Refresh the leaves list
      const refreshResult = await listAllAbsences();
      if (refreshResult.success) {
        const leavesWithNames = refreshResult.data
          .filter(leave => leave.type === 'Vacances' || leave.type === 'Congés')
          .map(leave => {
            const profile = profiles.find(p => p.id === leave.user_id);
            return { ...leave, consultantName: profile?.name || 'Inconnu' };
          });
        setAllLeaves(leavesWithNames);
      }
    }
  };

  const handleRefuseTrigger = (leave) => {
    setSelectedLeave(leave);
    setRefusalDialogOpen(true);
  };

  const handleRefuseConfirm = async () => {
    if (selectedLeave && refusalReason) {
      const result = await decideAbsence(selectedLeave.id, 'reject', refusalReason);
      if (result.success) {
        // Refresh the leaves list
        const refreshResult = await listAllAbsences();
        if (refreshResult.success) {
          const leavesWithNames = refreshResult.data
            .filter(leave => leave.type === 'Vacances' || leave.type === 'Congés')
            .map(leave => {
              const profile = profiles.find(p => p.id === leave.user_id);
              return { ...leave, consultantName: profile?.name || 'Inconnu' };
            });
          setAllLeaves(leavesWithNames);
        }
      }
      setRefusalReason('');
      setSelectedLeave(null);
      setRefusalDialogOpen(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-6">Gestion des Congés</h1>

      <Card>
        <CardHeader>
          <CardTitle>Suivi des demandes</CardTitle>
          <CardDescription>Gérez les demandes de congés en attente et consultez l'historique.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">En attente ({pendingLeaves.length})</TabsTrigger>
              <TabsTrigger value="history">Historique ({processedLeaves.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <LeavesTable leaves={pendingLeaves} showActions={true} onApprove={handleApprove} onRefuseTrigger={handleRefuseTrigger} />
            </TabsContent>
            <TabsContent value="history">
              <LeavesTable leaves={processedLeaves} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={isRefusalDialogOpen} onOpenChange={setRefusalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser la demande de congé ?</AlertDialogTitle>
            <AlertDialogDescription>
              Veuillez fournir un motif pour le refus. Ce motif sera visible par le consultant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="refusal-reason" className="text-right col-span-1">
                      Motif
                  </Label>
                  <Textarea
                      id="refusal-reason"
                      value={refusalReason}
                      onChange={(e) => setRefusalReason(e.target.value)}
                      className="col-span-3"
                      placeholder="Ex: Période de forte activité projet..."
                  />
              </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRefusalReason('')}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefuseConfirm} disabled={!refusalReason}>Confirmer le refus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ManagementCongesPage;

