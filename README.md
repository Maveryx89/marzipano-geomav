# Marzipano GEOMAV

Visor de recorridos virtuales 360° propio de **GEOMAV**, basado en [Marzipano](https://github.com/google/marzipano) (Google, Apache-2.0).
El objetivo es entregar los tours con la calidad y la experiencia de un export de 3DVista, pero con un visor abierto, liviano y bajo nuestro control.

## Qué incluye este repositorio

| Carpeta | Contenido |
|---|---|
| `src/`, `demos/`, `test/` | Código original de Marzipano (visor 360 en WebGL). |
| `tools/import-3dvista.js` | **Importador:** convierte un export de 3DVista en `tour.json` y `tour.js` (escenas, teselas, vista inicial, enlaces entre escenas, textos, enlaces externos y menú). |
| `template/` | **Plantilla de tour GEOMAV:** interfaz moderna lista para publicar, sin CDN ni dependencias externas. |

### Funciones de la plantilla
- Menú lateral de escenas con miniaturas, buscador y botones por sector.
- Barra de controles: escena anterior/siguiente, giro automático, giroscopio (celular), compartir enlace y pantalla completa.
- Pantalla de carga con logo y color de marca.
- Hotspots de navegación animados (sprites) y textos del tour original.
- Enlace directo a cada escena (`#id-de-escena`).
- Todo se personaliza en un solo archivo: `config.js`.

> **Importante:** no se usa ni se copia el reproductor de 3DVista. Solo se aprovechan los **datos y medios de nuestros propios tours** (teselas, miniaturas, sprites).

## Cómo publicar un tour (paso a paso)

1. **Compilar el visor** (una sola vez):
   ```bash
   npm install
   npm run build        # genera build/marzipano.min.js
   ```
2. **Crear la carpeta del tour** a partir de la plantilla:
   ```bash
   cp -r template mi-tour
   mkdir -p mi-tour/lib && cp build/marzipano.min.js mi-tour/lib/marzipano.js
   ```
3. **Copiar los medios:** pega la carpeta `media/` del export de 3DVista dentro de `mi-tour/`.
4. **Generar los datos del tour** con el importador (si el export trae `locale/es.txt`, también se leen los enlaces y textos):
   ```bash
   node tools/import-3dvista.js <carpeta-del-export-3dvista> mi-tour/tour.json
   ```
5. **Personalizar** `mi-tour/config.js`: logo, color, textos, campo de visión, giro automático.
6. **Probar en local** (no sirve abrir el archivo directo, debe ir por http):
   ```bash
   npx http-server mi-tour
   ```
7. **Subir la carpeta `mi-tour/`** a cualquier hosting estático (por ejemplo, geomav.me).

## Ajustes frecuentes (`config.js`)

| Opción | Para qué sirve |
|---|---|
| `logo`, `accent`, `background` | Marca: logo, color principal y fondo de la pantalla de carga. |
| `fov` | Campo de visión **horizontal** inicial (grados). |
| `autorotate`, `autorotateIdleMs` | Giro automático al iniciar o tras inactividad. |
| `hotspotRadius` | Tamaño de proyección de los hotspots. |
| `hotspotRollSign` | Cambiar a `-1` si textos o flechas aparecen girados al revés. |
| `sceneListOpen` | Menú de escenas abierto al iniciar (escritorio). |

## Estado del proyecto

- **Fase 1 (base de entrega):** importador 3DVista y plantilla sin CDN. *Lista.*
- **Fase 2 (interfaz moderna):** menú, controles, carga con marca. *Lista.*
- **Pendiente:** validar el render con medios reales en GPU (PC y celular), afinar el tamaño y la orientación de hotspots frente al original y acercar el estilo visual al skin de 3DVista.

## Licencia

Apache-2.0 (ver `LICENSE`). Marzipano es © Google Inc. El código de giroscopio se basa en las demos oficiales de Marzipano.

---
**GEOMAV** · Topografía y tours virtuales 360°
