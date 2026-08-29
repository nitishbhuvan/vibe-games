// ==========================================================================
// Input.js - Universal Input Manager (Keyboard, Gamepad, Touch)
// Features input buffering, key state tracking, and responsive controls.
// ==========================================================================

export class Input {
  constructor() {
    this.keys = {};
    this.prevKeys = {};
    this.bufferedActions = {};
    this.BUFFER_WINDOW = 160; // ms

    // Virtual Touch & Gamepad states
    this.touchStates = {};
    this.gamepadConnected = false;

    // Key Mapping Dictionary
    this.mappings = {
      left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'],
      up: ['KeyW', 'ArrowUp'],
      down: ['KeyS', 'ArrowDown'],
      jump: ['Space', 'KeyW', 'KeyK'],
      attack: ['KeyJ', 'KeyZ'],
      parry: ['KeyL', 'KeyC'],
      roll: ['ShiftLeft', 'ShiftRight'],
      iai: ['KeyI', 'KeyX'],
      kunai: ['KeyU', 'KeyF'],
      heal: ['KeyH', 'KeyE'],
      pause: ['Escape', 'KeyP'],
      toggleAudio: ['KeyM'],
      toggleCrt: ['KeyV']
    };

    this.setupKeyboardListeners();
    this.setupTouchListeners();
    this.setupGamepadListeners();
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent default scrolling for game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keys[e.code]) {
        this.bufferAction(e.code);
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setupTouchListeners() {
    const touchButtons = document.querySelectorAll('.touch-btn');
    touchButtons.forEach(btn => {
      const code = btn.getAttribute('data-key');
      if (!code) return;

      const handlePress = (e) => {
        e.preventDefault();
        this.touchStates[code] = true;
        this.bufferAction(code);
      };

      const handleRelease = (e) => {
        e.preventDefault();
        this.touchStates[code] = false;
      };

      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('touchend', handleRelease, { passive: false });
      btn.addEventListener('touchcancel', handleRelease, { passive: false });
      btn.addEventListener('mousedown', handlePress);
      btn.addEventListener('mouseup', handleRelease);
      btn.addEventListener('mouseleave', handleRelease);
    });
  }

  setupGamepadListeners() {
    window.addEventListener('gamepadconnected', () => {
      this.gamepadConnected = true;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
    });
  }

  bufferAction(code) {
    const now = performance.now();
    for (const [action, keys] of Object.entries(this.mappings)) {
      if (keys.includes(code)) {
        this.bufferedActions[action] = now;
      }
    }
  }

  // Poll Gamepad API
  pollGamepad() {
    if (!navigator.getGamepads) return {};
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0];
    if (!gp) return {};

    const gpState = {};
    const deadzone = 0.25;

    // Left Stick / D-Pad
    const axisX = gp.axes[0];
    const axisY = gp.axes[1];

    if (axisX < -deadzone || (gp.buttons[14] && gp.buttons[14].pressed)) gpState.left = true;
    if (axisX > deadzone || (gp.buttons[15] && gp.buttons[15].pressed)) gpState.right = true;
    if (axisY < -deadzone || (gp.buttons[12] && gp.buttons[12].pressed)) gpState.up = true;
    if (axisY > deadzone || (gp.buttons[13] && gp.buttons[13].pressed)) gpState.down = true;

    // Action buttons
    if (gp.buttons[0] && gp.buttons[0].pressed) gpState.jump = true;     // A / Cross
    if (gp.buttons[2] && gp.buttons[2].pressed) gpState.attack = true;   // X / Square
    if (gp.buttons[4] && gp.buttons[4].pressed) gpState.parry = true;    // LB / L1
    if (gp.buttons[1] && gp.buttons[1].pressed) gpState.roll = true;     // B / Circle
    if (gp.buttons[3] && gp.buttons[3].pressed) gpState.iai = true;      // Y / Triangle
    if (gp.buttons[5] && gp.buttons[5].pressed) gpState.kunai = true;    // RB / R1
    if (gp.buttons[6] && gp.buttons[6].pressed) gpState.heal = true;     // LT / L2
    if (gp.buttons[9] && gp.buttons[9].pressed) gpState.pause = true;    // Start

    return gpState;
  }

  // Check if an action is currently held down
  isDown(action) {
    const keys = this.mappings[action] || [];
    const isKeyDown = keys.some(k => this.keys[k] || this.touchStates[k]);
    const gp = this.pollGamepad();
    return isKeyDown || !!gp[action];
  }

  // Check if an action was just pressed this frame
  isJustPressed(action) {
    const keys = this.mappings[action] || [];
    const isKeyDown = keys.some(k => this.keys[k] || this.touchStates[k]);
    const wasKeyDown = keys.some(k => this.prevKeys[k]);
    return isKeyDown && !wasKeyDown;
  }

  // Check if an action has been buffered within the buffer window and consume it
  consumeBuffer(action) {
    const now = performance.now();
    const time = this.bufferedActions[action];
    if (time && (now - time) <= this.BUFFER_WINDOW) {
      delete this.bufferedActions[action];
      return true;
    }
    return false;
  }

  // Update previous frame states (call at end of frame)
  update() {
    this.prevKeys = { ...this.keys };
  }
}
