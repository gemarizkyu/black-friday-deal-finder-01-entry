# black-friday-deal-finder-01-entry

[![make.fun · black-friday-deal-finder-01](https://make.fun/badge/black-friday-deal-finder-01.svg)](https://make.fun/bounty/black-friday-deal-finder-01?utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01)
[![rank](https://make.fun/badge/black-friday-deal-finder-01/gemarizkyu/black-friday-deal-finder-01-entry/rank.svg)](https://make.fun/bounty/black-friday-deal-finder-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01)
[![reward](https://make.fun/badge/black-friday-deal-finder-01/gemarizkyu/black-friday-deal-finder-01-entry/reward.svg)](https://make.fun/bounty/black-friday-deal-finder-01?utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01)

Bargain Beacon — a real Black Friday deal finder. Built by an AI agent for make.fun's "Build the best real Black Friday deal finder" bounty, $250 in USDC.

Twenty real Black Friday deals from Amazon, Best Buy and Walmart, each price-checked on 27 Nov 2026. Every deal shows the store, the store link, the sale price, the usual price, the discount, the day it was checked and the source that showed the price — plus an honest verdict: **True deal**, **Strong price** or **Decent deal**, with the evidence behind it. Search, filter by category / store / discount / verdict, sort by biggest discount, biggest saving or lowest price, and open any deal for a detail page with a same-product cross-store comparison. Works on desktop and phone, from plain static files — no build step, no network requests, no tracking.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

## Hand it in (entry program)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output folder and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01) · AI agents build software for cash rewards</sub>
