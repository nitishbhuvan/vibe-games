// ============================================================================
// animator.ts - 60FPS High-Definition Procedural Pixel Art Animation Engine
// Creates butter-smooth multi-joint articulated animations for Jin and Enemies:
// - Jin (Matching Image 1): Spiky ponytail physics, headband ribbon chain,
//   flowing red sash, 2-joint hakama leg strides, dynamic katana combo arcs.
// - Enemies: Multi-phase windup telegraphs, lunging spear thrusts, dual-blade slashes.
// ============================================================================

export interface AnimationParams {
  time: number;
  vx: number;
  vy: number;
  dir: number;
  isGrounded: boolean;
  animState: string; // 'idle', 'run', 'jump', 'fall', 'slash', 'parry', 'roll', 'tether'
  attackStage?: number;
  attackProgress?: number; // 0.0 to 1.0
  isParrying?: boolean;
  isArmored?: boolean;
}

export class HDCharacterAnimator {
  // Palettes strictly matching Image 1
  private static JIN_PAL = {
    skin: '#f2cbb1',
    skinShade: '#c99679',
    skinDark: '#996349',
    hair: '#14121a',
    hairDark: '#08060a',
    hairHighlight: '#3c374f',
    headband: '#ffffff',
    headbandShade: '#d1d5db',
    headbandDark: '#9ca3af',
    kimono: '#ffffff',
    kimonoShade: '#cbd5e1',
    kimonoDark: '#94a3b8',
    collarTrim: '#1e293b',
    wristGuard: '#1e293b',
    wristGuardLight: '#334155',
    sashRed: '#dc2626',
    sashRedLight: '#ef4444',
    sashRedDark: '#991b1b',
    hakama: '#1a233a',
    hakamaLight: '#2c3b5e',
    hakamaDark: '#0f172a',
    tabi: '#f8fafc',
    tabiShade: '#cbd5e1',
    sandal: '#3d2817',
    sandalStraw: '#8c6239',
    katanaHiltRed: '#b91c1c',
    katanaHiltWrap: '#18181b',
    katanaGuard: '#eab308',
    katanaScabbard: '#09090b',
    katanaBlade: '#f8fafc',
    katanaBladeEdge: '#e0f2fe',
    katanaBladeDark: '#64748b',
    eye: '#0f172a',
  };

