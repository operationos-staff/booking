'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { loadPackagesFromDB, loadOptionsFromDB, loadCalculation, fetchUserRole } from '@/lib/db'
import { loadFromLS, saveToLS } from '@/lib/utils'
import { DEF_PACKAGES, DEF_OPTIONS } from '@/lib/constants'
import { useToast } from '@/lib/useToast'

import AuroraBackground from './AuroraBackground'
import LoginPage from './LoginPage'
import Header from './Header'
import CalculatorPage from './CalculatorPage'
import ClientPage from './ClientPage'
import CharterPage from './CharterPage'
import ToastContainer from './ToastContainer'

export default function TourApp() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [page, setPage] = useState('calculator')
  const [packages, setPackages] = useState(() => JSON.parse(JSON.stringify(DEF_PACKAGES)))
  const [options, setOptions] = useState(() => JSON.parse(JSON.stringify(DEF_OPTIONS)))
  const [clientData, setClientData] = useState(null)
  const [ready, setReady] = useState(false)

  const { toasts, toast } = useToast()

  const loadAppData = async () => {
    try {
      const [dbPkgs, dbOpts] = await Promise.all([loadPackagesFromDB(), loadOptionsFromDB()])
      const mergeById = (source, defaults) => {
        if (!source || !source.length) return defaults
        const cleanSource = source.filter(sItem => !defaults.some(d => d.name === sItem.name && d.hours === sItem.hours && d.id !== sItem.id))
        const currentIds = new Set(cleanSource.map(item => String(item.id)))
        const missing = defaults.filter(d => !currentIds.has(String(d.id)))
        return [...cleanSource, ...missing]
      }
      setPackages(mergeById(dbPkgs, DEF_PACKAGES))
      const finalOpts = mergeById(dbOpts, DEF_OPTIONS)
      finalOpts.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      setOptions(finalOpts)
    } catch (e) {
      console.warn('DB load error, using local data:', e.message)
    }
  }

  useEffect(() => {
    const init = async () => {
      const ls = loadFromLS()
      const mergeById = (source, defaults) => {
        if (!source || !source.length) return defaults
        const cleanSource = source.filter(sItem => !defaults.some(d => d.name === sItem.name && d.hours === sItem.hours && d.id !== sItem.id))
        const currentIds = new Set(cleanSource.map(item => String(item.id)))
        const missing = defaults.filter(d => !currentIds.has(String(d.id)))
        return [...cleanSource, ...missing]
      }
      if (ls.packages?.length) {
        const mergedPkgs = mergeById(ls.packages, DEF_PACKAGES)
        setPackages(mergedPkgs)
        saveToLS({ packages: mergedPkgs, options: ls.options || DEF_OPTIONS })
      }
      if (ls.options?.length) {
        setOptions([...ls.options].sort((a, b) => a.name.localeCompare(b.name, 'ru')))
      } else {
        setOptions([...DEF_OPTIONS].sort((a, b) => a.name.localeCompare(b.name, 'ru')))
      }

      const params = new URLSearchParams(window.location.search)
      const tourId = params.get('tour')
      if (tourId) {
        if (/^[0-9a-f-]{36}$/i.test(tourId)) {
          const calc = await loadCalculation(tourId)
          if (calc?.payload) { setClientData(calc.payload); setPage('client'); setReady(true); return }
        }
        try {
          const legacy = JSON.parse(decodeURIComponent(atob(tourId)))
          setClientData(legacy); setPage('client'); setReady(true); return
        } catch { }
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const r = await fetchUserRole(session.user.id)
          if (r) { setUser(session.user); setRole(r); await loadAppData() }
          else await supabase.auth.signOut()
        }
      } catch (e) { console.warn('Session restore failed:', e.message) }

      setReady(true)
    }
    init()
  }, []) // eslint-disable-line

  const handleLogin = async (u, r) => {
    setUser(u); setRole(r); await loadAppData()
    toast('Вход выполнен: ' + ({ manager: 'Менеджер', booking: 'Операционный отдел' }[r] || r), 'ok')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setRole(null); setPage('calculator')
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
      {user && page !== 'client' && <Header role={role} page={page} onPage={setPage} onLogout={handleLogout} />}
      {page === 'calculator' && user && (
        <CalculatorPage
          packages={packages} options={options} role={role} user={user} toast={toast}
          onPackagesChange={p => { setPackages(p); saveToLS({ packages: p, options }) }}
          onOptionsChange={o => { setOptions(o); saveToLS({ packages, options: o }) }}
        />
      )}
      {page === 'client'  && <ClientPage data={clientData} />}
      {page === 'charter' && user && <CharterPage role={role} />}
      <div id="print-area" />
      <ToastContainer toasts={toasts} />
    </>
  )
}
