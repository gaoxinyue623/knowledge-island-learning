export interface LiteracyCharacterEntry {
  character: string
  pinyin: string
  polyphonic: boolean
  raw: string
}

export interface LiteracyTableGroup {
  heading: string
  lessonNumber: number | null
  gardenNumber: number | null
  sourceImage: number
  entries: Array<string | LiteracyCharacterEntry>
}

export interface LiteracySourcePage {
  number: number
  title: string
  url: string
  sha256: string
}

export interface LiteracyTablePresentation {
  title: string
  tableKind: 'recognition' | 'writing' | 'words'
  declaredCount: number
  entryCount: number
  polyphonicCount: number
  groups: LiteracyTableGroup[]
  sourcePages: LiteracySourcePage[]
}
