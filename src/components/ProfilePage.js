'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { saveDisplayName } from '@/lib/db'

export default function ProfilePage({ user, role, displayName, onDisplayNameChange, onLogout, toast }) {
  const [name, setName]         = useState(displayName || '')
  const [savingName, setSavingName] = useState(false)

  const [curPass, setCurPass]   = useState('')
  const [newPass, setNewPass]   = useState('')
  const [confPass, setConfPass] = useState('')
  const [savingPass, setSavingPass] = useState(false)

  const ROLE_LABELS = { manager: 'Менеджер', booking: 'Операционный отдел' }

  const saveProfile = async () => {
    setSavingName(true)
    const ok = await saveDisplayName(user.id, name.trim())
    setSavingName(false)
    if (ok) { onDisplayNameChange(name.trim()); toast('Имя сохранено', 'ok') }
    else toast('Ошибка сохранения', 'err')
  }

  const changePassword = async () => {
    if (!newPass || newPass.length < 6) { toast('Минимум 6 символов', 'err'); return }
    if (newPass !== confPass)           { toast('Пароли не совпадают', 'err'); return }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setSavingPass(false)
    if (error) { toast('Ошибка: ' + error.message, 'err'); return }
    toast('Пароль обновлён', 'ok')
    setCurPass(''); setNewPass(''); setConfPass('')
  }

  const signOutAll = async () => {
    if (!confirm('Выйти из всех устройств?')) return
    await supabase.auth.signOut({ scope: 'global' })
    onLogout()
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '100px', paddingLeft: '16px', paddingRight: '16px', maxWidth: '560px', margin: '0 auto' }}>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f59e0b', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>👤 Профиль</h1>
        <p style={{ color: '#64748b', fontSize: '13px' }}>{user.email} · {ROLE_LABELS[role] || role}</p>
      </div>

      {/* Display name */}
      <div style={card}>
        <div style={cardTitle}>Отображаемое имя</div>
        <p style={hint}>Видно в логах и расчётах вместо email</p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input
            type="text"
            value={name}
            maxLength={40}
            placeholder="Например: Анна М."
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
          <button onClick={saveProfile} disabled={savingName} style={btnPrimary}>
            {savingName ? '...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div style={card}>
        <div style={cardTitle}>Сменить пароль</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          <input
            type="password" placeholder="Новый пароль (мин. 6 символов)"
            value={newPass} onChange={e => setNewPass(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password" placeholder="Подтвердите новый пароль"
            value={confPass} onChange={e => setConfPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && changePassword()}
            style={inputStyle}
          />
          <button onClick={changePassword} disabled={savingPass} style={btnPrimary}>
            {savingPass ? '⏳ Сохранение...' : '🔑 Обновить пароль'}
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div style={card}>
        <div style={cardTitle}>🔒 Безопасность</div>
        <p style={hint}>Выйти из аккаунта на всех устройствах, где вы авторизованы</p>
        <button onClick={signOutAll} style={{ ...btnDanger, marginTop: '12px' }}>
          Выйти из всех сессий
        </button>
      </div>
    </div>
  )
}

const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  padding: '20px',
  marginBottom: '16px',
}

const cardTitle = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#e5e5e5',
  marginBottom: '4px',
}

const hint = {
  fontSize: '12px',
  color: '#475569',
}

const inputStyle = {
  flex: 1,
  padding: '9px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#e5e5e5',
  outline: 'none',
  fontSize: '13px',
}

const btnPrimary = {
  padding: '9px 18px',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  background: 'rgba(245,158,11,0.2)',
  color: '#f59e0b',
  fontWeight: 700,
  fontSize: '13px',
  whiteSpace: 'nowrap',
}

const btnDanger = {
  padding: '9px 18px',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  background: 'rgba(248,113,113,0.15)',
  color: '#f87171',
  fontWeight: 700,
  fontSize: '13px',
}
