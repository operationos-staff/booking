'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchUserRole } from '@/lib/db'

export default function LoginPage({ onLogin }) {
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const doLogin = async () => {
    if (!email || !pass) { setErr('Введите email и пароль'); return }
    setLoading(true); setErr('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) { setErr('Ошибка входа: ' + error.message); return }
      const user = data?.user
      if (!user) { setErr('Не удалось получить данные пользователя'); return }
      const role = await fetchUserRole(user.id)
      if (!role) {
        setErr('Роль не назначена. Обратитесь к администратору.')
        await supabase.auth.signOut()
        return
      }
      onLogin(user, role)
    } catch (e) {
      setErr('Ошибка: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const floats = [
    { emoji: '🛥️',  x: 8,  y: 15, size: 52, dur: 7,  delay: 0,   op: 0.55 },
    { emoji: '⛵',  x: 80, y: 18, size: 48, dur: 9,  delay: 1.5, op: 0.50 },
    { emoji: '🚤',  x: 20, y: 65, size: 46, dur: 8,  delay: 0.8, op: 0.52 },
    { emoji: '🛳️',  x: 70, y: 72, size: 58, dur: 10, delay: 2,   op: 0.45 },
    { emoji: '🚢',  x: 45, y: 5,  size: 54, dur: 6,  delay: 3,   op: 0.48 },
    { emoji: '🏝️',  x: 88, y: 52, size: 50, dur: 11, delay: 0.3, op: 0.55 },
    { emoji: '🌴',  x: 3,  y: 42, size: 46, dur: 8,  delay: 1.2, op: 0.50 },
    { emoji: '🚐',  x: 58, y: 85, size: 44, dur: 9,  delay: 2.5, op: 0.48 },
    { emoji: '🗺️',  x: 32, y: 80, size: 48, dur: 7,  delay: 1.8, op: 0.52 },
    { emoji: '⚓',  x: 65, y: 8,  size: 44, dur: 10, delay: 0.6, op: 0.50 },
    { emoji: '🐠',  x: 50, y: 50, size: 38, dur: 12, delay: 4,   op: 0.35 },
    { emoji: '🌊',  x: 15, y: 30, size: 42, dur: 9,  delay: 2.2, op: 0.40 },
  ]

  return (
    <div className="login-overlay">

      {/* ── Анимированные плавающие иконки ── */}
      {floats.map((f, idx) => (
        <div key={idx} style={{
          position: 'absolute',
          left: `${f.x}%`,
          top: `${f.y}%`,
          fontSize: `${f.size}px`,
          opacity: f.op,
          animation: `floatIcon ${f.dur}s ease-in-out ${f.delay}s infinite`,
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.3))',
          zIndex: 1,
          lineHeight: 1,
        }}>{f.emoji}</div>
      ))}

      {/* ── Орбитальные кольца ── */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        border: '1px solid rgba(245,158,11,0.18)',
        borderRadius: '50%', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'orbitSpin 30s linear infinite',
        pointerEvents: 'none', zIndex: 1,
        boxShadow: '0 0 20px rgba(245,158,11,0.05) inset',
      }} />
      <div style={{
        position: 'absolute', width: '420px', height: '420px',
        border: '1px solid rgba(245,158,11,0.14)',
        borderRadius: '50%', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'orbitSpin 20s linear infinite reverse',
        pointerEvents: 'none', zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', width: '260px', height: '260px',
        border: '1px dashed rgba(245,158,11,0.10)',
        borderRadius: '50%', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'orbitSpin 15s linear infinite',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* ── Бегущая строка внизу ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '36px', overflow: 'hidden',
        borderTop: '1px solid rgba(245,158,11,0.08)',
        display: 'flex', alignItems: 'center',
        background: 'rgba(245,158,11,0.03)',
        zIndex: 2, pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', gap: '48px',
          animation: 'tickerRun 20s linear infinite',
          whiteSpace: 'nowrap', fontSize: '11px',
          color: 'rgba(245,158,11,0.35)', fontWeight: 600,
          letterSpacing: '0.1em',
        }}>
          {['🏝 ОСТРОВ СОКРОВИЩ', '⚓ PORTAL OPERATION', '🌊 ПХУКЕТ', '💎 PREMIUM TOURS', '⛵ PHANG NGA', '🗺️ THAILAND', '🏝 ОСТРОВ СОКРОВИЩ', '⚓ PORTAL OPERATION', '🌊 ПХУКЕТ', '💎 PREMIUM TOURS', '⛵ PHANG NGA', '🗺️ THAILAND'].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      <div className="login-card" style={{ position: 'relative', zIndex: 10 }}>
        <div className="login-logo">
          <div className="login-brand-box">
            <div className="login-brand-title">ОСТРОВ<br/>СОКРОВИЩ</div>
            <div className="login-brand-sub">PORTAL OPERATION</div>
          </div>
          <p style={{ marginTop: '20px', opacity: 0.45, fontSize: '0.82rem', letterSpacing: '0.02em' }}>Войдите для доступа к порталу</p>
        </div>

        <div className="lf">
          <label>Email</label>
          <input
            type="email" value={email} autoComplete="email"
            placeholder="manager@tour.local"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doLogin()}
          />
        </div>

        <div className="lf">
          <label>Пароль</label>
          <input
            type="password" value={pass} autoComplete="current-password"
            placeholder="••••••••"
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doLogin()}
          />
        </div>

        {err && <div className="login-err">{err}</div>}

        <button className="login-btn" onClick={doLogin} disabled={loading}>
          {loading ? '⏳ Вход...' : '🔐 Войти'}
        </button>
      </div>
    </div>
  )
}
