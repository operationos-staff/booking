'use client'
import { useState, useEffect, useCallback } from 'react'
import { loadCalculations, deleteCalculation } from '@/lib/db'
import { fmtDate, fmtBangkok } from '@/lib/utils'

const PAGE_SIZE = 20

export default function CalculationsPage({ user, role }) {
  const [calcs, setCalcs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(0)
  const [copied, setCopied]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await loadCalculations({ userId: user.id, role, limit: PAGE_SIZE, offset: page * PAGE_SIZE, search })
    setCalcs(data)
    setLoading(false)
  }, [user.id, role, page, search])

  useEffect(() => { load() }, [load])

  const handleSearch = (val) => { setSearch(val); setPage(0) }

  const handleDelete = async (id) => {
    if (!confirm('Удалить расчёт? Ссылка перестанет работать.')) return
    await deleteCalculation(id)
    setCalcs(prev => prev.filter(c => c.id !== id))
  }

  const copyLink = async (id) => {
    const url = `${location.origin}${location.pathname}?tour=${id}`
    try { await navigator.clipboard.writeText(url) } catch { }
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const openCalc = (id) => {
    window.open(`${location.origin}${location.pathname}?tour=${id}`, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '100px', paddingLeft: '16px', paddingRight: '16px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f59e0b', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
          📂 Мои расчёты
        </h1>
        <p style={{ color: '#64748b', fontSize: '13px' }}>
          {role === 'booking' ? 'Все сохранённые расчёты менеджеров' : 'Ваши сохранённые расчёты для клиентов'}
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Поиск по имени клиента..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          style={{
            flex: 1, padding: '9px 14px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: '#e5e5e5',
            outline: 'none', fontSize: '13px',
          }}
        />
        <button onClick={load} style={refreshBtnStyle}>🔄 Обновить</button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Загрузка...</div>
      ) : calcs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
          {search ? 'Ничего не найдено' : 'Расчётов пока нет'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {calcs.map(c => {
            const isExpired = c.created_at && (Date.now() - new Date(c.created_at).getTime()) > 7 * 24 * 60 * 60 * 1000
            return (
              <div
                key={c.id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isExpired ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#e5e5e5' }}>
                      {c.client_name || 'Без имени'}
                    </span>
                    {isExpired && (
                      <span style={{ fontSize: '10px', color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                        устарел
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                    {c.tour_date ? fmtDate(c.tour_date) : 'Дата не указана'}
                    {' · '}
                    {fmtBangkok(c.created_at, { year: 'numeric', month: '2-digit', day: '2-digit', hour: undefined, minute: undefined })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => openCalc(c.id)} title="Открыть в новой вкладке" style={actBtn('#60a5fa')}>👁</button>
                  <button onClick={() => copyLink(c.id)} title="Копировать ссылку" style={actBtn(copied === c.id ? '#4ade80' : '#94a3b8')}>
                    {copied === c.id ? '✓' : '🔗'}
                  </button>
                  <button onClick={() => handleDelete(c.id)} title="Удалить" style={actBtn('#f87171')}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
        {page > 0 && (
          <button onClick={() => setPage(p => p - 1)} style={pageBtnStyle}>← Назад</button>
        )}
        {calcs.length === PAGE_SIZE && (
          <button onClick={() => setPage(p => p + 1)} style={pageBtnStyle}>Вперёд →</button>
        )}
      </div>
    </div>
  )
}

const actBtn = (color) => ({
  padding: '5px 9px', borderRadius: '6px', border: 'none', cursor: 'pointer',
  background: `${color}22`, color, fontSize: '14px', transition: 'opacity 0.15s',
})

const pageBtnStyle = {
  padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
  background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700, fontSize: '13px',
}

const refreshBtnStyle = {
  padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
  background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
}
