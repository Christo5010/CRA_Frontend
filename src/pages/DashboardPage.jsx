
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useAppData } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/components/ui/use-toast';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, parseISO, getMonth, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, History } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const StatCard = ({ title, value, color }) => (
    <Card className="flex-1 min-w-[120px] bg-card shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </CardContent>
    </Card>
);

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


const DashboardPage = () => {
    const { profiles, clients, cras, logAction, fetchData } = useAppData();
    const { toast } = useToast();
    const [filters, setFilters] = useState({
        searchTerm: '',
        consultant: 'Tous',
        client: 'Tous',
        status: 'Tous',
        dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
    });
    const [selectedForReminder, setSelectedForReminder] = useState([]);


    useEffect(() => {
        fetchData();
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const setDatePreset = (preset) => {
        const today = new Date();
        let from, to;
        switch (preset) {
            case 'this_month':
                from = startOfMonth(today);
                to = endOfMonth(today);
                break;
            case 'last_month':
                const lastMonth = subMonths(today, 1);
                from = startOfMonth(lastMonth);
                to = endOfMonth(lastMonth);
                break;
            case 'this_quarter':
                from = startOfQuarter(today);
                to = endOfQuarter(today);
                break;
            default:
                from = null;
                to = null;
        }
        handleFilterChange('dateRange', { from, to });
    };

    const resetFilters = () => {
        setFilters({
            searchTerm: '',
            consultant: 'Tous',
            client: 'Tous',
            status: 'Tous',
            dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
        });
        setSelectedForReminder([]);
    };
    
    const { consultantsCount, aRelancer, soumis, valides, signes, consultantsToRemind } = useMemo(() => {
        const consultantsInPeriod = profiles.filter(p => p.role === 'Consultant');
        let allCRAsForPeriod = [];
        
        const start = filters.dateRange.from || new Date('2000-01-01');
        const end = filters.dateRange.to || new Date('2100-01-01');

        consultantsInPeriod.forEach(consultant => {
            let month = new Date(start);
            while(month <= end) {
                const existingCRA = cras.find(c => 
                    c.user_id === consultant.id && 
                    getMonth(c.month) === getMonth(month) &&
                    getYear(c.month) === getYear(month)
                );

                const craData = {
                    id: existingCRA ? existingCRA.id : `${consultant.id}-${format(month, 'yyyy-MM')}`,
                    consultantName: consultant.name,
                    clientName: consultant.clients?.name,
                    month: month,
                    status: existingCRA ? existingCRA.status : 'Non créé',
                    totalDays: existingCRA?.days ? Object.values(existingCRA.days).reduce((acc, day) => {
                        if (day.status === 'worked_1') return acc + 1;
                        if (day.status === 'worked_0_5') return acc + 0.5;
                        return acc;
                    }, 0) : 0,
                };
                allCRAsForPeriod.push(craData);
                month = addMonths(month, 1);
            }
        });

        let filtered = allCRAsForPeriod;

        if (filters.consultant !== 'Tous') {
            filtered = filtered.filter(cra => cra.consultantName === filters.consultant);
        }
        if (filters.client !== 'Tous') {
            filtered = filtered.filter(cra => cra.clientName === filters.client);
        }
        if (filters.status !== 'Tous') {
            filtered = filtered.filter(cra => cra.status === filters.status);
        }
        if (filters.searchTerm) {
             filtered = filtered.filter(cra =>
                cra.consultantName?.toLowerCase().includes(filters.searchTerm.toLowerCase())
            );
        }

        const toRemind = filtered.filter(cra => ['Brouillon', 'Non créé', 'À réviser'].includes(cra.status));

        return {
            consultantsCount: new Set(allCRAsForPeriod.map(c => c.consultantName)).size,
            aRelancer: allCRAsForPeriod.filter(c => ['Brouillon', 'Non créé', 'À réviser'].includes(c.status)).length,
            soumis: allCRAsForPeriod.filter(cra => cra.status === 'Soumis').length,
            valides: allCRAsForPeriod.filter(cra => cra.status === 'Validé').length,
            signes: allCRAsForPeriod.filter(cra => cra.status === 'Signé').length,
            consultantsToRemind: toRemind,
        };
    }, [cras, profiles, filters]);

    const handleSelectAllForReminder = (checked) => {
        if (checked) {
            setSelectedForReminder(consultantsToRemind.map(c => c.id));
        } else {
            setSelectedForReminder([]);
        }
    };

    const handleSelectForReminder = (craId) => {
        setSelectedForReminder(prev => 
            prev.includes(craId) ? prev.filter(id => id !== craId) : [...prev, craId]
        );
    };
    
    const handleReminders = (type) => {
        let reminderCount = 0;
        let reminderList = [];

        if(type === 'all') {
            reminderCount = consultantsToRemind.length;
            reminderList = consultantsToRemind.map(c => c.consultantName);
            logAction('Envoi des relances à tous les retards');
        } else if (type === 'selection' && selectedForReminder.length > 0) {
            reminderCount = selectedForReminder.length;
            reminderList = consultantsToRemind
                .filter(c => selectedForReminder.includes(c.id))
                .map(c => c.consultantName);
            logAction('Envoi des relances sélectives', { count: reminderCount, consultants: reminderList });
            setSelectedForReminder([]);
        }

        if(reminderCount > 0){
            toast({ title: "Relances envoyées !", description: `${reminderCount} consultant(s) notifié(s) (simulation).` });
        } else {
            toast({ title: "Aucune relance à envoyer.", variant: 'destructive' });
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
             <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Tableau de bord</h1>
                <div className="flex items-center space-x-2">
                    <NavLink to="/dashboard" className="text-gray-900 font-semibold bg-gray-100 px-3 py-2 rounded-md text-sm">Tableau de bord</NavLink>
                    <NavLink to="/cra" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm">Liste</NavLink>
                </div>
            </div>
            
            <Card>
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">PÉRIODE :</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal", !filters.dateRange.from && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{filters.dateRange.from ? (filters.dateRange.to ? (<>{format(filters.dateRange.from, "LLL dd, y")} - {format(filters.dateRange.to, "LLL dd, y")}</>) : (format(filters.dateRange.from, "LLL dd, y"))) : (<span>Choisir une période</span>)}</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={filters.dateRange?.from} selected={filters.dateRange} onSelect={(range) => handleFilterChange('dateRange', range || {from: null, to: null})} numberOfMonths={2} /></PopoverContent>
                        </Popover>
                        <Button variant="outline" size="sm" onClick={() => setDatePreset('this_month')}>Ce mois-ci</Button>
                        <Button variant="outline" size="sm" onClick={() => setDatePreset('last_month')}>Mois dernier</Button>
                        <Button variant="outline" size="sm" onClick={() => setDatePreset('this_quarter')}>Ce trimestre</Button>
                    </div>
                    <div className="flex gap-2">
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleReminders('all')}>Relancer — tous les retards</Button>
                         <Button variant="secondary" onClick={() => handleReminders('selection')} disabled={selectedForReminder.length === 0}>Relancer la sélection ({selectedForReminder.length})</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard title="CONSULTANTS" value={consultantsCount} />
                <StatCard title="À RELANCER" value={aRelancer} color="text-red-500"/>
                <StatCard title="SOUMIS" value={soumis} color="text-yellow-500"/>
                <StatCard title="VALIDÉS" value={valides} color="text-blue-500"/>
                <StatCard title="SIGNÉS" value={signes} color="text-green-500"/>
            </div>

            <Card>
                 <CardContent className="p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={filters.consultant} onValueChange={(v) => handleFilterChange('consultant', v)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Consultant (Tous)</SelectItem>{profiles.filter(p=>p.role==='Consultant').map(u=><SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent></Select>
                        <Select value={filters.client} onValueChange={(v) => handleFilterChange('client', v)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Client (Tous)</SelectItem>{clients.map(c=><SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
                        <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Statut (Tous)</SelectItem><SelectItem value="Non créé">Non créé</SelectItem><SelectItem value="Brouillon">Brouillon</SelectItem><SelectItem value="À réviser">À réviser</SelectItem><SelectItem value="Soumis">Soumis</SelectItem><SelectItem value="Validé">Validé</SelectItem><SelectItem value="Signature demandée">Signature demandée</SelectItem><SelectItem value="Signé">Signé</SelectItem></SelectContent></Select>
                        <Input placeholder="Recherche consultant..." className="w-full sm:w-[200px]" value={filters.searchTerm} onChange={e => handleFilterChange('searchTerm', e.target.value)} />
                        <Button variant="ghost" onClick={resetFilters}>Réinitialiser</Button>
                    </div>
                </CardContent>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead>Consultant</TableHead>
                                <TableHead>Mois</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Total (J)</TableHead>
                                <TableHead className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <span>Relancer</span>
                                        <Checkbox 
                                            onCheckedChange={handleSelectAllForReminder}
                                            checked={consultantsToRemind.length > 0 && selectedForReminder.length === consultantsToRemind.length}
                                        />
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {consultantsToRemind.length > 0 ? (
                                consultantsToRemind.map((cra) => (
                                    <TableRow key={cra.id} className="table-row-hover">
                                        <TableCell className="font-medium">{cra.consultantName}</TableCell>
                                        <TableCell className="capitalize">{format(cra.month, 'MMMM yyyy', {locale: fr})}</TableCell>
                                        <TableCell><StatusBadge status={cra.status} /></TableCell>
                                        <TableCell>{cra.totalDays.toFixed(1)}</TableCell>
                                        <TableCell className="text-right">
                                            <Checkbox
                                                checked={selectedForReminder.includes(cra.id)}
                                                onCheckedChange={() => handleSelectForReminder(cra.id)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Aucun consultant à relancer pour les filtres sélectionnés.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </motion.div>
    );
};

export default DashboardPage;
