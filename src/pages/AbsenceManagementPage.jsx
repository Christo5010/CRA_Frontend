import React, { useEffect, useState } from 'react';
import { useAppData } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AbsenceManagementPage = () => {
  const { listAllAbsences, decideAbsence } = useAppData();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentById, setCommentById] = useState({});

  const load = async () => {
    setLoading(true);
    const res = await listAllAbsences({ status: 'Pending' });
    if (res.success) setRows(res.data || []); else setRows([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    const comment = commentById[id] || '';
    const res = await decideAbsence(id, action, comment);
    if (res.success) load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestion des absences</h1>
      <Card className="p-4">
        {loading ? (
          <div>Chargement…</div>
        ) : (
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r?.profiles?.name || 'Consultant'} • {r.start_date} → {r.end_date}</div>
                    <div className="text-sm text-gray-600">{r.type || 'Absence'}{r.reason ? ` • ${r.reason}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input className="border rounded px-2 py-1 text-sm" placeholder="Commentaire" value={commentById[r.id] || ''} onChange={(e)=>setCommentById(s=>({...s,[r.id]:e.target.value}))} />
                    <Button size="sm" onClick={()=>act(r.id,'approve')}>Approuver</Button>
                    <Button size="sm" variant="destructive" onClick={()=>act(r.id,'reject')}>Refuser</Button>
                  </div>
                </div>
              </div>
            ))}
            {rows.length === 0 && <div className="text-sm text-gray-500">Aucune demande en attente.</div>}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AbsenceManagementPage;


