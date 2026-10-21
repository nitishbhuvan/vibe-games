// ==========================================================================
// Collectibles.js - Pickups, Projectiles, and Interactive Breakables
// ==========================================================================

import { Physics } from '../engine/Physics.js';

export class CollectiblesManager {
  constructor(pixelGen, audioEngine, particleSystem) {
    this.pixelGen = pixelGen;
    this.audio = audioEngine;
    this.particles = particleSystem;
    this.itemsImg = this.pixelGen.generateItemsAndProjectiles();

    this.pickups = [];
    this.projectiles = [];
  }

  addPickup(type, x, y, vx = 0, vy = 0) {
    this.pickups.push({
      type,
      x, y,
      vx, vy,
      width: 16,
      height: 16,
      life: 600,
      magnetRadius: 75
    });
  }

  addProjectile(proj) {
    this.projectiles.push({
      type: proj.type, // 'kunai', 'shuriken', 'shockwave'
      x: proj.x,
      y: proj.y,
      vx: proj.vx,
      vy: proj.vy || 0,
      damage: proj.damage || 20,
      fromPlayer: !!proj.fromPlayer,
      life: proj.life || 120,
      w: proj.type === 'shockwave' ? 24 : 12,
      h: proj.type === 'shockwave' ? 24 : 12
    });
  }

  update(player, enemies, boss, world) {
    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      // Hit wall check
      const pBox = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
      const nearbyBlocks = world.getCollidersNear(p.x, p.y, 40);
      const hitWall = nearbyBlocks.some(b => !b.isOneWay && Physics.rectIntersect(pBox, b));

      if (hitWall || p.life <= 0) {
        this.particles.createSparks(p.x, p.y, 6, '#ffd700');
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check Hits against Player
      if (!p.fromPlayer) {
        const playerBox = {
          x: player.x + player.hitboxOffsetX,
          y: player.y + player.hitboxOffsetY,
          w: player.hitboxW,
          h: player.hitboxH
        };

        if (Physics.rectIntersect(pBox, playerBox)) {
          const res = player.takeDamage(p.damage, p.x, true);
          if (res === 'parried') {
            // Reflect projectile back!
            p.fromPlayer = true;
            p.vx *= -1.5;
            p.damage *= 2;
            continue;
          }
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check Hits against Enemies / Boss
      if (p.fromPlayer) {
        let hitEntity = false;

        // Enemies
        for (const enemy of enemies) {
          if (enemy.state === 'dead') continue;
          const eBox = {
            x: enemy.x + enemy.hitboxOffsetX,
            y: enemy.y + enemy.hitboxOffsetY,
            w: enemy.hitboxW,
            h: enemy.hitboxH
          };
          if (Physics.rectIntersect(pBox, eBox)) {
            enemy.takeDamage(p.damage, p.x, 'kunai');
            hitEntity = true;
            break;
          }
        }

        // Boss
        if (!hitEntity && boss && !boss.isDefeated) {
          const bBox = {
            x: boss.x + boss.hitboxOffsetX,
            y: boss.y + boss.hitboxOffsetY,
            w: boss.hitboxW,
            h: boss.hitboxH
          };
          if (Physics.rectIntersect(pBox, bBox)) {
            boss.takeDamage(p.damage, p.x, 'kunai');
            hitEntity = true;
          }
        }

        if (hitEntity) {
          this.projectiles.splice(i, 1);
        }
      }
    }

    // 2. Update Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const item = this.pickups[i];
      item.life--;

      // Gravity & Floor bounce
      item.vy += 0.25;
      item.x += item.vx;
      item.y += item.vy;
      item.vx *= 0.95;

      const colliders = world.getCollidersNear(item.x, item.y, 30);
      for (const block of colliders) {
        if (item.y + 8 >= block.y && item.y <= block.y + 12 && item.x >= block.x && item.x <= block.x + block.w) {
          item.y = block.y - 8;
          item.vy = -item.vy * 0.4;
          if (Math.abs(item.vy) < 0.2) item.vy = 0;
          break;
        }
      }

      // Magnet pull towards player
      const dist = Math.hypot((player.x + 24) - item.x, (player.y + 24) - item.y);
      if (dist < item.magnetRadius) {
        const angle = Math.atan2((player.y + 24) - item.y, (player.x + 24) - item.x);
        item.vx += Math.cos(angle) * 0.8;
        item.vy += Math.sin(angle) * 0.8;
      }

      // Collect item
      if (dist < 22) {
        if (item.type === 'spiritOrb') {
          player.spiritOrbs += 1;
          player.ki = Math.min(player.maxKi, player.ki + 15);
          this.audio.playHeal();
          this.particles.createSparks(item.x, item.y, 8, '#a855f7');
        } else if (item.type === 'gourd') {
          player.gourds = Math.min(player.maxGourds, player.gourds + 1);
          this.audio.playHeal();
          this.particles.createSparks(item.x, item.y, 10, '#38b000');
        }
        this.pickups.splice(i, 1);
        continue;
      }

      if (item.life <= 0) {
        this.pickups.splice(i, 1);
      }
    }
  }

  render(ctx, cameraX, cameraY) {
    // 1. Render Pickups
    this.pickups.forEach(item => {
      const sx = Math.floor(item.x - 8 - cameraX);
      const sy = Math.floor(item.y - 8 - cameraY);

      if (item.type === 'spiritOrb') {
        const frame = Math.floor(Date.now() / 120) % 4;
        ctx.drawImage(this.itemsImg.spiritOrb, frame * 16, 0, 16, 16, sx, sy, 16, 16);
      } else if (item.type === 'gourd') {
        ctx.drawImage(this.itemsImg.gourd, sx, sy);
      }
    });

    // 2. Render Projectiles
    this.projectiles.forEach(p => {
      const sx = Math.floor(p.x - cameraX);
      const sy = Math.floor(p.y - cameraY);

      ctx.save();
      ctx.translate(sx, sy);

      if (p.type === 'kunai') {
        if (p.vx < 0) ctx.scale(-1, 1);
        ctx.drawImage(this.itemsImg.kunai, -8, -8);
      } else if (p.type === 'shuriken') {
        ctx.rotate(Date.now() * 0.02);
        ctx.drawImage(this.itemsImg.shuriken, -8, -8);
      } else if (p.type === 'shockwave') {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }
}
