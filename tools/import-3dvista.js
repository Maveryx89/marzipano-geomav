#!/usr/bin/env node
/*
 * import-3dvista.js
 * Convierte un export de 3DVista (carpeta con script_general.js) a un tour.json
 * que lee la plantilla de este repo. Solo lee DATOS del tour (escenas, tiles,
 * enlaces); no usa ni copia el reproductor de 3DVista (lib/tdvplayer.js).
 *
 * Uso: node tools/import-3dvista.js <carpeta-export-3dvista> [salida/tour.json]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
const outFile = process.argv[3] || path.join(process.cwd(), 'tour.json');
if (!dir) { console.error('Uso: node tools/import-3dvista.js <carpeta-export> [tour.json]'); process.exit(1); }

const candidates = ['script_general.js', 'script_mobile.js', 'script.js'];
const srcName = candidates.find(f => fs.existsSync(path.join(dir, f) ));
if (!srcName) { console.error('No encuentro script_general.js en ' + dir); process.exit(1); }
const g = fs.readFileSync(path.join(dir, srcName), 'utf8');

// ---- utilidades de extracción de objetos JSON embebidos ----
function objRange(pos) {
  let depth = 0, i = pos, inStr = false;
  // retroceder hasta la llave que abre el objeto que contiene pos
  while (i > 0) {
    i--;
    const c = g[i];
    if (c === '}') depth++;
    else if (c === '{') { if (depth === 0) break; depth--; }
  }
  const start = i; depth = 0; let esc = false;
  for (let j = start; j < g.length; j++) {
    const c = g[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; }
    else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return [start, j + 1]; }
  }
  return null;
}
function parseObj(range) {
  let t = g.slice(range[0], range[1]);
  t = t.replace(/trans\((?:'[^']*'|"[^"]*")(?:\s*,\s*(?:'[^']*'|"[^"]*"|[^,)]*))*\)/g, '""');
  try { return JSON.parse(t); } catch (e) { return null; }
}
function objectsOfClass(cls) {
  const out = [], re = new RegExp('"class":"' + cls + '"', 'g'); let m;
  while ((m = re.exec(g))) { const r = objRange(m.index); if (!r) continue; const o = parseObj(r); if (o) out.push(o); }
  return out;
}
const byIdCache = {};
function byId(id) {
  if (byIdCache[id] !== undefined) return byIdCache[id];
  const needle = '"id":"' + id + '"'; const idx = g.indexOf(needle);
  let o = null;
  if (idx >= 0) { const r = objRange(idx); if (r) o = parseObj(r); }
  return (byIdCache[id] = o);
}
const ref = s => (typeof s === 'string' ? s.replace(/^this\./, '') : null);
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

// ---- URLs de enlaces externos (locale/es.txt) ----
const linkUrls = {}, hotspotTexts = {};
const locFile = path.join(dir, 'locale', 'es.txt');
if (fs.existsSync(locFile)) {
  for (const line of fs.readFileSync(locFile, 'utf8').split(/\r?\n/)) {
    const m = /^(LinkBehaviour_[A-F0-9_]+)\.source\s*=\s*(\S+)/.exec(line);
    if (m) linkUrls[m[1]] = m[2];
    const t = /^(HotspotPanoramaOverlayTextImage_[A-F0-9_]+)\.text\s*=\s*(.*)$/.exec(line);
    if (t) hotspotTexts[t[1]] = t[2].trim();
  }
}

// ---- escenas ----
const panos = objectsOfClass('Panorama');
const scenes = [], report = { sinCubo: [], enlaces: 0, hotspotsInfo: 0 };
const sceneIndexById = {};
for (const p of panos) {
  const frame = (p.frames || [])[0];
  const cube = frame && frame.cube && frame.cube.levels;
  if (!cube) { report.sinCubo.push(p.id); continue; }
  const levels = cube.map((l, i) => ({
    index: i,                                   // carpeta numérica en media/<id>_0/<cara>/<index>/
    size: Math.round(l.width / 6),              // lado de la cara en px
    tileSize: Math.round(l.height / l.rowCount),
    url: l.url,                                 // media/<id>_0/{face}/<index>/{row}_{column}.webp
  })).sort((a, b) => a.size - b.size);          // Marzipano pide de menor a mayor
  const cam = byId(p.id + '_camera');
  const ip = cam && cam.initialPosition || {};
  scenes.push({
    id: p.id,
    name: (p.data && p.data.label) || p.id,
    thumbnail: p.thumbnailUrl || null,
    levels,
    initialView: { yaw: num(ip.yaw, 0), pitch: num(ip.pitch, 0) },
    hfovMax: num(p.hfovMax, 130),
    _overlays: (p.overlays || []).map(ref),
    _adj: p.adjacentPanoramas || [],
  });
  sceneIndexById[p.id] = scenes.length - 1;
}

// ---- hotspots ----
for (const s of scenes) {
  const links = [], infos = [];
  const adjByOverlay = {};
  for (const a of s._adj) adjByOverlay[a.data && a.data.overlayID] = a;
  for (const oid of s._overlays) {
    const ov = byId(oid); if (!ov) continue;
    let it = (ov.items || [])[0];
    if (typeof it === 'string') it = byId(ref(it));
    if (!it) continue;
    const label = (ov.data && ov.data.label) || (it.data && it.data.label) || '';
    const pos = { yaw: num(it.yaw, 0), pitch: num(it.pitch, 0) };
    const adj = adjByOverlay[oid];
    const area = byId(ref((ov.areas || [])[0])) || {};
    const click = area.click || '';
    const idx = /setPlayListSelectedIndex\(this\.mainPlayList,\s*(\d+)\)/.exec(click);
    const spot = /setPanoramaCameraWithSpot\([^,]+,\s*this\.(PanoramaPlayListItem_[A-F0-9_]+),\s*(-?[\d.]+),\s*(-?[\d.]+)/.exec(click);
    const lk = /translate\('(LinkBehaviour_[A-F0-9_]+)\.source'\)/.exec(click);
    const img = it.image ? (typeof it.image === 'string' ? byId(ref(it.image)) : it.image) : null;
    let lv = img && img.levels && img.levels[0];
    if (typeof lv === 'string') lv = byId(ref(lv));
    const sprite = (img && /Animated/.test(img.class || '') && lv)
      ? { cols: img.colCount, rows: img.rowCount, frames: img.frameCount, frameDuration: img.frameDuration, width: lv.width, height: lv.height } : null;
    const base = { ...pos, style: label, hfov: num(it.hfov, 10), vfov: num(it.vfov, num(it.hfov, 10)), roll: num(it.roll, 0), rotationX: num(it.rotationX, 0), rotationY: num(it.rotationY, 0),
                   sprite, text: hotspotTexts[it.id] || null, image: lv ? lv.url : null, imageSize: lv ? { width: lv.width, height: lv.height } : null };
    let target = null, arrival = null;
    if (adj) target = ref(adj.panorama);
    else if (spot && itemIndexById[spot[1]] != null) { target = orderAll[itemIndexById[spot[1]]]; arrival = { yaw: +spot[2], pitch: +spot[3] }; }
    else if (idx && orderAll[+idx[1]]) target = orderAll[+idx[1]];
    if (target && target in sceneIndexById) {
      links.push({ ...base, target, arrival, backwardYaw: adj ? num(adj.backwardYaw, null) : null }); report.enlaces++;
    } else if (lk && linkUrls[lk[1]]) {
      infos.push({ ...base, kind: 'url', url: linkUrls[lk[1]] }); report.hotspotsInfo++;
    } else {
      infos.push({ ...base, kind: base.text ? 'label' : (click ? 'popup' : 'decor') }); report.hotspotsInfo++;
    }
  }
  s.links = links; s.hotspots = infos; delete s._overlays; delete s._adj;
}

// ---- orden de la lista de reproducción ----
const pl = objectsOfClass('PlayList').find(p => p.id === 'mainPlayList');
const plItems = pl ? pl.items.map(i => (typeof i === 'string' ? byId(ref(i)) : i)) : [];
const itemIndexById = {};
plItems.forEach((it, i) => { if (it && it.id) itemIndexById[it.id] = i; });
const orderAll = plItems.map(it => it && ref(it.media));
const order = (pl ? orderAll : scenes.map(s => s.id)).filter(id => id in sceneIndexById);

// ---- menú: botones "Ir a <sector>" que saltan a un índice de la lista ----
const menu = [];
for (const b of objectsOfClass('Button')) {
  const name = b.data && b.data.name; const click = b.click || b.mousedown || '';
  const m = /setPlayListSelectedIndex\(this\.mainPlayList,\s*(\d+)\)/.exec(click);
  if (name && m && order[+m[1]]) menu.push({ name, scene: order[+m[1]] });
}

const title = (/<title>([^<]*)<\/title>/i.exec(fs.existsSync(path.join(dir, 'index.htm')) ? fs.readFileSync(path.join(dir, 'index.htm'), 'utf8') : '') || [])[1] || 'Tour';
const tour = { title: title.trim(), source: '3dvista', order, scenes, menu };
fs.writeFileSync(outFile, JSON.stringify(tour, null, 1));
// tour.js listo para cargar con <script> (sirve también abriendo por http sin fetch)
fs.writeFileSync(path.join(path.dirname(outFile), 'tour.js'), 'window.TOUR = ' + JSON.stringify(tour) + ';\n');
console.log(JSON.stringify({ escenas: scenes.length, enlaces: report.enlaces, hotspotsSinEnlace: report.hotspotsInfo, sinCubo: report.sinCubo.length, ordenOk: order.length, botonesMenu: menu.length, salida: outFile }));
