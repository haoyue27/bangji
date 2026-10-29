import { useState, useRef, useEffect } from 'react'
import { useApp } from '../store'

export default function NameDraw() {
  const { students, drawHistory, setDrawHistory } = useApp()
  const [selected, setSelected] = useState<Set<string>>(() => new Set(students))
  const [current, setCurrent] = useState<string | null>(null)
  const [rolling, setRolling] = useState(false)
  const [count, setCount] = useState(1)
  const [allowRepeat, setAllowRepeat] = useState(false)
  const [excludeDrawn, setExcludeDrawn] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const timerRef = useRef<number | null>(null)

  // keep selected in sync with students: add new, remove missing
  useEffect(() => {
    setSelected(prev => {
      const next = new Set(prev)
      students.forEach(s => next.add(s))
      Array.from(next).forEach(s => { if (!students.includes(s)) next.delete(s) })
      return next
    })
  }, [students])

  const selectedList = students.filter(s => selected.has(s))
  const available = excludeDrawn && !allowRepeat
    ? selectedList.filter(n => !drawHistory.includes(n))
    : [...selectedList]

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) { next.delete(name) } else { next.add(name) }
      return next
    })
  }
  const selectAll = () => setSelected(new Set(students))
  const selectNone = () => setSelected(new Set())

  const draw = () => {
    const avail = excludeDrawn && !allowRepeat
      ? selectedList.filter(n => !drawHistory.includes(n))
      : [...selectedList]
    if (avail.length === 0) { alert('可抽取名单为空，请先选择参与抽取的名字'); return }
    setRolling(true)
    let ticks = 0
    const maxTicks = 20
    timerRef.current = window.setInterval(() => {
      setCurrent(avail[Math.floor(Math.random() * avail.length)])
      ticks++
      if (ticks >= maxTicks) {
        if (timerRef.current) clearInterval(timerRef.current)
        const picks: string[] = []
        const used = new Set<string>()
        for (let i = 0; i < count; i++) {
          const c = avail.filter(n => allowRepeat || !used.has(n))
          if (c.length === 0) break
          const pick = c[Math.floor(Math.random() * c.length)]
          picks.push(pick)
          used.add(pick)
        }
        const result = picks.join('、')
        setCurrent(result)
        setRolling(false)
        setDrawHistory([...drawHistory, ...picks])
      }
    }, 80)
  }

  const stopRoll = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRolling(false)
  }

  const undoLast = () => {
    if (drawHistory.length === 0) return
    const next = drawHistory.slice(0, -1)
    setDrawHistory(next)
    setCurrent(null)
  }

  const resetHistory = () => { setDrawHistory([]); setCurrent(null) }

  const confirmEdit = () => {
    if (current !== null) {
      setCurrent(editValue)
      if (drawHistory.length > 0) {
        const next = [...drawHistory]
        next[next.length - 1] = editValue
        setDrawHistory(next)
      }
    }
    setEditing(false)
  }

  return (
    <div>
      <div className="card">
        <h2>抽取设置</h2>
        <div className="row">
          <label>每次抽取数量 <input type="number" min={1} value={count} onChange={e => setCount(Math.max(1, +e.target.value))} /></label>
          <label><input type="checkbox" checked={allowRepeat} onChange={e => setAllowRepeat(e.target.checked)} /> 允许重复中奖</label>
          <label><input type="checkbox" checked={excludeDrawn} onChange={e => setExcludeDrawn(e.target.checked)} /> 排除已抽中</label>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="muted">已选 {selectedList.length} 人 / 可抽 {available.length} 人 / 总名单 {students.length} 人</span>
        </div>
      </div>

      <div className="card">
        <div className="draw-display">
          {rolling ? <div className="draw-name shake">{current}</div> : (current ? <div className="draw-name pop">{current}</div> : <div className="draw-sub">点击「开始抽取」</div>)}
          {!rolling && current && <div className="draw-sub">已记录到历史</div>}
        </div>
        <div className="row" style={{ marginTop: 12, justifyContent: 'center' }}>
          <button className="btn primary" onClick={draw} disabled={rolling || available.length === 0}>开始抽取</button>
          <button className="btn" onClick={stopRoll} disabled={!rolling}>停止</button>
          <button className="btn" onClick={() => { setEditing(true); setEditValue(current || '') }} disabled={!current || rolling}>修改结果</button>
          <button className="btn" onClick={undoLast} disabled={drawHistory.length === 0}>撤销上次</button>
          <button className="btn danger" onClick={resetHistory}>重置历史</button>
        </div>
        {editing && (
          <div className="row" style={{ marginTop: 8, justifyContent: 'center' }}>
            <input className="input" value={editValue} onChange={e => setEditValue(e.target.value)} />
            <button className="btn success" onClick={confirmEdit}>确认</button>
            <button className="btn" onClick={() => setEditing(false)}>取消</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>选择参与抽取的名字（从总名单）</h2>
        <div className="row" style={{ marginBottom: 8 }}>
          <button className="btn" onClick={selectAll}>全选</button>
          <button className="btn" onClick={selectNone}>全不选</button>
          <span className="muted">已选 {selectedList.length} / {students.length}</span>
        </div>
        {students.length === 0 ? <div className="empty">总名单为空，请先在「班级分组」中同步名单</div> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {students.map((s, i) => (
              <label key={i} className="chip" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(s)} onChange={() => toggle(s)} />
                {s}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>抽取历史 ({drawHistory.length})</h2>
        {drawHistory.length === 0 ? <div className="empty">暂无记录</div> : (
          <ol className="history">
            {drawHistory.map((n, i) => <li key={i}>{i + 1}. {n}</li>)}
          </ol>
        )}
      </div>
    </div>
  )
}
