# Presupuestos y Facturas

Aplicación web (PWA) para crear presupuestos y facturas desde el móvil o el ordenador, sincronizados en la nube.

- **Web**: carpeta `docs/` publicada con GitHub Pages.
- **Datos**: Firebase (Authentication + Firestore). Configuración en `docs/js/config.js`.
- **Reglas de seguridad**: `docs/firestore.rules` (pegar en Firestore → Reglas).
- Sin configuración de Firebase la app funciona en *modo local* (datos solo en ese navegador).

Probar en local:

```bash
python -m http.server 8765 --directory docs
```

Cambios en la app: subir la versión `VERSION` de `docs/sw.js` para que los móviles descarguen la nueva versión.
