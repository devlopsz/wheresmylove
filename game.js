"use strict";

// TROQUE AS ARTES AQUI. Coloque os arquivos em assets/images/ e atualize os caminhos.
// Use PNG ou WebP com transparência para personagem, inimigos, corações e portas.
const ASSETS = {
  background: "", // Ex.: "assets/images/fundo.png"
  ground: "",     // Ex.: "assets/images/chao.png" (esticada pelo chão)
  platform: "",   // Ex.: "assets/images/plataforma.png"
  player: "",     // Ex.: "assets/images/personagem.png"
  playerAttack: "", // Ex.: "assets/images/personagem-atacando.png"
  enemy: "",      // Ex.: "assets/images/inimigo.png"
  door: "",       // Ex.: "assets/images/porta.png"
  heart: "",      // Ex.: "assets/images/coracao.png"
  gameOver: "",   // Ex.: "assets/images/game-over.png"
};

const W = 960;
const H = 540;
const LEVEL_WIDTH = 2860;
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const heartElements = [...document.querySelectorAll(".heart")];
const gameoverActions = document.querySelector("#gameover-actions");
const images = {};

for (const [name, src] of Object.entries(ASSETS)) {
  if (!src) continue;
  const image = new Image();
  image.src = src;
  images[name] = image;
}

const platforms = [
  { x: 0, y: 478, w: LEVEL_WIDTH, h: 90, ground: true },
  { x: 310, y: 390, w: 150, h: 20 },
  { x: 520, y: 324, w: 166, h: 20 },
  { x: 772, y: 382, w: 142, h: 20 },
  { x: 1030, y: 348, w: 180, h: 20 },
  { x: 1300, y: 286, w: 170, h: 20 },
  { x: 1535, y: 370, w: 155, h: 20 },
  { x: 1790, y: 318, w: 180, h: 20 },
  { x: 2070, y: 260, w: 150, h: 20 },
  { x: 2310, y: 354, w: 182, h: 20 },
  { x: 2570, y: 300, w: 160, h: 20 },
];

const doors = [
  { x: 700, y: 406, w: 46, h: 72, href: "areas/porta-1.html" },
  { x: 1650, y: 406, w: 46, h: 72, href: "areas/porta-2.html" },
  { x: 2700, y: 406, w: 46, h: 72, href: "areas/porta-3.html" },
];

function makeEnemy(x, left, right) {
  return { x, startX: x, y: 436, startY: 436, w: 38, h: 42, left, right, vx: -62, startVx: -62, alive: true, grounded: true };
}

const enemies = [
  makeEnemy(405, 365, 480), makeEnemy(865, 825, 970),
  makeEnemy(1170, 1125, 1260), makeEnemy(1510, 1485, 1585),
  makeEnemy(1930, 1870, 2020), makeEnemy(2220, 2180, 2295),
  makeEnemy(2510, 2470, 2580),
];

const player = {
  x: 75, y: 426, w: 34, h: 52, vx: 0, vy: 0, facing: 1,
  grounded: true, lives: 3, invulnerableUntil: 0, attackUntil: 0,
};

const input = { left: false, right: false, jump: false, attack: false };
let cameraX = 0;
let gameOver = false;
let lastTime = performance.now();
let attackWasDown = false;

function drawImageOr(name, x, y, w, h, fallback) {
  const image = images[name];
  if (image?.complete && image.naturalWidth > 0) ctx.drawImage(image, x, y, w, h);
  else fallback();
}

