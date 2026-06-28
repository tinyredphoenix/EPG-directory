#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mapping = JSON.parse(fs.readFileSync(path.join(root, 'channels/mapping.json'), 'utf8'));
const rawDir = process.argv[2] || path.join(root, 'raw');
const outDir = path.join(root, 'out');
const maxHours = mapping.max_hours || 24;

const rawFiles = fs.existsSync(rawDir)
  ? fs.readdirSync(rawDir).filter((f) => f.endsWith('.xml')).map((f) => path.join(rawDir, f))
  : [];
if (!rawFiles.length) {
  console.error(`no raw XML in ${rawDir}`);
  process.exit(1);
}

/** site:site_id -> target ids (aliases for duplicate playlist names) */
const sourceToTargets = new Map();
for (const ch of mapping.channels) {
  const ids = [...new Set([ch.id, ...(ch.aliases || [])])];
  for (const src of ch.sources) {
    const key = `${src.site}:${src.site_id}`;
    const prev = sourceToTargets.get(key) || [];
    sourceToTargets.set(key, [...new Set([...prev, ...ids])]);
  }
}

function parseXmltvTime(s) {
  const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? `${m[7].slice(0, 3)}:${m[7].slice(3)}` : 'Z'}`;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

const now = Date.now();
const horizon = now + maxHours * 3600 * 1000;

function extractBlocks(tag, xml) {
  const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'g');
  return xml.match(re) || [];
}

function attr(block, name) {
  const m = block.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
}

function targetsForProgrammeChannel(ch) {
  for (const [key, ids] of sourceToTargets) {
    const [, siteId] = key.split(':');
    if (ch === siteId || ch === key || ids.includes(ch)) return ids;
  }
  return null;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

const outChannels = new Map();
const outProgrammes = [];

for (const file of rawFiles) {
  const raw = fs.readFileSync(file, 'utf8');
  const siteHint = path.basename(file, '.xml');

  for (const block of extractBlocks('channel', raw)) {
    const id = attr(block, 'id');
    const siteId = attr(block, 'site_id') || id;
    const site = attr(block, 'site') || siteHint;
    const key = `${site}:${siteId}`;
    const targets = sourceToTargets.get(key);
    if (!targets?.length) continue;
    for (const tid of targets) {
      if (!outChannels.has(tid)) {
        const name = attr(block, 'id') || tid;
        const inner = block.includes('<display-name')
          ? block.replace(/id="[^"]*"/, `id="${tid}"`)
          : `<channel id="${tid}"><display-name>${escapeXml(tid)}</display-name></channel>`;
        outChannels.set(tid, inner.replace(/id="[^"]*"/, `id="${tid}"`));
      }
    }
  }

  for (const block of extractBlocks('programme', raw)) {
    const ch = attr(block, 'channel');
    if (!ch) continue;
    let targets = targetsForProgrammeChannel(ch);
    if (!targets) continue;

    const start = attr(block, 'start');
    const stop = attr(block, 'stop');
    const startMs = start ? parseXmltvTime(start) : null;
    const stopMs = stop ? parseXmltvTime(stop) : null;
    if (startMs != null && startMs > horizon) continue;
    if (stopMs != null && stopMs < now) continue;

    for (const id of targets) {
      if (!outChannels.has(id)) {
        outChannels.set(
          id,
          `<channel id="${id}"><display-name>${escapeXml(id)}</display-name></channel>`,
        );
      }
      outProgrammes.push(block.replace(/channel="[^"]*"/, `channel="${id}"`));
    }
  }
}

const header =
  '<?xml version="1.0" encoding="UTF-8"?>\n<tv generator-info-name="EPG-directory">\n';
const body = [...outChannels.values()].join('\n') + '\n' + outProgrammes.join('\n') + '\n</tv>\n';
const xml = header + body;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'epg.xml'), xml);
fs.writeFileSync(path.join(outDir, 'epg.xml.gz'), zlib.gzipSync(xml));
fs.writeFileSync(
  path.join(outDir, 'meta.json'),
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      window_hours: maxHours,
      channels: outChannels.size,
      programmes: outProgrammes.length,
      lang: mapping.lang || 'hi',
    },
    null,
    2,
  ),
);

console.log(
  `epg.xml: ${outChannels.size} channels, ${outProgrammes.length} programmes (${maxHours}h window)`,
);