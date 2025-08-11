# Instalación y prueba

Requisitos: Python 3.10+ (igual al proyecto original), pip, entorno virtual recomendado.

1. Crear y activar entorno virtual
   - Windows (PowerShell):
     - `python -m venv .venv`
     - `.venv\\Scripts\\Activate.ps1`
2. Instalar dependencias
   - `pip install -r requirements.txt`
3. Copiar assets estáticos
   - Copia desde `karu-vers-final copy/static/` a `mejora/static/` los archivos:
     - `BGKARU.jpeg`, `KaruAI_head.png`, `cabezadepingui.png`, `gif-penguin.gif`
     - Iconos: guarda en `mejora/static/icons/` tres PNG llamados `ingredientes.png`, `recetas.png`, `comidas.png` (puedes descargar los actuales o exportarlos desde el proyecto original si estaban remotos).
4. Ejecutar la app
   - `python app.py`
   - Abre http://127.0.0.1:5000

Notas:
- La base SQLite `mi_base_datos.db` se mantiene igual.
- La API externa (Magic Loops) permanece sin cambios.
- Endpoints y contratos se mantienen.
