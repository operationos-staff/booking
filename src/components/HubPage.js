'use client'
import { EXCURSION_CATEGORIES } from '@/lib/constants'

function hexToRgba(hex, alpha) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!r) return `rgba(100,100,100,${alpha})`
  return `rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${alpha})`
}

export default function HubPage({ packages, excursions = [], landRoutesCount = 0, sightsRoutesCount = 0, individualRoutesCount = 0, aviaRoutesCount = 0, fishingRoutesCount = 0, onSelect, role }) {
  // Count packages + excursions per category
  const allItems = [...packages, ...excursions]
  const countByCat = EXCURSION_CATEGORIES.reduce((acc, c) => {
    acc[c.key] = allItems.filter(p => (p.category || 'Групповые туры') === c.key).length
    return acc
  }, {})
  // Каждая «отдельная» категория считается из своего key в charter_config
  if (landRoutesCount > 0) countByCat['Сухопутные'] = landRoutesCount
  if (sightsRoutesCount > 0) countByCat['Обзорные'] = sightsRoutesCount
  if (individualRoutesCount > 0) countByCat['Индивидуальные'] = individualRoutesCount
  if (aviaRoutesCount > 0) countByCat['Авиатуры в ЮВА'] = aviaRoutesCount
  if (fishingRoutesCount > 0) countByCat['Рыбалка'] = fishingRoutesCount

  const cats = EXCURSION_CATEGORIES

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
          color: 'var(--txt)', margin: '0 0 8px',
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
        {cats.map((cat, idx) => {
          const count = countByCat[cat.key] || 0
          return (
            <>
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
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt)', textAlign: 'center', lineHeight: 1.3 }}>
                  {cat.key}
                </span>
                {count > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: cat.color, opacity: 0.9 }}>
                    {count} {cat.key === 'Сухопутные'
                      ? (count === 1 ? 'маршрут' : count < 5 ? 'маршрута' : 'маршрутов')
                      : cat.key === 'Авиатуры в ЮВА'
                      ? (count === 1 ? 'тур' : count < 5 ? 'тура' : 'туров')
                      : (cat.key === 'Обзорные' || cat.key === 'Индивидуальные')
                      ? (count === 1 ? 'экскурсия' : count < 5 ? 'экскурсии' : 'экскурсий')
                      : (count === 1 ? 'пакет' : count < 5 ? 'пакета' : 'пакетов')}
                  </span>
                )}
                {count === 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--txm)', opacity: 0.6 }}>скоро</span>
                )}
              </button>

              {/* Charter tile — right after "Групповые туры" */}
              {idx === 0 && (
                <button
                  key="charter"
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
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt)', textAlign: 'center', lineHeight: 1.3 }}>
                    Морские туры
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b5cf6', opacity: 0.9 }}>
                    чартер
                  </span>
                </button>
              )}
            </>
          )
        })}

        {/* Constructor tile — выделенная отдельно */}
        <button
          key="constructor"
          onClick={() => onSelect('constructor')}
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(245,158,11,0.06))',
            border: '1.5px solid rgba(245,158,11,0.45)',
            borderRadius: '20px',
            padding: '28px 20px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.18s ease',
            fontFamily: 'inherit',
            gridColumn: 'span 2',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.26), rgba(245,158,11,0.1))'
            e.currentTarget.style.borderColor = 'rgba(245,158,11,0.7)'
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(245,158,11,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(245,158,11,0.06))'
            e.currentTarget.style.borderColor = 'rgba(245,158,11,0.45)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span style={{ fontSize: '36px', lineHeight: 1 }}>🧩</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b', textAlign: 'center', lineHeight: 1.3 }}>
            Конструктор кастомного тура
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txm)' }}>
            собери из всех 100+ активностей
          </span>
        </button>
      </div>
    </div>
  )
}
