'use client'
import { fmt, fmtDate } from '@/lib/utils'

export default function ClientPage({ data }) {
  if (!data) {
    return (
      <div className="cp">
        <div className="empty"><div className="ei">🔗</div><p>Данные не найдены</p></div>
      </div>
    )
  }

  const pkgs = (data.items || []).filter(i => i.type !== 'opt')
  const opts = (data.items || []).filter(i => i.type === 'opt')

  return (
    <div className="cp">
      <div className="cp-hero">
        <div style={{ fontSize: '36px' }}>🏝</div>
        <h1>Остров Сокровищ</h1>
        <p>Аренда яхт и катеров · Пхукет{data.name ? ' · ' + data.name : ''}</p>
      </div>

      {(data.name || data.date) && (
        <div className="card">
          <div className="card-b" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {data.name  && <div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '2px' }}>Клиент</div><div style={{ fontWeight: 700 }}>{data.name}</div></div>}
            {data.date  && <div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '2px' }}>Дата</div><div style={{ fontWeight: 700 }}>{fmtDate(data.date)}</div></div>}
            {data.phone && <div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '2px' }}>Телефон</div><div style={{ fontWeight: 700 }}>{data.phone}</div></div>}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-b">
          <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '12px' }}>📋 Состав тура</div>
          {pkgs.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--brd)' }}>
              <span style={{ fontSize: '18px' }}>{p.type === 'vip' ? '⭐' : '🚐'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{p.name}</div>
                {p.note && <div style={{ fontSize: '11px', color: 'var(--txl)', marginTop: '1px' }}>{p.note}</div>}
              </div>
            </div>
          ))}
          {opts.map((o, i) => {
            const det = [o.aQ > 0 ? o.aQ + ' взр.' : '', o.cQ > 0 ? o.cQ + ' дет.' : ''].filter(Boolean).join(', ')
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < opts.length - 1 ? '1px solid var(--brd)' : 'none' }}>
                <span style={{ fontSize: '18px' }}>🎯</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{o.name}</div>
                  {det && <div style={{ fontSize: '10px', color: 'var(--txl)', marginTop: '1px' }}>{det}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="ct-box">
        <div className="ctl">ИТОГО К ОПЛАТЕ</div>
        <div className="cta">{fmt(data.total)} ฿</div>
        <div className="ctc">тайских бат (THB)</div>
      </div>

      {data.note && (
        <div className="card">
          <div className="card-b">
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '3px' }}>📝 Примечание</div>
            <div style={{ fontSize: '12px' }}>{data.note}</div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--txl)', marginTop: '16px', paddingBottom: '24px' }}>
        {data.gen ? 'Расчёт от ' + data.gen + ' · ' : ''}Остров Сокровищ · Пхукет
      </div>
    </div>
  )
}
