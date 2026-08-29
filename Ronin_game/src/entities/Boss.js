// ==========================================================================
// Boss.js - Corrupted Warlord (Kage-no-Shin) Multi-Phase Boss Fight
// Pagoda Summit Boss with Odachi combos, shockwaves, and stagger mechanics
// ==========================================================================

import { Physics } from '../engine/Physics.js';

export class Boss {
  constructor(x, y, pixelGen, audioEngine, particleSystem) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.pixelGen = pixelGen;
    this.audio = audioEngine;
    this.particles = particleSystem;
    this.sprites = this.pixelGen.generateBossSprites();

    // Dimensions & Hitbox
    this.width = 64;
    this.height = 64;
    this.hitboxOffsetX = 18;
    this.hitboxOffsetY = 16;
    this.hitboxW = 28;
    this.hitboxH = 46;

    // Boss Stats
    this.name = 'KAGE-NO-SHIN ・ 影の刃';
    this.title = 'Corrupted Warlord of the Twilight Pagoda';
    this.hp = 320;
    this.maxHp = 320;
    this.staggerMeter = 0;
    this.maxStagger = 3;
    this.isStaggered = false;
    this.staggerTimer = 0;

    // AI & Combat State
    this.state = 'idle'; // 'idle', 'chase', 'windup', 'slash', 'slam', 'dash_strike', 'stagger', 'hurt', 'dead'
    this.facing = -1;
    this.stateTimer = 0;
    this.attackCooldown = 40;
    this.isGrounded = false;
    this.phase = 1; // Phase 2 at HP <= 160

