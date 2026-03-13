'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { loadPackagesFromDB, loadOptionsFromDB, loadCalculation, fetchUserRole, logActivity, loadBrandSettings, saveDisplayName } from '@/lib/db'
import { saveToLS } from '@/lib/utils'
import { DEF_PACKAGES, DEF_OPTIONS } from '@/lib/constants'
import { useToast } from '@/lib/useToast'

import AuroraBackground from './AuroraBackground'
import LoginPage from './LoginPage'
import Header from './Header'
import HubPage from './HubPage'
import CalculatorPage from './CalculatorPage'
import ClientPage from './ClientPage'
import CharterPage from './CharterPage'
import LogsPage from './LogsPage'
import CalculationsPage from './CalculationsPage'
import StatsPage from './StatsPage'
import ProfilePage from './ProfilePage'
import ToastContainer from './ToastContainer'

export default function TourApp() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [page, setPage] = useState('hub')
  const [hubCategory, setHubCategory] = useState('Групповые туры')
  const [packages, setPackages] = useState(() => JSON.parse(JSON.stringify(DEF_PACKAGES)))
  const [options, setOptions] = useState(() => JSON.parse(JSON.stringify(DEF_OPTIONS)))
  const [clientData, setClientData] = useState(null)
  const [ready, setReady] = useState(false)
  const [brandSettings, setBrandSettings] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [newCalcBadge, setNewCalcBadge] = useState(0)
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark'))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const { toasts, toast } = useToast()

  // Load data from Supabase DB - this is the SINGLE SOURCE OF TRUTH
  // DB data always takes priority; defaults are only used when DB is empty
  const loadAppData = useCallback(async () => {
    try {
      const [dbPkgs, dbOpts, dbBrand] = await Promise.all([loadPackagesFromDB(), loadOptionsFromDB(), loadBrandSettings()])
      if (dbBrand) setBrandSettings(dbBrand)

      // For packages: use DB data if available, fall back to defaults
      if (dbPkgs && dbPkgs.length) {
        setPackages(dbPkgs)
        saveToLS({ packages: dbPkgs, options: dbOpts || DEF_OPTIONS })
      } else {
        setPackages(JSON.parse(JSON.stringify(DEF_PACKAGES)))
      }

      // For options: use DB data if available, fall back to defaults
      if (dbOpts && dbOpts.length) {
        const sorted = [...dbOpts].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        setOptions(sorted)
        saveToLS({ packages: dbPkgs || DEF_PACKAGES, options: sorted })
      } else {
        setOptions([...DEF_OPTIONS].sort((a, b) => a.name.localeCompare(b.name, 'ru')))
      }
    } catch (e) {
      console.warn('DB load error, using defaults:', e.message)
      toast('Не удалось загрузить данные из базы', 'err')
      setPackages(JSON.parse(JSON.stringify(DEF_PACKAGES)))
      setOptions([...DEF_OPTIONS].sort((a, b) => a.name.localeCompare(b.name, 'ru')))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: badge for booking when new calculation saved
  useEffect(() => {
    if (!user || role !== 'booking') return
    const ch = supabase
      .channel('new_calcs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calculations' }, (payload) => {
        if (payload.new?.client_name !== '__charter_config__') {
          setNewCalcBadge(n => n + 1)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, role])

  // Realtime: notify managers when prices change
  useEffect(() => {
    if (!user || role === 'booking') return
    const channel = supabase
      .channel('price_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'packages' }, () => {
        loadAppData().then(() => toast('Цены пакетов обновлены', 'ok'))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'options' }, () => {
        loadAppData().then(() => toast('Цены опций обновлены', 'ok'))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, role, loadAppData, toast])

  useEffect(() => {
    const init = async () => {
      // Check for client tour link FIRST (no auth needed)
      const params = new URLSearchParams(window.location.search)
      const tourId = params.get('tour')
      if (tourId) {
        if (/^[0-9a-f-]{36}$/i.test(tourId)) {
          const calc = await loadCalculation(tourId)
          if (calc?.payload) { setClientData({ ...calc.payload, _savedAt: calc.payload._savedAt || calc.created_at }); setPage('client'); setReady(true); return }
        }
        try {
          const legacy = JSON.parse(decodeURIComponent(atob(tourId)))
          setClientData(legacy); setPage('client'); setReady(true); return
        } catch { }
      }

      // Try to restore session and load data from DB
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const profile = await fetchUserRole(session.user.id)
          if (profile?.role) {
            setUser(session.user)
            setRole(profile.role)
            setDisplayName(profile.display_name || '')
            await loadAppData()
          } else {
            await supabase.auth.signOut()
          }
        }
      } catch (e) { console.warn('Session restore failed:', e.message) }

      setReady(true)
    }
    init()
  }, [loadAppData])

  const handleLogin = async (u, r, dn) => {
    setUser(u); setRole(r); setDisplayName(dn || '')
    await loadAppData()
    logActivity(u.id, u.email, 'login', { role: r })
    setPage('hub')
    toast('Вход выполнен: ' + ({ manager: 'Менеджер', booking: 'Операционный отдел' }[r] || r), 'ok')
  }

  const handleLogout = async () => {
    if (user) logActivity(user.id, user.email, 'logout', { role })
    await supabase.auth.signOut()
    setUser(null); setRole(null); setPage('hub')
    setPackages(JSON.parse(JSON.stringify(DEF_PACKAGES)))
    setOptions(JSON.parse(JSON.stringify(DEF_OPTIONS)))
    toast('Вы вышли')
  }

  if (!ready) {
    return (
      <>
        <AuroraBackground />
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '40px', filter: 'drop-shadow(0 0 16px rgba(245,158,11,0.5))' }}>🌴</div>
            <div style={{
              color: '#f59e0b', fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              Загрузка...
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AuroraBackground />
      {!user && page !== 'client' && <LoginPage onLogin={handleLogin} />}
      {user && page !== 'client' && <Header role={role} page={page} onPage={(p) => { setPage(p); if (p === 'calculations') setNewCalcBadge(0) }} onLogout={handleLogout} newCalcBadge={newCalcBadge} theme={theme} onToggleTheme={toggleTheme} />}
      {page === 'hub' && user && (
        <HubPage
          packages={packages}
          role={role}
          onSelect={(cat) => {
            if (cat === 'charter') { setPage('charter'); return }
            setHubCategory(cat)
            setPage('calculator')
          }}
        />
      )}
      {page === 'calculator' && user && (
        <CalculatorPage
          packages={packages} options={options} role={role} user={user} toast={toast}
          onPackagesChange={p => { setPackages(p); saveToLS({ packages: p, options }) }}
          onOptionsChange={o => { setOptions(o); saveToLS({ packages, options: o }) }}
          onReloadData={loadAppData}
          brandSettings={brandSettings}
          defaultCategory={hubCategory}
          onPage={(p) => { setPage(p); if (p === 'calculations') setNewCalcBadge(0) }}
        />
      )}
      {page === 'client'       && <ClientPage data={clientData} />}
      {page === 'charter'      && user && <CharterPage role={role} toast={toast} user={user} brandSettings={brandSettings} onPage={(p) => setPage(p)} />}
      {page === 'logs'         && user && role === 'booking' && <LogsPage user={user} />}
      {page === 'calculations' && user && <CalculationsPage user={user} role={role} brandSettings={brandSettings} />}
      {page === 'stats'        && user && role === 'booking' && <StatsPage />}
      {page === 'profile'      && user && (
        <ProfilePage
          user={user} role={role} displayName={displayName}
          onDisplayNameChange={setDisplayName}
          onLogout={handleLogout}
          toast={toast}
        />
      )}
      <div id="print-area" />
      <ToastContainer toasts={toasts} />
    </>
  )
}
