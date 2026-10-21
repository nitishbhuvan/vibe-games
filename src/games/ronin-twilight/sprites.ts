// ============================================================================
// sprites.ts - High-Definition Pixel Art Asset Loader & Manager
// Loads real high-definition pixel art assets extracted from the user's reference images:
// - Samurai (Image 1): Spiky ponytail, white headband, white kimono, red sash, navy hakama, katana
// - Twilight Arena (Image 2): Pagoda, torii gate, gnarled pines, broken arches, lanterns
// - Shadow Realm Background, Dialogue Portraits, and Enemies
// ============================================================================

export interface HDSpriteAssets {
  // Backgrounds
  bgPhysical: HTMLImageElement;
  bgShadow: HTMLImageElement;

  // Dialogue Portraits
  portraits: {
    takeshi: HTMLImageElement;
    yumi: HTMLImageElement;
    kenji: HTMLImageElement;
    hana: HTMLImageElement;
    jin: HTMLImageElement;
  };

  // High-Definition Character Sprites
  samuraiIdle: HTMLImageElement;
  samuraiRun: HTMLImageElement;
  samuraiJump: HTMLImageElement;
  samuraiSlash: HTMLImageElement;
  samuraiParry: HTMLImageElement;
  samuraiIai: HTMLImageElement;

  // High-Definition Enemy Sprites
  ninja: HTMLImageElement;
  spearman: HTMLImageElement;

  isLoaded: boolean;
}

export type SpriteCache = any;
export class PixelArtGen {}

export class AssetManager {
  private static instance: AssetManager | null = null;
  public assets: HDSpriteAssets;
  private loadPromise: Promise<void> | null = null;

  private constructor() {
    const p = '/games/ronin';

    this.assets = {
      bgPhysical: new Image(),
      bgShadow: new Image(),
      portraits: {
        takeshi: new Image(),
        yumi: new Image(),
        kenji: new Image(),
        hana: new Image(),
        jin: new Image(),
      },
      samuraiIdle: new Image(),
      samuraiRun: new Image(),
      samuraiJump: new Image(),
      samuraiSlash: new Image(),
      samuraiParry: new Image(),
      samuraiIai: new Image(),
      ninja: new Image(),
      spearman: new Image(),
      isLoaded: false,
    };

    this.loadPromise = this.preload(p);
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  private preload(p: string): Promise<void> {
    const list: { img: HTMLImageElement; src: string }[] = [
      { img: this.assets.bgPhysical, src: `${p}/twilight_bg.png` },
      { img: this.assets.bgShadow, src: `${p}/shadow_realm_bg.png` },
      { img: this.assets.portraits.takeshi, src: `${p}/portrait_takeshi.png` },
      { img: this.assets.portraits.yumi, src: `${p}/portrait_yumi.png` },
      { img: this.assets.portraits.kenji, src: `${p}/portrait_kenji.png` },
      { img: this.assets.portraits.hana, src: `${p}/portrait_hana.png` },
      { img: this.assets.portraits.jin, src: `${p}/samurai_idle.png` },
      { img: this.assets.samuraiIdle, src: `${p}/samurai_idle.png` },
      { img: this.assets.samuraiRun, src: `${p}/samurai_run.png` },
      { img: this.assets.samuraiJump, src: `${p}/samurai_jump.png` },
      { img: this.assets.samuraiSlash, src: `${p}/samurai_slash.png` },
      { img: this.assets.samuraiParry, src: `${p}/samurai_parry.png` },
      { img: this.assets.samuraiIai, src: `${p}/samurai_iai.png` },
      { img: this.assets.ninja, src: `${p}/ninja_idle.png` },
      { img: this.assets.spearman, src: `${p}/spearman_idle.png` },
    ];

    const promises = list.map(({ img, src }) => {
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Fallback for image ${src}`);
          resolve();
        };
        img.src = src;
      });
    });

    return Promise.all(promises).then(() => {
      this.assets.isLoaded = true;
    });
  }

  public async ready(): Promise<HDSpriteAssets> {
    if (this.loadPromise) {
      await this.loadPromise;
    }
    return this.assets;
  }
}
