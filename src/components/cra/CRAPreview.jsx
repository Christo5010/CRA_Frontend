
import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getHolidays } from '@/lib/holidays';

const CRAPreview = ({ isOpen, onOpenChange, cra }) => {
  const previewRef = useRef();

  if (!cra) return null;

  const { consultant, client, clientAddress, monthName, year, days, comment, totalDays } = cra;

  const handleDownload = () => {
    if (!previewRef.current) return;
    html2canvas(previewRef.current, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CRA-${consultant}-${monthName}-${year}.pdf`);
    });
  };

  const holidays = getHolidays(year);
  const calendarDays = Object.keys(days).sort();
  
  const totalWorked1 = Object.values(days).filter(d => d.status === 'worked_1').length;
  const totalWorked05 = Object.values(days).filter(d => d.status === 'worked_0_5').length;
  const totalOff = Object.values(days).filter(d => d.status === 'off').length;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Aperçu du Compte Rendu d'Activité</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto p-2" ref={previewRef}>
            <div className="p-8 bg-white text-black">
                <header className="flex justify-between items-center pb-4 border-b-2 border-gray-800">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Seven Opportunity</h1>
                        <p className="text-gray-600">123 Rue de l'Exemple, 75001 Paris</p>
                    </div>
                    <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                       <span className="text-5xl font-bold text-gray-800">7</span>
                    </div>
                </header>

                <section className="my-8">
                    <h2 className="text-xl font-semibold text-center uppercase mb-4 text-gray-800">Feuille de temps - {monthName} {year}</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div className="flex justify-between"><span className="font-semibold">Consultant :</span><span>{consultant}</span></div>
                        <div className="flex justify-between"><span className="font-semibold">Client :</span><span>{client || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="font-semibold">Total jours travaillés :</span><span>{totalDays}</span></div>
                        <div className="flex justify-between"><span className="font-semibold">Adresse client :</span><span>{clientAddress || 'N/A'}</span></div>
                    </div>
                </section>

                <section className="my-8">
                     <table className="w-full border-collapse text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border p-2 font-semibold">Date</th>
                                <th className="border p-2 font-semibold">Jour</th>
                                <th className="border p-2 font-semibold">Détail</th>
                                <th className="border p-2 font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calendarDays.map(dateStr => {
                                const date = new Date(dateStr);
                                date.setUTCHours(12);
                                const day = days[dateStr];
                                let detail = '';
                                if(day.status === 'worked_1') detail = 'Journée travaillée';
                                else if(day.status === 'worked_0_5') detail = 'Demi-journée';
                                else if(day.status === 'off') detail = 'Absence';
                                
                                return(
                                <tr key={dateStr}>
                                    <td className="border p-2">{format(date, 'dd/MM/yyyy')}</td>
                                    <td className="border p-2 capitalize">{format(date, 'EEEE', {locale: fr})}</td>
                                    <td className="border p-2">{detail}</td>
                                    <td className="border p-2 text-center">{day.status === 'worked_1' ? '1' : day.status === 'worked_0_5' ? '0.5' : '0'}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </section>
                
                <section className="my-8">
                    <h3 className="font-semibold mb-2">Récapitulatif</h3>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="p-2 border rounded-md"><p className="font-bold">{totalWorked1}</p><p className="text-xs">Jours travaillés</p></div>
                        <div className="p-2 border rounded-md"><p className="font-bold">{totalWorked05}</p><p className="text-xs">Demi-journées</p></div>
                        <div className="p-2 border rounded-md"><p className="font-bold">{totalOff}</p><p className="text-xs">Absences</p></div>
                        <div className="p-2 border rounded-md bg-gray-100"><p className="font-bold text-lg">{totalDays}</p><p className="text-xs">Total jours</p></div>
                    </div>
                </section>

                {comment && (
                    <section className="my-8">
                        <h3 className="font-semibold mb-2">Commentaires</h3>
                        <p className="text-sm p-3 border rounded-md bg-gray-50">{comment}</p>
                    </section>
                )}

                <footer className="pt-8 text-xs text-gray-500">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="font-semibold mb-8">Signature Consultant</p>
                            <p>{consultant}</p>
                        </div>
                        <div>
                            <p className="font-semibold mb-8">Signature Client</p>
                            <p>Cachet et signature</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="secondary" onClick={handleDownload}><Download className="w-4 h-4 mr-2" />Télécharger en PDF</Button>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CRAPreview;
