// Genera el PDF de un presupuesto o factura con la estructura de la plantilla Excel original.
import { calcularTotales, euros, num, fechaES } from './util.js';

let logoDefecto = null;
async function cargarImagen(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  return { data: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight };
}

const AZUL = [23, 43, 128];
const GRIS = [110, 110, 110];
const FONDO = [236, 240, 250];

export async function generarPDF(doc, ajustes) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 15;
  const e = ajustes.empresa, t = calcularTotales(doc);
  const esFactura = doc.tipo === 'factura';

  // --- Cabecera: datos de la empresa (izquierda) y logo (derecha)
  const logo = ajustes.logo ? await cargarImagen(ajustes.logo) : (logoDefecto ||= await cargarImagen('img/logo.png'));
  const lw = 70, lh = Math.min(32, lw * logo.h / logo.w);
  pdf.addImage(logo.data, 'PNG', W - M - lh * logo.w / logo.h, M - 3, lh * logo.w / logo.h, lh);

  let y = M + 2;
  pdf.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...AZUL);
  pdf.text(e.nombre || '', M, y);
  pdf.setFont('helvetica', 'normal').setFontSize(9).setTextColor(40);
  [e.direccion, e.localidad, e.nif && `N.I.F.: ${e.nif}`, e.telefono && `Móvil: ${e.telefono}`, e.email && `Email: ${e.email}`]
    .filter(Boolean).forEach(l => { y += 4.6; pdf.text(l, M, y); });

  if (e.actividad) {
    pdf.setFont('helvetica', 'italic').setFontSize(8.5).setTextColor(...GRIS);
    const lines = pdf.splitTextToSize(e.actividad, 80);
    pdf.text(lines, W - M, M + lh + 2, { align: 'right' });
  }

  // --- Título, número y fecha
  y = Math.max(y, M + lh + 10) + 6;
  pdf.setFillColor(...AZUL).rect(M, y, W - 2 * M, 10, 'F');
  pdf.setFont('helvetica', 'bold').setFontSize(13).setTextColor(255);
  pdf.text(`${esFactura ? 'FACTURA' : 'PRESUPUESTO'}  Nº ${doc.numero || ''}`, M + 4, y + 6.8);
  pdf.setFontSize(10.5).text(`FECHA: ${fechaES(doc.fecha)}`, W - M - 4, y + 6.8, { align: 'right' });

  // --- Datos del cliente
  y += 14;
  const c = doc.cliente || {};
  pdf.setDrawColor(190).setFillColor(...FONDO).roundedRect(M, y, W - 2 * M, 22, 1.5, 1.5, 'FD');
  const campo = (et, val, x, yy, maxW) => {
    pdf.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...AZUL).text(et, x, yy);
    const ew = pdf.getTextWidth(et) + 2;
    pdf.setFont('helvetica', 'normal').setTextColor(20);
    pdf.text(pdf.splitTextToSize(String(val || ''), maxW - ew)[0] || '', x + ew, yy);
  };
  const col2 = M + 125;
  campo('Cliente:', c.nombre, M + 4, y + 6, 118);
  campo('D.N.I.:', c.dni, col2, y + 6, 52);
  campo('Dirección:', c.direccion, M + 4, y + 12.5, 118);
  campo('Tlf.:', c.telefono, col2, y + 12.5, 52);
  campo('Localidad:', c.localidad, M + 4, y + 19, 118);
  campo('C.P.:', c.cp, col2, y + 19, 52);

  // --- Líneas
  y += 27;
  const lineas = (doc.lineas || []).filter(l => l.concepto || num(l.cantidad) || num(l.precio));
  pdf.autoTable({
    startY: y,
    margin: { left: M, right: M, bottom: 20 },
    head: [['Cantidad', 'Concepto', 'Precio Unit.', 'Total']],
    body: lineas.map(l => [
      l.cantidad === '' || l.cantidad == null ? '' : String(l.cantidad).replace('.', ','),
      l.concepto || '',
      l.precio === '' || l.precio == null ? '' : euros(num(l.precio)),
      (l.cantidad === '' && l.precio === '') ? '' : euros(num(l.cantidad) * num(l.precio)),
    ]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 2.2, lineColor: [200, 200, 200], textColor: 20, valign: 'top' },
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [248, 249, 253] },
  });
  y = pdf.lastAutoTable.finalY + 6;

  // --- Observaciones + totales (misma altura, salto de página si no caben)
  const obs = pdf.splitTextToSize(doc.observaciones || '', 100);
  const bancoLineas = esFactura && (ajustes.banco.iban || ajustes.banco.entidad)
    ? [ajustes.banco.entidad, ajustes.banco.iban && `Nº de cuenta: ${ajustes.banco.iban}`, ajustes.banco.titular].filter(Boolean) : [];
  const alto = Math.max(28, 10 + obs.length * 4.2) + (bancoLineas.length ? 8 + bancoLineas.length * 4.6 : 0);
  if (y + alto > 297 - 20) { pdf.addPage(); y = M + 5; }

  const tx = W - M - 62;
  pdf.setDrawColor(190).setFillColor(255).rect(M, y, 105, Math.max(28, 10 + obs.length * 4.2));
  pdf.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...AZUL).text('OBSERVACIONES:', M + 3, y + 5.5);
  pdf.setFont('helvetica', 'normal').setTextColor(30).text(obs, M + 3, y + 11);

  const filaTot = (et, val, yy, fuerte) => {
    if (fuerte) { pdf.setFillColor(...AZUL).rect(tx, yy - 5.5, 62, 8.5, 'F'); pdf.setTextColor(255); }
    else { pdf.setFillColor(...FONDO).rect(tx, yy - 5.5, 62, 8.5, 'F'); pdf.setTextColor(20); }
    pdf.setFont('helvetica', fuerte ? 'bold' : 'normal').setFontSize(fuerte ? 11 : 10);
    pdf.text(et, tx + 3, yy); pdf.text(val, W - M - 3, yy, { align: 'right' });
  };
  filaTot('Subtotal', euros(t.subtotal), y + 5.5);
  filaTot(`I.V.A. ${String(t.ivaPct).replace('.', ',')}%`, euros(t.iva), y + 15);
  filaTot('TOTAL', euros(t.total), y + 24.5, true);

  // --- Datos bancarios (solo facturas)
  if (bancoLineas.length) {
    let by = y + Math.max(28, 10 + obs.length * 4.2) + 7;
    pdf.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...AZUL).text('FORMA DE PAGO: TRANSFERENCIA BANCARIA', M, by);
    pdf.setFont('helvetica', 'normal').setTextColor(30);
    bancoLineas.forEach(l => { by += 4.6; pdf.text(l, M, by); });
  }

  // --- Pie y numeración de páginas
  const pie = esFactura ? ajustes.pieFactura : ajustes.piePresupuesto;
  const n = pdf.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'italic').setFontSize(8).setTextColor(...GRIS);
    if (pie) pdf.text(pdf.splitTextToSize(pie, W - 2 * M - 20), M, 297 - 10);
    if (n > 1) pdf.text(`Página ${i} de ${n}`, W - M, 297 - 10, { align: 'right' });
  }
  return pdf;
}

export function nombreArchivo(doc) {
  const tipo = doc.tipo === 'factura' ? 'Factura' : 'Presupuesto';
  const cli = (doc.cliente?.nombre || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '');
  return `${tipo}_${String(doc.numero || '').replace(/[^\w-]+/g, '-')}${cli ? '_' + cli : ''}.pdf`;
}
