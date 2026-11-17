# Entrega de tours 360 estilo 3DVista (Marzipano GEOMAV)

Fork independiente de [Marzipano](https://github.com/google/marzipano) (Apache-2.0).
Esta rama agrega dos piezas:

- `tools/import-3dvista.js`: lee un export de 3DVista y genera `tour.json` + `tour.js`
  (escenas, niveles de teselas, vista inicial, enlaces entre escenas, textos, URLs, menu).
- `template/`: interfaz de tour moderna (menu de escenas con buscador, barra de controles,
  autorotacion, giroscopio, pantalla completa, compartir, pantalla de carga con logo).
  Sin CDN ni dependencias externas.

> No se incluye ni se copia el reproductor de 3DVista (`tdvplayer.js`). Solo se usan
> los **datos y medios de tu propio tour** (teselas, miniaturas, sprites).

## Uso

1. Compila el visor (una vez):
   ```bash
   npm install
   npm run build            # genera build/marzipano.min.js
   ```
2. Crea la carpeta de entrega copiando la plantilla:
   ```bash
   cp -r template mi-tour
   mkdir -p mi-tour/lib && cp build/marzipano.min.js mi-tour/lib/marzipano.js
   ```
3. Copia la carpeta `media/` del export de 3DVista dentro de `mi-tour/`.
4. Genera los datos del tour (usa el export original, incluye `locale/es.txt` si existe):
   ```bash
   node tools/import-3dvista.js <carpeta-export-3dvista> mi-tour/tour.json
   ```
5. Personaliza `mi-tour/config.js` (logo, color, textos, FOV).
6. Sirve por http (no abrir con file://):
   ```bash
   npx http-server mi-tour
   ```
   y subelo a cualquier hosting estatico.

## Ajustes a validar con tus medios

- `fov` en `config.js` es el FOV **horizontal** (se convierte al vertical que usa Marzipano).
- Si los textos o flechas giran al reves, usa `hotspotRollSign: -1`.
- El tamano de hotspots depende de `hotspotRadius` (por defecto 1000).
- El renderizado se probo con teselas sinteticas en Chrome headless; **validar en GPU real**
  (PC y celular) con el tour de verdad.

## Licencia

Apache-2.0 (ver `LICENSE`). Codigo de giroscopio basado en demos de Marzipano (Google).
