const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  healthBar: document.getElementById("healthBar"),
  staminaBar: document.getElementById("staminaBar"),
  roomNumber: document.getElementById("roomNumber"),
  souls: document.getElementById("souls"),
  startScreen: document.getElementById("startScreen"),
  upgradeScreen: document.getElementById("upgradeScreen"),
  gameOverScreen: document.getElementById("gameOverScreen"),
};

const keys = new Set();
let running = false;
let room = 1;
let souls = 0;
let enemies = [];
let particles = [];
let lastTime = 0;

const arena = {
  x: 55,
  y: 55,
  width: canvas.width - 110,
  height: canvas.height - 110,
};

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 18,
  speed: 210,
  maxHealth: 120,
  health: 120,
  maxStamina: 100,
  stamina: 100,
  damage: 20,
  attackCooldown: 0,
  dodgeCooldown: 0,
  invulnerable: 0,
  dodgeTime: 0,
  facingX: 1,
  facingY: 0,
};

function resetRun() {
  room = 1;
  souls = 0;
  Object.assign(player, {
    x: canvas.width / 2,
    y: canvas.height / 2,
    maxHealth: 120,
    health: 120,
    maxStamina: 100,
    stamina: 100,
    damage: 20,
    attackCooldown: 0,
    dodgeCooldown: 0,
    invulnerable: 0,
    dodgeTime: 0,
  });
  spawnRoom();
  updateHud();
}

function startRun() {
  resetRun();
  ui.startScreen.classList.remove("visible");
  ui.gameOverScreen.classList.remove("visible");
  ui.upgradeScreen.classList.remove("visible");
  running = true;
}

function spawnRoom() {
  enemies = [];
  const count = Math.min(2 + room, 8);

  for (let i = 0; i < count; i++) {
    let x;
    let y;

    do {
      x = arena.x + 45 + Math.random() * (arena.width - 90);
      y = arena.y + 45 + Math.random() * (arena.height - 90);
    } while (Math.hypot(x - player.x, y - player.y) < 180);

    enemies.push({
      x,
      y,
      radius: 16,
      speed: 55 + room * 4,
      health: 30 + room * 8,
      maxHealth: 30 + room * 8,
      damage: 10 + room * 2,
      hitCooldown: 0,
      flash: 0,
    });
  }
}

function update(dt) {
  if (!running) return;

  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.dodgeTime = Math.max(0, player.dodgeTime - dt);

  let dx = 0;
  let dy = 0;

  if (keys.has("KeyW") || keys.has("ArrowUp")) dy -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) dy += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) dx += 1;

  const length = Math.hypot(dx, dy);
  if (length > 0) {
    dx /= length;
    dy /= length;
    player.facingX = dx;
    player.facingY = dy;

    const speed = player.dodgeTime > 0 ? player.speed * 2.6 : player.speed;
    player.x += dx * speed * dt;
    player.y += dy * speed * dt;
  }

  player.x = Math.max(arena.x + player.radius, Math.min(arena.x + arena.width - player.radius, player.x));
  player.y = Math.max(arena.y + player.radius, Math.min(arena.y + arena.height - player.radius, player.y));

  if (player.dodgeTime <= 0) {
    player.stamina = Math.min(player.maxStamina, player.stamina + 28 * dt);
  }

  for (const enemy of enemies) {
    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
    enemy.flash = Math.max(0, enemy.flash - dt);

    const vx = player.x - enemy.x;
    const vy = player.y - enemy.y;
    const dist = Math.hypot(vx, vy) || 1;

    enemy.x += (vx / dist) * enemy.speed * dt;
    enemy.y += (vy / dist) * enemy.speed * dt;

    if (
      dist < player.radius + enemy.radius + 3 &&
      enemy.hitCooldown <= 0 &&
      player.invulnerable <= 0
    ) {
      player.health -= enemy.damage;
      enemy.hitCooldown = 0.9;
      player.invulnerable = 0.45;
      burst(player.x, player.y, "#b73a48", 10);

      if (player.health <= 0) {
        player.health = 0;
        running = false;
        ui.gameOverScreen.classList.add("visible");
      }
    }
  }

  enemies = enemies.filter((enemy) => enemy.health > 0);

  for (const particle of particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }
  particles = particles.filter((particle) => particle.life > 0);

  if (enemies.length === 0 && running) {
    running = false;
    ui.upgradeScreen.classList.add("visible");
  }

  updateHud();
}

function attack() {
  if (!running || player.attackCooldown > 0 || player.stamina < 16) return;

  player.attackCooldown = 0.34;
  player.stamina -= 16;

  const reach = 62;
  const attackX = player.x + player.facingX * 40;
  const attackY = player.y + player.facingY * 40;

  burst(attackX, attackY, "#d6ae5d", 7);

  for (const enemy of enemies) {
    const dist = Math.hypot(enemy.x - attackX, enemy.y - attackY);
    if (dist < reach) {
      enemy.health -= player.damage;
      enemy.flash = 0.12;

      const knockX = enemy.x - player.x;
      const knockY = enemy.y - player.y;
      const knockLength = Math.hypot(knockX, knockY) || 1;
      enemy.x += (knockX / knockLength) * 20;
      enemy.y += (knockY / knockLength) * 20;

      if (enemy.health <= 0) {
        souls += 5;
        burst(enemy.x, enemy.y, "#39c786", 14);
      }
    }
  }
}

