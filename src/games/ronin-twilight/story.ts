// ============================================================================
// story.ts - Narrative & Tutorial System for Ronin's Gambit
// Core Lore: Jin, the youngest student, awakening in the ruined dojo.
// Tactical Untangling philosophy, Katana Tethering, Shadow Realm rifts,
// and rescuing the 4 Senior Peers (Takeshi, Yumi, Kenji, Hana).
// ============================================================================

export interface DialogueLine {
  speaker: string;
  portrait: string; // 'takeshi' | 'yumi' | 'kenji' | 'hana' | 'jin' | 'master'
  title?: string;
  text: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  instruction: string;
  keys: string[];
  completed: boolean;
}

export interface PeerAbility {
  id: string;
  name: string;
  peerName: string;
  icon: string;
  description: string;
  keys: string;
  unlocked: boolean;
}

export interface Chapter {
  id: number;
  realm: 'physical' | 'shadow';
  title: string;
  subtitle: string;
  objective: string;
  introDialogue: DialogueLine[];
  victoryDialogue: DialogueLine[];
  unlockedAbilityId?: string;
  tutorialPopup?: {
    abilityName: string;
    description: string;
    keys: string;
    tip: string;
  };
}

export const PEER_ABILITIES: Record<string, PeerAbility> = {
  tether: {
    id: 'tether',
    name: 'Katana Tethering',
    peerName: 'Master Kensei',
    icon: '⛓️',
    description: 'Throw your katana into any surface or enemy, then instantly warp-teleport to its anchor point.',
    keys: 'Throw: [Q] or [U] | Warp: [E] or [F]',
    unlocked: true,
  },
  armor_rip: {
    id: 'armor_rip',
    name: 'Armor Rip',
    peerName: 'Takeshi (The Vanguard)',
    icon: '🛡️',
    description: 'Tether onto heavily armored brute enemies or stone barricades to rip their defense away.',
    keys: 'Hold [Q] on Armored Enemies',
    unlocked: false,
  },
  phantom_dash: {
    id: 'phantom_dash',
    name: 'Phantom Dash',
    peerName: 'Yumi (The Acrobat)',
    icon: '⚡',
    description: 'Throw your blade past void barriers and warp directly through dimensional rifts.',
    keys: 'Tether through Purple Barriers',
    unlocked: false,
  },
  shadow_stitch: {
    id: 'shadow_stitch',
    name: 'Shadow Stitch',
    peerName: 'Kenji (The Shinobi)',
    icon: '🌑',
    description: 'Cloak completely in darkness and high-contrast silhouettes to bypass enemy lines undetected.',
    keys: 'Crouch [S] in Shadow Zones',
    unlocked: false,
  },
  weapon_redirect: {
    id: 'weapon_redirect',
    name: 'Weapon Redirect',
    peerName: 'Hana (The Prodigy)',
    icon: '⚔️',
    description: 'Execute a perfect-timed parry to momentarily seize enemy weapons and reflect massive strikes.',
    keys: 'Press [L] or [C] at exact impact',
    unlocked: false,
  },
};

export const INITIAL_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'move',
    title: 'Movement & Sprint',
    instruction: 'Use [A] / [D] or [←] / [→] to move across the platforms.',
    keys: ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'],
    completed: false,
  },
  {
    id: 'jump',
    title: 'Jump & Aerial Spin',
    instruction: 'Press [W], [Space], or [↑] to jump and double jump.',
    keys: ['KeyW', 'Space', 'ArrowUp'],
    completed: false,
  },
  {
    id: 'combo',
    title: 'Katana Combo Strikes',
    instruction: 'Press [J] or [Z] to execute a 3-Hit Katana Combo.',
    keys: ['KeyJ', 'KeyZ'],
    completed: false,
  },
  {
    id: 'tether',
    title: 'Katana Tethering Traversal',
    instruction: 'Press [Q] / [U] to throw your katana, then press [E] / [F] to warp to it!',
    keys: ['KeyQ', 'KeyU', 'KeyE', 'KeyF'],
    completed: false,
  },
  {
    id: 'parry',
    title: 'Defensive Parry & Roll',
    instruction: 'Press [L] / [C] to parry attacks, or [Shift] to dodge roll.',
    keys: ['KeyL', 'KeyC', 'ShiftLeft', 'ShiftRight'],
    completed: false,
  },
];

