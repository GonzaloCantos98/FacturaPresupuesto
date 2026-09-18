// Importa facturas/presupuestos antiguos hechos con la plantilla Excel.
// Estructura de la plantilla: fila 8 fecha y nº; filas 9-11 cliente; filas 14-42 líneas
// (B cantidad, C-F concepto, G precio, H total); fila 43+ observaciones y totales.
import { num, hoyISO } from './util.js';

const COLS = 'ABCDEFGHI';
const TEXTOS_PLANTILLA = /unicaja|n.?\s*de\s*cuenta|^\s*dni\s*[-:]|ramon\s+garcia/i;

function valor(ws, ref) {
  const c = ws[ref];
  if (!c) return '';
  if (c.t === 'd') return c.v;
  return c.v ?? '';
}
const texto = v => (v instanceof Date ? '' : String(v ?? '').trim());
const despuesDe = s => { const i = s.indexOf(':'); return i >= 0 ? s.slice(i + 1).trim() : ''; };

// Valor de un campo con etiqueta: lo que haya tras ":" en la celda de la etiqueta
// o, si no, las celdas siguientes de la misma fila hasta la columna límite.
function campo(ws, fila, colEtiqueta, colFin) {
  const et = texto(valor(ws, colEtiqueta + fila));
  const partes = [despuesDe(et)];
  for (let i = COLS.indexOf(colEtiqueta) + 1; i <= COLS.indexOf(colFin); i++) {
    const v = valor(ws, COLS[i] + fila);
    partes.push(v instanceof Date ? '' : texto(v));
  }
  return partes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

const aISO = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function fecha(ws) {
  for (const col of COLS) {
    const v = valor(ws, col + 8);
    if (v instanceof Date) return aISO(v);
  }
  const s = texto(valor(ws, 'C8')) + ' ' + texto(valor(ws, 'D8')) + ' ' + texto(valor(ws, 'E8'));
  const m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return null;
}

function leerHoja(ws, nombreArchivo, nombreHoja) {
  const cab = ['F8', 'E8', 'G8'].map(r => texto(valor(ws, r))).join(' ');
  let tipo = /factura/i.test(cab) ? 'factura' : /presupuesto/i.test(cab) ? 'presupuesto' : null;
  if (!tipo) tipo = /factura/i.test(nombreArchivo) ? 'factura' : 'presupuesto';

  // Número: tras "Nº" en la etiqueta, o en las celdas G8/H8/I8.
  let numero = (texto(valor(ws, 'F8')).match(/N[º°o�]?\.?\s*[:\-]?\s*([\w\-\/]+)\s*$/i) || [])[1] || '';
  if (!numero || /^(factura|presupuesto)$/i.test(numero)) {
    numero = ['G8', 'H8', 'I8'].map(r => valor(ws, r)).filter(v => v !== '' && !(v instanceof Date)).map(texto)[0] || '';
  }
  if (!numero) numero = (nombreArchivo.replace(/\.xlsx?$/i, '').match(/(\d[\d\-\/]*)/) || [])[1] || '';

  const cliente = {
    nombre: campo(ws, 9, 'B', 'F'), dni: campo(ws, 9, 'G', 'I'),
    direccion: campo(ws, 10, 'B', 'F'), telefono: campo(ws, 10, 'G', 'I'),
    localidad: campo(ws, 11, 'B', 'F'), cp: campo(ws, 11, 'G', 'I'),
  };

  const lineas = [];
  for (let f = 14; f <= 42; f++) {
    const cant = valor(ws, 'B' + f), precio = valor(ws, 'G' + f);
    const concepto = ['C', 'D', 'E', 'F'].map(c => texto(valor(ws, c + f))).filter(Boolean).join(' ').trim();
    const tieneNum = cant !== '' || precio !== '';
    if (!tieneNum && (!concepto || TEXTOS_PLANTILLA.test(concepto))) continue;
    lineas.push({ cantidad: cant === '' ? '' : num(cant), concepto, precio: precio === '' ? '' : num(precio) });
  }

  const obs = [despuesDe(texto(valor(ws, 'B43')))];
  for (let f = 43; f <= 50; f++) for (const c of (f === 43 ? 'CDEF' : 'BCDEF')) obs.push(texto(valor(ws, c + f)));
  const observaciones = obs.filter(Boolean).join('\n');

  // IVA a partir de los valores calculados en el Excel (por si alguno no era del 21%).
  const sub = num(valor(ws, 'H43')), iva = num(valor(ws, 'H44'));
  const ivaPct = sub > 0 && iva >= 0 ? Math.round(iva / sub * 1000) / 10 : 21;
  const totalExcel = num(valor(ws, 'H45'));

  if (!cliente.nombre && !lineas.length) return null; // hoja en blanco
  return {
    tipo, numero: String(numero), fecha: fecha(ws) || hoyISO(), cliente, lineas, ivaPct, observaciones,
    estado: tipo === 'factura' ? 'cobrada' : 'aceptado',
    importado: true, _origen: `${nombreArchivo}${nombreHoja ? ' › ' + nombreHoja : ''}`, _totalExcel: totalExcel,
  };
}

export async function leerExcels(files) {
  const res = [];
  for (const f of files) {
    try {
      const wb = window.XLSX.read(await f.arrayBuffer(), { type: 'array', cellDates: true });
      for (const n of wb.SheetNames) {
        const d = leerHoja(wb.Sheets[n], f.name, wb.SheetNames.length > 1 ? n : '');
        if (d) res.push(d);
      }
    } catch (e) {
      res.push({ error: `${f.name}: no se pudo leer (${e.message})` });
    }
  }
  return res;
}
