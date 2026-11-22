# Closet Scout

A personal stylist for second-hand shopping. Closet Scout learns your size, body and taste,
writes Vinted searches that fit you, keeps your new-item alerts up to date and checks a listing
before you buy. It's a web app that installs on the iPhone Home Screen (PWA), in English and Spanish.

*Closet Scout is not affiliated with, endorsed by or connected to Vinted.*

## How it works

| Screen | What it does |
|---|---|
| **Fit** | Height, weight, usual sizes and optional body measurements. Claude turns them into a size cheat-sheet and the flat measurements to ask sellers for. |
| **Style** | Style and colour chips, a never-list, favourite brands (plus similar brands from Claude), Instagram stylists you follow, and a short "My wardrobe" list. |
| **Looks** | Upload outfit photos or screenshots; Claude extracts pieces, colours and silhouettes into your *style DNA*. An optional photo step suggests body shape and a colour palette. |
| **Find** | About 12 tailored Vinted searches with price limit, size tip and an "Open on Vinted" link, plus an instant quick search. |
| **Fresh finds** | The 5–10 searches worth saving as **Vinted alerts**. You save each once in the Vinted app (bell icon) and Vinted notifies you about new matching items. When your profile changes, the app shows which alerts to add or remove. |
| **Check** | A screenshot or the text of a listing → *Buy it / Maybe: ask first / Skip*, with fit and style scores, what it goes with, and questions for the seller. Keep the good ones in a shortlist. |

**Why alerts instead of an in-app feed?** Vinted has no public API and its terms don't allow
automated reading of the site, so Closet Scout never reads Vinted. It only builds normal search
links. Vinted's own saved-search notifications are the reliable way to hear about new items.
All Vinted logic lives in `src/lib/vinted.ts`, so an official API could replace the hand-off later.

## Privacy

- **No account, no server of ours.** The profile, shortlist and the user's Anthropic key are stored
  only on the device (IndexedDB).
- **Bring your own key.** Claude features call the Anthropic API directly from the browser with the
  user's own key (`dangerouslyAllowBrowser`, the documented bring-your-own-key setup). Photos are
  downscaled, sent for that one request and never stored.
- **Strict Content-Security-Policy** (`index.html`): scripts only from this site, network only to
  `api.anthropic.com`, fonts self-hosted, no trackers or analytics.
- **Backups** (`Settings → Backup`) are a JSON file and never include the key.

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (Vinted links, sizes, alerts, storage)
npm run build      # type-check + production build into dist/
npm run e2e        # after build: clicks through the app on an iPhone-sized screen, Claude mocked
npm run icons      # re-render PNG icons from public/brand/closet-scout-app-icon.svg
```

`npm run e2e` and `npm run icons` use a locally installed Playwright with Chromium.

Claude models: **Opus 5.5** (default), Sonnet 5.5, Haiku 5.5, chosen in Settings. Answers are
validated JSON (`messages.parse` + Zod schemas in `src/lib/schemas.ts`). Opus and Sonnet requests use
the server-side refusal fallback.

## Deploy (Cloudflare Pages, free)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → choose this repository.
2. Build command `npm run build`, output directory `dist`, production branch `main`.
3. Deploy. The site is public at `https://<project>.pages.dev`; add a custom domain later if wanted.

No environment variables or secrets are needed: every user brings their own Anthropic key.

## Brand

Colours, type, logo and components come from the **Closet Scout brand book** (a design-system page
on claude.ai). `src/styles/tokens.css` is generated from its `tokens.json`; `public/brand/` holds the
logo and app-icon SVGs. Voice: a warm, honest stylist; plain words; always explain why; no emoji.

## Project layout

```
src/
  lib/        vinted.ts · sizes.ts · alerts.ts · store.ts · claude.ts · prompts.ts · schemas.ts · images.ts · i18n.ts
  data/       catalog.ts (items, styles, colours) · knowledge.ts (stylist reference fed to Claude)
  screens/    Onboarding · Fit · Style · Looks · Find · Fresh · Check · Settings · About
  components/ ui.tsx · ImagePicker.tsx
  styles/     tokens.css · components.css · app.css
docs/stylist-knowledge.md   sources behind the stylist reference
```
