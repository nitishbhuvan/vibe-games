// ==========================================================================
// Renderer.js - 16-Bit Pixel Art Parallax Engine & Camera Controller
// Twilight Japanese Landscape (Sky, Misty Mountains, Pagodas, Pines, Lighting)
// ==========================================================================

export class Renderer {
  constructor(canvas, viewW = 640, viewH = 360) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.viewW = viewW;
    this.viewH = viewH;

    // Camera State
    this.cameraX = 0;
    this.cameraY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;

    // Pre-render procedural parallax backgrounds
    this.bgSky = this.createSkyBuffer();
    this.bgMountains = this.createMountainsBuffer();
    this.bgFarHills = this.createFarHillsBuffer();
    this.cloudOffset = 0;
  }

  // ------------------------------------------------------------------------
  // 1. PROCEDURAL PARALLAX BACKGROUND BUFFERS
  // ------------------------------------------------------------------------

  // A. Twilight Sky Gradient + Glowing Moon & Clouds
  createSkyBuffer() {
    const c = document.createElement('canvas');
    c.width = this.viewW;
    c.height = this.viewH;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Deep purple down to fiery amber twilight horizon
    const grad = ctx.createLinearGradient(0, 0, 0, this.viewH);
    grad.addColorStop(0.0, '#10051e'); // Deep cosmic indigo
    grad.addColorStop(0.35, '#290f45'); // Rich twilight purple
    grad.addColorStop(0.65, '#681d4a'); // Crimson twilight violet
    grad.addColorStop(0.85, '#b8432a'); // Fiery orange
    grad.addColorStop(0.96, '#e8782a'); // Warm amber
    grad.addColorStop(1.0, '#ffaa44');  // Golden horizon glow

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    // Glowing Crescent Moon
    const mx = this.viewW * 0.78;
    const my = 65;
    // Outer moon glow
    const moonGlow = ctx.createRadialGradient(mx, my, 8, mx, my, 45);
    moonGlow.addColorStop(0, 'rgba(255, 235, 180, 0.4)');
    moonGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(mx, my, 45, 0, Math.PI * 2);
    ctx.fill();

    // Crescent Moon Shape
    ctx.fillStyle = '#fff4d6';
    ctx.beginPath();
    ctx.arc(mx, my, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#290f45';
    ctx.beginPath();
    ctx.arc(mx + 7, my - 3, 16, 0, Math.PI * 2);
    ctx.fill();

    return c;
  }

  // B. Layer 1: Misty Silhouetted Mountains (Parallax 0.12)
  createMountainsBuffer() {
    const w = 1280;
    const h = this.viewH;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Distant mountain peaks (Fuji peak + jagged ridges)
    ctx.fillStyle = '#220e36';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, 180);
    ctx.lineTo(160, 90);  // Peak 1 (Mount Fuji silhouette)
    ctx.lineTo(210, 90);  // Crater top
    ctx.lineTo(380, 220);
    ctx.lineTo(520, 130); // Peak 2
    ctx.lineTo(680, 240);
    ctx.lineTo(840, 110); // Peak 3
    ctx.lineTo(1020, 230);
    ctx.lineTo(1180, 140);
    ctx.lineTo(w, 200);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Soft Mist / Fog layer over mountain bases
    const mistGrad = ctx.createLinearGradient(0, 160, 0, h);
    mistGrad.addColorStop(0, 'rgba(180, 100, 160, 0)');
    mistGrad.addColorStop(0.6, 'rgba(180, 100, 160, 0.35)');
    mistGrad.addColorStop(1, 'rgba(140, 60, 120, 0.6)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 160, w, h - 160);

    return c;
  }

  // C. Layer 2: Distant Pine Ridges & Rolling Hills (Parallax 0.28)
  createFarHillsBuffer() {
    const w = 1280;
    const h = this.viewH;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Dark pine ridge silhouette
    ctx.fillStyle = '#160a24';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, 220);

    // Bumpy pine tree skyline
    for (let x = 0; x < w; x += 18) {
      const ph = 210 + Math.sin(x * 0.015) * 25 + (Math.sin(x * 0.05) * 8);
      ctx.lineTo(x + 9, ph - 14); // Tree tip
      ctx.lineTo(x + 18, ph);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Distant small pagoda silhouette on hill
    ctx.fillStyle = '#0f061a';
    const px = 450;
    const py = 160;
    ctx.fillRect(px + 10, py, 2, 8); // Finial
    ctx.fillRect(px + 4, py + 8, 14, 4); // Roof 1
    ctx.fillRect(px + 6, py + 12, 10, 6);
    ctx.fillRect(px + 2, py + 18, 18, 5); // Roof 2
    ctx.fillRect(px + 5, py + 23, 12, 10);

    return c;
  }

  // ------------------------------------------------------------------------
  // 2. CAMERA CONTROLLER & SHAKE
  // ------------------------------------------------------------------------
  setTarget(x, y, facing = 1) {
    // Look ahead in direction player is facing
    this.targetX = x - this.viewW / 2 + facing * 40;
    this.targetY = y - this.viewH / 2 - 20;

    // Clamp camera within world bounds
    this.targetX = Math.max(0, Math.min(2800 - this.viewW, this.targetX));
    this.targetY = Math.max(-40, Math.min(100, this.targetY));
  }

  addShake(intensity = 6) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  updateCamera() {
    // Smooth Lerp
    this.cameraX += (this.targetX - this.cameraX) * 0.08;
    this.cameraY += (this.targetY - this.cameraY) * 0.08;

    // Apply Screen Shake
    if (this.shakeIntensity > 0.1) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.cameraX += offsetX;
      this.cameraY += offsetY;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }

    this.cloudOffset += 0.15;
  }

  // ------------------------------------------------------------------------
  // 3. MASTER SCENE RENDER PIPELINE
  // ------------------------------------------------------------------------
  renderScene(world, player, enemies, boss, collectibles, particles, lighting, hud) {
    this.updateCamera();
    const ctx = this.ctx;
    const camX = Math.floor(this.cameraX);
    const camY = Math.floor(this.cameraY);

    ctx.clearRect(0, 0, this.viewW, this.viewH);

    // 1. Layer 0: Sky Gradient & Moon (Static / infinite)
    ctx.drawImage(this.bgSky, 0, 0);

    // Drifting Twilight Clouds
    ctx.fillStyle = 'rgba(100, 35, 75, 0.25)';
    const c1 = (this.cloudOffset * 0.5) % this.viewW;
    ctx.fillRect(this.viewW - c1, 40, 180, 20);
    ctx.fillRect(this.viewW - c1 - 40, 50, 140, 15);
    ctx.fillRect(-c1 + 400, 80, 240, 25);

    // 2. Layer 1: Misty Silhouetted Mountains (Parallax 0.12)
    const mtnX = -Math.floor((camX * 0.12) % 1280);
    ctx.drawImage(this.bgMountains, mtnX, 0);
    if (mtnX + 1280 < this.viewW) {
      ctx.drawImage(this.bgMountains, mtnX + 1280, 0);
    }

    // 3. Layer 2: Far Pine Ridges & Pagoda Skyline (Parallax 0.28)
    const hillX = -Math.floor((camX * 0.28) % 1280);
    ctx.drawImage(this.bgFarHills, hillX, 0);
    if (hillX + 1280 < this.viewW) {
      ctx.drawImage(this.bgFarHills, hillX + 1280, 0);
    }

    // 4. Layer 3: Midground Pagoda & Bamboo (Layer 0 Scenery)
    world.renderScenery(ctx, camX, camY, 0);

    // 5. Layer 4: Torii Gate, Ancient Gnarled Pines, Shrines (Layer 1 Scenery)
    world.renderScenery(ctx, camX, camY, 1);

    // 6. Layer 5: Solid Platforms & Mossy Stone Tiles
    world.renderTiles(ctx, camX, camY);

    // 7. Layer 6: Hanging Lanterns & Jizo Shrines (Layer 2 Scenery)
    world.renderScenery(ctx, camX, camY, 2);

    // 8. Layer 7: Interactive Collectibles & Pickups
    collectibles.render(ctx, camX, camY);

    // 9. Layer 8: Enemies
    enemies.forEach(e => e.render(ctx, camX, camY));

    // 10. Layer 9: Pagoda Boss (Kage-no-Shin)
    if (boss) {
      boss.render(ctx, camX, camY);
    }

    // 11. Layer 10: Player Ronin
    player.render(ctx, camX, camY);

    // 12. Layer 11: Combat FX, Slash Lines & Blood Splatters
    particles.renderCombatFX(ctx, camX, camY);

    // 13. Layer 12: Atmospheric Falling Sakura Blossoms
    particles.renderSakura(ctx, camX, camY);

    // 14. Layer 13: Dynamic High-Contrast Lighting & Lantern Glows
    lighting.clear();
    // Add world lantern lights
    world.lights.forEach(l => lighting.addLight(l.x, l.y, l.radius, l.color, l.flicker, l.intensity));
    // Add Player blade gleam if attacking/parrying
    if (player.state.includes('attack') || player.state === 'parry' || player.state === 'iai_charge') {
      lighting.addLight(player.x + 24 + player.facing * 16, player.y + 24, 55, '#70e5ff', 0.1, 0.9);
    }
    // Add Boss purple aura light
    if (boss && !boss.isDefeated) {
      lighting.addLight(boss.x + 32, boss.y + 32, 90, '#8a2be2', 0.25, 0.9);
    }
    lighting.render(ctx, camX, camY);

    // 15. Layer 14: Heads-Up Display (Katana HP bar, Ki meter, Combo counter)
    hud.render(ctx, player, boss, this.viewW, this.viewH);
  }
}
