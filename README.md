# Stray – Water Tracker

Stray is a water tracker where every drink fills a cat up in its own color.
Built with React 19, TypeScript, Vite and React Router, plus a small Hono API server.
The app is translated into 12 languages.

```sh
npm install
npm run dev      # app + API with hot reload, http://localhost:5173
npm run build    # type-check and build the app into dist/
npm start        # production server: API + dist/, http://localhost:3000
```

Needs Node 22.18 or newer (the server runs its TypeScript directly, no compile step).

## Screens

| Route | Screen |
| --- | --- |
| `/` | Welcome: animated multi-drink fill, tap Stray to replay |
| `/units` | ml / oz picker (bottom sheet) |
| `/first-sip` | Empty Stray, tap the glass |
| `/first-sip/pour` | Drag inside the glass to pour (or use presets / arrow keys) |
| `/first-sip/done` | First sip added |
| `/reminders` | Smart reminders preview |
| `/weekly-read` | Weekly AI read opt-in (onboarding) |
| `/week` | Your weekly read, opened from Home |
| `/home` | Daily tracker: drink picker, pour sheet, undo, streak ring |

## Layout

- `src/screens/`: one component per screen
- `src/components/`: waves, liquid layers, drink picker, pour sheet, streak ring, icons
- `src/hooks/usePourDrag.ts`: drag-to-pour slider (rAF easing, writes to the DOM while dragging)
- `src/lib/`: units (stored in ml, shown in ml or oz), drinks and colors, localStorage persistence
- `src/i18n/`: copy for every language. `en.ts` defines the shape; the other locales must match it
- `server/`: the API (`app.ts`), its rate limits and cache (`guards.ts`), the Gemini call (`weeklyRead.ts`)
  and the production entry point (`index.ts`)

All drink data lives in `localStorage` under `stray.*` keys.

## Demo mode

To show a full week without waiting for one, open Settings on Home and tap **Load demo week**.
It writes six realistic past days into your real log, scaled to your goal: four goal days
in a row, one miss with a late catch-up. The streak, chart and AI read all then run on
that data. Today is left empty so you can log drinks live. **Remove demo week** deletes
those six days again.

**Reset all data** (tap twice) erases everything the app saved in this browser (drinks,
goal, units, language) and returns to the Welcome screen as a brand-new user. Only the
demo setting survives, so the demo buttons stay available for the next run-through.

The button is always there in `npm run dev`. On a deployed build, open the app once with
`?demo` (for example `https://<your-app>/home?demo`) to turn it on in that browser, and
`?demo=off` to hide it.

## Stray's weekly read (Gemini)

The Weekly read screen asks Gemini for two comments and one suggestion about the
week, or about a single day when you tap its bar. It uses your last 7 days, or the
example week if you haven't logged anything yet. Days before your first log are faded
and left out of the read, so a new user isn't told they skipped days they weren't tracking.

1. Get a key at https://aistudio.google.com/apikey
2. `cp .env.example .env` and set `GEMINI_API_KEY`
3. Restart `npm run dev`

The key is only read on the server and never bundled into the app. The default model is
`gemini-3.5-flash-lite`; set `GEMINI_MODEL` to change it.

## API

| Route | |
| --- | --- |
| `GET /api/health` | `{ ok, ai }`, where `ai` says whether a Gemini key is set |
| `POST /api/weekly-read` | Stray's read of a week or day. Body is `WeeklyReadRequest` in `src/lib/weeklyReadTypes.ts` |

The same API runs in `npm run dev`, `npm run preview` and `npm start`. Because it spends
your Gemini key, `/api/weekly-read` is protected:

- **Validation:** requests are checked against the zod schema shared with the app; unknown fields are dropped.
- **Per-IP limit:** 30 requests per 10 minutes.
- **Daily budget:** at most `GEMINI_DAILY_LIMIT` (default 500) Gemini calls per UTC day, across everyone.
- **Cache:** identical requests reuse the result for 24 hours, and concurrent duplicates share one call.
  The example week is the same for every new user, so after the first visitor it loads instantly.

These live in memory, so they reset on restart and assume a single server instance.

## Deploy

Any host that runs Node works (Render, Railway, Fly.io, a VPS) as a single web service:

- **Build command:** `npm ci && npm run build`
- **Start command:** `npm start`
- **Environment:** `GEMINI_API_KEY`, and `TRUST_PROXY=1` so rate limits apply per user rather
  than to the host's proxy. `PORT` is usually set by the host.

Check `https://<your-app>/api/health` after deploying. Free tiers that sleep when idle take
a while to wake up, so open the app a minute before you demo it.
