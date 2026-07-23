import type { HuskyMotionState } from '../core/dog/husky-motion';

export type HuskyAnimationState = HuskyMotionState;

export interface HuskyAnimationDefinition {
  readonly key: HuskyAnimationState;
  readonly frames: readonly string[];
  readonly frameRate: number;
  readonly repeat: number;
}

export interface HuskySpriteDefinition {
  readonly characterId: 'alaska-husky';
  readonly textureKey: 'alaska-husky';
  readonly imagePath: string;
  readonly atlasPath: string;
  readonly previewPath: string;
  readonly canonicalFacing: 'right';
  readonly contactAnchor: Readonly<{ x: number; y: number }>;
  readonly animations: readonly HuskyAnimationDefinition[];
}

export const huskySprite: HuskySpriteDefinition = {
  characterId: 'alaska-husky',
  textureKey: 'alaska-husky',
  imagePath: 'assets/characters/alaska-husky/atlas.png',
  atlasPath: 'assets/characters/alaska-husky/atlas.json',
  previewPath: 'assets/characters/alaska-husky/preview.png',
  canonicalFacing: 'right',
  contactAnchor: { x: 0.5, y: 0.875 },
  animations: [
    { key: 'idle', frames: ['idle/0'], frameRate: 1, repeat: -1 },
    { key: 'sniff', frames: ['sniff/0'], frameRate: 1, repeat: -1 },
    { key: 'searchWalk', frames: ['search-walk/0', 'search-walk/1'], frameRate: 5, repeat: -1 },
    { key: 'searchTrot', frames: ['search-trot/0', 'search-trot/1'], frameRate: 7, repeat: -1 },
    { key: 'run', frames: ['run/0', 'run/1'], frameRate: 9, repeat: -1 },
    { key: 'slowCautious', frames: ['slow-cautious/0'], frameRate: 1, repeat: -1 },
    { key: 'alert', frames: ['alert/0'], frameRate: 1, repeat: -1 },
    { key: 'lookHiddenBird', frames: ['look-hidden-bird/0'], frameRate: 1, repeat: -1 },
    { key: 'boundCover', frames: ['bound-cover/0'], frameRate: 1, repeat: -1 },
    { key: 'flushReaction', frames: ['flush-reaction/0'], frameRate: 1, repeat: -1 },
    { key: 'stopWatch', frames: ['stop-watch/0'], frameRate: 1, repeat: -1 },
    { key: 'celebrate', frames: ['celebrate/0'], frameRate: 1, repeat: -1 },
    { key: 'turnTransition', frames: ['turn-transition/0'], frameRate: 1, repeat: 0 },
  ],
} as const;

export const huskyAnimationByState = new Map(huskySprite.animations.map((animation) => [animation.key, animation]));
