
import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getHolidays } from '@/lib/holidays';
import sevenLogo from '@/assets/seven.png';

const CRAPreview = ({ isOpen, onOpenChange, cra, onPdfGenerated }) => {
  const previewRef = useRef();

  if (!cra) return null;

  const consultant = cra.consultant || cra.consultantName || '';
  const client = cra.client || cra.clientName || '';
  const clientAddress = cra.clientAddress || '';
  const days = cra.days || {};
  const comment = cra.comment || '';
  const totalDays = cra.totalDays || 0;
  const signatureDataUrl = cra.signatureDataUrl;
  const signature_url = cra.signature_url;
  const signature_text = cra.signature_text || '';
  const month = cra.monthName || (cra.month ? format(new Date(cra.month), 'LLLL', { locale: fr }) : '');
  const year = cra.year || (cra.month ? format(new Date(cra.month), 'yyyy') : '');
  const hideHeader = !!cra.hide_header;
  const hideClientSignature = !!cra.hide_client_signature;

  const handleDownload = () => {
  const printWindow = window.open('', '_blank');
  const logoUrl = new URL(sevenLogo, window.location.origin).href;
  const craHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <base href="${window.location.origin}" />
        <title>CRA - ${consultant} (${month} ${year})</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
          rel="stylesheet">
        <style>
          @page {
            margin: 20mm;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #333;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .container { padding: 30px; }
            .cra-header {
              display: ${hideHeader ? 'none' : 'flex'};
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #ddd;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .cra-header h1 {
              font-size: 26px;
              margin: 0;
              color: #222;
            }
            .cra-header p {
              margin: 3px 0;
              font-size: 13px;
              color: #777;
            }
            .cra-logo img {
              height: 64px;
              width: auto;
              object-fit: contain;
              display: block;
            }
            h2 {
              text-align: center;
              margin: 25px 0 30px 0;
              font-size: 22px;
              text-transform: uppercase;
              color: #444;
              letter-spacing: 0.5px;
            }
            .cra-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
              background-color: #f9f9f9;
              padding: 15px 20px;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
            }
            .cra-info div { display: flex; justify-content: space-between; font-size: 14px; line-height: 1.5; }
            .cra-info div strong { color: #555; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
            thead { display: table-header-group; }
            tfoot { display: table-row-group; }
            tr { page-break-inside: avoid; }
            th, td { border: none; border-bottom: 1px solid #eee; padding: 12px 8px; text-align: center; font-size: 13px; white-space: nowrap; }
            th { background: #f2f7fc; color: #333; font-weight: 600; border-bottom: 1px solid #ddd; }
            tr:last-child td { border-bottom: none; }
            .avoid-break { page-break-inside: avoid; break-inside: avoid; }
            .summary { display: flex; gap: 15px; margin-top: 30px; }
            .summary-item { flex: 1; border: 1px solid #eee; padding: 15px; text-align: center; border-radius: 8px; background-color: #fcfcfc; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03); }
            .summary-item div:first-child { font-size: 22px; font-weight: bold; color: #007bff; margin-bottom: 5px; }
            .summary-item div:last-child { font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.2px; }
            .summary-total { background: #e6f2ff; border-color: #cce0ff; color: #0056b3; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08); }
            .summary-total div:first-child { color: #0056b3; }
            .comments { margin: 30px 0; padding: 15px 20px; border: 1px solid #eee; background: #fdfdfd; font-size: 14px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03); color: #555; }
            .comments strong { color: #333; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 50px; font-size: 14px; color: #555; }
            .signature-block { text-align: left; padding-top: 20px; border-top: 1px dashed #ccc; }
            .signature-text { font-family: 'Great Vibes', cursive; font-size: 28px; color: #222; }
            .signature-block p { margin: 5px 0; color: #777; }
            .signature-block img { width: 200px; height: 70px; object-fit: contain; margin-bottom: 5px; border: none; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #999; padding-top: 15px; border-top: 1px solid #eee; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="cra-header avoid-break">
            <div>
              <h1>Seven Opportunity</h1>
              <p>123 Rue de l'Exemple, 75001 Paris</p>
            </div>
            <div class="cra-logo"><img src="${logoUrl}" alt="Seven Opportunity" /></div>
          </div>

          <h2>Feuille de temps - ${month} ${year}</h2>

          <div class="cra-info avoid-break">
            <div><strong>Consultant :</strong> <span>${consultant || 'N/A'}</span></div>
            <div><strong>Client :</strong> <span>${client || 'N/A'}</span></div>
            <div><strong>Total jours travaillés :</strong> <span>${totalDays}</span></div>
            <div><strong>Adresse client :</strong> <span>${clientAddress || 'N/A'}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Jour</th>
                <th>Détail</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${calendarDays.map(dateStr => {
                const date = new Date(dateStr);
                date.setUTCHours(12);
                const day = days[dateStr];
                let detail = '';
                if (day.status === 'worked_1') detail = 'Journée travaillée';
                else if (day.status === 'worked_0_5') detail = 'Demi-journée';
                else if (day.status === 'off') detail = 'Absence';
                return `
                  <tr>
                    <td>${format(date, 'dd/MM/yyyy')}</td>
                    <td>${format(date, 'EEEE', { locale: fr })}</td>
                    <td>${detail}</td>
                    <td>${day.status === 'worked_1' ? '1' : day.status === 'worked_0_5' ? '0.5' : '0'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="summary avoid-break">
              <div class="summary-item"><div>${totalWorked1}</div><div>Jours travaillés</div></div>
              <div class="summary-item"><div>${totalWorked05}</div><div>Demi-journées</div></div>
              <div class="summary-item"><div>${totalOff}</div><div>Absences</div></div>
              <div class="summary-item summary-total"><div>${totalDays}</div><div>Total jours</div></div>
          </div>

          ${comment ? `<div class="comments avoid-break"><strong>Commentaires :</strong><br/>${comment}</div>` : ''}

          <div class="signatures avoid-break">
            <div class="signature-block">
              <p><strong>Signature Consultant</strong></p>
              ${
                signature_text
                  ? `<div class="signature-text">${signature_text}</div>`
                  : (signatureDataUrl || signature_url
                      ? `<img id="consultantSig" src="${signatureDataUrl || signature_url}" alt="Signature Consultant" />`
                      : `<p>${consultant}</p>`)
              }
            </div>
            ${hideClientSignature ? '' : `
            <div class="signature-block">
              <p><strong>Signature Client</strong></p>
              <div class="signature-text">${client || ''}</div>
            </div>`}
          </div>

          <div class="footer avoid-break">
            <p>Document généré le ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  printWindow.document.write(craHtml);
  printWindow.document.close();

  const tryPrint = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (signatureDataUrl || signature_url) {
    const img = printWindow.document.getElementById('consultantSig');
    if (img) {
      img.onload = tryPrint;
      img.onerror = tryPrint;
      if (img.complete) {
        tryPrint();
      }
    } else {
      setTimeout(tryPrint, 200);
    }
  } else {
    setTimeout(tryPrint, 50);
  }
};


  const holidays = getHolidays(parseInt(year || '0', 10) || new Date().getFullYear());
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
                {!hideHeader && (
                <header className="flex justify-between items-center pb-4 border-b-2 border-gray-800">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Seven Opportunity</h1>
                        <p className="text-gray-600">123 Rue de l'Exemple, 75001 Paris</p>
                    </div>
                    <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                       <img src={sevenLogo} alt="Seven Opportunity" className="max-h-24 w-auto object-contain" />
                    </div>
                </header>
                )}

                <section className="my-8">
                    <h2 className="text-xl font-semibold text-center uppercase mb-4 text-gray-800">Feuille de temps - {month} {year}</h2>
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
                            <p className="font-semibold mb-2">Signature Consultant</p>
                            {signature_text ? (
                              <div className="text-2xl font-[] text-black signature-text">{signature_text}</div>
                            ) : (signatureDataUrl || signature_url) ? (
                              <img
                                crossOrigin="anonymous"
                                src={signatureDataUrl || signature_url}
                                alt="Signature Consultant"
                                style={{ width: 220, height: 80, objectFit: 'contain' }}
                              />
                            ) : (
                              <p>{consultant}</p>
                            )}
                        </div>
                        {!hideClientSignature && (
                        <div>
                            <p className="font-semibold mb-2">Signature Client</p>
                            <div className="text-2xl font-[Style Script] text-black signature-text">{client}</div>
                        </div>
                        )}
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
