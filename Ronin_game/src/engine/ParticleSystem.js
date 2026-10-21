// ==========================================================================
// ParticleSystem.js - Atmospheric & Combat Particle FX
// Sakura petals, sword sparks, blood splatters, lantern embers, and mist
// ==========================================================================

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.slashLines = [];
    this.damageNumbers = [];
    this.ghostTrails = [];

    // Ambient Sakura blossoms pool
    this.sakuraBlossoms = [];
    this.initSakuraBlossoms(45);
  }

  // Pre-populate drifting sakura blossoms
  initSakuraBlossoms(count) {
    for (let i = 0; i < count; i++) {
      this.sakuraBlossoms.push({
        x: Math.random() * 2000,
        y: Math.random() * 600,
        vx: -(0.4 + Math.random() * 0.8),
        vy: 0.3 + Math.random() * 0.5,
        size: 2 + Math.random() * 2.5,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        swayOffset: Math.random() * 100,
        color: Math.random() > 0.3 ? '#ffb7c5' : '#ffccd5'
      });
    }
  }

  // 1. Blade Sparks (Parry / Wall slide / Clash)
  createSparks(x, y, count = 12, color = '#ffcc00') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        gravity: 0.15,
        size: 1.5 + Math.random() * 2,
        color: Math.random() > 0.4 ? color : '#ffffff',
        life: 1.0,
        decay: 0.03 + Math.random() * 0.04
      });
    }
  }

  // 2. Blood Splatter (Katana impact)
  createBlood(x, y, dir = 1, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (dir > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.4;
      const speed = 2 + Math.random() * 4.5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        gravity: 0.25,
        size: 2 + Math.random() * 2.5,
        color: Math.random() > 0.3 ? '#c92a2a' : '#851414',
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  // 3. Lantern Embers / Fireflies
  createLanternEmbers(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.3 + Math.random() * 0.5),
        gravity: -0.01,
        size: 1 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#ffaa33' : '#ffdd66',
        life: 1.0,
        decay: 0.015 + Math.random() * 0.01
      });
    }
  }

  // 4. Dust Puffs (Running / Landing)
  createDust(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + Math.random() * 2,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(0.2 + Math.random() * 0.6),
        gravity: 0.02,
        size: 2 + Math.random() * 3,
        color: '#6c627a',
        life: 0.8,
        decay: 0.04
      });
    }
  }

  // 5. Iai Slash Line (Screen-space lightning cut)
  createSlashLine(x1, y1, x2, y2, color = '#ff3344') {
    this.slashLines.push({
      x1, y1, x2, y2,
      color,
      life: 1.0,
      decay: 0.04
    });
  }

  // 6. Ghost Silhouette Trail (Dash / Roll)
  createGhostTrail(x, y, width, height, facing, spriteCanvas, frameX = 0, frameY = 0) {
    this.ghostTrails.push({
      x, y, width, height, facing,
      sprite: spriteCanvas,
      frameX, frameY,
      life: 0.7,
      decay: 0.06
    });
  }

  // 7. Floating Damage Number
  createDamageNumber(x, y, damage, isCrit = false) {
    this.damageNumbers.push({
      x, y,
      damage,
      isCrit,
      vy: -1.4,
      life: 1.0,
      decay: 0.025
    });
  }

  // Update All Particles
  update(cameraX, cameraY, viewW, viewH) {
    // 1. Update general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update Sakura blossoms (infinite wrap around camera)
    const margin = 100;
    this.sakuraBlossoms.forEach(b => {
      b.x += b.vx + Math.sin(b.swayOffset) * 0.3;
      b.y += b.vy;
      b.angle += b.rotSpeed;
      b.swayOffset += 0.03;

      // Wrap around camera viewport
      if (b.x < cameraX - margin) b.x = cameraX + viewW + margin;
      if (b.x > cameraX + viewW + margin) b.x = cameraX - margin;
      if (b.y > cameraY + viewH + margin) b.y = cameraY - margin;
    });

    // 3. Update slash lines
    for (let i = this.slashLines.length - 1; i >= 0; i--) {
      const s = this.slashLines[i];
      s.life -= s.decay;
      if (s.life <= 0) this.slashLines.splice(i, 1);
    }

    // 4. Update ghost trails
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const g = this.ghostTrails[i];
      g.life -= g.decay;
      if (g.life <= 0) this.ghostTrails.splice(i, 1);
    }

    // 5. Update damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y += d.vy;
      d.life -= d.decay;
      if (d.life <= 0) this.damageNumbers.splice(i, 1);
    }
  }

  // Render Sakura Blossom Petals
  renderSakura(ctx, cameraX, cameraY) {
    this.sakuraBlossoms.forEach(b => {
      const sx = Math.floor(b.x - cameraX);
      const sy = Math.floor(b.y - cameraY);

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(b.angle);
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
      ctx.restore();
    });
  }

  // Render Foreground Particles & Combat FX
  renderCombatFX(ctx, cameraX, cameraY) {
    // 1. Ghost Trails
    this.ghostTrails.forEach(g => {
      ctx.save();
      ctx.globalAlpha = g.life * 0.45;
      const gx = Math.floor(g.x - cameraX);
      const gy = Math.floor(g.y - cameraY);

      if (g.facing === -1) {
        ctx.scale(-1, 1);
        ctx.drawImage(g.sprite, g.frameX, g.frameY, 48, 48, -gx - 48, gy, 48, 48);
      } else {
        ctx.drawImage(g.sprite, g.frameX, g.frameY, 48, 48, gx, gy, 48, 48);
      }
      ctx.restore();
    });

    // 2. Regular Particles (Sparks, blood, embers)
    this.particles.forEach(p => {
      const px = Math.floor(p.x - cameraX);
      const py = Math.floor(p.y - cameraY);

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(px, py, Math.ceil(p.size), Math.ceil(p.size));
      ctx.restore();
    });

    // 3. Slash Lines
    this.slashLines.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.life;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(Math.floor(s.x1 - cameraX), Math.floor(s.y1 - cameraY));
      ctx.lineTo(Math.floor(s.x2 - cameraX), Math.floor(s.y2 - cameraY));
      ctx.stroke();

      // White inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });

    // 4. Damage Numbers
    this.damageNumbers.forEach(d => {
      const dx = Math.floor(d.x - cameraX);
      const dy = Math.floor(d.y - cameraY);

      ctx.save();
      ctx.globalAlpha = d.life;
      ctx.font = d.isCrit ? 'bold 11px "Press Start 2P", monospace' : '9px "Press Start 2P", monospace';
      ctx.fillStyle = d.isCrit ? '#ff3344' : '#ffcc00';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(`${d.damage}`, dx, dy);
      ctx.fillText(`${d.damage}`, dx, dy);
      ctx.restore();
    });
  }
}
