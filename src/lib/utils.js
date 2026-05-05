// ─── FORMAT ──────────────────────────────────────────────────
export const fmt = n => (n || 0).toLocaleString('ru-RU')

export const fmtDate = d => {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  const ms = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  const mi = parseInt(m) - 1
  return (mi >= 0 && mi < 12) ? `${parseInt(day)} ${ms[mi]} ${y}` : d
}

export const todayISO = () => new Date().toISOString().split('T')[0]

// Timestamps always shown in Bangkok time (UTC+7)
export const fmtBangkok = (ts, opts = {}) => {
  if (!ts) return ''
  return new Date(ts).toLocaleString('ru-RU', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    ...opts,
  })
}

export const genDate = () =>
  new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })

// ─── CLIPBOARD ───────────────────────────────────────────────
export const clipCopy = async text => {
  if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); return true } catch { }
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
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch { }
}

// ─── RECALC (pure) ───────────────────────────────────────────
export function computeCalc({ packages, options, selBase, qty, optMk, isBk, pkgMkB, pkgMkP }) {
  const findPkg = id =>
    id == null ? null : packages.find(p => String(p.id) === String(id)) ?? null

  const act = findPkg(selBase)
  const pkgNet = act ? act.nettoPrice : 0
  const pkgMgr = act ? act.mgrPrice : 0
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
    const q = qty[key] || { a: 0, c: 0 }
    const mk = optMk[key] || { a: 0, c: 0 }
    if ((q.a || 0) + (q.c || 0) === 0) continue
    const net = (q.a || 0) * o.netA + (q.c || 0) * o.netC
    const markup = (q.a || 0) * (mk.a || 0) + (q.c || 0) * (mk.c || 0)
    const mgr = (q.a || 0) * o.mgrA + (q.c || 0) * o.mgrC
    optNet += net; optMkT += markup; optMgrT += mgr
    selOpts.push({ ...o, q, mk, net, markup, client: net + markup, mgr })
  }

  const totalClient = isBk
    ? pkgNet + pkgMkCalc + optNet + optMkT
    : pkgMgr + optMgrT

  return { act, pkgNet, pkgMgr, pkgMkCalc, selOpts, optNet, optMkT, optMgrT, totalClient, avIds }
}

// ─── CLIENT DATA SNAPSHOT ───────────────────────────────────
export function buildClientData({ calc, isBk, client, brand }) {
  if (!calc.act) return null
  const items = []
  const pkgP = isBk ? calc.pkgNet + calc.pkgMkCalc : calc.pkgMgr
  items.push({ name: calc.act.name, note: calc.act.note || '', price: pkgP, type: calc.act.type === 'vip' ? 'vip' : 'package' })
  for (const o of (calc.selOpts || [])) {
    const aP = isBk ? o.netA + (o.mk?.a || 0) : o.mgrA
    const cP = isBk ? o.netC + (o.mk?.c || 0) : o.mgrC
    items.push({ name: o.name, cat: o.cat, aQ: o.q.a || 0, cQ: o.q.c || 0, aP, cP, sum: isBk ? o.client : o.mgr, type: 'opt' })
  }
  return { ...client, items, total: calc.totalClient, gen: genDate(), _savedAt: new Date().toISOString(), _brand: brand || null }
}

