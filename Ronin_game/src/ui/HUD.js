// ==========================================================================
// HUD.js - Heads-Up Display & UI Overlay
// Ornate Japanese Katana Health Bar, Ki Gauge, Boss HP Bar, Combo Meter
// ==========================================================================

export class HUD {
  constructor() {
    this.displayHp = 100;
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  registerHit() {
    this.comboCount++;
    this.comboTimer = 180; // 3 seconds
  }

  update() {
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }
  }

  render(ctx, player, boss, viewW = 640, viewH = 360) {
    // Smooth lerp for damage bar
    this.displayHp += (player.hp - this.displayHp) * 0.1;

    // ----------------------------------------------------------------------
    // 1. PLAYER HEALTH & KI BARS (Top Left)
    // ----------------------------------------------------------------------
    const ox = 18;
    const oy = 16;

    // Background Frame
    ctx.fillStyle = 'rgba(14, 10, 22, 0.85)';
    ctx.fillRect(ox - 4, oy - 4, 168, 48);
    ctx.strokeStyle = '#523c1d';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ox - 4, oy - 4, 168, 48);

    // HP Bar Frame
    ctx.fillStyle = '#2b1518';
    ctx.fillRect(ox, oy, 130, 10);

    // Damage trail (yellow/orange)
    const trailPct = Math.max(0, Math.min(1, this.displayHp / player.maxHp));
    ctx.fillStyle = '#ffaa33';
    ctx.fillRect(ox, oy, Math.floor(130 * trailPct), 10);

    // Current HP (Crimson)
    const hpPct = Math.max(0, Math.min(1, player.hp / player.maxHp));
    ctx.fillStyle = '#e6263b';
    ctx.fillRect(ox, oy, Math.floor(130 * hpPct), 10);

    // HP Gold Borders
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, 130, 10);

    // "HP" Label
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('HP', ox + 135, oy + 8);

    // Ki / Stamina Bar (Cyan)
    const kiOy = oy + 15;
    ctx.fillStyle = '#0f242b';
    ctx.fillRect(ox, kiOy, 110, 6);

    const kiPct = Math.max(0, Math.min(1, player.ki / player.maxKi));
    ctx.fillStyle = '#00d2d3';
    ctx.fillRect(ox, kiOy, Math.floor(110 * kiPct), 6);
    ctx.strokeStyle = '#48dbfb';
    ctx.strokeRect(ox, kiOy, 110, 6);

    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('KI', ox + 115, kiOy + 6);

    // ----------------------------------------------------------------------
    // 2. ITEMS & SOULS COUNTERS
    // ----------------------------------------------------------------------
    const itemsOy = oy + 32;
    ctx.font = '8px "Press Start 2P", monospace';

    // Gourds
    ctx.fillStyle = '#2ecc71';
    ctx.fillText(`🍵x${player.gourds}`, ox, itemsOy);

    // Kunai
    ctx.fillStyle = '#dfe6e9';
    ctx.fillText(`🗡️x${player.kunais}`, ox + 52, itemsOy);

    // Spirit Orbs
    ctx.fillStyle = '#a855f7';
    ctx.fillText(`🟣x${player.spiritOrbs}`, ox + 104, itemsOy);

    // ----------------------------------------------------------------------
    // 3. COMBO COUNTER (Right Side)
    // ----------------------------------------------------------------------
    if (this.comboCount > 1) {
      ctx.save();
      const comboX = viewW - 140;
      const comboY = 60;

      ctx.font = 'bold 16px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffaa33';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(`${this.comboCount} HITS`, comboX, comboY);
      ctx.fillText(`${this.comboCount} HITS`, comboX, comboY);

      let title = 'STRIKE!';
      if (this.comboCount >= 8) title = 'BLADE DANCE!';
      if (this.comboCount >= 15) title = 'TWILIGHT RONIN!';

      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, comboX, comboY + 14);
      ctx.restore();
    }

    // ----------------------------------------------------------------------
    // 4. BOSS HEALTH BAR (Bottom Center)
    // ----------------------------------------------------------------------
    if (boss && !boss.isDefeated && Math.abs(player.x - boss.x) < 400) {
      const bw = 320;
      const bh = 14;
      const bx = Math.floor((viewW - bw) / 2);
      const by = viewH - 34;

      // Boss Name & Title
      ctx.font = 'bold 9px "Cinzel", serif';
      ctx.fillStyle = '#ffaa33';
      ctx.textAlign = 'center';
      ctx.fillText(boss.name, viewW / 2, by - 6);

      // Boss HP Bar BG
      ctx.fillStyle = 'rgba(10, 5, 18, 0.9)';
      ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);

      ctx.fillStyle = '#3a1318';
      ctx.fillRect(bx, by, bw, bh);

      const bossHpPct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
      ctx.fillStyle = boss.phase === 2 ? '#9b59b6' : '#e74c3c';
      ctx.fillRect(bx, by, Math.floor(bw * bossHpPct), bh);

      // Frame
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);

      // Stagger Pips
      ctx.textAlign = 'left';
      for (let p = 0; p < boss.maxStagger; p++) {
        const pipX = bx + bw - (boss.maxStagger - p) * 12;
        ctx.fillStyle = p < boss.staggerMeter ? '#ffd700' : '#444';
        ctx.fillRect(pipX, by + 3, 8, 8);
      }
    }
  }
}
