// ============================================================================
// engine.ts - 2D Metroidvania Physics, Katana Tethering, Realm Shifts & Enemies
// Ronin's Gambit Core Engine
// ============================================================================

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  isOneWay?: boolean;
  isShadowBarrier?: boolean; // Can only be traversed via Phantom Dash
}

export interface KatanaTether {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: number;
  isEmbedded: boolean;
  embeddedEnemyId?: number;
  rotation: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'petal' | 'firefly' | 'spark' | 'dust' | 'void_wisp' | 'tether_beam';
  alpha: number;
}

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  color: string;
  flickerSpeed: number;
  intensity: number;
}

export class RoninGameEngine {
  public width = 1024;
  public height = 576;

  // Level platforms for Physical Realm (Ruined Dojo)
  public physicalPlatforms: Platform[] = [
    { x: 0, y: 340, w: 260, h: 236 },
    { x: 250, y: 410, w: 100, h: 166 },
    { x: 345, y: 375, w: 220, h: 24, isOneWay: true },
    { x: 565, y: 350, w: 180, h: 226 },
    { x: 740, y: 285, w: 284, h: 291 },
    { x: 0, y: 490, w: 1024, h: 86 },
  ];

  // Level platforms for Shadow Realm (Floating Void Ruins)
  public shadowPlatforms: Platform[] = [
    { x: 0, y: 490, w: 1024, h: 86 },       // Lower stone walkway
    { x: 30, y: 370, w: 200, h: 24, isOneWay: true }, // Left floating arch
    { x: 270, y: 330, w: 150, h: 20, isOneWay: true }, // Mid floating void rock 1
    { x: 460, y: 380, w: 120, h: 20, isOneWay: true }, // Mid floating void rock 2
    { x: 580, y: 320, w: 140, h: 20, isOneWay: true }, // Bridge under corrupted pagoda
    { x: 720, y: 240, w: 240, h: 24, isOneWay: true }, // High Pagoda summit
    { x: 840, y: 420, w: 160, h: 24, isOneWay: true }, // Right shrine platform
  ];

  // Current active platforms
  public platforms: Platform[] = this.physicalPlatforms;

  // Lantern Light Sources
  public lights: LightSource[] = [
    { x: 98, y: 360, radius: 140, color: '#f59e0b', flickerSpeed: 3.5, intensity: 0.9 },
    { x: 435, y: 310, radius: 130, color: '#f59e0b', flickerSpeed: 4.2, intensity: 0.85 },
    { x: 820, y: 220, radius: 140, color: '#f59e0b', flickerSpeed: 3.8, intensity: 0.9 },
    { x: 915, y: 430, radius: 125, color: '#f59e0b', flickerSpeed: 3.0, intensity: 0.8 },
  ];

  // Katana Tethering System
  public tether: KatanaTether = {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    dir: 1,
    isEmbedded: false,
    rotation: 0,
  };

  // Particles & FX
  public particles: Particle[] = [];
  public screenShake = 0;
  public hitStopFrames = 0;

  public setRealm(realm: 'physical' | 'shadow') {
    this.platforms = realm === 'physical' ? this.physicalPlatforms : this.shadowPlatforms;
    this.initAmbientParticles(realm);
  }

