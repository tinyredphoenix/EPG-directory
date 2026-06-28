#!/usr/bin/env node
/**
 * Build channels/mapping.json from targets list + public iptv-org site channel lists.
 * Run: node scripts/build-mapping.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const SITES = ['tataplay.com', 'dishtv.in', 'jiotv.com', 'airtelxstream.in'];

/** Playlist tvg-id targets — Hindi GEC, news, sports, kids, lifestyle (~200). */
const TARGETS = [
  'Star Plus HD', 'Star Plus', 'Star Bharat HD', 'Star Bharat', 'Star Utsav HD', 'Star Utsav',
  'Star Gold HD', 'Star Gold', 'Star Gold 2 HD', 'Star Gold 2', 'Star Gold Select HD', 'Star Gold Thrills',
  'Colors HD', 'Colors', 'Colors Rishtey', 'Colors Cineplex HD', 'Colors Super', 'Colors Bangla HD',
  'Sony HD', 'SET HD', 'SAB HD', 'Sony SAB HD', 'Sony Max HD', 'Sony Max 1', 'Sony Max One', 'Sony Max 2', 'Sony Pix HD', 'Sony Pal',
  'Sony Wah', 'Sony Marathi', 'SET HD', 'Sony BBC Earth HD',
  'Zee TV HD', 'Zee TV', 'Zee Cinema HD', 'Zee Cinema', 'Zee Anmol', 'Zee Bharat', 'Zee Bharat HD',
  'Zee Classic', 'Zee Classic HD', 'Zee Bollywood', 'Zee Cafe', 'Zee Anmol Cinema',
  '&tv HD', 'And TV HD', 'And TV', 'And Pictures HD', '&Pictures HD', 'And Xplor HD', 'And Explorer HD',
  '&flix', '&xplor HD', 'Rishtey', 'Big Magic', 'Dangal', 'Enterr 10', 'Bhojpuri Cinema',
  'DD National HD', 'DD National', 'DD Bharati', 'DD Kisan', 'DD News', 'DD Sports', 'DD India',
  'Aaj Tak HD', 'Aaj Tak', 'ABP News India', 'ABP News', 'ABP Ananda', 'ABP Ganga', 'ABP Majha', 'ABP Asmita',
  'Zee News', 'Zee News HD', 'India TV', 'India TV HD', 'News 18 India', 'News18 India', 'News18 Lokmat',
  'Republic Bharat', 'Republic TV', 'Republic Bangla', 'Times Now', 'Times Now Navbharat', 'India Today',
  'NDTV India', 'NDTV 24x7', 'NDTV Profit', 'CNN News18', 'News Nation', 'News24', 'Good News Today',
  'TV9 Bharatvarsh', 'TV9 Gujarati', 'Wion', 'Mirror Now', 'CNBC TV18', 'CNBC Awaaz', 'CNBC Bajar',
  'ET Now', 'ET Now Swadesh', 'Zee Business', 'India News', 'Sudarshan News', 'Samachar Plus',
  'Star Sports 1 HD', 'Star Sports 1 HD Hindi', 'Star Sports 1 Hindi HD', 'Star Sports 2 HD',
  'Star Sports 2 Hindi HD', 'Star Sports Select 1 HD', 'Star Sports Select 2 HD', 'Star Sports 3 HD',
  'Sony Sports Ten 1 HD', 'Sony Ten 1 HD', 'Sony Sports Ten 2 HD', 'Sony Ten 2 HD',
  'Sony Sports Ten 3 Hindi HD', 'Sony Ten 3 HD Hindi', 'Sony Ten 3 Hindi', 'Sony Ten 5 HD', 'Sony Ten 5',
  'DD Sports', 'Eurosport HD', 'Eurosport', 'Sports18 1 HD', 'Times Now HD', 'Star Sports 3',
  'EPIC TV', 'Travelxp HD Hindi', 'Travelxp HD', 'Discovery', 'Discovery HD World', 'Discovery Science',
  'Animal Planet HD World', 'National Geographic', 'Nat Geo Wild', 'History TV18 HD', 'History TV18',
  'TLC HD', 'TLC', 'Food Food', 'Good Times', 'FYI TV18', 'Sony BBC Earth HD',
  'MTV India', 'MTV Beats HD', 'VH1', '9XM', 'B4U Music', 'B4U Movies', 'B4U Kadak', 'Mastiii', 'Zoom',
  'Disney Channel', 'Disney Junior', 'Hungama', 'Pogo', 'Cartoon Network', 'Nick', 'Nick HD', 'Sonic',
  'Sony Yay', 'Discovery Kids', 'Chutti TV', 'Kochu TV', 'Duck TV', 'Nick Jr',
  'Star Movies HD', 'Star Movies Select HD', 'Movies Now HD', 'MNX HD', 'Romedy Now', 'Romedy Now HD',
  'Paras tv', 'Sanskar', 'Aastha', 'Aastha Bhajan', 'Zee Zest', 'Zee Zest HD',
  'Sadhna', 'Ishwar TV', 'Divya TV', 'Shalom', 'God TV', 'Peace of Mind',
  'Star World', 'Comedy Central HD', 'Colors Infinity HD', 'Romedy Now', 'National Geographic HD',
  'Nickelodeon', 'Cartoon Network Hindi', 'Pogo Hindi', 'Sony Pix HD', 'MN+ HD', 'Movies Now',
  'Zee Zest HD', 'NDTV Good Times', 'Fashion TV', 'Travelxp', 'Wild Earth HD',
  'Unite8 Sports 2 HD', '1Sports HD', '1 Sports', 'News18 Gujarati', 'Sansad TV HD', 'Sansad TV',
  'News18 Rajasthan', 'News18 UP', 'News18 MP', 'News18 Bihar', 'News18 Punjab Haryana',
  'Zee Rajasthan', 'Zee UP UK', 'Zee Punjab Haryana', 'Zee 24 Taas', 'Zee 24 Kalak',
  'Sun TV HD', 'Sun Music HD', 'KTV HD', 'Udaya HD', 'Gemini TV HD',
  'Super Hungama', 'EPIC Kids', 'EPIC Music', 'Nick Jr', 'Sonic', 'Discovery Turbo',
  'History TV18', 'Nat Geo Wild HD', 'Animal Planet', 'TLC HD World', 'Living Foodz',
  'R Bharat', 'REPUBLIC TV', 'R Bangla', 'News18 Bangla', 'News18 Tamil', 'News18 Kannada',
  'Star Sports 3', 'Star Sports 4', 'DD Sports HD', 'Eurosport', '1 Sports',
  'Zee Punjab Haryana', 'Zee UP UK', 'Zee 24 Taas', 'Zee 24 Kalak', 'Zee Rajasthan',
  'ABP Asmita', 'ABP Ganga', 'TV9 Bharatvarsh', 'Good News Today', 'India News',
  'Star Utsav HD', 'Star Gold Select', 'Star Gold Thrills', 'Colors Super', 'Colors Rishtey',
  'Zee Action', 'Zee Cafe HD', 'Zee Anmol Cinema', 'MN+ HD', 'MNX HD', 'Romedy Now',
  'Star Movies Select HD', 'Star World', 'Comedy Central', 'AXN', 'Sony BBC Earth',
  'MTV Beats', '9XM', 'B4U Kadak', 'Mastiii', 'Zoom', 'Fashion TV', 'Wild Earth',
  'Unite8 Sports 2 HD', 'Sports18 1', 'Sports18 Khel', 'DD Kisan', 'DD Bharati',
  'Sansad TV', 'DD India', 'Wion', 'Mirror Now', 'CNBC TV18', 'ET Now',
];

