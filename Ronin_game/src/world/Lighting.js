// ==========================================================================
// Lighting.js - High-Contrast Dynamic 2D Pixel Lighting Engine
// Renders dark twilight ambient shadows and warm flickering paper lantern glows.
// ==========================================================================

export class Lighting {
  constructor(viewW = 640, viewH = 360) {
    this.viewW = viewW;
    this.viewH = viewH;

    // Create offscreen lightmap canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = viewW;
    this.canvas.height = viewH;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // Light sources list: { x, y, radius, color, flicker, intensity }
    this.lights = [];
    this.time = 0;
  }

  // Clear light sources for current frame
  clear() {
    this.lights = [];
  }

  // Register a point light source
  addLight(x, y, radius, color = '#ff9922', flicker = 0.15, intensity = 1.0) {
    this.lights.push({ x, y, radius, color, flicker, intensity });
  }

  // Render the atmospheric lightmask
  render(mainCtx, cameraX, cameraY) {
    this.time += 0.05;
    const ctx = this.ctx;

    // 1. Fill lightmap with moody twilight darkness
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(16, 10, 28, 0.72)'; // Deep purple twilight shadow
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    // 2. Cut out radial light holes (destination-out creates seamless transparency)
    ctx.globalCompositeOperation = 'destination-out';

    for (const light of this.lights) {
      const sx = Math.floor(light.x - cameraX);
      const sy = Math.floor(light.y - cameraY);

      // Skip lights outside viewport
      if (sx < -light.radius || sx > this.viewW + light.radius ||
          sy < -light.radius || sy > this.viewH + light.radius) {
        continue;
      }

      // Organic flicker variation
      const flickerAmt = (Math.sin(this.time * 6 + light.x) * 0.5 + Math.cos(this.time * 9 + light.y) * 0.5) * light.flicker;
      const curRadius = Math.max(10, light.radius * (1 + flickerAmt));

      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, curRadius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * light.intensity})`);
      grad.addColorStop(0.35, `rgba(255, 200, 100, ${0.75 * light.intensity})`);
      grad.addColorStop(0.7, `rgba(255, 120, 20, ${0.35 * light.intensity})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, curRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw colored warm light wash on top of holes (source-over with additive blend)
    ctx.globalCompositeOperation = 'source-over';
    for (const light of this.lights) {
      const sx = Math.floor(light.x - cameraX);
      const sy = Math.floor(light.y - cameraY);

      if (sx < -light.radius || sx > this.viewW + light.radius ||
          sy < -light.radius || sy > this.viewH + light.radius) {
        continue;
      }

      const curRadius = light.radius * 0.6;
      const grad = ctx.createRadialGradient(sx, sy, 1, sx, sy, curRadius);
      grad.addColorStop(0, 'rgba(255, 220, 140, 0.25)');
      grad.addColorStop(1, 'rgba(255, 120, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, curRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Composite final lightmap onto main game canvas
    mainCtx.save();
    mainCtx.globalCompositeOperation = 'source-over';
    mainCtx.drawImage(this.canvas, 0, 0);
    mainCtx.restore();
  }
}
