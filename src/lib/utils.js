// ─── FORMAT ──────────────────────────────────────────────────
export const fmt = n => (n || 0).toLocaleString('ru-RU')

export const fmtDate = d => {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  const ms = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
  const mi = parseInt(m) - 1
  return (mi >= 0 && mi < 12) ? `${parseInt(day)} ${ms[mi]} ${y}` : d
}

export const todayISO = () => new Date().toISOString().split('T')[0]

export const genDate = () =>
  new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })

// ─── CLIPBOARD ───────────────────────────────────────────────
export const clipCopy = async text => {
  if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); return true } catch {}
  }
  const a = document.createElement('textarea')
  a.value = text
  document.body.appendChild(a)
  a.select()
  document.execCommand('copy')
  document.body.removeChild(a)
  return true
}

// ─── LOCAL STORAGE ───────────────────────────────────────────
const LS_KEY = 'png4r'

export const loadFromLS = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

export const saveToLS = data => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

// ─── RECALC (pure) ───────────────────────────────────────────
export function computeCalc({ packages, options, selBase, qty, optMk, isBk, pkgMkB, pkgMkP }) {
  const findPkg = id =>
    id == null ? null : packages.find(p => String(p.id) === String(id)) ?? null

  const act     = findPkg(selBase)
  const pkgNet  = act ? act.nettoPrice : 0
  const pkgMgr  = act ? act.mgrPrice   : 0
  const pkgMkCalc = act ? Math.round(pkgNet * pkgMkP / 100) + pkgMkB : 0

  const hours = act ? act.hours : 8
  const avIds = new Set(
    options.filter(o => hours === 8 || !o.only8h).map(o => String(o.id))
  )

  let optNet = 0, optMkT = 0, optMgrT = 0
  const selOpts = []

  for (const o of options) {
    const key = String(o.id)
    if (!avIds.has(key)) continue
    const q  = qty[key]   || { a: 0, c: 0 }
    const mk = optMk[key] || { a: 0, c: 0 }
    if ((q.a || 0) + (q.c || 0) === 0) continue
    const net    = (q.a || 0) * o.netA  + (q.c || 0) * o.netC
    const markup = (q.a || 0) * (mk.a || 0) + (q.c || 0) * (mk.c || 0)
    const mgr    = (q.a || 0) * o.mgrA  + (q.c || 0) * o.mgrC
    optNet += net; optMkT += markup; optMgrT += mgr
    selOpts.push({ ...o, q, mk, net, markup, client: net + markup, mgr })
  }

  const totalClient = isBk
    ? pkgNet + pkgMkCalc + optNet + optMkT
    : pkgMgr + optMgrT

  return { act, pkgNet, pkgMgr, pkgMkCalc, selOpts, optNet, optMkT, optMgrT, totalClient, avIds }
}

// ─── CLIENT DATA SNAPSHOT ───────────────────────────────────
export function buildClientData({ calc, isBk, client }) {
  if (!calc.act) return null
  const items = []
  const pkgP = isBk ? calc.pkgNet + calc.pkgMkCalc : calc.pkgMgr
  items.push({ name: calc.act.name, note: calc.act.note || '', price: pkgP, type: calc.act.type === 'vip' ? 'vip' : 'package' })
  for (const o of (calc.selOpts || [])) {
    const aP = isBk ? o.netA + (o.mk?.a || 0) : o.mgrA
    const cP = isBk ? o.netC + (o.mk?.c || 0) : o.mgrC
    items.push({ name: o.name, cat: o.cat, aQ: o.q.a || 0, cQ: o.q.c || 0, aP, cP, sum: isBk ? o.client : o.mgr, type: 'opt' })
  }
  return { ...client, items, total: calc.totalClient, gen: genDate() }
}

// ─── PRINT ───────────────────────────────────────────────────
export function doPrint(data) {
  if (!data) return
  const pkgs = data.items.filter(i => i.type !== 'opt')
  const opts = data.items.filter(i => i.type === 'opt')
  const optRows = opts.map(o =>
    `<tr>
      <td>${o.name}</td>
      <td style="text-align:center">${o.aQ}</td>
      <td style="text-align:center">${o.cQ}</td>
      <td style="text-align:right">${fmt(o.aP)} ฿</td>
      <td style="text-align:right">${fmt(o.cP)} ฿</td>
      <td style="text-align:right;font-weight:700">${fmt(o.sum)} ฿</td>
    </tr>`
  ).join('')

  const el = document.getElementById('print-area')
  if (!el) return
  el.innerHTML = `<div style="font-family:sans-serif;padding:20px;max-width:680px;margin:0 auto;color:#1E293B">
    <div style="display:flex;justify-content:space-between;padding-bottom:14px;border-bottom:2px solid #0F4C75;margin-bottom:16px">
      <div><div style="font-size:18px;font-weight:800;color:#0F4C75">🌴 Пханг Нга Туры</div><div style="font-size:11px;color:#64748B">Индивидуальные туры · Тайланд</div></div>
      <div style="text-align:right"><div style="font-size:16px;font-weight:700">Расчёт тура</div><div style="font-size:10px;color:#64748B">${data.gen}</div></div>
    </div>
    <div style="background:#F0F5FA;border-radius:7px;padding:10px;margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:7px">
      ${data.name  ? `<div><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase">Клиент</div><div style="font-size:12px;font-weight:700">${data.name}</div></div>` : ''}
      ${data.date  ? `<div><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase">Дата</div><div style="font-size:12px;font-weight:700">${fmtDate(data.date)}</div></div>` : ''}
      ${data.phone ? `<div><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase">Телефон</div><div style="font-size:12px;font-weight:700">${data.phone}</div></div>` : ''}
      ${data.note  ? `<div style="grid-column:1/-1"><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase">Примечание</div><div style="font-size:11px">${data.note}</div></div>` : ''}
    </div>
    ${pkgs.map(p => `<div style="background:#0F4C75;color:#fff;border-radius:8px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div><div style="font-size:9px;opacity:.8;text-transform:uppercase">${p.type === 'vip' ? '⭐ VIP' : '🚐 ПАКЕТ'}</div><div style="font-weight:700;font-size:13px">${p.name}</div><div style="font-size:10px;opacity:.8">${p.note || ''}</div></div>
      <div style="font-size:18px;font-weight:800">${fmt(p.price)} ฿</div>
    </div>`).join('')}
    ${opts.length ? `<div style="font-size:12px;font-weight:700;margin:12px 0 6px">🎯 Дополнительные опции</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
      <thead><tr style="background:#0F4C75;color:#fff">
        <th style="padding:7px 9px;font-size:9px;text-align:left">Опция</th>
        <th style="padding:7px 9px;font-size:9px">Взр.</th><th style="padding:7px 9px;font-size:9px">Дет.</th>
        <th style="padding:7px 9px;font-size:9px;text-align:right">Цена взр.</th>
        <th style="padding:7px 9px;font-size:9px;text-align:right">Цена дет.</th>
        <th style="padding:7px 9px;font-size:9px;text-align:right">Сумма</th>
      </tr></thead>
      <tbody>${optRows}</tbody>
    </table>` : ''}
    <div style="background:#0F4C75;color:#fff;border-radius:8px;padding:14px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:12px;opacity:.9">ИТОГО К ОПЛАТЕ</div><div style="font-size:10px;opacity:.7">тайских бат (THB)</div></div>
      <div style="font-size:26px;font-weight:800">${fmt(data.total)} ฿</div>
    </div>
  </div>`
  window.print()
}