export const CHAPTERS: Chapter[] = [
  {
    id: 0,
    realm: 'physical',
    title: 'PROLOGUE: THE ASHES',
    subtitle: 'The Ruined Dojo & The Shattered Scabbard',
    objective: 'Complete combat training and unearth the Master’s broken scabbard.',
    introDialogue: [
      {
        speaker: 'Jin',
        portrait: 'jin',
        title: 'The Youngest Student',
        text: 'The dojo... it is in ruins. The timber still burns with the Warlord’s dark alchemy...',
      },
      {
        speaker: 'Jin',
        portrait: 'jin',
        title: 'The Youngest Student',
        text: 'Beneath the ash... Master Kensei’s shattered scabbard. He opened the Shadow Rift to protect us...',
      },
      {
        speaker: 'Master Kensei (Memory)',
        portrait: 'takeshi',
        title: 'Philosophy of Tactical Untangling',
        text: '“Remember, Jin: Battle is chaos only if you accept its rules. Strip away their advantage. Untangle the fight.”',
      },
      {
        speaker: 'Jin',
        portrait: 'jin',
        title: 'The Youngest Student',
        text: 'Takeshi, Yumi, Kenji, Hana... they were dragged into the Shadow Realm. I will bring my brothers and sisters home!',
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Jin',
        portrait: 'jin',
        text: 'The Rift beckons. The first general holds Takeshi in the Iron Prison beyond!',
      },
    ],
  },
  {
    id: 1,
    realm: 'shadow',
    title: 'CHAPTER 1: THE IRON PRISON',
    subtitle: 'Rescuing Takeshi The Vanguard',
    objective: 'Defeat the Corrupted Gatekeeper and rescue Takeshi from the Shadow Realm.',
    introDialogue: [
      {
        speaker: 'Jin',
        portrait: 'jin',
        text: 'The Shadow Realm... the gravity is twisted, and the ruins bleed eerie neon light.',
      },
      {
        speaker: 'Takeshi (Imprisoned)',
        portrait: 'takeshi',
        title: 'The Vanguard',
        text: 'Jin?! You followed us into the rift? Watch out for the Gatekeeper’s heavy armor plates!',
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Takeshi',
        portrait: 'takeshi',
        title: 'The Vanguard',
        text: 'You did it, little brother! Take my technique: Armor Rip. Use your Katana Tether to physically strip heavy armor and shatter barricades!',
      },
    ],
    unlockedAbilityId: 'armor_rip',
    tutorialPopup: {
      abilityName: 'ARMOR RIP (Takeshi’s Technique)',
      description: 'Throw your katana into armored brutes or heavy barricades to tear their defense away.',
      keys: 'Press [Q] / [U] onto Armored Enemies',
      tip: 'Armored foes can now be stripped of their shields, opening them up to fatal strikes!',
    },
  },
  {
    id: 2,
    realm: 'shadow',
    title: 'CHAPTER 2: THE VERTICAL TEMPLE',
    subtitle: 'Rescuing Yumi The Acrobat',
    objective: 'Ascend the floating void ruins and rescue Yumi from the Shadow Temple peak.',
    introDialogue: [
      {
        speaker: 'Yumi',
        portrait: 'yumi',
        title: 'The Acrobat',
        text: 'Jin! The temple platforms are crumbling into the void. Throw your blade across the shadow barriers to reach me!',
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Yumi',
        portrait: 'yumi',
        title: 'The Acrobat',
        text: 'Incredible agility, Jin! I grant you Phantom Dash: your blade can now pierce dimensional rifts, allowing you to warp through solid shadow barriers!',
      },
    ],
    unlockedAbilityId: 'phantom_dash',
    tutorialPopup: {
      abilityName: 'PHANTOM DASH (Yumi’s Technique)',
      description: 'Throw your tether katana past purple shadow barriers to warp through them seamlessly.',
      keys: 'Aim [Q] past barriers, then [E] to warp',
      tip: 'Opens up previously unreachable secret chambers and vertical shortcuts!',
    },
  },
  {
    id: 3,
    realm: 'shadow',
    title: 'CHAPTER 3: THE DARK BAMBOO GROVE',
    subtitle: 'Rescuing Kenji The Shinobi',
    objective: 'Extinguish corrupted spirit lanterns and rescue Kenji from the Shadow Shinobi ambush.',
    introDialogue: [
      {
        speaker: 'Kenji',
        portrait: 'kenji',
        title: 'The Shinobi',
        text: 'Keep low, Jin. The shadow patrols rely on high-contrast lantern light. Stay in the deep silhouettes...',
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Kenji',
        portrait: 'kenji',
        title: 'The Shinobi',
        text: 'Master would be proud. Learn Shadow Stitch: cloak completely in pitch-black darkness to bypass enemy sentries undetected.',
      },
    ],
    unlockedAbilityId: 'shadow_stitch',
    tutorialPopup: {
      abilityName: 'SHADOW STITCH (Kenji’s Technique)',
      description: 'Crouch in dark unlit zones to become completely invisible to enemy patrols.',
      keys: 'Crouch [S] in Shadow Zones',
      tip: 'Allows you to sneak behind formidable warlords for devastating stealth backstabs!',
    },
  },
  {
    id: 4,
    realm: 'shadow',
    title: 'CHAPTER 4: THE INNER FORTRESS',
    subtitle: 'Rescuing Hana The Prodigy & The Final Climax',
    objective: 'Infiltrate the Warlord’s inner sanctum with all 4 senior peers reunited!',
    introDialogue: [
      {
        speaker: 'Hana',
        portrait: 'hana',
        title: 'The Prodigy',
        text: 'Jin! You have gathered all our brothers and sisters. Together, we are the true living Dojo!',
      },
      {
        speaker: 'Takeshi',
        portrait: 'takeshi',
        text: 'I will breach their front gate with Armor Rip!',
      },
      {
        speaker: 'Yumi',
        portrait: 'yumi',
        text: 'I will disable the upper turrets with Phantom Dash!',
      },
      {
        speaker: 'Kenji',
        portrait: 'kenji',
        text: 'I will extinguish their searchlights with Shadow Stitch.',
      },
      {
        speaker: 'Hana',
        portrait: 'hana',
        text: 'And I will teach you Weapon Redirect—time your blade to reflect their greatest dark alchemy!',
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Jin',
        portrait: 'jin',
        text: 'The Warlord has fallen! The Shadow Realm dissolves... Peace returns to our twilight homeland!',
      },
      {
        speaker: 'Master Kensei’s Spirit',
        portrait: 'takeshi',
        text: '“You have untangled the darkness, Jin. The Dojo lives on in you all.”',
      },
    ],
    unlockedAbilityId: 'weapon_redirect',
    tutorialPopup: {
      abilityName: 'WEAPON REDIRECT (Hana’s Technique)',
      description: 'Perfect-timed parry reflects enemy ultimate projectiles and breaks massive armor.',
      keys: 'Press [L] / [C] right before impact',
      tip: 'Turn the enemy’s deadliest strikes directly back against them!',
    },
  },
];
