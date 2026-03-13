'use client'
import { EXCURSION_CATEGORIES } from '@/lib/constants'

function hexToRgba(hex, alpha) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!r) return `rgba(100,100,100,${alpha})`
  return `rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${alpha})`
}

export default function HubPage({ packages, onSelect, role }) {
  // Count packages per category
  const countByCat = EXCURSION_CATEGORIES.reduce((acc, c) => {
    acc[c.key] = packages.filter(p => (p.category || 'Групповые туры') === c.key).length
    return acc
  }, {})

  const cats = EXCURSION_CATEGORIES.filter(c => countByCat[c.key] > 0 || c.key === 'Групповые туры')

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      paddingTop: '80px',
      paddingBottom: '100px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '40px', padding: '0 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px', filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.6))' }}>🏝</div>
        <h1 style={{
          fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800,
          color: 'var(--tx)', margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}>
          Портал бронирования
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--txm)', margin: 0 }}>
          Выберите тип экскурсии для расчёта
        </p>
      </div>

      {/* Category cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        width: '100%',
        maxWidth: '900px',
        padding: '0 20px',
      }}>
        {cats.map(cat => {
          const count = countByCat[cat.key] || 0
          return (
            <button
              key={cat.key}
              onClick={() => onSelect(cat.key)}
              style={{
                background: hexToRgba(cat.color, 0.08),
                border: `1.5px solid ${hexToRgba(cat.color, 0.25)}`,
                borderRadius: '20px',
                padding: '28px 20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.18s ease',
                fontFamily: 'inherit',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = hexToRgba(cat.color, 0.16)
                e.currentTarget.style.borderColor = hexToRgba(cat.color, 0.55)
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = `0 12px 40px ${hexToRgba(cat.color, 0.25)}`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = hexToRgba(cat.color, 0.08)
                e.currentTarget.style.borderColor = hexToRgba(cat.color, 0.25)
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '36px', lineHeight: 1 }}>{cat.icon}</span>
              <span style={{
                fontSize: '15px', fontWeight: 700,
                color: 'var(--tx)', textAlign: 'center', lineHeight: 1.3,
              }}>
                {cat.key}
              </span>
              {count > 0 && (
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: cat.color, opacity: 0.9,
                }}>
                  {count} {count === 1 ? 'пакет' : count < 5 ? 'пакета' : 'пакетов'}
                </span>
              )}
              {count === 0 && (
                <span style={{ fontSize: '11px', color: 'var(--txm)', opacity: 0.6 }}>
                  скоро
                </span>
              )}
            </button>
          )
        })}

        {/* Charter tile */}
        <button
          onClick={() => onSelect('charter')}
          style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1.5px solid rgba(139,92,246,0.25)',
            borderRadius: '20px',
            padding: '28px 20px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.18s ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.16)'
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.55)'
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(139,92,246,0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.08)'
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span style={{ fontSize: '36px', lineHeight: 1 }}>🚤</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--tx)', textAlign: 'center', lineHeight: 1.3 }}>
            Спидбот туры
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b5cf6', opacity: 0.9 }}>
            чартер
          </span>
        </button>
      </div>
    </div>
  )
}
