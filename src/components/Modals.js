'use client'
import { useMemo, useState } from 'react'
import { fmt, fmtDate, clipCopy } from '@/lib/utils'
import { ALL_CATS } from '@/lib/constants'

// ─── OVERLAY WRAPPER ─────────────────────────────────────────
function ModalOverlay({ onClose, children, maxWidth }) {
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="md" style={maxWidth ? { maxWidth } : {}}>
        <button className="md-x" onClick={onClose}>✕</button>
        {children}
      </div>
    </div>
  )
}

// ─── TEXT MODAL ───────────────────────────────────────────────
export function TextModal({ data, onClose, onToast }) {
  const text = useMemo(() => {
    if (!data) return ''
    const L = ['🌴 *РАСЧЁТ ТУРА — ПХАНГ НГА*', '━━━━━━━━━━━━━━━━━━━━━━']
    if (data.name) L.push('👤 Клиент: ' + data.name)
    if (data.date) L.push('📅 Дата: ' + fmtDate(data.date))
    if (data.phone) L.push('📱 Тел: ' + data.phone)
    if (data.pax) L.push('👥 Гостей: ' + data.pax)
    L.push('')

    if (data.tourName) {
      // Charter logic
      L.push('🚤 *МАРШРУТ*')
      L.push('• ' + data.tourName)
      L.push('')

      L.push('📋 *ЧТО ВКЛЮЧЕНО*')
      L.push('• 🚤 Аренда катера по маршруту')

      const items = data.items || []
      items.forEach(o => {
        let metaStr = o.meta ? ` (${o.meta.split(' × ')[0].trim()})` : '';
        L.push(`• ${o.icon || '🎯'} ${o.name}${metaStr}`)
      })
      L.push('')
    } else {
      // Calculator / Group logic
      const pkgs = (data.items || []).filter(i => i.type !== 'opt')
      const opts = (data.items || []).filter(i => i.type === 'opt')
      if (pkgs.length) {
        L.push('🚐 *ПАКЕТ*')
        pkgs.forEach(p => L.push('• ' + p.name + ' — ' + fmt(p.price) + ' ฿'))
        L.push('')
      }
      if (opts.length) {
        L.push('🎯 *ДОПОЛНИТЕЛЬНО*')
        opts.forEach(o => {
          const det = [o.aQ > 0 ? o.aQ + ' взр.' : '', o.cQ > 0 ? o.cQ + ' дет.' : ''].filter(Boolean).join(', ')
          L.push('• ' + o.name + (det ? ` (${det})` : '') + ' — ' + fmt(o.sum) + ' ฿')
        })
        L.push('')
      }
    }

    L.push('━━━━━━━━━━━━━━━━━━━━━━')
    L.push('💳 *ИТОГО: ' + fmt(data.total) + ' ฿*')
    L.push(''); L.push('_Пханг Нга Туры · Тайланд_')
    if (data.note) { L.push(''); L.push('📝 ' + data.note) }
    return L.join('\n')
  }, [data])

  return (
    <ModalOverlay onClose={onClose}>
      <div className="md-t">📱 Текст для мессенджера</div>
      <div className="text-out">{text}</div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button className="btn btn-p" style={{ flex: 1 }}
          onClick={() => clipCopy(text).then(() => onToast('Текст скопирован!', 'ok'))}>
          📋 Скопировать
        </button>
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>Закрыть</button>
      </div>
    </ModalOverlay>
  )
}

// ─── LINK MODAL ───────────────────────────────────────────────
export function LinkModal({ url, onClose, onToast }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="md-t">🔗 Ссылка для клиента</div>
      <div className="md-s">Красивая страница расчёта без возможности редактирования</div>
      <div className="link-box" style={{ display: 'flex', gap: '8px' }}>
        <input type="text" className="link-in" value={url} readOnly style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
        <button className="btn btn-p" style={{ padding: '0 16px' }}
          onClick={() => clipCopy(url).then(() => onToast('Ссылка скопирована!', 'ok'))}>
          📋
        </button>
      </div>
      <div style={{ background: '#F0FDF4', borderRadius: '7px', padding: '10px', fontSize: '10px', color: '#065F46', marginTop: '16px', border: '1px solid #A7F3D0' }}>
        ✅ Клиент увидит финальные цены. Наценки скрыты.
      </div>
    </ModalOverlay>
  )
}

// ─── ADD OPTION MODAL ─────────────────────────────────────────
const EMPTY_OPT = { name: '', mgrA: 0, mgrC: 0, netA: 0, netC: 0, cat: 'Достопримечательности', only8h: false }

export function AddOptModal({ onAdd, onClose, onToast }) {
  const [form, setForm] = useState(EMPTY_OPT)
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.name.trim()) { onToast('Введите название', 'err'); return }
    onAdd(form)
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose} maxWidth="440px">
      <div className="md-t">➕ Новая опция</div>
      <div className="md-s">Добавить экскурсию / активность</div>

      <div className="field">
        <label>Название</label>
        <input type="text" value={form.name} placeholder="Название опции..."
          onChange={e => upd('name', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div className="field"><label>Цена менедж. взр.</label><input type="number" value={form.mgrA} min="0" onChange={e => upd('mgrA', parseInt(e.target.value) || 0)} /></div>
        <div className="field"><label>Цена менедж. дет.</label><input type="number" value={form.mgrC} min="0" onChange={e => upd('mgrC', parseInt(e.target.value) || 0)} /></div>
        <div className="field"><label>Нетто взр.</label><input type="number" value={form.netA} min="0" onChange={e => upd('netA', parseInt(e.target.value) || 0)} /></div>
        <div className="field"><label>Нетто дет.</label><input type="number" value={form.netC} min="0" onChange={e => upd('netC', parseInt(e.target.value) || 0)} /></div>
      </div>

      <div className="field">
        <label>Категория</label>
        <select value={form.cat} onChange={e => upd('cat', e.target.value)}>
          {ALL_CATS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="field">
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'none' }}>
          <input type="checkbox" checked={form.only8h} style={{ width: 'auto' }}
            onChange={e => upd('only8h', e.target.checked)} />
          Только для 8-часового пакета
        </label>
      </div>

      <button className="btn btn-s" onClick={submit}>✅ Добавить</button>
    </ModalOverlay>
  )
}
