import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';

const HistoryPage = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-6">Historique</h1>
      <Card>
        <CardHeader>
          <CardTitle>Historique des CRA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center text-gray-500 h-64">
            <History className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold">L'historique des CRA sera bientôt disponible ici.</p>
            <p>🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HistoryPage;