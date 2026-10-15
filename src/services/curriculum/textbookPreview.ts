import { productionCurriculumIndex } from '@/data/curriculum/production'
export function textbookDirectoryPreview(textbookId: string): string[] {
  const units = productionCurriculumIndex.units
    .filter((unit) => unit.textbookVersionId === textbookId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  return units.slice(0, 2).map((unit) => {
    const lessons = productionCurriculumIndex.lessons
      .filter((lesson) => lesson.unitId === unit.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 3)
    return `${unit.title}：${lessons.map((lesson) => lesson.title).join('、')}`
  })
}
