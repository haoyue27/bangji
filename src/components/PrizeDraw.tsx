import { useState, useEffect } from 'react'

interface Container {
  id: string
  name: string
  count: number
  pool: string[]
  drawn: string[]
}

const DEFAULT_CONTAINERS: Container[] = [
  { id: 'c1', name: '奖品一', count: 1, pool: [], drawn: [] },
  { id: 'c2', name: '奖品二', count: 3, pool: [], drawn: [] },
  { id: 'c3', name: '奖品三', count: 5, pool: [], drawn: [] },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as any
    if (Array.isArray(parsed) && parsed.length && parsed[0] && !('pool' in parsed[0])) {
      return parsed.map((c: any) => ({ ...c, pool: [] })) as T
    }
    return parsed as T
  } catch {
    return fallback
  }
}

export default function PrizeDraw() {
  const [poolInput, setPoolInput] = useState('')
  const [pool, setPool] = useState<string[]>(() => load('prizePool2', []))
  const [originalPool, setOriginalPool] = useState<string[]>(() => load('prizePoolOriginal2', []))
  const [containers, setContainers] = useState<Container[]>(() => load('prizeContainers2', DEFAULT_CONTAINERS))

  useEffect(() => { localStorage.setItem('prizePool2', JSON.stringify(pool)) }, [pool])
  useEffect(() => { localStorage.setItem('prizePoolOriginal2', JSON.stringify(originalPool)) }, [originalPool])
  useEffect(() => { localStorage.setItem('prizeContainers2', JSON.stringify(containers)) }, [containers])

  const parsePrizes = (text: string) => text.split(/[\n,，、;；]+/).map(s => s.trim()).filter(Boolean)

  const syncPool = () => {
    const items = parsePrizes(poolInput)
    setPool(items)
    setOriginalPool(items)
  }

  const addOne = (name: string) => {
    if (!name.trim()) return
    setPool(prev => [...prev, name.trim()])
    setOriginalPool(prev => [...prev, name.trim()])
    setPoolInput('')
  }

  const removeFromPool = (idx: number) => {
    setPool(prev => prev.filter((_, i) => i !== idx))
  }

  const updateContainer = (id: string, patch: Partial<{ name: string; count: number }>) => {
    setContainers(prev => prev.map(c => c.id === id ? { ...c, ...patch, count: Math.max(1, patch.count ?? c.count) } : c))
  }

  const assignToBox = (id: string, prize: string) => {
    if (!prize) return
    setPool(prev => prev.filter(p => p !== prize))
    setContainers(prev => prev.map(c => c.id === id ? { ...c, pool: [...c.pool, prize] } : c))
  }

  const unassignFromBox = (id: string, idx: number) => {
    setContainers(prev => {
      const c = prev.find(x => x.id === id)!
      const prize = c.pool[idx]
      setPool(p => [...p, prize])
      return prev.map(x => x.id === id ? { ...x, pool: x.pool.filter((_, i) => i !== idx) } : x)
    })
  }

  const drawOne = (id: string) => {
    const c = containers.find(x => x.id === id)!
    const need = Math.max(0, c.count - c.drawn.length)
    if (need === 0) { alert('该盒子已抽满'); return }
    if (c.pool.length === 0) { alert('该盒子没有可抽奖品，请先分配奖品'); return }
    const pickedIdx: number[] = []
    const remaining = c.pool.map((_, i) => i)
    for (let i = 0; i < need && remaining.length > 0; i++) {
      const r = Math.floor(Math.random() * remaining.length)
      pickedIdx.push(remaining[r])
      remaining.splice(r, 1)
    }
    const picked = pickedIdx.map(i => c.pool[i])
    const newPool = c.pool.filter((_, i) => !pickedIdx.includes(i))
    setContainers(prev => prev.map(x => x.id === id ? { ...x, pool: newPool, drawn: [...x.drawn, ...picked] } : x))
  }

  const drawAll = () => {
    setContainers(prev => {
      const next = prev.map(c => ({ ...c, pool: [...c.pool], drawn: [...c.drawn] }))
      next.forEach(c => {
        const need = Math.max(0, c.count - c.drawn.length)
        if (need === 0 || c.pool.length === 0) return
        const picked: string[] = []
        const remaining = [...c.pool]
        for (let i = 0; i < need && remaining.length > 0; i++) {
          const r = Math.floor(Math.random() * remaining.length)
          picked.push(remaining[r])
          remaining.splice(r, 1)
        }
        c.pool = c.pool.filter(p => !picked.includes(p))
        c.drawn = [...c.drawn, ...picked]
      })
      return next
    })
  }

  const resetContainer = (id: string) => {
    setContainers(prev => prev.map(c => {
      if (c.id !== id) return c
      return { ...c, pool: [...c.pool, ...c.drawn], drawn: [] }
    }))
  }

  const resetAll = () => {
    setContainers(prev => prev.map(c => ({ ...c, pool: [...c.pool, ...c.drawn], drawn: [] })))
  }

  const removeDrawn = (id: string, idx: number) => {
    setContainers(prev => prev.map(c => {
      if (c.id !== id) return c
      const item = c.drawn[idx]
      return { ...c, pool: [...c.pool, item], drawn: c.drawn.filter((_, i) => i !== idx) }
    }))
  }

  const exportResults = () => {
    const out = [
      '总奖品库剩余: ' + pool.join('、'),
      ...containers.map(c => c.name + ' (' + c.drawn.length + '/' + c.count + '): ' + c.drawn.join('、')),
      ...containers.map(c => c.name + ' 盒内剩余: ' + c.pool.join('、')),
    ].join('\n')
    navigator.clipboard?.writeText(out)
    alert('已复制到剪贴板')
  }

  const restoreOriginal = () => {
    setPool([...originalPool])
    setContainers(prev => prev.map(c => ({ ...c, pool: [], drawn: [] })))
  }

  return (
    <div>
      <div className="card">
        <h2>总奖品库（添加奖品）</h2>
        <div className="row" style={{ marginBottom: 8 }}>
          <input className="input flex1" placeholder="输入奖品名称，回车或点击添加" value={poolInput}
            onChange={e => setPoolInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOne(poolInput) } }} />
          <button className="btn" onClick={() => addOne(poolInput)}>添加</button>
        </div>
        <textarea className="input" placeholder="批量导入：每行或逗号分隔奖品名称" value={poolInput} onChange={e => setPoolInput(e.target.value)} style={{ minHeight: 60 }} />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={syncPool}>从文本批量导入</button>
          <span className="muted">总奖品库 {pool.length} 件（原始 {originalPool.length} 件）</span>
          <button className="btn" onClick={restoreOriginal}>重置奖品库</button>
        </div>
        <div style={{ marginTop: 8 }}>
          {pool.map((p, i) => (
            <span key={i} className="chip">{p}<span className="x" onClick={() => removeFromPool(i)}>×</span></span>
          ))}
          {pool.length === 0 && <div className="empty">总奖品库为空，请添加奖品</div>}
        </div>
        <p className="muted" style={{ marginTop: 8 }}>提示：从总奖品库选择奖品分配到下方三个盒子中，每个盒子独立抽取。</p>
      </div>

      <div className="card">
        <h2>抽取控制</h2>
        <div className="row">
          <button className="btn primary" onClick={drawAll} disabled={containers.every(c => c.pool.length === 0)}>一键抽取全部</button>
          <button className="btn" onClick={exportResults}>复制结果</button>
          <button className="btn danger" onClick={resetAll}>重置全部（奖品归盒）</button>
        </div>
      </div>

      <div className="prize-grid">
        {containers.map(c => (
          <div className="prize-card" key={c.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <input className="input" value={c.name} onChange={e => updateContainer(c.id, { name: e.target.value })} style={{ fontWeight: 700, color: 'var(--warn)' }} />
              <span className="muted">抽取数量</span>
              <input type="number" min={1} value={c.count} onChange={e => updateContainer(c.id, { count: Math.max(1, +e.target.value) })} />
            </div>

            <div className="draw-display" style={{ minHeight: 160 }}>
              {c.drawn.length ? <div className="draw-name pop" style={{ fontSize: 36 }}>{c.drawn[c.drawn.length - 1]}</div> : <div className="draw-sub">未抽取</div>}
            </div>

            <div className="row">
              <button className="btn primary" onClick={() => drawOne(c.id)} disabled={c.pool.length === 0}>抽取</button>
              <button className="btn danger" onClick={() => resetContainer(c.id)}>重置</button>
              <span className="muted">{c.drawn.length}/{c.count} · 盒内 {c.pool.length} 件</span>
            </div>

            <div style={{ marginTop: 8 }}>
              <div className="muted" style={{ marginBottom: 4 }}>盒子内奖品（可自定义选择）：</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {c.pool.map((p, i) => (
                  <span key={i} className="chip">{p}<span className="x" onClick={() => unassignFromBox(c.id, i)}>×</span></span>
                ))}
                {c.pool.length === 0 && <div className="empty" style={{ background: 'transparent', border: 'none' }}>未分配奖品</div>}
              </div>
              {pool.length > 0 && (
                <select className="input" defaultValue="" onChange={e => { if (e.target.value) { assignToBox(c.id, e.target.value); e.target.value = '' } }}>
                  <option value="">+ 从总奖品库添加到此盒</option>
                  {pool.map((p, i) => <option key={i} value={p}>{p}</option>)}
                </select>
              )}
            </div>

            <ul className="prize-list">
              {c.drawn.map((w, i) => (
                <li key={i} className="won">
                  <span>{i + 1}. {w}</span>
                  <span className="x" style={{ cursor: 'pointer', color: 'var(--muted)' }} onClick={() => removeDrawn(c.id, i)}>×</span>
                </li>
              ))}
              {c.drawn.length === 0 && <li className="empty" style={{ background: 'transparent', border: 'none' }}>暂无已抽中</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
