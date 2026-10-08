# Ribbit 🐸

Ribbit is a Netlify-hosted game hub. It currently includes **Stick Grow**, a 1–12 player phone-controller party game, and **Object²**, a 70-level visual transformation puzzle.

## Setup (no local Node.js required)

1. Connect this GitHub repository to **Netlify**. The included `netlify.toml` sets the publish directory to `public` and routes `/` to the homepage. Leave the build command empty.
2. Open the **Supabase SQL Editor**, create a new query, copy all of `supabase/setup.sql`, and run it once.
3. If you already installed the original database setup, also run **`supabase/stick_grow_v2.sql`** once. This applies the faster Stick Grow v2 scoring and 60-point finish line.
4. Netlify should redeploy automatically after GitHub commits. If not, choose **Deploys → Trigger deploy**.
5. Visit the Netlify URL. Stick Grow uses a host screen plus phones; Object² runs directly in the browser.

The public Supabase URL and **publishable** key are configured in `public/Stick_Grow/stick_grow.js`. Those values are intended for client-side use. **Never put a Supabase secret/service-role key or database password in this repository.**

## Object²

- 70 object-to-object transformations.
- Four tools: **Rotate, Warp, Stretch, and Fisheye**.
- The first two source levels use the supplied water-bottle and chair photos.
- Other object art uses Twemoji (CC-BY 4.0) with native emoji fallbacks.
- Similarity scoring, hints, shuffle, stars, and solved-level progress stored locally in the browser.
- Game files live in `public/Object2/`.

## Stick Grow v2

- Host lobby has a QR join code, direct join link, player list, and TV-friendly layout.
- The race uses animated growing sticks instead of plain progress bars.
- Live events call out big words, Snaps, Freezes, and 2× unlocks.
- Player controllers show rank, personal stick growth, 2× status, freeze effects, and large sabotage controls.
- First to **60 growth** wins.
- 2–4 letter words score their length.
- 5–6 letter words get a +3 bonus.
- 7–8 letter words get a +7 total bonus.
- 9+ letter words get a +12 total bonus.
- A valid 10+ letter word activates permanent **2× growth**, including the triggering word.
- Snap removes **10 growth** and Freeze blocks word submissions for **5 seconds**; each can be used once per race.

## How multiplayer works

Netlify serves the HTML/CSS/JS. Browsers connect directly to Supabase. The `ribbit_action` database function validates game actions and is the only path for score changes. A tiny room-updates table publishes realtime ticks, and clients then fetch sanitized room state through the RPC. The frontend also polls every four seconds as a fallback.

## Current limitations

The SQL still includes a **small starter dictionary**, not a full production English dictionary. More words should be imported into `public.ribbit_words` before a wider release. There are currently two letter pools: `BEKOPRS` (BOOKKEEPER) and `ACDORST` (CROSSROADS). Room codes are public and room state is visible to anyone who knows the code; host and player action tokens are stored in sessionStorage. There is no login, anti-spam throttling, cleanup of expired rooms, or automated multiplayer test suite yet. The old `server.js` and `package.json` are retained as legacy Node/Socket.IO files but **are not used by Netlify**.