// ─── DARK AMBER PDF STYLES ───────────────────────────────────
const PDF_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #111; }
  .pdf-wrap {
    font-family: 'Inter', sans-serif;
    background: #111111;
    color: #e5e5e5;
    min-height: 100vh;
    padding: 32px;
    max-width: 720px;
    margin: 0 auto;
    position: relative;
  }
  .pdf-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 18px;
    border-bottom: 2px solid #f59e0b;
    margin-bottom: 24px;
  }
  .pdf-logo-title {
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 0.08em;
    color: #f59e0b;
    text-transform: uppercase;
    line-height: 1.2;
  }
  .pdf-logo-sub {
    font-size: 9px;
    color: #a3a3a3;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-top: 3px;
  }
  .pdf-doc-title {
    font-size: 15px;
    font-weight: 700;
    color: #e5e5e5;
    text-align: right;
  }
  .pdf-doc-date {
    font-size: 10px;
    color: #737373;
    margin-top: 3px;
    text-align: right;
  }
  .pdf-client-box {
    background: rgba(245,158,11,0.08);
    border: 1.5px solid rgba(245,158,11,0.25);
    border-radius: 12px;
    padding: 14px 18px;
    margin-bottom: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .pdf-client-label {
    font-size: 8px;
    font-weight: 700;
    color: #f59e0b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 4px;
  }
  .pdf-client-value {
    font-size: 13px;
    font-weight: 700;
    color: #e5e5e5;
  }
  .pdf-route-card {
    background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.1));
    border: 1.5px solid rgba(245,158,11,0.4);
    border-radius: 12px;
    padding: 14px 18px;
    margin-bottom: 20px;
  }
  .pdf-route-label {
    font-size: 9px;
    font-weight: 700;
    color: #f59e0b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
    opacity: 0.8;
  }
  .pdf-route-name {
    font-size: 17px;
    font-weight: 800;
    color: #fbbf24;
  }
  .pdf-section-title {
    font-size: 10px;
    font-weight: 800;
    color: #f59e0b;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }
  .pdf-items-box {
    background: rgba(255,255,255,0.03);
    border: 1.5px solid rgba(245,158,11,0.15);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 24px;
  }
  .pdf-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(245,158,11,0.08);
  }
  .pdf-item:last-child { border-bottom: none; }
  .pdf-item-icon {
    font-size: 16px;
    margin-right: 14px;
    min-width: 22px;
  }
  .pdf-item-name {
    font-size: 13px;
    font-weight: 600;
    color: #e5e5e5;
    flex: 1;
  }
  .pdf-item-meta {
    font-size: 11px;
    color: #f59e0b;
    font-weight: 600;
    margin-left: 10px;
  }
  .pdf-total-box {
    background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08));
    border: 2px solid rgba(245,158,11,0.5);
    border-radius: 14px;
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .pdf-total-label {
    font-size: 11px;
    font-weight: 800;
    color: #f59e0b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .pdf-total-sub {
    font-size: 10px;
    color: #737373;
    margin-top: 4px;
  }
  .pdf-total-amount {
    font-size: 36px;
    font-weight: 900;
    color: #f59e0b;
    letter-spacing: -1px;
  }
  .pdf-footer {
    text-align: center;
    font-size: 9px;
    color: #525252;
    letter-spacing: 0.3px;
    padding-top: 16px;
    border-top: 1px solid rgba(245,158,11,0.1);
  }
  .pdf-wm {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><text x='50%' y='38%' transform='rotate(-32 160 76)' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-weight='900' font-size='22' fill='%23f59e0b' opacity='0.07'>ОСТРОВ СОКРОВИЩ</text><text x='50%' y='62%' transform='rotate(-32 160 124)' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-weight='400' font-size='11' fill='%23f59e0b' opacity='0.05'>PORTAL OPERATION</text></svg>");
    background-repeat: repeat;
    background-size: 320px 200px;
  }
  /* pdf-wm-corner removed */
  .pdf-content { position: relative; z-index: 1; }
  @media print {
    body { background: #111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`

// ─── PRINT GROUP TOURS ───────────────────────────────────────
export function doPrint(data) {
  if (!data) return
  const pkgs = data.items.filter(i => i.type !== 'opt')
  const opts = data.items.filter(i => i.type === 'opt')

  const allItems = [
    ...pkgs.map(p => ({ icon: p.type === 'vip' ? '⭐' : '🚐', name: p.name, meta: null })),
    ...opts.map(o => {
      const det = [o.aQ > 0 ? o.aQ + ' взр.' : '', o.cQ > 0 ? o.cQ + ' дет.' : ''].filter(Boolean).join(', ')
      return { icon: '🎯', name: o.name + (det ? ` (${det})` : ''), meta: null }
    })
  ]

  const el = document.getElementById('print-area')
  if (!el) return

  el.innerHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PDF_STYLES}</style></head><body>
  <div class="pdf-wrap">
    <div class="pdf-wm"></div>
    <div class="pdf-content">

      <div class="pdf-header">
        <div>
          <div class="pdf-logo-title">ОСТРОВ СОКРОВИЩ</div>
          <div class="pdf-logo-sub">Премиальные экскурсии · Пхукет</div>
        </div>
        <div>
          <div class="pdf-doc-title">Смета тура</div>
          <div class="pdf-doc-date">${data.gen}</div>
        </div>
      </div>

      ${(data.name || data.date || data.phone) ? `
      <div class="pdf-client-box">
        ${data.name ? `<div><div class="pdf-client-label">Клиент</div><div class="pdf-client-value">${data.name}</div></div>` : ''}
        ${data.date ? `<div><div class="pdf-client-label">Дата</div><div class="pdf-client-value">${fmtDate(data.date)}</div></div>` : ''}
        ${data.phone ? `<div><div class="pdf-client-label">Телефон</div><div class="pdf-client-value">${data.phone}</div></div>` : ''}
        ${data.note ? `<div style="grid-column:1/-1"><div class="pdf-client-label">Примечание</div><div class="pdf-client-value" style="font-weight:500;font-size:12px">${data.note}</div></div>` : ''}
      </div>` : ''}

      <div class="pdf-section-title">Что включено:</div>
      <div class="pdf-items-box">
        ${allItems.map(item => `
          <div class="pdf-item">
            <span class="pdf-item-icon">${item.icon}</span>
            <span class="pdf-item-name">${item.name}</span>
          </div>
        `).join('')}
      </div>

      <div class="pdf-total-box">
        <div>
          <div class="pdf-total-label">Итого к оплате</div>
          <div class="pdf-total-sub">тайских бат (THB)</div>
        </div>
        <div class="pdf-total-amount">${fmt(data.total)} ฿</div>
      </div>

      <div class="pdf-footer">
        Расчёт от ${data.gen} · Остров Сокровищ · phang-nga-tours.com
      </div>
    </div>
  </div>
  </body></html>`

  document.body.classList.add('printing')
  const cleanup = () => {
    document.body.classList.remove('printing')
    el.innerHTML = ''
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}

// ─── PRINT CHARTER ───────────────────────────────────────────
export function doPrintCharter(data) {
  if (!data) return
  const el = document.getElementById('print-area')
  if (!el) return

  el.innerHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PDF_STYLES}</style></head><body>
  <div class="pdf-wrap">
    <div class="pdf-wm"></div>
    <div class="pdf-content">

      <div class="pdf-header">
        <div>
          <div class="pdf-logo-title">ОСТРОВ СОКРОВИЩ</div>
          <div class="pdf-logo-sub">Премиальные экскурсии · Пхукет</div>
        </div>
        <div>
          <div class="pdf-doc-title">Расчёт чартера</div>
          <div class="pdf-doc-date">${data.gen}</div>
        </div>
      </div>

      ${(data.name || data.date || data.phone || data.pax) ? `
      <div class="pdf-client-box">
        ${data.name ? `<div><div class="pdf-client-label">Клиент</div><div class="pdf-client-value">${data.name}</div></div>` : ''}
        ${data.date ? `<div><div class="pdf-client-label">Дата</div><div class="pdf-client-value">${fmtDate(data.date)}</div></div>` : ''}
        ${data.phone ? `<div><div class="pdf-client-label">Телефон</div><div class="pdf-client-value">${data.phone}</div></div>` : ''}
        ${data.pax ? `<div><div class="pdf-client-label">Гостей</div><div class="pdf-client-value">${data.pax}</div></div>` : ''}
      </div>` : ''}

      <div class="pdf-route-card">
        <div class="pdf-route-label">🚤 Маршрут</div>
        <div class="pdf-route-name">${data.tourName}</div>
      </div>

      <div class="pdf-section-title">Что включено:</div>
      <div class="pdf-items-box">
        <div class="pdf-item">
          <span class="pdf-item-icon">🚤</span>
          <span class="pdf-item-name">Аренда катера по маршруту</span>
        </div>
        ${data.items.map(o => `
          <div class="pdf-item">
            <span class="pdf-item-icon">${o.icon}</span>
            <span class="pdf-item-name">${o.name}</span>
            ${o.meta ? `<span class="pdf-item-meta">${o.meta.split(' × ')[0].trim()}</span>` : ''}
          </div>
        `).join('')}
      </div>

      <div class="pdf-total-box">
        <div>
          <div class="pdf-total-label">Итого к оплате</div>
          <div class="pdf-total-sub">тайских бат (THB)</div>
        </div>
        <div class="pdf-total-amount">${fmt(data.total)} ฿</div>
      </div>

      <div class="pdf-footer">
        Расчёт от ${data.gen} · Остров Сокровищ · phang-nga-tours.com
      </div>
    </div>
  </div>
  </body></html>`

  document.body.classList.add('printing')
  const cleanup = () => {
    document.body.classList.remove('printing')
    el.innerHTML = ''
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}

// ─── PRINT LAND TOUR (also reused by Overview/Sights tours) ─
export function doPrintLand(data) {
  if (!data) return
  const el = document.getElementById('print-area')
  if (!el) return

  const meta = data.meta || {}
  const programLines = Array.isArray(data.program) ? data.program : []
  const included = Array.isArray(data.included) ? data.included : []
  const items = Array.isArray(data.items) ? data.items : []
  const printTitle = data.printTitle || 'Смета сухопутной экскурсии'
  const routeBadge = data.routeBadge || '🏔️ Маршрут'

  el.innerHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PDF_STYLES}</style></head><body>
  <div class="pdf-wrap">
    <div class="pdf-wm"></div>
    <div class="pdf-content">

      <div class="pdf-header">
        <div>
          <div class="pdf-logo-title">ОСТРОВ СОКРОВИЩ</div>
          <div class="pdf-logo-sub">Премиальные экскурсии · Пхукет</div>
        </div>
        <div>
          <div class="pdf-doc-title">${printTitle}</div>
          <div class="pdf-doc-date">${data.gen}</div>
        </div>
      </div>

      ${(data.name || data.date || data.phone || data.pax) ? `
      <div class="pdf-client-box">
        ${data.name ? `<div><div class="pdf-client-label">Клиент</div><div class="pdf-client-value">${data.name}</div></div>` : ''}
        ${data.date ? `<div><div class="pdf-client-label">Дата</div><div class="pdf-client-value">${fmtDate(data.date)}</div></div>` : ''}
        ${data.phone ? `<div><div class="pdf-client-label">Телефон</div><div class="pdf-client-value">${data.phone}</div></div>` : ''}
        ${data.pax ? `<div><div class="pdf-client-label">Гостей</div><div class="pdf-client-value">${data.pax}</div></div>` : ''}
      </div>` : ''}

      <div class="pdf-route-card">
        <div class="pdf-route-label">${routeBadge}</div>
        <div class="pdf-route-name">${data.tourName || ''}</div>
        ${meta.duration || meta.days || meta.transport || meta.guide || meta.meals ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin-top:10px;font-size:11px;color:#e5e5e5">
          ${meta.duration ? `<div>⏱️ <b style="color:#fbbf24">Время:</b> ${meta.duration}</div>` : ''}
          ${meta.days ? `<div>📅 <b style="color:#fbbf24">Длительность:</b> ${meta.days}</div>` : ''}
          ${meta.transport ? `<div>🚐 <b style="color:#fbbf24">Транспорт:</b> ${meta.transport}</div>` : ''}
          ${meta.guide ? `<div>🗣 <b style="color:#fbbf24">Гид:</b> ${meta.guide}</div>` : ''}
          ${meta.meals ? `<div style="grid-column:1/-1">🍽 <b style="color:#fbbf24">Питание:</b> ${meta.meals}</div>` : ''}
          ${meta.groupSize ? `<div>👥 <b style="color:#fbbf24">Группа:</b> ${meta.groupSize}</div>` : ''}
        </div>` : ''}
      </div>

      ${programLines.length > 0 ? `
      <div class="pdf-section-title">Программа</div>
      <div class="pdf-items-box" style="margin-bottom:18px">
        ${programLines.map(p => `
          <div class="pdf-item">
            <span class="pdf-item-icon">📍</span>
            <span class="pdf-item-name">${p}</span>
          </div>
        `).join('')}
      </div>` : ''}

      ${included.length > 0 ? `
      <div class="pdf-section-title">В цену включено</div>
      <div class="pdf-items-box" style="margin-bottom:18px">
        ${included.map(p => `
          <div class="pdf-item">
            <span class="pdf-item-icon">✓</span>
            <span class="pdf-item-name">${p}</span>
          </div>
        `).join('')}
      </div>` : ''}

      ${items.length > 0 ? `
      <div class="pdf-section-title">Дополнительные опции</div>
      <div class="pdf-items-box">
        ${items.map(o => `
          <div class="pdf-item">
            <span class="pdf-item-icon">${o.icon || '➕'}</span>
            <span class="pdf-item-name">${o.name}</span>
            ${o.meta ? `<span class="pdf-item-meta">${o.meta}</span>` : ''}
          </div>
        `).join('')}
      </div>` : ''}

      <div class="pdf-total-box">
        <div>
          <div class="pdf-total-label">Итого к оплате</div>
          <div class="pdf-total-sub">тайских бат (THB)</div>
        </div>
        <div class="pdf-total-amount">${fmt(data.total)} ฿</div>
      </div>

      <div class="pdf-footer">
        Расчёт от ${data.gen} · Остров Сокровищ · phang-nga-tours.com
      </div>
    </div>
  </div>
  </body></html>`

  document.body.classList.add('printing')
  const cleanup = () => {
    document.body.classList.remove('printing')
    el.innerHTML = ''
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}

// ─── CUSTOM TOUR PRICING ENGINE ──────────────────────────────
// Считает одну часть кастомного тура по её модели (per_pax | base_plus_extra | per_vehicle).
// Возвращает { sell, net, margin }.
export function calcCustomPart(part, pax = { adults: 0, children: 0, infants: 0 }) {
  const a = pax.adults || 0
  const c = pax.children || 0
  const inf = pax.infants || 0
  const totalPax = a + c

  // Если override.sell_total задан — продажа равна ему
  let sell, net
  const model = part.pricing_model || part.pricingModel || 'per_pax'

  if (model === 'per_pax') {
    sell = (part.sell_adult || 0) * a + (part.sell_child || 0) * c + (part.sell_infant || 0) * inf
    net  = (part.net_adult  || 0) * a + (part.net_child  || 0) * c + (part.net_infant  || 0) * inf
  } else if (model === 'base_plus_extra') {
    const inc = part.inclusive_pax || 0
    const extraN = Math.max(0, totalPax - inc)
    sell = (part.sell_base || 0) + extraN * (part.extra_pax_sell || 0)
    net  = (part.net_base  || 0) + extraN * (part.extra_pax_net  || 0)
  } else {
    // per_vehicle: фиксированная цена за машину/лодку
    sell = (part.sell_base || 0)
    net  = (part.net_base  || 0)
  }

  // Override
  if (part.override?.sell_total != null) sell = Number(part.override.sell_total) || 0
  if (part.override?.net_total  != null) net  = Number(part.override.net_total)  || 0

  return { sell, net, margin: sell - net }
}

// Считает итог по списку частей и pax.
export function calcCustomTotal(parts, pax) {
  let sell = 0, net = 0
  for (const p of (parts || [])) {
    const r = calcCustomPart(p, p.qty || pax)
    sell += r.sell
    net  += r.net
  }
  return { sell, net, margin: sell - net }
}

// ─── PRINT CUSTOM CLIENT (премиальный для клиента) ──────────
export function doPrintCustomClient(data) {
  if (!data) return
  const el = document.getElementById('print-area')
  if (!el) return

  // Группируем части по category для красоты
  const groups = {}
  for (const p of (data.parts || [])) {
    const cat = p.category || 'Активности'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(p)
  }

  el.innerHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PDF_STYLES}</style></head><body>
  <div class="pdf-wrap">
    <div class="pdf-wm"></div>
    <div class="pdf-content">

      <div class="pdf-header">
        <div>
          <div class="pdf-logo-title">ОСТРОВ СОКРОВИЩ</div>
          <div class="pdf-logo-sub">Премиальные экскурсии · Пхукет</div>
        </div>
        <div>
          <div class="pdf-doc-title">${data.printTitle || 'Индивидуальная программа'}</div>
          <div class="pdf-doc-date">${data.gen}</div>
        </div>
      </div>

      ${(data.name || data.date || data.phone || data.pax) ? `
      <div class="pdf-client-box">
        ${data.name  ? `<div><div class="pdf-client-label">Клиент</div><div class="pdf-client-value">${data.name}</div></div>` : ''}
        ${data.date  ? `<div><div class="pdf-client-label">Дата</div><div class="pdf-client-value">${fmtDate(data.date)}</div></div>` : ''}
        ${data.phone ? `<div><div class="pdf-client-label">Телефон</div><div class="pdf-client-value">${data.phone}</div></div>` : ''}
        ${data.pax   ? `<div><div class="pdf-client-label">Гостей</div><div class="pdf-client-value">${data.pax}</div></div>` : ''}
      </div>` : ''}

      ${data.tourName ? `
      <div class="pdf-route-card">
        <div class="pdf-route-label">🧩 Программа</div>
        <div class="pdf-route-name">${data.tourName}</div>
      </div>` : ''}

      ${Object.keys(groups).map(cat => `
        <div class="pdf-section-title">${cat}</div>
        <div class="pdf-items-box" style="margin-bottom:14px">
          ${groups[cat].map(p => `
            <div class="pdf-item">
              <span class="pdf-item-icon">${p.icon || '•'}</span>
              <span class="pdf-item-name">
                ${p.name}
                ${p.qty ? `<span style="color:#a3a3a3;font-weight:500;font-size:11px"> · ${p.qty.adults || 0} взр${p.qty.children ? ' + '+p.qty.children+' дет' : ''}${p.qty.infants ? ' + '+p.qty.infants+' млд' : ''}</span>` : ''}
              </span>
              <span class="pdf-item-meta">${fmt(p.calculated?.sell || 0)} ฿</span>
            </div>
          `).join('')}
        </div>
      `).join('')}

      <div class="pdf-total-box">
        <div>
          <div class="pdf-total-label">Итого к оплате</div>
          <div class="pdf-total-sub">тайских бат (THB)</div>
        </div>
        <div class="pdf-total-amount">${fmt(data.total)} ฿</div>
      </div>

      <div class="pdf-footer">
        Расчёт от ${data.gen} · Остров Сокровищ · phang-nga-tours.com
      </div>
    </div>
  </div>
  </body></html>`

  document.body.classList.add('printing')
  const cleanup = () => {
    document.body.classList.remove('printing')
    el.innerHTML = ''
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}

// ─── PRINT CUSTOM OPS (для оперейшена с нетто и маржой) ────
export function doPrintCustomOps(data) {
  if (!data) return
  const el = document.getElementById('print-area')
  if (!el) return

  const totSell = data.total || 0
  const totNet  = data.totalNet || 0
  const totMargin = totSell - totNet
  const margin = totSell > 0 ? (totMargin / totSell * 100) : 0

  const opsStyles = `
    body { background: #fafafa; }
    .ops-wrap {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #0f172a;
      min-height: 100vh;
      padding: 28px;
      max-width: 920px;
      margin: 0 auto;
    }
    .ops-header {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 14px; border-bottom: 2px solid #ef4444;
      margin-bottom: 18px;
    }
    .ops-logo { font-size: 16px; font-weight: 900; letter-spacing: 0.08em; color: #ef4444; text-transform: uppercase; }
    .ops-sub  { font-size: 9px; color: #64748b; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 3px; }
    .ops-doc  { text-align: right; font-size: 14px; font-weight: 700; color: #0f172a; }
    .ops-date { font-size: 10px; color: #64748b; margin-top: 2px; }
    .ops-client { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;
      display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; font-size: 11px; }
    .ops-client b { color: #ef4444; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
    table.ops { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 18px; }
    table.ops thead th { background: #fef2f2; color: #7f1d1d; padding: 8px; text-align: left; font-weight: 700; border-bottom: 2px solid #ef4444; }
    table.ops tbody td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    table.ops tbody tr:nth-child(even) { background: #fafafa; }
    .ops-num { text-align: right; font-variant-numeric: tabular-nums; }
    .ops-net { color: #b91c1c; font-weight: 600; }
    .ops-sell { color: #059669; font-weight: 700; }
    .ops-margin-pos { color: #16a34a; font-weight: 700; }
    .ops-margin-neg { color: #dc2626; font-weight: 700; }
    .ops-totals { margin-top: 12px; display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
    .ops-tot-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .ops-tot-card.profit { background: #f0fdf4; border-color: #86efac; }
    .ops-tot-card.warn { background: #fef2f2; border-color: #fecaca; }
    .ops-tot-lbl { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; }
    .ops-tot-val { font-size: 18px; font-weight: 900; margin-top: 4px; color: #0f172a; }
    .ops-footer { margin-top: 28px; text-align: center; font-size: 9px; color: #64748b; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    .src-tag { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; background: #ddd6fe; color: #5b21b6; margin-left: 6px; }
    .ovr-tag { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: #fef3c7; color: #92400e; margin-left: 4px; }
    @media print { body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  `

  el.innerHTML = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap'); ${opsStyles}</style>
  </head><body>
  <div class="ops-wrap">
    <div class="ops-header">
      <div>
        <div class="ops-logo">🔒 Внутренний расчёт · ОПЕРЕЙШЕН</div>
        <div class="ops-sub">Не показывать клиенту</div>
      </div>
      <div>
        <div class="ops-doc">Кастомный тур (для опс)</div>
        <div class="ops-date">${data.gen}</div>
      </div>
    </div>

    <div class="ops-client">
      ${data.name  ? `<div><b>Клиент</b>${data.name}</div>` : ''}
      ${data.date  ? `<div><b>Дата</b>${fmtDate(data.date)}</div>` : ''}
      ${data.phone ? `<div><b>Телефон</b>${data.phone}</div>` : ''}
      ${data.pax   ? `<div><b>Гостей</b>${data.pax}</div>` : ''}
    </div>

    <table class="ops">
      <thead>
        <tr>
          <th style="width:40px"></th>
          <th>Активность</th>
          <th>Категория / Поставщик</th>
          <th class="ops-num">Нетто</th>
          <th class="ops-num">Продажа</th>
          <th class="ops-num">Маржа</th>
          <th class="ops-num">%</th>
        </tr>
      </thead>
      <tbody>
        ${(data.parts || []).map(p => {
          const calc = p.calculated || { sell: 0, net: 0, margin: 0 }
          const m = calc.sell > 0 ? (calc.margin / calc.sell * 100) : 0
          const ovr = (p.override?.sell_total != null) || (p.override?.net_total != null)
          return `<tr>
            <td>${p.icon || '•'}</td>
            <td>
              <div style="font-weight:700">${p.name || ''}</div>
              <div style="font-size:10px;color:#64748b">${p.qty ? `${p.qty.adults || 0} взр${p.qty.children ? ' + '+p.qty.children+' дет' : ''}${p.qty.infants ? ' + '+p.qty.infants+' млд' : ''}` : ''}</div>
            </td>
            <td>
              <div>${p.category || ''}</div>
              <div style="font-size:10px;color:#64748b">${p.source || ''}<span class="src-tag">${p.source_id || ''}</span>${ovr ? '<span class="ovr-tag">override</span>' : ''}</div>
              ${p.override?.comment ? `<div style="font-size:10px;color:#92400e;margin-top:2px">💬 ${p.override.comment}</div>` : ''}
            </td>
            <td class="ops-num ops-net">${fmt(calc.net)} ฿</td>
            <td class="ops-num ops-sell">${fmt(calc.sell)} ฿</td>
            <td class="ops-num ${calc.margin >= 0 ? 'ops-margin-pos' : 'ops-margin-neg'}">${fmt(calc.margin)} ฿</td>
            <td class="ops-num ${m >= 0 ? 'ops-margin-pos' : 'ops-margin-neg'}">${m.toFixed(1)}%</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>

    <div class="ops-totals">
      <div class="ops-tot-card warn"><div class="ops-tot-lbl">Себестоимость</div><div class="ops-tot-val">${fmt(totNet)} ฿</div></div>
      <div class="ops-tot-card"><div class="ops-tot-lbl">К оплате</div><div class="ops-tot-val">${fmt(totSell)} ฿</div></div>
      <div class="ops-tot-card profit"><div class="ops-tot-lbl">Маржа</div><div class="ops-tot-val">${fmt(totMargin)} ฿</div></div>
      <div class="ops-tot-card profit"><div class="ops-tot-lbl">% маржи</div><div class="ops-tot-val">${margin.toFixed(1)}%</div></div>
    </div>

    <div class="ops-footer">${data.gen} · Внутренний документ · Остров Сокровищ</div>
  </div>
  </body></html>`

  document.body.classList.add('printing')
  const cleanup = () => {
    document.body.classList.remove('printing')
    el.innerHTML = ''
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}
