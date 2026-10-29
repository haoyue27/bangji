import { useState } from 'react'
import './index.css'
import { AppProvider } from './store'
import Grouping from './components/Grouping'
import NameDraw from './components/NameDraw'
import PrizeDraw from './components/PrizeDraw'
import GameDraw from './components/GameDraw'

const TABS = [
  { id: 'group', label: '班级分组' },
  { id: 'name', label: '名字抽取' },
  { id: 'prize', label: '奖品抽取' },
  { id: 'game', label: '游戏抽取' },
]

function Inner() {
  const [tab, setTab] = useState('group')
  return (
    <div className="app">
      <header className="header">
        <h1>班级抽奖与分组系统</h1>
        <nav className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={'tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>
      </header>
      <main className="container">
        {tab === 'group' && <Grouping />}
        {tab === 'name' && <NameDraw />}
        {tab === 'prize' && <PrizeDraw />}
        {tab === 'game' && <GameDraw />}
      </main>
      <footer>数据保存在浏览器本地（localStorage）。可部署为静态站点。</footer>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  )
}
