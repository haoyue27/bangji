import React, { createContext, useContext, useState, useCallback } from 'react'

export type Student = string

export interface Prize {
  id: string
  name: string
  count: number
  winners: string[]
}

export interface AppState {
  students: string[]
  setStudents: (s: string[]) => void
  addStudent: (name: string) => void
  removeStudent: (idx: number) => void
  groups: string[][]
  setGroups: (g: string[][]) => void
  drawHistory: string[]
  setDrawHistory: (h: string[]) => void
  prizes: Prize[]
  setPrizes: (p: Prize[]) => void
}

const Ctx = createContext<AppState | null>(null)

const defaultPrizes: Prize[] = [
  { id: 'p1', name: '一等奖', count: 1, winners: [] },
  { id: 'p2', name: '二等奖', count: 3, winners: [] },
  { id: 'p3', name: '三等奖', count: 5, winners: [] },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudentsState] = useState<string[]>(() => load('students', []))
  const [groups, setGroupsState] = useState<string[][]>(() => load('groups', []))
  const [drawHistory, setDrawHistoryState] = useState<string[]>(() => load('drawHistory', []))
  const [prizes, setPrizesState] = useState<Prize[]>(() => load('prizes', defaultPrizes))

  const setStudents = useCallback((s: string[]) => {
    setStudentsState(s)
    localStorage.setItem('students', JSON.stringify(s))
  }, [])
  const addStudent = useCallback((name: string) => {
    setStudentsState(prev => {
      const next = [...prev, name]
      localStorage.setItem('students', JSON.stringify(next))
      return next
    })
  }, [])
  const removeStudent = useCallback((idx: number) => {
    setStudentsState(prev => {
      const next = prev.filter((_, i) => i !== idx)
      localStorage.setItem('students', JSON.stringify(next))
      return next
    })
  }, [])
  const setGroups = useCallback((g: string[][]) => {
    setGroupsState(g)
    localStorage.setItem('groups', JSON.stringify(g))
  }, [])
  const setDrawHistory = useCallback((h: string[]) => {
    setDrawHistoryState(h)
    localStorage.setItem('drawHistory', JSON.stringify(h))
  }, [])
  const setPrizes = useCallback((p: Prize[]) => {
    setPrizesState(p)
    localStorage.setItem('prizes', JSON.stringify(p))
  }, [])

  return (
    <Ctx.Provider value={{ students, setStudents, addStudent, removeStudent, groups, setGroups, drawHistory, setDrawHistory, prizes, setPrizes }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('no provider')
  return v
}
