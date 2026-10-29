export interface GameBank {
  key: string
  label: string
  items: string[]
}

export const GAME_BANKS: GameBank[] = [
  { key: 'pictionary', label: '你画我猜词库抽取', items: [] },
  { key: 'undercover', label: '谁是卧底词库抽取', items: [] },
  { key: 'song', label: '听歌识曲名单抽取', items: [] },
  { key: 'emoji', label: 'emoji成语抽取', items: [] },
]
