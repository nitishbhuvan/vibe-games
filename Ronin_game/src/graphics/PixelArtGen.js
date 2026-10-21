// ==========================================================================
// PixelArtGen.js - 16-Bit Pixel Art Procedural Generator
// Generates high-detail retro sprites, environment tiles, and animations
// ==========================================================================

export class PixelArtGen {
  constructor() {
    this.cache = new Map();
  }

  // Helper to create an offscreen canvas
  createCanvas(width, height) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx };
  }

  // Draw pixel rect helper
  px(ctx, color, x, y, w = 1, h = 1) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  // ========================================================================
  // 1. PLAYER RONIN SPRITES
  // Size: 48x48 per frame
  // ========================================================================
  generatePlayerSprites() {
    const fw = 48;
    const fh = 48;
    const sprites = {};

    // Palettes
    const C = {
      skin: '#e8be96',
      skinShadow: '#b88b68',
      hair: '#141018',
      hatBase: '#8a6538',
      hatLight: '#b88d54',
      hatDark: '#523c1d',
      hatRope: '#b32424',
      robeDark: '#1d1b26',
      robeMid: '#2e2a3b',
      robeLight: '#49445c',
      robeTrim: '#b32424',
      haori: '#c43333',
      haoriDark: '#851b1b',
      haoriLight: '#e65353',
      pants: '#18151f',
      wrap: '#d4ceb8',
      wrapDark: '#999480',
      blade: '#e8f4f8',
      bladeGleam: '#ffffff',
      bladeDark: '#7a8f99',
      scabbard: '#241b18',
      gold: '#ffcc00',
      slashWhite: '#ffffff',
      slashCyan: '#70e5ff',
      slashRed: '#ff3344'
    };

    // Helper: Base Ronin drawing
    const drawRoninBase = (ctx, ox, oy, opts = {}) => {
      const {
        legState = 0,
        bob = 0,
        swordState = 'sheathed', // 'sheathed', 'draw', 'slash1', 'slash2', 'slash3', 'block', 'iai'
        armAngle = 0,
        capeWave = 0,
        eyesBlink = false,
        hatTilt = 0
      } = opts;

      const cx = ox + 24;
      const cy = oy + 28 + bob;

      // 1. Cape / Haori Back Layer
      ctx.fillStyle = C.haoriDark;
      if (legState === 'run') {
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 10);
        ctx.lineTo(cx - 16 - capeWave, cy - 2);
        ctx.lineTo(cx - 12 - capeWave * 1.5, cy + 8);
        ctx.lineTo(cx - 4, cy + 4);
        ctx.fill();
      } else {
        ctx.fillRect(cx - 8, cy - 10, 6, 16);
        ctx.fillRect(cx - 10 - capeWave, cy - 6, 4, 14);
      }

      // 2. Legs / Hakama Pants
      ctx.fillStyle = C.pants;
      if (legState === 0) { // Idle stance
        ctx.fillRect(cx - 6, cy + 2, 5, 11);
        ctx.fillRect(cx + 1, cy + 2, 5, 11);
        // Leg wraps
        ctx.fillStyle = C.wrap;
        ctx.fillRect(cx - 6, cy + 9, 5, 3);
        ctx.fillRect(cx + 1, cy + 9, 5, 3);
        // Sandals
        ctx.fillStyle = C.hatDark;
        ctx.fillRect(cx - 7, cy + 12, 6, 2);
        ctx.fillRect(cx, cy + 12, 6, 2);
      } else if (legState === 1) { // Run 1
        ctx.fillRect(cx - 8, cy + 2, 5, 9);
        ctx.fillRect(cx + 2, cy + 1, 5, 11);
        ctx.fillStyle = C.wrap;
        ctx.fillRect(cx - 8, cy + 7, 5, 3);
        ctx.fillRect(cx + 2, cy + 8, 5, 3);
        ctx.fillStyle = C.hatDark;
        ctx.fillRect(cx - 9, cy + 10, 6, 2);
        ctx.fillRect(cx + 1, cy + 11, 6, 2);
      } else if (legState === 2) { // Run 2 (passing)
        ctx.fillRect(cx - 4, cy + 1, 5, 12);
        ctx.fillRect(cx - 1, cy + 2, 5, 10);
        ctx.fillStyle = C.wrap;
        ctx.fillRect(cx - 4, cy + 9, 5, 3);
        ctx.fillRect(cx - 1, cy + 8, 5, 3);
        ctx.fillStyle = C.hatDark;
        ctx.fillRect(cx - 5, cy + 12, 6, 2);
        ctx.fillRect(cx - 2, cy + 11, 6, 2);
      } else if (legState === 3) { // Run 3 (extended)
        ctx.fillRect(cx + 3, cy + 2, 5, 9);
        ctx.fillRect(cx - 7, cy + 1, 5, 11);
        ctx.fillStyle = C.wrap;
        ctx.fillRect(cx + 3, cy + 7, 5, 3);
        ctx.fillRect(cx - 7, cy + 8, 5, 3);
        ctx.fillStyle = C.hatDark;
        ctx.fillRect(cx + 2, cy + 10, 6, 2);
        ctx.fillRect(cx - 8, cy + 11, 6, 2);
      } else if (legState === 'jump') {
        ctx.fillRect(cx - 7, cy + 1, 5, 8);
        ctx.fillRect(cx + 1, cy + 3, 5, 7);
        ctx.fillStyle = C.wrap;
        ctx.fillRect(cx - 7, cy + 6, 5, 2);
        ctx.fillRect(cx + 1, cy + 7, 5, 2);
      }

      // 3. Torso & Kimono / Haori
      ctx.fillStyle = C.robeDark;
      ctx.fillRect(cx - 6, cy - 10, 12, 13);
      // Haori Front Red Vest
      ctx.fillStyle = C.haori;
      ctx.fillRect(cx - 7, cy - 10, 3, 12);
      ctx.fillRect(cx + 4, cy - 10, 3, 12);
      // Belt / Obi
      ctx.fillStyle = C.hatDark;
      ctx.fillRect(cx - 6, cy + 1, 12, 3);
      ctx.fillStyle = C.gold;
      ctx.fillRect(cx - 1, cy + 1, 2, 3);

      // Scabbard on hip
      if (swordState === 'sheathed' || swordState === 'iai') {
        ctx.fillStyle = C.scabbard;
        ctx.fillRect(cx - 10, cy + 1, 12, 3);
        ctx.fillStyle = C.gold;
        ctx.fillRect(cx - 11, cy + 1, 2, 3); // Tsuka (hilt)
        ctx.fillRect(cx + 1, cy + 1, 2, 3); // Kojiri tip
      }

      // 4. Head & Face
      ctx.fillStyle = C.skin;
      ctx.fillRect(cx - 4, cy - 16, 8, 7);
      ctx.fillStyle = C.skinShadow;
      ctx.fillRect(cx - 4, cy - 11, 8, 2);
      // Eyes / Scarf
      if (!eyesBlink) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx + 1, cy - 14, 2, 2);
        ctx.fillStyle = '#111';
        ctx.fillRect(cx + 2, cy - 14, 1, 2);
      }

      // 5. Traditional Straw Hat (Sugegasa / Ronin Hat)
      ctx.fillStyle = C.hatDark;
      // Hat rim
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy - 14 + hatTilt);
      ctx.lineTo(cx + 14, cy - 14 - hatTilt);
      ctx.lineTo(cx, cy - 24);
      ctx.closePath();
      ctx.fill();

      // Hat highlight
      ctx.fillStyle = C.hatLight;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 15 + hatTilt);
      ctx.lineTo(cx + 10, cy - 15 - hatTilt);
      ctx.lineTo(cx, cy - 22);
      ctx.closePath();
      ctx.fill();

      // Hat base line
      ctx.fillStyle = C.hatBase;
      ctx.fillRect(cx - 13, cy - 15 + hatTilt, 26, 2);

      // 6. Arms & Katana in Action
      if (swordState === 'sheathed') {
        // Left hand resting on hilt, right hand relaxed
        ctx.fillStyle = C.haori;
        ctx.fillRect(cx - 5, cy - 9, 3, 7);
        ctx.fillRect(cx + 3, cy - 9, 3, 6);
        ctx.fillStyle = C.skin;
        ctx.fillRect(cx - 6, cy - 2, 3, 3);
        ctx.fillRect(cx + 3, cy - 3, 3, 3);
      } else if (swordState === 'slash1') {
        // Forward lunge slash
        ctx.fillStyle = C.haori;
        ctx.fillRect(cx + 2, cy - 9, 7, 3);
        ctx.fillStyle = C.skin;
        ctx.fillRect(cx + 8, cy - 9, 3, 3);
        // Extended blade
        ctx.fillStyle = C.blade;
        ctx.fillRect(cx + 11, cy - 11, 14, 2);
        ctx.fillStyle = C.bladeGleam;
        ctx.fillRect(cx + 12, cy - 12, 12, 1);
        ctx.fillStyle = C.gold;
        ctx.fillRect(cx + 10, cy - 12, 2, 4); // Tsuba
      } else if (swordState === 'slash2') {
        // High upward slash
        ctx.fillStyle = C.haori;
        ctx.fillRect(cx + 1, cy - 12, 4, 6);
        ctx.fillStyle = C.skin;
        ctx.fillRect(cx + 3, cy - 14, 3, 3);
        // Katana pointing up/right
        ctx.fillStyle = C.blade;
        ctx.fillRect(cx + 4, cy - 26, 3, 14);
        ctx.fillStyle = C.bladeGleam;
        ctx.fillRect(cx + 6, cy - 25, 1, 12);
        ctx.fillStyle = C.gold;
        ctx.fillRect(cx + 3, cy - 15, 5, 2);
      } else if (swordState === 'slash3') {
        // Downward cleave
        ctx.fillStyle = C.haori;
        ctx.fillRect(cx + 3, cy - 5, 6, 4);
        ctx.fillStyle = C.skin;
        ctx.fillRect(cx + 8, cy - 2, 3, 3);
        // Katana slammed down
        ctx.fillStyle = C.blade;
        ctx.fillRect(cx + 10, cy, 14, 3);
        ctx.fillStyle = C.bladeGleam;
        ctx.fillRect(cx + 10, cy + 1, 14, 1);
      } else if (swordState === 'block') {
        // Defensive parry guard
        ctx.fillStyle = C.haori;
        ctx.fillRect(cx + 2, cy - 10, 4, 6);
        ctx.fillStyle = C.skin;
        ctx.fillRect(cx + 4, cy - 12, 3, 4);
        // Vertical blade guard
        ctx.fillStyle = C.blade;
        ctx.fillRect(cx + 5, cy - 24, 2, 16);
        ctx.fillStyle = C.bladeGleam;
        ctx.fillRect(cx + 6, cy - 24, 1, 16);
        ctx.fillStyle = C.gold;
        ctx.fillRect(cx + 4, cy - 13, 5, 2);
      } else if (swordState === 'iai') {
        // Low crouching Iai stance (grip on hilt ready to burst)
        ctx.fillStyle = C.haori;
        ctx.fillRect(cx - 3, cy - 7, 5, 4);
        ctx.fillStyle = C.skin;
        ctx.fillRect(cx - 5, cy - 2, 3, 3);
        // Spark on hilt
        ctx.fillStyle = C.gold;
        ctx.fillRect(cx - 8, cy - 3, 3, 3);
      }
    };

    // 1. Idle (4 frames)
    const { canvas: cIdle, ctx: ctxIdle } = this.createCanvas(fw * 4, fh);
    for (let f = 0; f < 4; f++) {
      const bob = (f === 1 || f === 2) ? 1 : 0;
      const cape = (f === 1 || f === 3) ? 1 : 2;
      drawRoninBase(ctxIdle, f * fw, 0, {
        legState: 0,
        bob,
        capeWave: cape,
        eyesBlink: f === 3
      });
    }
    sprites.idle = cIdle;

    // 2. Run (6 frames)
    const { canvas: cRun, ctx: ctxRun } = this.createCanvas(fw * 6, fh);
    const legSeq = [1, 2, 3, 1, 2, 3];
    for (let f = 0; f < 6; f++) {
      const bob = (f % 2 === 0) ? -1 : 1;
      drawRoninBase(ctxRun, f * fw, 0, {
        legState: legSeq[f],
        bob,
        capeWave: (f % 3) * 2 + 1,
        hatTilt: (f % 2 === 0) ? 1 : -1
      });
    }
    sprites.run = cRun;

    // 3. Jump (4 frames: rise, apex, fall, land)
    const { canvas: cJump, ctx: ctxJump } = this.createCanvas(fw * 4, fh);
    for (let f = 0; f < 4; f++) {
      drawRoninBase(ctxJump, f * fw, 0, {
        legState: 'jump',
        bob: f === 0 ? -2 : (f === 1 ? -4 : (f === 2 ? 0 : 2)),
        capeWave: 3
      });
    }
    sprites.jump = cJump;

    // 4. Attack Combo 1 (3 frames)
    const { canvas: cAtk1, ctx: ctxAtk1 } = this.createCanvas(fw * 3, fh);
    drawRoninBase(ctxAtk1, 0, 0, { swordState: 'sheathed', bob: 0 });
    drawRoninBase(ctxAtk1, fw, 0, { swordState: 'slash1', bob: 1 });
    // Frame 3: Slash arc effect
    drawRoninBase(ctxAtk1, fw * 2, 0, { swordState: 'slash1', bob: 0 });
    // Render Slash Arc on frame 2 & 3
    ctxAtk1.fillStyle = C.slashCyan;
    ctxAtk1.beginPath();
    ctxAtk1.arc(fw * 2 + 28, 26, 16, -0.4 * Math.PI, 0.4 * Math.PI);
    ctxAtk1.lineWidth = 3;
    ctxAtk1.strokeStyle = C.slashWhite;
    ctxAtk1.stroke();
    sprites.attack1 = cAtk1;

    // 5. Attack Combo 2 (Uppercut Slash - 3 frames)
    const { canvas: cAtk2, ctx: ctxAtk2 } = this.createCanvas(fw * 3, fh);
    drawRoninBase(ctxAtk2, 0, 0, { swordState: 'slash1', bob: 1 });
    drawRoninBase(ctxAtk2, fw, 0, { swordState: 'slash2', bob: -1 });
    drawRoninBase(ctxAtk2, fw * 2, 0, { swordState: 'slash2', bob: 0 });
    // Upper crescent arc
    ctxAtk2.strokeStyle = C.slashCyan;
    ctxAtk2.lineWidth = 3;
    ctxAtk2.beginPath();
    ctxAtk2.arc(fw + 28, 22, 18, -0.8 * Math.PI, 0.1 * Math.PI);
    ctxAtk2.stroke();
    sprites.attack2 = cAtk2;

    // 6. Attack Combo 3 (Heavy Helm Splitter - 4 frames)
    const { canvas: cAtk3, ctx: ctxAtk3 } = this.createCanvas(fw * 4, fh);
    drawRoninBase(ctxAtk3, 0, 0, { swordState: 'slash2', bob: -2 });
    drawRoninBase(ctxAtk3, fw, 0, { swordState: 'slash3', bob: 2 });
    drawRoninBase(ctxAtk3, fw * 2, 0, { swordState: 'slash3', bob: 2 });
    drawRoninBase(ctxAtk3, fw * 3, 0, { swordState: 'sheathed', bob: 1 });
    // Heavy flame / impact slash
    ctxAtk3.strokeStyle = C.slashRed;
    ctxAtk3.lineWidth = 4;
    ctxAtk3.beginPath();
    ctxAtk3.arc(fw + 30, 26, 20, -0.2 * Math.PI, 0.6 * Math.PI);
    ctxAtk3.stroke();
    sprites.attack3 = cAtk3;

    // 7. Parry / Deflect Guard (3 frames)
    const { canvas: cParry, ctx: ctxParry } = this.createCanvas(fw * 3, fh);
    for (let f = 0; f < 3; f++) {
      drawRoninBase(ctxParry, f * fw, 0, { swordState: 'block', bob: f === 1 ? -1 : 0 });
    }
    // Spark burst on frame 2
    ctxParry.fillStyle = C.gold;
    ctxParry.fillRect(fw + 30, 16, 4, 4);
    ctxParry.fillRect(fw + 28, 14, 8, 2);
    ctxParry.fillRect(fw + 31, 12, 2, 8);
    sprites.parry = cParry;

    // 8. Iaijutsu Charged Strike (Stance + Dash)
    const { canvas: cIai, ctx: ctxIai } = this.createCanvas(fw * 4, fh);
    // Stance charge (f0, f1)
    drawRoninBase(ctxIai, 0, 0, { swordState: 'iai', bob: 2 });
    drawRoninBase(ctxIai, fw, 0, { swordState: 'iai', bob: 3 });
    // Flash cut dash (f2, f3)
    drawRoninBase(ctxIai, fw * 2, 0, { swordState: 'slash1', bob: 0 });
    drawRoninBase(ctxIai, fw * 3, 0, { swordState: 'sheathed', bob: 1 });
    sprites.iai = cIai;

    // 9. Roll / Dodge (4 frames)
    const { canvas: cRoll, ctx: ctxRoll } = this.createCanvas(fw * 4, fh);
    for (let f = 0; f < 4; f++) {
      const ox = f * fw + 24;
      const oy = 28;
      ctxRoll.save();
      ctxRoll.translate(ox, oy);
      ctxRoll.rotate((f * Math.PI) / 2);
      ctxRoll.fillStyle = C.haori;
      ctxRoll.beginPath();
      ctxRoll.arc(0, 0, 10, 0, Math.PI * 2);
      ctxRoll.fill();
      ctxRoll.fillStyle = C.hatDark;
      ctxRoll.fillRect(-6, -6, 12, 4);
      ctxRoll.restore();
    }
    sprites.roll = cRoll;

    // 10. Wall Slide (2 frames)
    const { canvas: cWall, ctx: ctxWall } = this.createCanvas(fw * 2, fh);
    for (let f = 0; f < 2; f++) {
      drawRoninBase(ctxWall, f * fw, 0, {
        swordState: 'block',
        bob: 0
      });
      // Wall scrape sparks
      ctxWall.fillStyle = C.gold;
      ctxWall.fillRect(f * fw + 10, 32 + f * 2, 3, 3);
    }
    sprites.wallSlide = cWall;

    return sprites;
  }

  // ========================================================================
  // 2. ENEMY SPRITES (Ashigaru Spearman, Shadow Shinobi, Armored Samurai)
  // ========================================================================
  generateEnemySprites() {
    const fw = 48;
    const fh = 48;
    const sprites = {};

    // ----------------------------------------------------------------------
    // A. ASHIGARU SPEARMAN (Yari Soldier)
    // ----------------------------------------------------------------------
    const { canvas: cAshi, ctx: ctxAshi } = this.createCanvas(fw * 8, fh);
    const drawAshigaru = (ctx, ox, oy, state = 'idle', frame = 0) => {
      const cx = ox + 24;
      const cy = oy + 28;

      // Legs
      ctx.fillStyle = '#222831';
      ctx.fillRect(cx - 5, cy + 2, 4, 11);
      ctx.fillRect(cx + 1, cy + 2, 4, 11);

      // Torso & Cuirass Armor
      ctx.fillStyle = '#393e46';
      ctx.fillRect(cx - 6, cy - 9, 12, 12);
      ctx.fillStyle = '#b33939'; // Red armor lacing
      ctx.fillRect(cx - 5, cy - 6, 10, 2);
      ctx.fillRect(cx - 5, cy - 2, 10, 2);

      // Head & Jingasa (Conical conical helmet)
      ctx.fillStyle = '#dfa579';
      ctx.fillRect(cx - 3, cy - 14, 6, 6);
      ctx.fillStyle = '#111';
      ctx.fillRect(cx + 1, cy - 12, 2, 2); // Eye
      // Helmet
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 13);
      ctx.lineTo(cx + 10, cy - 13);
      ctx.lineTo(cx, cy - 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d4af37'; // Gold crest
      ctx.fillRect(cx - 1, cy - 16, 2, 2);

      // Yari Spear
      ctx.fillStyle = '#6b4f2c'; // Wooden shaft
      if (state === 'idle') {
        const bob = frame % 2 === 0 ? 0 : 1;
        ctx.fillRect(cx + 6, cy - 26 + bob, 3, 38);
        ctx.fillStyle = '#e0f0f5'; // Steel spearhead
        ctx.fillRect(cx + 5, cy - 32 + bob, 5, 8);
      } else if (state === 'thrust') {
        // Forward spear thrust
        ctx.fillRect(cx - 2, cy - 4, 26, 3);
        ctx.fillStyle = '#e0f0f5';
        ctx.fillRect(cx + 24, cy - 6, 8, 7);
        // Thrust wind streak
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(cx + 32, cy - 5, 12, 5);
      } else if (state === 'guard') {
        // Spear braced guard
        ctx.fillRect(cx + 8, cy - 20, 4, 30);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx + 7, cy - 10, 6, 6); // Guard shield/buckler
      }
    };

    // Frames 0-1: Idle, 2-4: Walk, 5-6: Thrust attack, 7: Guard
    drawAshigaru(ctxAshi, 0, 0, 'idle', 0);
    drawAshigaru(ctxAshi, fw, 0, 'idle', 1);
    drawAshigaru(ctxAshi, fw * 2, 0, 'idle', 0);
    drawAshigaru(ctxAshi, fw * 3, 0, 'idle', 1);
    drawAshigaru(ctxAshi, fw * 4, 0, 'idle', 0);
    drawAshigaru(ctxAshi, fw * 5, 0, 'thrust', 0);
    drawAshigaru(ctxAshi, fw * 6, 0, 'thrust', 1);
    drawAshigaru(ctxAshi, fw * 7, 0, 'guard', 0);
    sprites.ashigaru = cAshi;

    // ----------------------------------------------------------------------
    // B. SHADOW SHINOBI (Agile Ninja)
    // ----------------------------------------------------------------------
    const { canvas: cShinobi, ctx: ctxShinobi } = this.createCanvas(fw * 8, fh);
    const drawShinobi = (ctx, ox, oy, state = 'idle', frame = 0) => {
      const cx = ox + 24;
      const cy = oy + 28;

      // Dark ninja garb
      ctx.fillStyle = '#14141e';
      ctx.fillRect(cx - 5, cy + 2, 4, 11);
      ctx.fillRect(cx + 1, cy + 2, 4, 11);
      ctx.fillRect(cx - 5, cy - 9, 10, 12);

      // Purple scarf trailing
      ctx.fillStyle = '#6c3483';
      ctx.fillRect(cx - 9, cy - 10, 5, 8);
      ctx.fillRect(cx - 12 - frame * 2, cy - 8, 4, 6);

      // Masked Head
      ctx.fillStyle = '#1b1b26';
      ctx.fillRect(cx - 4, cy - 15, 8, 7);
      // Glowing Red Ninja Eye
      ctx.fillStyle = '#ff2a2a';
      ctx.fillRect(cx + 1, cy - 13, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 2, cy - 13, 1, 1);

      // Dual Ninjato Blades
      ctx.fillStyle = '#c5d1d6';
      if (state === 'throw') {
        // Arm extended throwing shuriken
        ctx.fillRect(cx + 4, cy - 8, 8, 3);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx + 12, cy - 9, 4, 4);
      } else {
        ctx.fillRect(cx - 8, cy - 16, 2, 14); // Sheathed on back
      }
    };

    for (let f = 0; f < 6; f++) {
      drawShinobi(ctxShinobi, f * fw, 0, f >= 4 ? 'throw' : 'idle', f);
    }
    // Smoke vanish effect on frame 6 & 7
    ctxShinobi.fillStyle = 'rgba(100, 70, 130, 0.8)';
    ctxShinobi.beginPath();
    ctxShinobi.arc(fw * 6 + 24, 28, 14, 0, Math.PI * 2);
    ctxShinobi.fill();
    ctxShinobi.fillStyle = 'rgba(150, 110, 190, 0.9)';
    ctxShinobi.beginPath();
    ctxShinobi.arc(fw * 7 + 24, 28, 18, 0, Math.PI * 2);
    ctxShinobi.fill();
    sprites.shinobi = cShinobi;

    // ----------------------------------------------------------------------
    // C. ARMORED SAMURAI (Heavy Guard)
    // ----------------------------------------------------------------------
    const { canvas: cArmored, ctx: ctxArmored } = this.createCanvas(fw * 6, fh);
    const drawArmored = (ctx, ox, oy, state = 'idle', frame = 0) => {
      const cx = ox + 24;
      const cy = oy + 28;

      // Heavy Sode Shoulder Plates & Kabuto Helmet
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(cx - 8, cy + 2, 6, 11);
      ctx.fillRect(cx + 2, cy + 2, 6, 11);
      ctx.fillStyle = '#b8860b'; // Gold trim
      ctx.fillRect(cx - 8, cy + 10, 6, 2);
      ctx.fillRect(cx + 2, cy + 10, 6, 2);

      // Heavy Chestplate
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(cx - 8, cy - 11, 16, 14);
      ctx.fillStyle = '#8b0000'; // Dark crimson accents
      ctx.fillRect(cx - 6, cy - 8, 12, 3);
      ctx.fillRect(cx - 6, cy - 3, 12, 3);

      // Kabuto Helmet with Giant Horns (Kuwagata)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(cx - 6, cy - 18, 12, 8);
      // Menpo (Grimacing Demon Mask)
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(cx - 4, cy - 13, 8, 4);
      ctx.fillStyle = '#ffff00'; // Glowing eyes
      ctx.fillRect(cx - 2, cy - 14, 2, 2);
      ctx.fillRect(cx + 2, cy - 14, 2, 2);

      // Gold Horns
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(cx - 8, cy - 23, 3, 7);
      ctx.fillRect(cx + 5, cy - 23, 3, 7);
      ctx.fillRect(cx - 10, cy - 25, 4, 3);
      ctx.fillRect(cx + 6, cy - 25, 4, 3);

      // Massive Nodachi Greatsword
      ctx.fillStyle = '#e8eff2';
      if (state === 'swing') {
        ctx.fillRect(cx - 2, cy - 26, 6, 28);
        ctx.fillStyle = '#ff3333'; // Telegraph red glint
        ctx.fillRect(cx - 1, cy - 28, 4, 4);
      } else {
        ctx.fillRect(cx + 6, cy - 18, 4, 24);
      }
    };

    for (let f = 0; f < 6; f++) {
      drawArmored(ctxArmored, f * fw, 0, f >= 3 ? 'swing' : 'idle', f);
    }
    sprites.armored = cArmored;

    return sprites;
  }

  // ========================================================================
  // 3. BOSS: CORRUPTED WARLORD (Kage-no-Shin)
  // Size: 64x64 per frame
  // ========================================================================
  generateBossSprites() {
    const bw = 64;
    const bh = 64;
    const { canvas, ctx } = this.createCanvas(bw * 8, bh);

    const drawBoss = (ox, oy, state = 'idle', frame = 0) => {
      const cx = ox + 32;
      const cy = oy + 38;

      // Dark Purple Demonic Flame Aura
      ctx.fillStyle = 'rgba(138, 43, 226, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 24 + Math.sin(frame) * 3, 0, Math.PI * 2);
      ctx.fill();

      // Giant Samurai Armor
      ctx.fillStyle = '#120d1c';
      ctx.fillRect(cx - 10, cy + 4, 8, 18);
      ctx.fillRect(cx + 2, cy + 4, 8, 18);

      // Torso
      ctx.fillStyle = '#221538';
      ctx.fillRect(cx - 12, cy - 15, 24, 20);
      ctx.fillStyle = '#8a2be2'; // Corrupted runes
      ctx.fillRect(cx - 8, cy - 10, 16, 3);
      ctx.fillRect(cx - 8, cy - 4, 16, 3);

      // Giant Oni Mask & Horned Helmet
      ctx.fillStyle = '#341f54';
      ctx.fillRect(cx - 8, cy - 26, 16, 12);
      // Oni Face
      ctx.fillStyle = '#5c1d1d';
      ctx.fillRect(cx - 6, cy - 20, 12, 6);
      ctx.fillStyle = '#ff1100'; // Burning red eyes
      ctx.fillRect(cx - 4, cy - 21, 3, 3);
      ctx.fillRect(cx + 1, cy - 21, 3, 3);
      // Giant Horns
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(cx - 14, cy - 32, 4, 10);
      ctx.fillRect(cx + 10, cy - 32, 4, 10);
      ctx.fillRect(cx - 18, cy - 36, 6, 5);
      ctx.fillRect(cx + 12, cy - 36, 6, 5);

      // Cursed Odachi (Giant Dark Blade)
      ctx.fillStyle = '#d4b8ff';
      if (state === 'slam') {
        // Slammed into ground with purple shockwave
        ctx.fillRect(cx + 12, cy - 10, 6, 34);
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(cx - 20, cy + 18, 40, 4);
      } else if (state === 'charge') {
        // Raised overhead
        ctx.fillRect(cx - 4, cy - 44, 8, 30);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(cx - 2, cy - 46, 4, 4);
      } else {
        // Menacing idle rest
        ctx.fillRect(cx + 10, cy - 28, 5, 36);
      }
    };

    drawBoss(0, 0, 'idle', 0);
    drawBoss(bw, 0, 'idle', 1);
    drawBoss(bw * 2, 0, 'charge', 2);
    drawBoss(bw * 3, 0, 'charge', 3);
    drawBoss(bw * 4, 0, 'slam', 4);
    drawBoss(bw * 5, 0, 'slam', 5);
    drawBoss(bw * 6, 0, 'idle', 6);
    drawBoss(bw * 7, 0, 'idle', 7);

    return { bossSheet: canvas };
  }

  // ========================================================================
  // 4. ENVIRONMENT SCENERY & TILES
  // Torii Gate, Weathered Pagoda, Pine Trees, Bamboo, Lanterns, Shrines
  // ========================================================================
  generateEnvironmentSprites() {
    const env = {};

    // ----------------------------------------------------------------------
    // A. GRAND CRIMSON TORII GATE (128x140)
    // ----------------------------------------------------------------------
    const { canvas: cTorii, ctx: ctxTorii } = this.createCanvas(128, 140);
    // Main Pillars
    const C_TORII_RED = '#b82626';
    const C_TORII_DARK = '#731414';
    const C_TORII_LIGHT = '#e63939';
    const C_TORII_BLACK = '#1a1118';
    const C_ROPE_GOLD = '#d9b354';

    // Base stone foundations (Kamebara)
    ctxTorii.fillStyle = '#3a3842';
    ctxTorii.fillRect(20, 126, 16, 14);
    ctxTorii.fillRect(92, 126, 16, 14);
    ctxTorii.fillStyle = '#565361';
    ctxTorii.fillRect(22, 126, 12, 3);
    ctxTorii.fillRect(94, 126, 12, 3);

    // Vertical Pillars (Hashira) - slight inward tilt
    for (let y = 14; y < 126; y++) {
      ctxTorii.fillStyle = C_TORII_RED;
      ctxTorii.fillRect(23, y, 10, 1);
      ctxTorii.fillRect(95, y, 10, 1);
      // Highlights & Shadows
      ctxTorii.fillStyle = C_TORII_LIGHT;
      ctxTorii.fillRect(24, y, 2, 1);
      ctxTorii.fillRect(96, y, 2, 1);
      ctxTorii.fillStyle = C_TORII_DARK;
      ctxTorii.fillRect(31, y, 2, 1);
      ctxTorii.fillRect(103, y, 2, 1);
    }

    // Lower Crossbeam (Nuki)
    ctxTorii.fillStyle = C_TORII_RED;
    ctxTorii.fillRect(14, 38, 100, 10);
    ctxTorii.fillStyle = C_TORII_LIGHT;
    ctxTorii.fillRect(14, 38, 100, 2);
    ctxTorii.fillStyle = C_TORII_DARK;
    ctxTorii.fillRect(14, 46, 100, 2);

    // Central Tablet (Gakuzuka)
    ctxTorii.fillStyle = C_TORII_BLACK;
    ctxTorii.fillRect(58, 14, 12, 25);
    ctxTorii.fillStyle = '#d4af37';
    ctxTorii.fillRect(60, 18, 8, 16); // Gold inscription area

    // Upper Curved Lintels (Kasagi & Shimaki)
    ctxTorii.fillStyle = C_TORII_BLACK;
    ctxTorii.beginPath();
    ctxTorii.moveTo(4, 14);
    ctxTorii.quadraticCurveTo(64, 8, 124, 14);
    ctxTorii.lineTo(126, 2);
    ctxTorii.quadraticCurveTo(64, -4, 2, 2);
    ctxTorii.closePath();
    ctxTorii.fill();

    ctxTorii.fillStyle = C_TORII_RED;
    ctxTorii.beginPath();
    ctxTorii.moveTo(8, 24);
    ctxTorii.quadraticCurveTo(64, 18, 120, 24);
    ctxTorii.lineTo(122, 14);
    ctxTorii.quadraticCurveTo(64, 8, 6, 14);
    ctxTorii.closePath();
    ctxTorii.fill();

    // Sacred Shimenawa Rope & Shide Paper Streamers
    ctxTorii.fillStyle = C_ROPE_GOLD;
    ctxTorii.fillRect(18, 48, 92, 4);
    // White zigzag Shide papers
    ctxTorii.fillStyle = '#f0f0f8';
    [32, 50, 64, 78, 96].forEach(px => {
      ctxTorii.fillRect(px, 52, 4, 8);
      ctxTorii.fillRect(px + 2, 56, 4, 6);
    });
    env.torii = cTorii;

    // ----------------------------------------------------------------------
    // B. WEATHERED JAPANESE PAGODA (160x240)
    // ----------------------------------------------------------------------
    const { canvas: cPagoda, ctx: ctxPagoda } = this.createCanvas(160, 240);
    const C_ROOF_DARK = '#1f2229';
    const C_ROOF_MID = '#2e3440';
    const C_WOOD_DARK = '#3d2618';
    const C_WOOD_RED = '#6e231c';
    const C_GOLD_FINIAL = '#e5a93b';

    // Spire / Finial (Sorin) on top
    ctxPagoda.fillStyle = C_GOLD_FINIAL;
    ctxPagoda.fillRect(78, 4, 4, 30);
    for (let r = 0; r < 5; r++) {
      ctxPagoda.fillRect(74, 12 + r * 4, 12, 2);
    }
    // Sacred ball top
    ctxPagoda.beginPath();
    ctxPagoda.arc(80, 5, 4, 0, Math.PI * 2);
    ctxPagoda.fill();

    // 3 Tiers of Pagoda Roofs
    const drawTier = (baseY, roofWidth, wallWidth, height) => {
      const cx = 80;
      // Walls & Lattice
      ctxPagoda.fillStyle = C_WOOD_RED;
      ctxPagoda.fillRect(cx - wallWidth / 2, baseY - height, wallWidth, height);
      // Lattice Windows
      ctxPagoda.fillStyle = '#0f0e14';
      ctxPagoda.fillRect(cx - wallWidth / 2 + 4, baseY - height + 4, wallWidth - 8, height - 6);
      // Gold window glow
      ctxPagoda.fillStyle = 'rgba(255, 170, 51, 0.45)';
      ctxPagoda.fillRect(cx - wallWidth / 2 + 6, baseY - height + 6, wallWidth - 12, height - 10);
      // Pillar accents
      ctxPagoda.fillStyle = C_WOOD_DARK;
      ctxPagoda.fillRect(cx - wallWidth / 2, baseY - height, 3, height);
      ctxPagoda.fillRect(cx + wallWidth / 2 - 3, baseY - height, 3, height);

      // Wide Eaves / Curved Roof (Kawara Tiles)
      ctxPagoda.fillStyle = C_ROOF_DARK;
      ctxPagoda.beginPath();
      ctxPagoda.moveTo(cx - roofWidth / 2 - 10, baseY - height - 4);
      ctxPagoda.quadraticCurveTo(cx, baseY - height - 14, cx + roofWidth / 2 + 10, baseY - height - 4);
      ctxPagoda.lineTo(cx + roofWidth / 2 + 4, baseY - height - 12);
      ctxPagoda.quadraticCurveTo(cx, baseY - height - 20, cx - roofWidth / 2 - 4, baseY - height - 12);
      ctxPagoda.closePath();
      ctxPagoda.fill();

      // Roof edge highlight
      ctxPagoda.fillStyle = C_ROOF_MID;
      ctxPagoda.fillRect(cx - roofWidth / 2, baseY - height - 6, roofWidth, 2);
    };

    drawTier(75, 70, 36, 36);   // Top Tier
    drawTier(140, 96, 50, 44);  // Mid Tier
    drawTier(215, 126, 68, 54); // Bottom Tier

    // Stone Foundation (Kidan)
    ctxPagoda.fillStyle = '#26242b';
    ctxPagoda.fillRect(36, 215, 88, 25);
    ctxPagoda.fillStyle = '#3a3742';
    ctxPagoda.fillRect(34, 215, 92, 4);
    env.pagoda = cPagoda;

    // ----------------------------------------------------------------------
    // C. ANCIENT GNARLED PINE TREE (120x150)
    // ----------------------------------------------------------------------
    const { canvas: cPine, ctx: ctxPine } = this.createCanvas(120, 150);
    const C_BARK_DARK = '#261912';
    const C_BARK_MID = '#422c20';
    const C_PINE_DEEP = '#0f291e';
    const C_PINE_MID = '#1b4d38';
    const C_PINE_LIGHT = '#2d7a5a';

    // Twisted Trunk
    ctxPine.fillStyle = C_BARK_MID;
    ctxPine.beginPath();
    ctxPine.moveTo(50, 150);
    ctxPine.quadraticCurveTo(65, 110, 45, 80);
    ctxPine.quadraticCurveTo(35, 55, 55, 30);
    ctxPine.lineTo(65, 30);
    ctxPine.quadraticCurveTo(48, 60, 75, 85);
    ctxPine.quadraticCurveTo(80, 115, 70, 150);
    ctxPine.closePath();
    ctxPine.fill();

    // Trunk Bark texture
    ctxPine.fillStyle = C_BARK_DARK;
    ctxPine.fillRect(52, 130, 4, 15);
    ctxPine.fillRect(60, 100, 5, 20);
    ctxPine.fillRect(48, 70, 4, 15);

    // Branches
    const drawBranch = (bx, by, tx, ty) => {
      ctxPine.strokeStyle = C_BARK_MID;
      ctxPine.lineWidth = 4;
      ctxPine.beginPath();
      ctxPine.moveTo(bx, by);
      ctxPine.quadraticCurveTo((bx + tx) / 2, (by + ty) / 2 + 6, tx, ty);
      ctxPine.stroke();
    };
    drawBranch(48, 80, 20, 65);
    drawBranch(65, 75, 100, 60);
    drawBranch(50, 50, 25, 35);
    drawBranch(58, 45, 95, 30);

    // Needle Clusters (Horizontal cloud-like cushions)
    const drawNeedleCloud = (cx, cy, rx, ry) => {
      ctxPine.fillStyle = C_PINE_DEEP;
      ctxPine.beginPath();
      ctxPine.ellipse(cx, cy + 2, rx, ry, 0, 0, Math.PI * 2);
      ctxPine.fill();

      ctxPine.fillStyle = C_PINE_MID;
      ctxPine.beginPath();
      ctxPine.ellipse(cx, cy, rx * 0.9, ry * 0.85, 0, 0, Math.PI * 2);
      ctxPine.fill();

      ctxPine.fillStyle = C_PINE_LIGHT;
      ctxPine.beginPath();
      ctxPine.ellipse(cx - rx * 0.2, cy - ry * 0.3, rx * 0.6, ry * 0.5, 0, 0, Math.PI * 2);
      ctxPine.fill();
    };

    drawNeedleCloud(55, 25, 26, 12);
    drawNeedleCloud(20, 35, 22, 10);
    drawNeedleCloud(95, 30, 24, 11);
    drawNeedleCloud(18, 65, 20, 9);
    drawNeedleCloud(100, 60, 25, 11);
    drawNeedleCloud(60, 55, 22, 10);
    env.pineTree = cPine;

    // ----------------------------------------------------------------------
    // D. BLACK BAMBOO GROVE (80x160)
    // ----------------------------------------------------------------------
    const { canvas: cBamboo, ctx: ctxBamboo } = this.createCanvas(80, 160);
    const C_BAMBOO_DARK = '#121815';
    const C_BAMBOO_MID = '#1e2923';
    const C_BAMBOO_LIGHT = '#324a3e';
    const C_LEAF_DARK = '#14291f';
    const C_LEAF_LIGHT = '#29543f';

    const drawStalk = (bx, width) => {
      for (let y = 0; y < 160; y += 22) {
        ctxBamboo.fillStyle = C_BAMBOO_MID;
        ctxBamboo.fillRect(bx, y, width, 20);
        ctxBamboo.fillStyle = C_BAMBOO_LIGHT;
        ctxBamboo.fillRect(bx, y, 1, 20); // Specular highlight
        ctxBamboo.fillStyle = C_BAMBOO_DARK;
        ctxBamboo.fillRect(bx + width - 1, y, 1, 20);
        // Node / Joint ring
        ctxBamboo.fillStyle = '#0a0d0c';
        ctxBamboo.fillRect(bx - 1, y + 20, width + 2, 2);
      }
    };

    drawStalk(15, 5);
    drawStalk(35, 6);
    drawStalk(58, 4);
    drawStalk(70, 5);

    // Bamboo Leaves (Sharp angled sprays)
    const drawLeafSpray = (lx, ly, dir = 1) => {
      ctxBamboo.fillStyle = C_LEAF_LIGHT;
      ctxBamboo.beginPath();
      ctxBamboo.moveTo(lx, ly);
      ctxBamboo.lineTo(lx + 14 * dir, ly - 6);
      ctxBamboo.lineTo(lx + 20 * dir, ly + 2);
      ctxBamboo.lineTo(lx + 8 * dir, ly + 4);
      ctxBamboo.closePath();
      ctxBamboo.fill();
    };

    drawLeafSpray(18, 40, 1);
    drawLeafSpray(16, 42, -1);
    drawLeafSpray(38, 70, 1);
    drawLeafSpray(36, 68, -1);
    drawLeafSpray(60, 30, 1);
    drawLeafSpray(58, 100, -1);
    drawLeafSpray(72, 85, 1);
    env.bamboo = cBamboo;

    // ----------------------------------------------------------------------
    // E. HANGING PAPER LANTERNS (Chochin) - Animated (32x40)
    // ----------------------------------------------------------------------
    const { canvas: cLantern, ctx: ctxLantern } = this.createCanvas(32 * 4, 40);
    for (let f = 0; f < 4; f++) {
      const ox = f * 32 + 16;
      const cy = 20;
      // Hanging cord
      ctxLantern.fillStyle = '#111';
      ctxLantern.fillRect(ox - 1, 0, 2, 10);

      // Top and Bottom Black Caps
      ctxLantern.fillStyle = '#1f1b24';
      ctxLantern.fillRect(ox - 7, 10, 14, 3);
      ctxLantern.fillRect(ox - 7, 27, 14, 3);

      // Glowing Lantern Body
      const glowR = 8 + (f % 2 === 0 ? 0.5 : -0.5);
      const grad = ctxLantern.createRadialGradient(ox, cy, 2, ox, cy, glowR);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#ffcc44');
      grad.addColorStop(0.7, '#ff6600');
      grad.addColorStop(1, '#992200');

      ctxLantern.fillStyle = grad;
      ctxLantern.beginPath();
      ctxLantern.ellipse(ox, cy, 8, 9, 0, 0, Math.PI * 2);
      ctxLantern.fill();

      // Ribbing lines
      ctxLantern.strokeStyle = 'rgba(60, 20, 0, 0.4)';
      ctxLantern.lineWidth = 1;
      ctxLantern.beginPath();
      ctxLantern.arc(ox, cy, 8, -Math.PI / 2, Math.PI / 2);
      ctxLantern.stroke();

      // Bottom Tassel
      ctxLantern.fillStyle = '#cc2222';
      ctxLantern.fillRect(ox - 2, 30, 4, 8);
    }
    env.lantern = cLantern;

    // ----------------------------------------------------------------------
    // F. JIZO STONE STATUE / CHECKPOINT (32x40)
    // ----------------------------------------------------------------------
    const { canvas: cJizo, ctx: ctxJizo } = this.createCanvas(32 * 2, 40);
    for (let f = 0; f < 2; f++) {
      const ox = f * 32 + 16;
      // Stone Body
      ctxJizo.fillStyle = '#4a4852';
      ctxJizo.fillRect(ox - 7, 16, 14, 18);
      // Stone Head
      ctxJizo.beginPath();
      ctxJizo.arc(ox, 12, 7, 0, Math.PI * 2);
      ctxJizo.fill();
      // Peaceful closed eyes
      ctxJizo.fillStyle = '#222';
      ctxJizo.fillRect(ox - 4, 11, 2, 1);
      ctxJizo.fillRect(ox + 2, 11, 2, 1);
      // Red Bib (Yodarekake)
      ctxJizo.fillStyle = '#cc2222';
      ctxJizo.beginPath();
      ctxJizo.arc(ox, 17, 6, 0, Math.PI);
      ctxJizo.fill();
      // Stone Pedestal
      ctxJizo.fillStyle = '#323038';
      ctxJizo.fillRect(ox - 10, 34, 20, 6);

      // Incense Smoke (Active on frame 1)
      if (f === 1) {
        ctxJizo.fillStyle = 'rgba(255, 200, 100, 0.7)';
        ctxJizo.fillRect(ox - 6, 32, 2, 2); // Burning ember
        ctxJizo.fillStyle = 'rgba(200, 200, 220, 0.4)';
        ctxJizo.fillRect(ox - 6, 26, 2, 4);
        ctxJizo.fillRect(ox - 5, 20, 3, 4);
      }
    }
    env.jizo = cJizo;

    // ----------------------------------------------------------------------
    // G. MOSSY STONE PLATFORMS & BRICK TILES (32x32)
    // ----------------------------------------------------------------------
    const { canvas: cTiles, ctx: ctxTiles } = this.createCanvas(32 * 4, 32);
    // Tile 0: Top Stone with Moss
    ctxTiles.fillStyle = '#2b2933';
    ctxTiles.fillRect(0, 0, 32, 32);
    // Moss tufts
    ctxTiles.fillStyle = '#2f6645';
    ctxTiles.fillRect(0, 0, 32, 6);
    ctxTiles.fillStyle = '#448c5e';
    ctxTiles.fillRect(2, 0, 8, 3);
    ctxTiles.fillRect(14, 0, 12, 3);
    ctxTiles.fillRect(22, 0, 8, 2);
    // Stone cracks
    ctxTiles.fillStyle = '#1c1a24';
    ctxTiles.fillRect(8, 12, 14, 2);
    ctxTiles.fillRect(16, 14, 2, 8);

    // Tile 1: Deep Underground Stone
    ctxTiles.fillStyle = '#1f1e26';
    ctxTiles.fillRect(32, 0, 32, 32);
    ctxTiles.fillStyle = '#15141a';
    ctxTiles.fillRect(36, 8, 24, 2);
    ctxTiles.fillRect(44, 18, 16, 2);

    // Tile 2: Wooden Bridge Plank
    ctxTiles.fillStyle = '#4a3325';
    ctxTiles.fillRect(64, 0, 32, 12);
    ctxTiles.fillStyle = '#6e4c37';
    ctxTiles.fillRect(64, 1, 32, 3);
    ctxTiles.fillStyle = '#2e1f17';
    ctxTiles.fillRect(64, 11, 32, 2);
    // Rope Bindings
    ctxTiles.fillStyle = '#d4b465';
    ctxTiles.fillRect(68, 0, 3, 12);
    ctxTiles.fillRect(88, 0, 3, 12);

    // Tile 3: Pagoda Rooftop Walkway
    ctxTiles.fillStyle = '#2a2e38';
    ctxTiles.fillRect(96, 0, 32, 32);
    ctxTiles.fillStyle = '#1d2026';
    for (let tx = 96; tx < 128; tx += 8) {
      ctxTiles.fillRect(tx, 0, 2, 32);
    }
    env.tiles = cTiles;

    return env;
  }

  // ========================================================================
  // 5. WEAPONS, PROJECTILES & PICKUP ICONS
  // ========================================================================
  generateItemsAndProjectiles() {
    const items = {};

    // Kunai (16x16)
    const { canvas: cKunai, ctx: ctxK } = this.createCanvas(16, 16);
    ctxK.fillStyle = '#dbe9f0';
    ctxK.beginPath();
    ctxK.moveTo(14, 8);
    ctxK.lineTo(6, 4);
    ctxK.lineTo(4, 8);
    ctxK.lineTo(6, 12);
    ctxK.closePath();
    ctxK.fill();
    ctxK.fillStyle = '#3a2b1c';
    ctxK.fillRect(0, 7, 5, 2); // Handle
    ctxK.fillStyle = '#b82626';
    ctxK.fillRect(0, 6, 2, 4); // Red ring tassel
    items.kunai = cKunai;

    // Shuriken (16x16)
    const { canvas: cShuriken, ctx: ctxS } = this.createCanvas(16, 16);
    ctxS.fillStyle = '#c8d6e5';
    // 4 points
    ctxS.fillRect(6, 1, 4, 14);
    ctxS.fillRect(1, 6, 14, 4);
    ctxS.fillStyle = '#0f172a';
    ctxS.fillRect(7, 7, 2, 2); // Center hole
    items.shuriken = cShuriken;

    // Spirit Orb / Soul (Animated 16x16)
    const { canvas: cSoul, ctx: ctxSoul } = this.createCanvas(16 * 4, 16);
    for (let f = 0; f < 4; f++) {
      const ox = f * 16 + 8;
      const cy = 8;
      const grad = ctxSoul.createRadialGradient(ox, cy, 1, ox, cy, 6);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#a855f7');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctxSoul.fillStyle = grad;
      ctxSoul.beginPath();
      ctxSoul.arc(ox, cy, 6, 0, Math.PI * 2);
      ctxSoul.fill();
    }
    items.spiritOrb = cSoul;

    // Healing Gourd (16x16)
    const { canvas: cGourd, ctx: ctxG } = this.createCanvas(16, 16);
    ctxG.fillStyle = '#b8860b';
    // Top bulb
    ctxG.beginPath();
    ctxG.arc(8, 5, 3, 0, Math.PI * 2);
    ctxG.fill();
    // Bottom bulb
    ctxG.beginPath();
    ctxG.arc(8, 10, 5, 0, Math.PI * 2);
    ctxG.fill();
    // Red waist cord
    ctxG.fillStyle = '#cc2222';
    ctxG.fillRect(6, 6, 4, 2);
    // Green healing steam
    ctxG.fillStyle = '#22c55e';
    ctxG.fillRect(8, 0, 2, 2);
    items.gourd = cGourd;

    return items;
  }
}