function dodge() {
  if (!running || player.dodgeCooldown > 0 || player.stamina < 25) return;
  player.dodgeCooldown = 0.75;
  player.dodgeTime = 0.22;
  player.invulnerable = 0.32;
  player.stamina -= 25;
  burst(player.x, player.y, "#8cb8d8", 8);
}

function chooseUpgrade(type) {
  if (type === "health") {
    player.maxHealth += 25;
    player.health = player.maxHealth;
  } else if (type === "damage") {
    player.damage += 5;
    player.health = Math.min(player.maxHealth, player.health + 20);
  } else if (type === "stamina") {
    player.maxStamina += 25;
    player.stamina = player.maxStamina;
  }

  room += 1;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  spawnRoom();
  ui.upgradeScreen.classList.remove("visible");
  running = true;
  updateHud();
}

function burst(x, y, color, amount) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 120;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.25 + Math.random() * 0.45,
      color,
      size: 2 + Math.random() * 4,
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#151a22");
  gradient.addColorStop(1, "#080a0e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawArena();
  drawDecorations();

  for (const enemy of enemies) drawEnemy(enemy);
  drawPlayer();

  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life * 2);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;

  requestAnimationFrame(loop);
}

function drawArena() {
  ctx.fillStyle = "#1b2028";
  ctx.fillRect(arena.x, arena.y, arena.width, arena.height);

  ctx.strokeStyle = "#4f5360";
  ctx.lineWidth = 3;
  ctx.strokeRect(arena.x, arena.y, arena.width, arena.height);

  ctx.strokeStyle = "rgba(214,174,93,.12)";
  ctx.lineWidth = 1;

  for (let x = arena.x + 40; x < arena.x + arena.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, arena.y);
    ctx.lineTo(x, arena.y + arena.height);
    ctx.stroke();
  }

  for (let y = arena.y + 40; y < arena.y + arena.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(arena.x, y);
    ctx.lineTo(arena.x + arena.width, y);
    ctx.stroke();
  }
}

function drawDecorations() {
  ctx.fillStyle = "#2b3039";
  const pillars = [
    [arena.x + 25, arena.y + 25],
    [arena.x + arena.width - 45, arena.y + 25],
    [arena.x + 25, arena.y + arena.height - 45],
    [arena.x + arena.width - 45, arena.y + arena.height - 45],
  ];

  for (const [x, y] of pillars) {
    ctx.fillRect(x, y, 20, 20);
    ctx.strokeStyle = "#6d5c3d";
    ctx.strokeRect(x, y, 20, 20);
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  if (player.invulnerable > 0) {
    ctx.globalAlpha = 0.55 + Math.sin(performance.now() * 0.03) * 0.2;
  }

  ctx.fillStyle = "#20252d";
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#d6ae5d";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#39c786";
  ctx.beginPath();
  ctx.arc(-5, -3, 3, 0, Math.PI * 2);
  ctx.arc(5, -3, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#d6ae5d";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(player.facingX * 14, player.facingY * 14);
  ctx.lineTo(player.facingX * 34, player.facingY * 34);
  ctx.stroke();

  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  ctx.fillStyle = enemy.flash > 0 ? "#e7dbcc" : "#6f2e38";
  ctx.beginPath();
  ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1a0d10";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#e4c35e";
  ctx.fillRect(-6, -4, 4, 3);
  ctx.fillRect(2, -4, 4, 3);

  const barWidth = 34;
  const ratio = enemy.health / enemy.maxHealth;
  ctx.fillStyle = "#111";
  ctx.fillRect(-barWidth / 2, -27, barWidth, 4);
  ctx.fillStyle = "#b43a48";
  ctx.fillRect(-barWidth / 2, -27, barWidth * ratio, 4);

  ctx.restore();
}

function updateHud() {
  ui.healthBar.style.width = `${(player.health / player.maxHealth) * 100}%`;
  ui.staminaBar.style.width = `${(player.stamina / player.maxStamina) * 100}%`;
  ui.roomNumber.textContent = room;
  ui.souls.textContent = souls;
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.033);
  lastTime = time;
  update(dt);
  draw();
}

document.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "Space") {
    event.preventDefault();
    attack();
  }
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
    dodge();
  }
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

document.getElementById("startButton").addEventListener("click", startRun);
document.getElementById("restartButton").addEventListener("click", startRun);

document.querySelectorAll(".upgrade").forEach((button) => {
  button.addEventListener("click", () => chooseUpgrade(button.dataset.upgrade));
});

document.querySelectorAll("[data-key]").forEach((button) => {
  const code = button.dataset.key;

  const press = (event) => {
    event.preventDefault();
    keys.add(code);
    if (code === "Space") attack();
    if (code === "ShiftLeft") dodge();
  };

  const release = (event) => {
    event.preventDefault();
    keys.delete(code);
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

updateHud();
requestAnimationFrame(loop);
