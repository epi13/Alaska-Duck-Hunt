export interface ShotResult {
  role: 'target' | 'non-target' | 'protected' | 'miss';
  basePoints?: number;
  reactionMs?: number;
  distance?: number;
  cleanHit?: boolean;
}

export interface ScoreState {
  score: number;
  combo: number;
  bestCombo: number;
  shots: number;
  validHits: number;
  penalties: number;
}

export const initialScore = (): ScoreState => ({ score: 0, combo: 0, bestCombo: 0, shots: 0, validHits: 0, penalties: 0 });

export function applyShot(state: ScoreState, result: ShotResult): ScoreState {
  if (result.role !== 'target') {
    const penalty = result.role === 'protected' ? 1_500 : result.role === 'non-target' ? 500 : 50;
    return { ...state, score: Math.max(0, state.score - penalty), combo: 0, shots: state.shots + 1, penalties: state.penalties + penalty };
  }
  const combo = state.combo + 1;
  const reactionBonus = Math.max(0, 500 - Math.floor((result.reactionMs ?? 1_500) / 4));
  const distanceBonus = Math.round(Math.max(0, Math.min(1, result.distance ?? 0)) * 400);
  const cleanBonus = result.cleanHit ? 250 : 0;
  const multiplier = 1 + Math.min(2, Math.floor((combo - 1) / 3) * 0.25);
  const earned = Math.round(((result.basePoints ?? 500) + reactionBonus + distanceBonus + cleanBonus) * multiplier);
  return { ...state, score: state.score + earned, combo, bestCombo: Math.max(state.bestCombo, combo), shots: state.shots + 1, validHits: state.validHits + 1 };
}

export const accuracy = (state: Pick<ScoreState, 'shots' | 'validHits'>): number =>
  state.shots === 0 ? 0 : state.validHits / state.shots;
