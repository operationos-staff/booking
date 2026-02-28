'use client'
import { useState, useRef } from 'react'
import { ALL_CATS } from '@/lib/constants'
import { fmt, saveToLS } from '@/lib/utils'
import { savePackagesToDB, saveOptionsToDB } from '@/lib/db'

const EMPTY_OPT = { name: '', mgrA: 0, mgrC: 0, netA: 0, netC: 0, cat: 'Достопримечательности', only8h: false }

export default function BookingPage({ packages, options, onPackagesChange, onOptionsChange, onPageChange, role, toast }) {
  const [tab, setTab] = useState('calc')
  const [saving, setSaving] = useState(false)
  const [newOpt, setNewOpt] = useState(EMPTY_OPT)
  const nextId = useRef(Date.now())

  const updPkg = (i, key, val) => {
    const p = [...packages]; p[i] = { ...p[i], [key]: val }; onPackagesChange(p)
  }
  const updOpt = (i, key, val) => {
    const o = [...options]; o[i] = { ...o[i], [key]: val }; onOptionsChange(o)
  }
  const delOpt = id => {
    if (!confirm('Удалить опцию?')) return
    onOptionsChange(options.filter(o => String(o.id) !== String(id)))
    toast('Удалено', 'ok')
  }
  const addOpt = () => {
    if (!newOpt.name.trim()) { toast('Введите название', 'err'); return }
    onOptionsChange([...options, { ...newOpt, id: nextId.current++ }])
    setNewOpt(EMPTY_OPT)
    toast('Опция добавлена', 'ok')
  }

  const saveAll = async () => {
    saveToLS({ packages, options })
    if (role !== 'booking') { toast('Сохранено локально', 'ok'); return }
    setSaving(true)
    try {
      const [pkgOk, optOk] = await Promise.all([
        savePackagesToDB(packages),
        saveOptionsToDB(options),
      ])
      toast(`Сохранено! Пакеты: ${pkgOk}, Опции: ${optOk}`, 'ok')
    } catch (e) {
      toast('Ошибка: ' + e.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '900' }}>Настройка базы туров</h1>
          <p style={{ fontSize: '11px', color: 'var(--txl)' }}>Управление ценами, пакетами и опциями. Изменения сохраняются глобально.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-p" onClick={saveAll} disabled={saving} style={{ width: 'auto', padding: '9px 18px', background: 'var(--pr)' }}>
            {saving ? '⏳ Сохранение...' : '💾 Сохранить в Базу'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bk-tabs" style={{ marginBottom: '16px' }}>
        {[['pkgs', '🚐 Пакеты'], ['opts', '🎯 Опции'], ['addrem', '➕ Добавить / Удалить']].map(([id, label]) => (
          <button key={id} className={`bk-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── TAB: PACKAGES ── */}
      {tab === 'calc' && setTab('pkgs')}
      {tab === 'pkgs' && (
        <div className="card">
          <div className="card-h">
            <div className="card-h-icon">🚐</div>
            <div><h2>Базовые пакеты и VIP</h2><p>Редактирование цен — изменения сразу применяются в калькуляторе</p></div>
          </div>
          <div className="card-b" style={{ overflowX: 'auto' }}>
            <table className="pe" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th>#</th><th>Тип</th><th>Часы</th><th>Название</th>
                <th style={{ background: '#FEF3C7', color: '#92400E' }}>Цена менедж. ฿</th>
                <th>Нетто ฿</th><th>Прим.</th><th>Нетто детали</th><th>Доп.час</th>
              </tr></thead>
              <tbody>
                {packages.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ width: '30px', textAlign: 'center', color: 'var(--txl)', fontSize: '9px' }}>{String(p.id)}</td>
                    <td style={{ width: '60px' }}>
                      <select value={p.type} onChange={e => updPkg(i, 'type', e.target.value)}>
                        <option value="base">base</option>
                        <option value="vip">vip</option>
                      </select>
                    </td>
                    <td style={{ width: '50px' }}><input type="number" value={p.hours} onChange={e => updPkg(i, 'hours', parseInt(e.target.value) || 0)} /></td>
                    <td><input type="text" value={p.name} onChange={e => updPkg(i, 'name', e.target.value)} /></td>
                    <td style={{ width: '90px', background: '#FEF3C7' }}>
                      <input type="number" value={p.mgrPrice} style={{ borderColor: '#FDE68A', color: '#92400E' }}
                        onChange={e => updPkg(i, 'mgrPrice', parseInt(e.target.value) || 0)} />
                    </td>
                    <td style={{ width: '90px' }}><input type="number" value={p.nettoPrice} onChange={e => updPkg(i, 'nettoPrice', parseInt(e.target.value) || 0)} /></td>
                    <td><input type="text" value={p.note || ''} onChange={e => updPkg(i, 'note', e.target.value)} /></td>
                    <td><input type="text" value={p.nettoDetail || ''} onChange={e => updPkg(i, 'nettoDetail', e.target.value)} /></td>
                    <td style={{ width: '70px' }}><input type="number" value={p.extraHour || 1000} onChange={e => updPkg(i, 'extraHour', parseInt(e.target.value) || 1000)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: OPTIONS ── */}
      {tab === 'opts' && (
        <div className="card">
          <div className="card-h">
            <div className="card-h-icon">🎯</div>
            <div><h2>Цены опций</h2><p>Менеджерские и нетто-цены</p></div>
          </div>
          <div className="card-b" style={{ overflowX: 'auto' }}>
            <table className="pe" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th>#</th><th>Название</th>
                <th style={{ background: '#FEF3C7', color: '#92400E' }}>Менедж. взр.</th>
                <th style={{ background: '#FEF3C7', color: '#92400E' }}>Менедж. дет.</th>
                <th>Нетто взр.</th><th>Нетто дет.</th><th>Категория</th><th>Только 8ч</th>
              </tr></thead>
              <tbody>
                {options.map((o, i) => (
                  <tr key={o.id}>
                    <td style={{ width: '28px', textAlign: 'center', color: 'var(--txl)', fontSize: '9px' }}>{String(o.id)}</td>
                    <td><input type="text" value={o.name} onChange={e => updOpt(i, 'name', e.target.value)} /></td>
                    <td style={{ width: '70px', background: '#FEF3C7' }}><input type="number" value={o.mgrA} style={{ borderColor: '#FDE68A', color: '#92400E' }} onChange={e => updOpt(i, 'mgrA', parseInt(e.target.value) || 0)} /></td>
                    <td style={{ width: '70px', background: '#FEF3C7' }}><input type="number" value={o.mgrC} style={{ borderColor: '#FDE68A', color: '#92400E' }} onChange={e => updOpt(i, 'mgrC', parseInt(e.target.value) || 0)} /></td>
                    <td style={{ width: '70px' }}><input type="number" value={o.netA} onChange={e => updOpt(i, 'netA', parseInt(e.target.value) || 0)} /></td>
                    <td style={{ width: '70px' }}><input type="number" value={o.netC} onChange={e => updOpt(i, 'netC', parseInt(e.target.value) || 0)} /></td>
                    <td style={{ width: '130px' }}>
                      <select value={o.cat} onChange={e => updOpt(i, 'cat', e.target.value)}>
                        {ALL_CATS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ width: '50px', textAlign: 'center' }}>
                      <input type="checkbox" checked={o.only8h || false} style={{ width: 'auto' }}
                        onChange={e => updOpt(i, 'only8h', e.target.checked)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: ADD / REMOVE ── */}
      {tab === 'addrem' && (
        <>
          <div className="card">
            <div className="card-h">
              <div className="card-h-icon" style={{ background: 'linear-gradient(135deg,var(--ok),#059669)' }}>➕</div>
              <div><h2>Добавить новую опцию</h2><p>Новая экскурсия / активность</p></div>
            </div>
            <div className="card-b">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '600px' }}>
                <div className="field" style={{ gridColumn: '1/-1' }}>
                  <label>Название</label>
                  <input type="text" value={newOpt.name} placeholder="Название опции..."
                    onChange={e => setNewOpt(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="field"><label>Цена менедж. взр.</label><input type="number" value={newOpt.mgrA} min="0" onChange={e => setNewOpt(f => ({ ...f, mgrA: parseInt(e.target.value) || 0 }))} /></div>
                <div className="field"><label>Цена менедж. дет.</label><input type="number" value={newOpt.mgrC} min="0" onChange={e => setNewOpt(f => ({ ...f, mgrC: parseInt(e.target.value) || 0 }))} /></div>
                <div className="field"><label>Нетто взр.</label><input type="number" value={newOpt.netA} min="0" onChange={e => setNewOpt(f => ({ ...f, netA: parseInt(e.target.value) || 0 }))} /></div>
                <div className="field"><label>Нетто дет.</label><input type="number" value={newOpt.netC} min="0" onChange={e => setNewOpt(f => ({ ...f, netC: parseInt(e.target.value) || 0 }))} /></div>
                <div className="field">
                  <label>Категория</label>
                  <select value={newOpt.cat} onChange={e => setNewOpt(f => ({ ...f, cat: e.target.value }))}>
                    {ALL_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'none' }}>
                    <input type="checkbox" checked={newOpt.only8h} style={{ width: 'auto' }}
                      onChange={e => setNewOpt(f => ({ ...f, only8h: e.target.checked }))} />
                    Только 8ч
                  </label>
                </div>
              </div>
              <button className="btn btn-s" onClick={addOpt} style={{ width: 'auto', padding: '10px 24px', marginTop: '8px' }}>➕ Добавить опцию</button>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div className="card-h-icon" style={{ background: 'linear-gradient(135deg,var(--er),#DC2626)' }}>🗑️</div>
              <div><h2>Удалить опции</h2><p>Нажмите ✕ чтобы удалить</p></div>
            </div>
            <div className="card-b">
              {options.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--brd)' }}>
                  <button className="btn-del" onClick={() => delOpt(o.id)}>✕</button>
                  <div style={{ flex: 1, fontSize: '12px', fontWeight: '600' }}>{o.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--txl)' }}>{o.cat}{o.only8h ? ' · только 8ч' : ''}</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--pr)' }}>{fmt(o.mgrA)}/{fmt(o.mgrC)} ฿</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
