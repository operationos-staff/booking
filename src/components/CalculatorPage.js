'use client'
import { useState, useMemo, useCallback } from 'react'
import { CAT_ICONS, CAT_COLORS } from '@/lib/constants'
import { fmt, fmtDate, todayISO, computeCalc, buildClientData, doPrint, clipCopy } from '@/lib/utils'
import { saveCalculation } from '@/lib/db'
import { TextModal, LinkModal, AddOptModal } from './Modals'
import BookingPage from './BookingPage'
import styles from './Portal.module.css'

// ─── OPTIONS TABLE ─────────────────────────────────────────────
function OptionsTable({ options, isBk, qty, optMk, avIds, onSetQ, onSetMk }) {
  return (
    <div className={styles.tblWrapper}>
      {/* ── MOBILE CARDS ── */}
      <div className="opt-cards-mobile">
        {options.map(o => {
          const key = String(o.id)
          if (!avIds.has(key)) return null
          const q = qty[key] || { a: 0, c: 0 }
          const mk = optMk[key] || { a: 0, c: 0 }
          const has = (q.a || 0) + (q.c || 0) > 0
          const [bg, fg] = CAT_COLORS[o.cat] || ['#f1f5f9', '#64748b']
          const costA = (q.a || 0) * o.netA
          const costC = (q.c || 0) * o.netC
          const costSum = costA + costC
          const clientSum = (q.a || 0) * (o.netA + (mk.a || 0)) + (q.c || 0) * (o.netC + (mk.c || 0))
          const mgrSum = (q.a || 0) * o.mgrA + (q.c || 0) * o.mgrC
          return (
            <div key={o.id} className={`opt-card${has ? ' opt-card--active' : ''}`}>
              <div className="opt-card-header">
                <div className="opt-card-name">{o.name}</div>
                <span className="opt-card-cat" style={{ background: bg, color: fg }}>
                  {CAT_ICONS[o.cat] || ''} {o.cat}
                </span>
              </div>
              {o.special && <div className="opt-card-special">⚠️ {o.special}</div>}
              <div className="opt-card-inputs">
                <label className="opt-card-label">
                  <span>Взр.</span>
                  <input type="number" min="0" max="99" className="opt-card-input"
                    value={q.a || ''} placeholder="0"
                    onChange={e => onSetQ(key, 'a', e.target.value)} />
                  {!isBk && <span className="opt-card-price">× {o.mgrA > 0 ? fmt(o.mgrA) : 'FREE'}฿</span>}
                  {isBk && <span className="opt-card-price">× {o.netA > 0 ? fmt(o.netA) : 'FREE'}฿</span>}
                </label>
                <label className="opt-card-label">
                  <span>Дет.</span>
                  <input type="number" min="0" max="99" className="opt-card-input"
                    value={q.c || ''} placeholder="0"
                    onChange={e => onSetQ(key, 'c', e.target.value)} />
                  {!isBk && <span className="opt-card-price">× {o.mgrC > 0 ? fmt(o.mgrC) : 'FREE'}฿</span>}
                  {isBk && <span className="opt-card-price">× {o.netC > 0 ? fmt(o.netC) : 'FREE'}฿</span>}
                </label>
              </div>
              {isBk && (
                <div className="opt-card-mk">
                  <span className="opt-card-mk-label">+Наценка В/Д:</span>
                  <input type="number" min="0" className="opt-card-input opt-card-input--mk"
                    value={mk.a || ''} placeholder="0"
                    onChange={e => onSetMk(key, 'a', e.target.value)} />
                  <input type="number" min="0" className="opt-card-input opt-card-input--mk"
                    value={mk.c || ''} placeholder="0"
                    onChange={e => onSetMk(key, 'c', e.target.value)} />
                </div>
              )}
              <div className="opt-card-total">
                {isBk
                  ? <><span>Себест.: <b>{costSum > 0 ? fmt(costSum) : '—'}฿</b></span><span className="opt-card-client">Клиент: <b>{clientSum > 0 ? fmt(clientSum) : '—'}฿</b></span></>
                  : <span>Итого: <b style={{ color: mgrSum > 0 ? 'var(--primary)' : 'var(--muted)' }}>{mgrSum > 0 ? fmt(mgrSum) : '—'}฿</b></span>
                }
              </div>
            </div>
          )
        })}
      </div>
      {/* ── DESKTOP TABLE ── */}
      <table className={`${styles.tbl} opt-table-desktop`}>
        <thead>
          <tr>
            <th>Опция</th>
            <th style={{ textAlign: 'center', width: '60px' }}>Взр.</th>
            <th style={{ textAlign: 'center', width: '60px' }}>Дет.</th>
            {isBk ? (
              <>
                <th style={{ textAlign: 'right' }}>Нетто В/Д</th>
                <th className="mk" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', textAlign: 'center' }}>+Нац.</th>
                <th style={{ textAlign: 'right' }}>Себест.</th>
                <th className="fn" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', textAlign: 'right' }}>Клиент</th>
              </>
            ) : (
              <>
                <th style={{ textAlign: 'right' }}>Цена В/Д</th>
                <th style={{ textAlign: 'right' }}>Сумма</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {options.map(o => {
            const key = String(o.id)
            if (!avIds.has(key)) return null
            const q = qty[key] || { a: 0, c: 0 }
            const mk = optMk[key] || { a: 0, c: 0 }
            const has = (q.a || 0) + (q.c || 0) > 0
            const [bg, fg] = CAT_COLORS[o.cat] || ['#f1f5f9', '#64748b']
            const costA = (q.a || 0) * o.netA
            const costC = (q.c || 0) * o.netC
            const costSum = costA + costC
            const clientSum = (q.a || 0) * (o.netA + (mk.a || 0)) + (q.c || 0) * (o.netC + (mk.c || 0))
            const mgrSum = (q.a || 0) * o.mgrA + (q.c || 0) * o.mgrC

            return (
              <tr key={o.id} style={{ background: has ? 'rgba(16,185,129,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-dark)' }}>{o.name}</div>
                  <span style={{ background: bg, color: fg, display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>
                    {CAT_ICONS[o.cat] || ''} {o.cat}
                  </span>
                  {o.special && <div style={{ fontSize: '0.75rem', color: 'var(--warn)', marginTop: '4px' }}>⚠️ {o.special}</div>}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input type="number" min="0" max="99" style={{ width: '48px', padding: '6px', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center', outline: 'none' }}
                    value={q.a || ''} placeholder="0"
                    onChange={e => onSetQ(key, 'a', e.target.value)} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input type="number" min="0" max="99" style={{ width: '48px', padding: '6px', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center', outline: 'none' }}
                    value={q.c || ''} placeholder="0"
                    onChange={e => onSetQ(key, 'c', e.target.value)} />
                </td>
                {isBk ? (
                  <>
                    <td style={{ textAlign: 'right', fontSize: '0.81rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ display: 'flex', gap: '8px', color: 'var(--pri)', fontWeight: 700 }}>
                          <span style={{ color: o.netA === 0 ? 'var(--ok)' : 'inherit' }}><span style={{ fontSize: '0.65rem', color: 'var(--txl)', marginRight: '2px' }}>взр:</span>{o.netA > 0 ? fmt(o.netA) : 'FREE'}</span>
                          <span style={{ color: o.netC === 0 ? 'var(--ok)' : 'inherit' }}><span style={{ fontSize: '0.65rem', color: 'var(--txl)', marginRight: '2px' }}>дет:</span>{o.netC > 0 ? fmt(o.netC) : 'FREE'}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ background: 'rgba(245,158,11,0.06)', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <input type="number" min="0" style={{ width: '46px', padding: '4px', border: '1.5px solid rgba(245,158,11,0.4)', borderRadius: '6px', textAlign: 'center', outline: 'none', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }} value={mk.a || ''} placeholder="0" onChange={e => onSetMk(key, 'a', e.target.value)} />
                        <input type="number" min="0" style={{ width: '46px', padding: '4px', border: '1.5px solid rgba(245,158,11,0.4)', borderRadius: '6px', textAlign: 'center', outline: 'none', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }} value={mk.c || ''} placeholder="0" onChange={e => onSetMk(key, 'c', e.target.value)} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: costSum === 0 ? 'var(--muted)' : 'var(--pri)' }}>{costSum > 0 ? fmt(costSum) : '—'}</td>
                    <td style={{ background: 'rgba(16,185,129,0.06)', textAlign: 'right', fontWeight: 800, color: clientSum === 0 ? 'var(--muted)' : 'var(--ok)' }}>{clientSum > 0 ? fmt(clientSum) : '—'}</td>
                  </>
                ) : (
                  <>
                    <td style={{ textAlign: 'right', fontSize: '0.81rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', color: 'var(--pri)', fontWeight: 700 }}>
                        <span style={{ color: o.mgrA === 0 ? 'var(--ok)' : 'inherit' }}><span style={{ fontSize: '0.65rem', color: 'var(--txl)', marginRight: '2px' }}>взр:</span>{o.special ? '⚠️' : (o.mgrA > 0 ? fmt(o.mgrA) : 'FREE')}</span>
                        <span style={{ color: o.mgrC === 0 ? 'var(--ok)' : 'inherit' }}><span style={{ fontSize: '0.65rem', color: 'var(--txl)', marginRight: '2px' }}>дет:</span>{o.special ? '' : (o.mgrC > 0 ? fmt(o.mgrC) : 'FREE')}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: mgrSum === 0 ? 'var(--muted)' : 'var(--pri)' }}>{mgrSum > 0 ? fmt(mgrSum) : '—'}</td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function CalculatorPage({ packages, options, role, user, toast, onPackagesChange, onOptionsChange, onReloadData, brandSettings }) {
  const isBk = role === 'booking'
  const [activeTab, setActiveTab] = useState('calc')

  const [selBase, setSelBase] = useState(null)
  const [qty, setQty] = useState({})
  const [optMk, setOptMk] = useState({})
  const [cat, setCat] = useState('all')
  const [pkgMkB, setPkgMkB] = useState(0)
  const [pkgMkP, setPkgMkP] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [client, setClient] = useState({ name: '', date: todayISO(), phone: '', note: '' })
  const [modal, setModal] = useState(null) // 'text' | 'link' | 'addOpt'
  const [shareUrl, setShareUrl] = useState('')

  const calc = useMemo(() =>
    computeCalc({ packages, options, selBase, qty, optMk, isBk, pkgMkB, pkgMkP }),
    [packages, options, selBase, qty, optMk, isBk, pkgMkB, pkgMkP]
  )

  // Select / deselect package
  const selPkg = id => {
    const key = String(id)
    if (selBase !== null && String(selBase) === key) {
      setSelBase(null)
    } else {
      setSelBase(key)
      const act = packages.find(p => String(p.id) === key)
      const hours = act ? act.hours : 8
      const avIds = new Set(options.filter(o => hours === 8 || !o.only8h).map(o => String(o.id)))
      setQty(q => {
        const nq = { ...q }
        Object.keys(nq).forEach(k => { if (!avIds.has(k)) delete nq[k] })
        return nq
      })
    }
  }

  const setQ = useCallback((key, t, v) => setQty(q => ({ ...q, [key]: { ...(q[key] || { a: 0, c: 0 }), [t]: Math.max(0, parseInt(v) || 0) } })), [])
  const setMk = useCallback((key, t, v) => setOptMk(m => ({ ...m, [key]: { ...(m[key] || { a: 0, c: 0 }), [t]: Math.max(0, parseInt(v) || 0) } })), [])

  const resetAll = () => {
    setSelBase(null); setQty({}); setOptMk({})
    setPkgMkB(0); setPkgMkP(0)
    setClient({ name: '', date: todayISO(), phone: '', note: '' })
    toast('Сброшено')
  }

  const getClientData = () => buildClientData({ calc, isBk, client, brand: brandSettings })

  const genLink = async () => {
    const d = getClientData()
    if (!d) { toast('Выберите пакет', 'err'); return }
    let url
    if (user) {
      const calcId = await saveCalculation(user.id, d.name || '', d.date || null, d)
      if (calcId) url = `${location.origin}${location.pathname}?tour=${calcId}`
    }
    if (!url) url = `${location.origin}${location.pathname}?tour=${btoa(encodeURIComponent(JSON.stringify(d)))}`
    setShareUrl(url)
    setModal('link')
    clipCopy(url).then(() => toast('Ссылка скопирована!', 'ok'))

    // Telegram notification for booking role
    if (brandSettings?.tg_chat_id && d) {
      const pkg = d.items?.[0]?.name || ''
      const msg = `📋 <b>Новый расчёт</b>\n👤 ${d.name || 'Клиент не указан'}\n🚐 ${pkg}\n📅 ${d.date || '—'}\n💰 ${(d.total || 0).toLocaleString('ru-RU')} ฿\n🔗 <a href="${url}">Открыть расчёт</a>`
      fetch('/api/notify-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, chatId: brandSettings.tg_chat_id }),
      }).catch(() => {})
    }
  }

  const cats = ['all', ...new Set(options.map(o => o.cat))]
  const avOpts = options.filter(o => calc.avIds.has(String(o.id)))
  const filteredOpts = (cat === 'all' ? [...avOpts] : avOpts.filter(o => o.cat === cat))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  const is5 = selBase !== null && calc.act && calc.act.hours < 8

  // Filter packages based on search
  const filteredPackages = packages.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.type.toLowerCase().includes(searchQuery.toLowerCase()))
  const bases = filteredPackages.filter(p => p.type === 'base')
  const vips = filteredPackages.filter(p => p.type === 'vip')

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── TOP NAV FOR ADMINS ── */}
      {isBk && (
        <div style={{ padding: '20px 24px 0', borderBottom: '2px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'calc' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('calc')}
              style={{
                padding: '10px 20px', borderRadius: '12px 12px 0 0', border: '1px solid var(--border)', borderBottom: 'none', background: activeTab === 'calc' ? 'var(--card)' : 'transparent', fontWeight: 800, color: activeTab === 'calc' ? 'var(--pri)' : 'var(--txl)', cursor: 'pointer', transition: 'all 0.2s', borderBottom: activeTab === 'calc' ? '2px solid var(--card)' : 'none', marginBottom: activeTab === 'calc' ? '-2px' : '0'
              }}
            >
              🧮 Расчет туров
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'admin' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('admin')}
              style={{
                padding: '10px 20px', borderRadius: '12px 12px 0 0', border: '1px solid var(--border)', borderBottom: 'none', background: activeTab === 'admin' ? 'var(--card)' : 'transparent', fontWeight: 800, color: activeTab === 'admin' ? 'var(--pri)' : 'var(--txl)', cursor: 'pointer', transition: 'all 0.2s', borderBottom: activeTab === 'admin' ? '2px solid var(--card)' : 'none', marginBottom: activeTab === 'admin' ? '-2px' : '0'
              }}
            >
              ⚙️ Настройка
            </button>
          </div>
        </div>
      )}

      {activeTab === 'admin' ? (
        <div style={{ padding: '20px', minHeight: 'calc(100vh - 120px)' }}>
          <BookingPage
            packages={packages} options={options}
            onPackagesChange={onPackagesChange} onOptionsChange={onOptionsChange}
            onPageChange={() => setActiveTab('calc')}
            role={role} toast={toast}
            onReloadData={onReloadData}
          />
        </div>
      ) : (
        <div className={styles.container}>
          {/* ── LEFT SIDEBAR (Master) ── */}
          <aside className={styles.sidebar}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}><span>🚐</span> Пакеты туров</div>
              <input type="text" className={styles.searchInput} placeholder="Поиск пакета..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className={styles.tourList}>
              {bases.length > 0 && <div className="pkg-group-label" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', margin: '8px 0 4px 8px' }}>Стандарт (Минивэн)</div>}
              {bases.map(p => {
                const isSel = String(selBase) === String(p.id)
                const price = isBk ? p.nettoPrice : p.mgrPrice
                return (
                  <div key={p.id} className={`${styles.tourItem} ${isSel ? styles.active : ''}`} onClick={() => selPkg(p.id)}>
                    <div className={styles.tourIcon}>{p.hours >= 8 ? '🕗' : '🕐'}</div>
                    <div className={styles.tourInfo}>
                      <div className={styles.tourName}>{p.name}</div>
                      <div className={styles.tourPrice}>От: <span>{fmt(price)} ฿</span></div>
                    </div>
                  </div>
                )
              })}

              {vips.length > 0 && <div className="pkg-group-label" style={{ fontSize: '10px', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', margin: '16px 0 4px 8px' }}>VIP Тойота Альфард</div>}
              {vips.map(p => {
                const isSel = String(selBase) === String(p.id)
                const price = isBk ? p.nettoPrice : p.mgrPrice
                return (
                  <div key={p.id} className={`${styles.tourItem} ${isSel ? styles.active : ''}`} onClick={() => selPkg(p.id)} style={isSel ? { borderColor: '#d4af37', background: 'rgba(212,175,55,0.12)' } : {}}>
                    <div className={styles.tourIcon}>⭐</div>
                    <div className={styles.tourInfo}>
                      <div className={styles.tourName}>{p.name}</div>
                      <div className={styles.tourPrice}>От: <span>{fmt(price)} ฿</span></div>
                    </div>
                  </div>
                )
              })}

              {filteredPackages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>Не найдено</div>}
            </div>
          </aside>

          {/* ── MAIN PANEL (Detail) ── */}
          <main className={styles.mainPanel}>
            {!calc.act ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIco}>🚐</div>
                <h3>Пакет не выбран</h3>
                <p>Пожалуйста, выберите групповой пакет из боковой панели для кастомизации.</p>
              </div>
            ) : (
              <div className={styles.mainLayout}>
                {/* Left Column in Main: Client Info & Options */}
                <div>
                  {/* CLIENT INFO */}
                  <div className={styles.card}>
                    <div className={styles.cardTitle}><span>👤</span> Информация о клиенте</div>
                    <div className="client-form-grid" style={{ gap: '16px' }}>
                      <div className={styles.fg}><label>Имя</label><input type="text" value={client.name} placeholder="Иван Иванов" onChange={e => setClient(c => ({ ...c, name: e.target.value }))} /></div>
                      <div className={styles.fg}><label>Дата тура</label><input type="date" value={client.date} onChange={e => setClient(c => ({ ...c, date: e.target.value }))} /></div>
                      <div className={styles.fg}><label>Телефон / WhatsApp</label><input type="text" value={client.phone} placeholder="+66 XX XXX XXXX" onChange={e => setClient(c => ({ ...c, phone: e.target.value }))} /></div>
                      <div className={styles.fg}><label>Примечание</label><input type="text" value={client.note} placeholder="Пожелания..." onChange={e => setClient(c => ({ ...c, note: e.target.value }))} /></div>
                    </div>
                  </div>

                  {/* PACKAGE DETAILS FOR BOOKING (MARKUPS) */}
                  {isBk && (
                    <div className={styles.card} style={{ borderColor: 'var(--warn)', background: 'rgba(245,158,11,0.06)' }}>
                      <div className={styles.cardTitle}><span>💰</span> Настройка наценки на пакет</div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div className={styles.fg} style={{ flex: 1 }}>
                          <label>Фиксированная: ฿</label>
                          <input type="number" value={pkgMkB} min="0" onChange={e => setPkgMkB(parseInt(e.target.value) || 0)} />
                        </div>
                        <div className={styles.fg} style={{ flex: 1 }}>
                          <label>Процентная: %</label>
                          <input type="number" value={pkgMkP} min="0" max="200" onChange={e => setPkgMkP(parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                      <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#fbbf24', padding: '12px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)' }}>
                        <b>📊 Расклад базы:</b> {calc.act.nettoDetail} = <b>{fmt(calc.act.nettoPrice)} ฿</b><br />
                        РПЦ менеджера: {fmt(calc.act.mgrPrice)} ฿ (встроено {fmt(calc.act.mgrPrice - calc.act.nettoPrice)} ฿ маржи)
                      </div>
                    </div>
                  )}

                  {/* OPTIONS MATRIX */}
                  <div className={styles.card}>
                    <div className={styles.cardTitleFlex}>
                      <div className={styles.cardTitle} style={{ borderBottom: 'none', marginBottom: 0 }}>
                        <span>🎯</span> Дополнительные опции
                      </div>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                      {isBk ? <span>Установите количество и желтую наценку.</span> : <span>Укажите количество взрослых и детей</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      {cats.map(c => (
                        <button key={c} onClick={() => setCat(c)} className={`${styles.btn} ${styles.btnSm}`} style={{ background: cat === c ? 'var(--pri)' : 'rgba(255,255,255,0.04)', color: cat === c ? '#000' : 'var(--txl)', border: '1px solid var(--border)', borderRadius: '20px' }}>
                          {c === 'all' ? '🌐 Все' : (CAT_ICONS[c] || '') + ' ' + c}
                        </button>
                      ))}
                    </div>

                    <OptionsTable options={filteredOpts} isBk={isBk} qty={qty} optMk={optMk} avIds={calc.avIds} onSetQ={setQ} onSetMk={setMk} />

                    {is5 && (
                      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(245,158,11,0.1)', borderRadius: '10px', fontSize: '0.85rem', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                        ⏱️ <b>Пакет 5 часов:</b> Некоторые опции исключены из списка. Выберите 8 часов для полного списка.
                      </div>
                    )}
                    {isBk && (
                      <div style={{ marginTop: '20px' }}>
                        <button className={`${styles.btn} ${styles.btnOk} ${styles.btnSm}`} onClick={() => setModal('addOpt')}>➕ Добавить кастомную опцию</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column in Main: Sticky Quote */}
                <div>
                  <div className={styles.resBox}>
                    <div className={styles.resHeader}>
                      <span>🧾 Смета: {calc.act.name}</span>
                    </div>

                    {/* Internal Bookings view */}
                    {isBk ? (
                      <>
                        <div className={styles.rr}><div>Пакет нетто</div><div className={styles.rrVal}>{fmt(calc.pkgNet)} ฿</div></div>
                        {calc.pkgMkCalc > 0 && <div className={styles.rr}><div>Наценка на пакет</div><div className={styles.rrVal} style={{ color: 'var(--warn)' }}>+{fmt(calc.pkgMkCalc)} ฿</div></div>}
                        <div className={styles.rr}><div>Опции нетто</div><div className={styles.rrVal}>{fmt(calc.optNet)} ฿</div></div>
                        {calc.optMkT > 0 && <div className={styles.rr}><div>Наценка на опции</div><div className={styles.rrVal} style={{ color: 'var(--warn)' }}>+{fmt(calc.optMkT)} ฿</div></div>}
                        <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.2)', margin: '10px 0' }}></div>
                        <div className={styles.rr}><div>Общая Себестоимость</div><div className={styles.rrVal}>{fmt(calc.pkgNet + calc.optNet)} ฿</div></div>
                        <div className={styles.rr}><div>Общая Доп. Наценка</div><div className={styles.rrVal} style={{ color: 'var(--warn)' }}>+{fmt(calc.pkgMkCalc + calc.optMkT)} ฿</div></div>
                        <div className={styles.rr} style={{ color: 'var(--ok)', fontWeight: 800 }}><div>Базовая маржа пакета</div><div className={styles.rrVal}>+{fmt(calc.pkgMgr - calc.pkgNet)} ฿</div></div>
                      </>
                    ) : (
                      /* Manager View */
                      <>
                        <div className={styles.rr}><div>{calc.act.type === 'vip' ? '⭐' : '🚐'} Пакет аренды</div><div className={styles.rrVal}>{fmt(calc.pkgMgr)} ฿</div></div>
                        {calc.optMgrT > 0 && <div className={styles.rr}><div>🎯 Выбранные опции</div><div className={styles.rrVal}>+ {fmt(calc.optMgrT)} ฿</div></div>}
                      </>
                    )}

                    <div className={`${styles.rr} ${styles.rrTot}`}>
                      <div>К ОПЛАТЕ:</div>
                      <div>{fmt(calc.totalClient)} ฿</div>
                    </div>

                    {/* Selected options list for quick preview */}
                    <div style={{ marginTop: '24px', background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '8px' }}>Выбранные позиции</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontWeight: 600 }}>{calc.act.type === 'vip' ? '⭐' : '🚐'} {calc.act.name}</div>
                        <div style={{ fontWeight: 700 }}>{fmt(isBk ? calc.pkgNet + calc.pkgMkCalc : calc.pkgMgr)} ฿</div>
                      </div>
                      {(calc.selOpts || []).map(o => {
                        const det = [o.q.a > 0 ? o.q.a + ' взр.' : '', o.q.c > 0 ? o.q.c + ' дет.' : ''].filter(Boolean).join(', ')
                        return (
                          <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{CAT_ICONS[o.cat] || '•'} {o.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>{det}</div>
                            </div>
                            <div style={{ fontWeight: 700 }}>{fmt(isBk ? o.client : o.mgr)} ฿</div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
                      <button className={`${styles.btn} ${styles.btnGh}`} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }} onClick={() => doPrint(getClientData())}>🖨️ Печать PDF</button>
                      <button className={`${styles.btn} ${styles.btnAcc}`} onClick={() => setModal('text')}>📱 Текст / Мессенджер</button>
                      <button className={`${styles.btn} ${styles.btnOk}`} onClick={genLink}>🔗 Создать ссылку</button>
                      <button className={`${styles.btn}`} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontWeight: 600 }} onClick={resetAll}>🔄 Сбросить форму</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* MODALS */}
          {modal === 'text' && <TextModal data={getClientData()} onClose={() => setModal(null)} onToast={toast} />}
          {modal === 'link' && <LinkModal url={shareUrl} onClose={() => setModal(null)} onToast={toast} />}
          {modal === 'addOpt' && <AddOptModal onClose={() => setModal(null)} onToast={toast}
            onAdd={f => toast('Для добавления используйте вкладку "Настройка"')} />}
        </div>
      )}
    </div>
  )
}
