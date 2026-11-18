# Marzipano GEOMAV

Visor 360° para la web, basado en [Marzipano](https://github.com/google/marzipano) (Google, licencia Apache-2.0), con mejoras para crear y entregar **tours virtuales 360°** al estilo 3DVista. Proyecto de [GEOMAV](https://geomav.me).

> Copia independiente. No es un producto oficial de Google. El proyecto original fue archivado por Google en abril de 2026, por lo que este repositorio se mantiene por separado.

## Qué incluye

- **`src/`**: librería del visor (escenas, vistas, hotspots, efectos, transiciones).
- **`demos/`**: ejemplos funcionales. Los más útiles para tours:
  - `demos/sample-tour/`: tour completo (escenas, hotspots de enlace e información, autorrotación). Es la base para generar tours.
  - `demos/embedded-hotspots/`, `demos/hotspot-styles/`, `demos/transitions/`: hotspots y transiciones.
  - `demos/device-orientation/`, `demos/webvr/`: giroscopio y VR.
- **`test/`**: pruebas automáticas.

## Estructura de un tour

Un tour es un `data.js` con la lista de escenas, cada una con su vista inicial y sus hotspots:

```js
var data = {
  "scenes": [{
    "id": "escena-1",
    "name": "Escena 1",
    "levels": [...],              // niveles de resolución de la imagen
    "faceSize": 1500,
    "initialViewParameters": { "yaw": 0, "pitch": 0, "fov": 1.5 },
    "linkHotspots": [...],        // flechas hacia otras escenas
    "infoHotspots": [...]         // puntos con texto
  }],
  "name": "Mi tour",
  "settings": { "mouseViewMode": "drag", "autorotateEnabled": true }
};
```

Ver `demos/sample-tour/data.js` como ejemplo completo.

## Uso

Incluir el visor en un proyecto:

```bash
npm install
npm run dev        # sirve demos en http://localhost:8080
```

## Desarrollo

Requiere [Node.js](https://nodejs.org/). En Debian/Ubuntu, si el binario se llama `nodejs`, instalar `nodejs-legacy` o usar [nvm](https://github.com/nvm-sh/nvm).

- `npm install`: instala dependencias.
- `npm run dev`: servidor local con recarga automática de las demos.
- `npm test`: ejecuta las pruebas en los navegadores disponibles.
- `npm run livetest`: pruebas en `http://localhost:7357` con recarga automática.

## Créditos y licencia

Basado en Marzipano, © Google Inc., licenciado bajo [Apache License 2.0](LICENSE). Se conservan los avisos de copyright originales en el código fuente. Las modificaciones de GEOMAV se distribuyen bajo la misma licencia.
