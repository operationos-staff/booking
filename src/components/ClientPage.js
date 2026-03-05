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
    <div className="cp" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="150"><text x="50%" y="50%" transform="rotate(-35 125 75)" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-weight="800" font-size="16" fill="%230F4C75" opacity="0.1">ОСТРОВ СОКРОВИЩ</text></svg>')`, backgroundRepeat: 'repeat' }}></div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="cp-hero">
          <div style={{ fontSize: '36px' }}>🏝</div>
          <h1>Остров Сокровищ</h1>
          <p>Увлекательные экскурсии. Пхукет</p>
        </div>

        {(data.name || data.date) && (
          <div className="card">
            <div className="card-b" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {data.name && <div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '2px' }}>Клиент</div><div style={{ fontWeight: 700 }}>{data.name}</div></div>}
              {data.date && <div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '2px' }}>Дата</div><div style={{ fontWeight: 700 }}>{fmtDate(data.date)}</div></div>}
              {data.phone && <div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '2px' }}>Телефон</div><div style={{ fontWeight: 700 }}>{data.phone}</div></div>}
            </div>
          </div>
        )}

        {data.tourName && (
          <div className="card" style={{ background: '#0F4C75', color: '#fff', marginBottom: '16px' }}>
            <div className="card-b" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '9px', opacity: 0.8, textTransform: 'uppercase' }}>🚤 МАРШРУТ</div>
              <div style={{ fontWeight: 800, fontSize: '16px', marginTop: '4px' }}>{data.tourName}</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-b">
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '12px' }}>📋 Что включено</div>

            {data.tourName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--brd)' }}>
                <span style={{ fontSize: '18px' }}>🚤</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>Аренда катера по маршруту</div>
                </div>
              </div>
            )}

            {data.tourName ? (
              // Charter items rendering
              (data.items || []).map((o, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < data.items.length - 1 ? '1px solid var(--brd)' : 'none' }}>
                  <span style={{ fontSize: '18px' }}>{o.icon || '🎯'}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{o.name}</div>
                    {o.meta && <div style={{ fontSize: '11px', color: 'var(--txl)', marginTop: '1px' }}>{o.meta.split(' × ')[0].trim()}</div>}
                  </div>
                </div>
              ))
            ) : (
              // Group Tour items rendering
              <>
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
              </>
            )}
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
    </div>
  )
}
