'use client'
import { useState, useEffect, useCallback } from 'react'
import { loadActivityLog } from '@/lib/db'
import { fmtBangkok } from '@/lib/utils'

const ACTION_LABELS = {
  login:                    { label: 'Вход в систему',         icon: '🔐', color: '#22c55e' },
  logout:                   { label: 'Выход из системы',       icon: '🚪', color: '#94a3b8' },
  save_calculation:         { label: 'Расчёт сохранён',        icon: '📄', color: '#f59e0b' },
  db_insert_packages:       { label: 'Добавлен пакет',         icon: '➕', color: '#60a5fa' },
  db_update_packages:       { label: 'Изменён пакет',          icon: '✏️', color: '#60a5fa' },
  db_delete_packages:       { label: 'Удалён пакет',           icon: '🗑️', color: '#f87171' },
  db_insert_options:        { label: 'Добавлена опция',        icon: '➕', color: '#a78bfa' },
  db_update_options:        { label: 'Изменена опция',         icon: '✏️', color: '#a78bfa' },
  db_delete_options:        { label: 'Удалена опция',          icon: '🗑️', color: '#f87171' },
  db_update_charter_config: { label: 'Изменён чартер',        icon: '🚤', color: '#34d399' },
  db_insert_charter_config: { label: 'Создан чартер',         icon: '🚤', color: '#34d399' },
}

const ACTION_FILTERS = [
  { value: '',                        label: 'Все действия' },
  { value: 'login',                   label: 'Входы' },
  { value: 'logout',                  label: 'Выходы' },
  { value: 'save_calculation',        label: 'Расчёты' },
  { value: 'db_update_packages',      label: 'Изменения пакетов' },
  { value: 'db_update_options',       label: 'Изменения опций' },
  { value: 'db_update_charter_config',label: 'Изменения чартера' },
]

function formatDate(ts) {
  return fmtBangkok(ts)
}

function getChangeSummary(action, details) {
  if (action.startsWith('db_update_') && details.old && details.new) {
    const old = details.old
    const nw  = details.new
    const changed = []
    for (const key of Object.keys(nw)) {
      if (JSON.stringify(old[key]) !== JSON.stringify(nw[key]) && key !== 'updated_at') {
        changed.push(key)
      }
    }
    if (changed.length) return `Изменено: ${changed.join(', ')}`
  }
  if (action === 'login' || action === 'logout') {
    return details.role ? `Роль: ${details.role}` : ''
  }
  if (action === 'save_calculation') {
    return details.client ? `Клиент: ${details.client}` : ''
  }
  return ''
}

export default function LogsPage({ user }) {
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('')
  const [expanded, setExpanded]   = useState(null)
  const [page, setPage]           = useState(0)
  const PAGE_SIZE = 50

  const load = useCallback(async () => {
    setLoading(true)
    const data = await loadActivityLog({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, action: filter || null })
    setLogs(data)
    setLoading(false)
  }, [filter, page])

  useEffect(() => { load() }, [load])

  const handleFilter = (val) => { setFilter(val); setPage(0); setExpanded(null) }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '100px', paddingLeft: '16px', paddingRight: '16px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f59e0b', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
          📋 История действий
        </h1>
        <p style={{ color: 'var(--txl)', fontSize: '13px' }}>
          Изменения цен, входы/выходы, сохранённые расчёты
        </p>
      </div>

      {/* Фильтры */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {ACTION_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              background: filter === f.value ? '#f59e0b' : 'var(--s2)',
              color:      filter === f.value ? '#111'    : '#94a3b8',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={load}
          style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: 'var(--s2)', color: '#94a3b8' }}
        >
          🔄 Обновить
        </button>
      </div>

      {/* Таблица */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--txl)', padding: '40px' }}>Загрузка...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--txl)', padding: '40px' }}>Записей нет</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {logs.map(log => {
            const meta   = ACTION_LABELS[log.action] || { label: log.action, icon: '•', color: '#94a3b8' }
            const summary = getChangeSummary(log.action, log.details || {})
            const isOpen  = expanded === log.id

            return (
              <div
                key={log.id}
                style={{
                  background: 'var(--s1)',
                  border: `1px solid ${isOpen ? meta.color + '44' : 'var(--bd)'}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
              >
                <div
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '18px', minWidth: '24px' }}>{meta.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: meta.color }}>{meta.label}</span>
                      {summary && <span style={{ fontSize: '11px', color: 'var(--txl)' }}>{summary}</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '2px' }}>
                      {log.user_email || 'система'} · {formatDate(log.created_at)}
                    </div>
                  </div>
                  <span style={{ color: 'var(--txm)', fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Детали */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--dv)', padding: '12px 14px' }}>
                    {log.action.startsWith('db_update_') && log.details?.old && log.details?.new ? (
                      <DiffView old={log.details.old} nw={log.details.new} />
                    ) : (
                      <pre style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Пагинация */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
        {page > 0 && (
          <button onClick={() => setPage(p => p - 1)} style={pageBtnStyle}>
            ← Назад
          </button>
        )}
        {logs.length === PAGE_SIZE && (
          <button onClick={() => setPage(p => p + 1)} style={pageBtnStyle}>
            Вперёд →
          </button>
        )}
      </div>
    </div>
  )
}

const pageBtnStyle = {
  padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
  background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700, fontSize: '13px',
}

function DiffView({ old, nw }) {
  const keys = [...new Set([...Object.keys(old), ...Object.keys(nw)])].filter(k => k !== 'updated_at')
  const changed = keys.filter(k => JSON.stringify(old[k]) !== JSON.stringify(nw[k]))
  const unchanged = keys.filter(k => JSON.stringify(old[k]) === JSON.stringify(nw[k]))

  return (
    <div style={{ fontSize: '12px' }}>
      {changed.length > 0 && (
        <>
          <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Изменено:
          </div>
          {changed.map(k => (
            <div key={k} style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--txl)', minWidth: '120px', fontWeight: 600 }}>{k}</span>
              <span style={{ color: '#f87171', textDecoration: 'line-through' }}>{String(old[k])}</span>
              <span style={{ color: 'var(--txl)' }}>→</span>
              <span style={{ color: '#4ade80' }}>{String(nw[k])}</span>
            </div>
          ))}
        </>
      )}
      {unchanged.length > 0 && (
        <details style={{ marginTop: '8px' }}>
          <summary style={{ color: 'var(--txm)', cursor: 'pointer', fontSize: '11px' }}>Без изменений ({unchanged.length} полей)</summary>
          <div style={{ marginTop: '6px' }}>
            {unchanged.map(k => (
              <div key={k} style={{ display: 'flex', gap: '8px', marginBottom: '2px', color: 'var(--txm)' }}>
                <span style={{ minWidth: '120px', fontWeight: 600 }}>{k}</span>
                <span>{String(nw[k])}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