function drawBackground() {
  drawImageOr("background", 0, 0, W, H, () => {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#172b4a");
    gradient.addColorStop(1, "#91a7b5");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#e8cf8a";
    ctx.beginPath(); ctx.arc(785, 100, 42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#718c9b";
    for (let i = 0; i < 6; i++) {
      const x = ((i * 210 - cameraX * 0.16) % 1220 + 1220) % 1220 - 100;
      ctx.beginPath(); ctx.moveTo(x, 425); ctx.lineTo(x + 130, 218 + (i % 2) * 43); ctx.lineTo(x + 295, 425); ctx.fill();
    }
    ctx.fillStyle = "#587b7f";
    for (let i = 0; i < 7; i++) {
      const x = ((i * 190 - cameraX * 0.3) % 1330 + 1330) % 1330 - 130;
      ctx.beginPath(); ctx.moveTo(x, 480); ctx.lineTo(x + 115, 330 + (i % 3) * 22); ctx.lineTo(x + 260, 480); ctx.fill();
    }
  });
}

function drawPlatform(platform) {
  const x = platform.x - cameraX;
  if (x + platform.w < 0 || x > W) return;
  if (platform.ground) {
    drawImageOr("ground", x, platform.y, platform.w, platform.h, () => {
      ctx.fillStyle = "#405b49"; ctx.fillRect(x, platform.y, platform.w, platform.h);
      ctx.fillStyle = "#72a66c"; ctx.fillRect(x, platform.y, platform.w, 11);
      ctx.fillStyle = "#627b57";
      for (let i = Math.floor(platform.x / 38) * 38; i < platform.x + platform.w; i += 38) {
        const sx = i - cameraX;
        ctx.fillRect(sx, platform.y + 22, 17, 6);
      }
    });
  } else {
    drawImageOr("platform", x, platform.y, platform.w, platform.h, () => {
      ctx.fillStyle = "#765a46"; ctx.fillRect(x, platform.y + 5, platform.w, platform.h - 5);
      ctx.fillStyle = "#d1a06a"; ctx.fillRect(x, platform.y, platform.w, 7);
      ctx.fillStyle = "#f0c486"; ctx.fillRect(x + 5, platform.y, platform.w - 10, 3);
    });
  }
}

function drawDoor(door, index) {
  const x = door.x - cameraX;
  if (x + door.w < 0 || x > W) return;
  drawImageOr("door", x, door.y, door.w, door.h, () => {
    ctx.fillStyle = ["#dd7180", "#71c4bd", "#d4ad5f"][index];
    ctx.fillRect(x, door.y, door.w, door.h);
    ctx.fillStyle = "#24334b"; ctx.fillRect(x + 7, door.y + 9, door.w - 14, door.h - 9);
    ctx.fillStyle = "#f4d77d"; ctx.beginPath(); ctx.arc(x + door.w - 12, door.y + 42, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 13px system-ui"; ctx.textAlign = "center";
    ctx.fillText(String(index + 1), x + door.w / 2, door.y - 8);
  });
}

function drawActor(actor, isPlayer = false, attacking = false) {
  const x = actor.x - cameraX;
  if (x + actor.w < -60 || x > W + 60) return;
  const assetName = isPlayer ? (attacking ? "playerAttack" : "player") : "enemy";
  const extraWidth = attacking ? 19 : 0;
  ctx.save();
  if (isPlayer && performance.now() < player.invulnerableUntil) ctx.filter = "brightness(1.3)";
  if (actor.facing === -1 || (isPlayer && player.facing === -1)) {
    ctx.translate(x + actor.w + extraWidth, actor.y); ctx.scale(-1, 1);
    drawImageOr(assetName, 0, 0, actor.w + extraWidth, actor.h, () => drawActorShape(actor, isPlayer, attacking, true));
  } else {
    drawImageOr(assetName, x, actor.y, actor.w + extraWidth, actor.h, () => drawActorShape(actor, isPlayer, attacking, false));
  }
  ctx.restore();
}

function drawActorShape(actor, isPlayer, attacking, mirrored) {
  const x = mirrored ? 0 : (actor.x - cameraX);
  if (isPlayer) {
    ctx.fillStyle = "#29334e"; ctx.fillRect(x + 5, actor.y + 8, 24, 31);
    ctx.fillStyle = "#f0c5a0"; ctx.fillRect(x + 8, actor.y, 19, 18);
    ctx.fillStyle = "#d97c65"; ctx.fillRect(x + 3, actor.y + 25, 28, 16);
    ctx.fillStyle = "#3c4c68"; ctx.fillRect(x + 4, actor.y + 40, 10, 12); ctx.fillRect(x + 20, actor.y + 40, 10, 12);
    ctx.fillStyle = "#26314a"; ctx.fillRect(x + 8, actor.y + 5, 20, 5);
    if (attacking) {
      ctx.fillStyle = "#fff0a1";
      const sx = player.facing > 0 ? x + actor.w + 1 : x - 15;
      ctx.fillRect(sx, actor.y + 22, 18, 7);
    }
  } else {
    ctx.fillStyle = "#6e3b60"; ctx.fillRect(x + 3, actor.y + 7, actor.w - 6, actor.h - 7);
    ctx.fillStyle = "#d896a2"; ctx.fillRect(x + 7, actor.y, actor.w - 14, 18);
    ctx.fillStyle = "#fff4d8"; ctx.fillRect(x + 10, actor.y + 7, 5, 5); ctx.fillRect(x + 23, actor.y + 7, 5, 5);
    ctx.fillStyle = "#46294c"; ctx.fillRect(x + 11, actor.y + 8, 2, 4); ctx.fillRect(x + 24, actor.y + 8, 2, 4);
  }
}

function drawHearts() {
  for (let i = 0; i < 3; i++) {
    const el = heartElements[i];
    el.classList.toggle("lost", i >= player.lives);
    if (images.heart?.complete && images.heart.naturalWidth > 0) {
      el.textContent = "";
      el.style.width = "1em"; el.style.height = "1em";
      el.style.background = `center / contain no-repeat url("${ASSETS.heart}")`;
    } else {
      el.textContent = "♥";
      el.style.background = "none";
    }
  }
  document.querySelector("#hearts").setAttribute("aria-label", `${player.lives} ${player.lives === 1 ? "vida" : "vidas"}`);
}

function drawGameOver() {
  drawImageOr("gameOver", 0, 0, W, H, () => {
    ctx.fillStyle = "#101827d9"; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff"; ctx.font = "800 54px system-ui"; ctx.fillText("FIM DE JOGO", W / 2, 240);
    ctx.fillStyle = "#f4d77d"; ctx.font = "20px system-ui"; ctx.fillText("Sua aventura pode continuar", W / 2, 280);
  });
}

function render() {
  drawBackground();
  for (const platform of platforms) drawPlatform(platform);
  doors.forEach(drawDoor);
  for (const enemy of enemies) if (enemy.alive) drawActor(enemy);
  drawActor(player, true, performance.now() < player.attackUntil);
  drawHearts();
  if (gameOver) drawGameOver();
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function moveAndLand(actor, dt) {
  const previousY = actor.y;
  actor.grounded = false;
  actor.y += actor.vy * dt;
  for (const p of platforms) {
    if (actor.x + actor.w > p.x && actor.x < p.x + p.w && previousY + actor.h <= p.y && actor.y + actor.h >= p.y && actor.vy >= 0) {
      actor.y = p.y - actor.h; actor.vy = 0; actor.grounded = true;
    }
  }
}

function startAttack() {
  const now = performance.now();
  if (now < player.attackUntil || gameOver) return;
  player.attackUntil = now + 190;
  const range = 58;
  const target = enemies.find((enemy) => {
    if (!enemy.alive || Math.abs((enemy.y + enemy.h) - (player.y + player.h)) > 38) return false;
    const distance = player.facing > 0 ? enemy.x - (player.x + player.w) : player.x - (enemy.x + enemy.w);
    return distance >= -8 && distance <= range;
  });
  if (target) target.alive = false;
}

function hurtPlayer(enemy) {
  if (performance.now() < player.invulnerableUntil) return;
  player.lives -= 1;
  player.invulnerableUntil = performance.now() + 1050;
  if (player.lives <= 0) {
    player.lives = 0; gameOver = true;
    gameoverActions.hidden = false;
  }
}

function update(dt) {
  if (gameOver) return;
  const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  player.vx = move * 245;
  if (move) player.facing = move > 0 ? 1 : -1;
  player.x = Math.max(0, Math.min(LEVEL_WIDTH - player.w, player.x + player.vx * dt));
  if (input.jump && player.grounded) { player.vy = -570; player.grounded = false; }
  input.jump = false;
  player.vy = Math.min(760, player.vy + 1500 * dt);
  moveAndLand(player, dt);
  if (player.y > H + 120) {
    player.x = Math.max(30, player.x - 80); player.y = 426; player.vy = 0; player.grounded = true;
    if (player.lives > 0) { player.lives -= 1; player.invulnerableUntil = performance.now() + 1050; }
    if (player.lives <= 0) { player.lives = 0; gameOver = true; gameoverActions.hidden = false; }
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.vx * dt;
    if (enemy.x < enemy.left) { enemy.x = enemy.left; enemy.vx = Math.abs(enemy.vx); }
    if (enemy.x + enemy.w > enemy.right) { enemy.x = enemy.right - enemy.w; enemy.vx = -Math.abs(enemy.vx); }
    enemy.facing = enemy.vx >= 0 ? 1 : -1;
    enemy.vy = Math.min(760, (enemy.vy || 0) + 1500 * dt);
    moveAndLand(enemy, dt);
    if (overlaps(player, enemy)) hurtPlayer(enemy);
  }

  cameraX = Math.max(0, Math.min(LEVEL_WIDTH - W, player.x - W * 0.37));
  for (const door of doors) {
    if (overlaps(player, door)) { window.location.href = door.href; return; }
  }
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.035);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

function setKey(code, pressed) {
  if (["ArrowLeft", "KeyA"].includes(code)) input.left = pressed;
  if (["ArrowRight", "KeyD"].includes(code)) input.right = pressed;
  if (["Space", "ArrowUp", "KeyW"].includes(code) && pressed) input.jump = true;
  if (["KeyX", "KeyJ"].includes(code)) {
    input.attack = pressed;
    if (pressed && !attackWasDown) startAttack();
  }
  attackWasDown = input.attack;
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
  setKey(event.code, true);
});
window.addEventListener("keyup", (event) => setKey(event.code, false));
window.addEventListener("blur", () => { input.left = input.right = input.jump = input.attack = false; attackWasDown = false; });

const joystick = document.querySelector("#joystick");
const knob = document.querySelector("#joystick-knob");
let joystickPointer = null;
function updateJoystick(event) {
  const rect = joystick.querySelector(".joystick-ring").getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const dx = Math.max(-26, Math.min(26, event.clientX - centerX));
  knob.style.transform = `translate(${dx}px, 0)`;
  input.left = dx < -7;
  input.right = dx > 7;
}
joystick.addEventListener("pointerdown", (event) => {
  event.preventDefault(); joystickPointer = event.pointerId; joystick.setPointerCapture(event.pointerId); updateJoystick(event);
});
joystick.addEventListener("pointermove", (event) => { if (event.pointerId === joystickPointer) updateJoystick(event); });
function releaseJoystick(event) {
  if (event.pointerId !== joystickPointer) return;
  joystickPointer = null; input.left = input.right = false; knob.style.transform = "translate(0, 0)";
}
joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);

function bindHoldButton(button, onDown, onUp) {
  button.addEventListener("pointerdown", (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); onDown(); });
  button.addEventListener("pointerup", onUp);
  button.addEventListener("pointercancel", onUp);
  button.addEventListener("lostpointercapture", onUp);
}
bindHoldButton(document.querySelector("#jump-button"), () => { input.jump = true; }, () => {});
bindHoldButton(document.querySelector("#attack-button"), startAttack, () => {});

function restart() {
  player.x = 75; player.y = 426; player.vx = player.vy = 0; player.lives = 3; player.grounded = true;
  player.invulnerableUntil = 0; player.attackUntil = 0; player.facing = 1;
  for (const enemy of enemies) {
    enemy.x = enemy.startX; enemy.y = enemy.startY; enemy.vx = enemy.startVx;
    enemy.vy = 0; enemy.grounded = true; enemy.alive = true;
  }
  gameOver = false; cameraX = 0; gameoverActions.hidden = true;
}
document.querySelector("#restart-button").addEventListener("click", restart);

render();
requestAnimationFrame(frame);
