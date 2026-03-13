# Rising Habit Hero

A gamified habit tracker inspired by isekai progression systems.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Gameplay loop

- Complete quests to gain XP, restore Shield Integrity, and level up.
- Missing quests reduces XP and Shield Integrity.
- If Shield Integrity gets too low, your hero can lose a level.
- Progress is saved in `localStorage`.
