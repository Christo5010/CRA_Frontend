
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


export const AppProvider = ({ children }) => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [clients, setClients] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [cras, setCras] = useState([]);
    const [actionLogs, setActionLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myAbsences, setMyAbsences] = useState([]);
    const [approvedAbsences, setApprovedAbsences] = useState([]);
    const [dataFetched, setDataFetched] = useState(false);

    const fetchData = useCallback(async (forceRefresh = false) => {
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
            return;
        }

        setLoading(true);
        if (forceRefresh) {
            setDataFetched(false);
        }
        setDataFetched(true);

        try {
            // Fetch all users/profiles if user is admin or manager (to align manager/admin views)
            let allProfiles = [user]; // Start with current user
            
            if (user.role === 'admin' || user.role === 'manager') {
                try {
                    const response = await apiClient.get('/user/all');
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
                    if (clientsResponse.data.success) {
                        setClients(clientsResponse.data.data);
                    }
                } catch (error) {
                }
            } else if (user.role === 'consultant') {
                // Consultants can fetch their assigned client
                try {
                    const clientResponse = await apiClient.get('/client/my-client');
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
                    if (crasResponse.data.success) {
                        setCras(crasResponse.data.data);
                    }
                } else if (user.role === 'manager') {
                    // Manager gets dashboard CRAs
                    try {
                        const crasResponse = await apiClient.get('/cra/dashboard');
                        if (crasResponse.data.success) {
                            const dashboardCRAs = crasResponse.data.data || [];
                            // Fallback: if dashboard returns empty, try admin-all to avoid empty screens (will 403 for non-admin)
                            if (dashboardCRAs.length === 0) {
                                try {
                                    const allResp = await apiClient.get('/cra/all');
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
                            // Do NOT override profiles for manager; keep full list fetched above
                        } else {
                            setCras([]);
                        }
                    } catch (e) {
                        setCras([]);
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
            
            // Fetch absences
            try {
                const myAbs = await apiClient.get('/absences/me');
                if (myAbs.data.success) setMyAbsences(myAbs.data.data || []);
            } catch (_) { setMyAbsences([]); }

            // Fetch action logs if user is admin or manager
            if (user.role === 'admin' || user.role === 'manager') {
                try {
                    const logsResponse = await apiClient.get('/action-log/dashboard');
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
        // Optimistic update
        const previousCras = cras;
        const optimisticUpdatedAt = new Date().toISOString();
        setCras((prev) => prev.map((c) => c.id === craId ? { ...c, ...updates, updated_at: optimisticUpdatedAt } : c));

        try {
            const response = await apiClient.patch(`/cra/${craId}`, updates);
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
    
    const createCRA = async (userId, date, days, options = {}) => {
        try {
            const normalizedMonth = formatISO(startOfMonth(date), { representation: 'date' });
            const craData = {
                user_id: userId,
                month: normalizedMonth,
                status: 'Brouillon',
                days: days || {},
                // Optional flags
                ...(options.hide_header !== undefined ? { hide_header: !!options.hide_header } : {}),
                ...(options.hide_client_signature !== undefined ? { hide_client_signature: !!options.hide_client_signature } : {}),
            };
            const response = await apiClient.post('/cra', craData);
            if (response.data.success) {
                const created = response.data.data;
                setCras((prev) => [...prev, created]);
                toast({ title: "Nouveau CRA créé." });
                await logAction('Création CRA', { userId, month: normalizedMonth, options });
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
                fetchData(true);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'La suppression du CRA a échoué.' });
        }
    };

    // Absences API
    const requestAbsence = async ({ start_date, end_date, type, reason }) => {
        try {
            const resp = await apiClient.post('/absences/me', { start_date, end_date, type, reason });
            if (resp.data.success) {
                setMyAbsences((prev) => [resp.data.data, ...prev]);
                toast({ title: "Demande d'absence créée." });
                return { success: true };
            }
            return { success: false, error: resp.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Échec de la demande' };
        }
    };

    const refreshMyAbsences = async () => {
        try {
            const resp = await apiClient.get('/absences/me');
            if (resp.data.success) setMyAbsences(resp.data.data || []);
        } catch (_) {}
    };

    const fetchApprovedAbsencesForMonth = async (userId, month) => {
        try {
            const resp = await apiClient.get(`/absences/approved/${userId}?month=${encodeURIComponent(month)}`);
            if (resp.data.success) setApprovedAbsences(resp.data.data || []);
        } catch (_) { setApprovedAbsences([]); }
    };

    const listAllAbsences = async ({ status, user_id } = {}) => {
        try {
            const qs = new URLSearchParams();
            if (status) qs.set('status', status);
            if (user_id) qs.set('user_id', user_id);
            const resp = await apiClient.get(`/absences?${qs.toString()}`);
            if (resp.data.success) return { success: true, data: resp.data.data };
            return { success: false, error: resp.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Échec du chargement des absences' };
        }
    };

    const decideAbsence = async (absenceId, action, comment) => {
        try {
            const resp = await apiClient.post(`/absences/${absenceId}/decision`, { action, comment });
            if (resp.data.success) {
                toast({ title: 'Décision enregistrée.' });
                return { success: true, data: resp.data.data };
            }
            return { success: false, error: resp.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Échec de la mise à jour' };
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
        myAbsences,
        approvedAbsences,
        requestAbsence,
        refreshMyAbsences,
        fetchApprovedAbsencesForMonth,
        listAllAbsences,
        decideAbsence,
    }), [clients, profiles, cras, actionLogs, loading, fetchData, logAction, user, myAbsences, approvedAbsences]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
