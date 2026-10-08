# Ribbit 🐸

A browser-based party game hub. First game: **Stick Grow** (1–12 players).

## Run

Requires Node.js 20+.

```bash
npm install
npm start
```

Open http://localhost:3000 on a laptop/TV, choose **Launch game**, then open the same address on each player's phone, select **Join room**, and enter the five-character code. For phones on the same Wi-Fi, use the computer's LAN IP instead of localhost. For internet play, deploy the Node.js app to a hosting service that supports persistent WebSocket connections (not static GitHub Pages).

## Stick Grow rules

- Each race gives everyone the same 7 letters (exactly 2 vowels, 5 consonants).
- Letters can repeat within words and across submissions. Each *distinct* word scores once per player per race.
- The server checks submitted words against the installed English word list.
- The seven-letter sets are selected from 10-letter dictionary words, guaranteeing at least one 10-letter solution for each set.
- Word score is its length; the first valid word of 10 or more letters unlocks **permanent 2× word-length scoring**, including that word.
- First to **180** growth points wins.
- Each player gets one **Snap** (−15 points to a rival) and one **Freeze** (5 seconds) per race.
- Host can start and reset games.

## Notes

This is an MVP. Rooms are in memory and disappear on server restart; no user accounts or persistent leaderboards. The word list is broad and may contain obscure words; curate it for production. The app currently has one game card, designed for more games later.
