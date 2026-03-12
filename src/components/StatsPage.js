'use client'
import { useState, useEffect } from 'react'
import { loadStats } from '@/lib/db'
import { fmtBangkok } from '@/lib/utils'

export default function StatsPage() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
      .then(s => { setStats(s); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '80px', paddingLeft: '16px', paddingRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '14px' }}>Загрузка статистики...</div>
      </div>
    )
  }
  if (!stats) return null

  // Group recentCalcs by date for chart
  const byDate = {}
  for (const c of stats.recentCalcs) {
    const d = c.created_at.split('T')[0]
    byDate[d] = (byDate[d] || 0) + 1
  }
  const dates = Object.keys(byDate).sort().slice(-14)
  const maxCount = Math.max(...dates.map(d => byDate[d]), 1)

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '100px', paddingLeft: '16px', paddingRight: '16px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f59e0b', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
          📊 Статистика
        </h1>
        <p style={{ color: '#64748b', fontSize: '13px' }}>Активность системы бронирования</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <KpiCard icon="📋" label="Всего расчётов" value={stats.totalCalcs} color="#f59e0b" />
        <KpiCard icon="📅" label="За 7 дней"      value={stats.weekCalcs}  color="#60a5fa" />
        <KpiCard icon="📆" label="За 30 дней"     value={stats.monthCalcs} color="#4ade80" />
        <KpiCard icon="👥" label="Последних входов" value={stats.recentLogins.length} color="#a78bfa" />
      </div>

      {/* Bar chart */}
      {dates.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 16px 24px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
            Расчёты за последние 14 дней
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px' }}>
            {dates.map(d => {
              const cnt = byDate[d]
              const pct = Math.round((cnt / maxCount) * 100)
              return (
                <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: 0 }}>
                  <div style={{ fontSize: '9px', color: '#f59e0b', fontWeight: 700 }}>{cnt}</div>
                  <div style={{ width: '100%', height: `${Math.max(4, pct * 0.64)}px`, background: 'rgba(245,158,11,0.65)', borderRadius: '3px 3px 0 0', minHeight: '4px' }} />
                  <div style={{ fontSize: '8px', color: '#475569', whiteSpace: 'nowrap' }}>{d.slice(5)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Recent calculations */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Последние расчёты
          </div>
          {stats.recentCalcs.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '12px' }}>Нет данных</div>
          ) : (
            stats.recentCalcs.slice(0, 10).map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < Math.min(9, stats.recentCalcs.length - 1) ? '1px solid rgba(255,255,255,0.05)' : 'none', fontSize: '12px' }}>
                <span style={{ color: '#e5e5e5', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>
                  {c.client_name || '—'}
                </span>
                <span style={{ color: '#475569', flexShrink: 0 }}>
                  {fmtBangkok(c.created_at, { day: '2-digit', month: '2-digit', year: undefined, hour: undefined, minute: undefined })}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent logins */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Последние входы
          </div>
          {stats.recentLogins.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '12px' }}>Нет данных</div>
          ) : (
            stats.recentLogins.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < stats.recentLogins.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', fontSize: '12px' }}>
                <span style={{ color: '#e5e5e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>
                  {l.user_email}
                </span>
                <span style={{ color: '#475569', flexShrink: 0 }}>
                  {new Date(l.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '22px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: 900, color, lineHeight: 1, marginBottom: '6px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</div>
    </div>
  )
}
