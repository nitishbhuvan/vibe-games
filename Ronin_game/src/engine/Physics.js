// ==========================================================================
// Physics.js - 2D Platformer Physics & Collision Engine
// Supports AABB collisions, one-way platforms, wall slides, and raycasts.
// ==========================================================================

export class Physics {
  // Check overlap between two rectangles {x, y, w, h}
  static rectIntersect(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  // Check point in rect
  static pointInRect(px, py, rect) {
    return (
      px >= rect.x &&
      px <= rect.x + rect.w &&
      py >= rect.y &&
      py <= rect.y + rect.h
    );
  }

  // Move an entity and resolve collisions against static world colliders
  static moveAndSlide(entity, world, dt = 1.0) {
    const colliders = world.getCollidersNear(entity.x, entity.y, 80);

    // 1. Move Horizontal
    entity.x += entity.vx * dt;
    entity.onWall = 0; // -1 for left wall, 1 for right wall

    const hBox = {
      x: entity.x + entity.hitboxOffsetX,
      y: entity.y + entity.hitboxOffsetY,
      w: entity.hitboxW,
      h: entity.hitboxH
    };

    for (const block of colliders) {
      if (block.isOneWay) continue; // One-way platforms don't block horizontal movement

      if (this.rectIntersect(hBox, block)) {
        if (entity.vx > 0) {
          entity.x = block.x - entity.hitboxOffsetX - entity.hitboxW;
          entity.onWall = 1;
        } else if (entity.vx < 0) {
          entity.x = block.x + block.w - entity.hitboxOffsetX;
          entity.onWall = -1;
        }
        entity.vx = 0;
        break;
      }
    }

    // 2. Move Vertical
    const prevY = entity.y;
    entity.y += entity.vy * dt;
    entity.isGrounded = false;

    const vBox = {
      x: entity.x + entity.hitboxOffsetX,
      y: entity.y + entity.hitboxOffsetY,
      w: entity.hitboxW,
      h: entity.hitboxH
    };

    for (const block of colliders) {
      // One-way platform logic (passable from below)
      if (block.isOneWay) {
        const prevBottom = prevY + entity.hitboxOffsetY + entity.hitboxH;
        const currentBottom = vBox.y + vBox.h;

        // If falling downwards and was previously above platform top edge
        if (entity.vy >= 0 && prevBottom <= block.y + 4 && currentBottom >= block.y) {
          if (!entity.isDroppingDown) {
            entity.y = block.y - entity.hitboxOffsetY - entity.hitboxH;
            entity.vy = 0;
            entity.isGrounded = true;
          }
        }
        continue;
      }

      // Solid block collision
      if (this.rectIntersect(vBox, block)) {
        if (entity.vy > 0) { // Landing on floor
          entity.y = block.y - entity.hitboxOffsetY - entity.hitboxH;
          entity.vy = 0;
          entity.isGrounded = true;
        } else if (entity.vy < 0) { // Hitting ceiling
          entity.y = block.y + block.h - entity.hitboxOffsetY;
          entity.vy = 0;
        }
        break;
      }
    }

    // Reset drop-down flag once below one-way platform
    if (entity.isDroppingDown && entity.vy > 2) {
      entity.isDroppingDown = false;
    }
  }
}
