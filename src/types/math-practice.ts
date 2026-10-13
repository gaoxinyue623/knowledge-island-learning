export type MathPracticeDiagram =
  | { kind: 'net' }
  | { kind: 'viewpoints' }
  | { kind: 'tangram' }
  | { kind: 'compass-turn'; start: number; quarterTurns: number }
  | {
      kind: 'rectangle' | 'parallelogram' | 'triangle' | 'trapezoid'
      width: number
      height: number
      top?: number
      unit: string
    }
  | { kind: 'circle'; radius: number; outer?: number; unit: string }
  | {
      kind: 'solid'
      shape: 'cuboid' | 'cylinder' | 'cone'
      a: number
      b: number
      c: number
      baseArea?: number
      unit: string
    }
  | { kind: 'bars' | 'line'; labels: string[]; values: number[]; second?: number[]; unit: string }
  | { kind: 'fraction'; parts: number; shaded: number; circular?: boolean }
  | { kind: 'ruler'; start: number; end: number; max: number }
  | { kind: 'clock'; hour: number; minute: number }
  | { kind: 'grid'; columns: number; rows: number; marked?: [number, number][]; labels?: boolean }
  | { kind: 'angle'; degrees: number }
  | { kind: 'route'; first: number; second: number; unit: string }
  | { kind: 'cubes'; heights: number[] }
  | { kind: 'cards'; labels: string[]; caption: string }
  | { kind: 'motion'; mode: 'translation' | 'rotation' | 'reflection' }

export interface MathPracticeItem {
  prompt: string
  answer: number | string
  explanation: string
  distractors?: string[]
  diagram?: MathPracticeDiagram
}
