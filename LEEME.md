# Laboratorio de Física II · UTP — Cuadernos interactivos

## Contenido
- `index.html`: portal con enlaces a las cuatro prácticas.
- `puente-wheatstone/index.html`: Práctica 5.
- `resistividad/index.html`: Práctica 6.
- `ley-ampere/index.html`: Práctica 7.
- `transformadores/index.html`: Práctica 8.
- `_fuentes/`: archivos editables. `python3 build.py` regenera los cuadernos en `_fuentes/dist/`.

Cada `index.html` es autocontenido (estilos, código, logo e ilustraciones van dentro del archivo).

## Cómo publicarlos
- **GitHub Pages:** sube la carpeta completa a un repositorio y activa Pages en *Settings → Pages*.
- **Netlify o Vercel:** arrastra la carpeta completa al panel de despliegue.
- **Google Sites o Moodle:** sube los archivos a un hosting y enlaza o inserta la URL de cada `index.html`.
- **Uso local:** abre `index.html` con doble clic en el navegador.

## Requisitos
- Conexión a internet para cargar las fuentes tipográficas (Google Fonts) y las ecuaciones (MathJax). Sin conexión el cuaderno funciona, pero con tipografía de reserva y ecuaciones sin formato.
- Los datos, respuestas y nombres de cada estudiante se guardan en su propio navegador (localStorage). No se envían a ningún servidor.
