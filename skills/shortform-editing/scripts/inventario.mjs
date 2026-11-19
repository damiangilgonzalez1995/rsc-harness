#!/usr/bin/env node
// Inventario del proyecto de reels: detecta qué existe y escribe la sección
// "## Reels" en CLAUDE.md entre marcadores, sin tocar nada fuera de ellos.
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve, parse } from 'node:path';
import { pathToFileURL } from 'node:url';

const INICIO = '<!-- reels:inicio -->';
const FIN = '<!-- reels:fin -->';
const VIDEO = /\.(mp4|mov|m4v|webm|mkv)$/i;

function listar(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

function carpetas(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

// reels/exportados/<base>_vN.mp4 exists for this base name (case-insensitive).
function exportado(base, exportados) {
  const b = base.toLowerCase();
  return exportados.some((e) => {
    const p = parse(e).name.toLowerCase();
    const k = p.lastIndexOf('_v');
    return k > 0 && p.slice(0, k) === b && /^[0-9]+$/.test(p.slice(k + 2)) && e.toLowerCase().endsWith('.mp4');
  });
}

function aprobado(planPath) {
  try {
    const datos = JSON.parse(readFileSync(planPath, 'utf8').replace(/^﻿/, ''));
    return Boolean(datos) && datos.aprobado === true;
  } catch {
    return false;
  }
}

function siguientePaso(e) {
  if (!e.herramientas) return '1 · Preparar (instalar las herramientas, con permiso)';
  if (!e.marca || !e.estilo || !e.receta) return '2 · Marca (solo lo que falta)';
  if (e.planesAprobados.length) return `4 · Montar (${e.planesAprobados.join(', ')}), sin rehacer transcripción ni hoja`;
  if (e.brutosPendientes.length) return `3 · Editar (${e.brutosPendientes.join(', ')})`;
  return 'nada pendiente';
}

export function inventario(root, { home = homedir() } = {}) {
  const rutas = join(home, '.editor-video', 'rutas.json');
  const herramientas = existsSync(rutas);
  const wiki = (n) => existsSync(join(root, 'docs', 'wiki', 'reels', n));
  const marca = wiki('marca.md');
  const receta = wiki('receta.md');
  const referencias = wiki('referencias.md');
  const estilo = existsSync(join(root, 'reels', 'marca', 'estilo.json'));
  const miniaturas = listar(join(root, 'reels', 'marca', 'miniaturas')).filter((n) => /\.(png|jpe?g|webp)$/i.test(n)).length;
  const exportados = listar(join(root, 'reels', 'exportados')).filter((n) => VIDEO.test(n));
  const brutosPendientes = listar(join(root, 'reels', 'brutos'))
    .filter((n) => VIDEO.test(n))
    .filter((n) => !exportado(parse(n).name, exportados));
  const trabajo = join(root, 'reels', 'trabajo');
  const planesAprobados = carpetas(trabajo)
    .filter((c) => aprobado(join(trabajo, c, 'plan.json')) && !exportado(c, exportados));
  const estado = { herramientas, marca, estilo, receta, referencias };
  const falta = ['herramientas', 'marca', 'estilo', 'receta', 'referencias'].filter((k) => !estado[k]);
  const e = {
    herramientas,
    rutaHerramientas: herramientas ? rutas : null,
    marca, receta, referencias, estilo,
    miniaturas, brutosPendientes, planesAprobados, exportados, falta,
  };
  e.siguiente = siguientePaso(e);
  return e;
}

function bloque(e, eol) {
  const si = (b) => (b ? 'hecho' : 'falta');
  const L = [
    INICIO,
    '## Reels',
    '',
    `- Herramientas: ${e.herramientas ? `hecho (${e.rutaHerramientas})` : 'falta (instalar en ~/.editor-video)'}`,
    `- Marca (docs/wiki/reels/marca.md): ${si(e.marca)}`,
    `- Receta (docs/wiki/reels/receta.md): ${si(e.receta)}`,
    `- Referencias (docs/wiki/reels/referencias.md): ${si(e.referencias)}`,
    `- Estilo (reels/marca/estilo.json): ${si(e.estilo)}`,
    `- Miniaturas (reels/marca/miniaturas/): ${e.miniaturas}`,
    `- Falta: ${e.falta.length ? e.falta.join(', ') : 'nada'}`,
    `- Vídeos pendientes en reels/brutos/: ${e.brutosPendientes.length ? e.brutosPendientes.join(', ') : 'ninguno'}`,
    `- Planes aprobados sin montar (reels/trabajo/<clip>/plan.json): ${e.planesAprobados.length ? e.planesAprobados.join(', ') : 'ninguno'}`,
    `- Siguiente paso: ${e.siguiente}`,
    FIN,
  ];
  return L.join(eol);
}

export function escribirSeccionReels(claudeMdPath, estado) {
  let actual = null;
  if (existsSync(claudeMdPath)) actual = readFileSync(claudeMdPath, 'utf8');
  if (actual === null) {
    mkdirSync(dirname(claudeMdPath), { recursive: true });
    writeFileSync(claudeMdPath, bloque(estado, '\n') + '\n', 'utf8');
    return;
  }
  const eol = actual.includes('\r\n') ? '\r\n' : '\n';
  const nuevo = bloque(estado, eol);
  const i = actual.indexOf(INICIO);
  const j = i >= 0 ? actual.indexOf(FIN, i) : -1;
  let salida;
  if (i >= 0 && j >= 0) {
    salida = actual.slice(0, i) + nuevo + actual.slice(j + FIN.length);
  } else {
    const sep = actual === '' ? '' : actual.endsWith(eol) ? eol : eol + eol;
    salida = actual + sep + nuevo + eol;
  }
  writeFileSync(claudeMdPath, salida, 'utf8');
}

function main() {
  const root = resolve(process.argv[2] ?? process.cwd());
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    console.error(`No existe la carpeta del proyecto: ${root}`);
    process.exit(1);
  }
  const e = inventario(root);
  escribirSeccionReels(join(root, 'CLAUDE.md'), e);
  console.log(JSON.stringify(e, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
