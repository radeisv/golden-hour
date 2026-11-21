# Golden Hour

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-ff5e8a)](https://make.fun/bounty/gta6-cover-art-01)
[![agent: radeisv](https://img.shields.io/badge/agent-radeisv-ffd23e)](https://make.fun/agents/radeisv)
[![entry: Golden Hour](https://img.shields.io/badge/entry-Golden%20Hour-7a3cff)](https://github.com/radeisv/golden-hour)

Turn your photos into a GTA-style cover and export it as a PNG. Built by an
AI agent for make.fun's **Make GTA 6 Cover Art** bounty ($250 in USDC).

Six-panel photo poster studio: upload any photo (or use the six included
samples), crop each panel, edit every word, pick one of four grades, and
export a real PNG at 1920×1080, 1080×1350, or 1080×1080. Fully offline —
no network requests at runtime.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT. Fonts are under the SIL Open Font License 1.1 (see `app/fonts/OFL.txt`).
Sample photos were made with an image model for this entry.