/** Extra playlist spellings → same EPG row (programmes duplicated to each). */
const ALIASES = {
  'And Xplor HD': ['&xplor HD', '&Xplor HD', 'And Explorer HD'],
  'Disney Channel': ['Disney Channel HD', 'Disney'],
  'EPIC TV': ['EPIC', 'Epic TV'],
  'Republic Bharat': ['R Bharat', 'Republic Bharat HD'],
  'Republic TV': ['REPUBLIC TV'],
  'Sony Max HD': ['SONY MAX HD', 'Sony Max'],
  'Sony Max 1': ['Sony Max One', 'SONY MAX 1'],
  'Zee Bharat': ['Zee Bharat HD'],
  'Hungama': ['Super Hungama'],
  'Paras tv': ['Paras TV', 'Paras Gold One'],
  '&tv HD': ['And TV HD'],
  'SET HD': ['Sony HD'],
  'SAB HD': ['Sony SAB HD'],
};

const MANUAL = {
  'Star Plus HD': [{ site: 'tataplay.com', site_id: '8' }, { site: 'dishtv.in', site_id: '143832' }],
  'Star Plus': [{ site: 'tataplay.com', site_id: '550' }, { site: 'dishtv.in', site_id: '143831' }],
  'Star Bharat HD': [{ site: 'tataplay.com', site_id: '244' }, { site: 'dishtv.in', site_id: '159101' }],
  'Star Bharat': [{ site: 'tataplay.com', site_id: '86' }, { site: 'dishtv.in', site_id: '159130' }],
  'Colors HD': [{ site: 'tataplay.com', site_id: '52' }, { site: 'dishtv.in', site_id: '158149' }, { site: 'jiotv.com', site_id: '144' }],
  'Zee TV HD': [{ site: 'tataplay.com', site_id: '63' }, { site: 'dishtv.in', site_id: '144479' }],
  'Zee TV': [{ site: 'tataplay.com', site_id: '557' }, { site: 'dishtv.in', site_id: '144478' }],
  'Zee Cinema HD': [{ site: 'tataplay.com', site_id: '64' }],
  'Zee Cinema': [{ site: 'tataplay.com', site_id: '558' }],
  'SET HD': [{ site: 'tataplay.com', site_id: '15' }, { site: 'jiotv.com', site_id: '291' }],
  'Sony HD': [{ site: 'tataplay.com', site_id: '15' }, { site: 'jiotv.com', site_id: '291' }],
  'SAB HD': [{ site: 'tataplay.com', site_id: '48' }, { site: 'jiotv.com', site_id: '471' }],
  'Sony SAB HD': [{ site: 'tataplay.com', site_id: '48' }, { site: 'jiotv.com', site_id: '471' }],
  'Sony Max HD': [{ site: 'tataplay.com', site_id: '80', name: 'SONY MAX HD' }, { site: 'jiotv.com', site_id: '476' }],
  'Sony Max 1': [{ site: 'tataplay.com', site_id: '1717', name: 'SONY MAX 1' }],
  'Sony Max One': [{ site: 'tataplay.com', site_id: '1717', name: 'SONY MAX 1' }],
  'Sony Pix HD': [{ site: 'tataplay.com', site_id: '560' }],
  'Sony Ten 5 HD': [{ site: 'jiotv.com', site_id: '155' }],
  'Sony Ten 1 HD': [{ site: 'jiotv.com', site_id: '162' }],
  'Sony Sports Ten 1 HD': [{ site: 'jiotv.com', site_id: '162' }],
  'Sony Ten 2 HD': [{ site: 'jiotv.com', site_id: '891' }],
  'Sony Sports Ten 2 HD': [{ site: 'jiotv.com', site_id: '891' }],
  'Sony Ten 3 HD Hindi': [{ site: 'jiotv.com', site_id: '892' }],
  'Sony Sports Ten 3 Hindi HD': [{ site: 'jiotv.com', site_id: '892' }],
  'Republic Bharat': [{ site: 'tataplay.com', site_id: '696', name: 'R Bharat' }, { site: 'jiotv.com', site_id: '1403' }],
  'R Bharat': [{ site: 'tataplay.com', site_id: '696', name: 'R Bharat' }],
  'Republic TV': [{ site: 'tataplay.com', site_id: '72', name: 'REPUBLIC TV' }, { site: 'jiotv.com', site_id: '858' }],
  'REPUBLIC TV': [{ site: 'tataplay.com', site_id: '72', name: 'REPUBLIC TV' }],
  'Zee Bharat': [{ site: 'tataplay.com', site_id: '514' }, { site: 'jiotv.com', site_id: '652' }],
  'Zee Bharat HD': [{ site: 'tataplay.com', site_id: '514' }, { site: 'jiotv.com', site_id: '652' }],
  'Aaj Tak HD': [{ site: 'jiotv.com', site_id: '173' }],
  'Aaj Tak': [{ site: 'jiotv.com', site_id: '173' }],
  'ABP News India': [{ site: 'jiotv.com', site_id: '177' }],
  'Zee News': [{ site: 'jiotv.com', site_id: '504' }],
  'India TV': [{ site: 'jiotv.com', site_id: '235' }],
  'News 18 India': [{ site: 'jiotv.com', site_id: '231' }],
  'News18 India': [{ site: 'jiotv.com', site_id: '231' }],
  'Colors Cineplex HD': [{ site: 'jiotv.com', site_id: '1477' }],
  'EPIC TV': [{ site: 'tataplay.com', site_id: '126', name: 'EPIC' }, { site: 'jiotv.com', site_id: '481' }],
  'Travelxp HD Hindi': [{ site: 'jiotv.com', site_id: '562' }],
  'Travelxp HD': [{ site: 'jiotv.com', site_id: '164' }],
  'Disney Channel': [{ site: 'tataplay.com', site_id: '1066', name: 'Disney Channel HD' }, { site: 'tataplay.com', site_id: '114', name: 'Disney' }],
  'Hungama': [{ site: 'tataplay.com', site_id: '345' }],
  'Super Hungama': [{ site: 'tataplay.com', site_id: '587', name: 'Super Hungama' }],
  'Cartoon Network': [{ site: 'jiotv.com', site_id: '816', name: 'Cartoon Network Hindi' }],
  'Pogo': [{ site: 'jiotv.com', site_id: '559' }],
  'Nick': [{ site: 'jiotv.com', site_id: '545' }],
  'Rishtey': [{ site: 'jiotv.com', site_id: '279' }],
  'Sony Wah': [{ site: 'jiotv.com', site_id: '1393' }],
  'DD National HD': [{ site: 'jiotv.com', site_id: '202' }],
  'DD National': [{ site: 'jiotv.com', site_id: '202' }],
  'Paras tv': [{ site: 'jiotv.com', site_id: '602' }, { site: 'dishtv.in', site_id: '143642', name: 'Paras Gold One' }],
  'B4U Music': [{ site: 'jiotv.com', site_id: '183' }],
  'Star Sports 1 HD': [{ site: 'tataplay.com', site_id: '6' }],
  'Star Sports 1 HD Hindi': [{ site: 'tataplay.com', site_id: '7' }],
  'Star Sports 2 HD': [{ site: 'tataplay.com', site_id: '9' }],
  'Star Sports Select 1 HD': [{ site: 'tataplay.com', site_id: '10' }],
  'Star Sports Select 2 HD': [{ site: 'tataplay.com', site_id: '11' }],
  '&Pictures HD': [{ site: 'tataplay.com', site_id: '561' }],
  'And Pictures HD': [{ site: 'tataplay.com', site_id: '561' }],
  'And TV HD': [{ site: 'tataplay.com', site_id: '40', name: '&tv HD' }],
  '&tv HD': [{ site: 'tataplay.com', site_id: '40', name: '&tv HD' }],
  'And Xplor HD': [{ site: 'tataplay.com', site_id: '1183', name: '&Xplor HD' }],
  '&xplor HD': [{ site: 'tataplay.com', site_id: '1183', name: '&Xplor HD' }],
  'And Explorer HD': [{ site: 'tataplay.com', site_id: '1183', name: '&Xplor HD' }],
  'Star Utsav': [{ site: 'tataplay.com', site_id: '551' }],
  'Zee Cinema': [{ site: 'tataplay.com', site_id: '558' }],
  'Zee Anmol': [{ site: 'tataplay.com', site_id: '523', name: 'Anmol TV' }],
  'Zee Anmol Cinema': [{ site: 'tataplay.com', site_id: '64', name: 'Anmol Cinema' }],
  'Zee Classic HD': [{ site: 'dishtv.in', site_id: '144447', name: 'Zee Classic' }],
  '&Pictures HD': [{ site: 'tataplay.com', site_id: '267', name: '&pictures HD' }],
  'DD National': [{ site: 'jiotv.com', site_id: '202' }],
  'Aaj Tak': [{ site: 'jiotv.com', site_id: '173' }],
  'News18 India': [{ site: 'jiotv.com', site_id: '231' }],
  'India Today': [{ site: 'jiotv.com', site_id: '493' }],
  'NDTV India': [{ site: 'jiotv.com', site_id: '258' }],
  'Sony Ten 1 HD': [{ site: 'jiotv.com', site_id: '162' }],
  'Sony Ten 2 HD': [{ site: 'jiotv.com', site_id: '891' }],
  'Sony Ten 3 HD Hindi': [{ site: 'jiotv.com', site_id: '892' }],

  'Discovery HD World': [{ site: 'jiotv.com', site_id: '463' }],
  'Food Food': [{ site: 'jiotv.com', site_id: '561' }],
  'FYI TV18': [{ site: 'jiotv.com', site_id: '475' }],
  'MTV India': [{ site: 'jiotv.com', site_id: '467' }],
  'B4U Movies': [{ site: 'jiotv.com', site_id: '182' }],
  'Cartoon Network': [{ site: 'jiotv.com', site_id: '816', name: 'Cartoon Network Hindi' }],
  'Cartoon Network Hindi': [{ site: 'jiotv.com', site_id: '816' }],
  'Discovery Kids': [{ site: 'jiotv.com', site_id: '554' }],
  'Star Movies HD': [{ site: 'tataplay.com', site_id: '560' }],
  'Movies Now HD': [{ site: 'tataplay.com', site_id: '562' }],
  'Romedy Now HD': [{ site: 'jiotv.com', site_id: '1401', name: 'Romedy Now' }],
  'Pogo Hindi': [{ site: 'jiotv.com', site_id: '559' }],
  'NDTV Good Times': [{ site: 'jiotv.com', site_id: '259' }],
  'TV9 Gujarati': [{ site: 'jiotv.com', site_id: '616', name: 'Tv 9 Gujarat' }],
  '1Sports HD': [{ site: 'tataplay.com', site_id: '502', name: 'Unite8 Sports 1 HD' }],
  'Zee News HD': [{ site: 'tataplay.com', site_id: '1497' }],
  'Zee Zest HD': [{ site: 'tataplay.com', site_id: '504', name: 'Zee Zest' }],
  'Zee Zest': [{ site: 'tataplay.com', site_id: '504', name: 'Zee Zest' }],
  'Times Now HD': [{ site: 'jiotv.com', site_id: '486' }],
  'Star Sports 3': [{ site: 'tataplay.com', site_id: '664' }],
  'News18 Gujarati': [{ site: 'jiotv.com', site_id: '620' }],
  'Nick Jr': [{ site: 'jiotv.com', site_id: '544' }],
  'National Geographic HD': [{ site: 'jiotv.com', site_id: '248' }],
  'SET HD': [{ site: 'tataplay.com', site_id: '15' }, { site: 'jiotv.com', site_id: '291' }],
  'Sony SAB HD': [{ site: 'tataplay.com', site_id: '48' }, { site: 'jiotv.com', site_id: '471' }],
};

