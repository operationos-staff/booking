'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const ROLE_NAMES = { manager: 'Менеджер', booking: 'Операционный отдел' }
const ROLE_ICONS = { manager: '👤', booking: '📋' }

const TOUR_TYPES = [
  { page: 'calculator',  icon: '🚐', label: 'Групповые туры' },
  { page: 'charter',     icon: '🚤', label: 'Морские туры' },
  { page: 'land',        icon: '🏔️', label: 'Сухопутные' },
  { page: 'sights',      icon: '🏛️', label: 'Обзорные' },
  { page: 'individual',  icon: '👤', label: 'Индивидуальные' },
  { page: 'avia',        icon: '✈️', label: 'Авиатуры в ЮВА' },
  { page: 'fishing',     icon: '🎣', label: 'Рыбалка' },
]
const TOUR_PAGES = TOUR_TYPES.map(t => t.page)

export default function Header({ role, page, onPage, onLogout, newCalcBadge = 0, theme, onToggleTheme }) {
  const isClient = page === 'client'

  // dropdown «Операционный отдел» (правый)
  const [opsOpen, setOpsOpen] = useState(false)
  const [opsPos, setOpsPos] = useState({ top: 0, right: 0 })
  const opsBtnRef = useRef(null)
  const opsMenuRef = useRef(null)

  // dropdown «Экскурсии» — отдельные ref'ы для desktop/mobile
  const [excOpen, setExcOpen] = useState(false)
  const [excPos, setExcPos] = useState({ top: 0, left: 0 })
  const excDeskRef = useRef(null)
  const excMobRef = useRef(null)
  const excMenuRef = useRef(null)

  useEffect(() => {
    if (!opsOpen && !excOpen) return
    const close = (e) => {
      if (opsOpen && opsBtnRef.current && !opsBtnRef.current.contains(e.target)
          && opsMenuRef.current && !opsMenuRef.current.contains(e.target)) setOpsOpen(false)
      if (excOpen
          && (!excDeskRef.current || !excDeskRef.current.contains(e.target))
          && (!excMobRef.current  || !excMobRef.current.contains(e.target))
          && excMenuRef.current && !excMenuRef.current.contains(e.target)
        ) setExcOpen(false)
    }
    const onScroll = () => { setOpsOpen(false); setExcOpen(false) }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [opsOpen, excOpen])

  const openOps = () => {
    if (opsBtnRef.current) {
      const r = opsBtnRef.current.getBoundingClientRect()
      setOpsPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    setOpsOpen(o => !o)
    setExcOpen(false)
  }

  // Позиционируем меню под видимой кнопкой (desktop / mobile)
  const positionExc = () => {
    // выбираем тот ref, который реально виден на странице
    const desk = excDeskRef.current
    const mob  = excMobRef.current
    let target = null
    if (desk) {
      const r = desk.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) target = desk
    }
    if (!target && mob) {
      const r = mob.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) target = mob
    }
    if (!target) return
    const r = target.getBoundingClientRect()
    // На мобильном открываем НАД кнопкой (нижний бар), на десктопе — ПОД
    const isMobile = target === mob
    if (isMobile) {
      setExcPos({ top: Math.max(60, r.top - 360), left: Math.max(8, r.left) })
    } else {
      setExcPos({ top: r.bottom + 8, left: r.left })
    }
  }

  const openExc = () => {
    positionExc()
    setExcOpen(o => !o)
    setOpsOpen(false)
  }

  const goToOps = (p) => { onPage(p); setOpsOpen(false) }
  const goToExc = (p) => { onPage(p); setExcOpen(false) }

  const secondaryPages = ['calculations', 'stats', 'logs', 'profile']
  const isSecondaryActive = secondaryPages.includes(page)
  const isExcursionActive = TOUR_PAGES.includes(page)
  const activeTourMeta = TOUR_TYPES.find(t => t.page === page)

  const opsMenu = opsOpen ? (
    <div ref={opsMenuRef} style={{
      position: 'fixed', top: opsPos.top, right: opsPos.right,
      background: 'var(--bg2)', border: '1px solid var(--brd)',
      borderRadius: '14px', padding: '6px', minWidth: '210px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.45)', zIndex: 99999,
      animation: 'slideUp 0.15s ease',
    }}>
      <DropItem icon="📂" label="Расчёты" badge={newCalcBadge} active={page === 'calculations'} onClick={() => goToOps('calculations')} />
      {role === 'booking' && (
        <>
          <DropItem icon="📊" label="Статистика" active={page === 'stats'} onClick={() => goToOps('stats')} />
          <DropItem icon="📋" label="Логи" active={page === 'logs'} onClick={() => goToOps('logs')} />
        </>
      )}
      <DropItem icon="👤" label="Профиль" active={page === 'profile'} onClick={() => goToOps('profile')} />
      <div style={{ margin: '6px 4px', height: '1px', background: 'var(--brd2)' }} />
      <DropItem
        icon={theme === 'light' ? '🌙' : '☀️'}
        label={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        onClick={() => { onToggleTheme?.(); setOpsOpen(false) }}
      />
      <DropItem icon="🚪" label="Выйти" onClick={() => { onLogout(); setOpsOpen(false) }} danger />
    </div>
  ) : null

  const excMenu = excOpen ? (
    <div ref={excMenuRef} style={{
      position: 'fixed', top: excPos.top, left: excPos.left,
      background: 'var(--bg2)', border: '1px solid var(--brd)',
      borderRadius: '14px', padding: '6px', minWidth: '240px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.45)', zIndex: 99999,
      animation: 'slideUp 0.15s ease',
    }}>
      {TOUR_TYPES.map(t => (
        <DropItem key={t.page} icon={t.icon} label={t.label}
          active={page === t.page} onClick={() => goToExc(t.page)} />
      ))}
      <div style={{ margin: '6px 4px', height: '1px', background: 'var(--brd2)' }} />
      <DropItem icon="🏝" label="Все категории (Hub)" onClick={() => goToExc('hub')} />
    </div>
  ) : null

  return (
    <>
      <header className="header no-print">
        <div className="header-inner">

          <div className="logo" onClick={() => { if (!isClient) onPage('hub') }}>
            <div className="logo-icon">🏝</div>
            <div>
              <div className="logo-title">Портал бронирования</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hnav desktop-nav">
            {isClient ? (
              <span style={{ fontSize: '11px', opacity: '.8' }}>📄 Расчёт тура</span>
            ) : role ? (
              <>
                {/* 1. Экскурсии (выпадающий список 7 типов) */}
                <button
                  ref={excDeskRef}
                  onClick={openExc}
                  className={`btn-nav ${isExcursionActive ? 'btn-nav-a' : 'btn-nav-o'}`}
                  style={{ gap: '6px' }}
                >
                  <span style={{ fontSize: '14px' }}>{activeTourMeta?.icon || '🌴'}</span>
                  <span>{activeTourMeta ? activeTourMeta.label : 'Экскурсии'}</span>
                  <span style={{ fontSize: '9px', opacity: 0.5 }}>{excOpen ? '▲' : '▼'}</span>
                </button>

                {/* 2. Конструктор */}
                <button
                  className={`btn-nav ${page === 'constructor' ? 'btn-nav-a' : 'btn-nav-o'}`}
                  onClick={() => onPage('constructor')}
                >
                  🧩 Конструктор
                </button>

                {/* 3. План отдыха */}
                <button
                  className={`btn-nav ${page === 'vacation' ? 'btn-nav-a' : 'btn-nav-o'}`}
                  onClick={() => onPage('vacation')}
                >
                  📅 План отдыха
                </button>

                {/* 3. Операционный отдел / Менеджер (правый dropdown) */}
                <button
                  ref={opsBtnRef}
                  onClick={openOps}
                  className={`btn-nav ${isSecondaryActive ? 'btn-nav-a' : 'btn-nav-o'}`}
                  style={{ gap: '8px', paddingRight: '10px' }}
                >
                  <span className={`rbadge ${role === 'booking' ? 'rb' : 'rm'}`} style={{ margin: 0, padding: '2px 8px', fontSize: '9px' }}>
                    {ROLE_ICONS[role]} {ROLE_NAMES[role]}
                  </span>
                  {newCalcBadge > 0 && (
                    <span style={{
                      background: '#f59e0b', color: '#111', borderRadius: '50%',
                      width: '16px', height: '16px', fontSize: '9px', fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {newCalcBadge > 9 ? '9+' : newCalcBadge}
                    </span>
                  )}
                  <span style={{ fontSize: '9px', opacity: 0.5 }}>{opsOpen ? '▲' : '▼'}</span>
                </button>

                {typeof document !== 'undefined' && createPortal(opsMenu, document.body)}
                {typeof document !== 'undefined' && createPortal(excMenu, document.body)}
              </>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Mobile bottom navigation bar */}
      {!isClient && role && (
        <nav className="mob-bottom-nav no-print">
          <button className={`mob-bottom-btn ${page === 'hub' ? 'mob-bottom-active' : ''}`} onClick={() => onPage('hub')}>
            <span className="mob-bottom-icon">🏝</span>
            <span className="mob-bottom-label">Hub</span>
          </button>
          <button className={`mob-bottom-btn ${isExcursionActive ? 'mob-bottom-active' : ''}`} onClick={openExc} ref={excMobRef}>
            <span className="mob-bottom-icon">{activeTourMeta?.icon || '🌴'}</span>
            <span className="mob-bottom-label">{activeTourMeta ? 'Тип' : 'Экскур.'}</span>
          </button>
          <button className={`mob-bottom-btn ${page === 'constructor' ? 'mob-bottom-active' : ''}`} onClick={() => onPage('constructor')}>
            <span className="mob-bottom-icon">🧩</span>
            <span className="mob-bottom-label">Конструктор</span>
          </button>
          <button className={`mob-bottom-btn ${page === 'calculations' ? 'mob-bottom-active' : ''}`} onClick={() => onPage('calculations')}>
            <span className="mob-bottom-icon">📂</span>
            {newCalcBadge > 0 && (
              <span style={{
                position: 'absolute', top: '4px', marginLeft: '14px',
                background: '#f59e0b', color: '#111', borderRadius: '50%',
                width: '14px', height: '14px', fontSize: '8px', fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{newCalcBadge > 9 ? '9+' : newCalcBadge}</span>
            )}
            <span className="mob-bottom-label">Расчёты</span>
          </button>
          {role === 'booking' && (
            <>
              <button className={`mob-bottom-btn ${page === 'stats' ? 'mob-bottom-active' : ''}`} onClick={() => onPage('stats')}>
                <span className="mob-bottom-icon">📊</span>
                <span className="mob-bottom-label">Стат.</span>
              </button>
              <button className={`mob-bottom-btn ${page === 'logs' ? 'mob-bottom-active' : ''}`} onClick={() => onPage('logs')}>
                <span className="mob-bottom-icon">📋</span>
                <span className="mob-bottom-label">Логи</span>
              </button>
            </>
          )}
          <button className={`mob-bottom-btn ${page === 'profile' ? 'mob-bottom-active' : ''}`} onClick={() => onPage('profile')}>
            <span className="mob-bottom-icon">👤</span>
            <span className="mob-bottom-label">Профиль</span>
          </button>
          <button className="mob-bottom-btn" onClick={() => { onToggleTheme?.() }}>
            <span className="mob-bottom-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span className="mob-bottom-label">Тема</span>
          </button>
        </nav>
      )}
    </>
  )
}

function DropItem({ icon, label, active, onClick, badge, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', padding: '9px 12px', borderRadius: '9px',
        border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
        background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
        color: danger ? 'var(--er)' : active ? 'var(--primary)' : 'var(--txm)',
        transition: 'background 0.12s', textAlign: 'left', fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger
          ? 'rgba(239,68,68,0.08)'
          : active ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.07)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = active ? 'rgba(245,158,11,0.12)' : 'transparent'
      }}
    >
      <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{
          background: '#f59e0b', color: '#111', borderRadius: '10px',
          padding: '0 6px', fontSize: '9px', fontWeight: 900, minWidth: '18px', textAlign: 'center',
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}
