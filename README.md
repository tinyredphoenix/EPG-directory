# EPG-directory

Standalone daily **Hindi XMLTV** guide for IPTV players (TiviMate, etc.).

- **No app code** — not linked to any IPTV server, proxy, or provider APK project
- **Public sources only** — programme data via [iptv-org/epg](https://github.com/iptv-org/epg) (Tata Play, Dish TV, JioTV, Airtel Xstream site configs)
- **~100 Hindi channels** — curated map to common playlist `tvg-id` display names
- **24-hour window** — keeps the file small
- **Fully passive** — GitHub Actions runs every morning; player fetches the published URL

## TiviMate EPG URL

After GitHub Pages is enabled:

```
https://tinyredphoenix.github.io/EPG-directory/epg.xml
```

Compressed (optional):

```
https://tinyredphoenix.github.io/EPG-directory/epg.xml.gz
```

Paste into **Settings → EPG → URL** in TiviMate. No app changes required.

## Schedule

Daily at **06:00 IST** (00:30 UTC).

Manual run: **Actions → Daily Hindi EPG → Run workflow**.

## Customize channels

Edit `channels/mapping.json`:

- `id` — must match your playlist `tvg-id` (display name, e.g. `Star Plus HD`)
- `aliases` — extra names that receive the same programmes (F1/F2 duplicates)
- `sources` — public iptv-org site + `site_id` only

Then commit; next scheduled run picks it up.

## Local test

```bash
node scripts/generate-grab-xml.mjs
# after grab output in raw/*.xml:
node scripts/remap-trim.mjs ./raw
```

## Privacy / isolation

This repo contains **no** streaming URLs, decryption keys, Firebase configs, Truth snapshots, or upstream APK references.