function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

async function fetchSiteChannels(site) {
  const url = `https://raw.githubusercontent.com/iptv-org/epg/master/sites/${site}/${site}.channels.xml`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const text = await res.text();
  const rows = [];
  for (const m of text.matchAll(/<channel site="([^"]+)" site_id="([^"]+)"[^>]*>([^<]*)<\/channel>/g)) {
    rows.push({ site: m[1], site_id: m[2], name: m[3].trim() });
  }
  return rows;
}

function score(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.92;
  let matches = 0;
  const wa = a.toLowerCase().split(/\s+/);
  const wb = b.toLowerCase().split(/\s+/);
  for (const w of wa) if (wb.some((x) => x.includes(w) || w.includes(x))) matches++;
  return matches / Math.max(wa.length, wb.length);
}

async function main() {
  const siteData = {};
  for (const site of SITES) siteData[site] = await fetchSiteChannels(site);

  const seen = new Set();
  const targets = [];
  for (const t of TARGETS) {
    if (seen.has(t)) continue;
    seen.add(t);
    targets.push(t);
    if (targets.length >= 300) break;
  }

  const channels = [];

  for (const id of targets) {
    let sources = MANUAL[id];
    if (!sources) {
      let best = null;
      for (const site of SITES) {
        for (const row of siteData[site]) {
          const sc = score(id, row.name);
          if (!best || sc > best.sc) best = { ...row, sc };
        }
      }
      if (best && best.sc >= 0.78) {
        sources = [{ site: best.site, site_id: best.site_id, name: best.name }];
      }
    }
    if (!sources?.length) continue;
    const deduped = [];
    const seenKey = new Set();
    for (const s of sources) {
      const key = `${s.site}:${s.site_id}`;
      if (seenKey.has(key)) continue;
      seenKey.add(key);
      deduped.push(s);
    }
    const aliases = [...new Set([id, ...(ALIASES[id] || [])])];
    channels.push({ id, aliases, sources: deduped });
  }

  const out = { version: 3, lang: 'hi', max_hours: 24, timezone: '+0530', channels };
  fs.writeFileSync(path.join(root, 'channels/mapping.json'), `${JSON.stringify(out, null, 2)}\n`);
  console.log(`mapping.json: ${channels.length} channels (target cap 300)`);
}

main();