
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { parseISO, startOfMonth, formatISO } from 'date-fns';
import apiClient from '@/lib/apiClient';

const AppContext = createContext(null);

export const useAppData = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppData must be used within an AppProvider');
    }
    return context;
}

// Generate mock CRA data for demonstration
const generateMockCRAData = (profiles) => {
    const consultants = profiles.filter(p => p.role === 'consultant');
    const mockCRAs = [];
    
    // Generate CRA data for the last 3 months for each consultant
    for (let i = 0; i < 3; i++) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        
        consultants.forEach(consultant => {
            const statuses = ['Brouillon', 'Soumis', 'Validé', 'Signé'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            // Generate random days data
            const days = {};
            const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDate = new Date(month.getFullYear(), month.getMonth(), day);
                const dayOfWeek = dayDate.getDay();
                
                // Skip weekends
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    days[day] = { status: 'weekend' };
                } else {
                    // Random work status
                    const workStatuses = ['worked_1', 'worked_0_5', 'holiday', 'sick'];
                    const randomWorkStatus = workStatuses[Math.floor(Math.random() * workStatuses.length)];
                    days[day] = { status: randomWorkStatus };
                }
            }
            
            mockCRAs.push({
                id: `mock-${consultant.id}-${month.getFullYear()}-${month.getMonth() + 1}`,
                user_id: consultant.id,
                month: month,
                status: randomStatus,
                days: days,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        });
    }
    
    return mockCRAs;
};

export const AppProvider = ({ children }) => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [clients, setClients] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [cras, setCras] = useState([]);
    const [actionLogs, setActionLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataFetched, setDataFetched] = useState(false);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated || !user) {
            setLoading(false);
            setClients([]);
            setProfiles([]);
            setCras([]);
            setActionLogs([]);
            setDataFetched(false);
            return;
        };

        if (dataFetched) {
            return;
        }

        setLoading(true);
        setDataFetched(true);

        try {
            // Fetch all users/profiles if user is admin
            let allProfiles = [user]; // Start with current user
            
            if (user.role === 'admin') {
                try {
                    const response = await apiClient.get('/user/all');
                    if (response.data.success) {
                        allProfiles = response.data.data;
                    }
                } catch (error) {
                    // Could not fetch all users (might not be admin)
                }
            }
            
            setProfiles(allProfiles);
            
            // Fetch clients if user is admin or manager
            if (user.role === 'admin' || user.role === 'manager') {
                try {
                    const clientsResponse = await apiClient.get('/client');
                    if (clientsResponse.data.success) {
                        setClients(clientsResponse.data.data);
                    }
                } catch (error) {
                    // Could not fetch clients
                }
            } else {
                setClients([]);
            }
            
            // Fetch CRAs for the user
            try {
                if (user.role === 'admin') {
                    // Admin gets all CRAs
                    const crasResponse = await apiClient.get('/cra/all');
                    if (crasResponse.data.success) {
                        setCras(crasResponse.data.data);
                    }
                } else if (user.role === 'manager') {
                    // Manager gets dashboard CRAs
                    const crasResponse = await apiClient.get('/cra/dashboard');
                    if (crasResponse.data.success) {
                        setCras(crasResponse.data.data);
                    }
                } else {
                    // Consultant gets their own CRAs
                    const crasResponse = await apiClient.get(`/cra/user/${user.id}`);
                    if (crasResponse.data.success) {
                        setCras(crasResponse.data.data);
                    }
                }
            } catch (error) {
                // Could not fetch CRAs
                setCras([]);
            }
            
            // Fetch action logs if user is admin or manager
            if (user.role === 'admin' || user.role === 'manager') {
                try {
                    const logsResponse = await apiClient.get('/action-log/dashboard');
                    if (logsResponse.data.success) {
                        setActionLogs(logsResponse.data.data.logs || []);
                    }
                } catch (error) {
                    // Could not fetch action logs
                }
            } else {
                setActionLogs([]);
            }

        } catch (error) {
            toast({ variant: 'destructive', title: "Erreur de chargement", description: `Impossible de charger les données: ${error.message}` });
        } finally {
            setLoading(false);
        }
    }, [user, isAuthenticated, toast, dataFetched]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchData();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
            setClients([]);
            setProfiles([]);
            setCras([]);
            setActionLogs([]);
        }
    }, [authLoading, isAuthenticated, fetchData]);

    const logAction = useCallback(async (action, details = {}) => {
        if (!user) return;
        try {
            await apiClient.post('/action-log', {
                action,
                details,
                user_id: user.id
            });
        } catch (error) {
            // Error logging action - don't show error to user
        }
    }, [user]);
    
    const updateCRA = async (craId, updates) => {
        try {
            const response = await apiClient.patch(`/cra/${craId}`, updates);
            if (response.data.success) {
                toast({ title: "CRA mis à jour." });
                await logAction(updates.status ? `Changement statut CRA: ${updates.status}` : 'Modification CRA', { craId });
                // Refresh data
                fetchData();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'La mise à jour du CRA a échoué.' });
        }
    };
    
    const createCRA = async (userId, date, days) => {
        try {
            const craData = {
                user_id: userId,
                month: date,
                status: 'Brouillon',
                days: days || {}
            };
            
            const response = await apiClient.post('/cra', craData);
            if (response.data.success) {
                toast({ title: "Nouveau CRA créé." });
                await logAction('Création CRA', { userId, date, days });
                // Refresh data
                fetchData();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'La création du CRA a échoué.' });
        }
    };

    const deleteCRA = async (craId) => {
        try {
            const response = await apiClient.delete(`/cra/${craId}`);
            if (response.data.success) {
                toast({ title: "CRA supprimé." });
                await logAction('Suppression CRA', { craId });
                // Refresh data
                fetchData();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'La suppression du CRA a échoué.' });
        }
    };

    const value = useMemo(() => ({
        clients,
        profiles,
        cras,
        actionLogs,
        loading,
        fetchData,
        logAction,
        updateCRA,
        createCRA,
        deleteCRA,
    }), [clients, profiles, cras, actionLogs, loading, fetchData, logAction]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
