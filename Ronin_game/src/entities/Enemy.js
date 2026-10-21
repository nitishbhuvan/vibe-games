// ==========================================================================
// Enemy.js - Enemy AI & Behaviors (Ashigaru, Shadow Shinobi, Armored Samurai)
// ==========================================================================

import { Physics } from '../engine/Physics.js';

export class Enemy {
  constructor(x, y, type = 'ashigaru', pixelGen, audioEngine, particleSystem) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.type = type;

    this.pixelGen = pixelGen;
    this.audio = audioEngine;
    this.particles = particleSystem;
    this.sprites = this.pixelGen.generateEnemySprites();

    // Dimensions & Hitbox
    this.width = 48;
    this.height = 48;
    this.hitboxOffsetX = 14;
    this.hitboxOffsetY = 12;
    this.hitboxW = 20;
    this.hitboxH = 34;

    // AI & Combat Stats
    this.state = 'patrol'; // 'patrol', 'chase', 'windup', 'attack', 'guard', 'hurt', 'dead'
    this.facing = -1;
    this.stateTimer = 0;
    this.attackCooldown = 0;
    this.isGrounded = false;
    this.animFrame = 0;

    // Type-specific configuration
    if (this.type === 'ashigaru') {
      this.hp = 50;
      this.maxHp = 50;
      this.speed = 1.2;
      this.aggroRange = 160;
      this.attackRange = 46;
    } else if (this.type === 'shinobi') {
      this.hp = 40;
      this.maxHp = 40;
      this.speed = 2.0;
      this.aggroRange = 220;
      this.attackRange = 140; // Ranged shuriken or dash
    } else if (this.type === 'armored') {
      this.hp = 95;
      this.maxHp = 95;
      this.speed = 0.8;
      this.aggroRange = 180;
      this.attackRange = 50;
    }

