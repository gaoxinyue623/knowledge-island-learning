import {
  petCompanions,
  petDecorations,
  petFoods,
  type PetCommand,
  type PetEvent,
  type PetSourceKind,
} from './petPolicy'
export const petSourceLabels: Record<PetSourceKind, string> = {
  lesson: '课程完成',
  assessment: '练习完成',
  mastery: '知识掌握',
  review: '复习完成',
  correction: '错题解决',
  thinking: '思维训练',
  quest: '阅读与课后闯关',
}
export function describePetEvent(event: PetEvent): string {
  if (event.kind === 'credit') return event.title
  if (event.kind === 'adopt' || event.kind === 'collect') return `领养了${event.name}`
  if (event.kind === 'rename' || event.kind === 'name-pet') return `改名为${event.name}`
  if (event.kind === 'select')
    return `切换到${petCompanions.find((p) => p.id === event.petId)!.name}`
  if (event.kind === 'decorate-clear') return `收起${event.slot === 'landscape' ? '背景' : '摆件'}`
  if ('decorationId' in event)
    return `${event.kind === 'decorate-buy' ? '兑换' : '布置'}${petDecorations.find((d) => d.id === event.decorationId)!.name}`
  return `${event.kind === 'buy' ? '兑换' : '喂食'}${petFoods.find((f) => f.id === event.foodId)!.name}${'petId' in event ? ` · ${petCompanions.find((p) => p.id === event.petId)!.name}` : ''}`
}
export function petEventAmount(event: PetEvent): string {
  if (event.kind === 'credit')
    return event.amount
      ? `+${event.amount} 积分${event.amount < event.requested ? '（达到当日上限）' : ''}`
      : '当日额度已用完'
  if (event.kind === 'buy') return `−${petFoods.find((f) => f.id === event.foodId)!.cost} 积分`
  if (event.kind === 'feed' || event.kind === 'feed-pet')
    return `+${petFoods.find((f) => f.id === event.foodId)!.experience} 宠物经验`
  if (event.kind === 'collect')
    return `−${petCompanions.find((p) => p.id === event.petId)!.cost} 积分`
  if (event.kind === 'decorate-buy')
    return `−${petDecorations.find((d) => d.id === event.decorationId)!.cost} 积分`
  return '伙伴纪念'
}
export function petCommandMessage(command: PetCommand): string {
  if (command.kind === 'feed' || command.kind === 'feed-pet')
    return '吃得香香的！这位伙伴的经验已增加。'
  if (command.kind === 'buy') return '兑换成功，食物已经放进背包。'
  if (command.kind === 'adopt' || command.kind === 'collect')
    return '我们成为伙伴啦！一起慢慢长大。'
  if (command.kind === 'select') return '伙伴已切换，食物会喂给当前伙伴。'
  if (command.kind === 'decorate-buy') return '装饰已放入收藏，点击布置即可使用。'
  if (command.kind === 'decorate-equip' || command.kind === 'decorate-clear')
    return '家园布置已保存。'
  return '新名字已经记好啦。'
}
