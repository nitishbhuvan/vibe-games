// ==========================================================================
// main.js - Master Game Loop & State Controller
// Ronin: Twilight Blade - 16-Bit Action Platformer
// ==========================================================================

import { PixelArtGen } from './graphics/PixelArtGen.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { Input } from './engine/Input.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { Lighting } from './world/Lighting.js';
import { World } from './world/World.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Boss } from './entities/Boss.js';
import { CollectiblesManager } from './entities/Collectibles.js';
import { HUD } from './ui/HUD.js';
import { Renderer } from './engine/Renderer.js';
import { Physics } from './engine/Physics.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.gameState = 'title'; // 'title', 'playing', 'paused', 'gameover', 'victory'

    // Core Systems
    this.pixelGen = new PixelArtGen();
    this.audio = new AudioEngine();
    this.input = new Input();
    this.particles = new ParticleSystem();
    this.lighting = new Lighting(640, 360);
    this.renderer = new Renderer(this.canvas, 640, 360);
    this.hud = new HUD();
    this.collectibles = new CollectiblesManager(this.pixelGen, this.audio, this.particles);

    // World & Entities
    this.world = new World(this.pixelGen);
    this.player = null;
    this.enemies = [];
    this.boss = null;

    // Game Stats & Checkpoints
    this.activeCheckpoint = { x: 80, y: 250 };
    this.enemiesDefeated = 0;
    this.startTime = 0;
    this.hitStopTimer = 0;

    // Story Trigger flags
    this.storyTriggers = {
      bamboo: false,
      torii: false,
      pagoda: false,
      boss: false
    };

    this.bindUI();
    this.initEntities();

    // Start Animation Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  initEntities() {
    // 1. Create Player at current checkpoint
    this.player = new Player(
      this.activeCheckpoint.x,
      this.activeCheckpoint.y,
      this.pixelGen,
      this.audio,
      this.particles
    );

    // 2. Spawn Stage Enemies
    this.enemies = [
      new Enemy(320, 250, 'ashigaru', this.pixelGen, this.audio, this.particles),
      new Enemy(540, 250, 'ashigaru', this.pixelGen, this.audio, this.particles),
      new Enemy(840, 200, 'shinobi', this.pixelGen, this.audio, this.particles),
      new Enemy(1280, 210, 'shinobi', this.pixelGen, this.audio, this.particles),
      new Enemy(1750, 130, 'armored', this.pixelGen, this.audio, this.particles),
      new Enemy(2020, 130, 'armored', this.pixelGen, this.audio, this.particles)
    ];

    // 3. Spawn Pagoda Summit Boss
    this.boss = new Boss(2540, 140, this.pixelGen, this.audio, this.particles);
  }

  bindUI() {
    // Start Game Button
    const startBtn = document.getElementById('start-game-btn');
    startBtn.addEventListener('click', () => {
      this.audio.init();
      this.startGame();
    });

    // Retry Button
    const retryBtn = document.getElementById('retry-btn');
    retryBtn.addEventListener('click', () => {
      this.respawnAtCheckpoint();
    });

    // Play Again Button
    const playAgainBtn = document.getElementById('play-again-btn');
    playAgainBtn.addEventListener('click', () => {
      this.activeCheckpoint = { x: 80, y: 250 };
      this.storyTriggers = { bamboo: false, torii: false, pagoda: false, boss: false };
      this.enemiesDefeated = 0;
      this.initEntities();
      this.startGame();
    });

    // Pause Controls
    const pauseBtn = document.getElementById('btn-pause');
    const resumeBtn = document.getElementById('resume-btn');
    const restartBtn = document.getElementById('restart-btn');

    pauseBtn.addEventListener('click', () => this.togglePause());
    resumeBtn.addEventListener('click', () => this.togglePause());
    restartBtn.addEventListener('click', () => {
      this.togglePause();
      this.initEntities();
    });

    // Audio Toggle
    const audioBtn = document.getElementById('btn-audio-toggle');
    const toggleSoundBtn = document.getElementById('toggle-sound-btn');
    const handleAudioToggle = () => {
      const isUnmuted = this.audio.toggleMute();
      audioBtn.textContent = isUnmuted ? '🔊' : '🔇';
      toggleSoundBtn.textContent = `AUDIO: ${isUnmuted ? 'ON' : 'OFF'}`;
    };
    audioBtn.addEventListener('click', handleAudioToggle);
    toggleSoundBtn.addEventListener('click', handleAudioToggle);

    // CRT Toggle
    const crtBtn = document.getElementById('btn-crt-toggle');
    const toggleCrtBtn = document.getElementById('toggle-crt-btn');
    const crtOverlay = document.getElementById('crt-overlay');

    const handleCrtToggle = () => {
      crtOverlay.classList.toggle('active');
      const isActive = crtOverlay.classList.contains('active');
      crtBtn.classList.toggle('active', isActive);
      toggleCrtBtn.textContent = `TOGGLE CRT: ${isActive ? 'ON' : 'OFF'}`;
    };
    crtBtn.addEventListener('click', handleCrtToggle);
    toggleCrtBtn.addEventListener('click', handleCrtToggle);
  }

  startGame() {
    this.gameState = 'playing';
    this.startTime = performance.now();
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('touch-controls').classList.remove('hidden');

    this.showStoryBanner('The twilight breeze whispers through the black bamboo...');
  }

  togglePause() {
    if (this.gameState !== 'playing' && this.gameState !== 'paused') return;
    const pauseScreen = document.getElementById('pause-screen');

    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      pauseScreen.classList.remove('hidden');
    } else {
      this.gameState = 'playing';
      pauseScreen.classList.add('hidden');
    }
  }

  respawnAtCheckpoint() {
    this.initEntities();
    this.gameState = 'playing';
    document.getElementById('game-over-screen').classList.add('hidden');
  }

  showStoryBanner(text, duration = 4000) {
    const banner = document.getElementById('story-banner');
    const content = document.getElementById('story-text');
    content.textContent = text;
    banner.classList.remove('hidden');

    if (this.storyTimeout) clearTimeout(this.storyTimeout);
    this.storyTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, duration);
  }

  // Master Update
  update() {
    if (this.gameState !== 'playing') return;

    // Hit-stop freeze frame effect on impactful blows
    if (this.hitStopTimer > 0) {
      this.hitStopTimer--;
      return;
    }

    // Toggle pause key
    if (this.input.consumeBuffer('pause')) {
      this.togglePause();
      return;
    }

    // 1. Update Player
    this.player.update(this.input, this.world);

    // Consume player spawned projectiles
    while (this.player.spawnedProjectiles.length > 0) {
      this.collectibles.addProjectile(this.player.spawnedProjectiles.shift());
    }

    // 2. Check Player Katana Attacks against Enemies & Boss
    const attackHitbox = this.player.getAttackHitbox();
    if (attackHitbox) {
      this.checkPlayerAttack(attackHitbox);
    }

    // 3. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(this.player, this.world);

      // Collect enemy projectiles
      while (enemy.spawnedProjectiles.length > 0) {
        this.collectibles.addProjectile(enemy.spawnedProjectiles.shift());
      }

      // Collect enemy drops
      while (enemy.spawnedDrops.length > 0) {
        const drop = enemy.spawnedDrops.shift();
        this.collectibles.addPickup(drop.type, drop.x, drop.y, drop.vx, drop.vy);
        this.enemiesDefeated++;
      }
    }

    // 4. Update Boss
    if (this.boss) {
      this.boss.update(this.player, this.world);
      while (this.boss.spawnedProjectiles.length > 0) {
        this.collectibles.addProjectile(this.boss.spawnedProjectiles.shift());
      }

      if (this.boss.isDefeated && this.gameState === 'playing' && this.boss.stateTimer <= 0) {
        this.triggerVictory();
      }
    }

    // 5. Update Projectiles & Pickups
    this.collectibles.update(this.player, this.enemies, this.boss, this.world);

    // 6. Update Checkpoints
    this.world.checkpoints.forEach(cp => {
      if (!cp.activated && Math.hypot(this.player.x - cp.x, this.player.y - cp.y) < 40) {
        cp.activated = true;
        this.activeCheckpoint = { x: cp.x, y: cp.y };
        this.audio.playHeal();
        this.particles.createSparks(cp.x + 16, cp.y + 16, 20, '#ffd700');
        this.showStoryBanner('Jizo Shrine activated. Vitality and spirits replenished.');
        this.player.gourds = this.player.maxGourds;
        this.player.hp = this.player.maxHp;
      }
    });

    // 7. Check Story Triggers
    if (!this.storyTriggers.torii && this.player.x > 1100) {
      this.storyTriggers.torii = true;
      this.showStoryBanner('The Great Torii Gate marks the boundary of the sacred grounds.');
    } else if (!this.storyTriggers.pagoda && this.player.x > 1650) {
      this.storyTriggers.pagoda = true;
      this.showStoryBanner('The Weathered Pagoda courtyard... armored sentries await.');
    } else if (!this.storyTriggers.boss && this.player.x > 2280) {
      this.storyTriggers.boss = true;
      this.showStoryBanner('Pagoda Summit: The Corrupted Warlord draws his cursed odachi!');
    }

    // 8. Update Camera, Particles & HUD
    this.renderer.setTarget(this.player.x, this.player.y, this.player.facing);
    this.particles.update(this.renderer.cameraX, this.renderer.cameraY, 640, 360);
    this.hud.update();

    // 9. Check Player Death
    if (this.player.state === 'dead' && this.gameState === 'playing') {
      setTimeout(() => {
        if (this.gameState === 'playing') {
          this.triggerGameOver();
        }
      }, 1400);
    }

    this.input.update();
  }

  // Katana Attack Overlap Resolution
  checkPlayerAttack(hitbox) {
    // Check Enemies
    this.enemies.forEach(enemy => {
      if (enemy.state === 'dead' || enemy.state === 'hurt') return;
      const eBox = {
        x: enemy.x + enemy.hitboxOffsetX,
        y: enemy.y + enemy.hitboxOffsetY,
        w: enemy.hitboxW,
        h: enemy.hitboxH
      };
      if (Physics.rectIntersect(hitbox, eBox)) {
        enemy.takeDamage(hitbox.damage, this.player.x, hitbox.type);
        this.hud.registerHit();
        this.renderer.addShake(hitbox.type === 'iai' ? 7 : 3.5);
        this.hitStopTimer = hitbox.type === 'slash3' ? 4 : 2;
      }
    });

    // Check Boss
    if (this.boss && !this.boss.isDefeated && this.boss.state !== 'hurt') {
      const bBox = {
        x: this.boss.x + this.boss.hitboxOffsetX,
        y: this.boss.y + this.boss.hitboxOffsetY,
        w: this.boss.hitboxW,
        h: this.boss.hitboxH
      };
      if (Physics.rectIntersect(hitbox, bBox)) {
        this.boss.takeDamage(hitbox.damage, this.player.x, hitbox.type);
        this.hud.registerHit();
        this.renderer.addShake(hitbox.type === 'iai' ? 9 : 4.5);
        this.hitStopTimer = 3;
      }
    }
  }

  triggerGameOver() {
    this.gameState = 'gameover';
    const statsDiv = document.getElementById('death-stats');
    statsDiv.innerHTML = `
      <div>Enemies Defeated: ${this.enemiesDefeated}</div>
      <div>Spirit Orbs Gathered: ${this.player.spiritOrbs}</div>
    `;
    document.getElementById('game-over-screen').classList.remove('hidden');
  }

  triggerVictory() {
    this.gameState = 'victory';
    const duration = Math.floor((performance.now() - this.startTime) / 1000);
    const statsDiv = document.getElementById('victory-stats');
    statsDiv.innerHTML = `
      <div>Clear Time: ${duration}s</div>
      <div>Enemies Defeated: ${this.enemiesDefeated}</div>
      <div>Spirit Orbs Collected: ${this.player.spiritOrbs}</div>
    `;
    document.getElementById('victory-screen').classList.remove('hidden');
  }

  // Master Render Loop
  render() {
    this.renderer.renderScene(
      this.world,
      this.player,
      this.enemies,
      this.boss,
      this.collectibles,
      this.particles,
      this.lighting,
      this.hud
    );
  }

  loop(currentTime) {
    this.update();
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }
}

// Start Game Instance
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
