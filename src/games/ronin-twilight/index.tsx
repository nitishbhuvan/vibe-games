// ============================================================================
// index.tsx - Ronin's Gambit: Twilight Blade (浪人の奇策)
// Story-Based 2D Samurai Action-Platformer / Metroidvania
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { GameComponentProps } from '../types';
import { AssetManager, type HDSpriteAssets } from './sprites';
import { roninAudio } from './audio';
import { RoninGameEngine } from './engine';
import {
  CHAPTERS,
  INITIAL_TUTORIAL_STEPS,
  PEER_ABILITIES,
  type DialogueLine,
  type PeerAbility,
} from './story';

interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: number;
  isGrounded: boolean;
  canDoubleJump: boolean;
  animState: string;
  runFrame: number;
  runTimer: number;
  idleFrame: number;
  idleTimer: number;
  hp: number;
  maxHp: number;
  ki: number;
  maxKi: number;
  kunai: number;
  gourds: number;
  attackStage: number;
  attackTimer: number;
  comboResetTimer: number;
  isParrying: boolean;
  parryTimer: number;
  isRolling: boolean;
  rollTimer: number;
  isChargingIai: boolean;
  iaiChargeTime: number;
  invulnerableTimer: number;
  isShadowCloaked: boolean;
}

interface EnemyState {
  id: number;
  type: 'shinobi' | 'ashigaru';
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: number;
  hp: number;
  maxHp: number;
  isArmored: boolean;
  attackCooldown: number;
  isAttacking: boolean;
  attackPhase: 'windup' | 'strike' | 'recovery';
  attackTimer: number;
  staggerTimer: number;
  active: boolean;
}