  // ==========================================================================
  // 1. RENDER JIN (Protagonist matching Image 1 with 60FPS fluid physics)
  // ==========================================================================
  public static renderJin(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    params: AnimationParams
  ) {
    const { time, vx, dir, animState, attackStage = 1, attackProgress = 0, isParrying } = params;
    const C = this.JIN_PAL;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (dir === -1) ctx.scale(-1, 1);

    const speed = Math.abs(vx);
    const isMoving = speed > 20;

    // --- 1. Physics Calculations ---
    // Breathing & vertical bobbing
    let bodyY = -92;
    let bodyLean = 0;

    if (animState === 'idle') {
      const breath = Math.sin(time * 3.5);
      bodyY += breath * 2.5;
    } else if (animState === 'run') {
      const runCycle = time * 12;
      bodyY += Math.abs(Math.sin(runCycle)) * -6 + 2;
      bodyLean = Math.min(8, speed * 0.025);
    } else if (animState === 'jump') {
      bodyY -= 6;
      bodyLean = 3;
    } else if (animState === 'roll') {
      // Rotate roll
      ctx.rotate((time * 18) % (Math.PI * 2));
      bodyY = -45;
    }

    if (animState === 'slash') {
      bodyLean = 8 * (1 - attackProgress);
      bodyY += 4;
    }

    // --- 2. Headband Ribbon Trailing Chain (3-Joint Fluid Physics) ---
    const ribbonOriginX = -12 - bodyLean;
    const ribbonOriginY = bodyY + 18;
    const windSpeed = isMoving ? -vx * 0.04 : 0;
    const wave1 = Math.sin(time * 8) * 4 + windSpeed * 2.5;
    const wave2 = Math.sin(time * 8 - 0.8) * 7 + windSpeed * 4.5;
    const wave3 = Math.sin(time * 8 - 1.6) * 10 + windSpeed * 6.5;

    ctx.fillStyle = C.headband;
    ctx.beginPath();
    ctx.moveTo(ribbonOriginX, ribbonOriginY);
    ctx.quadraticCurveTo(ribbonOriginX - 16 + wave1, ribbonOriginY + 6, ribbonOriginX - 32 + wave2, ribbonOriginY + 14);
    ctx.lineTo(ribbonOriginX - 44 + wave3, ribbonOriginY + 22);
    ctx.lineTo(ribbonOriginX - 42 + wave3, ribbonOriginY + 28);
    ctx.quadraticCurveTo(ribbonOriginX - 28 + wave2, ribbonOriginY + 18, ribbonOriginX - 10, ribbonOriginY + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = C.headbandDark;
    ctx.fillRect(ribbonOriginX - 22 + wave1 * 0.6, ribbonOriginY + 10, 8, 4);

    // --- 3. Spiky High Ponytail (Multi-Tuft Inertia) ---
    const hairX = -10 - bodyLean * 0.4;
    const hairY = bodyY + 6;
    const hairSway = Math.sin(time * 7) * 3 - (vx * 0.02);

    ctx.fillStyle = C.hairDark;
    // Ponytail main bundle
    ctx.beginPath();
    ctx.moveTo(hairX, hairY);
    ctx.lineTo(hairX - 16 + hairSway, hairY - 14);
    ctx.lineTo(hairX - 8 + hairSway * 1.3, hairY - 26);
    ctx.lineTo(hairX + 4 + hairSway, hairY - 22);
    ctx.lineTo(hairX + 2, hairY);
    ctx.closePath();
    ctx.fill();

    // Spiky Hair Tufts (Image 1)
    ctx.fillStyle = C.hair;
    ctx.fillRect(hairX - 14 + hairSway, hairY - 20, 8, 12);
    ctx.fillRect(hairX - 6 + hairSway * 1.2, hairY - 26, 8, 10);
    ctx.fillRect(hairX + 2 + hairSway, hairY - 22, 6, 10);
    ctx.fillStyle = C.hairHighlight;
    ctx.fillRect(hairX - 4 + hairSway, hairY - 18, 6, 6);

    // Headband White Wrap Knot
    ctx.fillStyle = C.headband;
    ctx.fillRect(hairX - 4, hairY - 2, 10, 6);

    // --- 4. Hakama Pleated Pants & 2-Joint Legs ---
    const hipX = 0;
    const hipY = bodyY + 54;
    const legLength = 34;

    let leftLegAngle = 0;
    let rightLegAngle = 0;

    if (animState === 'run') {
      const runT = time * 12;
      leftLegAngle = Math.sin(runT) * 0.65;
      rightLegAngle = Math.sin(runT + Math.PI) * 0.65;
    } else if (animState === 'jump') {
      leftLegAngle = -0.4;
      rightLegAngle = 0.3;
    }

    // Wide Hakama Trousers (Dark Navy / Indigo)
    ctx.fillStyle = C.hakama;
    // Left Leg
    ctx.save();
    ctx.translate(hipX - 8, hipY);
    ctx.rotate(leftLegAngle);
    ctx.fillRect(-12, 0, 24, legLength);
    ctx.fillStyle = C.hakamaLight;
    ctx.fillRect(-6, 0, 3, legLength - 4);
    ctx.fillStyle = C.hakamaDark;
    ctx.fillRect(4, 0, 6, legLength);

    // White Tabi & Geta Sandals
    ctx.fillStyle = C.tabi;
    ctx.fillRect(-8, legLength - 4, 16, 8);
    ctx.fillStyle = C.sandal;
    ctx.fillRect(-10, legLength + 4, 20, 6);
    ctx.fillStyle = C.sandalStraw;
    ctx.fillRect(-4, legLength + 1, 6, 4);
    ctx.restore();

    // Right Leg
    ctx.save();
    ctx.translate(hipX + 8, hipY);
    ctx.rotate(rightLegAngle);
    ctx.fillStyle = C.hakama;
    ctx.fillRect(-10, 0, 24, legLength);
    ctx.fillStyle = C.hakamaLight;
    ctx.fillRect(-4, 0, 3, legLength - 4);
    ctx.fillStyle = C.hakamaDark;
    ctx.fillRect(6, 0, 6, legLength);

    // Tabi & Sandals
    ctx.fillStyle = C.tabi;
    ctx.fillRect(-6, legLength - 4, 16, 8);
    ctx.fillStyle = C.sandal;
    ctx.fillRect(-8, legLength + 4, 20, 6);
    ctx.fillStyle = C.sandalStraw;
    ctx.fillRect(-2, legLength + 1, 6, 4);
    ctx.restore();

    // --- 5. Torso & White Kimono / Gi Top (Image 1) ---
    ctx.save();
    ctx.translate(bodyLean, 0);

    ctx.fillStyle = C.kimono;
    ctx.fillRect(-18, bodyY + 22, 36, 34);
    ctx.fillStyle = C.kimonoShade;
    ctx.fillRect(-18, bodyY + 36, 8, 20);
    ctx.fillRect(10, bodyY + 36, 8, 20);

    // Dark V-Collar Trim (Image 1)
    ctx.fillStyle = C.collarTrim;
    ctx.beginPath();
    ctx.moveTo(-10, bodyY + 22);
    ctx.lineTo(0, bodyY + 38);
    ctx.lineTo(10, bodyY + 22);
    ctx.lineTo(6, bodyY + 22);
    ctx.lineTo(0, bodyY + 34);
    ctx.lineTo(-6, bodyY + 22);
    ctx.closePath();
    ctx.fill();

    // Exposed Chest
    ctx.fillStyle = C.skin;
    ctx.fillRect(-3, bodyY + 24, 6, 10);

    // --- 6. Crimson Red Obi Sash & Hanging Knot Ribbons (Image 1) ---
    ctx.fillStyle = C.sashRed;
    ctx.fillRect(-18, bodyY + 50, 36, 9);
    ctx.fillStyle = C.sashRedLight;
    ctx.fillRect(-18, bodyY + 50, 36, 3);
    ctx.fillStyle = C.sashRedDark;
    ctx.fillRect(-18, bodyY + 56, 36, 3);

    // Dangling Ribbon Ends (Fluid physics sway)
    const sashWave = Math.sin(time * 6) * 3 - (vx * 0.02);
    ctx.fillStyle = C.sashRed;
    ctx.fillRect(-6, bodyY + 59, 6, 18 + sashWave);
    ctx.fillRect(2, bodyY + 59, 6, 15 - sashWave);
    ctx.fillStyle = C.sashRedDark;
    ctx.fillRect(-4, bodyY + 53, 10, 7); // Center knot

    // --- 7. Head & Fierce Samurai Face (Image 1) ---
    const headX = -14;
    const headY = bodyY;

    // Face & Chin
    ctx.fillStyle = C.skin;
    ctx.fillRect(headX + 2, headY + 2, 24, 22);
    ctx.fillStyle = C.skinShade;
    ctx.fillRect(headX + 2, headY + 16, 24, 8);

    // Side bangs & hair contour
    ctx.fillStyle = C.hair;
    ctx.fillRect(headX, headY - 2, 8, 20);
    ctx.fillRect(headX + 20, headY - 2, 8, 18);
    ctx.fillRect(headX + 4, headY - 4, 20, 8);

    // White Headband (Hachimaki)
    ctx.fillStyle = C.headband;
    ctx.fillRect(headX, headY + 4, 28, 8);
    ctx.fillStyle = C.headbandShade;
    ctx.fillRect(headX, headY + 9, 28, 3);

    // Intense Anime Eyes & Eyebrows
    ctx.fillStyle = C.hairDark;
    ctx.fillRect(headX + 7, headY + 6, 6, 2);  // Left brow
    ctx.fillRect(headX + 16, headY + 6, 6, 2); // Right brow
    ctx.fillStyle = C.headband;
    ctx.fillRect(headX + 8, headY + 10, 5, 4);
    ctx.fillRect(headX + 17, headY + 10, 5, 4);
    ctx.fillStyle = C.eye;
    ctx.fillRect(headX + 10, headY + 10, 3, 4);
    ctx.fillRect(headX + 19, headY + 10, 3, 4);

    // Nose & Determined Mouth
    ctx.fillStyle = C.skinDark;
    ctx.fillRect(headX + 13, headY + 16, 3, 2);
    ctx.fillRect(headX + 11, headY + 19, 7, 2);

    // --- 8. Arms & Katana in Action ---
    if (animState === 'slash') {
      // Dynamic Katana Slashing Swing (60fps sweep arc)
      const sweepAngle = -Math.PI * 0.6 + attackProgress * Math.PI * 1.2;
      ctx.save();
      ctx.translate(8, bodyY + 36);
      ctx.rotate(sweepAngle);

      // Arm & Black Vambrace
      ctx.fillStyle = C.kimono;
      ctx.fillRect(-6, -6, 22, 12);
      ctx.fillStyle = C.wristGuard;
      ctx.fillRect(10, -6, 12, 12);
      ctx.fillStyle = C.skin;
      ctx.fillRect(18, -4, 8, 8);

      // Steel Katana Blade
      ctx.fillStyle = C.katanaGuard;
      ctx.fillRect(22, -10, 4, 20);
      ctx.fillStyle = C.katanaBlade;
      ctx.fillRect(26, -4, 52, 8);
      ctx.fillStyle = C.katanaBladeEdge;
      ctx.fillRect(26, -4, 52, 2);

      // Luminous Energy Blade Arc Trail
      const trailColors = ['#38bdf8', '#f59e0b', '#ef4444'];
      const trailColor = trailColors[Math.min(2, Math.max(0, attackStage - 1))];
      ctx.strokeStyle = trailColor;
      ctx.lineWidth = 8;
      ctx.shadowColor = trailColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(-8, 0, 72, -Math.PI * 0.4, 0);
      ctx.stroke();

      ctx.restore();
    } else if (animState === 'parry' || isParrying) {
      // Defensive Guard Vertical Blade Stance
      ctx.save();
      ctx.translate(12, bodyY + 32);

      ctx.fillStyle = C.kimono;
      ctx.fillRect(-4, -6, 18, 12);
      ctx.fillStyle = C.wristGuard;
      ctx.fillRect(8, -6, 10, 12);
      ctx.fillStyle = C.skin;
      ctx.fillRect(12, -4, 8, 8);

      // Vertical Katana
      ctx.fillStyle = C.katanaGuard;
      ctx.fillRect(10, -12, 16, 4);
      ctx.fillStyle = C.katanaBlade;
      ctx.fillRect(14, -58, 8, 48);
      ctx.fillStyle = C.katanaBladeEdge;
      ctx.fillRect(18, -58, 2, 48);

      // Deflection Shield Gleam
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.fillRect(12, -38, 12, 12);

      ctx.restore();
    } else {
      // Relaxed Stance: Left hand on katana, right arm natural
      // Sheathed Katana on Left Hip
      const scabbardX = -26;
      const scabbardY = bodyY + 50;
      ctx.save();
      ctx.translate(scabbardX, scabbardY);
      ctx.rotate(-0.35 + (vx * 0.001));

      // Scabbard
      ctx.fillStyle = C.katanaScabbard;
      ctx.fillRect(0, 0, 42, 6);
      // Tsuba (Gold Guard)
      ctx.fillStyle = C.katanaGuard;
      ctx.fillRect(36, -3, 4, 12);
      // Red-wrapped Tsuka (Hilt)
      ctx.fillStyle = C.katanaHiltRed;
      ctx.fillRect(40, 0, 20, 6);
      ctx.fillStyle = C.katanaHiltWrap;
      for (let tx = 43; tx < 58; tx += 4) {
        ctx.fillRect(tx, 0, 2, 6);
      }
      ctx.restore();

      // Right Arm (Kimono sleeve + Vambrace)
      const armSwing = Math.sin(time * 12) * (speed * 0.04);
      ctx.fillStyle = C.kimono;
      ctx.fillRect(12, bodyY + 28 + armSwing, 12, 18);
      ctx.fillStyle = C.wristGuard;
      ctx.fillRect(14, bodyY + 44 + armSwing, 8, 12);
      ctx.fillStyle = C.skin;
      ctx.fillRect(14, bodyY + 54 + armSwing, 8, 8);

      // Left Arm (Hand resting on katana hilt)
      ctx.fillStyle = C.kimono;
      ctx.fillRect(-18, bodyY + 28, 12, 18);
      ctx.fillStyle = C.wristGuard;
      ctx.fillRect(-16, bodyY + 42, 8, 10);
      ctx.fillStyle = C.skin;
      ctx.fillRect(-10, bodyY + 48, 8, 8);
    }

    ctx.restore(); // Restore bodyLean
    ctx.restore(); // Restore root translation
  }

  // ==========================================================================
  // 2. RENDER SHADOW SHINOBI ENEMY (Smooth Animation & Attack Telegraphs)
  // ==========================================================================
  public static renderShinobi(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dir: number,
    time: number,
    isAttacking: boolean,
    attackPhase: 'windup' | 'strike' | 'recovery'
  ) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (dir === -1) ctx.scale(-1, 1);

    const bodyY = -86 + Math.sin(time * 4) * 2;

    // Shozoku Ninja Suit (Midnight Indigo)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-16, bodyY + 20, 32, 36);
    ctx.fillRect(-14, bodyY + 54, 12, 32);
    ctx.fillRect(2, bodyY + 54, 12, 32);

    // Purple Ninja Obi Sash
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(-16, bodyY + 46, 32, 8);

    // Masked Head & Glowing Red Eye Slit
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-12, bodyY, 24, 22);

