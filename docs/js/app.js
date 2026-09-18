import { crearStore, formatearNumero, secuenciaDe, mezclarAjustes } from './store.js';
import { calcularTotales, euros, num, fechaES, hoyISO, esc, normalizar } from './util.js';
import { generarPDF, nombreArchivo } from './pdf.js';
import { leerExcels } from './importar.js';

const store = crearStore();
const $app = document.getElementById('app');
const TIPOS = { presupuesto: 'Presupuesto', factura: 'Factura' };
const ESTADOS = {
  presupuesto: { pendiente: 'Pendiente', aceptado: 'Aceptado', rechazado: 'Rechazado' },
  factura: { pendiente: 'Pendiente de cobro', cobrada: 'Cobrada' },
};

const ICON = {
  presu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  fact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>',
  cli: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/></svg>',
  ajus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
};

/* ================= Utilidades de interfaz ================= */
function toast(msg, ms = 2600) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.remove('oculto');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.add('oculto'), ms);
}

function modal(html, alMontar) {
  const f = document.createElement('div');
  f.className = 'modal-fondo';
  f.innerHTML = `<div class="modal" role="dialog">${html}</div>`;
  const cerrar = () => f.remove();
  f.addEventListener('click', e => { if (e.target === f || e.target.closest('[data-cerrar]')) cerrar(); });
  document.body.appendChild(f);
  alMontar?.(f.querySelector('.modal'), cerrar);
  return cerrar;
}

function confirmar(msg, textoSi = 'Aceptar', peligro = false) {
  return new Promise(res => {
    modal(`<p>${esc(msg)}</p><div class="pie"><button class="btn" data-no>Cancelar</button><button class="btn ${peligro ? 'peligro' : 'primario'}" data-si>${esc(textoSi)}</button></div>`,
      (m, cerrar) => {
        m.querySelector('[data-no]').onclick = () => { cerrar(); res(false); };
        m.querySelector('[data-si]').onclick = () => { cerrar(); res(true); };
      });
  });
}

function descargar(blob, nombre) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

const estadoSync = () => {
  if (store.modo === 'local') return '<span class="sync local" title="Datos solo en este navegador">Modo local</span>';
  return navigator.onLine ? '<span class="sync">Sincronizado</span>' : '<span class="sync off">Sin conexión · se sincronizará</span>';
};

function marco(titulo, contenido, { volver, activo } = {}) {
  const tab = (href, icono, txt, key) => `<a href="${href}" class="${activo === key ? 'activo' : ''}">${icono}<span>${txt}</span></a>`;
  return `
    <header class="topbar">
      ${volver ? `<button class="volver" data-volver aria-label="Volver">‹</button>` : ''}
      <h1>${esc(titulo)}</h1>${estadoSync()}
    </header>
    <main>${contenido}</main>
    <nav class="tabs">
      ${tab('#/presupuestos', ICON.presu, 'Presupuestos', 'presupuesto')}
      ${tab('#/facturas', ICON.fact, 'Facturas', 'factura')}
      ${tab('#/clientes', ICON.cli, 'Clientes', 'clientes')}
      ${tab('#/ajustes', ICON.ajus, 'Ajustes', 'ajustes')}
    </nav>`;
}

/* ================= Router ================= */
let editor = null; // documento en edición
let sucio = false;

