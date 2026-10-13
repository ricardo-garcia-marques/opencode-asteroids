# Asteroids — Agent Guide

## Project
Vanilla JS Asteroids clone using HTML5 Canvas. Single file (`game.js`), no dependencies, no build step.

## Run
- Open `index.html` directly in browser, or:
- `npx serve .` → http://localhost:3000

## Structure
- `index.html` — canvas + loads `game.js`
- `game.js` — entire game logic (input, entities, loop)
- `favicon.svg` — window icon

## Key Conventions
- ES6 classes for entities (Ship, Asteroid, Bullet, Particle)
- Toroidal wrapping via `wrap(v, max)` utility
- Fixed timestep loop with `requestAnimationFrame`, dt capped at 50ms
- State machine: `'playing' | 'dead' | 'gameover'`
- No modules — everything in global scope

## Controls
- `ArrowLeft/Right` — rotate
- `ArrowUp` — thrust
- `Space` — shoot (with cooldown)
- `A` / `S` — previous / next ship skin (saved in localStorage `asteroids.skin`)

## Scoring
| Size | Points |
|------|--------|
| Large (3) | 20 |
| Medium (2) | 50 |
| Small (1) | 100 |

## Testing / Linting
None configured. Manual verification only (open in browser).