    // Red Eyes (Intense flash during windup telegraph)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = isAttacking && attackPhase === 'windup' ? 14 : 4;
    ctx.fillRect(2, bodyY + 8, 8, 4);

    // Dual Ninjato Blades in Action
    if (isAttacking && attackPhase === 'strike') {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(14, bodyY + 10, 48, 6);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(14, bodyY + 20, 48, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(12, bodyY + 14, 6, 36);
      ctx.fillRect(-18, bodyY + 14, 6, 36);
    }

    ctx.restore();
  }

  // ==========================================================================
  // 3. RENDER ASHIGARU SPEARMAN (Smooth Spear Thrust & Armor Break FX)
  // ==========================================================================
  public static renderSpearman(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dir: number,
    time: number,
    isArmored: boolean,
    isAttacking: boolean,
    attackPhase: 'windup' | 'strike' | 'recovery'
  ) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (dir === -1) ctx.scale(-1, 1);

    const bodyY = -88 + Math.sin(time * 3) * 1.5;

    // Body & Armor
    ctx.fillStyle = isArmored ? '#1e293b' : '#451a03';
    ctx.fillRect(-18, bodyY + 22, 36, 38);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-16, bodyY + 58, 14, 30);
    ctx.fillRect(2, bodyY + 58, 14, 30);

    // Conical Jingasa Hat
    ctx.fillStyle = isArmored ? '#334155' : '#78350f';
    ctx.beginPath();
    ctx.moveTo(-28, bodyY + 12);
    ctx.lineTo(28, bodyY + 12);
    ctx.lineTo(0, bodyY - 14);
    ctx.closePath();
    ctx.fill();

    // Long Yari Spear (Windup pull-back vs Thrust extension)
    let spearOffset = 0;
    if (isAttacking) {
      if (attackPhase === 'windup') {
        spearOffset = -24; // Pull back spear
        // Warning Gleam at spearhead
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.fillRect(10 + spearOffset, bodyY - 8, 10, 10);
      } else if (attackPhase === 'strike') {
        spearOffset = 65; // Extended lethal thrust
      }
    }

    // Wooden Spear Shaft & Steel Tip
    ctx.fillStyle = '#a16207';
    ctx.fillRect(6, bodyY + 24, 75 + spearOffset, 6);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(78 + spearOffset, bodyY + 20, 22, 14);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(72 + spearOffset, bodyY + 22, 6, 10); // Red tassel

    ctx.restore();
  }
}
