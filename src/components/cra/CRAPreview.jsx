
import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getHolidays } from '@/lib/holidays';

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
  const month = cra.monthName || (cra.month ? format(new Date(cra.month), 'LLLL', { locale: fr }) : '');
  const year = cra.year || (cra.month ? format(new Date(cra.month), 'yyyy') : '');

  const handleDownload = () => {
  const printWindow = window.open('', '_blank');
  const craHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>CRA - ${consultant} (${month} ${year})</title>
        <style>
          @media print {
            body {
              margin: 0;
              padding: 30px; /* Increased padding for more white space */
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* A bit softer font */
              color: #333; /* Slightly softer main text color */
              -webkit-font-smoothing: antialiased; /* Font smoothing for better rendering */
              -moz-osx-font-smoothing: grayscale; /* Font smoothing for better rendering */
            }
            .cra-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #ddd; /* Lighter, thinner border */
              padding-bottom: 15px; /* More padding */
              margin-bottom: 30px; /* More margin */
            }
            .cra-header h1 {
              font-size: 26px; /* Slightly larger */
              margin: 0;
              color: #222;
            }
            .cra-header p {
              margin: 3px 0;
              font-size: 13px;
              color: #777; /* Softer address color */
            }
            .cra-logo {
              font-size: 52px; /* Larger logo */
              font-weight: bold;
              color: #007bff; /* Example accent color, adjust as needed */
              background-color: #e6f2ff; /* Light background for the logo */
              padding: 5px 15px;
              border-radius: 8px; /* Rounded corners for the logo box */
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); /* Subtle shadow */
            }
            h2 {
              text-align: center;
              margin: 25px 0 30px 0; /* More vertical spacing */
              font-size: 22px;
              text-transform: uppercase;
              color: #444;
              letter-spacing: 0.5px; /* Slightly spaced letters */
            }
            .cra-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px; /* Increased gap */
              margin-bottom: 30px;
              background-color: #f9f9f9; /* Light background for info section */
              padding: 15px 20px;
              border-radius: 8px; /* Rounded corners */
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03); /* Very subtle shadow */
            }
            .cra-info div {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              line-height: 1.5;
            }
            .cra-info div strong {
                color: #555;
            }
            table {
              width: 100%;
              border-collapse: separate; /* Use separate to allow border-radius on cells */
              border-spacing: 0; /* No space between cell borders */
              margin-bottom: 30px;
              border: 1px solid #eee; /* Light border for the whole table */
              border-radius: 8px; /* Rounded corners for the table */
              overflow: hidden; /* Ensures rounded corners are visible */
            }
            th, td {
              border: none; /* Remove individual cell borders to use table border */
              border-bottom: 1px solid #eee; /* Light separator between rows */
              padding: 12px 8px; /* More padding */
              text-align: center;
              font-size: 13px;
              white-space: nowrap;
            }
            th {
              background: #f2f7fc; /* Lighter, subtle blue background for header */
              color: #333;
              font-weight: 600; /* Slightly bolder */
              border-bottom: 1px solid #ddd; /* Slightly darker separator below header */
            }
            tr:last-child td {
              border-bottom: none; /* No border for the last row */
            }
            .summary {
              display: flex;
              gap: 15px; /* Increased gap */
              margin-top: 30px;
            }
            .summary-item {
              flex: 1;
              border: 1px solid #eee; /* Lighter border */
              padding: 15px; /* More padding */
              text-align: center;
              border-radius: 8px; /* Rounded corners */
              background-color: #fcfcfc; /* Light background */
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03); /* Subtle shadow */
            }
            .summary-item div:first-child {
                font-size: 22px;
                font-weight: bold;
                color: #007bff; /* Accent color for numbers */
                margin-bottom: 5px;
            }
            .summary-item div:last-child {
                font-size: 12px;
                color: #777;
                text-transform: uppercase;
                letter-spacing: 0.2px;
            }
            .summary-total {
              background: #e6f2ff; /* Distinct background for total */
              border-color: #cce0ff;
              color: #0056b3;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
            }
            .summary-total div:first-child {
                color: #0056b3;
            }
            .comments {
              margin: 30px 0;
              padding: 15px 20px;
              border: 1px solid #eee; /* Lighter border */
              background: #fdfdfd; /* Very light background */
              font-size: 14px;
              border-radius: 8px; /* Rounded corners */
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
              color: #555;
            }
            .comments strong {
                color: #333;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 60px; /* Increased gap */
              margin-top: 50px;
              font-size: 14px;
              color: #555;
            }
            .signature-block {
              text-align: left;
              padding-top: 20px;
              border-top: 1px dashed #ccc; /* Dashed line for signature area */
            }
            .signature-block p {
                margin: 5px 0;
                color: #777;
            }
            .signature-block img {
              width: 200px; /* Slightly adjusted size */
              height: 70px; /* Slightly adjusted size */
              object-fit: contain;
              margin-bottom: 5px;
              border: none; /* Remove border from image itself */
            }
            .footer {
              margin-top: 60px; /* More margin */
              text-align: center;
              font-size: 11px;
              color: #999; /* Even softer footer text */
              padding-top: 15px;
              border-top: 1px solid #eee; /* Light separator */
            }
          }
        </style>
      </head>
      <body>
        <div class="cra-header">
          <div>
            <h1>Seven Opportunity</h1>
            <p>123 Rue de l'Exemple, 75001 Paris</p>
          </div>
          <div class="cra-logo">7</div>
        </div>

        <h2>Feuille de temps - ${month} ${year}</h2>

        <div class="cra-info">
          <div><strong>Consultant :</strong> <span>${consultant}</span></div>
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

        <div class="summary">
            <div class="summary-item"><div>${totalWorked1}</div><div>Jours travaillés</div></div>
            <div class="summary-item"><div>${totalWorked05}</div><div>Demi-journées</div></div>
            <div class="summary-item"><div>${totalOff}</div><div>Absences</div></div>
            <div class="summary-item summary-total"><div>${totalDays}</div><div>Total jours</div></div>
        </div>

        ${comment ? `<div class="comments"><strong>Commentaires :</strong><br/>${comment}</div>` : ''}

        <div class="signatures">
          <div class="signature-block">
            <p><strong>Signature Consultant</strong></p>
            ${(signatureDataUrl || signature_url) 
              ? `<img id="consultantSig" src="${signatureDataUrl || signature_url}" alt="Signature Consultant" />`
              : `<p>${consultant}</p>`}
          </div>
          <div class="signature-block">
            <p><strong>Signature Client</strong></p>
            <p>Cachet et signature</p>
          </div>
        </div>

        <div class="footer">
          <p>Document généré le ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;
  printWindow.document.write(craHtml);
  printWindow.document.close();

  // Wait for consultant signature to load if it exists
  const tryPrint = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (signatureDataUrl || signature_url) {
    const img = printWindow.document.getElementById('consultantSig');
    if (img) {
      // Both onload and onerror will trigger the print, ensuring it happens
      // even if the image fails to load.
      img.onload = tryPrint;
      img.onerror = tryPrint;
      // In case the image is already cached and onload doesn't fire
      if (img.complete) {
        tryPrint();
      }
    } else {
      setTimeout(tryPrint, 500); // Failsafe timeout
    }
  } else {
    // If there's no signature, print immediately
    tryPrint();
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
                            {(signatureDataUrl || signature_url) ? (
                              <img crossOrigin="anonymous" src={signatureDataUrl || signature_url} alt="Signature Consultant" style={{ width: 220, height: 80, objectFit: 'contain' }} />
                            ) : (
                              <p>{consultant}</p>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold mb-2">Signature Client</p>
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
