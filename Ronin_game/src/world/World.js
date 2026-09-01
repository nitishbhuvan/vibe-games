// ==========================================================================
// World.js - Level Geometry, Scenery Placements, and Light Points
// The Twilight Japanese Landscape: Bamboo Grove -> Torii Bridge -> Pagoda Peak
// ==========================================================================

export class World {
  constructor(pixelGen) {
    this.pixelGen = pixelGen;
    this.width = 2800;
    this.height = 420;

    this.colliders = [];
    this.scenery = [];
    this.lights = [];
    this.checkpoints = [];
    this.lanternBreakables = [];

    this.buildLevel();
  }

  buildLevel() {
    // ----------------------------------------------------------------------
    // 1. TERRAIN COLLIDERS (Solid Stone Platforms & Bridges)
    // ----------------------------------------------------------------------
    // Ground Floor: Area 1 (Bamboo Grove: x: 0 - 650, y: 300)
    this.addPlatform(0, 300, 650, 80, 'stone');

    // Chasm 1 & Wooden Bridges (x: 650 - 1150)
    this.addPlatform(650, 340, 40, 60, 'stone'); // Lower rock step
    this.addPlatform(720, 270, 110, 12, 'bridge', true); // Floating wooden bridge 1
    this.addPlatform(880, 240, 120, 12, 'bridge', true); // Floating wooden bridge 2
    this.addPlatform(760, 180, 90, 12, 'bridge', true);  // High secret bridge

    // Cliff / Rocky Precipice under Torii Gate (x: 1050 - 1500, y: 260)
    this.addPlatform(1050, 260, 450, 120, 'stone');

    // Stepped path to Pagoda Courtyard (x: 1500 - 2150)
    this.addPlatform(1500, 260, 80, 120, 'stone');
    this.addPlatform(1580, 220, 100, 160, 'stone'); // Step up
    this.addPlatform(1680, 180, 470, 200, 'stone'); // Courtyard level

    // Pagoda Terrace Platforms (Vertical Climbing)
    this.addPlatform(1760, 120, 90, 10, 'bridge', true);
    this.addPlatform(1900, 80, 100, 10, 'bridge', true);

    // Chasm 2 (x: 2150 - 2250) & Final Boss Arena (x: 2250 - 2800, y: 200)
    this.addPlatform(2180, 220, 60, 10, 'bridge', true);
    this.addPlatform(2240, 200, 560, 180, 'stone'); // Boss Summit Arena

    // Boundary Walls
    this.addPlatform(-30, 0, 30, 400, 'stone');
    this.addPlatform(2800, 0, 30, 400, 'stone');

    // ----------------------------------------------------------------------
    // 2. SCENERY PLACEMENTS (Pagoda, Torii, Pines, Bamboo, Lanterns)
    // ----------------------------------------------------------------------
    // A. Bamboo Grove at Start
    for (let x = 40; x < 600; x += 90) {
      this.scenery.push({ type: 'bamboo', x: x + (Math.random() * 20 - 10), y: 140, layer: 0 });
    }

    // B. Ancient Gnarled Pine Trees
    this.scenery.push({ type: 'pineTree', x: 220, y: 152, layer: 1 });
    this.scenery.push({ type: 'pineTree', x: 1080, y: 112, layer: 1 });
    this.scenery.push({ type: 'pineTree', x: 1590, y: 72, layer: 1 });
    this.scenery.push({ type: 'pineTree', x: 2650, y: 52, layer: 1 });

    // C. Grand Crimson Torii Gate (At the Rocky Precipice)
    this.scenery.push({ type: 'torii', x: 1200, y: 122, layer: 1 });

    // D. Weathered Japanese Pagoda (Courtyard backdrop)
    this.scenery.push({ type: 'pagoda', x: 1880, y: -58, layer: 0 });

    // E. Hanging & Standing Paper Lanterns (Light sources)
    const lanternPositions = [
      { x: 120, y: 245 },
      { x: 380, y: 245 },
      { x: 620, y: 245 },
      { x: 930, y: 185 },
      { x: 1220, y: 205 }, // Torii lantern
      { x: 1320, y: 205 },
      { x: 1620, y: 165 },
      { x: 1850, y: 125 }, // Pagoda courtyard lantern
      { x: 2050, y: 125 },
      { x: 2320, y: 145 }, // Boss arena entrance
      { x: 2520, y: 145 },
      { x: 2720, y: 145 }
    ];

    lanternPositions.forEach((pos, idx) => {
      this.scenery.push({ type: 'lantern', x: pos.x, y: pos.y, layer: 2, frameOffset: idx });
      this.lights.push({
        x: pos.x + 16,
        y: pos.y + 20,
        radius: 80,
        color: '#ff9922',
        flicker: 0.2,
        intensity: 1.0
      });
    });

    // F. Jizo Stone Statues (Checkpoints)
    this.checkpoints.push({ x: 80, y: 260, activated: true, id: 0 });   // Start shrine
    this.checkpoints.push({ x: 1420, y: 220, activated: false, id: 1 }); // Pre-pagoda shrine
    this.checkpoints.push({ x: 2260, y: 160, activated: false, id: 2 }); // Boss gate shrine

    this.checkpoints.forEach(cp => {
      this.lights.push({
        x: cp.x + 16,
        y: cp.y + 16,
        radius: 50,
        color: '#d4b8ff',
        flicker: 0.1,
        intensity: 0.8
      });
    });
  }