    // Spawned Projectiles / Drops
    this.spawnedProjectiles = [];
    this.spawnedDrops = [];
  }

  takeDamage(amount, fromX = null, attackType = 'slash') {
    if (this.state === 'dead') return;

    // Guard defense (Ashigaru shields front attacks)
    const isFrontHit = fromX ? (this.facing === 1 ? fromX > this.x : fromX < this.x) : false;
    if (this.state === 'guard' && isFrontHit && attackType !== 'iai') {
      this.audio.playParry();
      this.particles.createSparks(this.x + 24, this.y + 24, 10, '#ffd700');
      amount = Math.floor(amount * 0.2);
    }

    this.hp -= amount;
    this.audio.playHit();
    this.particles.createBlood(this.x + 24, this.y + 24, fromX ? (this.x > fromX ? 1 : -1) : -this.facing, 12);
    this.particles.createDamageNumber(this.x + 20, this.y + 8, amount, amount > 30);

    this.state = 'hurt';
    this.stateTimer = 14;
    this.vy = -2.5;
    if (fromX) {
      this.vx = (this.x > fromX ? 1 : -1) * (attackType === 'iai' ? 4.5 : 2.5);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
      this.stateTimer = 30;
      // Drop Spirit Orbs
      this.spawnedDrops.push({
        type: 'spiritOrb',
        x: this.x + 24,
        y: this.y + 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -3.0
      });
      // Chance to drop gourd refill
      if (Math.random() > 0.6) {
        this.spawnedDrops.push({
          type: 'gourd',
          x: this.x + 24,
          y: this.y + 20,
          vx: (Math.random() - 0.5) * 2,
          vy: -3.5
        });
      }
    }
  }

  update(player, world) {
    if (this.state === 'dead') {
      this.stateTimer--;
      this.vy += 0.38;
      Physics.moveAndSlide(this, world);
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const dirToPlayer = player.x > this.x ? 1 : -1;

    // 1. Hurt State
    if (this.state === 'hurt') {
      this.stateTimer--;
      this.vx *= 0.85;
      if (this.stateTimer <= 0) this.state = 'chase';
      this.vy += 0.38;
      Physics.moveAndSlide(this, world);
      return;
    }

    // 2. Windup & Attack States
    if (this.state === 'windup') {
      this.stateTimer--;
      this.vx = 0;
      if (this.stateTimer <= 0) {
        this.executeAttack(player);
      }
      this.vy += 0.38;
      Physics.moveAndSlide(this, world);
      return;
    }

    if (this.state === 'attack') {
      this.stateTimer--;
      this.vx *= 0.9;
      if (this.stateTimer <= 0) {
        this.state = 'chase';
        this.attackCooldown = 50 + Math.random() * 30;
      }
      this.vy += 0.38;
      Physics.moveAndSlide(this, world);
      return;
    }

    // 3. AI Aggro & Decisions
    if (distToPlayer < this.aggroRange && Math.abs(player.y - this.y) < 60) {
      this.facing = dirToPlayer;

      // Close enough to attack
      if (distToPlayer <= this.attackRange && this.attackCooldown <= 0) {
        this.state = 'windup';
        this.stateTimer = this.type === 'armored' ? 26 : 16;
        if (this.type === 'armored') {
          // Red warning glint for heavy unblockable swing
          this.particles.createSparks(this.x + 24, this.y + 8, 4, '#ff3344');
        }
      } else {
        // Move towards player
        this.state = 'chase';
        this.vx = this.facing * this.speed;
      }
    } else {
      // Idle / Patrol
      this.state = 'patrol';
      this.vx = this.facing * (this.speed * 0.6);
      this.stateTimer++;
      if (this.stateTimer > 180) {
        this.facing *= -1;
        this.stateTimer = 0;
      }
    }

    // Shinobi Ninja Acrobatics: Jump/Teleport if stuck or at distance
    if (this.type === 'shinobi' && Math.random() > 0.985 && distToPlayer < 240 && distToPlayer > 80) {
      // Ninja Shuriken Throw
      this.audio.playKunai();
      this.spawnedProjectiles.push({
        type: 'shuriken',
        x: this.x + 24 + this.facing * 14,
        y: this.y + 20,
        vx: this.facing * 5.5,
        vy: 0,
        damage: 18,
        fromPlayer: false,
        life: 100
      });
      this.attackCooldown = 60;
    }

    this.vy += 0.38;
    Physics.moveAndSlide(this, world);
    this.animFrame += 0.15;
  }

  executeAttack(player) {
    this.state = 'attack';
    this.stateTimer = 18;

    if (this.type === 'ashigaru') {
      this.audio.playSlash(1);
      this.vx = this.facing * 2.8;
      // Hit check
      const spearBox = {
        x: this.facing === 1 ? this.x + 24 : this.x - 20,
        y: this.y + 16,
        w: 36,
        h: 20
      };
      const playerBox = {
        x: player.x + player.hitboxOffsetX,
        y: player.y + player.hitboxOffsetY,
        w: player.hitboxW,
        h: player.hitboxH
      };
      if (Physics.rectIntersect(spearBox, playerBox)) {
        player.takeDamage(22, this.x, true);
      }
    } else if (this.type === 'armored') {
      this.audio.playSlash(3);
      this.vx = this.facing * 3.5;
      const swingBox = {
        x: this.facing === 1 ? this.x + 20 : this.x - 24,
        y: this.y + 10,
        w: 48,
        h: 36
      };
      const playerBox = {
        x: player.x + player.hitboxOffsetX,
        y: player.y + player.hitboxOffsetY,
        w: player.hitboxW,
        h: player.hitboxH
      };
      if (Physics.rectIntersect(swingBox, playerBox)) {
        player.takeDamage(38, this.x, true);
      }
    } else if (this.type === 'shinobi') {
      this.audio.playSlash(2);
      this.vx = this.facing * 4.2;
      const slashBox = {
        x: this.facing === 1 ? this.x + 20 : this.x - 16,
        y: this.y + 14,
        w: 34,
        h: 24
      };
      const playerBox = {
        x: player.x + player.hitboxOffsetX,
        y: player.y + player.hitboxOffsetY,
        w: player.hitboxW,
        h: player.hitboxH
      };
      if (Physics.rectIntersect(slashBox, playerBox)) {
        player.takeDamage(20, this.x, true);
      }
    }
  }

  render(ctx, cameraX, cameraY) {
    if (this.state === 'dead' && this.stateTimer <= 0) return;

    const sx = Math.floor(this.x - cameraX);
    const sy = Math.floor(this.y - cameraY);

    ctx.save();
    if (this.facing === -1) {
      ctx.translate(sx + 48, sy);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(sx, sy);
    }

    let sprite = this.sprites.ashigaru;
    let frame = Math.floor(this.animFrame) % 4;

    if (this.type === 'ashigaru') {
      sprite = this.sprites.ashigaru;
      if (this.state === 'attack' || this.state === 'windup') frame = 5;
      else if (this.state === 'guard') frame = 7;
      else frame = Math.floor(this.animFrame) % 4;
    } else if (this.type === 'shinobi') {
      sprite = this.sprites.shinobi;
      if (this.state === 'attack' || this.state === 'windup') frame = 4;
      else frame = Math.floor(this.animFrame) % 4;
    } else if (this.type === 'armored') {
      sprite = this.sprites.armored;
      if (this.state === 'attack' || this.state === 'windup') frame = 4;
      else frame = Math.floor(this.animFrame) % 3;
    }

    ctx.drawImage(sprite, frame * 48, 0, 48, 48, 0, 0, 48, 48);

    // Health bar above enemy if damaged
    if (this.hp < this.maxHp && this.state !== 'dead') {
      const hpPct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = '#000000';
      ctx.fillRect(8, 2, 32, 4);
      ctx.fillStyle = '#ff3344';
      ctx.fillRect(9, 3, Math.floor(30 * hpPct), 2);
    }

    ctx.restore();
  }
}