function ruta() {
  const h = location.hash.replace(/^#\/?/, '') || 'presupuestos';
  return h.split('/');
}

async function navegar() {
  if (sucio && editor && !(await confirmar('Hay cambios sin guardar. ¿Salir sin guardar?', 'Salir sin guardar', true))) {
    history.replaceState(null, '', '#/doc/' + (editor.id || 'nuevo'));
    return;
  }
  sucio = false; editor = null;
  pintar();
}

function pintar() {
  const [r, a, b] = ruta();
  if (r === 'presupuestos') return vistaLista('presupuesto');
  if (r === 'facturas') return vistaLista('factura');
  if (r === 'clientes') return vistaClientes();
  if (r === 'ajustes') return vistaAjustes();
  if (r === 'nuevo') return vistaEditor(nuevoDocumento(a, b ? { clienteId: b } : {}));
  if (r === 'doc') {
    if (editor && (editor.id === a || a === 'nuevo')) return vistaEditor(editor);
    const d = store.documentos().find(x => x.id === a);
    if (d) return vistaEditor(structuredClone(d));
    if (store.modo === 'nube' && !store._listos?.docs) return; // aún cargando
    location.hash = '#/presupuestos';
    return;
  }
  location.hash = '#/presupuestos';
}

/* ================= Listas ================= */
const filtros = { presupuesto: { q: '', anio: 'todos', estado: 'todos' }, factura: { q: '', anio: 'todos', estado: 'todos' } };

function ordenar(docs) {
  return docs.sort((x, y) => (y.fecha || '').localeCompare(x.fecha || '') || (secuenciaDe(y.numero) ?? 0) - (secuenciaDe(x.numero) ?? 0));
}

function vistaLista(tipo) {
  const f = filtros[tipo];
  const todos = store.documentos().filter(d => d.tipo === tipo);
  const anios = [...new Set(todos.map(d => (d.fecha || '').slice(0, 4)).filter(Boolean))].sort().reverse();
  const plural = tipo === 'factura' ? 'facturas' : 'presupuestos';

  $app.innerHTML = marco(tipo === 'factura' ? 'Facturas' : 'Presupuestos', `
    <div class="buscador">
      <input type="search" id="q" placeholder="Buscar cliente, nº, concepto…" value="${esc(f.q)}">
      <select id="anio"><option value="todos">Todos los años</option>${anios.map(a => `<option ${f.anio === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
      <select id="estado"><option value="todos">Todos</option>${Object.entries(ESTADOS[tipo]).map(([k, v]) => `<option value="${k}" ${f.estado === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
    </div>
    <div class="resumen" id="resumen"></div>
    <div class="lista" id="lista"></div>
    <button class="fab" onclick="location.hash='#/nuevo/${tipo}'">${ICON.mas.replace('<svg', '<svg width="22" height="22"')} Nuevo</button>
  `, { activo: tipo });

  const pintarLista = () => {
    const q = normalizar(f.q);
    const docs = ordenar(todos.filter(d =>
      (f.anio === 'todos' || (d.fecha || '').startsWith(f.anio)) &&
      (f.estado === 'todos' || d.estado === f.estado) &&
      (!q || normalizar([d.numero, d.cliente?.nombre, d.cliente?.localidad, d.cliente?.dni, ...(d.lineas || []).map(l => l.concepto)].join(' ')).includes(q))));
    const tot = docs.reduce((s, d) => { const t = calcularTotales(d); s.base += t.subtotal; s.iva += t.iva; s.total += t.total; return s; }, { base: 0, iva: 0, total: 0 });
    document.getElementById('resumen').innerHTML = docs.length ? `
      <div><small>${docs.length} ${plural}</small><b>${euros(tot.total)}</b></div>
      <div><small>Base imponible</small><b>${euros(tot.base)}</b></div>
      <div><small>IVA</small><b>${euros(tot.iva)}</b></div>` : '';
    document.getElementById('lista').innerHTML = docs.length ? docs.map(d => `
      <a class="item" href="#/doc/${d.id}">
        <div class="principal">
          <div class="titulo">${esc(d.cliente?.nombre || 'Sin cliente')}</div>
          <div class="sub">Nº ${esc(d.numero)} · ${fechaES(d.fecha)}${d.cliente?.localidad ? ' · ' + esc(d.cliente.localidad) : ''}</div>
          <span class="chip ${d.estado}">${ESTADOS[tipo][d.estado] || d.estado}</span>
        </div>
        <div class="importe">${euros(calcularTotales(d).total)}</div>
      </a>`).join('')
      : `<div class="vacio">${todos.length ? 'No hay resultados con estos filtros.' : `Aún no hay ${plural}.<br>Pulsa <b>Nuevo</b> para crear el primero.`}</div>`;
  };
  pintarLista();
  document.getElementById('q').oninput = e => { f.q = e.target.value; pintarLista(); };
  document.getElementById('anio').onchange = e => { f.anio = e.target.value; pintarLista(); };
  document.getElementById('estado').onchange = e => { f.estado = e.target.value; pintarLista(); };
}

/* ================= Editor ================= */
function lineaVacia() { return { cantidad: '', concepto: '', precio: '' }; }

function nuevoDocumento(tipo, { clienteId, desde } = {}) {
  tipo = TIPOS[tipo] ? tipo : 'presupuesto';
  const a = store.ajustes();
  const cli = clienteId ? store.clientes().find(c => c.id === clienteId) : null;
  const base = desde ? structuredClone(desde) : {};
  return {
    tipo,
    numero: formatearNumero(a.numeracion[tipo]),
    fecha: hoyISO(),
    cliente: base.cliente || (cli ? { ...cli } : { nombre: '', dni: '', direccion: '', localidad: '', cp: '', telefono: '', email: '' }),
    lineas: base.lineas?.length ? base.lineas : [lineaVacia(), lineaVacia(), lineaVacia()],
    ivaPct: base.ivaPct ?? a.ivaDefecto,
    observaciones: base.observaciones || '',
    estado: 'pendiente',
    ...(desde?.tipo === 'presupuesto' && tipo === 'factura' ? { presupuestoId: desde.id, presupuestoNumero: desde.numero } : {}),
  };
}

function vistaEditor(doc) {
  editor = doc;
  const esNuevo = !doc.id;
  const c = doc.cliente;
  const clientes = store.clientes();
  const titulo = `${TIPOS[doc.tipo]} ${esNuevo ? 'nuevo' : 'Nº ' + doc.numero}`;

  $app.innerHTML = marco(titulo, `
    ${doc.presupuestoNumero ? `<div class="aviso">Creada a partir del presupuesto Nº ${esc(doc.presupuestoNumero)}.</div>` : ''}
    ${doc.facturaNumero ? `<div class="aviso">Este presupuesto ya se convirtió en la factura Nº ${esc(doc.facturaNumero)}.</div>` : ''}
    <section class="card">
      <div class="rejilla tres">
        <label class="campo">Nº ${TIPOS[doc.tipo].toLowerCase()}<input data-f="numero" value="${esc(doc.numero)}" inputmode="text"></label>
        <label class="campo">Fecha<input type="date" data-f="fecha" value="${esc(doc.fecha)}"></label>
        <label class="campo">Estado<select data-f="estado">${Object.entries(ESTADOS[doc.tipo]).map(([k, v]) => `<option value="${k}" ${doc.estado === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      </div>
    </section>

    <section class="card">
      <h2>Cliente</h2>
      <div class="rejilla dos">
        <label class="campo span2">Nombre<input data-c="nombre" list="lista-clientes" value="${esc(c.nombre)}" autocomplete="off" placeholder="Escribe para buscar un cliente guardado"></label>
        <label class="campo">D.N.I. / C.I.F.<input data-c="dni" value="${esc(c.dni)}"></label>
        <label class="campo">Teléfono<input data-c="telefono" type="tel" value="${esc(c.telefono)}"></label>
        <label class="campo span2">Dirección<input data-c="direccion" value="${esc(c.direccion)}"></label>
        <label class="campo">Localidad<input data-c="localidad" value="${esc(c.localidad)}"></label>
        <label class="campo">C.P.<input data-c="cp" inputmode="numeric" value="${esc(c.cp)}"></label>
        <label class="campo span2">Email<input data-c="email" type="email" value="${esc(c.email)}"></label>
      </div>
      <datalist id="lista-clientes">${clientes.map(x => `<option value="${esc(x.nombre)}">${esc([x.localidad, x.telefono].filter(Boolean).join(' · '))}</option>`).join('')}</datalist>
    </section>

    <section class="card">
      <h2>Conceptos</h2>
      <div class="cab-lineas"><span>Cantidad</span><span>Concepto</span><span style="text-align:right">Precio unit.</span><span style="text-align:right">Total</span><span></span></div>
      <div id="lineas"></div>
      <button class="btn" id="add-linea" style="margin-top:8px">${ICON.mas} Añadir línea</button>
      <div class="totales" id="totales"></div>
    </section>

    <section class="card">
      <h2>Observaciones</h2>
      <textarea data-f="observaciones" rows="3" placeholder="Plazo de entrega, forma de pago, garantía…">${esc(doc.observaciones)}</textarea>
    </section>

    ${esNuevo ? '' : `<button class="btn peligro" id="borrar" style="width:100%">Borrar ${TIPOS[doc.tipo].toLowerCase()}</button>`}

    <div class="acciones">
      <button class="btn primario" id="guardar">Guardar</button>
      <button class="btn verde" id="enviar">${ICON.share} Enviar</button>
      <button class="btn" id="descargar">${ICON.pdf} PDF</button>
      ${doc.tipo === 'presupuesto' ? `<button class="btn" id="convertir">${ICON.fact} Pasar a factura</button>` : ''}
      <button class="btn" id="duplicar">Duplicar</button>
    </div>
  `, { volver: true, activo: doc.tipo });

  const $l = document.getElementById('lineas');
  const pintarLineas = () => {
    $l.innerHTML = doc.lineas.map((l, i) => `
      <div class="linea" data-i="${i}">
        <div class="top">
          <label class="campo c-conc"><span>Concepto</span><textarea data-l="concepto" rows="1" placeholder="Descripción">${esc(l.concepto)}</textarea></label>
          <button class="quitar" data-quitar aria-label="Quitar línea">×</button>
        </div>
        <div class="nums">
          <label class="campo c-cant"><span>Cantidad</span><input data-l="cantidad" inputmode="decimal" value="${esc(String(l.cantidad ?? '').replace('.', ','))}"></label>
          <label class="campo c-precio"><span>Precio unit. (€)</span><input data-l="precio" inputmode="decimal" style="text-align:right" value="${esc(l.precio === '' || l.precio == null ? '' : String(l.precio).replace('.', ','))}"></label>
          <div class="total-linea">${euros(num(l.cantidad) * num(l.precio))}</div>
        </div>
      </div>`).join('');
    $l.querySelectorAll('textarea').forEach(autoAlto);
  };
  const pintarTotales = () => {
    const t = calcularTotales(doc);
    document.getElementById('totales').innerHTML = `
      <div><span>Subtotal</span><b>${euros(t.subtotal)}</b></div>
      <div><span>I.V.A. <input id="iva" inputmode="decimal" value="${String(doc.ivaPct).replace('.', ',')}"> %</span><b>${euros(t.iva)}</b></div>
      <div class="grande"><span>TOTAL</span><span>${euros(t.total)}</span></div>`;
    document.getElementById('iva').oninput = e => { doc.ivaPct = num(e.target.value); sucio = true; actualizarTotalesSolo(); };
  };
  const actualizarTotalesSolo = () => {
    const t = calcularTotales(doc);
    const bs = document.querySelectorAll('#totales b');
    bs[0].textContent = euros(t.subtotal); bs[1].textContent = euros(t.iva);
    document.querySelector('#totales .grande span:last-child').textContent = euros(t.total);
  };
  pintarLineas(); pintarTotales();

  $l.addEventListener('input', e => {
    const fila = e.target.closest('.linea'); if (!fila) return;
    const i = +fila.dataset.i, k = e.target.dataset.l;
    doc.lineas[i][k] = e.target.value; sucio = true;
    if (k === 'concepto') autoAlto(e.target);
    fila.querySelector('.total-linea').textContent = euros(num(doc.lineas[i].cantidad) * num(doc.lineas[i].precio));
    actualizarTotalesSolo();
  });
  $l.addEventListener('click', e => {
    if (!e.target.closest('[data-quitar]')) return;
    const i = +e.target.closest('.linea').dataset.i;
    doc.lineas.splice(i, 1);
    if (!doc.lineas.length) doc.lineas.push(lineaVacia());
    sucio = true; pintarLineas(); actualizarTotalesSolo();
  });
  document.getElementById('add-linea').onclick = () => {
    doc.lineas.push(lineaVacia()); sucio = true; pintarLineas();
    $l.querySelector('.linea:last-child textarea').focus();
  };

  $app.querySelectorAll('[data-f]').forEach(el => el.addEventListener('input', () => { doc[el.dataset.f] = el.value; sucio = true; }));
  $app.querySelectorAll('[data-c]').forEach(el => el.addEventListener('input', () => {
    doc.cliente[el.dataset.c] = el.value; sucio = true;
    if (el.dataset.c === 'nombre') {
      const m = clientes.find(x => x.nombre === el.value);
      if (m) {
        doc.cliente = { ...m };
        $app.querySelectorAll('[data-c]').forEach(i => { i.value = doc.cliente[i.dataset.c] || ''; });
      }
    }
  }));

  document.querySelector('[data-volver]').onclick = () => { location.hash = '#/' + (doc.tipo === 'factura' ? 'facturas' : 'presupuestos'); };
  document.getElementById('guardar').onclick = async () => { if (await guardar()) toast('Guardado ✓'); };
  document.getElementById('enviar').onclick = () => menuEnviar();
  document.getElementById('descargar').onclick = async () => {
    if (!(await guardar())) return;
    const pdf = await generarPDF(editor, store.ajustes());
    descargar(pdf.output('blob'), nombreArchivo(editor));
  };
  document.getElementById('duplicar').onclick = async () => {
    if (sucio && !(await guardar())) return;
    const copia = nuevoDocumento(editor.tipo, { desde: editor });
    sucio = false; editor = copia;
    history.pushState(null, '', '#/doc/nuevo'); vistaEditor(copia); sucio = true;
    toast('Copia creada. Revisa y guarda.');
  };
  document.getElementById('convertir')?.addEventListener('click', convertirEnFactura);
  document.getElementById('borrar')?.addEventListener('click', async () => {
    if (!(await confirmar(`¿Borrar ${TIPOS[doc.tipo].toLowerCase()} Nº ${doc.numero}? No se puede deshacer.`, 'Borrar', true))) return;
    await store.borrarDocumento(doc.id);
    sucio = false; editor = null;
    location.hash = '#/' + (doc.tipo === 'factura' ? 'facturas' : 'presupuestos');
    toast('Borrado');
  });
}

function autoAlto(t) {
  if (CSS.supports('field-sizing', 'content')) return;
  t.style.height = 'auto'; t.style.height = Math.max(44, t.scrollHeight + 2) + 'px';
}
window.addEventListener('resize', () => document.querySelectorAll('.linea textarea').forEach(autoAlto));

async function guardar() {
  const doc = editor;
  if (!String(doc.numero).trim()) { toast('Pon un número'); return false; }
  const dup = store.documentos().find(d => d.tipo === doc.tipo && d.id !== doc.id && String(d.numero).trim() === String(doc.numero).trim());
  if (dup && !(await confirmar(`Ya existe ${doc.tipo === 'factura' ? 'una factura' : 'un presupuesto'} con el Nº ${doc.numero} (${dup.cliente?.nombre || 'sin cliente'}). ¿Guardar igualmente?`, 'Guardar'))) return false;
  const esNuevo = !doc.id;
  // Quita las líneas totalmente vacías del final, pero deja al menos una.
  while (doc.lineas.length > 1 && isVacia(doc.lineas.at(-1))) doc.lineas.pop();
  try {
    const guardado = await store.guardarDocumento(doc, { avanzarContador: esNuevo });
    doc.id = guardado.id;
    await guardarClienteDe(doc);
    sucio = false;
    if (esNuevo) { history.replaceState(null, '', '#/doc/' + doc.id); vistaEditor(doc); }
    return true;
  } catch (e) {
    console.error(e); toast('Error al guardar: ' + e.message, 5000); return false;
  }
}
const isVacia = l => !l.concepto && (l.cantidad === '' || l.cantidad == null) && (l.precio === '' || l.precio == null);

// Guarda o actualiza el cliente en la agenda automáticamente.
async function guardarClienteDe(doc) {
  const c = doc.cliente;
  if (!c?.nombre?.trim()) return;
  const existente = (c.id && store.clientes().find(x => x.id === c.id)) || store.clientes().find(x => normalizar(x.nombre) === normalizar(c.nombre));
  const datos = { nombre: c.nombre.trim(), dni: c.dni || '', direccion: c.direccion || '', localidad: c.localidad || '', cp: c.cp || '', telefono: c.telefono || '', email: c.email || '' };
  if (existente) {
    const combinado = { ...existente };
    Object.entries(datos).forEach(([k, v]) => { if (v) combinado[k] = v; });
    if (JSON.stringify(combinado) !== JSON.stringify(existente)) await store.guardarCliente(combinado);
    doc.cliente.id = existente.id;
  } else {
    const nuevo = await store.guardarCliente(datos);
    doc.cliente.id = nuevo.id;
  }
}

async function convertirEnFactura() {
  if (!(await guardar())) return;
  const p = editor;
  if (p.facturaId && store.documentos().some(d => d.id === p.facturaId)) {
    if (!(await confirmar(`Este presupuesto ya tiene la factura Nº ${p.facturaNumero}. ¿Abrirla?`, 'Abrir factura'))) return;
    location.hash = '#/doc/' + p.facturaId; return;
  }
  const f = nuevoDocumento('factura', { desde: p });
  const g = await store.guardarDocumento(f, { avanzarContador: true });
  await store.guardarDocumento({ ...p, estado: 'aceptado', facturaId: g.id, facturaNumero: f.numero });
  sucio = false; editor = null;
  location.hash = '#/doc/' + g.id;
  toast(`Factura Nº ${f.numero} creada ✓`);
}

/* ================= Enviar ================= */
function textoMensaje(doc) {
  const t = calcularTotales(doc);
  const e = store.ajustes().empresa;
  return `Hola${doc.cliente?.nombre ? ' ' + doc.cliente.nombre.split(' ')[0] : ''}, te envío ${doc.tipo === 'factura' ? 'la factura' : 'el presupuesto'} Nº ${doc.numero} por importe de ${euros(t.total)} (IVA incluido).${e.nombre ? `\n\nUn saludo,\n${e.nombre}${e.telefono ? '\n' + e.telefono : ''}` : ''}`;
}

function telefonoWA(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 9) d = '34' + d;
  return d;
}

async function menuEnviar() {
  if (!(await guardar())) return;
  const doc = editor;
  const pdf = await generarPDF(doc, store.ajustes());
  const blob = pdf.output('blob');
  const nombre = nombreArchivo(doc);
  const file = new File([blob], nombre, { type: 'application/pdf' });
  const puedeCompartir = !!navigator.canShare?.({ files: [file] });
  const tel = telefonoWA(doc.cliente?.telefono);
  const asunto = `${TIPOS[doc.tipo]} Nº ${doc.numero}`;

  modal(`
    <h3>Enviar ${TIPOS[doc.tipo].toLowerCase()} Nº ${esc(doc.numero)}</h3>
    <div class="menu-lista">
      ${puedeCompartir ? `<button class="btn verde" data-a="share">${ICON.share} Compartir PDF (WhatsApp, Gmail…)</button>` : ''}
      <button class="btn" data-a="wa">${ICON.wa} WhatsApp${tel ? ' al ' + esc(doc.cliente.telefono) : ''}</button>
      <button class="btn" data-a="mail">${ICON.mail} Email${doc.cliente?.email ? ' a ' + esc(doc.cliente.email) : ''}</button>
      <button class="btn" data-a="ver">${ICON.pdf} Ver / descargar PDF</button>
    </div>
    <p class="nota">${puedeCompartir
      ? 'Recomendado: <b>Compartir PDF</b> y elige WhatsApp o tu correo; el PDF va adjunto directamente.'
      : 'En el ordenador: se descarga el PDF y se abre WhatsApp o el correo con el mensaje escrito; solo tienes que arrastrar el PDF para adjuntarlo.'}</p>
    <div class="pie"><button class="btn" data-cerrar>Cerrar</button></div>`,
  (m, cerrar) => {
    m.addEventListener('click', async e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (!a) return;
      const marcarEnviado = () => { if (doc.tipo === 'presupuesto' && !doc.enviado) { doc.enviado = new Date().toISOString(); store.guardarDocumento({ ...doc }); } };
      if (a === 'share') {
        try { await navigator.share({ files: [file], title: asunto, text: textoMensaje(doc) }); marcarEnviado(); cerrar(); }
        catch (err) { if (err.name !== 'AbortError') toast('No se pudo compartir: ' + err.message); }
      } else if (a === 'wa') {
        if (puedeCompartir) {
          // En el móvil WhatsApp solo recibe el archivo a través del menú de compartir.
          try { await navigator.share({ files: [file], text: textoMensaje(doc) }); marcarEnviado(); cerrar(); } catch {}
        } else {
          descargar(blob, nombre);
          window.open(`https://wa.me/${tel}?text=${encodeURIComponent(textoMensaje(doc))}`, '_blank');
          marcarEnviado(); cerrar();
        }
      } else if (a === 'mail') {
        if (puedeCompartir && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
          try { await navigator.share({ files: [file], title: asunto, text: textoMensaje(doc) }); marcarEnviado(); cerrar(); } catch {}
        } else {
          descargar(blob, nombre);
          location.href = `mailto:${encodeURIComponent(doc.cliente?.email || '')}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(textoMensaje(doc))}`;
          marcarEnviado(); cerrar();
        }
      } else if (a === 'ver') {
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (!w) descargar(blob, nombre);
        cerrar();
      }
    });
  });
}

