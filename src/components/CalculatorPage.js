'use client'
import { useState, useMemo, useCallback } from 'react'
import { CAT_ICONS, CAT_COLORS } from '@/lib/constants'
import { fmt, fmtDate, todayISO, computeCalc, buildClientData, doPrint, clipCopy } from '@/lib/utils'
import { saveCalculation } from '@/lib/db'
import { TextModal, LinkModal, AddOptModal } from './Modals'

// ─── PACKAGE CARD ─────────────────────────────────────────────
function PkgCard({ pkg, selected, isBk, onClick }) {
  const price  = isBk ? pkg.nettoPrice : pkg.mgrPrice
  const icon   = pkg.type === 'vip' ? '⭐' : pkg.hours >= 8 ? '🕗' : '🕐'
  const isVip  = pkg.type === 'vip'
  const selCls = selected ? (isVip ? 'sel-vip' : 'sel') : ''

  return (
    <div className={`pkg-card ${selCls}`} onClick={onClick}>
      {selected && <div className={`pkg-check ${isVip ? 'pkg-check-vip' : ''}`}>✓</div>}
      <div className="pkg-icon">{icon}</div>
      <div className="pkg-name">{pkg.name}</div>
      <div className="pkg-note">{pkg.note}<br />Доп. час: {fmt(pkg.extraHour || 1000)} ฿</div>
      <div className="pkg-price">{fmt(price)} <span>฿</span></div>
      {isBk && <div className="pkg-netto">НЕТТО: {pkg.nettoDetail}</div>}
    </div>
  )
}

