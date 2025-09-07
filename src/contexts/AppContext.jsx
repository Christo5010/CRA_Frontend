
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { parseISO, startOfMonth, formatISO } from 'date-fns';
import apiClient from '@/lib/apiClient';

const AppContext = createContext(null);

export const useAppData = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppData doit être utilisé dans un AppProvider');
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

    const fetchData = useCallback(async (forceRefresh = false) => {
        console.debug('[AppContext] fetchData called', { forceRefresh, isAuthenticated, hasUser: !!user });
        if (!isAuthenticated || !user) {
            setLoading(false);
            setClients([]);
            setProfiles([]);
            setCras([]);
            setActionLogs([]);
            setDataFetched(false);
            return;
        };

        if (dataFetched && !forceRefresh) {
            console.debug('[AppContext] fetchData skipped (cached)');
            return;
        }

        setLoading(true);
        if (forceRefresh) {
            setDataFetched(false);
        }
        setDataFetched(true);

        try {
            // Fetch all users/profiles if user is admin
            let allProfiles = [user]; // Start with current user
            
            if (user.role === 'admin') {
                try {
                    const response = await apiClient.get('/user/all');
                    console.debug('[AppContext] /user/all response', response.data);
                    if (response.data.success) {
                        allProfiles = response.data.data;
                    }
                } catch (error) {
                }
            }
            
            setProfiles(allProfiles);
            
            // Fetch clients if user is admin or manager
            if (user.role === 'admin' || user.role === 'manager') {
                try {
                    const clientsResponse = await apiClient.get('/client');
                    console.debug('[AppContext] /client response', clientsResponse.data);
                    if (clientsResponse.data.success) {
                        setClients(clientsResponse.data.data);
                    }
                } catch (error) {
                }
            } else if (user.role === 'consultant') {
                // Consultants can fetch their assigned client
                try {
                    const clientResponse = await apiClient.get('/client/my-client');
                    console.debug('[AppContext] /client/my-client response', clientResponse.data);
                    if (clientResponse.data.success && clientResponse.data.data) {
                        setClients([clientResponse.data.data]);
                    } else {
                        setClients([]);
                    }
                } catch (error) {
                    setClients([]);
                }
            } else {
                setClients([]);
            }
            
            // Fetch CRAs for the user
            try {
                if (user.role === 'admin') {
                    // Admin gets all CRAs
                    const crasResponse = await apiClient.get('/cra/all');
                    console.debug('[AppContext] /cra/all response', crasResponse.data);
                    if (crasResponse.data.success) {
                        setCras(crasResponse.data.data);
                    }
                } else if (user.role === 'manager') {
                    // Manager gets dashboard CRAs
                    try {
                        const crasResponse = await apiClient.get('/cra/dashboard');
                        console.debug('[AppContext] /cra/dashboard response', crasResponse.data);
                        if (crasResponse.data.success) {
                            const dashboardCRAs = crasResponse.data.data || [];
                            // Fallback: if dashboard returns empty, try admin-all to avoid empty screens (will 403 for non-admin)
                            if (dashboardCRAs.length === 0) {
                                try {
                                    const allResp = await apiClient.get('/cra/all');
                                    console.debug('[AppContext] fallback /cra/all response', allResp.data);
                                    if (allResp.data.success) {
                                        setCras(allResp.data.data);
                                    } else {
                                        setCras([]);
                                    }
                                } catch (err) {
                                    setCras([]);
                                }
                            } else {
                                setCras(dashboardCRAs);
                            }

                            // Derive consultant profiles from CRAs for manager view
                            const source = (dashboardCRAs.length > 0) ? dashboardCRAs : [];
                            const derivedProfilesMap = new Map();
                            source.forEach((c) => {
                                const p = c.profiles; // embedded profile of user_id
                                if (p && p.id) {
                                    derivedProfilesMap.set(p.id, {
                                        id: p.id,
                                        name: p.name,
                                        email: p.email,
                                        role: (p.role || 'consultant').toLowerCase(),
                                        clients: p.clients || null,
                                    });
                                }
                            });
                            const derivedProfiles = Array.from(derivedProfilesMap.values());
                            if (derivedProfiles.length > 0) {
                                setProfiles(derivedProfiles);
                            }
                        } else {
                            setCras([]);
                        }
                    } catch (e) {
                        setCras([]);
                    }
                } else {
                    // Consultant gets their own CRAs
                    const crasResponse = await apiClient.get(`/cra/user/${user.id}`);
                    console.debug('[AppContext] /cra/user response', crasResponse.data);
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
                    console.debug('[AppContext] /action-log/dashboard response', logsResponse.data);
                    if (logsResponse.data.success) {
                        setActionLogs(logsResponse.data.data.logs || []);
                    }
                } catch (error) {
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

    // Ensure data loads immediately after a fresh sign-in
    useEffect(() => {
        const onSignedIn = () => fetchData(true);
        window.addEventListener('auth:signedIn', onSignedIn);
        return () => window.removeEventListener('auth:signedIn', onSignedIn);
    }, [fetchData]);

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
        console.debug('[AppContext] updateCRA', { craId, updates });
        // Optimistic update
        const previousCras = cras;
        const optimisticUpdatedAt = new Date().toISOString();
        setCras((prev) => prev.map((c) => c.id === craId ? { ...c, ...updates, updated_at: optimisticUpdatedAt } : c));

        try {
            const response = await apiClient.patch(`/cra/${craId}`, updates);
            console.debug('[AppContext] updateCRA response', response.data);
            if (response.data.success) {
                const updated = response.data.data;
                setCras((prev) => prev.map((c) => c.id === craId ? updated : c));
                toast({ title: "CRA mis à jour." });
                await logAction(updates.status ? `Changement statut CRA: ${updates.status}` : 'Modification CRA', { craId, updates });
            } else {
                setCras(previousCras);
            }
        } catch (error) {
            setCras(previousCras);
            toast({ variant: 'destructive', title: 'Erreur', description: 'La mise à jour du CRA a échoué.' });
        }
    };
    
    const createCRA = async (userId, date, days) => {
        try {
            const normalizedMonth = formatISO(startOfMonth(date), { representation: 'date' });
            const craData = {
                user_id: userId,
                month: normalizedMonth,
                status: 'Brouillon',
                days: days || {}
            };
            console.debug('[AppContext] createCRA payload', craData);
            const response = await apiClient.post('/cra', craData);
            console.debug('[AppContext] createCRA response', response.data);
            if (response.data.success) {
                const created = response.data.data;
                setCras((prev) => [...prev, created]);
                toast({ title: "Nouveau CRA créé." });
                await logAction('Création CRA', { userId, month: normalizedMonth });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'La création du CRA a échoué.' });
        }
    };

    const deleteCRA = async (craId) => {
        console.debug('[AppContext] deleteCRA', { craId });
        try {
            const response = await apiClient.delete(`/cra/${craId}`);
            console.debug('[AppContext] deleteCRA response', response.data);
            if (response.data.success) {
                toast({ title: "CRA supprimé." });
                await logAction('Suppression CRA', { craId });
                // Refresh data
                fetchData(true);
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
        profile: user,
    }), [clients, profiles, cras, actionLogs, loading, fetchData, logAction, user]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
