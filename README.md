# Rising Habit Hero

A gamified habit tracker with an anime-inspired progression aesthetic.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Gameplay loop

- Complete quests to gain XP, restore Shield Integrity, and level up.
- Each level maps to a famous anime character, from starter magical heroes up to universe-tier icons.
- Missing quests reduces XP and Shield Integrity.
- If Shield Integrity gets too low, your hero can lose a level.
- Progress is saved in `localStorage`.

## CSV tools

- **Export CSV** downloads your current profile stats and quest list.
- **Import CSV** restores profile stats and quests from a previously exported file.
