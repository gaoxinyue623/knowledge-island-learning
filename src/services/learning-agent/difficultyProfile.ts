/** Evaluation profiles restrict the existing one-step arithmetic surface, never widen curriculum. */
export function difficultyProfile(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('DIFFICULTY_RANGE')
  return value < 0.3
    ? { level: 'LOW', minLargestOperand: 1, maxLargestOperand: 19 }
    : value < 0.5
      ? { level: 'MEDIUM', minLargestOperand: 20, maxLargestOperand: 49 }
      : value < 0.7
        ? { level: 'UPPER', minLargestOperand: 50, maxLargestOperand: 79 }
        : { level: 'HIGH', minLargestOperand: 80, maxLargestOperand: 99 }
}
