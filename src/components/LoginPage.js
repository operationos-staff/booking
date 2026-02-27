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

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-icon">🌴</div>
          <h2>Пханг Нга Туры</h2>
          <p>Войдите для доступа к порталу</p>
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
