
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useAppData } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/components/ui/use-toast';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, getMonth, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Trash2, History, Eye } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import CRAPreview from '@/components/cra/CRAPreview';

const StatusBadge = ({ status }) => {
  const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full inline-block";
  const statusClasses = {
    Brouillon: "bg-gray-100 text-gray-800",
    "À réviser": "bg-orange-100 text-orange-800",
    Soumis: "bg-yellow-100 text-yellow-800",
    Validé: "bg-blue-100 text-blue-800",
    "Signature demandée": "bg-purple-100 text-purple-800",
    Signé: "bg-green-100 text-green-800",
    "Non créé": "bg-red-100 text-red-800",
  };
  return <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const ReviseDialog = ({ cra, onConfirm }) => {
    const [reason, setReason] = useState('');
    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="secondary" size="sm">À réviser</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Renvoyer le CRA pour révision</DialogTitle><DialogDescription>Veuillez indiquer le motif de la révision pour le consultant {cra.consultantName}.</DialogDescription></DialogHeader>
                <Textarea placeholder="Ex: Il manque la journée du 15, merci de corriger." value={reason} onChange={(e) => setReason(e.target.value)} />
                <DialogFooter><DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose><DialogClose asChild><Button onClick={() => onConfirm(reason)} disabled={!reason.trim()}>Confirmer</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const ActionLogDialog = () => {
    const { actionLogs, cras } = useAppData();

    const findCraById = (id) => {
        if (!id) return null;
        return cras.find(c => String(c.id) === String(id)) || null;
    };

    const formatMonth = (value) => {
        try {
            const d = new Date(value);
            return isNaN(d) ? String(value) : format(d, 'MMMM yyyy', { locale: fr });
        } catch { return String(value || ''); }
    };

    const humanize = (log) => {
        const actionRaw = String(log.action || '').trim();
        const details = typeof log.details === 'string' ? (()=>{ try { return JSON.parse(log.details) } catch { return log.details } })() : (log.details || {});
        const actorName = log.profiles?.name || log.user_name || 'Quelqu\u2019un';
        const actorRole = (log.profiles?.role || log.user_role || '').toString();

        // Try to enrich from CRA when craId present
        const craFromContext = details?.craId ? findCraById(details.craId) : null;
        const craMonthText = craFromContext ? formatMonth(craFromContext.month) : (details?.month ? formatMonth(details.month) : '');
        const craConsultant = craFromContext?.profiles?.name
            || (cras.find(c => c.id === craFromContext?.id)?.consultantName)
            || '';

        // Normalize status-change actions (FR/EN)
        const isStatusChange = /^(Changement statut CRA:|Change of CRA status:)/i.test(actionRaw);
        if (isStatusChange) {
            const newStatus = actionRaw.split(':')[1]?.trim() || details?.updates?.status;
            const contextText = craConsultant || craMonthText ? ` pour ${craConsultant || ''}${craConsultant && craMonthText ? ' · ' : ''}${craMonthText || ''}` : (details?.craId ? ` (${details.craId})` : '');
            return `${actorName} a changé le statut du CRA${contextText} à \u00ab ${newStatus} \u00bb.`;
        }

        // Creation
        if (/^Cr\u00e9ation CRA/i.test(actionRaw) || /^CRA creation/i.test(actionRaw)) {
            const contextText = craConsultant || craMonthText ? ` pour ${craConsultant || ''}${craConsultant && craMonthText ? ' · ' : ''}${craMonthText || ''}` : '';
            return `${actorName} a créé un CRA${contextText}.`;
        }

        // Modification
        if (/^Modification CRA/i.test(actionRaw) || /^CRA update/i.test(actionRaw)) {
            const u = details?.updates || {};
            const parts = [];
            if (u.status) parts.push(`statut → ${u.status}`);
            if (u.revision_reason) parts.push(`motif de r\u00e9vision`);
            if (u.days) parts.push('jours modifi\u00e9s');
            if (u.comment !== undefined) parts.push('commentaire modifi\u00e9');
            if (u.signature_text !== undefined) parts.push('signature modifi\u00e9e');
            const what = parts.length ? ` (${parts.join(' · ')})` : '';
            const contextText = craConsultant || craMonthText ? ` pour ${craConsultant || ''}${craConsultant && craMonthText ? ' · ' : ''}${craMonthText || ''}` : '';
            return `${actorName} a modifié un CRA${contextText}${what}.`;
        }

        // Deletion
        if (/^Suppression CRA/i.test(actionRaw) || /^CRA deletion/i.test(actionRaw)) {
            const contextText = craConsultant || craMonthText ? ` pour ${craConsultant || ''}${craConsultant && craMonthText ? ' · ' : ''}${craMonthText || ''}` : '';
            return `${actorName} a supprimé un CRA${contextText}.`;
        }

        // Reminders
        if (details && (details.count || details.months)) {
            const months = Array.isArray(details.months) ? details.months.join(', ') : '';
            return `${actorName} a envoyé ${details.count || 0} relances (${months}).`;
        }

        return `${actorName} a effectu\u00e9 l\u2019action \u00ab ${actionRaw || 'activit\u00e9'} \u00bb.`;
    };

    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="outline"><History className="w-4 h-4 mr-2" />Journal d'activité</Button></DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader><DialogTitle>Journal d'activité</DialogTitle><DialogDescription>Les 400 dernières actions enregistrées.</DialogDescription></DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Utilisateur</TableHead><TableHead>Action</TableHead><TableHead>Détails</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {actionLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss')}</TableCell>
                                    <TableCell>{(log.profiles?.name || log.user_name || '—')} {(log.profiles?.role || log.user_role) ? `(${log.profiles?.role || log.user_role})` : ''}</TableCell>
                                    <TableCell>{log.action}</TableCell>
                                    <TableCell>{humanize(log)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ManagementCRAPage = () => {
  const { cras, profiles, clients, updateCRA, deleteCRA, profile } = useAppData();
  const { toast } = useToast();
  const [filters, setFilters] = useState({ searchTerm: '', consultant: 'Tous', client: 'Tous', status: 'Tous', dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } });
  const [previewCra, setPreviewCra] = useState(null);



  const handleFilterChange = (key, value) => { setFilters(prev => ({ ...prev, [key]: value })); };

  const setDatePreset = (preset) => {
    const today = new Date();
    let from, to;
    if (preset === 'this_month') { from = startOfMonth(today); to = endOfMonth(today); } 
    else if (preset === 'last_month') { const d = subMonths(today, 1); from = startOfMonth(d); to = endOfMonth(d); }
    else if (preset === 'this_quarter') { from = startOfQuarter(today); to = endOfQuarter(today); }
    else { from = null; to = null; }
    handleFilterChange('dateRange', { from, to });
  };
  
  const resetFilters = () => { setFilters({ searchTerm: '', consultant: 'Tous', client: 'Tous', status: 'Tous', dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } }); };

  const handleAction = async (cra, action, reason = '') => {
    console.debug('[ManagementCRAPage] handleAction', { id: cra.id, currentStatus: cra.status, action, reason });
    let nextStatus = ''; let dataToUpdate = {};

    if (action === 'validate') { nextStatus = 'Validé'; } 
    else if (action === 'request_signature') { nextStatus = 'Signature demandée'; } 
    else if (action === 'revise') { nextStatus = 'À réviser'; dataToUpdate.revision_reason = reason; }
    
    if(nextStatus){
      dataToUpdate.status = nextStatus;
      await updateCRA(cra.id, dataToUpdate);
    } else {
      toast({ title: "Action impossible", variant: "destructive" });
    }
  };
  
  const handleDeleteCRA = (craId) => { deleteCRA(craId); }

  const allCRAsForDisplay = useMemo(() => {
    console.debug('[ManagementCRAPage] build rows from CRAs', { crasCount: cras.length, filters });
    // If we already have CRAs from the backend (with embedded profiles), build rows directly
    if (cras && cras.length > 0) {
      const rows = cras.map((c) => {
        const monthDate = new Date(c.month);
        const consultantName = c.profiles?.name || profiles.find(p => p.id === c.user_id)?.name || 'N/A';
        const clientName = c.profiles?.clients?.name || clients.find(cl => cl.id === profiles.find(p => p.id === c.user_id)?.client_id)?.name || 'N/A';
        const totalDays = c?.days ? Object.values(c.days).reduce((acc, day) => {
          if (day.status === 'worked_1') return acc + 1;
          if (day.status === 'worked_0_5') return acc + 0.5;
          return acc;
        }, 0) : 0;
        return {
          // Include full CRA data for preview first
          ...c,
          // Then override with calculated fields
          id: c.id,
          consultantName,
          clientName,
          month: monthDate,
          status: c.status,
          totalDays,
          consultant: consultantName,
          client: clientName,
        };
      });

      const start = filters.dateRange.from || new Date('2000-01-01');
      const end = filters.dateRange.to || new Date('2100-01-01');

      const filtered = rows
        .filter(r => r.month >= start && r.month <= end)
        .filter(r => filters.consultant === 'Tous' || r.consultantName === filters.consultant)
        .filter(r => filters.client === 'Tous' || r.clientName === filters.client)
        .filter(r => filters.status === 'Tous' || r.status === filters.status)
        .filter(r => !filters.searchTerm || ((r.consultantName || '').toLowerCase().includes(filters.searchTerm.toLowerCase())))
        .sort((a, b) => (b.month - a.month) || ((a.consultantName || '').localeCompare(b.consultantName || '')));

      console.debug('[ManagementCRAPage] rows after filter', { total: filtered.length });
      return filtered;
    }

    // Fallback to original month-grid construction if no CRAs present
    const consultantsInPeriod = profiles.filter(p => p.role === 'consultant' || p.role === 'Consultant');
    let allCRAsForPeriod = [];
    const start = filters.dateRange.from || new Date('2000-01-01');
    const end = filters.dateRange.to || new Date('2100-01-01');

    consultantsInPeriod.forEach(consultant => {
      let month = new Date(start);
      while (month <= end) {
        const existingCRA = cras.find(c =>
          c.user_id === consultant.id &&
          getMonth(c.month) === getMonth(month) &&
          getYear(c.month) === getYear(month)
        );

        const craData = {
          // Include full CRA data for preview first
          ...existingCRA,
          // Then override with calculated fields
          id: existingCRA ? existingCRA.id : `${consultant.id}-${format(month, 'yyyy-MM')}`,
          consultantName: consultant.name,
          clientName: clients.find(c => c.id === consultant.client_id)?.name || 'Non assigné',
          month: month,
          status: existingCRA ? existingCRA.status : 'Non créé',
          totalDays: existingCRA?.days ? Object.values(existingCRA.days).reduce((acc, day) => {
            if (day.status === 'worked_1') return acc + 1;
            if (day.status === 'worked_0_5') return acc + 0.5;
            return acc;
          }, 0) : 0,
          consultant: consultant.name,
          client: clients.find(c => c.id === consultant.client_id)?.name || 'Non assigné',
        };
        allCRAsForPeriod.push(craData);
        month = addMonths(month, 1);
      }
    });

    const filtered = allCRAsForPeriod
      .filter(cra => {
        if (filters.consultant !== 'Tous' && cra.consultantName !== filters.consultant) return false;
        if (filters.client !== 'Tous' && cra.clientName !== filters.client) return false;
        if (filters.status !== 'Tous' && cra.status !== filters.status) return false;
        if (filters.searchTerm && !(cra.consultantName && cra.consultantName.toLowerCase().includes(filters.searchTerm.toLowerCase()))) return false;
        return true;
      })
      .sort((a, b) => b.month - a.month || ((a.consultantName || '').localeCompare(b.consultantName || '')));

    console.debug('[ManagementCRAPage] fallback rows after filter', { total: filtered.length });
    return filtered;
  }, [cras, profiles, clients, filters]);


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des CRA</h1>
        <div className="flex items-center space-x-2">
            <NavLink to="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm">Tableau de bord</NavLink>
            <NavLink to="/cra" className="text-gray-900 font-semibold bg-gray-100 px-3 py-2 rounded-md text-sm">Liste</NavLink>
        </div>
      </div>

       <Card>
          <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                  <Select value={filters.consultant} onValueChange={(v) => handleFilterChange('consultant', v)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Consultant (Tous)</SelectItem>{profiles.filter(p=>p.role ==='consultant' || p.role ==='Consultant').map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent></Select>
                  <Select value={filters.client} onValueChange={(v) => handleFilterChange('client', v)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Client (Tous)</SelectItem>{clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
                  <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Statut (Tous)</SelectItem><SelectItem value="Non créé">Non créé</SelectItem><SelectItem value="Brouillon">Brouillon</SelectItem><SelectItem value="À réviser">À réviser</SelectItem><SelectItem value="Soumis">Soumis</SelectItem><SelectItem value="Validé">Validé</SelectItem><SelectItem value="Signature demandée">Signature demandée</SelectItem><SelectItem value="Signé">Signé</SelectItem></SelectContent></Select>
                  <Input placeholder="Recherche..." className="w-full sm:w-[240px]" value={filters.searchTerm} onChange={e => handleFilterChange('searchTerm', e.target.value)} />
                  {(profile?.role === 'admin' || profile?.role === 'Admin') && <ActionLogDialog />}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Popover><PopoverTrigger asChild><Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal", !filters.dateRange.from && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{filters.dateRange.from ? (filters.dateRange.to ? (<>{format(filters.dateRange.from, "LLL dd, y", { locale: fr })} - {format(filters.dateRange.to, "LLL dd, y", { locale: fr })}</>) : (format(filters.dateRange.from, "LLL dd, y", { locale: fr }))) : (<span>Période</span>)}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={filters.dateRange?.from} selected={filters.dateRange} onSelect={(range) => handleFilterChange('dateRange', range || {from: null, to: null})} numberOfMonths={2} /></PopoverContent></Popover>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('this_month')}>Ce mois-ci</Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('last_month')}>Mois dernier</Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset('this_quarter')}>Ce trimestre</Button>
                <Button variant="ghost" onClick={resetFilters}>Réinitialiser</Button>
                <span className="text-sm font-medium text-muted-foreground ml-auto">Total: {allCRAsForDisplay.length}</span>
              </div>
          </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto md:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
          <Table>
            <TableHeader className="bg-gray-50"><TableRow><TableHead>Consultant</TableHead><TableHead>Client</TableHead><TableHead>Année</TableHead><TableHead>Mois</TableHead><TableHead>Total (J)</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {allCRAsForDisplay.length > 0 ? (
                allCRAsForDisplay.map((cra) => (
                  <TableRow key={cra.id} className="table-row-hover">
                    <TableCell className="font-medium">{cra.consultantName || 'N/A'}</TableCell><TableCell>{cra.clientName || 'N/A'}</TableCell><TableCell>{getYear(cra.month)}</TableCell><TableCell className="capitalize">{format(cra.month, 'MMMM', {locale: fr})}</TableCell><TableCell>{cra.totalDays.toFixed(1)}</TableCell><TableCell><StatusBadge status={cra.status} /></TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => setPreviewCra(cra)} disabled={cra.status === 'Non créé'}><Eye className="w-4 h-4" /></Button>
                       {(String(profile?.role).toLowerCase() === 'admin') && cra.status !== 'Non créé' && (
                         <AlertDialog>
                           <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Supprimer ce CRA ?</AlertDialogTitle>
                               <AlertDialogDescription>Cette action est irréversible. Le CRA sera définitivement supprimé.</AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Annuler</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDeleteCRA(cra.id)}>Supprimer</AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       )}
                       {(['manager','admin'].includes(String(profile?.role).toLowerCase())) && cra.status === 'Soumis' && (
                         <>
                           <Button size="sm" onClick={() => handleAction(cra, 'validate')}>Valider</Button>
                           <ReviseDialog cra={cra} onConfirm={(reason) => handleAction(cra, 'revise', reason)} />
                         </>
                       )}
                       {(['manager','admin'].includes(String(profile?.role).toLowerCase())) && cra.status === 'Validé' && (
                         <Button size="sm" onClick={() => handleAction(cra, 'request_signature')}>Demander signature</Button>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (<TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Aucun CRA trouvé.</TableCell></TableRow>)}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
      <CRAPreview isOpen={!!previewCra} onOpenChange={(isOpen) => !isOpen && setPreviewCra(null)} cra={previewCra} />
    </motion.div>
  );
};

export default ManagementCRAPage;
