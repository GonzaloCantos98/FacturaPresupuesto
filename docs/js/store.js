// Capa de datos. Dos implementaciones con la misma interfaz:
//  - FirebaseStore: datos en la nube (Firestore), sincronizados entre móvil y ordenador.
//  - LocalStore: datos en este navegador (modo demo / sin configurar).
import { firebaseConfig } from './config.js';

export const AJUSTES_DEFECTO = {
  empresa: {
    nombre: '', nif: '', direccion: '', localidad: '', telefono: '', email: '',
    actividad: 'Aluminio, Mampara, Persianas, Mosquiteras, Venecianas, Cortinas Verticales y cristalería en general',
  },
  banco: { entidad: '', iban: '', titular: '' },
  logo: null, // dataURL; si es null se usa img/logo.png
  ivaDefecto: 21,
  numeracion: {
    presupuesto: { prefijo: '', siguiente: 1 },
    factura: { prefijo: '', siguiente: 1 },
  },
  pieFactura: '',
  piePresupuesto: 'Presupuesto válido durante 30 días.',
};

export function mezclarAjustes(a) {
  const d = structuredClone(AJUSTES_DEFECTO);
  if (!a) return d;
  return {
    ...d, ...a,
    empresa: { ...d.empresa, ...(a.empresa || {}) },
    banco: { ...d.banco, ...(a.banco || {}) },
    numeracion: {
      presupuesto: { ...d.numeracion.presupuesto, ...(a.numeracion?.presupuesto || {}) },
      factura: { ...d.numeracion.factura, ...(a.numeracion?.factura || {}) },
    },
  };
}

export function formatearNumero(cfg) {
  const p = (cfg.prefijo || '').replace('{AÑO}', String(new Date().getFullYear()));
  return p + cfg.siguiente;
}