/* ================= Clientes ================= */
let filtroCli = '';
function vistaClientes() {
  $app.innerHTML = marco('Clientes', `
    <div class="buscador"><input type="search" id="q" placeholder="Buscar cliente…" value="${esc(filtroCli)}"></div>
    <div class="lista" id="lista"></div>
    <button class="fab" id="nuevo-cli">${ICON.mas.replace('<svg', '<svg width="22" height="22"')} Cliente</button>
  `, { activo: 'clientes' });
  const docs = store.documentos();
  const pintarLista = () => {
    const q = normalizar(filtroCli);
    const cs = store.clientes().filter(c => !q || normalizar([c.nombre, c.localidad, c.telefono, c.dni].join(' ')).includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    document.getElementById('lista').innerHTML = cs.length ? cs.map(c => {
      const n = docs.filter(d => d.cliente?.id === c.id || normalizar(d.cliente?.nombre) === normalizar(c.nombre)).length;
      return `<button class="item" data-id="${c.id}"><div class="principal"><div class="titulo">${esc(c.nombre)}</div>
        <div class="sub">${esc([c.localidad, c.telefono].filter(Boolean).join(' · ') || '—')}</div></div>
        <div class="sub">${n} doc.</div></button>`;
    }).join('') : `<div class="vacio">${store.clientes().length ? 'Sin resultados.' : 'Los clientes se guardan solos al guardar un presupuesto o factura.'}</div>`;
  };
  pintarLista();
  document.getElementById('q').oninput = e => { filtroCli = e.target.value; pintarLista(); };
  document.getElementById('lista').onclick = e => { const b = e.target.closest('[data-id]'); if (b) fichaCliente(store.clientes().find(c => c.id === b.dataset.id)); };
  document.getElementById('nuevo-cli').onclick = () => fichaCliente({ nombre: '', dni: '', direccion: '', localidad: '', cp: '', telefono: '', email: '' });
}

function fichaCliente(c) {
  const docs = c.id ? ordenar(store.documentos().filter(d => d.cliente?.id === c.id || normalizar(d.cliente?.nombre) === normalizar(c.nombre))) : [];
  const campos = [['nombre', 'Nombre'], ['dni', 'D.N.I. / C.I.F.'], ['telefono', 'Teléfono'], ['email', 'Email'], ['direccion', 'Dirección'], ['localidad', 'Localidad'], ['cp', 'C.P.']];
  modal(`
    <h3>${c.id ? esc(c.nombre) : 'Nuevo cliente'}</h3>
    <form class="rejilla dos" id="fcli">
      ${campos.map(([k, t]) => `<label class="campo ${k === 'nombre' || k === 'direccion' ? 'span2' : ''}">${t}<input name="${k}" value="${esc(c[k])}" ${k === 'nombre' ? 'required' : ''}></label>`).join('')}
    </form>
    ${c.id ? `<div class="fila" style="margin-top:12px">
      <a class="btn pequeno" href="#/nuevo/presupuesto/${c.id}" data-cerrar>${ICON.mas} Presupuesto</a>
      <a class="btn pequeno" href="#/nuevo/factura/${c.id}" data-cerrar>${ICON.mas} Factura</a></div>` : ''}
    ${docs.length ? `<h3 style="margin-top:18px;font-size:15px">Historial</h3><div class="lista">${docs.map(d => `
      <a class="item" href="#/doc/${d.id}" data-cerrar><div class="principal"><div class="titulo">${TIPOS[d.tipo]} Nº ${esc(d.numero)}</div>
      <div class="sub">${fechaES(d.fecha)} · ${ESTADOS[d.tipo][d.estado] || ''}</div></div><div class="importe">${euros(calcularTotales(d).total)}</div></a>`).join('')}</div>` : ''}
    <div class="pie">
      ${c.id ? '<button class="btn peligro" data-borrar>Borrar</button>' : ''}
      <button class="btn" data-cerrar>Cancelar</button><button class="btn primario" data-guardar>Guardar</button>
    </div>`,
  (m, cerrar) => {
    m.querySelector('[data-guardar]').onclick = async () => {
      const f = m.querySelector('#fcli');
      if (!f.reportValidity()) return;
      const datos = Object.fromEntries(new FormData(f));
      await store.guardarCliente({ ...c, ...datos });
      cerrar(); toast('Cliente guardado ✓'); vistaClientes();
    };
    m.querySelector('[data-borrar]')?.addEventListener('click', async () => {
      if (!(await confirmar(`¿Borrar a ${c.nombre} de la agenda? Sus presupuestos y facturas no se borran.`, 'Borrar', true))) return;
      await store.borrarCliente(c.id); cerrar(); vistaClientes();
    });
  });
}

/* ================= Ajustes ================= */
function vistaAjustes() {
  const a = store.ajustes();
  const e = a.empresa, b = a.banco, n = a.numeracion;
  const inp = (path, label, val, extra = '') => `<label class="campo ${extra}">${label}<input data-p="${path}" value="${esc(val)}"></label>`;
  const hayConfig = store.modo === 'nube';

  $app.innerHTML = marco('Ajustes', `
    ${!hayConfig ? `<div class="aviso"><b>Modo local:</b> los datos solo se guardan en este navegador. Cuando se configure Firebase se sincronizarán móvil y ordenador.</div>` : ''}
    ${!e.nombre ? `<div class="aviso">Rellena los datos de tu empresa: salen en la cabecera de cada PDF.</div>` : ''}
    <section class="card">
      <h2>Datos de la empresa</h2>
      <div class="rejilla dos">
        ${inp('empresa.nombre', 'Nombre / Razón social', e.nombre, 'span2')}
        ${inp('empresa.nif', 'N.I.F.', e.nif)}
        ${inp('empresa.telefono', 'Teléfono', e.telefono)}
        ${inp('empresa.direccion', 'Dirección', e.direccion, 'span2')}
        ${inp('empresa.localidad', 'C.P. y localidad', e.localidad)}
        ${inp('empresa.email', 'Email', e.email)}
        <label class="campo span2">Actividad (sale bajo el logo)<textarea data-p="empresa.actividad" rows="2">${esc(e.actividad)}</textarea></label>
      </div>
    </section>

    <section class="card">
      <h2>Logo</h2>
      <img class="logo-prev" src="${a.logo || 'img/logo.png'}" alt="Logo">
      <div class="fila">
        <label class="btn pequeno">Cambiar logo<input type="file" accept="image/*" id="logo" class="oculto"></label>
        ${a.logo ? '<button class="btn pequeno" id="logo-reset">Usar el logo original</button>' : ''}
      </div>
    </section>

    <section class="card">
      <h2>Datos bancarios (salen en las facturas)</h2>
      <div class="rejilla dos">
        ${inp('banco.entidad', 'Banco', b.entidad)}
        ${inp('banco.titular', 'Titular', b.titular)}
        ${inp('banco.iban', 'Nº de cuenta (IBAN)', b.iban, 'span2')}
      </div>
    </section>

    <section class="card">
      <h2>Numeración e IVA</h2>
      <div class="rejilla dos">
        ${inp('numeracion.presupuesto.prefijo', 'Prefijo presupuestos (opcional)', n.presupuesto.prefijo)}
        <label class="campo">Siguiente nº de presupuesto<input data-p="numeracion.presupuesto.siguiente" type="number" min="1" value="${n.presupuesto.siguiente}"></label>
        ${inp('numeracion.factura.prefijo', 'Prefijo facturas (opcional)', n.factura.prefijo)}
        <label class="campo">Siguiente nº de factura<input data-p="numeracion.factura.siguiente" type="number" min="1" value="${n.factura.siguiente}"></label>
        <label class="campo">IVA por defecto (%)<input data-p="ivaDefecto" inputmode="decimal" value="${a.ivaDefecto}"></label>
      </div>
      <p class="nota">Ejemplo: con prefijo <b>{AÑO}-</b> y siguiente <b>7</b>, el número será <b>${new Date().getFullYear()}-7</b>. Déjalo vacío para usar solo números. El número también se puede cambiar a mano en cada documento.</p>
    </section>

    <section class="card">
      <h2>Textos al pie del PDF</h2>
      <div class="rejilla">
        <label class="campo">Pie de presupuestos<textarea data-p="piePresupuesto" rows="2">${esc(a.piePresupuesto)}</textarea></label>
        <label class="campo">Pie de facturas<textarea data-p="pieFactura" rows="2">${esc(a.pieFactura)}</textarea></label>
      </div>
    </section>

    <button class="btn primario" id="guardar-aj" style="width:100%;margin-bottom:14px">Guardar ajustes</button>

    <section class="card">
      <h2>Importar documentos antiguos</h2>
      <p class="nota">Selecciona tus Excel antiguos (hechos con la plantilla). Se leen cliente, fecha, número, conceptos e importes. Puedes elegir varios a la vez; si un Excel tiene varias hojas, se importa cada hoja.</p>
      <label class="btn">Elegir archivos Excel<input type="file" id="imp-xls" accept=".xlsx,.xls" multiple class="oculto"></label>
    </section>

    <section class="card">
      <h2>Copias y exportación</h2>
      <div class="fila">
        <button class="btn pequeno" id="exp-xls">Listado de facturas en Excel (para el gestor)</button>
        <button class="btn pequeno" id="backup">Descargar copia de seguridad</button>
        <label class="btn pequeno">Restaurar copia<input type="file" id="restore" accept=".json" class="oculto"></label>
      </div>
    </section>

    ${hayConfig ? `<section class="card"><h2>Cuenta</h2><p class="nota">Sesión iniciada como <b>${esc(store.user?.email)}</b></p><button class="btn" id="salir">Cerrar sesión</button></section>` : ''}
  `, { activo: 'ajustes' });

  const trabajo = mezclarAjustes(a);
  const set = (path, v) => { const ks = path.split('.'); let o = trabajo; ks.slice(0, -1).forEach(k => o = o[k]); o[ks.at(-1)] = v; };
  $app.querySelectorAll('[data-p]').forEach(el => el.addEventListener('input', () => {
    const p = el.dataset.p;
    set(p, p.endsWith('siguiente') ? Math.max(1, parseInt(el.value, 10) || 1) : p === 'ivaDefecto' ? num(el.value) : el.value);
  }));
  document.getElementById('guardar-aj').onclick = async () => { await store.guardarAjustes(trabajo); toast('Ajustes guardados ✓'); };

  document.getElementById('logo').onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return;
    trabajo.logo = await reducirImagen(f, 800);
    await store.guardarAjustes(trabajo); toast('Logo actualizado ✓'); vistaAjustes();
  };
  document.getElementById('logo-reset')?.addEventListener('click', async () => { trabajo.logo = null; await store.guardarAjustes(trabajo); vistaAjustes(); });

  document.getElementById('imp-xls').onchange = async ev => { const fs = [...ev.target.files]; ev.target.value = ''; if (fs.length) importarExcels(fs); };
  document.getElementById('exp-xls').onclick = exportarExcel;
  document.getElementById('backup').onclick = () => {
    const data = { version: 1, fecha: new Date().toISOString(), ajustes: store.ajustes(), clientes: store.clientes(), documentos: store.documentos() };
    descargar(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), `copia-facturas-${hoyISO()}.json`);
  };
  document.getElementById('restore').onchange = async ev => {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const ids = new Set(store.documentos().map(d => d.id));
      const idsC = new Set(store.clientes().map(c => c.id));
      const nuevos = (data.documentos || []).filter(d => !ids.has(d.id));
      const nuevosC = (data.clientes || []).filter(c => !idsC.has(c.id));
      if (!(await confirmar(`La copia tiene ${data.documentos?.length || 0} documentos. Se añadirán ${nuevos.length} que no están ahora y ${nuevosC.length} clientes. No se borra nada.`, 'Restaurar'))) return;
      await store.importarLote(nuevos, nuevosC);
      toast('Copia restaurada ✓');
    } catch (e) { toast('Archivo no válido: ' + e.message, 5000); }
  };
  document.getElementById('salir')?.addEventListener('click', async () => { await store.logout(); });
}

