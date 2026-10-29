import { useState } from 'react'
import { useApp } from '../store'

function parseNames(text: string): string[] {
  return text.split(/[\n,，、;；\s]+/).map(s => s.trim()).filter(Boolean)
}

export default function Grouping() {
  const { students, setStudents, groups, setGroups } = useApp()
  const [text, setText] = useState(students.join('\n'))
  const [groupCount, setGroupCount] = useState(4)
  const [perGroup, setPerGroup] = useState(0)
  const [mode, setMode] = useState<'count' | 'size'>('count')
  const [drag, setDrag] = useState<{ g: number; i: number } | null>(null)

  const sync = () => setStudents(parseNames(text))

  const shuffle = () => {
    const pool = [...students]
    // Fisher-Yates
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    let groups: string[][] = []
    if (mode === 'count') {
      const n = Math.max(1, groupCount)
      groups = Array.from({ length: n }, () => [])
      pool.forEach((name, idx) => groups[idx % n].push(name))
    } else {
      const size = Math.max(1, perGroup)
      for (let i = 0; i < pool.length; i += size) {
        groups.push(pool.slice(i, i + size))
      }
    }
    setGroups(groups)
  }

  const moveName = (fromG: number, fromI: number, toG: number) => {
    const next = groups.map(g => [...g])
    const [name] = next[fromG].splice(fromI, 1)
    next[toG].push(name)
    setGroups(next)
  }

  const removeName = (g: number, i: number) => {
    const next = groups.map((grp, gi) => gi === g ? grp.filter((_, j) => j !== i) : [...grp])
    setGroups(next)
  }

  const addNameToGroup = (g: number, name: string) => {
    const next = groups.map((grp, gi) => gi === g ? [...grp, name] : [...grp])
    setGroups(next)
  }

  const exportText = () => {
    const out = groups.map((g, i) => `第${i + 1}组 (${g.length}人): ${g.join('、')}`).join('\n')
    navigator.clipboard?.writeText(out)
    alert('已复制到剪贴板')
  }

  const resetGroups = () => setGroups([])

  return (
    <div>
      <div className="card">
        <h2>学生名单</h2>
        <textarea className="input" value={text} onChange={e => setText(e.target.value)} placeholder="每行一个名字，或用逗号/空格分隔" />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={sync}>同步名单 ({parseNames(text).length}人)</button>
          <span className="muted">当前名单 {students.length} 人</span>
        </div>
        <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          {students.map((s, i) => (
            <span key={i} className="chip">{s}<span className="x" onClick={() => {
              const next = students.filter((_, j) => j !== i)
              setStudents(next); setText(next.join('\n'))
            }}>×</span></span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>分组设置</h2>
        <div className="row">
          <label><input type="radio" checked={mode === 'count'} onChange={() => setMode('count')} /> 按组数</label>
          <input type="number" min={1} value={groupCount} onChange={e => setGroupCount(+e.target.value)} disabled={mode !== 'count'} />
          <label><input type="radio" checked={mode === 'size'} onChange={() => setMode('size')} /> 按每组人数</label>
          <input type="number" min={1} value={perGroup} onChange={e => setPerGroup(+e.target.value)} disabled={mode !== 'size'} />
          <button className="btn primary" onClick={shuffle} disabled={students.length === 0}>随机分组</button>
          <button className="btn" onClick={exportText} disabled={groups.length === 0}>复制结果</button>
          <button className="btn danger" onClick={resetGroups} disabled={groups.length === 0}>清空分组</button>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>提示：可拖拽或点击名字移动到其他组；点击 × 删除。</p>
      </div>

      {groups.length > 0 && (
        <div className="card">
          <h2>分组结果 ({groups.length} 组)</h2>
          <div className="group-grid">
            {groups.map((g, gi) => (
              <div className="group-card" key={gi}
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (drag) { moveName(drag.g, drag.i, gi); setDrag(null) } }}
              >
                <h3>第 {gi + 1} 组 · {g.length} 人</h3>
                <ul>
                  {g.map((name, i) => (
                    <li key={i} draggable
                      onDragStart={() => setDrag({ g: gi, i })}
                      style={{ cursor: 'grab' }}
                    >
                      {name}
                      <span style={{ marginLeft: 8, color: 'var(--muted)', cursor: 'pointer' }} onClick={() => removeName(gi, i)}>×</span>
                    </li>
                  ))}
                </ul>
                <div className="row" style={{ marginTop: 8 }}>
                  <select className="input" onChange={e => { if (e.target.value) { addNameToGroup(gi, e.target.value); e.target.value = '' } }} defaultValue="">
                    <option value="">+ 添加成员</option>
                    {students.filter(s => !groups.flat().includes(s)).map((s, i) => (
                      <option key={i} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