// Si el número escrito termina en cifras, devuelve ese valor (para avanzar el contador).
export function secuenciaDe(numero) {
  const m = String(numero || '').match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ------------------------------------------------------------------ */
class LocalStore {
  constructor() { this.modo = 'local'; this.listeners = []; }
  _get(k, def) { try { return JSON.parse(localStorage.getItem('fp_' + k)) ?? def; } catch { return def; } }
  _set(k, v) { localStorage.setItem('fp_' + k, JSON.stringify(v)); this._emit(); }
  _emit() { this.listeners.forEach(fn => fn()); }
  async init() { return true; }
  onAuth(cb) { cb({ email: 'modo local' }); }
  async login() {} async logout() {}
  subscribe(cb) { this.listeners.push(cb); cb(); return () => { this.listeners = this.listeners.filter(f => f !== cb); }; }
  documentos() { return this._get('docs', []); }
  clientes() { return this._get('clientes', []); }
  ajustes() { return mezclarAjustes(this._get('ajustes', null)); }
  async guardarAjustes(a) { this._set('ajustes', a); }
  async guardarDocumento(doc, { avanzarContador } = {}) {
    const docs = this.documentos();
    const ahora = new Date().toISOString();
    if (!doc.id) { doc.id = uid(); doc.creado = ahora; }
    doc.actualizado = ahora;
    const i = docs.findIndex(d => d.id === doc.id);
    if (i >= 0) docs[i] = doc; else docs.push(doc);
    if (avanzarContador) {
      const a = this.ajustes();
      const n = secuenciaDe(doc.numero);
      const c = a.numeracion[doc.tipo];
      if (n != null && n >= c.siguiente) c.siguiente = n + 1;
      localStorage.setItem('fp_ajustes', JSON.stringify(a));
    }
    this._set('docs', docs);
    return doc;
  }
  async borrarDocumento(id) { this._set('docs', this.documentos().filter(d => d.id !== id)); }
  async guardarCliente(c) {
    const cs = this.clientes();
    if (!c.id) c.id = uid();
    const i = cs.findIndex(x => x.id === c.id);
    if (i >= 0) cs[i] = c; else cs.push(c);
    this._set('clientes', cs);
    return c;
  }
  async borrarCliente(id) { this._set('clientes', this.clientes().filter(c => c.id !== id)); }
  async importarLote(docs, clientes) {
    const ds = this.documentos(), cs = this.clientes();
    const ahora = new Date().toISOString();
    docs.forEach(d => { d.id = d.id || uid(); d.creado = d.creado || ahora; d.actualizado = ahora; ds.push(d); });
    clientes.forEach(c => { c.id = c.id || uid(); cs.push(c); });
    localStorage.setItem('fp_clientes', JSON.stringify(cs));
    this._set('docs', ds);
  }
}

/* ------------------------------------------------------------------ */
const FB = 'https://www.gstatic.com/firebasejs/11.6.0/';

class FirebaseStore {
  constructor() { this.modo = 'nube'; this.listeners = []; this._docs = []; this._clientes = []; this._ajustes = null; this.user = null; this.unsubs = []; }

  async init() {
    const [{ initializeApp }, auth, fs] = await Promise.all([
      import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js'),
    ]);
    this.A = auth; this.F = fs;
    const app = initializeApp(firebaseConfig);
    this.auth = auth.getAuth(app);
    await auth.setPersistence(this.auth, auth.browserLocalPersistence);
    // Caché local persistente: la app funciona sin cobertura y sincroniza al volver.
    this.db = fs.initializeFirestore(app, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
    return true;
  }

  onAuth(cb) {
    this.A.onAuthStateChanged(this.auth, user => {
      this.user = user;
      this.unsubs.forEach(u => u()); this.unsubs = [];
      if (user) this._escuchar();
      cb(user);
    });
  }
  login(email, pass) { return this.A.signInWithEmailAndPassword(this.auth, email, pass); }
  logout() { return this.A.signOut(this.auth); }

  _col(nombre) { return this.F.collection(this.db, 'usuarios', this.user.uid, nombre); }
  _ajRef() { return this.F.doc(this.db, 'usuarios', this.user.uid, 'config', 'ajustes'); }

  _escuchar() {
    const { onSnapshot } = this.F;
    this._listos = { docs: false, clientes: false, ajustes: false };
    const listo = k => { this._listos[k] = true; this._emit(); };
    this.unsubs.push(onSnapshot(this._col('documentos'), s => { this._docs = s.docs.map(d => ({ ...d.data(), id: d.id })); listo('docs'); }));
    this.unsubs.push(onSnapshot(this._col('clientes'), s => { this._clientes = s.docs.map(d => ({ ...d.data(), id: d.id })); listo('clientes'); }));
    this.unsubs.push(onSnapshot(this._ajRef(), s => { this._ajustes = s.exists() ? s.data() : null; listo('ajustes'); }));
  }
  _emit() { this.listeners.forEach(fn => fn()); }
  subscribe(cb) { this.listeners.push(cb); cb(); return () => { this.listeners = this.listeners.filter(f => f !== cb); }; }

  documentos() { return this._docs; }
  clientes() { return this._clientes; }
  ajustes() { return mezclarAjustes(this._ajustes); }

  async guardarAjustes(a) { await this.F.setDoc(this._ajRef(), limpiar(a)); }

  async guardarDocumento(doc, { avanzarContador } = {}) {
    const { doc: ref, runTransaction, setDoc } = this.F;
    const ahora = new Date().toISOString();
    const d = { ...doc };
    const id = d.id || uid();
    delete d.id;
    if (!doc.id) d.creado = ahora;
    d.actualizado = ahora;
    const docRef = ref(this._col('documentos'), id);
    const n = avanzarContador ? secuenciaDe(d.numero) : null;
    if (n != null && navigator.onLine) {
      // Transacción: dos dispositivos a la vez no pueden coger el mismo número.
      await runTransaction(this.db, async tx => {
        const snap = await tx.get(this._ajRef());
        const a = mezclarAjustes(snap.exists() ? snap.data() : null);
        const c = a.numeracion[d.tipo];
        if (n >= c.siguiente) c.siguiente = n + 1;
        tx.set(this._ajRef(), limpiar(a));
        tx.set(docRef, limpiar(d));
      });
    } else {
      // Sin red no se espera a la escritura: Firestore la encola y sincroniza al volver la conexión.
      const p = setDoc(docRef, limpiar(d));
      if (n != null) {
        const a = this.ajustes(); const c = a.numeracion[d.tipo];
        if (n >= c.siguiente) { c.siguiente = n + 1; this.guardarAjustes(a); }
      }
      if (navigator.onLine) await p;
    }
    return { ...d, id };
  }
  async borrarDocumento(id) { await this.F.deleteDoc(this.F.doc(this._col('documentos'), id)); }

  async guardarCliente(c) {
    const d = { ...c }; const id = d.id || uid(); delete d.id;
    const p = this.F.setDoc(this.F.doc(this._col('clientes'), id), limpiar(d));
    if (navigator.onLine) await p;
    return { ...d, id };
  }
  async borrarCliente(id) { await this.F.deleteDoc(this.F.doc(this._col('clientes'), id)); }

  async importarLote(docs, clientes) {
    const { writeBatch, doc: ref } = this.F;
    const ahora = new Date().toISOString();
    const ops = [
      ...docs.map(d => [ref(this._col('documentos'), d.id || uid()), { ...d, creado: d.creado || ahora, actualizado: ahora }]),
      ...clientes.map(c => [ref(this._col('clientes'), c.id || uid()), c]),
    ];
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(this.db);
      ops.slice(i, i + 400).forEach(([r, v]) => { const x = { ...v }; delete x.id; b.set(r, limpiar(x)); });
      await b.commit();
    }
  }
}

// Firestore no admite undefined.
function limpiar(o) { return JSON.parse(JSON.stringify(o)); }

export function crearStore() {
  const configurado = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PEGAR');
  return configurado ? new FirebaseStore() : new LocalStore();
}
