'use client'
import { useState } from 'react'

const ROLE_NAMES = { manager: 'Менеджер', booking: 'Операционный отдел' }
const ROLE_ICONS = { manager: '👤', booking: '📋' }

export default function Header({ role, page, onPage, onLogout }) {
  const isClient = page === 'client'

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
                <button className={`btn-nav ${page === 'calculations' ? 'btn-nav-a' : 'btn-nav-o'}`} onClick={() => onPage('calculations')}>
                  📂 Расчёты
                </button>
                {role === 'booking' && (
                  <>
                    <button className={`btn-nav ${page === 'stats' ? 'btn-nav-a' : 'btn-nav-o'}`} onClick={() => onPage('stats')}>
                      📊 Статистика
                    </button>
                    <button className={`btn-nav ${page === 'logs' ? 'btn-nav-a' : 'btn-nav-o'}`} onClick={() => onPage('logs')}>
                      📋 Логи
                    </button>
                  </>
                )}
                <button className="btn-nav btn-nav-o" onClick={onLogout}>
                  🚪 Выйти
                </button>
                <span className={`rbadge ${role === 'booking' ? 'rb' : 'rm'}`} style={{ marginLeft: '4px' }}>
                  {ROLE_ICONS[role]} {ROLE_NAMES[role]}
                </span>
              </>
            ) : null}
          </nav>


        </div>
      </header>



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
            className={`mob-bottom-btn ${page === 'calculations' ? 'mob-bottom-active' : ''}`}
            onClick={() => onPage('calculations')}
          >
            <span className="mob-bottom-icon">📂</span>
            <span className="mob-bottom-label">Расчёты</span>
          </button>
          {role === 'booking' && (
            <>
              <button
                className={`mob-bottom-btn ${page === 'stats' ? 'mob-bottom-active' : ''}`}
                onClick={() => onPage('stats')}
              >
                <span className="mob-bottom-icon">📊</span>
                <span className="mob-bottom-label">Стат.</span>
              </button>
              <button
                className={`mob-bottom-btn ${page === 'logs' ? 'mob-bottom-active' : ''}`}
                onClick={() => onPage('logs')}
              >
                <span className="mob-bottom-icon">📋</span>
                <span className="mob-bottom-label">Логи</span>
              </button>
            </>
          )}
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
