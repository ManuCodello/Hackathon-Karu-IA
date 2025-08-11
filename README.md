# KARU IA (Mejora)

Refactor visual y de código del proyecto original, manteniendo las mismas tecnologías, endpoints y paleta. Se mejoró la legibilidad, se optimizó JavaScript y se añadieron microanimaciones y toasts con Tailwind.

- Backend: Flask + SQLAlchemy
- Frontend: Jinja + Tailwind CDN + JS vanilla
- Paleta: morado primario `#6C3FB4`, acentos existentes (p.ej. `#F59E0B`)
- Sin nuevas funciones: solo limpieza, accesibilidad, UX y estilo.

## Principales mejoras
- Plantillas con `base.html` y `partials/header.html` para mejor organización.
- Eliminación de `onclick` inline; uso de `addEventListener` en `static/main.js`.
- Toasts simples (reemplazo de alerts) y microanimaciones.
- JS sin duplicados, helpers reutilizables, y manejo de errores.
- Accesibilidad: labels/aria, foco y contraste.

## Estructura
- `app.py`: factoría de app y registro de blueprint.
- `routes/`: mismas rutas, código más limpio y sin duplicación.
- `models/`: mismos modelos.
- `utils/`: helpers y llamada a API externa (inalterada).
- `templates/`: `base.html`, `index.html`, y `partials/`.
- `static/`: `main.js`, `styles.css` y assets.

Para instalación y ejecución ver `SETUP.md`.