async function reducirImagen(file, max) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

async function importarExcels(files) {
  toast('Leyendo archivos…');
  const res = await leerExcels(files);
  const errores = res.filter(r => r.error);
  const docs = res.filter(r => !r.error);
  const existentes = new Set(store.documentos().map(d => d.tipo + '|' + String(d.numero).trim()));
  docs.forEach(d => { d._dup = existentes.has(d.tipo + '|' + d.numero.trim()); });

  modal(`
    <h3>Importar ${docs.length} documento${docs.length === 1 ? '' : 's'}</h3>
    ${errores.map(e => `<p class="error">${esc(e.error)}</p>`).join('')}
    ${docs.length ? `<p class="nota">Revisa los datos. Los marcados en naranja ya existen con ese número y vienen desmarcados.</p>
    <div style="overflow-x:auto"><table class="imp"><thead><tr><th></th><th>Tipo</th><th>Nº</th><th>Fecha</th><th>Cliente</th><th class="n">Total</th></tr></thead><tbody>
    ${docs.map((d, i) => {
      const t = calcularTotales(d).total;
      const difiere = d._totalExcel && Math.abs(d._totalExcel - t) > 0.05;
      return `<tr style="${d._dup ? 'background:var(--ambar-claro)' : ''}" title="${esc(d._origen)}">
        <td><input type="checkbox" data-i="${i}" ${d._dup ? '' : 'checked'} style="width:20px;min-height:20px"></td>
        <td><select data-tipo="${i}" style="min-height:32px;padding:2px 6px;width:auto"><option value="presupuesto" ${d.tipo === 'presupuesto' ? 'selected' : ''}>Presup.</option><option value="factura" ${d.tipo === 'factura' ? 'selected' : ''}>Factura</option></select></td>
        <td>${esc(d.numero)}</td><td>${fechaES(d.fecha)}</td><td>${esc(d.cliente.nombre || '—')}<div class="nota">${esc(d._origen)}</div></td>
        <td class="n">${euros(t)}${difiere ? `<div class="error" title="Total en el Excel">Excel: ${euros(d._totalExcel)}</div>` : ''}</td></tr>`;
    }).join('')}</tbody></table></div>` : '<p>No se encontraron documentos en los archivos.</p>'}
    <div class="pie"><button class="btn" data-cerrar>Cancelar</button>${docs.length ? '<button class="btn primario" data-ok>Importar seleccionados</button>' : ''}</div>`,
  (m, cerrar) => {
    m.querySelectorAll('[data-tipo]').forEach(s => s.onchange = () => {
      const d = docs[+s.dataset.tipo]; d.tipo = s.value; d.estado = s.value === 'factura' ? 'cobrada' : 'aceptado';
    });
    m.querySelector('[data-ok]')?.addEventListener('click', async () => {
      const sel = [...m.querySelectorAll('[data-i]:checked')].map(c => docs[+c.dataset.i]);
      if (!sel.length) return toast('No hay nada seleccionado');
      // Clientes nuevos a la agenda
      const agenda = new Map(store.clientes().map(c => [normalizar(c.nombre), c]));
      const nuevosCli = [];
      sel.forEach(d => {
        const k = normalizar(d.cliente.nombre); if (!k) return;
        if (!agenda.has(k)) { const c = { ...d.cliente, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }; agenda.set(k, c); nuevosCli.push(c); }
        d.cliente.id = agenda.get(k).id;
      });
      const limpios = sel.map(d => { const x = { ...d }; delete x._dup; delete x._origen; delete x._totalExcel; return x; });
      try {
        await store.importarLote(limpios, nuevosCli);
        // Avanza los contadores para no repetir números.
        const a = store.ajustes();
        ['presupuesto', 'factura'].forEach(t => {
          const max = Math.max(0, ...store.documentos().filter(d => d.tipo === t && !String(d.numero).includes('-')).map(d => secuenciaDe(d.numero) ?? 0), ...limpios.filter(d => d.tipo === t).map(d => secuenciaDe(d.numero) ?? 0));
          if (max >= a.numeracion[t].siguiente && !a.numeracion[t].prefijo) a.numeracion[t].siguiente = max + 1;
        });
        await store.guardarAjustes(a);
        cerrar(); toast(`${limpios.length} documentos importados ✓`, 4000); vistaAjustes();
      } catch (e) { toast('Error al importar: ' + e.message, 5000); }
    });
  });
}

