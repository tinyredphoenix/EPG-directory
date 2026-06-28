#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mapping = JSON.parse(fs.readFileSync(path.join(root, 'channels/mapping.json'), 'utf8'));

const seen = new Set();
const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<channels>'];

for (const ch of mapping.channels) {
  for (const src of ch.sources) {
    const key = `${src.site}:${src.site_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const label = (src.name || ch.id).replace(/"/g, "'");
    lines.push(
      `  <channel site="${src.site}" site_id="${src.site_id}" lang="hi">${label}</channel>`,
    );
  }
}

lines.push('</channels>');
const out = path.join(root, 'channels/grab.xml');
fs.writeFileSync(out, `${lines.join('\n')}\n`);
console.log(`grab.xml: ${seen.size} source channels from ${mapping.channels.length} targets`);