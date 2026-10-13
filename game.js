'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Skins ─────────────────────────────────────────────────────────────────────
const SKINS = [
  { name: 'Clásica', color: '#fff', flame: 'rgba(255,130,0,0.85)', tail: -7,
    shape: [[20, 0], [-12, -9], [-7, 0], [-12, 9]] },
  { name: 'Neón', color: '#0ff', glow: '#0ff', flame: 'rgba(255,0,200,0.85)', tail: -8,
    shape: [[20, 0], [-10, -7], [-8, 0], [-10, 7]] },
  { name: 'Rubí', color: '#f33', flame: 'rgba(255,220,0,0.85)', tail: -6,
    shape: [[20, 0], [4, -5], [-12, -13], [-6, 0], [-12, 13], [4, 5]] },
  { name: 'Dorada', color: '#fc0', glow: '#fa0', fill: 'rgba(255,200,0,0.25)',
    flame: 'rgba(120,200,255,0.85)', tail: -10,
    shape: [[20, 0], [0, -6], [-10, 0], [0, 6]] },
  { name: 'Morada', color: '#a020f0', glow: '#a020f0', flame: 'rgba(200,120,255,0.85)',
    tail: -14, scale: 2, scoreMultiplier: 2,
    shape: [[20, 0], [-12, -9], [-7, 0], [-12, 9]] },
];
const SKIN_KEY = 'asteroids.skin';
let skinIndex = 0;
try {
  const v = parseInt(localStorage.getItem(SKIN_KEY), 10);
  if (v >= 0 && v < SKINS.length) skinIndex = v;
} catch (e) {}

function cycleSkin(dir) {
  skinIndex = (skinIndex + dir + SKINS.length) % SKINS.length;
  try { localStorage.setItem(SKIN_KEY, skinIndex); } catch (e) {}
}

const skinScale      = () => SKINS[skinIndex].scale || 1;
const scoreMultiplier = () => SKINS[skinIndex].scoreMultiplier || 1;

function addScore(points) { score += points * scoreMultiplier(); }

function traceShape(shape, scale = 1) {
  ctx.beginPath();
  shape.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * scale, y * scale);
    else ctx.lineTo(x * scale, y * scale);
  });
  ctx.closePath();
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const BONUS_POINTS = 250;

