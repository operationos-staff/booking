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
    font-size: 22px;
    font-weight: 900;
    color: #f59e0b;
    letter-spacing: -0.5px;
  }
  .pdf-logo-sub {
    font-size: 11px;
    color: #737373;
    margin-top: 3px;
    font-weight: 500;
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
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='280' height='160'><text x='50%' y='50%' transform='rotate(-35 140 80)' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-weight='900' font-size='18' fill='%23f59e0b' opacity='0.04'>ОСТРОВ СОКРОВИЩ</text></svg>");
    background-repeat: repeat;
  }
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
          <div class="pdf-logo-title">🏝 Остров Сокровищ</div>
          <div class="pdf-logo-sub">Аренда яхт и катеров · Пхукет, Таиланд</div>
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
          <div class="pdf-logo-title">🏝 Остров Сокровищ</div>
          <div class="pdf-logo-sub">Увлекательные экскурсии. Пхукет</div>
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