    this.spawnedProjectiles = [];
    this.isDefeated = false;
  }

  takeDamage(amount, fromX = null, attackType = 'slash') {
    if (this.state === 'dead' || this.isDefeated) return;

    if (this.isStaggered) {
      amount = Math.floor(amount * 1.5); // 50% bonus damage when staggered
    }

    this.hp -= amount;
    this.audio.playHit();
    this.particles.createBlood(this.x + 32, this.y + 32, fromX ? (this.x > fromX ? 1 : -1) : -this.facing, 16);
    this.particles.createDamageNumber(this.x + 24, this.y + 12, amount, this.isStaggered || amount > 35);

    // Phase transition check
    if (this.hp <= 160 && this.phase === 1) {
      this.phase = 2;
      this.particles.createSparks(this.x + 32, this.y + 32, 25, '#8a2be2');
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
      this.stateTimer = 120;
      this.isDefeated = true;
      this.audio.playDeath();
    }
  }

  // Called when player parries a boss attack
  registerParry() {
    this.staggerMeter++;
    this.particles.createSparks(this.x + 32, this.y + 32, 20, '#ffd700');

    if (this.staggerMeter >= this.maxStagger) {
      this.staggerMeter = 0;
      this.isStaggered = true;
      this.state = 'stagger';
      this.stateTimer = 140; // ~2.5 seconds stagger punish window
      this.audio.playParry();
    }
  }

  update(player, world) {
    if (this.isDefeated) {
      this.stateTimer--;
      this.vx = 0;
      this.vy += 0.38;
      Physics.moveAndSlide(this, world);
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const dirToPlayer = player.x > this.x ? 1 : -1;

    // 1. Staggered State (Vulnerable)
    if (this.state === 'stagger') {
      this.stateTimer--;
      this.vx *= 0.8;
      if (Math.random() > 0.7) {
        this.particles.createSparks(this.x + 32, this.y + 20, 2, '#ffd700');
      }
      if (this.stateTimer <= 0) {
        this.isStaggered = false;
        this.state = 'idle';
        this.attackCooldown = 30;
      }
      this.vy += 0.38;
      Physics.moveAndSlide(this, world);
      return;
    }

    // 2. Windup & Attack States
    if (this.state === 'windup_slam' || this.state === 'windup_dash') {
      this.stateTimer--;
      this.vx = 0;
      if (this.stateTimer <= 0) {
        if (this.state === 'windup_slam') this.executeSlam(player);
        else this.executeDashStrike(player);
      }
      this.vy += 0.38;
      Physics.moveAndSlide(this, world);
      return;
    }

    if (this.state === 'slam' || this.state === 'dash_strike') {
      this.stateTimer--;
      this.vx *= 0.92;
      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.attackCooldown = this.phase === 2 ? 35 : 55;
      }
      this.vy += 0.38;
      Physics.moveAndSlide(this, world);
      return;
    }

    // 3. Movement & Decision Making
    this.facing = dirToPlayer;

    if (this.attackCooldown <= 0) {
      const choice = Math.random();
      if (distToPlayer > 120 && choice > 0.4) {
        // High-speed Dash Strike
        this.state = 'windup_dash';
        this.stateTimer = this.phase === 2 ? 18 : 28;
        this.particles.createSparks(this.x + 32, this.y + 24, 6, '#8a2be2');
      } else {
        // Ground Slam with shockwave
        this.state = 'windup_slam';
        this.stateTimer = this.phase === 2 ? 20 : 30;
        this.particles.createSparks(this.x + 32, this.y + 14, 8, '#ff3344');
      }
    } else {
      // Approach player
      this.state = 'chase';
      const speed = this.phase === 2 ? 2.0 : 1.4;
      this.vx = this.facing * speed;
    }

    this.vy += 0.38;
    Physics.moveAndSlide(this, world);
  }

  executeSlam(player) {
    this.state = 'slam';
    this.stateTimer = 24;
    this.audio.playSlash(3);
    this.audio.playTaikoDrum(true);

    // Shockwave Projectile across floor
    this.spawnedProjectiles.push({
      type: 'shockwave',
      x: this.x + 32 + this.facing * 20,
      y: this.y + 40,
      vx: this.facing * (this.phase === 2 ? 6.5 : 4.8),
      vy: 0,
      damage: 28,
      fromPlayer: false,
      life: 90
    });

    // Close range heavy impact
    const slamBox = {
      x: this.facing === 1 ? this.x + 24 : this.x - 20,
      y: this.y + 16,
      w: 52,
      h: 40
    };
    const playerBox = {
      x: player.x + player.hitboxOffsetX,
      y: player.y + player.hitboxOffsetY,
      w: player.hitboxW,
      h: player.hitboxH
    };

    if (Physics.rectIntersect(slamBox, playerBox)) {
      const res = player.takeDamage(35, this.x, true);
      if (res === 'parried') {
        this.registerParry();
      }
    }
  }

  executeDashStrike(player) {
    this.state = 'dash_strike';
    this.stateTimer = 20;
    this.audio.playIaiStrike();
    this.vx = this.facing * 7.5;

    const startX = this.x + 32;
    const startY = this.y + 32;
    const endX = startX + this.facing * 140;

    this.particles.createSlashLine(startX, startY, endX, startY, '#8a2be2');

    const dashBox = {
      x: this.facing === 1 ? this.x : this.x - 120,
      y: this.y + 14,
      w: 140,
      h: 36
    };
    const playerBox = {
      x: player.x + player.hitboxOffsetX,
      y: player.y + player.hitboxOffsetY,
      w: player.hitboxW,
      h: player.hitboxH
    };

    if (Physics.rectIntersect(dashBox, playerBox)) {
      const res = player.takeDamage(40, this.x, true);
      if (res === 'parried') {
        this.registerParry();
      }
    }
  }

  render(ctx, cameraX, cameraY) {
    const sx = Math.floor(this.x - cameraX);
    const sy = Math.floor(this.y - cameraY);

    ctx.save();
    if (this.facing === -1) {
      ctx.translate(sx + 64, sy);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(sx, sy);
    }

    let frame = 0;
    if (this.state === 'windup_slam' || this.state === 'windup_dash') frame = 2;
    else if (this.state === 'slam' || this.state === 'dash_strike') frame = 4;
    else if (this.state === 'stagger') frame = 6;
    else frame = Math.floor(Date.now() / 200) % 2;

    ctx.drawImage(this.sprites.bossSheet, frame * 64, 0, 64, 64, 0, 0, 64, 64);
    ctx.restore();
  }
}