function exportarExcel() {
  const docs = ordenar(store.documentos().filter(d => d.tipo === 'factura')).reverse();
  if (!docs.length) return toast('No hay facturas');
  const filas = docs.map(d => {
    const t = calcularTotales(d);
    const tri = d.fecha ? `${d.fecha.slice(0, 4)}-T${Math.ceil(+d.fecha.slice(5, 7) / 3)}` : '';
    return { 'Nº': d.numero, Fecha: fechaES(d.fecha), Trimestre: tri, Cliente: d.cliente?.nombre || '', 'DNI/CIF': d.cliente?.dni || '',
      'Base imponible': t.subtotal, 'IVA %': t.ivaPct, 'Cuota IVA': t.iva, Total: t.total, Estado: ESTADOS.factura[d.estado] || d.estado };
  });
  const ws = window.XLSX.utils.json_to_sheet(filas);
  ws['!cols'] = [8, 11, 10, 34, 12, 14, 7, 12, 12, 16].map(w => ({ wch: w }));
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, 'Facturas');
  window.XLSX.writeFile(wb, `facturas-${hoyISO()}.xlsx`);
}

/* ================= Login y arranque ================= */
function vistaLogin(error = '') {
  $app.innerHTML = `
    <div class="login"><div class="card">
      <img src="img/logo.png" alt="">
      <form id="flogin">
        <label class="campo">Email<input name="email" type="email" autocomplete="username" required></label>
        <label class="campo">Contraseña<input name="pass" type="password" autocomplete="current-password" required></label>
        ${error ? `<div class="error">${esc(error)}</div>` : ''}
        <button class="btn primario">Entrar</button>
      </form>
    </div></div>`;
  document.getElementById('flogin').onsubmit = async ev => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    ev.target.querySelector('button').disabled = true;
    try { await store.login(f.get('email').trim(), f.get('pass')); }
    catch (e) { vistaLogin(/invalid|wrong|not-found|credential/i.test(e.code || '') ? 'Email o contraseña incorrectos.' : 'No se pudo entrar: ' + (e.code || e.message)); }
  };
}

async function arrancar() {
  try { await store.init(); }
  catch (e) { $app.innerHTML = `<div class="login"><div class="card"><p class="error">No se pudo conectar: ${esc(e.message)}</p><button class="btn" onclick="location.reload()">Reintentar</button></div></div>`; return; }

  let dentro = false;
  store.onAuth(user => {
    if (!user) { dentro = false; vistaLogin(); return; }
    if (!dentro) { dentro = true; pintar(); }
  });
  // Refresca listas cuando llegan cambios desde el otro dispositivo (no el editor, para no perder lo escrito).
  store.subscribe(() => {
    if (!dentro) return;
    const [r] = ruta();
    if (r === 'doc' && !editor) pintar();
    else if (r !== 'doc' && r !== 'nuevo' && !document.querySelector('.modal-fondo') && !document.activeElement?.matches('input,textarea,select')) pintar();
  });
  window.addEventListener('hashchange', navegar);
  window.addEventListener('online', pintarSync);
  window.addEventListener('offline', pintarSync);
  window.addEventListener('beforeunload', e => { if (sucio) { e.preventDefault(); e.returnValue = ''; } });
}
function pintarSync() { const s = document.querySelector('.sync'); if (s) s.outerHTML = estadoSync(); }

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
arrancar();
