import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  G4_SHANGHAI_ENGLISH_S2_DIRECTORY_SOURCE_ID,
  gradeFourEnglishLowerDirectoryCorrection as directory,
  gradeFourEnglishLowerDefinitions as definitions,
  gradeFourEnglishLowerCurriculum as curriculum,
  gradeFourEnglishLowerProjectIds as readingOnlyIds,
  gradeFourEnglishLowerSource as original,
} from '@/data/curriculum/grade-4/english-shanghai-lower-2022'
import { buildLearningContentFromCourseContent } from '@/services/lesson-player/lessonContentRepository'
import { buildEnglishReadingSegments } from '@/services/lesson-player/englishReading'
import type { LessonContentBlockViewModel } from '@/types'

describe('grade four lower English contents corrected from the two supplied images', () => {
  it('preserves both image files with matching evidence hashes', () => {
    expect(directory.images).toHaveLength(2)
    for (const image of directory.images)
      expect(createHash('sha256').update(readFileSync(image.path)).digest('hex')).toBe(image.sha256)
  })

  it('transcribes every Communicate and Extend title in the correct unit', () => {
    expect(
      directory.units.map((unit) => [
        unit.communicate.listening,
        unit.communicate.speaking,
        unit.communicate.writing,
        unit.extend.reading,
      ]),
    ).toEqual([
      [
        'Uncle Li’s daily schedule',
        'My English teacher’s daily schedule',
        'About your English teacher’s daily schedule',
        'Jiajia needs a schedule',
      ],
      [
        'A dog at a training school',
        'Students’ favourite days at school',
        'An email about your favourite day',
        'Come and join us!',
      ],
      [
        'A chat show about jobs',
        'Students’ dream jobs',
        'About a family member at work',
        'At the fire station',
      ],
      [
        'An introduction to a band',
        'Our concerts',
        'About a musical instrument',
        'Different musical instruments',
      ],
      [
        'Making art',
        'Making art with shapes',
        'A chat about Jim’s artwork',
        'The world of paper-cuts',
      ],
      [
        'Wu Wei’s online friends',
        'People’s activities',
        'About your family’s busy time',
        'Keeping up with time',
      ],
      [
        'Things that change',
        'Making food mixture',
        'About your favourite food mixture',
        'What is our world made of?',
      ],
      [
        'Getting along with family members',
        'Borrowing things',
        'About a helpful / polite / ... friend',
        'Act like a team!',
      ],
    ])
    expect(directory.units.map((unit) => unit.explore.reading)).toEqual([
      'Li Ming’s and Li Liang’s day',
      'We all like our school!',
      'A dentist comes to school!',
      'Let’s make music!',
      'Shapes in art',
      'What time is it?',
      'Let’s make ice cream!',
      'Poems about being polite',
    ])
    expect(directory.units.map((unit) => unit.explore.sounds)).toEqual([
      'pl, bl',
      'fl, cl',
      'br',
      'cr, gr',
      'sp, st',
      'tr, dr',
      'fr',
      '',
    ])
    expect(directory.units[7].explore).toMatchObject({
      intonation: 'Intonation',
      grammar: 'Review',
    })
    expect(directory.units.every((unit) => unit.extend.optional)).toBe(true)
    for (const unit of directory.units) {
      const old = original.units.find((item) => item.number === unit.number)!
      expect(unit.getReady.words).toEqual(old.words.map((word) => word.english))
      expect(unit.title).toBe(old.title)
      expect(unit.page).toBe(1 + (unit.number - 1) * 10)
    }
  })

  it('places the complete official directory before supplemental material while keeping existing IDs', () => {
    expect(definitions.slice(0, 12).map((unit) => [unit.number, unit.title, unit.page])).toEqual([
      ...directory.units.map((unit) => [unit.number, unit.title, unit.page]),
      [9, 'Project 1', 81],
      [10, 'Project 2', 83],
      [14, 'Unit checklist', 85],
      [15, 'Word list', 86],
    ])
    expect(definitions.slice(12).map((unit) => unit.number)).toEqual([11, 12, 13])
    expect(curriculum.units.map((unit) => unit.sortOrder)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    )
    for (const number of [9, 10, 14, 15]) {
      const entry = definitions.find((unit) => unit.number === number)!
      expect(entry.knowledgePointId).toBe(
        `G4_SHANGHAI_ENGLISH_S2_KP_${String(number).padStart(2, '0')}`,
      )
      expect(readingOnlyIds).toContain(entry.knowledgePointId)
      expect(entry.questions).toHaveLength(0)
    }
    for (const number of [14, 15]) {
      const entry = definitions.find((unit) => unit.number === number)!
      const content = curriculum.courseContents.find(
        (item) => item.knowledgePointId === entry.knowledgePointId,
      )!
      expect(content.sourceId).toBe(G4_SHANGHAI_ENGLISH_S2_DIRECTORY_SOURCE_ID)
      expect(content.body.suppliedPage).toBe(number === 14 ? 85 : 86)
    }
  })

  it('renders the directory alongside the existing bilingual readings, without speaking directory titles as lesson prose', () => {
    for (const entry of definitions.filter((unit) => unit.kind === 'unit')) {
      const content = curriculum.courseContents.find(
        (item) => item.knowledgePointId === entry.knowledgePointId,
      )!
      const lesson = buildLearningContentFromCourseContent(content)!
      const rendered = lesson.blocks.map((block) => block.block.text).join('\n')
      const row = directory.units.find((unit) => unit.number === entry.number)!
      for (const title of [...Object.values(row.communicate), row.extend.reading])
        expect(rendered).toContain(title)
      for (const section of entry.sections) {
        expect(rendered).toContain(section.english)
        expect(rendered).toContain(section.chinese)
      }
      expect(content.body.directoryOnlySections).toEqual(['Communicate', 'Extend'])
      expect(content.body.directorySourceId).toBe(G4_SHANGHAI_ENGLISH_S2_DIRECTORY_SOURCE_ID)
      const directoryBlocks: LessonContentBlockViewModel[] = lesson.blocks
        .filter((block) => block.block.text?.startsWith('目录 · '))
        .map((block) => ({
          id: block.id,
          type: block.stepType,
          content: block.block.text,
          sort: block.sort,
          isSample: false,
        }))
      expect(directoryBlocks).toHaveLength(4)
      expect(buildEnglishReadingSegments(directoryBlocks)).toEqual([])
    }
  })
})
