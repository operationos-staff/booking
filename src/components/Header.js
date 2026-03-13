'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const ROLE_NAMES = { manager: 'Менеджер', booking: 'Операционный отдел' }
const ROLE_ICONS = { manager: '👤', booking: '📋' }

export default function Header({ role, page, onPage, onLogout, newCalcBadge = 0, theme, onToggleTheme }) {
  const isClient = page === 'client'
  const [dropOpen, setDropOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!dropOpen) return
    const close = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setDropOpen(false)
    }
    const onScroll = () => setDropOpen(false)
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [dropOpen])

  const openDrop = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    setDropOpen(o => !o)
  }

  const goTo = (p) => { onPage(p); setDropOpen(false) }

  const secondaryPages = ['calculations', 'stats', 'logs', 'profile']
  const isSecondaryActive = secondaryPages.includes(page)

  const dropMenu = dropOpen ? (
    <div ref={menuRef} style={{
      position: 'fixed', top: dropPos.top, right: dropPos.right,
      background: 'var(--bg2)', border: '1px solid var(--brd)',
      borderRadius: '14px', padding: '6px', minWidth: '210px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.45)', zIndex: 99999,
      animation: 'slideUp 0.15s ease',
    }}>
      <DropItem icon="📂" label="Расчёты" badge={newCalcBadge} active={page === 'calculations'} onClick={() => goTo('calculations')} />
      {role === 'booking' && (
        <>
          <DropItem icon="📊" label="Статистика" active={page === 'stats'} onClick={() => goTo('stats')} />
          <DropItem icon="📋" label="Логи" active={page === 'logs'} onClick={() => goTo('logs')} />
        </>
      )}
      <DropItem icon="👤" label="Профиль" active={page === 'profile'} onClick={() => goTo('profile')} />
      <div style={{ margin: '6px 4px', height: '1px', background: 'var(--brd2)' }} />
      <DropItem
        icon={theme === 'light' ? '🌙' : '☀️'}
        label={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        onClick={() => { onToggleTheme?.(); setDropOpen(false) }}
      />
      <DropItem icon="🚪" label="Выйти" onClick={() => { onLogout(); setDropOpen(false) }} danger />
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
                <button className={`btn-nav ${page === 'calculator' ? 'btn-nav-a' : 'btn-nav-o'}`} onClick={() => onPage('calculator')}>
                  🚐 Групповые туры
                </button>
                <button className={`btn-nav ${page === 'charter' ? 'btn-nav-a' : 'btn-nav-o'}`} onClick={() => onPage('charter')}>
                  🚤 Спидбот туры
                </button>

                {/* User dropdown trigger */}
                <button
                  ref={btnRef}
                  onClick={openDrop}
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
                  <span style={{ fontSize: '9px', opacity: 0.5 }}>{dropOpen ? '▲' : '▼'}</span>
                </button>

                {/* Dropdown rendered via Portal at document.body */}
                {typeof document !== 'undefined' && createPortal(dropMenu, document.body)}
              </>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Mobile bottom navigation bar */}
      {!isClient && role && (
        <nav className="mob-bottom-nav no-print">
          <button className={`mob-bottom-btn ${page === 'calculator' ? 'mob-bottom-active' : ''}`} onClick={() => onPage('calculator')}>
            <span className="mob-bottom-icon">🚐</span>
            <span className="mob-bottom-label">Группы</span>
          </button>
          <button className={`mob-bottom-btn ${page === 'charter' ? 'mob-bottom-active' : ''}`} onClick={() => onPage('charter')}>
            <span className="mob-bottom-icon">🚤</span>
            <span className="mob-bottom-label">Чартер</span>
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
