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
const tzOut = mapping.timezone || '+0530';

const rawFiles = fs.existsSync(rawDir)
  ? fs.readdirSync(rawDir).filter((f) => f.endsWith('.xml')).map((f) => path.join(rawDir, f))
  : [];
if (!rawFiles.length) {
  console.error(`no raw XML in ${rawDir}`);
  process.exit(1);
}

/** Every raw programme channel value -> playlist ids */
const progChannelToTargets = new Map();

for (const ch of mapping.channels) {
  const ids = [...new Set([ch.id, ...(ch.aliases || [])])];
  for (const src of ch.sources) {
    const keys = [
      src.site_id,
      `${src.site}:${src.site_id}`,
      `${src.site}@${src.site_id}`,
      `${src.site}_${src.site_id}`,
      src.name,
      ...ids,
    ].filter(Boolean);
    for (const k of keys) {
      const prev = progChannelToTargets.get(k) || [];
      progChannelToTargets.set(k, [...new Set([...prev, ...ids])]);
    }
  }
}

function parseXmltvTime(s) {
  const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? `${m[7].slice(0, 3)}:${m[7].slice(3)}` : 'Z'}`;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

const TZ_OFFSET_MIN = (() => {
  const m = String(tzOut).match(/^([+-])(\d{2})(\d{2})$/);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3]));
})();

function formatXmltvTime(ms) {
  const d = new Date(ms + TZ_OFFSET_MIN * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())} ${tzOut}`
  );
}

function shiftProgrammeTimes(block) {
  return block
    .replace(/start="([^"]+)"/g, (_, t) => {
      const ms = parseXmltvTime(t);
      return ms != null ? `start="${formatXmltvTime(ms)}"` : `start="${t}"`;
    })
    .replace(/stop="([^"]+)"/g, (_, t) => {
      const ms = parseXmltvTime(t);
      return ms != null ? `stop="${formatXmltvTime(ms)}"` : `stop="${t}"`;
    });
}

const now = Date.now();
const horizon = now + maxHours * 3600 * 1000;
const graceMs = 30 * 60 * 1000;

function extractBlocks(tag, xml) {
  const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'g');
  return xml.match(re) || [];
}

function attr(block, name) {
  const m = block.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function targetsForRawChannel(ch) {
  if (!ch) return null;
  if (progChannelToTargets.has(ch)) return progChannelToTargets.get(ch);
  const decoded = ch.replace(/&amp;/g, '&');
  if (progChannelToTargets.has(decoded)) return progChannelToTargets.get(decoded);
  return null;
}

const outChannels = new Map();
const outProgrammes = [];
const stats = {};

for (const file of rawFiles) {
  const raw = fs.readFileSync(file, 'utf8');

  for (const block of extractBlocks('programme', raw)) {
    const ch = attr(block, 'channel');
    const targets = targetsForRawChannel(ch);
    if (!targets?.length) continue;

    const start = attr(block, 'start');
    const stop = attr(block, 'stop');
    const startMs = start ? parseXmltvTime(start) : null;
    const stopMs = stop ? parseXmltvTime(stop) : null;
    if (startMs != null && startMs > horizon) continue;
    if (stopMs != null && stopMs < now - graceMs) continue;
    if (startMs != null && stopMs != null && startMs >= stopMs) continue;

    const shifted = shiftProgrammeTimes(block);

    for (const id of targets) {
      if (!outChannels.has(id)) {
        const names = [...new Set([id, ...(mapping.channels.find((c) => c.id === id)?.aliases || [])])];
        const dn = names.map((n) => `  <display-name>${escapeXml(n)}</display-name>`).join('\n');
        outChannels.set(id, `<channel id="${escapeXml(id)}">\n${dn}\n</channel>`);
      }
      const prog = shifted.replace(/channel="[^"]*"/, `channel="${escapeXml(id)}"`);
      outProgrammes.push(prog);
      stats[id] = (stats[id] || 0) + 1;
    }
  }
}

for (const ch of mapping.channels) {
  if (!outChannels.has(ch.id)) {
    const names = [...new Set([ch.id, ...(ch.aliases || [])])];
    const dn = names.map((n) => `  <display-name>${escapeXml(n)}</display-name>`).join('\n');
    outChannels.set(ch.id, `<channel id="${escapeXml(ch.id)}">\n${dn}\n</channel>`);
    stats[ch.id] = stats[ch.id] || 0;
  }
}

const header = `<?xml version="1.0" encoding="UTF-8"?>\n<tv generator-info-name="EPG-directory" generator-info-url="https://github.com/tinyredphoenix/EPG-directory">\n`;
const body = [...outChannels.values()].join('\n') + '\n' + outProgrammes.join('\n') + '\n</tv>\n';
const xml = header + body;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'epg.xml'), xml);
fs.writeFileSync(path.join(outDir, 'epg.xml.gz'), zlib.gzipSync(xml));

const withProg = Object.values(stats).filter((n) => n > 0).length;
fs.writeFileSync(
  path.join(outDir, 'meta.json'),
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      window_hours: maxHours,
      timezone: tzOut,
      channels: outChannels.size,
      channels_with_programmes: withProg,
      programmes: outProgrammes.length,
      lang: mapping.lang || 'hi',
      top_channels: Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([id, count]) => ({ id, count })),
    },
    null,
    2,
  ),
);

console.log(
  `epg.xml: ${outChannels.size} channels (${withProg} with programmes), ${outProgrammes.length} programmes, tz=${tzOut}`,
);