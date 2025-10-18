import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Send, PlusCircle, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const CongesPage = () => {
  const { user } = useAuth();
  const { myAbsences, requestAbsence, refreshMyAbsences, fetchData } = useAppData();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState();
  const [reason, setReason] = useState('');
  const [showCustomReason, setShowCustomReason] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const userLeaves = useMemo(() => {
    if (!myAbsences) return [];
    return myAbsences
      .filter(l => l.type === 'Vacances' || l.type === 'Congés')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [myAbsences]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateRange?.from || !dateRange?.to || !reason) {
      toast({
        variant: "destructive",
        title: "Champs manquants",
        description: "Veuillez sélectionner une période et un motif.",
      });
      return;
    }

    setSubmitting(true);
    const result = await requestAbsence({
      start_date: dateRange.from.toISOString().split('T')[0],
      end_date: dateRange.to.toISOString().split('T')[0],
      type: reason,
      reason: reason,
    });

    if (result.success) {
      setDateRange(undefined);
      setReason('');
      setShowCustomReason(false);
      await refreshMyAbsences();
    }
    setSubmitting(false);
  };

  const handleReasonClick = (predefinedReason) => {
    setReason(predefinedReason);
    setShowCustomReason(false);
  };

  const handleCustomReasonClick = () => {
    setReason('');
    setShowCustomReason(true);
  };

  let footer = <p>Veuillez sélectionner le premier jour.</p>;
  if (dateRange?.from) {
    if (!dateRange.to) {
      footer = <p>{format(dateRange.from, 'PPP', { locale: fr })}</p>;
    } else if (dateRange.to) {
      footer = (
        <p>
          {format(dateRange.from, 'PPP', { locale: fr })}–{format(dateRange.to, 'PPP', { locale: fr })}
        </p>
      );
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <h1 className="text-3xl font-bold">Mes Congés</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Nouvelle demande d'absence</CardTitle>
            <CardDescription>Sélectionnez une période et un motif pour votre demande.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center">
                <DayPicker
                  id="leave-datepicker"
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  footer={footer}
                  locale={fr}
                  showOutsideDays
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Motif</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button type="button" variant={reason === 'Vacances' ? 'default' : 'outline'} onClick={() => handleReasonClick('Vacances')}>Vacances</Button>
                  <Button type="button" variant={reason === 'Maladie' ? 'default' : 'outline'} onClick={() => handleReasonClick('Maladie')}>Maladie</Button>
                  <Button type="button" variant={reason === 'Personnel' ? 'default' : 'outline'} onClick={() => handleReasonClick('Personnel')}>Personnel</Button>
                  <Button type="button" variant={showCustomReason ? 'default' : 'outline'} onClick={handleCustomReasonClick}><PlusCircle className="w-4 h-4 mr-2" />Autre</Button>
                </div>
                {showCustomReason && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <Input
                      type="text"
                      placeholder="Spécifiez le motif..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    />
                  </motion.div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={!dateRange || !reason || submitting}>
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Envoi...' : 'Envoyer la demande'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userLeaves.length > 0 ? (
                      userLeaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="text-xs">
                            {leave.start_date} - {leave.end_date}
                          </TableCell>
                          <TableCell>{leave.type || leave.reason}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <LeaveStatusBadge status={leave.status === 'Approved' ? 'Approuvé' : leave.status === 'Rejected' ? 'Refusé' : 'Demandé'} />
                              {leave.status === 'Rejected' && leave.manager_comment && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="h-4 w-4 text-red-500 cursor-pointer" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{leave.manager_comment}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                          Aucune demande de congé.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default CongesPage;