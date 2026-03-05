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

// ─── PRINT ───────────────────────────────────────────────────
export function doPrint(data) {
  if (!data) return
  const pkgs = data.items.filter(i => i.type !== 'opt')
  const opts = data.items.filter(i => i.type === 'opt')

  const allItems = [
    ...pkgs.map(p => ({ icon: p.type === 'vip' ? '⭐' : '🚐', name: p.name })),
    ...opts.map(o => {
      const det = [o.aQ > 0 ? o.aQ + ' взр.' : '', o.cQ > 0 ? o.cQ + ' дет.' : ''].filter(Boolean).join(', ')
      return { icon: '🎯', name: o.name + (det ? ` (${det})` : '') }
    })
  ]

  // Create watermark grid (3x4)
  const wm = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
    const col = i % 3; const row = Math.floor(i / 3);
    return `<div style="position:absolute;top:${8 + row * 25}%;left:${5 + col * 33}%;transform:translate(-50%,-50%) rotate(-35deg);font-size:32px;font-weight:900;color:rgba(15,76,117,0.05);white-space:nowrap;pointer-events:none;letter-spacing:2px;font-family:sans-serif;">ОСТРОВ СОКРОВИЩ</div>`
  }).join('')

  const el = document.getElementById('print-area')
  if (!el) return
  el.innerHTML = `<div style="font-family:sans-serif;padding:28px 32px;max-width:700px;margin:0 auto;color:#1E293B;position:relative;overflow:hidden;min-height:100vh">
    ${wm}
    <div style="position:relative;z-index:1">
      <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:3px solid #0F4C75;margin-bottom:20px">
        <div>
          <div style="font-size:22px;font-weight:900;color:#0F4C75;letter-spacing:-0.5px">🏝 Остров Сокровищ</div>
          <div style="font-size:11px;color:#64748B;margin-top:2px;font-weight:500">Аренда яхт и катеров · Пхукет, Таиланд</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:15px;font-weight:700;color:#1E293B">Смета тура</div>
          <div style="font-size:10px;color:#64748B;margin-top:2px">${data.gen}</div>
        </div>
      </div>

      ${(data.name || data.date || data.phone) ? `
      <div style="background:#F0F5FA;border-radius:10px;padding:14px 16px;margin-bottom:18px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${data.name ? `<div><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Клиент</div><div style="font-size:13px;font-weight:700">${data.name}</div></div>` : ''}
        ${data.date ? `<div><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Дата</div><div style="font-size:13px;font-weight:700">${fmtDate(data.date)}</div></div>` : ''}
        ${data.phone ? `<div><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Телефон</div><div style="font-size:13px;font-weight:700">${data.phone}</div></div>` : ''}
        ${data.note ? `<div style="grid-column:1/-1"><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Примечание</div><div style="font-size:12px">${data.note}</div></div>` : ''}
      </div>` : ''}

      <div style="font-size:10px;font-weight:800;color:#0F4C75;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Что включено:</div>
      <div style="background:#fff;border:1.5px solid #E2E8F0;border-radius:10px;overflow:hidden">
        ${allItems.map((item, i) => `
          <div style="display:flex;align-items:center;padding:11px 16px;${i < allItems.length - 1 ? 'border-bottom:1px solid #F1F5F9' : ''}">
            <span style="font-size:16px;margin-right:12px;min-width:20px">${item.icon}</span>
            <span style="font-size:13px;font-weight:600;color:#1E293B">${item.name}</span>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:24px;background:#0F4C75;color:#fff;border-radius:10px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:11px;opacity:.85;font-weight:600;text-transform:uppercase;letter-spacing:.5px">ИТОГО К ОПЛАТЕ</div>
          <div style="font-size:10px;opacity:.65;margin-top:3px">тайских бат (THB)</div>
        </div>
        <div style="font-size:32px;font-weight:900;letter-spacing:-1px">${fmt(data.total)} ฿</div>
      </div>

      <div style="text-align:center;margin-top:20px;font-size:9px;color:#94a3b8;letter-spacing:.3px">
        Расчёт от ${data.gen} · Остров Сокровищ · phang-nga-tours.com
      </div>
    </div>
  </div>`

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
  el.innerHTML = `<div style="font-family:sans-serif;padding:20px;max-width:680px;margin:0 auto;color:#1E293B;position:relative;overflow:hidden">
    
    <!-- Водяной знак -->
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;pointer-events:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'250\\' height=\\'150\\'><text x=\\'50%\\' y=\\'50%\\' transform=\\'rotate(-35 125 75)\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\' font-family=\\'sans-serif\\' font-weight=\\'800\\' font-size=\\'16\\' fill=\\'%230F4C75\\' opacity=\\'0.1\\'>ОСТРОВ СОКРОВИЩ</text></svg>');background-repeat:repeat;"></div>

    <div style="position:relative;z-index:1">
      <div style="display:flex;justify-content:space-between;padding-bottom:14px;border-bottom:2px solid #0F4C75;margin-bottom:16px">
        <div><div style="font-size:18px;font-weight:800;color:#0F4C75">🏝 Остров Сокровищ</div><div style="font-size:11px;color:#334155;font-weight:600">Увлекательные экскурсии. Пхукет</div></div>
        <div style="text-align:right"><div style="font-size:16px;font-weight:700">Расчёт чартера</div><div style="font-size:10px;color:#64748B">${data.gen}</div></div>
      </div>

      <div style="background:#F0F5FA;border-radius:7px;padding:10px;margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:7px">
        ${data.name ? `<div><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase">Клиент</div><div style="font-size:12px;font-weight:700">${data.name}</div></div>` : ''}
        ${data.date ? `<div><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase">Дата</div><div style="font-size:12px;font-weight:700">${fmtDate(data.date)}</div></div>` : ''}
        ${data.phone ? `<div><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase">Телефон</div><div style="font-size:12px;font-weight:700">${data.phone}</div></div>` : ''}
        ${data.pax ? `<div><div style="font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase">Гостей</div><div style="font-size:12px;font-weight:700">${data.pax}</div></div>` : ''}
      </div>

      <div style="background:#0F4C75;color:#fff;border-radius:8px;padding:12px 14px;margin-bottom:12px">
        <div style="font-size:9px;opacity:.8;text-transform:uppercase">🚤 МАРШРУТ</div>
        <div style="font-weight:800;font-size:16px;margin-top:4px">${data.tourName}</div>
      </div>

      <div style="font-size:12px;font-weight:700;margin:16px 0 8px;color:#0F4C75;text-transform:uppercase">Что включено:</div>
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">
        <div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #F1F5F9">
          <span style="font-size:14px;margin-right:8px">🚤</span>
          <span style="font-size:13px;font-weight:600">Аренда катера по маршруту</span>
        </div>
        ${data.items.map(o => `
          <div style="display:flex;align-items:center;padding:8px 0;${o !== data.items[data.items.length - 1] ? 'border-bottom:1px solid #F1F5F9' : ''}">
            <span style="font-size:14px;margin-right:8px">${o.icon}</span>
            <span style="font-size:13px;font-weight:600">${o.name}</span>
            ${o.meta ? `<span style="font-size:11px;color:#64748B;margin-left:8px">(${o.meta.split(' × ')[0].trim()})</span>` : ''}
          </div>
        `).join('')}
      </div>

      <div style="margin-top:20px;background:#0F4C75;color:#fff;border-radius:8px;padding:16px;display:flex;justify-content:space-between;align-items:center">
        <div><div style="font-size:12px;opacity:.9">ИТОГО К ОПЛАТЕ</div><div style="font-size:10px;opacity:.7">тайских бат (THB)</div></div>
        <div style="font-size:28px;font-weight:800">${fmt(data.total)} ฿</div>
      </div>
    </div>
  </div>`

  document.body.classList.add('printing')
  const cleanup = () => {
    document.body.classList.remove('printing')
    el.innerHTML = ''
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}
