
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Lock, Trash2, Send, Edit, Eye, PenSquare, AlertTriangle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isWeekend, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getHolidays } from '@/lib/holidays';
import CRAPreview from '@/components/cra/CRAPreview';

const StatusBadge = ({ status }) => {
  const baseClasses = "px-3 py-1 text-sm font-semibold rounded-full inline-block";
  const statusClasses = {
    Brouillon: "bg-gray-200 text-gray-800",
    "À réviser": "bg-orange-200 text-orange-800",
    Soumis: "bg-yellow-200 text-yellow-800",
    Validé: "bg-blue-200 text-blue-800",
    "Signature demandée": "bg-purple-200 text-purple-800",
    Signé: "bg-green-200 text-green-800",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const DayStatusIndicator = ({ status }) => {
  if (!status) return null;
  const styles = {
    worked_1: 'text-green-600',
    worked_0_5: 'text-blue-600',
    off: 'text-red-600',
  };
  const text = {
    worked_1: '1',
    worked_0_5: '0.5',
    off: 'A',
  };
  return <span className={`day-status ${styles[status]}`}>{text[status]}</span>;
}

const CRAPage = () => {
  const { user } = useAuth();
  const { clients, cras, createCRA, updateCRA, loading } = useAppData();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidayConfirmation, setHolidayConfirmation] = useState({ isOpen: false, day: null });
  const [isPreviewOpen, setPreviewOpen] = useState(false);

  const getCRAForMonth = (userId, date) => {
    const found = cras.find(cra => {
      // Handle both string and Date formats for cra.month
      const craMonthDate = typeof cra.month === 'string' ? new Date(cra.month) : cra.month;
      return cra.user_id === userId &&
        getYear(craMonthDate) === getYear(date) &&
        format(craMonthDate, 'M') === format(date, 'M');
    });
    return found;
  };

  const craData = useMemo(() => {
    if (!user) return null;
    return getCRAForMonth(user.id, currentMonth);
  }, [user, currentMonth, cras]);
  
  const holidays = useMemo(() => getHolidays(getYear(currentMonth)), [currentMonth]);
  const isHoliday = (day) => holidays.some(h => format(h.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const workingDaysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return days.filter(day => !isWeekend(day) && !isHoliday(day)).length;
  }, [currentMonth, holidays]);

  const totalDaysFilled = useMemo(() => {
    if (!craData || !craData.days) return 0;
    return Object.values(craData.days).reduce((acc, day) => {
        if (day.status === 'worked_1') return acc + 1;
        if (day.status === 'worked_0_5') return acc + 0.5;
        return acc;
    }, 0);
  }, [craData]);

  const isLockedForConsultant = useMemo(() => {
    // If no CRA exists yet, allow editing to create one
    if (!craData) return false;
    return !['Brouillon', 'À réviser'].includes(craData.status);
  }, [craData]);
  const isCompletelyLocked = useMemo(() => {
    // If no CRA exists yet, it's not locked
    if (!craData) return false;
    return craData.status === 'Signé';
  }, [craData]);

  const handleDayUpdate = async (day, status) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    let newDays;

    if (craData) {
        newDays = { ...(craData.days || {}) };
        if (status) newDays[dayKey] = { status };
        else delete newDays[dayKey];
        await updateCRA(craData.id, { days: newDays });
    } else {
        newDays = { [dayKey]: { status } };
        await createCRA(user.id, currentMonth, newDays);
    }
  };

  const updateDayStatus = (day) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const currentStatus = craData?.days?.[dayKey]?.status;
    
    let newStatus;
    if (currentStatus === 'worked_1') newStatus = 'worked_0_5';
    else if (currentStatus === 'worked_0_5') newStatus = 'off';
    else if (currentStatus === 'off') newStatus = undefined;
    else newStatus = 'worked_1';
    
    handleDayUpdate(day, newStatus);
  };

  const handleDayClick = (day) => {
    if (!isSameMonth(day, currentMonth) || isLockedForConsultant || isCompletelyLocked) return;

    if (isHoliday(day) && !craData?.days?.[format(day, 'yyyy-MM-dd')]) {
      setHolidayConfirmation({ isOpen: true, day });
    } else {
      updateDayStatus(day);
    }
  };
  
  const confirmHolidayWork = () => {
      if(holidayConfirmation.day) {
          updateDayStatus(holidayConfirmation.day);
      }
      setHolidayConfirmation({ isOpen: false, day: null });
  };

  const handleFillWorkingDays = async () => {
    if (isLockedForConsultant || isCompletelyLocked) return;
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    const workingDays = daysInMonth.filter(day => !isWeekend(day) && !isHoliday(day));
    
    const newDays = workingDays.reduce((acc, day) => {
        acc[format(day, 'yyyy-MM-dd')] = { status: 'worked_1' };
        return acc;
    }, craData?.days || {});
    
    if (craData) {
        await updateCRA(craData.id, { days: newDays });
    } else {
        await createCRA(user.id, currentMonth, newDays);
    }
    toast({ title: "Jours ouvrés remplis." });
  };

  const handleClearAll = async () => {
    if (isLockedForConsultant || isCompletelyLocked || !craData) return;
    await updateCRA(craData.id, { days: {} });
    toast({ title: "Saisie effacée." });
  };

  const handleSubmit = async () => {
    if(!craData) return;
    await updateCRA(craData.id, { status: 'Soumis', revision_reason: null });
  }

  const handleSign = async () => {
    if(!craData) return;
    await updateCRA(craData.id, { status: 'Signé' });
  }

  const handleCommentChange = async (comment) => {
    if (isLockedForConsultant || !craData) return;
    await updateCRA(craData.id, { comment });
  }
  
  const craForPreview = useMemo(() => {
    if (!craData || !user) return null;
    const userClient = clients.find(c => c.id === user.client_id);
    return {
      ...craData,
      consultantName: user.name || user.fullname,
      clientName: userClient?.name || 'Non assigné',
      clientAddress: userClient?.address || 'N/A',
      month: craData.month,
      totalDays: totalDaysFilled,
    };
  }, [craData, user, totalDaysFilled, clients]);

  if (loading) {
    return <div className="flex h-full items-center justify-center">Chargement du CRA...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-6">Mon CRA</h1>
      
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div><p className="text-sm font-medium text-gray-500">Consultant</p><p className="font-semibold">{user?.name || user?.fullname}</p></div>
          <div><p className="text-sm font-medium text-gray-500">Client</p><p className="font-semibold">{clients.find(c => c.id === user?.client_id)?.name || 'Non assigné'}</p></div>
          <div><p className="text-sm font-medium text-gray-500">Année</p><p className="font-semibold">{format(currentMonth, 'yyyy')}</p></div>
          <div><p className="text-sm font-medium text-gray-500">Mois</p><p className="font-semibold capitalize">{format(currentMonth, 'MMMM', { locale: fr })}</p></div>
        </div>
      </Card>
      
      {craData?.status === 'À réviser' && craData.revision_reason && (
        <Card className="p-4 mb-6 bg-orange-50 border-orange-200">
            <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-1" />
                <div>
                    <h3 className="font-semibold text-orange-800">Motif de la révision</h3>
                    <p className="text-sm text-orange-700">{craData.revision_reason}</p>
                </div>
            </div>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-500">STATUT</p>
            <StatusBadge status={craData?.status || 'Non créé'} />
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <Clock className="w-8 h-8 text-blue-500" />
            <div><p className="text-sm font-medium text-gray-500">TOTAL MOIS</p><p className="text-2xl font-bold">{totalDaysFilled.toFixed(1)} j</p></div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <CalendarIcon className="w-8 h-8 text-green-500" />
            <div><p className="text-sm font-medium text-gray-500">OUVRABLES (EST.)</p><p className="text-2xl font-bold">{workingDaysInMonth}</p></div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-semibold text-lg capitalize w-32 text-center">{format(currentMonth, 'MMMM yyyy', { locale: fr })}</span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center space-x-2">
            {(isLockedForConsultant || isCompletelyLocked) && craData && <Lock className="h-5 w-5 text-gray-400" title="Ce CRA est verrouillé" />}
             {user?.role?.toLowerCase() === 'consultant' && !isLockedForConsultant && (
                <>
                    <Button variant="outline" onClick={handleFillWorkingDays}><Edit className="w-4 h-4 mr-2" />Remplir ouvrés</Button>
                    <Button variant="outline" onClick={handleClearAll} disabled={!craData}><Trash2 className="w-4 h-4 mr-2" />Effacer tout</Button>
                    <Button onClick={handleSubmit} disabled={!craData}><Send className="w-4 h-4 mr-2" />Soumettre</Button>
                </>
             )}
            {user?.role?.toLowerCase() === 'consultant' && craData?.status === 'Signature demandée' && (
              <Button onClick={handleSign} className="bg-green-500 hover:bg-green-600"><PenSquare className="w-4 h-4 mr-2" />Signer mon CRA</Button>
            )}
            <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!craData}><Eye className="w-4 h-4 mr-2" />Aperçu</Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-l border-t border-gray-200">
          {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(day => (
            <div key={day} className="text-center font-medium text-sm text-gray-500 py-2 border-r border-b bg-gray-50">{day}</div>
          ))}
          {calendarDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayData = craData?.days?.[dayKey];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayWeekend = isWeekend(day);
            const isDayHoliday = isHoliday(day);
            const isClickable = !isLockedForConsultant && isCurrentMonth;
            
            const cellBg = () => {
                if (!isCurrentMonth) return '';
                if(dayData?.status === 'worked_1') return 'bg-green-100';
                if(dayData?.status === 'worked_0_5') return 'bg-blue-100';
                if(dayData?.status === 'off') return 'bg-red-100';
                return '';
            }

            return (
              <div
                key={day.toString()}
                className={`day-cell border-r border-b ${isToday(day) ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''} ${isDayWeekend && isCurrentMonth ? 'weekend' : ''} ${isDayHoliday && isCurrentMonth ? 'holiday' : ''} ${!isClickable ? 'cursor-not-allowed' : ''} ${cellBg()}`}
                onClick={() => handleDayClick(day)}
              >
                <span>{format(day, 'd')}</span>
                {isDayHoliday && isCurrentMonth && <div className="absolute top-1 left-1 text-xs text-yellow-800 bg-yellow-200 px-1 rounded">Férié</div>}
                <DayStatusIndicator status={dayData?.status} />
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <label htmlFor="comment" className="text-sm font-medium text-gray-700 mb-2 block">Commentaire</label>
          <Textarea
            id="comment"
            placeholder={isLockedForConsultant && craData ? "Le CRA est verrouillé." : "Notes mensuelles..."}
            value={craData?.comment || ''}
            onChange={(e) => handleCommentChange(e.target.value)}
            disabled={isLockedForConsultant || !craData}
          />
        </div>
      </Card>
      
      <CRAPreview isOpen={isPreviewOpen} onOpenChange={setPreviewOpen} cra={craForPreview} />

      <AlertDialog open={holidayConfirmation.isOpen} onOpenChange={(isOpen) => setHolidayConfirmation({ ...holidayConfirmation, isOpen })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jour férié</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir déclarer une activité sur un jour férié ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHolidayConfirmation({ isOpen: false, day: null })}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmHolidayWork}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </motion.div>
  );
};

export default CRAPage;
