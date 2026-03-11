'use client'
import { useState, useRef } from 'react'
import { ALL_CATS } from '@/lib/constants'
import { fmt, saveToLS } from '@/lib/utils'
import { savePackagesToDB, saveOptionsToDB, deleteOptionFromDB } from '@/lib/db'

const EMPTY_OPT = { name: '', mgrA: 0, mgrC: 0, netA: 0, netC: 0, cat: 'Достопримечательности', only8h: false }

export default function BookingPage({ packages, options, onPackagesChange, onOptionsChange, onPageChange, role, toast, onReloadData }) {
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
  const delOpt = async (id) => {
    if (!confirm('Удалить опцию?')) return
    // Delete from DB if it has a DB id
    const opt = options.find(o => String(o.id) === String(id))
    const dbId = opt?._dbId ?? (typeof opt?.id === 'number' ? opt.id : null)
    if (dbId && role === 'booking') {
      await deleteOptionFromDB(dbId)
    }
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
      toast(`Сохранено в базу! Пакеты: ${pkgOk}, Опции: ${optOk}`, 'ok')
      // Reload data from DB to get consistent IDs and ensure all clients see the same data
      if (onReloadData) {
        await onReloadData()
      }
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
          <div className="card-b">
            {/* ── MOBILE CARDS: пакеты ── */}
            <div className="bk-cards-mobile">
              {packages.map((p, i) => (
                <div key={p.id} className="bk-card">
                  <div className="bk-card-row">
                    <span className="bk-card-label">Тип</span>
                    <select value={p.type} onChange={e => updPkg(i, 'type', e.target.value)} className="bk-card-select">
                      <option value="base">🚐 base</option>
                      <option value="vip">⭐ vip</option>
                    </select>
                  </div>
                  <div className="bk-card-row">
                    <span className="bk-card-label">Название</span>
                    <input type="text" value={p.name} onChange={e => updPkg(i, 'name', e.target.value)} className="bk-card-input" />
                  </div>
                  <div className="bk-card-row">
                    <span className="bk-card-label">Часы</span>
                    <input type="number" value={p.hours} onChange={e => updPkg(i, 'hours', parseInt(e.target.value) || 0)} className="bk-card-input bk-card-input--sm" />
                  </div>
                  <div className="bk-card-row bk-card-row--highlight">
                    <span className="bk-card-label" style={{ color: '#fbbf24' }}>Цена менедж. ฿</span>
                    <input type="number" value={p.mgrPrice} onChange={e => updPkg(i, 'mgrPrice', parseInt(e.target.value) || 0)} className="bk-card-input bk-card-input--gold" />
                  </div>
                  <div className="bk-card-row">
                    <span className="bk-card-label">Нетто ฿</span>
                    <input type="number" value={p.nettoPrice} onChange={e => updPkg(i, 'nettoPrice', parseInt(e.target.value) || 0)} className="bk-card-input bk-card-input--sm" />
                  </div>
                  <div className="bk-card-row">
                    <span className="bk-card-label">Доп.час ฿</span>
                    <input type="number" value={p.extraHour || 1000} onChange={e => updPkg(i, 'extraHour', parseInt(e.target.value) || 1000)} className="bk-card-input bk-card-input--sm" />
                  </div>
                  <div className="bk-card-row">
                    <span className="bk-card-label">Примечание</span>
                    <input type="text" value={p.note || ''} onChange={e => updPkg(i, 'note', e.target.value)} className="bk-card-input" />
                  </div>
                </div>
              ))}
            </div>
            {/* ── DESKTOP TABLE: пакеты ── */}
            <div className="bk-table-desktop" style={{ overflowX: 'auto' }}>
            <table className="pe" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th>#</th><th>Тип</th><th>Часы</th><th>Название</th>
                <th style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>Цена менедж. ฿</th>
                <th>Нетто ฿</th><th>Прим.</th><th>Нетто детали</th><th>Доп.час</th>
              </tr></thead>
              <tbody>
                {packages.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ width: '30px', textAlign: 'center', color: 'var(--txl)', fontSize: '9px' }}>{String(p.id)}</td>
                    <td style={{ width: '90px' }}>
                      <select value={p.type} onChange={e => updPkg(i, 'type', e.target.value)}>
                        <option value="base">base</option>
                        <option value="vip">vip</option>
                      </select>
                    </td>
                    <td style={{ width: '50px' }}><input type="number" value={p.hours} onChange={e => updPkg(i, 'hours', parseInt(e.target.value) || 0)} /></td>
                    <td><input type="text" value={p.name} onChange={e => updPkg(i, 'name', e.target.value)} /></td>
                    <td style={{ width: '90px', background: 'rgba(245,158,11,0.1)' }}>
                      <input type="number" value={p.mgrPrice} style={{ borderColor: 'rgba(245,158,11,0.5)', color: '#fbbf24', background: 'rgba(245,158,11,0.08)', fontWeight: 800 }}
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
        </div>
      )}

      {/* ── TAB: OPTIONS ── */}
      {tab === 'opts' && (
        <div className="card">
          <div className="card-h">
            <div className="card-h-icon">🎯</div>
            <div><h2>Цены опций</h2><p>Менеджерские и нетто-цены</p></div>
          </div>
          <div className="card-b">
            {/* ── MOBILE CARDS: опции ── */}
            <div className="bk-cards-mobile">
              {options.map((o, i) => (
                <div key={o.id} className="bk-card">
                  <div className="bk-card-row">
                    <span className="bk-card-label">Название</span>
                    <input type="text" value={o.name} onChange={e => updOpt(i, 'name', e.target.value)} className="bk-card-input" />
                  </div>
                  <div className="bk-card-grid">
                    <div className="bk-card-row bk-card-row--highlight">
                      <span className="bk-card-label" style={{ color: '#fbbf24' }}>Менедж. взр.</span>
                      <input type="number" value={o.mgrA} onChange={e => updOpt(i, 'mgrA', parseInt(e.target.value) || 0)} className="bk-card-input bk-card-input--gold" />
                    </div>
                    <div className="bk-card-row bk-card-row--highlight">
                      <span className="bk-card-label" style={{ color: '#fbbf24' }}>Менедж. дет.</span>
                      <input type="number" value={o.mgrC} onChange={e => updOpt(i, 'mgrC', parseInt(e.target.value) || 0)} className="bk-card-input bk-card-input--gold" />
                    </div>
                    <div className="bk-card-row">
                      <span className="bk-card-label">Нетто взр.</span>
                      <input type="number" value={o.netA} onChange={e => updOpt(i, 'netA', parseInt(e.target.value) || 0)} className="bk-card-input bk-card-input--sm" />
                    </div>
                    <div className="bk-card-row">
                      <span className="bk-card-label">Нетто дет.</span>
                      <input type="number" value={o.netC} onChange={e => updOpt(i, 'netC', parseInt(e.target.value) || 0)} className="bk-card-input bk-card-input--sm" />
                    </div>
                  </div>
                  <div className="bk-card-row">
                    <span className="bk-card-label">Категория</span>
                    <select value={o.cat} onChange={e => updOpt(i, 'cat', e.target.value)} className="bk-card-select">
                      {ALL_CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="bk-card-row">
                    <span className="bk-card-label">Только 8ч</span>
                    <input type="checkbox" checked={o.only8h || false} onChange={e => updOpt(i, 'only8h', e.target.checked)} style={{ width: 'auto', accentColor: 'var(--primary)' }} />
                  </div>
                </div>
              ))}
            </div>
            {/* ── DESKTOP TABLE: опции ── */}
            <div className="bk-table-desktop" style={{ overflowX: 'auto' }}>
            <table className="pe" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th>#</th><th>Название</th>
                <th style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>Менедж. взр.</th>
                <th style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>Менедж. дет.</th>
                <th>Нетто взр.</th><th>Нетто дет.</th><th>Категория</th><th>Только 8ч</th>
              </tr></thead>
              <tbody>
                {options.map((o, i) => (
                  <tr key={o.id}>
                    <td style={{ width: '28px', textAlign: 'center', color: 'var(--txl)', fontSize: '9px' }}>{String(o.id)}</td>
                    <td><input type="text" value={o.name} onChange={e => updOpt(i, 'name', e.target.value)} /></td>
                    <td style={{ width: '70px', background: 'rgba(245,158,11,0.1)' }}><input type="number" value={o.mgrA} style={{ borderColor: 'rgba(245,158,11,0.5)', color: '#fbbf24', background: 'rgba(245,158,11,0.08)', fontWeight: 800 }} onChange={e => updOpt(i, 'mgrA', parseInt(e.target.value) || 0)} /></td>
                    <td style={{ width: '70px', background: 'rgba(245,158,11,0.1)' }}><input type="number" value={o.mgrC} style={{ borderColor: 'rgba(245,158,11,0.5)', color: '#fbbf24', background: 'rgba(245,158,11,0.08)', fontWeight: 800 }} onChange={e => updOpt(i, 'mgrC', parseInt(e.target.value) || 0)} /></td>
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
