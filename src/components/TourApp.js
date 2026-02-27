'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { loadPackagesFromDB, loadOptionsFromDB, loadCalculation, fetchUserRole } from '@/lib/db'
import { loadFromLS, saveToLS } from '@/lib/utils'
import { DEF_PACKAGES, DEF_OPTIONS } from '@/lib/constants'
import { useToast } from '@/lib/useToast'

import LoginPage      from './LoginPage'
import Header         from './Header'
import CalculatorPage from './CalculatorPage'
import BookingPage    from './BookingPage'
import ClientPage     from './ClientPage'
import ToastContainer from './ToastContainer'

export default function TourApp() {
  const [user,       setUser]       = useState(null)
  const [role,       setRole]       = useState(null)
  const [page,       setPage]       = useState('calculator')
  const [packages,   setPackages]   = useState(() => JSON.parse(JSON.stringify(DEF_PACKAGES)))
  const [options,    setOptions]    = useState(() => JSON.parse(JSON.stringify(DEF_OPTIONS)))
  const [clientData, setClientData] = useState(null)
  const [ready,      setReady]      = useState(false)

  const { toasts, toast } = useToast()

  // ── LOAD DB DATA ─────────────────────────────────────────────
  const loadAppData = async () => {
    try {
      const [dbPkgs, dbOpts] = await Promise.all([
        loadPackagesFromDB(),
        loadOptionsFromDB(),
      ])
      if (dbPkgs?.length) setPackages(dbPkgs)
      if (dbOpts?.length) setOptions(dbOpts)
    } catch (e) {
      console.warn('DB load error, using local data:', e.message)
    }
  }

  // ── INIT ─────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // 1. LocalStorage fallback
      const ls = loadFromLS()
      if (ls.packages?.length) setPackages(ls.packages)
      if (ls.options?.length)  setOptions(ls.options)

      // 2. Client link ?tour=...
      const params  = new URLSearchParams(window.location.search)
      const tourId  = params.get('tour')
      if (tourId) {
        // UUID from Supabase
        if (/^[0-9a-f-]{36}$/i.test(tourId)) {
          const calc = await loadCalculation(tourId)
          if (calc?.payload) {
            setClientData(calc.payload)
            setPage('client')
            setReady(true)
            return
          }
        }
        // Legacy base64
        try {
          const legacy = JSON.parse(decodeURIComponent(atob(tourId)))
          setClientData(legacy)
          setPage('client')
          setReady(true)
          return
        } catch {}
      }

      // 3. Restore Supabase session
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const r = await fetchUserRole(session.user.id)
          if (r) {
            setUser(session.user)
            setRole(r)
            await loadAppData()
          } else {
            await supabase.auth.signOut()
          }
        }
      } catch (e) {
        console.warn('Session restore failed:', e.message)
      }

      setReady(true)
    }

    init()
  }, []) // eslint-disable-line

  // ── LOGIN ─────────────────────────────────────────────────────
  const handleLogin = async (u, r) => {
    setUser(u)
    setRole(r)
    await loadAppData()
    toast('Вход выполнен: ' + ({ manager: 'Менеджер', booking: 'Операционный отдел' }[r] || r), 'ok')
  }

  // ── LOGOUT ────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setPage('calculator')
    // Reset to defaults so next user sees clean state
    setPackages(JSON.parse(JSON.stringify(DEF_PACKAGES)))
    setOptions(JSON.parse(JSON.stringify(DEF_OPTIONS)))
    toast('Вы вышли')
  }

  // ── LOADING SCREEN ────────────────────────────────────────────
  if (!ready) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#0F4C75,#1B6CA8)',
      }}>
        <div style={{ color: '#fff', fontSize: '16px', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
          🌴 Загрузка...
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Login overlay — shows when no user and not on client page */}
      {!user && page !== 'client' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {/* Header — always visible */}
      <Header role={role} page={page} onPage={setPage} onLogout={handleLogout} />

      {/* Pages */}
      {page === 'calculator' && user && (
        <CalculatorPage
          packages={packages}
          options={options}
          role={role}
          user={user}
          toast={toast}
        />
      )}

      {page === 'booking' && role === 'booking' && (
        <BookingPage
          packages={packages}
          options={options}
          onPackagesChange={p => { setPackages(p); saveToLS({ packages: p, options }) }}
          onOptionsChange={o => { setOptions(o);  saveToLS({ packages, options: o }) }}
          onPageChange={setPage}
          role={role}
          toast={toast}
        />
      )}

      {page === 'client' && (
        <ClientPage data={clientData} />
      )}

      {/* Print target — populated by doPrint() in utils.js */}
      <div id="print-area" />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} />
    </>
  )
}
