import { useState } from 'react'
import { GAME_BANKS } from '../data/gameBanks'
import BankDraw from './BankDraw'

export default function GameDraw() {
  const [active, setActive] = useState(GAME_BANKS[0].key)
  const bank = GAME_BANKS.find(b => b.key === active)!
  return (
    <div>
      <div className="card">
        <h2>游戏词库抽取</h2>
        <div className="tabs" style={{ flexWrap: 'wrap' }}>
          {GAME_BANKS.map(b => (
            <button key={b.key} className={'tab' + (active === b.key ? ' active' : '')} onClick={() => setActive(b.key)}>{b.label}</button>
          ))}
        </div>
      </div>
      <BankDraw key={bank.key} bank={bank} />
    </div>
  )
}