  addPlatform(x, y, w, h, tileType = 'stone', isOneWay = false) {
    this.colliders.push({ x, y, w, h, tileType, isOneWay });
  }

  // Get nearby colliders for spatial query
  getCollidersNear(x, y, range = 100) {
    return this.colliders.filter(c => 
      c.x + c.w >= x - range &&
      c.x <= x + range &&
      c.y + c.h >= y - range &&
      c.y <= y + range
    );
  }

  // Render static scenery background layers
  renderScenery(ctx, cameraX, cameraY, layerTarget = 0) {
    const sprites = this.pixelGen.generateEnvironmentSprites();

    for (const item of this.scenery) {
      if (item.layer !== layerTarget) continue;

      const sx = Math.floor(item.x - cameraX);
      const sy = Math.floor(item.y - cameraY);

      // Simple frustum culling
      if (sx < -200 || sx > 700 || sy < -300 || sy > 400) continue;

      if (item.type === 'bamboo') {
        ctx.drawImage(sprites.bamboo, sx, sy);
      } else if (item.type === 'pineTree') {
        ctx.drawImage(sprites.pineTree, sx, sy);
      } else if (item.type === 'torii') {
        ctx.drawImage(sprites.torii, sx, sy);
      } else if (item.type === 'pagoda') {
        ctx.drawImage(sprites.pagoda, sx, sy);
      } else if (item.type === 'lantern') {
        const frame = (Math.floor(Date.now() / 150) + (item.frameOffset || 0)) % 4;
        ctx.drawImage(sprites.lantern, frame * 32, 0, 32, 40, sx, sy, 32, 40);
      }
    }

    // Render Jizo Statues on layer 1
    if (layerTarget === 1) {
      this.checkpoints.forEach(cp => {
        const sx = Math.floor(cp.x - cameraX);
        const sy = Math.floor(cp.y - cameraY);
        const frame = cp.activated ? 1 : 0;
        ctx.drawImage(sprites.jizo, frame * 32, 0, 32, 40, sx, sy, 32, 40);
      });
    }
  }

  // Render solid level platforms & bridges
  renderTiles(ctx, cameraX, cameraY) {
    const sprites = this.pixelGen.generateEnvironmentSprites();
    const tilesImg = sprites.tiles;

    for (const block of this.colliders) {
      const bx = Math.floor(block.x - cameraX);
      const by = Math.floor(block.y - cameraY);

      if (bx + block.w < -20 || bx > 660 || by + block.h < -20 || by > 380) continue;

      if (block.tileType === 'bridge') {
        // Render wooden bridge planks
        for (let tx = 0; tx < block.w; tx += 32) {
          const tw = Math.min(32, block.w - tx);
          ctx.drawImage(tilesImg, 64, 0, tw, 12, bx + tx, by, tw, 12);
        }
      } else {
        // Render mossy stone surface & fill
        for (let tx = 0; tx < block.w; tx += 32) {
          const tw = Math.min(32, block.w - tx);
          // Top mossy edge
          ctx.drawImage(tilesImg, 0, 0, tw, 32, bx + tx, by, tw, 32);

          // Deep underground stone
          for (let ty = 32; ty < block.h; ty += 32) {
            const th = Math.min(32, block.h - ty);
            ctx.drawImage(tilesImg, 32, 0, tw, th, bx + tx, by + ty, tw, th);
          }
        }
      }
    }
  }
}
