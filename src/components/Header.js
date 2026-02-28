'use client'

const ROLE_NAMES = { manager: 'Менеджер', booking: 'Операционный отдел' }
const ROLE_ICONS = { manager: '👤', booking: '📋' }

export default function Header({ role, page, onPage, onLogout }) {
  const isClient = page === 'client'

  return (
    <header className="header no-print">
      <div className="header-inner">
        <div className="logo" onClick={() => !isClient && onPage('calculator')}>
          <div className="logo-icon">🌴</div>
          <div>
            <div className="logo-title">Портал бронирования</div>
          </div>
        </div>

        <nav className="hnav">
          {isClient ? (
            <span style={{ fontSize: '11px', opacity: '.8' }}>📄 Расчёт тура</span>
          ) : role ? (
            <>
              <span className={`rbadge ${role === 'booking' ? 'rb' : 'rm'}`}>
                {ROLE_ICONS[role]} {ROLE_NAMES[role]}
              </span>
              <button className={`btn-nav ${page === 'calculator' ? 'btn-nav-a' : 'btn-nav-o'}`} onClick={() => onPage('calculator')}>
                🚐 Групповые туры
              </button>
              <button className={`btn-nav ${page === 'charter' ? 'btn-nav-a' : 'btn-nav-o'}`} style={{ border: '1px solid #0ea5e9', color: '#0ea5e9' }} onClick={() => onPage('charter')}>
                🚤 Чартерные яхты
              </button>
              <button className="btn-nav btn-nav-a" onClick={onLogout}>
                🚪 Выйти
              </button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
