'use client'
import { useState } from 'react'

const ROLE_NAMES = { manager: 'Менеджер', booking: 'Операционный отдел' }
const ROLE_ICONS = { manager: '👤', booking: '📋' }

export default function Header({ role, page, onPage, onLogout }) {
  const isClient = page === 'client'
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="header no-print">
        <div className="header-inner">
          <div className="logo" onClick={() => { if (!isClient) { onPage('calculator'); setMenuOpen(false); } }}>
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
                <button className="btn-nav btn-nav-o" onClick={onLogout}>
                  🚪 Выйти
                </button>
                <span className={`rbadge ${role === 'booking' ? 'rb' : 'rm'}`} style={{ marginLeft: '4px' }}>
                  {ROLE_ICONS[role]} {ROLE_NAMES[role]}
                </span>
              </>
            ) : null}
          </nav>

          {/* Mobile hamburger */}
          {!isClient && role && (
            <button
              className="mob-burger"
              onClick={() => setMenuOpen(p => !p)}
              aria-label="Меню"
            >
              <span className={`burger-line ${menuOpen ? 'open' : ''}`} />
              <span className={`burger-line ${menuOpen ? 'open' : ''}`} />
              <span className={`burger-line ${menuOpen ? 'open' : ''}`} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && role && (
        <div className="mob-menu no-print" onClick={() => setMenuOpen(false)}>
          <div className="mob-menu-inner" onClick={e => e.stopPropagation()}>
            <div className="mob-menu-role">
              <span className={`rbadge ${role === 'booking' ? 'rb' : 'rm'}`}>
                {ROLE_ICONS[role]} {ROLE_NAMES[role]}
              </span>
            </div>
            <button className={`mob-menu-btn ${page === 'calculator' ? 'active' : ''}`}
              onClick={() => { onPage('calculator'); setMenuOpen(false); }}>
              🚐 Групповые туры
            </button>
            <button className={`mob-menu-btn ${page === 'charter' ? 'active' : ''}`}
              onClick={() => { onPage('charter'); setMenuOpen(false); }}>
              🚤 Спидбот туры
            </button>
            <button className="mob-menu-btn mob-menu-logout"
              onClick={() => { onLogout(); setMenuOpen(false); }}>
              🚪 Выйти
            </button>
          </div>
        </div>
      )}

      {/* Mobile bottom navigation bar */}
      {!isClient && role && (
        <nav className="mob-bottom-nav no-print">
          <button
            className={`mob-bottom-btn ${page === 'calculator' ? 'mob-bottom-active' : ''}`}
            onClick={() => onPage('calculator')}
          >
            <span className="mob-bottom-icon">🚐</span>
            <span className="mob-bottom-label">Группы</span>
          </button>
          <button
            className={`mob-bottom-btn ${page === 'charter' ? 'mob-bottom-active' : ''}`}
            onClick={() => onPage('charter')}
          >
            <span className="mob-bottom-icon">🚤</span>
            <span className="mob-bottom-label">Чартер</span>
          </button>
          <button
            className="mob-bottom-btn"
            onClick={onLogout}
          >
            <span className="mob-bottom-icon">🚪</span>
            <span className="mob-bottom-label">Выйти</span>
          </button>
        </nav>
      )}
    </>
  )
}