  public initAmbientParticles(realm: 'physical' | 'shadow' = 'physical') {
    this.particles = [];
    if (realm === 'physical') {
      for (let i = 0; i < 30; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: 0.4 + Math.random() * 0.5,
          vy: 0.3 + Math.random() * 0.3,
          life: 15 + Math.random() * 20,
          maxLife: 35,
          size: 3 + Math.random() * 3,
          color: '#fbcfe8',
          type: 'petal',
          alpha: 0.6,
        });
      }
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          life: 8 + Math.random() * 10,
          maxLife: 18,
          size: 3,
          color: '#fef08a',
          type: 'firefly',
          alpha: 0.7,
        });
      }
    } else {
      // Shadow Realm: Eerie void wisps and neon energy sparks
      for (let i = 0; i < 35; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.4 - Math.random() * 0.8,
          life: 6 + Math.random() * 10,
          maxLife: 16,
          size: 3 + Math.random() * 3,
          color: Math.random() < 0.5 ? '#a855f7' : '#38bdf8',
          type: 'void_wisp',
          alpha: 0.75,
        });
      }
    }
  }

  // Update Katana Tether Flight & Embedding
  public updateTether(dt: number) {
    if (!this.tether.active || this.tether.isEmbedded) return;

    this.tether.x += this.tether.vx * dt;
    this.tether.y += this.tether.vy * dt;
    this.tether.rotation += this.tether.dir * 15 * dt;

    // Check collision with platforms
    this.platforms.forEach((plat) => {
      if (
        this.tether.x >= plat.x &&
        this.tether.x <= plat.x + plat.w &&
        this.tether.y >= plat.y &&
        this.tether.y <= plat.y + Math.min(24, plat.h)
      ) {
        this.tether.isEmbedded = true;
        this.tether.vx = 0;
        this.tether.vy = 0;
        this.addSparkBurst(this.tether.x, this.tether.y, 8, '#38bdf8');
      }
    });

    // Boundary embed
    if (this.tether.x <= 20 || this.tether.x >= 1004 || this.tether.y >= 540) {
      this.tether.isEmbedded = true;
      this.tether.vx = 0;
      this.tether.vy = 0;
      this.tether.x = Math.max(25, Math.min(995, this.tether.x));
    }
  }

  public updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      if (p.type === 'petal') {
        p.x += Math.sin(p.life * 2) * 0.5;
        if (p.y > this.height) {
          p.y = -8;
          p.x = Math.random() * this.width;
        }
        if (p.x > this.width) p.x = 0;
      } else if (p.type === 'void_wisp') {
        p.x += Math.sin(p.life * 3) * 0.8;
        p.alpha = 0.4 + Math.sin(p.life * 4) * 0.4;
        if (p.y < 0) {
          p.y = this.height + 10;
          p.x = Math.random() * this.width;
        }
      } else if (p.type === 'firefly') {
        p.alpha = 0.4 + Math.sin(p.life * 4) * 0.4;
      } else if (p.type === 'spark' || p.type === 'dust') {
        p.alpha = p.life / p.maxLife;
      }

      if (p.life <= 0 && p.type !== 'petal' && p.type !== 'firefly' && p.type !== 'void_wisp') {
        this.particles.splice(i, 1);
      }
    }
  }

  public addSparkBurst(x: number, y: number, count: number = 10, color: string = '#fbbf24') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 5.0;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.25,
        maxLife: 0.55,
        size: 3 + Math.random() * 3,
        color,
        type: 'spark',
        alpha: 1.0,
      });
    }
  }

  public addDust(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + 2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.6 - Math.random() * 0.8,
        life: 0.35,
        maxLife: 0.35,
        size: 4,
        color: '#475569',
        type: 'dust',
        alpha: 0.6,
      });
    }
  }

  public triggerScreenShake(intensity: number = 6) {
    this.screenShake = intensity;
  }

  public renderLighting(ctx: CanvasRenderingContext2D, timeMs: number, playerX?: number, playerY?: number, isChargingIai?: boolean) {
    const ambientGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    ambientGrad.addColorStop(0, 'rgba(15, 10, 25, 0.12)');
    ambientGrad.addColorStop(1, 'rgba(10, 5, 18, 0.22)');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    this.lights.forEach((light) => {
      const flicker = Math.sin((timeMs / 1000) * light.flickerSpeed + light.x) * 0.12;
      const radius = light.radius * (1 + flicker);

      const radGrad = ctx.createRadialGradient(light.x, light.y, 6, light.x, light.y, radius);
      radGrad.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
      radGrad.addColorStop(0.35, 'rgba(217, 119, 6, 0.4)');
      radGrad.addColorStop(0.7, 'rgba(180, 83, 9, 0.15)');
      radGrad.addColorStop(1, 'rgba(180, 83, 9, 0)');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(light.x, light.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (isChargingIai && playerX !== undefined && playerY !== undefined) {
      const kiGrad = ctx.createRadialGradient(playerX, playerY, 8, playerX, playerY, 95);
      kiGrad.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
      kiGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.5)');
      kiGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = kiGrad;
      ctx.beginPath();
      ctx.arc(playerX, playerY, 95, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Katana Tether Energy Line
  public renderTetherBeam(ctx: CanvasRenderingContext2D, playerX: number, playerY: number) {
    if (!this.tether.active) return;

    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.setLineDash([6, 4]);

    ctx.beginPath();
    ctx.moveTo(playerX, playerY - 45);
    ctx.lineTo(this.tether.x, this.tether.y);
    ctx.stroke();

    // Inner bright white line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playerX, playerY - 45);
    ctx.lineTo(this.tether.x, this.tether.y);
    ctx.stroke();

    // Draw Katana sprite at tether head
    ctx.translate(this.tether.x, this.tether.y);
    ctx.rotate(this.tether.rotation);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-14, -2, 28, 4);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-18, -3, 6, 6);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-12, -4, 2, 8);

    ctx.restore();
  }

  public renderParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'petal') {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'firefly' || p.type === 'void_wisp') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

      ctx.restore();
    });
  }
}
