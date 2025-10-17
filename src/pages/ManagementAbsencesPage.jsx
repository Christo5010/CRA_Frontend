import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, addDays, startOfToday, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, AlertCircle, Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from '@/components/ui/calendar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';

const AbsenceStatusBadge = ({ status }) => {
  const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full inline-block";
  const statusClasses = {
    Demandé: "bg-yellow-100 text-yellow-800",
    Approuvé: "bg-green-100 text-green-800",
    Refusé: "bg-red-100 text-red-800",
  };
  return <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const AbsencesTable = ({ absences, showActions = false, onApprove, onRefuseTrigger, onDeleteTrigger, canDelete = false }) => (
  <TooltipProvider>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Consultant</TableHead>
          <TableHead>Période</TableHead>
          <TableHead>Motif</TableHead>
          <TableHead>Statut</TableHead>
          {showActions ? <TableHead className="text-right">Actions</TableHead> : <TableHead className="text-right">Détails</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {absences.length > 0 ? (
          absences.map((absence) => (
            <TableRow key={absence.id}>
              <TableCell>{absence.consultantName}</TableCell>
              <TableCell className="text-sm">
                {absence.start_date} - {absence.end_date}
              </TableCell>
              <TableCell>{absence.type || absence.reason}</TableCell>
              <TableCell><AbsenceStatusBadge status={absence.status === 'Approved' ? 'Approuvé' : absence.status === 'Rejected' ? 'Refusé' : 'Demandé'} /></TableCell>
              <TableCell className="text-right">
                {showActions ? (
                  <div className="flex justify-end space-x-2">
                    <Button size="icon" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => onApprove(absence.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => onRefuseTrigger(absence)}>
                      <X className="h-4 w-4" />
                    </Button>
                    {canDelete ? (
                      <Button size="icon" variant="outline" className="text-destructive hover:bg-red-50" onClick={() => onDeleteTrigger(absence)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  absence.status === 'Rejected' && absence.manager_comment && (
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-5 w-5 text-red-500 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{absence.manager_comment}</p>
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

const CreateAbsenceDialog = ({ consultants, onCreate, approvedAbsences }) => {
  const [consultantId, setConsultantId] = useState('');
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [reason, setReason] = useState('');
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const consultantApprovedRanges = useMemo(() => {
    if (!consultantId) return [];
    return (approvedAbsences || [])
      .filter(a => a.user_id === consultantId)
      .map(a => ({ from: parseISO(a.start_date), to: parseISO(a.end_date) }));
  }, [consultantId, approvedAbsences]);

  const isOverlap = (from, to) => {
    if (!from || !to) return false;
    const start = new Date(from);
    const end = new Date(to);
    return consultantApprovedRanges.some(r => !(end < r.from || start > r.to));
  };

  const handleSubmit = async () => {
    if (!consultantId || !dateRange.from || !dateRange.to || !reason) return;
    if (isOverlap(dateRange.from, dateRange.to)) {
      toast({ variant: 'destructive', title: 'Période indisponible', description: "Ces dates chevauchent déjà une absence approuvée pour ce consultant." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await onCreate({
        user_id: consultantId,
        start_date: dateRange.from,
        end_date: dateRange.to,
        reason: reason,
      });
      if (!result || result.success) {
        setDialogOpen(false);
        // Reset form
        setConsultantId('');
        setDateRange({ from: undefined, to: undefined });
        setReason('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Créer une absence
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[520px] md:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Créer une absence pour un consultant</DialogTitle>
          <DialogDescription>
            L'absence sera automatiquement approuvée et ajoutée au calendrier du consultant.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="consultant" className="text-right">Consultant</Label>
            <Select onValueChange={setConsultantId} value={consultantId}>
              <SelectTrigger id="consultant" className="col-span-3">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {consultants.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Période</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/y", { locale: fr })} - {format(dateRange.to, "dd/MM/y", { locale: fr })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/y", { locale: fr })
                    )
                  ) : (
                    <span>Choisir une période</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={fr}
                  disabled={consultantApprovedRanges}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">Motif</Label>
            <Select onValueChange={setReason} value={reason}>
              <SelectTrigger id="reason" className="col-span-3">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vacances">Vacances</SelectItem>
                <SelectItem value="Maladie">Maladie</SelectItem>
                <SelectItem value="Personnel">Personnel</SelectItem>
                <SelectItem value="Formation">Formation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting || !consultantId || !dateRange.from || !dateRange.to || !reason}>
            {isSubmitting ? 'Création…' : 'Créer et Approuver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ManagementAbsencesPage = () => {
  const { profiles, listAllAbsences, decideAbsence, createAdminApprovedAbsence, deleteAbsence, profile } = useAppData();
  const [refusalReason, setRefusalReason] = useState('');
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isRefusalDialogOpen, setRefusalDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allAbsences, setAllAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch absences on component mount
  React.useEffect(() => {
    const fetchAbsences = async () => {
      setLoading(true);
      const result = await listAllAbsences();
      if (result.success) {
        const absencesWithNames = result.data.map(absence => {
          const profile = profiles.find(p => p.id === absence.user_id);
          return { ...absence, consultantName: profile?.name || 'Inconnu' };
        });
        setAllAbsences(absencesWithNames);
      }
      setLoading(false);
    };
    fetchAbsences();
  }, [profiles, listAllAbsences]);

  const consultants = useMemo(() => profiles.filter(p => p.role === 'consultant'), [profiles]);
  const pendingAbsences = allAbsences.filter(l => l.status === 'Pending');
  const processedAbsences = allAbsences.filter(l => l.status !== 'Pending');
  const approvedAbsences = allAbsences.filter(l => l.status === 'Approved');

  const upcomingAbsences = useMemo(() => {
    const today = startOfToday();
    const next30Days = addDays(today, 30);
    return approvedAbsences
      .filter(absence => {
        const startDate = new Date(absence.start_date);
        return startDate >= today && startDate <= next30Days;
      })
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }, [approvedAbsences]);

  const approvedAbsenceRanges = useMemo(() => {
    return approvedAbsences.map(a => ({
      from: new Date(a.start_date),
      to: new Date(a.end_date),
      consultantName: a.consultantName,
      reason: a.type || a.reason,
    }));
  }, [approvedAbsences]);

  const modifiers = {
    approved: approvedAbsenceRanges,
  };

  const modifiersStyles = {
    approved: {
      backgroundColor: 'hsl(var(--primary) / 0.2)',
      color: 'hsl(var(--primary))',
      fontWeight: 'bold',
    },
  };

  const DayWithTooltip = ({ date, displayMonth }) => {
    const absentsToday = approvedAbsenceRanges.filter(range =>
      isWithinInterval(date, { start: range.from, end: range.to })
    );

    if (absentsToday.length > 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative w-full h-full flex items-center justify-center">
                {format(date, 'd')}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-bold">Absents le {format(date, 'dd/MM/yyyy')}:</p>
              <ul className="list-none pl-0 mt-1">
                {absentsToday.map((absence, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-semibold">{absence.consultantName}:</span> {absence.reason}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return format(date, 'd');
  };

  const handleApprove = async (absenceId) => {
    const result = await decideAbsence(absenceId, 'approve');
    if (result.success) {
      // Refresh the absences list
      const refreshResult = await listAllAbsences();
      if (refreshResult.success) {
        const absencesWithNames = refreshResult.data.map(absence => {
          const profile = profiles.find(p => p.id === absence.user_id);
          return { ...absence, consultantName: profile?.name || 'Inconnu' };
        });
        setAllAbsences(absencesWithNames);
      }
    }
  };

  const handleRefuseTrigger = (absence) => {
    setSelectedAbsence(absence);
    setRefusalDialogOpen(true);
  };

  const handleDeleteTrigger = (absence) => {
    setDeleteCandidate(absence);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    const result = await deleteAbsence(deleteCandidate.id);
    if (result.success) {
      const refreshResult = await listAllAbsences();
      if (refreshResult.success) {
        const absencesWithNames = refreshResult.data.map(absence => {
          const profile = profiles.find(p => p.id === absence.user_id);
          return { ...absence, consultantName: profile?.name || 'Inconnu' };
        });
        setAllAbsences(absencesWithNames);
      }
    }
    setDeleteCandidate(null);
    setDeleteDialogOpen(false);
  };

  const handleRefuseConfirm = async () => {
    if (selectedAbsence && refusalReason) {
      const result = await decideAbsence(selectedAbsence.id, 'reject', refusalReason);
      if (result.success) {
        // Refresh the absences list
        const refreshResult = await listAllAbsences();
        if (refreshResult.success) {
          const absencesWithNames = refreshResult.data.map(absence => {
            const profile = profiles.find(p => p.id === absence.user_id);
            return { ...absence, consultantName: profile?.name || 'Inconnu' };
          });
          setAllAbsences(absencesWithNames);
        }
      }
      setRefusalReason('');
      setSelectedAbsence(null);
      setRefusalDialogOpen(false);
    }
  };

  const handleDialogClose = () => {
    setRefusalDialogOpen(false);
    setRefusalReason('');
    setSelectedAbsence(null);
  }

  const handleCreateAbsence = async ({ user_id, start_date, end_date, reason }) => {
    const payload = {
      user_id,
      start_date: typeof start_date === 'string' ? start_date : format(start_date, 'yyyy-MM-dd'),
      end_date: typeof end_date === 'string' ? end_date : format(end_date, 'yyyy-MM-dd'),
      type: reason,
      reason,
    };
    const resp = await createAdminApprovedAbsence(payload);
    if (resp.success) {
      const refresh = await listAllAbsences();
      if (refresh.success) {
        const absencesWithNames = refresh.data.map(absence => {
          const p = profiles.find(pp => pp.id === absence.user_id);
          return { ...absence, consultantName: p?.name || 'Inconnu' };
        });
        setAllAbsences(absencesWithNames);
      }
    }
  };

  const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'manager';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Absences</h1>
            {isAdminOrManager && (
              <CreateAbsenceDialog consultants={consultants} onCreate={handleCreateAbsence} approvedAbsences={approvedAbsences} />
            )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble des absences</CardTitle>
          <CardDescription>Calendrier des absences approuvées et liste des absences à venir.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <Calendar
              mode="single"
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              components={{ DayContent: DayWithTooltip }}
              className="rounded-md border"
              locale={fr}
            />
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center"><CalendarIcon className="w-4 h-4 mr-2" />Absences à venir (30 jours)</h3>
            <div className="max-h-64 overflow-y-auto pr-2">
              {upcomingAbsences.length > 0 ? (
                <ul className="space-y-2">
                  {upcomingAbsences.map(absence => (
                    <li key={absence.id} className="text-sm p-2 bg-muted rounded-md">
                      <p className="font-semibold">{absence.consultantName}</p>
                      <p className="text-muted-foreground">
                        {format(parseISO(absence.start_date), 'dd/MM/yy')} - {format(parseISO(absence.end_date), 'dd/MM/yy')}
                      </p>
                      <p className="text-xs">{absence.reason}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune absence à venir.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Suivi des demandes</CardTitle>
              <CardDescription>Gérez les demandes d'absence en attente et consultez l'historique.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">En attente ({pendingAbsences.length})</TabsTrigger>
              <TabsTrigger value="history">Historique ({processedAbsences.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <AbsencesTable absences={pendingAbsences} showActions={true} onApprove={handleApprove} onRefuseTrigger={handleRefuseTrigger} onDeleteTrigger={() => {}} canDelete={false} />
            </TabsContent>
            <TabsContent value="history">
              <AbsencesTable absences={processedAbsences} showActions={true} onApprove={() => {}} onRefuseTrigger={() => {}} onDeleteTrigger={handleDeleteTrigger} canDelete={profile?.role === 'admin'} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={isRefusalDialogOpen} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser la demande d'absence ?</AlertDialogTitle>
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
            <AlertDialogCancel onClick={handleDialogClose}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefuseConfirm} disabled={!refusalReason}>Confirmer le refus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) { setDeleteDialogOpen(false); setDeleteCandidate(null); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette absence ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. L'absence sera supprimée, même si elle était approuvée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setDeleteCandidate(null); }}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-white hover:bg-red-600">Supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </motion.div>
  );
};

export default ManagementAbsencesPage;