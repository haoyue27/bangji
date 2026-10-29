import { useState, useRef, useEffect } from 'react'
import mammoth from 'mammoth'
import type { GameBank } from '../data/gameBanks'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export default function BankDraw({ bank }: { bank: GameBank }) {
  const storageKey = 'gamedraw6_' + bank.key
  const [pool, setPool] = useState<string[]>(() => load(storageKey + '_pool', bank.items))
  const [originalPool, setOriginalPool] = useState<string[]>(() => load(storageKey + '_orig', bank.items))
  const [history, setHistory] = useState<string[]>(() => load(storageKey + '_hist', []))
  const [current, setCurrent] = useState<string | null>(null)
  const [rolling, setRolling] = useState(false)
  const [count, setCount] = useState(1)
  const [excludeDrawn, setExcludeDrawn] = useState(true)
  const [poolInput, setPoolInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [cleanMsg, setCleanMsg] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [editValue, setEditValue] = useState('')
  const timerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { localStorage.setItem(storageKey + '_pool', JSON.stringify(pool)) }, [pool, storageKey])
  useEffect(() => { localStorage.setItem(storageKey + '_orig', JSON.stringify(originalPool)) }, [originalPool, storageKey])
  useEffect(() => { localStorage.setItem(storageKey + '_hist', JSON.stringify(history)) }, [history, storageKey])

  const parseItems = (text: string) => text.split(/[\n,，、;；]+/).map(s => s.trim()).filter(Boolean)
  const parseEmojiLine = (line: string) => {
    if (bank.key !== 'emoji') return line
    const t = line.replace(/\t+/g, ' ').trim()
    // 已有分隔符
    const eqIdx = t.indexOf('=')
    if (eqIdx > 0 && eqIdx < t.length - 1) {
      const left = t.slice(0, eqIdx).trim()
      const right = t.slice(eqIdx + 1).trim()
      if (/[\p{Emoji}\p{Extended_Pictographic}]/u.test(left) && /[\u4e00-\u9fff]/.test(right)) return left + '=' + right
    }
    // 按首个中文字符拆分（emoji 部分可能含数字/键帽）
    const cm = t.match(/[\u4e00-\u9fff]/)
    if (cm && cm.index !== undefined && cm.index > 0) {
      const emoji = t.slice(0, cm.index).trim().replace(/[:=：\s]+$/, '')
      const idiom = t.slice(cm.index).trim()
      if (emoji && /[\p{Emoji}\p{Extended_Pictographic}]/u.test(emoji)) return emoji + '=' + idiom
    }
    // 兜底：前导 emoji
    const emojiRe = /[\p{Emoji}\p{Extended_Pictographic}\u200d\ufe0f]/u
    let i = 0
    const chars = Array.from(t)
    while (i < chars.length && emojiRe.test(chars[i])) i++
    if (i > 0 && i < chars.length) {
      const emoji = chars.slice(0, i).join('').trim()
      const rest = chars.slice(i).join('').trim().replace(/^[:=：\s]+/, '')
      if (rest) return emoji + '=' + rest
    }
    return t
  }
  const pairEmojiLines = (lines: string[]) => {
    if (bank.key !== 'emoji') return lines
    const isEmojiOnly = (s: string) => !/[\u4e00-\u9fff]/.test(s) && /[\p{Emoji}\p{Extended_Pictographic}]/u.test(s)
    const out: string[] = []
    let i = 0
    while (i < lines.length) {
      const line = (lines[i] || '').trim()
      if (!line) { i++; continue }
      if (line.includes('=') && /[\u4e00-\u9fff]/.test(line)) { out.push(line); i++; continue }
      if (isEmojiOnly(line) && i + 1 < lines.length) {
        const next = (lines[i + 1] || '').trim()
        if (next && /[\u4e00-\u9fff]/.test(next)) {
          out.push(line + '=' + next)
          i += 2
          continue
        }
      }
      out.push(parseEmojiLine(line))
      i++
    }
    return out
  }
  const pairUndercoverLines = (lines: string[]) => {
    if (bank.key !== 'undercover') return lines
    const out: string[] = []
    let i = 0
    while (i < lines.length) {
      const line = (lines[i] || '').trim()
      if (!line) { i++; continue }
      // 已是完整词对，直接保留
      if (line.includes('/') || /卧底/.test(line) || /平民/.test(line)) { out.push(line); i++; continue }
      const next = (lines[i + 1] || '').trim()
      if (next && !(next.includes('/') || /卧底/.test(next) || /平民/.test(next))) {
        out.push('平民: ' + line + ' / 卧底: ' + next)
        i += 2
        continue
      }
      out.push(line)
      i++
    }
    return out
  }
  const isNonContent = (s: string) => {
    if (!s) return true
    const t = s.trim()
    // 纯编号/标题行
    if (/^(第\s*\d+\s*[题問章节部分]?|\d+[、.．)]?|[一二三四五六七八九十]+[、.．)]?|（[一二三四五六七八九十\d]+）)$/u.test(t)) return true
    // 答案/解析/提示等
    if (/^(答案|解析|提示|注|说明|备注|题解|参考答案)/u.test(t)) return true
    if (/(答案|解析|提示|注解|说明)\s*[:：]/u.test(t)) return true
    // 仅标题性短语
    if (/^(题目|题干|材料|阅读|短文)$/u.test(t)) return true
    return false
  }
  const cleanItems = (items: string[]) => {
    const seen = new Set<string>()
    const invalidRe = /^[\s\d.,!?;:，。！？；：、…—\-()（）\[\]【】]+$/
    return items.map(s => s.trim()).filter(s => {
      if (!s) return false
      try {
        if (invalidRe.test(s)) return false
      } catch (e) {
        console.error('clean regex failed', e)
      }
      if (isNonContent(s)) return false
      if (seen.has(s)) return false
      seen.add(s)
      return true
    })
  }

  const syncPool = () => {
    let items = cleanItems(pairUndercoverLines(pairEmojiLines(parseItems(poolInput))).map(parseEmojiLine))
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
  const handleDocxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const text = result.value || ''
      const rawItems = text.split(/\n+/).map(s => s.trim()).filter(Boolean)
      let items = cleanItems(pairUndercoverLines(pairEmojiLines(rawItems)).map(parseEmojiLine))
      if (items.length === 0) { return }
      setPool(prev => [...prev, ...items])
      setOriginalPool(prev => [...prev, ...items])
      setCleanMsg('Word 导入完成：原文 ' + rawItems.length + ' 行，保留 ' + items.length + ' 条')
    } catch (err) {
      console.error(err)
      alert('导入失败：' + (err as Error).message)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  const restoreOriginal = () => {
    setPool([...originalPool.length ? originalPool : bank.items])
    if (originalPool.length === 0) setOriginalPool(bank.items)
    setHistory([])
    setCurrent(null)
  }

  const available = excludeDrawn ? pool.filter(n => !history.includes(n)) : [...pool]

  const draw = () => {
    const avail = excludeDrawn ? pool.filter(n => !history.includes(n)) : [...pool]
    if (avail.length === 0) { alert('可抽取内容为空'); return }
    setRolling(true)
    let ticks = 0
    const maxTicks = 18
    timerRef.current = window.setInterval(() => {
      setCurrent(avail[Math.floor(Math.random() * avail.length)])
      ticks++
      if (ticks >= maxTicks) {
        if (timerRef.current) clearInterval(timerRef.current)
        const picks: string[] = []
        const used = new Set<string>()
        for (let i = 0; i < count; i++) {
          const c = avail.filter(n => !used.has(n))
          if (c.length === 0) break
          const pick = c[Math.floor(Math.random() * c.length)]
          picks.push(pick)
          used.add(pick)
        }
        setCurrent(picks.join('\n---\n'))
        setShowAnswer(false)
        setRolling(false)
        setHistory(prev => [...prev, ...picks])
      }
    }, 90)
  }

  const stopRoll = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRolling(false)
  }
  const undoLast = () => {
    if (history.length === 0) return
    setHistory(prev => prev.slice(0, -1))
    setCurrent(null)
  }
  const resetHistory = () => { setHistory([]); setCurrent(null) }
  const confirmEdit = () => {
    if (current !== null) {
      setCurrent(editValue)
      if (history.length > 0) {
        const next = [...history]
        next[next.length - 1] = editValue
        setHistory(next)
      }
    }
    setEditing(false)
  }
  const removeHistory = (idx: number) => {
    const item = history[idx]
    setPool(prev => [...prev, item])
    setHistory(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div className="card">
        <h2>{bank.label} - 抽取设置</h2>
        <div className="row">
          <label>每次抽取数量 <input type="number" min={1} value={count} onChange={e => setCount(Math.max(1, +e.target.value))} /></label>
          <label><input type="checkbox" checked={excludeDrawn} onChange={e => setExcludeDrawn(e.target.checked)} /> 排除已抽中</label>
          <span className="muted">可抽 {available.length} / 总 {pool.length} / 已抽 {history.length}</span>
        </div>
      </div>

      <div className="card">
        <div className="draw-display" style={{ minHeight: 440, whiteSpace: 'pre-wrap' }}>
          {rolling ? <div className="draw-name shake" style={{ fontSize: 40 }}>{bank.key === 'emoji' ? (current || '').split('\n---\n').map(s => s.split('=')[0].trim()).join('  /  ') : current}</div> :
            (current ? <div className="draw-name pop" style={{ fontSize: 40 }}>{bank.key === 'emoji' ? (current || '').split('\n---\n').map(s => s.split('=')[0].trim()).join('  /  ') : current}</div> : <div className="draw-sub">点击「开始抽取」</div>)}
          {!rolling && current && bank.key === 'emoji' && showAnswer && (
            <div className="draw-sub" style={{ fontSize: 20, color: 'var(--good)', marginTop: 8 }}>
              答案：{(current || '').split('\n---\n').map(s => s.split('=').slice(1).join('=').trim()).join('  /  ')}
            </div>
          )}
          {!rolling && current && <div className="draw-sub">已记录到历史（可修改）</div>}
        </div>
        <div className="row" style={{ marginTop: 12, justifyContent: 'center' }}>
          <button className="btn primary" onClick={draw} disabled={rolling || available.length === 0}>开始抽取</button>
          <button className="btn" onClick={stopRoll} disabled={!rolling}>停止</button>
          {bank.key === 'emoji' && <button className="btn success" onClick={() => setShowAnswer(v => !v)} disabled={!current || rolling}>{showAnswer ? '隐藏答案' : '显示答案'}</button>}
          <button className="btn" onClick={() => { setEditing(true); setEditValue(current || '') }} disabled={!current || rolling}>修改结果</button>
          <button className="btn" onClick={undoLast} disabled={history.length === 0}>撤销上次</button>
          <button className="btn danger" onClick={resetHistory}>重置历史</button>
        </div>
        {editing && (
          <div className="row" style={{ marginTop: 8, justifyContent: 'center' }}>
            <textarea className="input" value={editValue} onChange={e => setEditValue(e.target.value)} style={{ minHeight: 60 }} />
            <button className="btn success" onClick={confirmEdit}>确认</button>
            <button className="btn" onClick={() => setEditing(false)}>取消</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>词库/题库（可修改）</h2>
        {bank.key === 'undercover' && <p className="muted">每条为一组相对词（格式：平民: 词A / 卧底: 词B），每次抽取同时给出两个词。</p>}
        <div className="row" style={{ marginBottom: 8 }}>
          <input className="input flex1" placeholder="输入条目，回车或点击添加" value={poolInput}
            onChange={e => setPoolInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOne(poolInput) } }} />
          <button className="btn" onClick={() => addOne(poolInput)}>添加</button>
        </div>
        <textarea className="input" placeholder={bank.key === 'undercover' ? '批量导入：每行一个词对，格式：平民: 苹果 / 卧底: 梨' : '批量导入：每行或逗号分隔'} value={poolInput} onChange={e => setPoolInput(e.target.value)} style={{ minHeight: 60 }} />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={syncPool}>从文本批量导入</button>
          <button className="btn" onClick={() => {
            try {
              const before = pool.length
              const cleaned = cleanItems(pool)
              setPool(cleaned)
              setOriginalPool(prev => cleanItems(prev))
              setCleanMsg('清理完成：' + before + ' -> ' + cleaned.length)
            } catch (e) {
              console.error(e)
              setCleanMsg('清理失败：' + (e as Error).message)
            }
          }}>自动清理无效/非题目行</button>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>导入Word文档(.docx)</button>
          <button className="btn" onClick={restoreOriginal}>重置为默认</button>
          <span className="muted">共 {pool.length} 条</span>
        </div>
        {cleanMsg && <p className="muted" style={{ marginTop: 6 }}>{cleanMsg}</p>}
        <input ref={fileInputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={handleDocxImport} />
        <div style={{ marginTop: 8 }}>
          {pool.map((p, i) => (
            <span key={i} className="chip">{p.length > 20 ? p.slice(0, 20) + '…' : p}<span className="x" onClick={() => removeFromPool(i)}>×</span></span>
          ))}
          {pool.length === 0 && <div className="empty">词库为空</div>}
        </div>
      </div>

      <div className="card">
        <h2>抽取历史 ({history.length})</h2>
        {history.length === 0 ? <div className="empty">暂无记录</div> : (
          <ol className="history" style={{ whiteSpace: 'pre-wrap' }}>
            {history.map((n, i) => (
              <li key={i}>{i + 1}. {bank.key === 'emoji' ? n.split('=')[0].trim() : n} <span className="x" style={{ cursor: 'pointer', color: 'var(--muted)', marginLeft: 8 }} onClick={() => removeHistory(i)}>×</span></li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
