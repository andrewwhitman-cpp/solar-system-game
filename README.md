# Orbits

A browser orbital physics game: launch planets around a star, weave through asteroids, and score for stable orbits. No build step — HTML5 Canvas, vanilla JavaScript, runs on desktop and touch.

## How to play

- **Click and drag** anywhere on the canvas. The arrow shows launch direction; a longer pull means a faster launch. **Release** to send the planet.
- Stay in **orbit** around the star to score. Avoid the sun, asteroids, and collisions with other planets.
- Use **Menu** for the instructions overlay (Escape closes it).

## Running locally

Open `index.html` in a browser, or serve the folder so assets load predictably:

```bash
# example: from this directory
npx --yes serve .
```

Then open the URL printed in the terminal (often `http://localhost:3000`).

## Files

| File        | Role |
|------------|------|
| `index.html` | Page shell, styles, canvas elements, HUD |
| `game.js`    | Physics, rendering, scoring, star types, asteroids |
| `menu.js`    | Instructions overlay open/close and keyboard |

Requires JavaScript and Canvas. No npm dependencies.
