'use client'
import { fmt, fmtDate } from '@/lib/utils'
import { PACKAGE_TYPE_META } from '@/lib/constants'

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
  const brand = data._brand || {}
  const isExpired = data._savedAt && (Date.now() - new Date(data._savedAt).getTime()) > 7 * 24 * 60 * 60 * 1000

  return (
    <div className="cp" style={{ position: 'relative' }}>
      {/* Водяной знак */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="150"><text x="50%" y="50%" transform="rotate(-35 125 75)" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-weight="800" font-size="16" fill="%23f59e0b" opacity="0.06">ОСТРОВ СОКРОВИЩ</text></svg>')`,
        backgroundRepeat: 'repeat',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Expiry warning */}
        {isExpired && (
          <div style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', padding: '10px 14px', margin: '8px 0 0', fontSize: '12px', color: '#fca5a5', fontWeight: 600 }}>
            ⚠️ Этот расчёт был создан более 7 дней назад. Цены могли измениться — уточните у менеджера.
          </div>
        )}

        <div className="cp-hero">
          <h1>Остров Сокровищ</h1>
          <p>Премиальные экскурсии · Пхукет</p>
        </div>

        {(data.name || data.date || data.phone) && (
          <div className="card">
            <div className="card-b" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {data.name  && <div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '2px' }}>Клиент</div><div style={{ fontWeight: 700 }}>{data.name}</div></div>}
              {data.date  && <div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '2px' }}>Дата</div><div style={{ fontWeight: 700 }}>{fmtDate(data.date)}</div></div>}
              {data.phone && <div><div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '2px' }}>Телефон</div><div style={{ fontWeight: 700 }}>{data.phone}</div></div>}
            </div>
          </div>
        )}

        {data.tourName && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.08))',
            borderColor: 'rgba(245,158,11,0.4)',
            boxShadow: '0 0 24px rgba(245,158,11,0.1)',
          }}>
            <div className="card-b" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--txl)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>🚤 МАРШРУТ</div>
              <div style={{ fontWeight: 800, fontSize: '16px', marginTop: '5px', color: 'var(--primary)' }}>{data.tourName}</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-b">
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>📋 Что включено</div>

            {data.tourName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--brd)' }}>
                <span style={{ fontSize: '18px' }}>🚤</span>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Аренда катера по маршруту</div>
              </div>
            )}

            {data.tourName ? (
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
              <>
                {pkgs.map((p, i) => {
                  const meta = PACKAGE_TYPE_META[p.type] || { icon: '📦', label: p.type }
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--brd)' }}>
                      <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{p.name}</div>
                        {p.note && <div style={{ fontSize: '11px', color: 'var(--txl)', marginTop: '1px' }}>{p.note}</div>}
                        {p.provider && <div style={{ fontSize: '10px', color: 'var(--txl)', marginTop: '1px' }}>{p.provider}</div>}
                      </div>
                    </div>
                  )
                })}
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
              <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>📝 Примечание</div>
              <div style={{ fontSize: '12px' }}>{data.note}</div>
            </div>
          </div>
        )}

        {/* Contact buttons */}
        {(brand.whatsapp || brand.telegram) && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            {brand.whatsapp && (
              <a
                href={`https://wa.me/${brand.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Здравствуйте! Хочу забронировать тур${data.tourName ? ': ' + data.tourName : ''}${data.date ? ' на ' + fmtDate(data.date) : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.35)', color: '#4ade80', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
              >
                <span style={{ fontSize: '18px' }}>💬</span> WhatsApp
              </a>
            )}
            {brand.telegram && (
              <a
                href={`https://t.me/${brand.telegram.replace('@', '')}?text=${encodeURIComponent(`Здравствуйте! Хочу забронировать тур${data.tourName ? ': ' + data.tourName : ''}${data.date ? ' на ' + fmtDate(data.date) : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.35)', color: '#60a5fa', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
              >
                <span style={{ fontSize: '18px' }}>✈️</span> Telegram
              </a>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--txl)', marginTop: '16px', paddingBottom: '24px', fontFamily: 'var(--font-mono)' }}>
          {data.gen ? 'Расчёт от ' + data.gen + ' · ' : ''}
          {brand.website ? <a href={brand.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--txl)', textDecoration: 'none' }}>{brand.website}</a> : 'Остров Сокровищ · Пхукет'}
        </div>
      </div>
    </div>
  )
}
