// ==========================================================================
// Player.js - The Wandering Ronin Player Controller & Combat State Machine
// 3-Hit Katana Combo, Parry/Deflection, Iaijutsu Dash Strike, Wall Jumps
// ==========================================================================

import { Physics } from '../engine/Physics.js';

export class Player {
  constructor(x, y, pixelGen, audioEngine, particleSystem) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.pixelGen = pixelGen;
    this.audio = audioEngine;
    this.particles = particleSystem;
    this.sprites = this.pixelGen.generatePlayerSprites();

    // Hitbox & Dimensions
    this.width = 48;
    this.height = 48;
    this.hitboxOffsetX = 16;
    this.hitboxOffsetY = 12;
    this.hitboxW = 16;
    this.hitboxH = 34;

    // Movement parameters
    this.MOVE_SPEED = 2.8;
    this.ACCEL = 0.45;
    this.FRICTION = 0.78;
    this.GRAVITY = 0.38;
    this.JUMP_FORCE = -7.2;
    this.DOUBLE_JUMP_FORCE = -6.2;
    this.WALL_SLIDE_SPEED = 1.0;
    this.WALL_JUMP_FORCE_X = 4.2;
    this.WALL_JUMP_FORCE_Y = -6.5;

    // Player Stats & Resources
    this.hp = 100;
    this.maxHp = 100;
    this.ki = 100;
    this.maxKi = 100;
    this.gourds = 3;
    this.maxGourds = 3;
    this.kunais = 6;
    this.spiritOrbs = 0;

    // Combat State Machine
    this.state = 'idle'; // 'idle', 'run', 'jump', 'fall', 'wall_slide', 'attack1', 'attack2', 'attack3', 'air_attack', 'parry', 'roll', 'iai_charge', 'iai_strike', 'heal', 'hurt', 'dead'
    this.facing = 1; // 1 for right, -1 for left
    this.stateTimer = 0;
    this.animFrame = 0;
    this.animSpeed = 0.18;

    // Physics Flags
    this.isGrounded = false;
    this.canDoubleJump = true;
    this.onWall = 0;
    this.coyoteTimer = 0;
    this.isDroppingDown = false;

    // Combat & I-Frames
    this.invulnerableTimer = 0;
    this.parryActiveTimer = 0;
    this.iaiChargeTimer = 0;
    this.comboQueued = false;
    this.lastAttackTime = 0;

