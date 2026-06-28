# EPG-directory

Daily **Hindi XMLTV** TV guide for IPTV players.

- **Public EPG sources only** — [iptv-org/epg](https://github.com/iptv-org/epg) (Tata Play, Dish TV, JioTV, Airtel Xstream)
- **~300 Hindi channels** — GEC, news, sports, kids, lifestyle
- **24-hour window** — small file size
- **Fully automatic** — builds every morning, no manual steps

## Player URL

```
https://tinyredphoenix.github.io/EPG-directory/epg.xml
```

Compressed:

```
https://tinyredphoenix.github.io/EPG-directory/epg.xml.gz
```

In TiviMate: **Settings → EPG → paste URL → Update EPG**.  
Assign the EPG source to your playlist if prompted.

**Important:** `tvg-id` in your playlist must match `id` in this guide exactly (e.g. `Star Plus HD`).

## Schedule

Every day at **06:00 IST** (00:30 UTC).  
Manual run: **Actions → Daily Hindi EPG → Run workflow**.

## Customize channels

Edit `channels/mapping.json` then commit — next run picks it up.

Or regenerate from the target list:

```bash
node scripts/build-mapping.mjs
node scripts/generate-grab-xml.mjs
```

## Stats

After each build: `https://tinyredphoenix.github.io/EPG-directory/meta.json`