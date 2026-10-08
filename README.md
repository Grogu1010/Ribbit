# Ribbit 🐸

Ribbit is a Netlify-hosted party-game hub. Its first game, **Stick Grow**, supports 1–12 players using phones as controllers.

## Setup (no local Node.js required)

1. Connect this GitHub repository to **Netlify**. The included `netlify.toml` sets the publish directory to `public` and routes `/` to the homepage. Leave the build command empty.
2. Open [Supabase SQL Editor](https://supabase.com/dashboard) for your project, create a new query, copy **all of [supabase/setup.sql](supabase/setup.sql)** into it, and click **Run**. This creates tables, secure database actions, a starter word dictionary, and realtime publication.
3. Netlify should redeploy automatically after the GitHub commits. If not, choose **Deploys → Trigger deploy**.
4. Visit the Netlify URL, choose **Launch game (TV)**, and create a room. Players can visit the same URL, join with the five-character room code, and race.

The public Supabase URL and **publishable** key are configured in `public/Stick_Grow/stick_grow.js`. These are safe for client-side use. **Never put a Supabase secret/service-role key or database password in this repository.**

## How multiplayer works

Netlify serves HTML/CSS/JS. The browser connects to Supabase directly. The database function `ribbit_action` validates all game actions and is the only path for score updates. A room-updates table publishes realtime ticks, and clients fetch sanitized room state through the RPC. The game also polls every four seconds as a fallback.

Each round gives seven letters (two vowels, five consonants) with a known 10-letter word. Players may reuse letters within a word, but each distinct word scores only once per player. First valid 10-letter word enables permanent 2× scoring. First to 180 wins. Each player can use Snap (−15) and Freeze (5 seconds) once per race.

## Current limitations

The SQL includes a **small starter dictionary**, not the full English dictionary. More words must be imported into `public.ribbit_words` before general release. There are currently two letter pools: `BEKOPRS` (BOOKKEEPER) and `ACDORST` (CROSSROADS). Room codes are public and room state is visible to anyone who knows the code; host and player action tokens are stored in sessionStorage. There is no login, anti-spam throttling, cleanup of expired rooms, or automated multiplayer test suite yet. The old `server.js` and `package.json` are retained as legacy Node/Socket.IO files but **are not used by Netlify**.
