export type AuthoredFacing = 'left' | 'right';
export type FacingDirection = -1 | 1;

/** True when an authored sprite needs horizontal mirroring to face a direction. */
export function shouldFlipSprite(authoredFacing: AuthoredFacing, direction: FacingDirection): boolean {
  return (authoredFacing === 'right' && direction === -1) ||
    (authoredFacing === 'left' && direction === 1);
}