const RoninTwilightGame: React.FC<GameComponentProps> = ({ onGameOver, onScoreUpdate, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game & Story States
  const [gameState, setGameState] = useState<'title' | 'playing' | 'dialogue' | 'paused' | 'ability_popup' | 'gameover' | 'victory'>('title');
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [dialogueQueue, setDialogueQueue] = useState<DialogueLine[]>([]);
  const [dialogueIndex, setDialogueIndex] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Abilities unlocked
  const [abilities, setAbilities] = useState<Record<string, PeerAbility>>(PEER_ABILITIES);
  const [activeAbilityPopup, setActiveAbilityPopup] = useState<any>(null);

  // Tutorial tracking
  const [tutorialSteps, setTutorialSteps] = useState(INITIAL_TUTORIAL_STEPS);
  const [tutorialIndex, setTutorialIndex] = useState<number>(0);
  const [isTutorialActive, setIsTutorialActive] = useState<boolean>(true);

  // Stats & Settings
  const [score, setScore] = useState<number>(0);
  const [enableCrt, setEnableCrt] = useState<boolean>(true);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerKi, setPlayerKi] = useState<number>(100);
  const [playerGourds, setPlayerGourds] = useState<number>(3);
  const [isTetherOut, setIsTetherOut] = useState<boolean>(false);

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const gameEngineRef = useRef<RoninGameEngine | null>(null);
  const assetsRef = useRef<HDSpriteAssets | null>(null);

  // Sync mute state
  useEffect(() => {
    roninAudio.setMuted(!!isMuted);
  }, [isMuted]);

  // Preload assets
  useEffect(() => {
    AssetManager.getInstance().ready().then((assets) => {
      assetsRef.current = assets;
    });
  }, []);

  // Keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      keysRef.current[e.key.toLowerCase()] = true;

      // Pause toggle on ESC or P
      if ((e.code === 'Escape' || e.code === 'KeyP') && (gameState === 'playing' || gameState === 'paused')) {
        setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        return;
      }

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Start Chapter Dialogue sequence
  const startDialogue = useCallback((lines: DialogueLine[], onCompleteState: 'playing' | 'ability_popup' = 'playing') => {
    if (!lines || lines.length === 0) {
      setGameState(onCompleteState);
      return;
    }
    setDialogueQueue(lines);
    setDialogueIndex(0);
    setGameState('dialogue');
  }, []);

  // Typewriter effect for dialogue
  useEffect(() => {
    if (gameState !== 'dialogue' || dialogueQueue.length === 0) return;

    const currentLine = dialogueQueue[dialogueIndex];
    if (!currentLine) return;

    setTypedText('');
    setIsTyping(true);
    let charIdx = 0;

    const timer = setInterval(() => {
      charIdx++;
      setTypedText(currentLine.text.slice(0, charIdx));
      if (charIdx % 3 === 0) roninAudio.playDialogueBlip();

      if (charIdx >= currentLine.text.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 28);

    return () => clearInterval(timer);
  }, [gameState, dialogueIndex, dialogueQueue]);

  // Advance dialogue
  const handleAdvanceDialogue = () => {
    if (isTyping) {
      // Instantly finish typing
      const currentLine = dialogueQueue[dialogueIndex];
      setTypedText(currentLine.text);
      setIsTyping(false);
    } else {
      if (dialogueIndex < dialogueQueue.length - 1) {
        setDialogueIndex((prev) => prev + 1);
      } else {
        // Dialogue finished
        const currentChapter = CHAPTERS[currentChapterIndex];
        if (currentChapter.tutorialPopup && !abilities[currentChapter.unlockedAbilityId || '']?.unlocked) {
          setActiveAbilityPopup(currentChapter.tutorialPopup);
          setGameState('ability_popup');
        } else {
          setGameState('playing');
        }
      }
    }
  };

  // Start game from title
  const handleStartGame = useCallback(() => {
    roninAudio.init();
    setCurrentChapterIndex(0);
    setScore(0);
    setIsTutorialActive(true);
    setTutorialIndex(0);
    startDialogue(CHAPTERS[0].introDialogue);
  }, [startDialogue]);

  // Main Canvas & Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const engine = new RoninGameEngine();
    gameEngineRef.current = engine;

    const chapter = CHAPTERS[currentChapterIndex] || CHAPTERS[0];
    engine.setRealm(chapter.realm);

    const assets = AssetManager.getInstance().assets;

    // 1. Initial Player Setup
    const player: PlayerState = {
      x: 140,
      y: 330,
      vx: 0,
      vy: 0,
      dir: 1,
      isGrounded: false,
      canDoubleJump: true,
      animState: 'idle',
      runFrame: 0,
      runTimer: 0,
      idleFrame: 0,
      idleTimer: 0,
      hp: 100,
      maxHp: 100,
      ki: 100,
      maxKi: 100,
      kunai: 5,
      gourds: 3,
      attackStage: 0,
      attackTimer: 0,
      comboResetTimer: 0,
      isParrying: false,
      parryTimer: 0,
      isRolling: false,
      rollTimer: 0,
      isChargingIai: false,
      iaiChargeTime: 0,
      invulnerableTimer: 0,
      isShadowCloaked: false,
    };

    // 2. Spawn Chapter Enemies
    let enemyIdCounter = 0;
    const spawnEnemy = (type: 'shinobi' | 'ashigaru', x: number, y: number, isArmored: boolean = false): EnemyState => ({
      id: ++enemyIdCounter,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      dir: -1,
      hp: type === 'shinobi' ? 55 : isArmored ? 120 : 80,
      maxHp: type === 'shinobi' ? 55 : isArmored ? 120 : 80,
      isArmored,
      attackCooldown: 1.2 + Math.random() * 1.2,
      isAttacking: false,
      attackPhase: 'windup',
      attackTimer: 0,
      staggerTimer: 0,
      active: true,
    });

    const enemies: EnemyState[] = [];
    if (currentChapterIndex === 0) {
      // Prologue training dummy & sparring ronin
      enemies.push(spawnEnemy('ashigaru', 440, 360), spawnEnemy('shinobi', 840, 270));
    } else if (currentChapterIndex === 1) {
      // Iron Prison (Takeshi) -> Armored Brutes
      enemies.push(
        spawnEnemy('ashigaru', 420, 360, true),
        spawnEnemy('shinobi', 740, 230),
        spawnEnemy('ashigaru', 880, 410, true)
      );
    } else if (currentChapterIndex === 2) {
      // Vertical Temple (Yumi) -> Agile Shinobi
      enemies.push(
        spawnEnemy('shinobi', 300, 320),
        spawnEnemy('shinobi', 620, 310),
        spawnEnemy('shinobi', 800, 230)
      );
    } else if (currentChapterIndex === 3) {
      // Dark Bamboo Grove (Kenji)
      enemies.push(
        spawnEnemy('shinobi', 340, 360),
        spawnEnemy('ashigaru', 620, 340, true),
        spawnEnemy('shinobi', 860, 270)
      );
    } else {
      // Climax Warlord Domain (Hana)
      enemies.push(
        spawnEnemy('ashigaru', 340, 360, true),
        spawnEnemy('shinobi', 580, 310),
        spawnEnemy('ashigaru', 840, 230, true),
        spawnEnemy('shinobi', 920, 410)
      );
    }

    let currentScore = 0;
    let animId: number;
    let lastTime = performance.now();

    // ------------------------------------------------------------------------
    // Game Loop
    // ------------------------------------------------------------------------
    const loop = (timestamp: number) => {
      const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
      lastTime = timestamp;

      if (engine.hitStopFrames > 0) {
        engine.hitStopFrames--;
      } else {
        const keys = keysRef.current;

        // Stamina/Ki recovery
        if (player.ki < player.maxKi && !player.isChargingIai && !player.isParrying) {
          player.ki = Math.min(player.maxKi, player.ki + dt * 30);
          setPlayerKi(Math.round(player.ki));
        }

        if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;

        // ====================================================================
        // A. KATANA TETHERING (Throw: Q/U | Warp: E/F)
        // ====================================================================
        const isTetherThrow = keys['KeyQ'] || keys['KeyU'] || keys['q'] || keys['u'];
        const isTetherWarp = keys['KeyE'] || keys['KeyF'] || keys['e'] || keys['f'];

        if (isTetherThrow && !engine.tether.active && player.attackTimer <= 0) {
          engine.tether.active = true;
          engine.tether.x = player.x + player.dir * 25;
          engine.tether.y = player.y - 40;
          engine.tether.vx = player.dir * 720;
          engine.tether.vy = -120;
          engine.tether.dir = player.dir;
          engine.tether.isEmbedded = false;
          setIsTetherOut(true);
          roninAudio.playTetherThrow();

          // Check tutorial step
          if (isTutorialActive && tutorialIndex === 3) {
            setTutorialSteps((prev) => {
              const cp = [...prev];
              cp[3].completed = true;
              return cp;
            });
            setTutorialIndex(4);
          }

          keys['KeyQ'] = false;
          keys['KeyU'] = false;
          keys['q'] = false;
          keys['u'] = false;
        }

        // Warp to embedded/active Katana Tether
        if (isTetherWarp && engine.tether.active) {
          roninAudio.playTetherWarp();
          engine.triggerScreenShake(8);
          engine.addSparkBurst(player.x, player.y - 45, 14, '#38bdf8');

          // Warp player to tether location
          player.x = Math.max(30, Math.min(994, engine.tether.x));
          player.y = engine.tether.y + 35;
          player.vy = -180;
          player.invulnerableTimer = 0.35;
          engine.addSparkBurst(player.x, player.y - 45, 14, '#a855f7');

          // Armor Rip check (Takeshi's ability)
          if (abilities.armor_rip.unlocked) {
            enemies.forEach((en) => {
              if (en.active && en.isArmored && Math.abs(en.x - player.x) < 55) {
                en.isArmored = false;
                en.staggerTimer = 1.5;
                roninAudio.playArmorRip();
                engine.addSparkBurst(en.x, en.y - 40, 20, '#f59e0b');
              }
            });
          }

          engine.tether.active = false;
          engine.tether.isEmbedded = false;
          setIsTetherOut(false);

          keys['KeyE'] = false;
          keys['KeyF'] = false;
          keys['e'] = false;
          keys['f'] = false;
        }

        engine.updateTether(dt);

        // ====================================================================
        // B. COMBAT & MULTI-FRAME ATTACKS
        // ====================================================================
        // 1. Dodge Roll (Shift)
        if ((keys['ShiftLeft'] || keys['ShiftRight'] || keys['shift']) && !player.isRolling && player.isGrounded && player.ki >= 20) {
          player.isRolling = true;
          player.rollTimer = 0.35;
          player.invulnerableTimer = 0.35;
          player.ki -= 20;
          setPlayerKi(Math.round(player.ki));
          player.vx = player.dir * 420;
          roninAudio.playRoll();
          engine.addDust(player.x, player.y);

          if (isTutorialActive && tutorialIndex === 4) {
            setTutorialSteps((prev) => {
              const cp = [...prev];
              cp[4].completed = true;
              return cp;
            });
            setIsTutorialActive(false);
          }
        }

        if (player.isRolling) {
          player.rollTimer -= dt;
          player.vx = player.dir * 380;
          if (player.rollTimer <= 0) player.isRolling = false;
        }

        // 2. Katana 3-Hit Combo (J / Z)
        const isAttackPressed = keys['KeyJ'] || keys['KeyZ'] || keys['j'] || keys['z'];
        if (isAttackPressed && player.attackTimer <= 0 && !player.isRolling && !player.isChargingIai && !player.isParrying) {
          if (player.attackStage === 0 || player.attackStage === 3) player.attackStage = 1;
          else if (player.attackStage === 1) player.attackStage = 2;
          else if (player.attackStage === 2) player.attackStage = 3;

          player.attackTimer = player.attackStage === 3 ? 0.34 : 0.24;
          roninAudio.playSlash(player.attackStage);
          player.vx += player.dir * 140;

          if (isTutorialActive && tutorialIndex === 2) {
            setTutorialSteps((prev) => {
              const cp = [...prev];
              cp[2].completed = true;
              return cp;
            });
            setTutorialIndex(3);
          }

          const hitRange = player.attackStage === 3 ? 85 : 65;
          const hitDamage = player.attackStage === 3 ? 45 : player.attackStage === 2 ? 30 : 20;

          enemies.forEach((en) => {
            if (en.active && Math.abs(en.y - player.y) < 45) {
              const dx = (en.x - player.x) * player.dir;
              if (dx > 0 && dx < hitRange) {
                if (en.isArmored && !abilities.armor_rip.unlocked) {
                  // Armor deflect
                  roninAudio.playParry();
                  engine.addSparkBurst(en.x, en.y - 40, 8, '#94a3b8');
                  en.hp -= 5;
                } else {
                  en.hp -= hitDamage;
                  en.staggerTimer = 0.45;
                  en.vx = player.dir * (player.attackStage === 3 ? 280 : 160);
                  roninAudio.playHit();
                  engine.addSparkBurst(en.x, en.y - 40, 10, player.attackStage === 3 ? '#ef4444' : '#fbbf24');
                  engine.triggerScreenShake(player.attackStage === 3 ? 7 : 3);
                  if (player.attackStage === 3) engine.hitStopFrames = 2;

                  currentScore += 100 * player.attackStage;
                  setScore(currentScore);
                  onScoreUpdate?.(currentScore);
                }
              }
            }
          });
        }

        if (player.attackTimer > 0) {
          player.attackTimer -= dt;
        }

        // 3. Parry / Weapon Redirect (L / C)
        const isParryPressed = keys['KeyL'] || keys['KeyC'] || keys['l'] || keys['c'];
        if (isParryPressed && !player.isRolling && player.attackTimer <= 0) {
          player.isParrying = true;
          player.parryTimer = 0.25;
          player.vx *= 0.8;

          if (isTutorialActive && tutorialIndex === 4) {
            setTutorialSteps((prev) => {
              const cp = [...prev];
              cp[4].completed = true;
              return cp;
            });
            setIsTutorialActive(false);
          }
        } else {
          if (player.parryTimer > 0) {
            player.parryTimer -= dt;
            if (player.parryTimer <= 0) player.isParrying = false;
          } else {
            player.isParrying = false;
          }
        }

        // 4. Healing Gourd (H / E)
        const isHealPressed = keys['KeyH'] || keys['h'];
        if (isHealPressed && player.gourds > 0 && player.hp < player.maxHp) {
          player.gourds--;
          setPlayerGourds(player.gourds);
          player.hp = Math.min(player.maxHp, player.hp + 50);
          setPlayerHp(player.hp);
          roninAudio.playHeal();
          engine.addSparkBurst(player.x, player.y - 50, 14, '#34d399');
          keys['KeyH'] = false;
          keys['h'] = false;
        }

        // 5. Movement & Multi-Frame Run Cycles
        const moveLeft = keys['ArrowLeft'] || keys['KeyA'] || keys['a'];
        const moveRight = keys['ArrowRight'] || keys['KeyD'] || keys['d'];
        const jumpPressed = keys['ArrowUp'] || keys['KeyW'] || keys['Space'] || keys['w'] || keys[' '];
        const dropDown = keys['ArrowDown'] || keys['KeyS'] || keys['s'];

        if (isTutorialActive && tutorialIndex === 0 && (moveLeft || moveRight)) {
          setTutorialSteps((prev) => {
            const cp = [...prev];
            cp[0].completed = true;
            return cp;
          });
          setTutorialIndex(1);
        }

        if (!player.isRolling && player.attackTimer <= 0.08) {
          const moveSpeed = 280;
          if (moveLeft) {
            player.vx = -moveSpeed;
            player.dir = -1;
            player.runTimer += dt;
            if (player.runTimer > 0.09) {
              player.runTimer = 0;
              player.runFrame = (player.runFrame + 1) % 6;
            }
          } else if (moveRight) {
            player.vx = moveSpeed;
            player.dir = 1;
            player.runTimer += dt;
            if (player.runTimer > 0.09) {
              player.runTimer = 0;
              player.runFrame = (player.runFrame + 1) % 6;
            }
          } else {
            player.vx *= 0.75;
            if (Math.abs(player.vx) < 5) player.vx = 0;
            player.idleTimer += dt;
            if (player.idleTimer > 0.18) {
              player.idleTimer = 0;
              player.idleFrame = (player.idleFrame + 1) % 4;
            }
          }

          // Jump & Double Jump
          if (jumpPressed) {
            if (player.isGrounded) {
              if (dropDown) {
                player.y += 6;
                player.isGrounded = false;
              } else {
                player.vy = -540;
                player.isGrounded = false;
                player.canDoubleJump = true;
                roninAudio.playJump();
                engine.addDust(player.x, player.y);

                if (isTutorialActive && tutorialIndex === 1) {
                  setTutorialSteps((prev) => {
                    const cp = [...prev];
                    cp[1].completed = true;
                    return cp;
                  });
                  setTutorialIndex(2);
                }
              }
              keys['ArrowUp'] = false;
              keys['KeyW'] = false;
              keys['Space'] = false;
              keys['w'] = false;
              keys[' '] = false;
            } else if (player.canDoubleJump) {
              player.vy = -480;
              player.canDoubleJump = false;
              roninAudio.playJump();
              engine.addSparkBurst(player.x, player.y - 20, 8, '#38bdf8');
              keys['ArrowUp'] = false;
              keys['KeyW'] = false;
              keys['Space'] = false;
              keys['w'] = false;
              keys[' '] = false;
            }
          }
        }

        // Gravity
        player.vy += 1350 * dt;
        if (player.vy > 750) player.vy = 750;

        player.x += player.vx * dt;
        player.y += player.vy * dt;

        if (player.x < 30) {
          player.x = 30;
          player.vx = 0;
        }
        if (player.x > 994) {
          player.x = 994;
          player.vx = 0;
        }

        // Platform Collisions
        player.isGrounded = false;
        const playerFootY = player.y;
        const prevFootY = playerFootY - player.vy * dt;

        engine.platforms.forEach((plat) => {
          if (player.x + 20 >= plat.x && player.x - 20 <= plat.x + plat.w) {
            if (plat.isOneWay) {
              if (player.vy >= 0 && prevFootY <= plat.y + 6 && playerFootY >= plat.y) {
                player.y = plat.y;
                player.vy = 0;
                player.isGrounded = true;
                player.canDoubleJump = true;
              }
            } else {
              if (player.vy >= 0 && prevFootY <= plat.y + 10 && playerFootY >= plat.y) {
                player.y = plat.y;
                player.vy = 0;
                player.isGrounded = true;
                player.canDoubleJump = true;
              }
            }
          }
        });

        // Determine player animation state
        if (player.isRolling) player.animState = 'roll';
        else if (player.isParrying) player.animState = 'parry';
        else if (player.attackTimer > 0) player.animState = 'slash';
        else if (!player.isGrounded) player.animState = 'jump';
        else if (Math.abs(player.vx) > 20) player.animState = 'run';
        else player.animState = 'idle';

        // ====================================================================
        // C. ENEMIES UPDATE & MULTI-FRAME ATTACKS
        // ====================================================================
        let activeEnemyCount = 0;
        enemies.forEach((en) => {
          if (!en.active) return;
          activeEnemyCount++;

          if (en.hp <= 0) {
            en.active = false;
            currentScore += en.type === 'shinobi' ? 500 : 700;
            setScore(currentScore);
            onScoreUpdate?.(currentScore);
            engine.addSparkBurst(en.x, en.y - 45, 22, '#ef4444');
            return;
          }

          if (en.staggerTimer > 0) {
            en.staggerTimer -= dt;
            en.vx *= 0.85;
            en.x += en.vx * dt;
            return;
          }

          const dx = player.x - en.x;
          const dy = player.y - en.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          en.dir = dx > 0 ? 1 : -1;

          en.attackCooldown -= dt;

          // Enemy attack state machine (Windup -> Strike -> Recovery)
          if (dist < 75 && Math.abs(dy) < 35) {
            if (en.attackCooldown <= 0 && !en.isAttacking) {
              en.isAttacking = true;
              en.attackPhase = 'windup';
              en.attackTimer = 0.35; // Windup telegraph
              en.attackCooldown = 1.8 + Math.random() * 1.0;
            }
          } else if (dist < 340) {
            const speed = en.type === 'shinobi' ? 180 : 120;
            en.vx = en.dir * speed;
          } else {
            en.vx *= 0.9;
          }

          if (en.isAttacking) {
            en.attackTimer -= dt;
            if (en.attackPhase === 'windup' && en.attackTimer <= 0) {
              // Transition to Strike phase
              en.attackPhase = 'strike';
              en.attackTimer = 0.2;
              roninAudio.playSlash(1);

              // Check hit on player
              if (dist < 75 && Math.abs(dy) < 35 && player.invulnerableTimer <= 0) {
                if (player.isParrying) {
                  // PARRY / WEAPON REDIRECT!
                  roninAudio.playParry();
                  engine.addSparkBurst(player.x + player.dir * 25, player.y - 45, 18, '#fbbf24');
                  engine.triggerScreenShake(9);
                  engine.hitStopFrames = 5;
                  en.staggerTimer = 1.6;
                  en.vx = -en.dir * 260;

                  // Weapon Redirect extra damage
                  if (abilities.weapon_redirect.unlocked) {
                    en.hp -= 40;
                    engine.addSparkBurst(en.x, en.y - 45, 16, '#38bdf8');
                  }

                  player.ki = Math.min(player.maxKi, player.ki + 30);
                  setPlayerKi(Math.round(player.ki));
                  currentScore += 350;
                  setScore(currentScore);
                } else if (!player.isRolling) {
                  const dmg = en.type === 'shinobi' ? 22 : 30;
                  player.hp = Math.max(0, player.hp - dmg);
                  setPlayerHp(player.hp);
                  player.invulnerableTimer = 0.6;
                  player.vx = en.dir * 240;
                  roninAudio.playHit();
                  engine.addSparkBurst(player.x, player.y - 45, 14, '#dc2626');
                  engine.triggerScreenShake(8);

                  if (player.hp <= 0) {
                    setGameState('gameover');
                    onGameOver?.(currentScore);
                  }
                }
              }
            } else if (en.attackPhase === 'strike' && en.attackTimer <= 0) {
              en.attackPhase = 'recovery';
              en.attackTimer = 0.25;
            } else if (en.attackPhase === 'recovery' && en.attackTimer <= 0) {
              en.isAttacking = false;
            }
          }

          en.vy += 1350 * dt;
          en.x += en.vx * dt;
          en.y += en.vy * dt;

          const enFootY = en.y;
          engine.platforms.forEach((plat) => {
            if (en.x + 15 >= plat.x && en.x - 15 <= plat.x + plat.w) {
              if (en.vy >= 0 && enFootY >= plat.y && enFootY <= plat.y + 16) {
                en.y = plat.y;
                en.vy = 0;
              }
            }
          });
        });

        // Chapter Victory Condition: All enemies defeated
        if (activeEnemyCount === 0 && gameState === 'playing') {
          const currentChapter = CHAPTERS[currentChapterIndex];
          if (currentChapter.unlockedAbilityId) {
            setAbilities((prev) => ({
              ...prev,
              [currentChapter.unlockedAbilityId!]: {
                ...prev[currentChapter.unlockedAbilityId!],
                unlocked: true,
              },
            }));
          }

          // Advance chapter
          if (currentChapterIndex < CHAPTERS.length - 1) {
            setCurrentChapterIndex((prev) => prev + 1);
            startDialogue(currentChapter.victoryDialogue);
          } else {
            setGameState('victory');
          }
        }

        engine.updateParticles(dt);
        if (engine.screenShake > 0) {
          engine.screenShake = Math.max(0, engine.screenShake - dt * 25);
        }
      }

      // ======================================================================
      // D. RENDERING PIPELINE (1024x576 Full HD)
      // ======================================================================
      ctx.save();
      if (engine.screenShake > 0) {
        const sx = (Math.random() - 0.5) * engine.screenShake * 2;
        const sy = (Math.random() - 0.5) * engine.screenShake * 2;
        ctx.translate(sx, sy);
      }

      // 1. Draw Chapter Background
      const chapter = CHAPTERS[currentChapterIndex] || CHAPTERS[0];
      const bgImg = chapter.realm === 'physical' ? assets.bgPhysical : assets.bgShadow;
      if (bgImg && bgImg.complete) {
        ctx.drawImage(bgImg, 0, 0, 1024, 576);
      }

      // 2. Render Katana Tether Beam
      engine.renderTetherBeam(ctx, player.x, player.y);

      // 3. Render Enemies with High-Definition Sprite Assets & Attack Telegraphs
      enemies.forEach((en) => {
        if (!en.active) return;
        ctx.save();
        ctx.translate(Math.round(en.x), Math.round(en.y));
        if (en.dir === -1) ctx.scale(-1, 1);

        const enImg = en.type === 'shinobi' ? assets.ninja : assets.spearman;
        if (enImg && enImg.complete && enImg.naturalWidth > 0) {
          const h = 100;
          const w = h * (enImg.naturalWidth / enImg.naturalHeight);

          // Subtle breathing / windup bob
          let attackBobX = 0;
          if (en.isAttacking) {
            if (en.attackPhase === 'windup') attackBobX = -8;
            else if (en.attackPhase === 'strike') attackBobX = 14;
          }

          ctx.drawImage(enImg, -w / 2 + attackBobX, -h, w, h);

          // Attack telegraph gleam
          if (en.isAttacking && en.attackPhase === 'windup') {
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 12;
            ctx.fillRect(en.dir === 1 ? 6 : -14, -h + 20, 8, 8);
          }
        }

        ctx.restore();

        // Enemy Health Bar & Armor Badge
        const barW = 44;
        const barH = 5;
        const barX = en.x - barW / 2;
        const barY = en.y - 110;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = en.isArmored ? '#38bdf8' : '#ef4444';
        ctx.fillRect(barX, barY, Math.max(0, (en.hp / en.maxHp) * barW), barH);

        if (en.isArmored) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px monospace';
          ctx.fillText('🛡️ARMORED', barX - 6, barY - 4);
        }
      });

      // 4. Render Jin with High-Definition Pixel Art Sprites matching Image 1
      ctx.save();
      ctx.translate(Math.round(player.x), Math.round(player.y));
      if (player.dir === -1) ctx.scale(-1, 1);

      let jinImg = assets.samuraiIdle;
      if (player.animState === 'run') jinImg = assets.samuraiRun;
      else if (player.animState === 'jump') jinImg = assets.samuraiJump;
      else if (player.animState === 'slash') jinImg = assets.samuraiSlash;
      else if (player.animState === 'parry') jinImg = assets.samuraiParry;
      else if (player.animState === 'roll') jinImg = assets.samuraiJump;

      if (jinImg && jinImg.complete && jinImg.naturalWidth > 0) {
        const h = 106;
        const w = h * (jinImg.naturalWidth / jinImg.naturalHeight);

        // Smooth breathing & run bobbing
        let bobY = 0;
        if (player.animState === 'idle') {
          bobY = Math.sin(timestamp / 240) * 2;
        } else if (player.animState === 'run') {
          bobY = Math.abs(Math.sin(timestamp / 100)) * -4;
        }

        if (player.invulnerableTimer <= 0 || Math.floor(timestamp / 50) % 2 === 0) {
          ctx.drawImage(jinImg, -w / 2, -h + bobY, w, h);

          // Glowing energy slash arc trail during attack
          if (player.animState === 'slash') {
            const trailColors = ['#38bdf8', '#f59e0b', '#ef4444'];
            const col = trailColors[Math.min(2, Math.max(0, player.attackStage - 1))];
            ctx.strokeStyle = col;
            ctx.lineWidth = 5;
            ctx.shadowColor = col;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(10, -h * 0.5, 60, -Math.PI * 0.4, Math.PI * 0.2);
            ctx.stroke();
          }
        }
      }

      ctx.restore();

      // 5. Dynamic Lighting & Particles
      engine.renderLighting(ctx, timestamp, player.x, player.y - 50, player.isChargingIai);
      engine.renderParticles(ctx);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      roninAudio.stopAll();
    };
  }, [gameState, currentChapterIndex, onGameOver, onScoreUpdate, isTutorialActive, tutorialIndex, abilities]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '1040px',
        margin: '0 auto',
        userSelect: 'none',
      }}
    >
      {/* Canvas Viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#0c0714',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 158, 11, 0.3)',
          border: '2px solid rgba(245, 158, 11, 0.5)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={1024}
          height={576}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            imageRendering: 'pixelated',
          }}
        />

        {/* CRT Scanline Overlay */}
        {enableCrt && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.12) 0px, rgba(0, 0, 0, 0.12) 1px, transparent 1px, transparent 2px)',
            }}
          />
        )}

        {/* In-Game HUD (During Play) */}
        {gameState === 'playing' && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              right: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              pointerEvents: 'none',
              fontFamily: 'monospace',
              zIndex: 10,
            }}
          >
            {/* Player Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#f59e0b', textShadow: '0 2px 4px #000' }}>
                  JIN (仁)
                </span>
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' }}>
                  {CHAPTERS[currentChapterIndex]?.title}
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.88)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 800, width: '24px' }}>HP</span>
                  <div style={{ width: '140px', height: '8px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${playerHp}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{playerHp}/100</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, width: '24px' }}>KI</span>
                  <div style={{ width: '140px', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${playerKi}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{playerKi}/100</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '2px', fontSize: '0.75rem', color: '#f8fafc' }}>
                  <span>⛓️ Tether: {isTetherOut ? 'OUT [E]' : 'READY [Q]'}</span>
                  <span>🍵 Gourd: {playerGourds}</span>
                </div>
              </div>
            </div>

            {/* Objective & Score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24', textShadow: '0 2px 6px #000' }}>
                {score.toLocaleString()} PTS
              </div>
              <div
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fbbf24',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  maxWidth: '320px',
                  textAlign: 'right',
                }}
              >
                📜 {CHAPTERS[currentChapterIndex]?.objective}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>[ESC] / [P] Pause Menu</span>
            </div>
          </div>
        )}

        {/* Initial Interactive Tutorial Banner */}
        {gameState === 'playing' && isTutorialActive && tutorialIndex < tutorialSteps.length && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))',
              border: '2px solid #f59e0b',
              padding: '10px 20px',
              borderRadius: '8px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
              zIndex: 15,
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>📖</span>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b' }}>
                TUTORIAL: {tutorialSteps[tutorialIndex].title}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                {tutorialSteps[tutorialIndex].instruction}
              </div>
            </div>
          </div>
        )}

        {/* Cinematic Dialogue Modal */}
        {gameState === 'dialogue' && dialogueQueue[dialogueIndex] && (
          <div
            onClick={handleAdvanceDialogue}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5, 3, 10, 0.75)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 30,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '820px',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(9, 14, 26, 0.98))',
                border: '2px solid #f59e0b',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                gap: '18px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 25px rgba(245, 158, 11, 0.3)',
              }}
            >
              {/* Character Portrait */}
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid #f59e0b',
                  flexShrink: 0,
                  backgroundColor: '#090d16',
                }}
              >
                <img
                  src={`/games/ronin/portrait_${dialogueQueue[dialogueIndex].portrait === 'jin' ? 'takeshi' : dialogueQueue[dialogueIndex].portrait}.png`}
                  alt={dialogueQueue[dialogueIndex].speaker}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Dialogue Content */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f59e0b' }}>
                      {dialogueQueue[dialogueIndex].speaker}
                    </span>
                    {dialogueQueue[dialogueIndex].title && (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        • {dialogueQueue[dialogueIndex].title}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.96rem', color: '#f8fafc', lineHeight: 1.5, margin: 0 }}>
                    {typedText}
                  </p>
                </div>
                <div style={{ alignSelf: 'flex-end', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Click / Space to continue ▶
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ability Unlock Tutorial Modal */}
        {gameState === 'ability_popup' && activeAbilityPopup && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5, 3, 10, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 35,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '620px',
                background: 'linear-gradient(180deg, #1e1b4b, #0f172a)',
                border: '2px solid #38bdf8',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                boxShadow: '0 0 30px rgba(56, 189, 248, 0.5)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '6px' }}>⚡ ABILITY UNLOCKED</div>
              <h2 style={{ fontSize: '1.6rem', color: '#38bdf8', margin: '0 0 10px 0' }}>
                {activeAbilityPopup.abilityName}
              </h2>
              <p style={{ fontSize: '0.98rem', color: '#cbd5e1', marginBottom: '16px' }}>
                {activeAbilityPopup.description}
              </p>
              <div
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #f59e0b',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: '#fbbf24',
                  marginBottom: '16px',
                }}
              >
                CONTROLS: {activeAbilityPopup.keys}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '22px' }}>
                💡 Tip: {activeAbilityPopup.tip}
              </p>
              <button
                onClick={() => setGameState('playing')}
                style={{
                  padding: '12px 32px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  backgroundColor: '#38bdf8',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(56, 189, 248, 0.6)',
                }}
              >
                MASTER THIS TECHNIQUE ⚔️
              </button>
            </div>
          </div>
        )}

        {/* Pause Menu Modal (ESC / P) */}
        {gameState === 'paused' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(8, 5, 16, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 40,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '720px',
                background: 'linear-gradient(180deg, #1e293b, #0f172a)',
                border: '2px solid #f59e0b',
                borderRadius: '12px',
                padding: '24px',
                color: '#ffffff',
                boxShadow: '0 0 30px rgba(0,0,0,0.9), 0 0 20px rgba(245, 158, 11, 0.4)',
              }}
            >
              <h2 style={{ fontSize: '1.8rem', color: '#f59e0b', margin: '0 0 16px 0', textAlign: 'center', letterSpacing: '4px' }}>
                PAUSED ・ 一時停止
              </h2>

              {/* Ability Tree Status */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
                  PEER ABILITIES &amp; TECHNIQUES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.values(abilities).map((ab) => (
                    <div
                      key={ab.id}
                      style={{
                        background: ab.unlocked ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0,0,0,0.4)',
                        border: `1px solid ${ab.unlocked ? '#38bdf8' : '#475569'}`,
                        borderRadius: '6px',
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: ab.unlocked ? '#f8fafc' : '#64748b' }}>
                          {ab.icon} {ab.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: ab.unlocked ? '#22c55e' : '#94a3b8' }}>
                          {ab.unlocked ? 'UNLOCKED' : 'LOCKED'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>{ab.keys}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
                <button
                  onClick={() => setGameState('playing')}
                  style={{
                    padding: '10px 24px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    backgroundColor: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  RESUME GAME
                </button>
                <button
                  onClick={handleStartGame}
                  style={{
                    padding: '10px 24px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#cbd5e1',
                    backgroundColor: '#334155',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  RESTART STORY
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Title Screen Overlay */}
        {gameState === 'title' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, rgba(15, 10, 28, 0.88), rgba(28, 12, 38, 0.94))',
              color: '#ffffff',
              padding: '24px',
              textAlign: 'center',
              zIndex: 20,
            }}
          >
            <div style={{ fontSize: '1.8rem', color: '#f59e0b', marginBottom: '6px', letterSpacing: '6px' }}>
              浪人の奇策・黄昏の刃
            </div>
            <h1
              style={{
                fontSize: '2.8rem',
                fontWeight: 900,
                color: '#ffffff',
                textShadow: '0 0 25px rgba(245, 158, 11, 0.7)',
                margin: '0 0 8px 0',
              }}
            >
              RONIN'S GAMBIT
            </h1>
            <p style={{ fontSize: '1.05rem', color: '#cbd5e1', maxWidth: '580px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Awaken in the ruined dojo. Master <strong>Katana Tethering</strong>, cross into the <strong>Shadow Realm</strong>, and rescue your four senior peers to reclaim your brotherhood.
            </p>

            <button
              onClick={handleStartGame}
              style={{
                padding: '14px 40px',
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#ffffff',
                backgroundColor: '#dc2626',
                border: '2px solid #f87171',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(220, 38, 38, 0.7)',
                transition: 'all 0.2s ease',
              }}
            >
              BEGIN STORY CAMPAIGN ⚔️
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 10, 20, 0.94)',
              color: '#ffffff',
              padding: '24px',
              textAlign: 'center',
              zIndex: 20,
            }}
          >
            <div style={{ fontSize: '3.5rem', color: '#dc2626', marginBottom: '8px' }}>死</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f87171', margin: '0 0 8px 0' }}>
              FALLEN WARRIOR
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#cbd5e1', marginBottom: '24px' }}>
              Your blade rests beneath the falling twilight petals.
            </p>
            <button
              onClick={handleStartGame}
              style={{
                padding: '14px 36px',
                fontSize: '1.1rem',
                fontWeight: 900,
                color: '#ffffff',
                backgroundColor: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              TRY AGAIN ⚔️
            </button>
          </div>
        )}

        {/* Victory Screen */}
        {gameState === 'victory' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, #1e1b4b, #0f172a)',
              color: '#ffffff',
              padding: '24px',
              textAlign: 'center',
              zIndex: 20,
            }}
          >
            <div style={{ fontSize: '3rem', color: '#fbbf24', marginBottom: '8px' }}>勝</div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fbbf24', margin: '0 0 8px 0' }}>
              DOJO RECLAIMED!
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#cbd5e1', maxWidth: '580px', marginBottom: '24px' }}>
              You have rescued Takeshi, Yumi, Kenji, and Hana. Together, you defeated the Corrupted Warlord and proved that the Master’s spirit lives on in you all!
            </p>
            <button
              onClick={handleStartGame}
              style={{
                padding: '14px 36px',
                fontSize: '1.1rem',
                fontWeight: 900,
                color: '#ffffff',
                backgroundColor: '#22c55e',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              PLAY AGAIN ⚔️
            </button>
          </div>
        )}
      </div>

      {/* Control Quick Toggles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginTop: '14px',
          padding: '0 6px',
        }}
      >
        <button
          onClick={() => setEnableCrt(!enableCrt)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid var(--border-main)',
            background: enableCrt ? 'var(--accent-primary)' : 'var(--bg-card)',
            color: enableCrt ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📺 CRT Scanlines: {enableCrt ? 'ON' : 'OFF'}
        </button>

        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          🏮 <strong>Ronin's Gambit</strong> • Metroidvania Action Platformer
        </div>
      </div>
    </div>
  );
};

export default RoninTwilightGame;
