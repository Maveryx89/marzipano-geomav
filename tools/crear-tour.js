#!/usr/bin/env node
"use strict";
/* Arma una carpeta de tour lista para subir a un hosting estático.
   Uso: node tools/crear-tour.js <carpeta-export-3dvista> <carpeta-salida>
   Requiere haber ejecutado antes: npm run build */
const fs = require("fs"), path = require("path"), cp = require("child_process");
const [exp, out] = process.argv.slice(2);
if (!exp || !out) { console.error("Uso: node tools/crear-tour.js <carpeta-export-3dvista> <carpeta-salida>"); process.exit(1); }
const raiz = path.join(__dirname, "..");
const lib = path.join(raiz, "build", "marzipano.min.js");
if (!fs.existsSync(lib)) { console.error("Falta build/marzipano.min.js. Ejecuta primero: npm run build"); process.exit(1); }
if (!fs.existsSync(path.join(exp, "media"))) { console.error("No se encontró la carpeta media/ dentro del export de 3DVista: " + exp); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(raiz, "template"), out, { recursive: true });
fs.mkdirSync(path.join(out, "lib"), { recursive: true });
fs.copyFileSync(lib, path.join(out, "lib", "marzipano.js"));
fs.cpSync(path.join(exp, "media"), path.join(out, "media"), { recursive: true });
const r = cp.spawnSync(process.execPath, [path.join(__dirname, "import-3dvista.js"), exp, path.join(out, "tour.json")], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status || 1);
console.log("\nListo: " + path.resolve(out) + "\nPruébalo con: npx http-server " + out + "\nLuego edita " + path.join(out, "config.js") + " (logo, color, textos).");