    // Projectile Spawns Queue
    this.spawnedProjectiles = [];
  }

  // Trigger Damage / Hit
  takeDamage(amount, fromX = null, isParryable = true) {
    if (this.state === 'dead' || this.invulnerableTimer > 0) return false;

    // 1. Check if currently Parry Active
    if (this.parryActiveTimer > 0 && isParryable) {
      this.audio.playParry();
      this.particles.createSparks(this.x + 24 + this.facing * 14, this.y + 24, 18, '#ffd700');
      this.invulnerableTimer = 20;
      this.ki = Math.min(this.maxKi, this.ki + 25);
      return 'parried';
    }

    // 2. Regular Damage
    this.hp -= amount;
    this.audio.playHit();
    this.particles.createBlood(this.x + 24, this.y + 24, fromX ? (this.x > fromX ? 1 : -1) : -this.facing, 14);
    this.particles.createDamageNumber(this.x + 20, this.y + 10, amount, true);

    this.invulnerableTimer = 35;
    this.state = 'hurt';
    this.stateTimer = 16;
    this.vy = -3.5;
    if (fromX) {
      this.vx = (this.x > fromX ? 1 : -1) * 3.0;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
      this.audio.playDeath();
    }
    return 'hit';
  }

  // Heal using gourd
  useHeal() {
    if (this.gourds > 0 && this.hp < this.maxHp && this.state !== 'dead' && this.state !== 'heal') {
      this.gourds--;
      this.hp = Math.min(this.maxHp, this.hp + 45);
      this.state = 'heal';
      this.stateTimer = 25;
      this.vx = 0;
      this.audio.playHeal();
      this.particles.createSparks(this.x + 24, this.y + 20, 10, '#38b000');
    }
  }

  // Throw Kunai
  throwKunai() {
    if (this.kunais > 0 && this.state !== 'dead' && this.state !== 'roll') {
      this.kunais--;
      this.audio.playKunai();
      this.spawnedProjectiles.push({
        type: 'kunai',
        x: this.x + 24 + this.facing * 16,
        y: this.y + 24,
        vx: this.facing * 9.0,
        vy: 0,
        damage: 25,
        fromPlayer: true,
        life: 120
      });
    }
  }

  // Update State & Input
  update(input, world) {
    if (this.state === 'dead') {
      this.vy += this.GRAVITY;
      Physics.moveAndSlide(this, world);
      return;
    }

    // Regain Ki over time
    if (this.ki < this.maxKi && this.state !== 'iai_charge') {
      this.ki = Math.min(this.maxKi, this.ki + 0.18);
    }

    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.parryActiveTimer > 0) this.parryActiveTimer--;

    // 1. Process Active Action States (Locks movement)
    if (this.state === 'attack1' || this.state === 'attack2' || this.state === 'attack3') {
      this.updateAttackState(input, world);
      return;
    }

    if (this.state === 'parry') {
      this.stateTimer--;
      this.vx *= 0.8;
      if (this.stateTimer <= 0) this.state = 'idle';
      Physics.moveAndSlide(this, world);
      return;
    }

    if (this.state === 'roll') {
      this.updateRollState(world);
      return;
    }

    if (this.state === 'iai_charge' || this.state === 'iai_strike') {
      this.updateIaiState(input, world);
      return;
    }

    if (this.state === 'heal' || this.state === 'hurt') {
      this.stateTimer--;
      if (this.stateTimer <= 0) this.state = 'idle';
      this.vy += this.GRAVITY;
      Physics.moveAndSlide(this, world);
      return;
    }

    // 2. Check Action Input Triggers
    if (input.consumeBuffer('heal')) {
      this.useHeal();
      return;
    }

    if (input.consumeBuffer('kunai')) {
      this.throwKunai();
    }

    if (input.consumeBuffer('parry')) {
      this.state = 'parry';
      this.stateTimer = 18;
      this.parryActiveTimer = 14;
      this.audio.playSlash(1);
      return;
    }

    if (input.consumeBuffer('roll') && this.isGrounded) {
      this.state = 'roll';
      this.stateTimer = 20;
      this.invulnerableTimer = 16;
      this.vx = this.facing * 5.2;
      this.audio.playJump();
      return;
    }

    // Iaijutsu Hold / Release
    if (input.isDown('iai') && this.ki >= 35 && this.isGrounded) {
      this.state = 'iai_charge';
      this.iaiChargeTimer = 0;
      return;
    }

    // Attack Trigger
    if (input.consumeBuffer('attack')) {
      this.startAttackCombo();
      return;
    }

    // 3. Movement & Platforming Physics
    const moveLeft = input.isDown('left');
    const moveRight = input.isDown('right');
    const moveDown = input.isDown('down');

    // Horizontal Acceleration
    if (moveLeft && !moveRight) {
      this.vx = Math.max(-this.MOVE_SPEED, this.vx - this.ACCEL);
      this.facing = -1;
    } else if (moveRight && !moveLeft) {
      this.vx = Math.min(this.MOVE_SPEED, this.vx + this.ACCEL);
      this.facing = 1;
    } else {
      this.vx *= this.FRICTION;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // Drop down through one-way platforms
    if (moveDown && input.consumeBuffer('jump') && this.isGrounded) {
      this.isDroppingDown = true;
      this.y += 2;
      this.isGrounded = false;
    }
    // Jump / Double Jump
    else if (input.consumeBuffer('jump')) {
      if (this.isGrounded || this.coyoteTimer > 0) {
        this.vy = this.JUMP_FORCE;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.audio.playJump();
        this.particles.createDust(this.x + 24, this.y + 46, 5);
      } else if (this.onWall !== 0) {
        // Wall Jump
        this.vy = this.WALL_JUMP_FORCE_Y;
        this.vx = -this.onWall * this.WALL_JUMP_FORCE_X;
        this.facing = -this.onWall;
        this.audio.playJump();
        this.particles.createSparks(this.x + 24 + this.onWall * 12, this.y + 30, 8);
      } else if (this.canDoubleJump) {
        // Double Jump
        this.vy = this.DOUBLE_JUMP_FORCE;
        this.canDoubleJump = false;
        this.audio.playJump();
        this.particles.createSparks(this.x + 24, this.y + 40, 6, '#70e5ff');
      }
    }

    // Wall Sliding Physics
    if (this.onWall !== 0 && !this.isGrounded && this.vy > 0) {
      this.state = 'wall_slide';
      this.vy = Math.min(this.vy, this.WALL_SLIDE_SPEED);
      if (Math.random() > 0.6) {
        this.particles.createSparks(this.x + 24 + this.onWall * 10, this.y + 36, 2);
      }
    } else {
      // Normal Gravity
      this.vy += this.GRAVITY;
      if (this.vy > 9.0) this.vy = 9.0;
    }

    // Move & Resolve Collisions
    Physics.moveAndSlide(this, world);

    // Update Grounded & Coyote state
    if (this.isGrounded) {
      this.canDoubleJump = true;
      this.coyoteTimer = 6;
      if (Math.abs(this.vx) > 0.2) {
        this.state = 'run';
        if (Math.random() > 0.8) {
          this.particles.createDust(this.x + 24, this.y + 46, 1);
        }
      } else {
        this.state = 'idle';
      }
    } else {
      if (this.coyoteTimer > 0) this.coyoteTimer--;
      if (this.state !== 'wall_slide') {
        this.state = this.vy < 0 ? 'jump' : 'fall';
      }
    }

    // Step Animation Frame
    this.animFrame += this.animSpeed;
  }

  // ------------------------------------------------------------------------
  // Attack Combo Logic
  // ------------------------------------------------------------------------
  startAttackCombo() {
    const now = performance.now();
    if (!this.isGrounded) {
      // Aerial Slash
      this.state = 'air_attack';
      this.stateTimer = 16;
      this.audio.playSlash(2);
      return;
    }

    this.state = 'attack1';
    this.stateTimer = 14;
    this.vx = this.facing * 2.2;
    this.lastAttackTime = now;
    this.comboQueued = false;
    this.audio.playSlash(1);
  }

  updateAttackState(input, world) {
    this.stateTimer--;
    this.vx *= 0.85;

    // Buffer next combo hit
    if (input.consumeBuffer('attack')) {
      this.comboQueued = true;
    }

    if (this.stateTimer <= 0) {
      if (this.comboQueued) {
        this.comboQueued = false;
        if (this.state === 'attack1') {
          this.state = 'attack2';
          this.stateTimer = 14;
          this.vx = this.facing * 2.5;
          this.audio.playSlash(2);
        } else if (this.state === 'attack2') {
          this.state = 'attack3';
          this.stateTimer = 18;
          this.vx = this.facing * 3.2;
          this.audio.playSlash(3);
        } else {
          this.state = 'idle';
        }
      } else {
        this.state = 'idle';
      }
    }

    this.vy += this.GRAVITY;
    Physics.moveAndSlide(this, world);
  }

  // ------------------------------------------------------------------------
  // Roll / Dodge State
  // ------------------------------------------------------------------------
  updateRollState(world) {
    this.stateTimer--;
    this.vx *= 0.95;

    if (this.stateTimer % 3 === 0) {
      this.particles.createGhostTrail(this.x, this.y, this.width, this.height, this.facing, this.sprites.roll, 0, 0);
    }

    if (this.stateTimer <= 0) {
      this.state = 'idle';
    }

    this.vy += this.GRAVITY;
    Physics.moveAndSlide(this, world);
  }

  // ------------------------------------------------------------------------
  // Iaijutsu Charged Strike
  // ------------------------------------------------------------------------
  updateIaiState(input, world) {
    if (this.state === 'iai_charge') {
      this.iaiChargeTimer++;
      this.vx = 0;

      // Charge particles
      if (Math.random() > 0.4) {
        this.particles.createSparks(this.x + 24 - this.facing * 8, this.y + 30, 3, '#70e5ff');
      }

      // If key released or max charged
      if (!input.isDown('iai') || this.iaiChargeTimer >= 60) {
        this.state = 'iai_strike';
        this.stateTimer = 12;
        this.ki -= 40;
        this.invulnerableTimer = 16;
        this.audio.playIaiStrike();

        const dashDist = 120 * this.facing;
        const startX = this.x + 24;
        const startY = this.y + 24;

        this.x += dashDist;
        const endX = this.x + 24;
        const endY = this.y + 24;

        this.particles.createSlashLine(startX, startY, endX, endY, '#ff3344');
      }
    } else if (this.state === 'iai_strike') {
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        this.state = 'idle';
      }
    }

    this.vy += this.GRAVITY;
    Physics.moveAndSlide(this, world);
  }

  // Get active sword attack hitbox (returns rect or null)
  getAttackHitbox() {
    if (this.state === 'attack1') {
      return {
        x: this.facing === 1 ? this.x + 26 : this.x - 12,
        y: this.y + 14,
        w: 34,
        h: 26,
        damage: 20,
        knockback: 3.5,
        type: 'slash1'
      };
    } else if (this.state === 'attack2') {
      return {
        x: this.facing === 1 ? this.x + 26 : this.x - 12,
        y: this.y + 6,
        w: 36,
        h: 34,
        damage: 28,
        knockback: 4.5,
        type: 'slash2'
      };
    } else if (this.state === 'attack3') {
      return {
        x: this.facing === 1 ? this.x + 24 : this.x - 16,
        y: this.y + 12,
        w: 40,
        h: 32,
        damage: 42,
        knockback: 6.0,
        type: 'slash3'
      };
    } else if (this.state === 'air_attack') {
      return {
        x: this.x + 4,
        y: this.y + 8,
        w: 40,
        h: 36,
        damage: 25,
        knockback: 4.0,
        type: 'air'
      };
    } else if (this.state === 'iai_strike') {
      return {
        x: this.facing === 1 ? this.x - 120 : this.x,
        y: this.y + 10,
        w: 140,
        h: 30,
        damage: 65,
        knockback: 7.0,
        type: 'iai'
      };
    }
    return null;
  }

  // Render Ronin
  render(ctx, cameraX, cameraY) {
    const sx = Math.floor(this.x - cameraX);
    const sy = Math.floor(this.y - cameraY);

    // Flashing effect when invulnerable
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
      return;
    }

    ctx.save();
    if (this.facing === -1) {
      ctx.translate(sx + 48, sy);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(sx, sy);
    }

    // Pick sprite canvas & frame
    let sprite = this.sprites.idle;
    let frame = Math.floor(this.animFrame) % 4;

    if (this.state === 'run') {
      sprite = this.sprites.run;
      frame = Math.floor(this.animFrame) % 6;
    } else if (this.state === 'jump' || this.state === 'fall') {
      sprite = this.sprites.jump;
      frame = this.vy < 0 ? 0 : 2;
    } else if (this.state === 'wall_slide') {
      sprite = this.sprites.wallSlide;
      frame = Math.floor(this.animFrame) % 2;
    } else if (this.state === 'attack1') {
      sprite = this.sprites.attack1;
      frame = Math.min(2, Math.floor((14 - this.stateTimer) / 4.6));
    } else if (this.state === 'attack2') {
      sprite = this.sprites.attack2;
      frame = Math.min(2, Math.floor((14 - this.stateTimer) / 4.6));
    } else if (this.state === 'attack3') {
      sprite = this.sprites.attack3;
      frame = Math.min(3, Math.floor((18 - this.stateTimer) / 4.5));
    } else if (this.state === 'air_attack') {
      sprite = this.sprites.attack2;
      frame = 1;
    } else if (this.state === 'parry') {
      sprite = this.sprites.parry;
      frame = this.parryActiveTimer > 0 ? 1 : 0;
    } else if (this.state === 'roll') {
      sprite = this.sprites.roll;
      frame = Math.floor((20 - this.stateTimer) / 5) % 4;
    } else if (this.state === 'iai_charge' || this.state === 'iai_strike') {
      sprite = this.sprites.iai;
      frame = this.state === 'iai_charge' ? (this.iaiChargeTimer > 20 ? 1 : 0) : 2;
    }

    ctx.drawImage(sprite, frame * 48, 0, 48, 48, 0, 0, 48, 48);
    ctx.restore();
  }
}
