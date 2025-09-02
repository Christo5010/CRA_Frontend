
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppContext';
import { FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CRAPreview from '@/components/cra/CRAPreview';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const StatusBadge = ({ status }) => {
  const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full inline-block";
  const statusClasses = {
    Brouillon: "bg-gray-100 text-gray-800",
    "À réviser": "bg-orange-100 text-orange-800",
    Soumis: "bg-yellow-100 text-yellow-800",
    Validé: "bg-blue-100 text-blue-800",
    "Signature demandée": "bg-purple-100 text-purple-800",
    Signé: "bg-green-100 text-green-800",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const MyDocumentsPage = () => {
    const { user } = useAuth();
    const { clients, cras } = useAppData();
    const [previewCra, setPreviewCra] = useState(null);

    const signedCRAs = useMemo(() => {
        if (!user || !cras) return [];
        return cras.filter(cra => cra.user_id === user.id && cra.status === 'Signé')
            .sort((a,b) => b.month - a.month);
    }, [cras, user]);
    
    const handlePreview = (cra) => {
        const totalDays = cra?.days ? Object.values(cra.days).reduce((acc, day) => {
                if (day.status === 'worked_1') return acc + 1;
                if (day.status === 'worked_0_5') return acc + 0.5;
                return acc;
            }, 0) : 0;

        setPreviewCra({
            ...cra,
            consultantName: user.fullname,
            clientName: 'N/A', // Placeholder since we don't have client data yet
            clientAddress: 'N/A',
            totalDays: totalDays,
        });
    }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-6">Mes CRA Signés</h1>
      <Card>
        <CardContent className="p-0">
           <Table>
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead>Année</TableHead>
                        <TableHead>Mois</TableHead>
                        <TableHead>Total (J)</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {signedCRAs.length > 0 ? (
                        signedCRAs.map(cra => {
                            const totalDays = cra?.days ? Object.values(cra.days).reduce((acc, day) => {
                                if (day.status === 'worked_1') return acc + 1;
                                if (day.status === 'worked_0_5') return acc + 0.5;
                                return acc;
                            }, 0) : 0;
                            return (
                                <TableRow key={cra.id}>
                                    <TableCell>{format(cra.month, 'yyyy')}</TableCell>
                                    <TableCell className="capitalize">{format(cra.month, 'MMMM', {locale: fr})}</TableCell>
                                    <TableCell>{totalDays.toFixed(1)}</TableCell>
                                    <TableCell><StatusBadge status={cra.status} /></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handlePreview(cra)}><Eye className="w-4 h-4 mr-2" />Aperçu</Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan="5" className="h-48 text-center">
                                <div className="flex flex-col items-center justify-center text-gray-500">
                                    <FileText className="w-12 h-12 mb-4" />
                                    <p className="text-lg font-semibold">Aucun CRA signé pour le moment.</p>
                                    <p>Vos CRA signés apparaîtront ici.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
           </Table>
        </CardContent>
      </Card>
      <CRAPreview isOpen={!!previewCra} onOpenChange={(isOpen) => !isOpen && setPreviewCra(null)} cra={previewCra} />
    </motion.div>
  );
};

export default MyDocumentsPage;