class ShootingStar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 22;
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = rand(160, 280);   // ~2-3x la velocidad de un asteroide normal
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-2, 2);
    this.rot = rand(0, Math.PI * 2);

    this.ttl    = rand(5, 8);       // desaparece con el tiempo
    this.maxTtl = this.ttl;

    // Estrella de 5 puntas
    const spikes = 5;
    this.verts = [];
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? this.radius : this.radius * 0.45;
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }

    this.trail = [];
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;

    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 12) this.trail.pop();

    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por expirar
    if (this.ttl < 1.5 && Math.floor(this.ttl * 10) % 2 === 0) return;

    // Estela
    for (let i = 1; i < this.trail.length; i++) {
      const t     = this.trail[i];
      const frac  = 1 - i / this.trail.length;
      const alpha = frac * 0.5;
      ctx.fillStyle = `rgba(120,220,255,${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * frac * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.shadowColor = '#7df';
    ctx.shadowBlur  = 16;
    ctx.strokeStyle = '#bff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.thrusting       = false;
    this.invincible      = 3;
    this.shootCooldown   = 0;
    this.speedBoostTimer = 0;
    this.tripleTimer     = 0;
    this.shieldTimer     = 0;
    this.dead            = false;
  }

  get shielded() { return this.shieldTimer > 0; }

  get scale()  { return skinScale(); }
  get radius() { return 12 * this.scale; }

  update(dt) {
    if (this.dead) return;
    if (this.invincible       > 0) this.invincible       -= dt;
    if (this.shootCooldown    > 0) this.shootCooldown    -= dt;
    if (this.speedBoostTimer  > 0) this.speedBoostTimer  -= dt;
    if (this.tripleTimer      > 0) this.tripleTimer      -= dt;
    if (this.shieldTimer      > 0) this.shieldTimer      -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = this.speedBoostTimer > 0 ? 520 : 260;
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21 * this.scale;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer > 0) {
      const SPREAD = 0.21;   // ~12°
      return [-SPREAD, 0, SPREAD].map(d => new Bullet(ox, oy, this.angle + d));
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    const skin = SKINS[skinIndex];
    const scale = this.scale;
    if (this.shielded && !(this.shieldTimer < 2 && Math.floor(this.shieldTimer * 8) % 2 === 0)) {
      ctx.save();
      ctx.strokeStyle = '#4f8';
      ctx.shadowColor = '#4f8';
      ctx.shadowBlur  = 12;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 20 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(scale, scale);
    ctx.strokeStyle = skin.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    if (skin.glow) { ctx.shadowColor = skin.glow; ctx.shadowBlur = 12; }

    traceShape(skin.shape);
    if (skin.fill) { ctx.fillStyle = skin.fill; ctx.fill(); }
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      const t = skin.tail;
      ctx.beginPath();
      ctx.moveTo(t - 1, -4);
      ctx.lineTo(t - 1 - rand(6, 14), 0);
      ctx.lineTo(t - 1,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '255,255,255', speedMin = 30, speedMax = 130) {
    this.x  = x;
    this.y  = y;
    this.color = color;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(speedMin, speedMax);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${this.color},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups ─────────────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 8;
    this.size = 7;               // mitad del lado del cuadrado
    this.ttl = 10;
    this.dead = false;
    const angle = rand(0, Math.PI * 2);
    const speed = 35 + rand(-8, 8);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rot = rand(0, Math.PI * 2);
    this.rotSpeed = (rand(0, 1) < 0.5 ? -1 : 1) * rand(1.5, 3);
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    if (this.ttl < 1.5 && Math.floor(this.ttl * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (this.type === 'shield') {
      ctx.strokeStyle = '#4f8';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, -3);
      ctx.lineTo(0, -5);
      ctx.lineTo(4, -3);
      ctx.lineTo(3, 2);
      ctx.lineTo(0, 5);
      ctx.lineTo(-3, 2);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.strokeStyle = this.type === 'triple' ? '#f80' : '#0ff';

    // Cuadrado
    const s = this.size;
    ctx.strokeRect(-s, -s, s * 2, s * 2);

    ctx.beginPath();
    if (this.type === 'triple') {
      // Abanico de tres líneas
      ctx.moveTo(0, 5); ctx.lineTo(-5, -5);
      ctx.moveTo(0, 5); ctx.lineTo(0, -6);
      ctx.moveTo(0, 5); ctx.lineTo(5, -5);
    } else {
      // "V" con vértice hacia abajo
      ctx.moveTo(-7, -7);
      ctx.lineTo(0, 7);
      ctx.lineTo(7, -7);
    }
    ctx.stroke();

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups, shootingStars;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let shootingStarTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  const edge = randInt(0, 3);
  let x, y;
  if      (edge === 0) { x = rand(0, W); y = 0; }
  else if (edge === 1) { x = W; y = rand(0, H); }
  else if (edge === 2) { x = rand(0, W); y = H; }
  else                 { x = 0; y = rand(0, H); }
  shootingStars.push(new ShootingStar(x, y));
}

function initGame() {
  ship          = new Ship();
  bullets       = [];
  asteroids     = [];
  particles     = [];
  powerups      = [];
  shootingStars = [];
  score         = 0;
  lives         = 3;
  level         = 1;
  state         = 'playing';
  shootingStarTimer = rand(8, 16);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets       = [];
  particles     = [];
  powerups      = [];
  shootingStars = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function explodeBonus(x, y) {
  for (let i = 0; i < 24; i++)
    particles.push(new Particle(x, y, '120,220,255', 60, 220));
}

function absorbHit(obj) {
  ship.shieldTimer = 0;
  obj.dead = true;
  if (obj instanceof Asteroid) addScore(POINTS[obj.size]);
  for (let i = 0; i < 16; i++)
    particles.push(new Particle(obj.x, obj.y, '80,255,136', 60, 180));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (pressed('KeyS')) cycleSkin(1);
  if (pressed('KeyA')) cycleSkin(-1);

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  shootingStars.forEach(s => s.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets       = bullets.filter(b => !b.dead);
  particles     = particles.filter(p => !p.dead);
  powerups      = powerups.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Estrella fugaz aleatoria
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    spawnShootingStar();
    shootingStarTimer = rand(8, 16);
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        addScore(POINTS[a.size]);
        explode(a.x, a.y, a.size * 5);
        // Chance de que un asteroide grande libere una estrella fugaz
        if (a.size === 3 && Math.random() < 0.1) {
          shootingStars.push(new ShootingStar(a.x, a.y));
          newAsteroids.push(a.split()[0]);
        } else {
          newAsteroids.push(...a.split());
        }
        const r = Math.random();
        if (r < 0.15) {
          powerups.push(new PowerUp(a.x, a.y, Math.random() < 0.5 ? 'speed' : 'triple'));
        } else if (r < 0.23) {
          powerups.push(new PowerUp(a.x, a.y, 'shield'));
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius * 0.85) {
        b.dead = true;
        s.dead = true;
        addScore(BONUS_POINTS);
        explodeBonus(s.x, s.y);
      }
    }
  }
  bullets       = bullets.filter(b => !b.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Nave vs power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'triple') ship.tripleTimer = 5;
      else if (p.type === 'shield') ship.shieldTimer = 10;
      else ship.speedBoostTimer = 5;
    }
  }

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      const reach = ship.shielded ? 20 + a.radius * 0.82 : ship.radius + a.radius * 0.82;
      if (dist(ship, a) < reach) {
        if (ship.shielded) {
          absorbHit(a);
          asteroids = asteroids.filter(x => !x.dead).concat(a.split());
        } else killShip();
        break;
      }
    }
  }

  // Nave vs estrella fugaz
  if (ship.invincible <= 0 && !ship.dead) {
    for (const s of shootingStars) {
      const reach = ship.shielded ? 20 + s.radius * 0.7 : ship.radius + s.radius * 0.7;
      if (dist(ship, s) < reach) {
        if (ship.shielded) absorbHit(s);
        else killShip();
        break;
      }
    }
    shootingStars = shootingStars.filter(s => !s.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  const skin = SKINS[skinIndex];
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  traceShape(skin.shape, 0.45);
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  ctx.textAlign = 'left';
  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`SKIN: ${SKINS[skinIndex].name}  [A/S]`, 14, H - 12);
  ctx.font = '15px monospace';

  if (ship.speedBoostTimer > 0) {
    const t = ship.speedBoostTimer.toFixed(1);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`VEL x2: ${t}s`, 14, 46);
    const barW = 100;
    const barH = 6;
    const x = 14;
    const y = 50;
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barW, barH);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(x, y, barW * (ship.speedBoostTimer / 5), barH);
  }

  let hudOy = ship.speedBoostTimer > 0 ? 30 : 0;
  if (ship.tripleTimer > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f80';
    ctx.fillText(`TRIPLE: ${ship.tripleTimer.toFixed(1)}s`, 14, 46 + hudOy);
    ctx.strokeStyle = '#f80';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 50 + hudOy, 100, 6);
    ctx.fillRect(14, 50 + hudOy, 100 * (ship.tripleTimer / 5), 6);
    hudOy += 30;
  }

  if (ship.shielded) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4f8';
    ctx.fillText(`ESCUDO: ${ship.shieldTimer.toFixed(1)}s`, 14, 46 + hudOy);
    ctx.strokeStyle = '#4f8';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 50 + hudOy, 100, 6);
    ctx.fillRect(14, 50 + hudOy, 100 * (ship.shieldTimer / 10), 6);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  shootingStars.forEach(s => s.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
