import os
import requests

ICON_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'icons')
URLS = {
    'ingredientes.png': 'https://cdn-icons-png.flaticon.com/512/4151/4151152.png',
    'recetas.png': 'https://cdn-icons-png.flaticon.com/512/3565/3565418.png',
    'comidas.png': 'https://cdn-icons-png.flaticon.com/512/2771/2771406.png',
}

os.makedirs(ICON_DIR, exist_ok=True)

for name, url in URLS.items():
    dest = os.path.join(ICON_DIR, name)
    print(f'Descargando {name} ...')
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    with open(dest, 'wb') as f:
        f.write(r.content)
    print(f'Guardado en {dest}')

print('Listo. Iconos descargados en static/icons/.')
