import React, { useMemo, useState } from 'react';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const MyAbsencesPage = () => {
  const { myAbsences, requestAbsence, refreshMyAbsences } = useAppData();
  const [form, setForm] = useState({ start_date: '', end_date: '', type: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const sorted = useMemo(() => (myAbsences || []).slice().sort((a,b) => (a.created_at < b.created_at ? 1 : -1)), [myAbsences]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) return;
    setSubmitting(true);
    const res = await requestAbsence(form);
    setSubmitting(false);
    if (res.success) {
      setForm({ start_date: '', end_date: '', type: '', reason: '' });
      refreshMyAbsences();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes absences</h1>

      <Card className="p-4">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={submit}>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Début</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={form.start_date} onChange={(e)=>setForm(f=>({...f,start_date:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fin</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={form.end_date} onChange={(e)=>setForm(f=>({...f,end_date:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <input type="text" className="w-full border rounded px-3 py-2" placeholder="CP, RTT, Maladie..." value={form.type} onChange={(e)=>setForm(f=>({...f,type:e.target.value}))} />
          </div>
          <div className="flex items-end">
            <Button type="submit" isLoading={submitting}>Demander</Button>
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm text-gray-600 mb-1">Commentaire</label>
            <textarea className="w-full border rounded px-3 py-2" rows={2} value={form.reason} onChange={(e)=>setForm(f=>({...f,reason:e.target.value}))} />
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Historique</h2>
        <div className="divide-y">
          {sorted.map(abs => (
            <div key={abs.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{abs.start_date} → {abs.end_date}</div>
                <div className="text-sm text-gray-600">{abs.type || 'Absence'}{abs.reason ? ` • ${abs.reason}` : ''}</div>
                {abs.manager_comment && (
                  <div
                    className={`text-md ${
                      abs.status === 'Rejected'
                        ? 'text-red-600'
                        : abs.status === 'Approved'
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {abs.manager_comment}
                  </div>
                )}
              </div>
              <div>
                <span className={`px-2 py-1 rounded text-sm ${abs.status === 'Approved' ? 'bg-green-100 text-green-700' : abs.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{abs.status}</span>
              </div>
            </div>
          ))}
          {sorted.length === 0 && <div className="text-sm text-gray-500">Aucune absence.</div>}
        </div>
      </Card>
    </div>
  );
};

export default MyAbsencesPage;


