import type { GameMetadata } from '../types';
import RoninTwilightGame from './index';

export const roninTwilightMetadata: GameMetadata = {
  id: 'ronin-twilight',
  title: "Ronin's Gambit: Twilight Blade",
  tagline: 'A story-driven 2D samurai Metroidvania action-platformer',
  description:
    "Awaken as Jin in the ashes of your ruined dojo. Master the signature Katana Tethering mechanic to traverse vertical ruins, cross into the eerie Shadow Realm, and rescue your four senior peers (Takeshi, Yumi, Kenji, and Hana) to reclaim your brotherhood and avenge Master Kensei.",
  instructions: [
    'A / D or Left / Right: Move & multi-frame sprint cycle.',
    'W / Space / Up: Jump & double jump.',
    'J or Z: 3-Hit Katana combo with glowing crescent energy blade arcs.',
    'Q or U: Throw Katana Tether into walls, ceilings, or enemies.',
    'E or F: Warp-teleport instantly to the Katana Tether location!',
    'L or C: Defensive Parry & Weapon Redirect counter.',
    'Shift or S + Direction: Dodge Roll with invulnerability frames.',
    'ESC or P: Open the Pause Menu to inspect unlocked Peer Abilities and Quest Log.',
    'H: Drink Healing Gourd to restore HP.',
  ],
  categories: ['action', 'flash'],
  thumbnail: '⚔️',
  accentColor: '#dc2626',
  badge: '🏮 Story Metroidvania',
  rating: 4.98,
  author: 'Vibe Samurai Studio',
  controls: [
    { key: 'A / D or ← / →', action: 'Move & Sprint' },
    { key: 'W / Space / ↑', action: 'Jump & Double Jump' },
    { key: 'J / Z', action: '3-Hit Katana Combo' },
    { key: 'Q / U', action: 'Throw Katana Tether' },
    { key: 'E / F', action: 'Warp to Katana' },
    { key: 'L / C', action: 'Parry / Weapon Redirect' },
    { key: 'Shift', action: 'Dodge Roll' },
    { key: 'ESC / P', action: 'Pause Menu / Abilities' },
    { key: 'H', action: 'Healing Gourd' },
  ],
  type: 'canvas',
  component: RoninTwilightGame,
};