// ─── OPTIONS TABLE ─────────────────────────────────────────────
function OptionsTable({ options, isBk, qty, optMk, avIds, onSetQ, onSetMk }) {
  return (
    <table className="otbl">
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Опция</th>
          <th>Взр.</th>
          <th>Дет.</th>
          {isBk ? (
            <>
              <th>Нетто взр.</th><th className="mk">+Нац.</th>
              <th>Нетто дет.</th><th className="mk">+Нац.</th>
              <th>Себест.</th><th className="fn">Клиент</th>
            </>
          ) : (
            <>
              <th>Цена взр.</th><th>Цена дет.</th><th>Сумма</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {options.map(o => {
          const key = String(o.id)
          if (!avIds.has(key)) return null
          const q   = qty[key]   || { a: 0, c: 0 }
          const mk  = optMk[key] || { a: 0, c: 0 }
          const has = (q.a || 0) + (q.c || 0) > 0
          const [bg, fg] = CAT_COLORS[o.cat] || ['#F1F5F9', '#64748B']
          const costA = (q.a || 0) * o.netA
          const costC = (q.c || 0) * o.netC
          const costSum   = costA + costC
          const clientSum = (q.a || 0) * (o.netA + (mk.a || 0)) + (q.c || 0) * (o.netC + (mk.c || 0))
          const mgrSum    = (q.a || 0) * o.mgrA + (q.c || 0) * o.mgrC

          return (
            <tr key={o.id} className={`orow ${has ? 'has' : ''}`}>
              <td>
                <div className="oname">{o.name}</div>
                <span className="ocat" style={{ background: bg, color: fg }}>
                  {CAT_ICONS[o.cat] || ''} {o.cat}
                </span>
                {o.special && <div style={{ fontSize: '9px', color: 'var(--wn)', marginTop: '1px' }}>⚠️ {o.special}</div>}
              </td>
              <td>
                <input className="qi" type="number" min="0" max="99"
                  value={q.a || ''} placeholder="0"
                  onChange={e => onSetQ(key, 'a', e.target.value)} />
              </td>
              <td>
                <input className="qi" type="number" min="0" max="99"
                  value={q.c || ''} placeholder="0"
                  onChange={e => onSetQ(key, 'c', e.target.value)} />
              </td>
              {isBk ? (
                <>
                  <td className={`pc ${o.netA === 0 ? 'fr' : ''}`}>{o.netA > 0 ? fmt(o.netA) : 'FREE'}</td>
                  <td style={{ background: '#FFFBEB' }}>
                    <input className="mi" type="number" min="0"
                      value={mk.a || ''} placeholder="0"
                      onChange={e => onSetMk(key, 'a', e.target.value)} />
                  </td>
                  <td className={`pc ${o.netC === 0 ? 'fr' : ''}`}>{o.netC > 0 ? fmt(o.netC) : 'FREE'}</td>
                  <td style={{ background: '#FFFBEB' }}>
                    <input className="mi" type="number" min="0"
                      value={mk.c || ''} placeholder="0"
                      onChange={e => onSetMk(key, 'c', e.target.value)} />
                  </td>
                  <td className={`sc ${costSum === 0 ? 'z' : ''}`}>{costSum > 0 ? fmt(costSum) : '—'}</td>
                  <td className="fc" style={{ background: '#F0FDF4' }}>{clientSum > 0 ? fmt(clientSum) : '—'}</td>
                </>
              ) : (
                <>
                  <td className={`pc ${o.mgrA === 0 ? (o.special ? 'sp' : 'fr') : ''}`}>
                    {o.special ? '⚠️' : o.mgrA > 0 ? fmt(o.mgrA) + ' ฿' : 'FREE'}
                  </td>
                  <td className={`pc ${o.mgrC === 0 ? (o.special ? 'sp' : 'fr') : ''}`}>
                    {o.special ? '' : o.mgrC > 0 ? fmt(o.mgrC) + ' ฿' : 'FREE'}
                  </td>
                  <td className={`sc ${mgrSum === 0 ? 'z' : ''}`}>
                    {mgrSum > 0 ? fmt(mgrSum) + ' ฿' : '—'}
                  </td>
                </>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function CalculatorPage({ packages, options, role, user, toast }) {
  const isBk = role === 'booking'

  const [selBase, setSelBase] = useState(null)
  const [qty,     setQty]     = useState({})
  const [optMk,   setOptMk]   = useState({})
  const [cat,     setCat]     = useState('all')
  const [pkgMkB,  setPkgMkB]  = useState(0)
  const [pkgMkP,  setPkgMkP]  = useState(0)
  const [client,  setClient]  = useState({ name: '', date: todayISO(), phone: '', note: '' })
  const [modal,   setModal]   = useState(null) // 'text' | 'link' | 'addOpt'
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

  const setQ  = useCallback((key, t, v) => {
    setQty(q => ({ ...q, [key]: { ...(q[key] || { a: 0, c: 0 }), [t]: Math.max(0, parseInt(v) || 0) } }))
  }, [])

  const setMk = useCallback((key, t, v) => {
    setOptMk(m => ({ ...m, [key]: { ...(m[key] || { a: 0, c: 0 }), [t]: Math.max(0, parseInt(v) || 0) } }))
  }, [])

  const resetAll = () => {
    setSelBase(null); setQty({}); setOptMk({})
    setPkgMkB(0); setPkgMkP(0)
    setClient({ name: '', date: todayISO(), phone: '', note: '' })
    toast('Сброшено')
  }

  const getClientData = () => buildClientData({ calc, isBk, client })

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
  }

  const cats       = ['all', ...new Set(options.map(o => o.cat))]
  const avOpts     = options.filter(o => calc.avIds.has(String(o.id)))
  const filteredOpts = cat === 'all' ? avOpts : avOpts.filter(o => o.cat === cat)
  const is5        = selBase !== null && calc.act && calc.act.hours < 8
  const bases      = packages.filter(p => p.type === 'base')
  const vips       = packages.filter(p => p.type === 'vip')

  return (
    <div className="main">
      {/* ── LEFT COLUMN ── */}
      <div>
        {/* PACKAGES */}
        <div className="card">
          <div className="card-h">
            <div className="card-h-icon">🚐</div>
            <div><h2>Пакет тура</h2><p>Выберите один пакет (обязательно)</p></div>
          </div>
          <div className="card-b">
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--txl)', marginBottom: '6px', textTransform: 'uppercase' }}>🚐 Минивэн</div>
            <div className="pkg-grid">
              {bases.map(p => (
                <PkgCard key={p.id} pkg={p} isBk={isBk}
                  selected={selBase !== null && String(p.id) === String(selBase)}
                  onClick={() => selPkg(p.id)} />
              ))}
            </div>

            <div style={{ fontSize: '11px', fontWeight: '800', color: '#92400E', marginBottom: '6px', marginTop: '14px', textTransform: 'uppercase' }}>⭐ VIP Тойота Альфард</div>
            <div className="pkg-grid">
              {vips.map(p => (
                <PkgCard key={p.id} pkg={p} isBk={isBk}
                  selected={selBase !== null && String(p.id) === String(selBase)}
                  onClick={() => selPkg(p.id)} />
              ))}
            </div>

            {isBk && calc.act && (
              <div className="netto-info">
                <b>📊 Нетто-расклад пакета:</b><br />
                {calc.act.nettoDetail} = <b>{fmt(calc.act.nettoPrice)} ฿</b><br />
                Продажная цена менеджера: <b>{fmt(calc.act.mgrPrice)} ฿</b><br />
                Встроенная маржа: <b>{fmt(calc.act.mgrPrice - calc.act.nettoPrice)} ฿</b>
              </div>
            )}

            {isBk && (
              <div className="mksec">
                <div className="mkt">💰 Наценка на пакет</div>
                <div className="mkrow">
                  <div>
                    <div className="mkl">Фикс. ฿</div>
                    <div className="mkf">
                      <input type="number" value={pkgMkB} min="0"
                        onChange={e => setPkgMkB(parseInt(e.target.value) || 0)} />
                      <span className="su">฿</span>
                    </div>
                  </div>
                  <div>
                    <div className="mkl">Процент %</div>
                    <div className="mkf">
                      <input type="number" value={pkgMkP} min="0" max="200"
                        onChange={e => setPkgMkP(parseInt(e.target.value) || 0)} />
                      <span className="su">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* OPTIONS */}
        <div className="card">
          <div className="card-h">
            <div className="card-h-icon">🎯</div>
            <div>
              <h2>Дополнительные опции</h2>
              <p>
                {isBk
                  ? <span>Нетто-цены. <span style={{ color: '#92400E', fontWeight: '700' }}>Жёлтые = наценка</span></span>
                  : 'Укажите количество взрослых и детей'}
              </p>
            </div>
          </div>
          <div className="card-b" style={{ padding: '10px 14px' }}>
            <div className="cats">
              {cats.map(c => (
                <button key={c} className={`cat-btn ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                  {c === 'all' ? '🌐 Все' : (CAT_ICONS[c] || '') + ' ' + c}
                </button>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <OptionsTable
                options={filteredOpts} isBk={isBk}
                qty={qty} optMk={optMk} avIds={calc.avIds}
                onSetQ={setQ} onSetMk={setMk}
              />
            </div>
            {is5 && (
              <div style={{ marginTop: '10px', padding: '10px', background: '#FEF3C7', borderRadius: '8px', fontSize: '11px', color: '#92400E', border: '1px solid #FDE68A' }}>
                ⏱️ <b>Пакет 5 часов:</b> Некоторые опции недоступны. Переключитесь на 8 часов для полного списка.
              </div>
            )}
            {isBk && (
              <div style={{ marginTop: '12px' }}>
                <button className="btn-add" onClick={() => setModal('addOpt')}>➕ Добавить новую опцию</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <div className="sidebar">
        {/* CLIENT */}
        <div className="card">
          <div className="card-h"><div className="card-h-icon">👤</div><div><h2>Клиент</h2></div></div>
          <div className="card-b">
            <div className="field"><label>Имя</label><input type="text" value={client.name} placeholder="Иван Иванов" onChange={e => setClient(c => ({ ...c, name: e.target.value }))} /></div>
            <div className="field"><label>Дата тура</label><input type="date" value={client.date} onChange={e => setClient(c => ({ ...c, date: e.target.value }))} /></div>
            <div className="field"><label>Телефон / WhatsApp</label><input type="text" value={client.phone} placeholder="+66 XX XXX XXXX" onChange={e => setClient(c => ({ ...c, phone: e.target.value }))} /></div>
            <div className="field"><label>Примечание</label><textarea value={client.note} placeholder="Пожелания..." onChange={e => setClient(c => ({ ...c, note: e.target.value }))} /></div>
          </div>
        </div>

        {/* TOTALS */}
        <div className="card">
          <div className="card-h">
            <div className="card-h-icon" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>💳</div>
            <div><h2>Итого</h2><p>Обновляется автоматически</p></div>
          </div>
          <div className="card-b">
            {/* Summary lines */}
            {isBk ? (
              <>
                <div className="sline"><span className="sl">🚐 Пакет нетто</span><span className="sv">{fmt(calc.pkgNet)} ฿</span></div>
                {calc.pkgMkCalc > 0 && <div className="sline"><span className="sl">💰 Наценка пакет</span><span className="sv" style={{ color: '#92400E' }}>+{fmt(calc.pkgMkCalc)} ฿</span></div>}
                <div className="sline"><span className="sl">🎯 Опции нетто</span><span className="sv">{fmt(calc.optNet)} ฿</span></div>
                {calc.optMkT > 0 && <div className="sline"><span className="sl">💰 Наценка опции</span><span className="sv" style={{ color: '#92400E' }}>+{fmt(calc.optMkT)} ฿</span></div>}
                <div style={{ height: '1px', background: 'var(--brd)', margin: '6px 0' }} />
                <div className="sline"><span className="sl">📦 Себестоимость</span><span className="sv">{fmt(calc.pkgNet + calc.optNet)} ฿</span></div>
                <div className="sline"><span className="sl">💰 Общая наценка</span><span className="sv" style={{ color: '#92400E' }}>+{fmt(calc.pkgMkCalc + calc.optMkT)} ฿</span></div>
                <div className="sline"><span className="sl">📊 Маржа пакета (встр.)</span><span className="sv" style={{ color: 'var(--ok)' }}>{fmt(calc.pkgMgr - calc.pkgNet)} ฿</span></div>
              </>
            ) : (
              <>
                {calc.act   && <div className="sline"><span className="sl">🚐 Пакет</span><span className="sv">{fmt(calc.pkgMgr)} ฿</span></div>}
                {calc.optMgrT > 0 && <div className="sline"><span className="sl">🎯 Опции</span><span className="sv">{fmt(calc.optMgrT)} ฿</span></div>}
              </>
            )}

            <div className="stotal">
              <div><div className="tl">К ОПЛАТЕ</div><div className="tc">THB (бат)</div></div>
              <div className="ta">{fmt(calc.totalClient)} ฿</div>
            </div>

            {/* Selected list */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--txl)', marginBottom: '6px' }}>ВЫБРАННЫЕ ПОЗИЦИИ</div>
              {!calc.act ? (
                <div className="empty"><div className="ei">🎯</div><p>Выберите пакет</p></div>
              ) : (
                <>
                  <div className="sopt">
                    <div>
                      <div className="sopt-n">{calc.act.type === 'vip' ? '⭐' : '🚐'} {calc.act.name}</div>
                      <div className="sopt-d">{calc.act.note || ''}</div>
                    </div>
                    <div className="sopt-p">{fmt(isBk ? calc.pkgNet + calc.pkgMkCalc : calc.pkgMgr)} ฿</div>
                  </div>
                  {(calc.selOpts || []).map(o => {
                    const det = [o.q.a > 0 ? o.q.a + ' взр.' : '', o.q.c > 0 ? o.q.c + ' дет.' : ''].filter(Boolean).join(', ')
                    return (
                      <div key={o.id} className="sopt">
                        <div><div className="sopt-n">{CAT_ICONS[o.cat] || '•'} {o.name}</div><div className="sopt-d">{det}</div></div>
                        <div className="sopt-p">{fmt(isBk ? o.client : o.mgr)} ฿</div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>

            <div className="abtns">
              <button className="btn btn-p"  onClick={() => doPrint(getClientData())}>🖨️ Печать / PDF</button>
              <button className="btn btn-ac" onClick={() => { if (!calc.act) { toast('Выберите пакет', 'err'); return } setModal('text') }}>📱 Текст</button>
              <button className="btn btn-s"  onClick={genLink}>🔗 Ссылка клиенту</button>
              <button className="btn btn-g"  onClick={resetAll}>🔄 Сбросить</button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {modal === 'text'   && <TextModal   data={getClientData()} onClose={() => setModal(null)} onToast={toast} />}
      {modal === 'link'   && <LinkModal   url={shareUrl}         onClose={() => setModal(null)} onToast={toast} />}
      {modal === 'addOpt' && <AddOptModal                        onClose={() => setModal(null)} onToast={toast}
        onAdd={f => toast('Для добавления используйте Операционный отдел')} />}
    </div>
  )
}
