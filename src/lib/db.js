import { supabase } from './supabase'

// ─── PACKAGES ────────────────────────────────────────────────
export async function loadPackagesFromDB() {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('sort_order')

  if (error) { console.warn('loadPackages:', error.message); return null }
  if (!data?.length) return null

  return data.map(p => ({
    id:          p.id,
    _dbId:       p.id,
    type:        p.type,
    category:    p.category    || 'Групповые туры',
    provider:    p.provider    || '',
    hours:       p.hours,
    name:        p.name_ru,
    mgrPrice:    p.mgr_price,
    nettoPrice:  p.netto_price,
    nettoDetail: p.netto_detail || '',
    extraHour:   p.extra_hour  || 1000,
    note:        p.note        || '',
  }))
}

export async function savePackagesToDB(packages) {
  let ok = 0
  for (const pkg of packages) {
    const row = {
      type:         pkg.type,
      category:     pkg.category    || 'Групповые туры',
      provider:     pkg.provider    || '',
      hours:        pkg.hours,
      name_ru:      pkg.name,
      mgr_price:    pkg.mgrPrice,
      netto_price:  pkg.nettoPrice,
      netto_detail: pkg.nettoDetail || '',
      extra_hour:   pkg.extraHour   || 1000,
      note:         pkg.note        || '',
      updated_at:   new Date().toISOString(),
    }
    const MAX_SERIAL = 2147483647
    const dbId = pkg._dbId ?? (typeof pkg.id === 'number' && pkg.id <= MAX_SERIAL ? pkg.id : null)
    if (dbId) {
      const { error } = await supabase.from('packages').update(row).eq('id', dbId)
      if (!error) ok++
      else console.error('pkg update', dbId, error.message)
    } else {
      const { data, error } = await supabase.from('packages').insert(row).select().single()
      if (!error && data) { pkg._dbId = data.id; pkg.id = data.id; ok++ }
      else console.error('pkg insert', error?.message)
    }
  }
  return ok
}

export async function deletePackageFromDB(id) {
  const { error } = await supabase.from('packages').delete().eq('id', id)
  if (error) console.error('deletePackage:', error.message)
}

// ─── OPTIONS ─────────────────────────────────────────────────
export async function loadOptionsFromDB() {
  const { data, error } = await supabase
    .from('options')
    .select('*')
    .order('sort_order')

  if (error) { console.warn('loadOptions:', error.message); return null }
  if (!data?.length) return null

  return data.map(o => ({
    id:    o.id,
    _dbId: o.id,
    name:  o.name_ru,
    mgrA:  o.mgr_price_adult,
    mgrC:  o.mgr_price_child,
    netA:  o.net_price_adult,
    netC:  o.net_price_child,
    only8h: o.only_8h || false,
    cat:   o.category || 'Достопримечательности',
    note:  o.note     || '',
  }))
}

export async function saveOptionsToDB(options) {
  let ok = 0
  for (const opt of options) {
    const row = {
      name_ru:         opt.name,
      mgr_price_adult: opt.mgrA,
      mgr_price_child: opt.mgrC,
      net_price_adult: opt.netA,
      net_price_child: opt.netC,
      only_8h:         opt.only8h || false,
      category:        opt.cat    || 'Достопримечательности',
      note:            opt.note   || '',
      updated_at:      new Date().toISOString(),
    }
    const MAX_SERIAL = 2147483647
    const dbId = opt._dbId ?? (typeof opt.id === 'number' && opt.id <= MAX_SERIAL ? opt.id : null)
    if (dbId) {
      const { error } = await supabase.from('options').update(row).eq('id', dbId)
      if (!error) ok++
      else console.error('opt update', dbId, error.message)
    } else {
      const { data, error } = await supabase.from('options').insert(row).select().single()
      if (!error && data) { opt._dbId = data.id; opt.id = data.id; ok++ }
      else console.error('opt insert', error?.message)
    }
  }
  return ok
}

export async function deleteOptionFromDB(id) {
  const { error } = await supabase.from('options').delete().eq('id', id)
  if (error) console.error('deleteOption:', error.message)
}

// ─── CHARTER CONFIG ──────────────────────────────────────────
// Strategy: try charter_config table first, fallback to calculations table
const CHARTER_CONFIG_KEY = 'charter_main_config'
const CHARTER_CALC_ID = '__charter_config__'

async function tryCharterConfigTable(action, charterData) {
  if (action === 'load') {
    const { data, error } = await supabase
      .from('charter_config')
      .select('payload')
      .eq('config_key', CHARTER_CONFIG_KEY)
      .maybeSingle()
    if (error) throw error
    return data?.payload ?? null
  }
  if (action === 'save') {
    const { error } = await supabase
      .from('charter_config')
      .upsert({
        config_key: CHARTER_CONFIG_KEY,
        payload: charterData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'config_key' })
    if (error) throw error
    return true
  }
}

async function tryCalculationsTable(action, charterData) {
  if (action === 'load') {
    const { data, error } = await supabase
      .from('calculations')
      .select('payload')
      .eq('client_name', CHARTER_CALC_ID)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data?.payload ?? null
  }
  if (action === 'save') {
    // First try to find existing
    const { data: existing } = await supabase
      .from('calculations')
      .select('id')
      .eq('client_name', CHARTER_CALC_ID)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase
        .from('calculations')
        .update({ payload: charterData })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('calculations')
        .insert({
          created_by: CHARTER_CALC_ID,
          client_name: CHARTER_CALC_ID,
          payload: charterData,
        })
      if (error) throw error
    }
    return true
  }
}

export async function loadCharterFromDB() {
  try {
    const result = await tryCharterConfigTable('load')
    return result
  } catch (e) {
    console.warn('charter_config load failed:', e.message)
    return null
  }
}

export async function saveCharterToDB(charterData) {
  try {
    return await tryCharterConfigTable('save', charterData)
  } catch (e) {
    console.error('charter_config save failed:', e.message)
    return false
  }
}

// ─── LAND TOUR CONFIG ────────────────────────────────────────
// Сухопутные экскурсии — отдельный ключ в той же таблице charter_config
const LAND_CONFIG_KEY = 'land_main_config'

export async function loadLandFromDB() {
  try {
    const { data, error } = await supabase
      .from('charter_config')
      .select('payload')
      .eq('config_key', LAND_CONFIG_KEY)
      .maybeSingle()
    if (error) throw error
    return data?.payload ?? null
  } catch (e) {
    console.warn('land_config load failed:', e.message)
    return null
  }
}

export async function saveLandToDB(landData) {
  try {
    const { error } = await supabase
      .from('charter_config')
      .upsert({
        config_key: LAND_CONFIG_KEY,
        payload: landData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'config_key' })
    if (error) throw error
    return true
  } catch (e) {
    console.error('land_config save failed:', e.message)
    return false
  }
}

// ─── SIGHTS / OVERVIEW TOUR CONFIG ──────────────────────────
// Обзорные экскурсии — отдельный ключ в той же таблице charter_config
const SIGHTS_CONFIG_KEY = 'sights_main_config'

export async function loadSightsFromDB() {
  try {
    const { data, error } = await supabase
      .from('charter_config')
      .select('payload')
      .eq('config_key', SIGHTS_CONFIG_KEY)
      .maybeSingle()
    if (error) throw error
    return data?.payload ?? null
  } catch (e) {
    console.warn('sights_config load failed:', e.message)
    return null
  }
}

export async function saveSightsToDB(sightsData) {
  try {
    const { error } = await supabase
      .from('charter_config')
      .upsert({
        config_key: SIGHTS_CONFIG_KEY,
        payload: sightsData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'config_key' })
    if (error) throw error
    return true
  } catch (e) {
    console.error('sights_config save failed:', e.message)
    return false
  }
}

// ─── INDIVIDUAL TOUR CONFIG ─────────────────────────────────
// Индивидуальные экскурсии — отдельный ключ, модель цен base + extraPax
const INDIVIDUAL_CONFIG_KEY = 'individual_main_config'

export async function loadIndividualFromDB() {
  try {
    const { data, error } = await supabase
      .from('charter_config')
      .select('payload')
      .eq('config_key', INDIVIDUAL_CONFIG_KEY)
      .maybeSingle()
    if (error) throw error
    return data?.payload ?? null
  } catch (e) {
    console.warn('individual_config load failed:', e.message)
    return null
  }
}

export async function saveIndividualToDB(individualData) {
  try {
    const { error } = await supabase
      .from('charter_config')
      .upsert({
        config_key: INDIVIDUAL_CONFIG_KEY,
        payload: individualData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'config_key' })
    if (error) throw error
    return true
  } catch (e) {
    console.error('individual_config save failed:', e.message)
    return false
  }
}

// ─── AVIA TOUR CONFIG ───────────────────────────────────────
// Авиатуры в ЮВА — отдельный ключ, гибридная модель цен (per_pax | base+extra)
const AVIA_CONFIG_KEY = 'avia_main_config'

export async function loadAviaFromDB() {
  try {
    const { data, error } = await supabase
      .from('charter_config')
      .select('payload')
      .eq('config_key', AVIA_CONFIG_KEY)
      .maybeSingle()
    if (error) throw error
    return data?.payload ?? null
  } catch (e) {
    console.warn('avia_config load failed:', e.message)
    return null
  }
}

export async function saveAviaToDB(aviaData) {
  try {
    const { error } = await supabase
      .from('charter_config')
      .upsert({
        config_key: AVIA_CONFIG_KEY,
        payload: aviaData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'config_key' })
    if (error) throw error
    return true
  } catch (e) {
    console.error('avia_config save failed:', e.message)
    return false
  }
}

// ─── FISHING TOUR CONFIG ────────────────────────────────────
// Рыбалка — отдельный ключ, модель цен per_pax (взр/дет/мл)
const FISHING_CONFIG_KEY = 'fishing_main_config'

export async function loadFishingFromDB() {
  try {
    const { data, error } = await supabase
      .from('charter_config')
      .select('payload')
      .eq('config_key', FISHING_CONFIG_KEY)
      .maybeSingle()
    if (error) throw error
    return data?.payload ?? null
  } catch (e) {
    console.warn('fishing_config load failed:', e.message)
    return null
  }
}

export async function saveFishingToDB(fishingData) {
  try {
    const { error } = await supabase
      .from('charter_config')
      .upsert({
        config_key: FISHING_CONFIG_KEY,
        payload: fishingData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'config_key' })
    if (error) throw error
    return true
  } catch (e) {
    console.error('fishing_config save failed:', e.message)
    return false
  }
}

// ─── UNIFIED CATALOG (Materialized View catalog_items) ─────
// Возвращает унифицированный список всех 110+ туров/опций из 7 источников.
// Если view ещё не создано в БД — fallback: грузим 7 источников параллельно
// и собираем каталог в памяти на клиенте.
export async function getCatalogItems({ source, category, search } = {}) {
  // 1. Сначала пробуем view
  try {
    let query = supabase.from('catalog_items').select('*')
    if (source)   query = query.eq('source', source)
    if (category) query = query.eq('category', category)
    if (search)   query = query.ilike('name', `%${search}%`)
    const { data, error } = await query.order('category').order('name').limit(500)
    if (!error && data) return data
    if (error) console.warn('catalog_items view not available:', error.message)
  } catch (e) {
    console.warn('catalog_items query failed, falling back:', e.message)
  }
  // 2. Fallback — собираем из 7 источников
  try {
    const [pkgs, opts, land, sights, indiv, avia, fish] = await Promise.all([
      loadPackagesFromDB(), loadOptionsFromDB(),
      loadLandFromDB(), loadSightsFromDB(),
      loadIndividualFromDB(), loadAviaFromDB(), loadFishingFromDB(),
    ])
    return buildCatalogFallback({ pkgs, opts, land, sights, indiv, avia, fish })
      .filter(it => !source   || it.source === source)
      .filter(it => !category || it.category === category)
      .filter(it => !search   || (it.name || '').toLowerCase().includes(search.toLowerCase()))
  } catch (e) {
    console.error('catalog fallback failed:', e.message)
    return []
  }
}

// In-memory fallback builder
function buildCatalogFallback({ pkgs = [], opts = [], land, sights, indiv, avia, fish }) {
  const list = []
  // packages
  for (const p of (pkgs || [])) {
    list.push({
      global_id: 'packages:' + p.id,
      source: 'packages', source_id: String(p.id),
      name: p.name, icon: p.type === 'vip' ? '⭐' : '🚐',
      category: 'Групповые туры',
      pricing_model: 'per_vehicle',
      net_base: p.nettoPrice || 0, sell_base: p.mgrPrice || 0,
      extra_pax_sell: 0, extra_pax_net: 0, inclusive_pax: 0,
      sell_adult: 0, sell_child: 0, sell_infant: 0,
      net_adult: 0, net_child: 0, net_infant: 0,
      meta: { hours: p.hours, type: p.type, note: p.note }
    })
  }
  // options
  for (const o of (opts || [])) {
    list.push({
      global_id: 'options:' + o.id,
      source: 'options', source_id: String(o.id),
      name: o.name, icon: '📍',
      category: o.cat || 'Опции',
      pricing_model: 'per_pax',
      net_base: 0, sell_base: 0,
      extra_pax_sell: 0, extra_pax_net: 0, inclusive_pax: 0,
      sell_adult: o.mgrA || 0, sell_child: o.mgrC || 0, sell_infant: 0,
      net_adult: o.netA || 0,  net_child: o.netC || 0,  net_infant: 0,
      meta: { only_8h: o.only8h, note: o.note }
    })
  }
  // JSONB категории (5)
  const jsonSources = [
    { src: 'land',       cat: 'Сухопутные',     data: land },
    { src: 'sights',     cat: 'Обзорные',       data: sights },
    { src: 'individual', cat: 'Индивидуальные', data: indiv },
    { src: 'avia',       cat: 'Авиатуры в ЮВА', data: avia },
    { src: 'fishing',    cat: 'Рыбалка',        data: fish },
  ]
  for (const { src, cat, data } of jsonSources) {
    if (!data?.routes) continue
    for (const r of data.routes) {
      list.push({
        global_id: src + ':' + r.id,
        source: src, source_id: String(r.id),
        name: r.name, icon: r.icon || '📦',
        category: cat,
        pricing_model: r.pricingMode || (['land','sights','fishing'].includes(src) ? 'per_pax' : 'base_plus_extra'),
        net_base: r.baseNet || 0, sell_base: r.baseSell || 0,
        extra_pax_sell: r.extraPaxSell || 0, extra_pax_net: r.extraPaxNet || 0,
        inclusive_pax: r.inclusivePax || 0,
        sell_adult: r.extraAdult || r.sellAdult || 0,
        sell_child: r.extraChild || r.sellChild || 0,
        sell_infant: r.extraInfant || 0,
        net_adult:  r.extraAdultNet || r.netAdult || 0,
        net_child:  r.extraChildNet || r.netChild || 0,
        net_infant: r.extraInfantNet || 0,
        meta: { days: r.days, duration: r.duration, transport: r.transport,
                description: r.description, group: r.group, icon: r.icon }
      })
    }
  }
  return list
}

// ─── CUSTOM TOURS (конструктор) ─────────────────────────────
export async function saveCustomTour(tour) {
  // tour: { id?, client_name, status, parts, total_sell, total_net, total_margin, pricing_snapshot, notes, metadata }
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('not authenticated')
    const row = {
      ...tour,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }
    if (tour.id) {
      const { error } = await supabase.from('custom_tours').update(row).eq('id', tour.id)
      if (error) throw error
      return tour.id
    } else {
      const { data, error } = await supabase.from('custom_tours').insert(row).select('id').single()
      if (error) throw error
      return data.id
    }
  } catch (e) {
    console.error('saveCustomTour failed:', e.message)
    return null
  }
}

export async function loadCustomTour(id) {
  try {
    const { data, error } = await supabase.from('custom_tours').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data
  } catch (e) {
    console.warn('loadCustomTour failed:', e.message)
    return null
  }
}

export async function loadCustomTours({ status, limit = 50 } = {}) {
  try {
    let q = supabase.from('custom_tours').select('id,client_name,status,total_sell,total_margin,created_at,updated_at,sent_at')
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) throw error
    return data || []
  } catch (e) {
    console.warn('loadCustomTours failed:', e.message)
    return []
  }
}

export async function deleteCustomTour(id) {
  try {
    const { error } = await supabase.from('custom_tours').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) {
    console.error('deleteCustomTour failed:', e.message)
    return false
  }
}

// ─── CALCULATIONS ─────────────────────────────────────────────
export async function saveCalculation(userId, clientName, tourDate, payload) {
  const { data, error } = await supabase
    .from('calculations')
    .insert({
      created_by:  userId,
      client_name: clientName,
      tour_date:   tourDate || null,
      payload,
    })
    .select()
    .single()
  if (error) { console.error('saveCalc:', error.message); return null }
  return data?.id ?? null
}

export async function loadCalculation(calcId) {
  const { data, error } = await supabase
    .from('calculations')
    .select('payload, client_name, tour_date, created_at')
    .eq('id', calcId)
    .single()
  if (error) { console.warn('loadCalc:', error.message); return null }
  return data
}

export async function loadCalculations({ userId, role, limit = 20, offset = 0, search = '' } = {}) {
  let q = supabase
    .from('calculations')
    .select('id, client_name, tour_date, created_at, created_by')
    .not('client_name', 'eq', '__charter_config__')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (role !== 'booking' && userId) q = q.eq('created_by', userId)
  if (search) q = q.ilike('client_name', `%${search}%`)

  const { data, error } = await q
  if (error) { console.warn('loadCalculations:', error.message); return [] }
  return data || []
}

export async function deleteCalculation(id) {
  const { error } = await supabase.from('calculations').delete().eq('id', id)
  if (error) console.error('deleteCalculation:', error.message)
}

// ─── ACTIVITY LOG ─────────────────────────────────────────────
export async function logActivity(userId, userEmail, action, details = {}) {
  try {
    await supabase.from('activity_log').insert({
      user_id:    userId   || null,
      user_email: userEmail || null,
      action,
      details,
    })
  } catch (e) {
    console.warn('logActivity failed:', e.message)
  }
}

export async function loadActivityLog({ limit = 100, offset = 0, action = null } = {}) {
  let q = supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action) q = q.eq('action', action)

  const { data, error } = await q
  if (error) { console.warn('loadActivityLog:', error.message); throw new Error(error.message) }
  return data || []
}

// ─── STATISTICS ───────────────────────────────────────────────
export async function loadStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [totalRes, weekRes, monthRes, recentCalcsRes, recentLoginsRes] = await Promise.all([
    supabase.from('calculations').select('*', { count: 'exact', head: true }).not('client_name', 'eq', '__charter_config__'),
    supabase.from('calculations').select('*', { count: 'exact', head: true }).not('client_name', 'eq', '__charter_config__').gte('created_at', weekAgo),
    supabase.from('calculations').select('*', { count: 'exact', head: true }).not('client_name', 'eq', '__charter_config__').gte('created_at', monthAgo),
    supabase.from('calculations').select('created_at, client_name').not('client_name', 'eq', '__charter_config__').gte('created_at', monthAgo).order('created_at', { ascending: false }),
    supabase.from('activity_log').select('user_email, created_at').eq('action', 'login').order('created_at', { ascending: false }).limit(10),
  ])

  return {
    totalCalcs:   totalRes.count    ?? 0,
    weekCalcs:    weekRes.count     ?? 0,
    monthCalcs:   monthRes.count    ?? 0,
    recentCalcs:  recentCalcsRes.data  || [],
    recentLogins: recentLoginsRes.data || [],
  }
}

// ─── BRAND SETTINGS ───────────────────────────────────────────
const BRAND_SETTINGS_KEY = 'brand_settings'

export async function loadBrandSettings() {
  try {
    const { data, error } = await supabase
      .from('charter_config')
      .select('payload')
      .eq('config_key', BRAND_SETTINGS_KEY)
      .maybeSingle()
    if (error) throw error
    return data?.payload ?? null
  } catch (e) {
    console.warn('loadBrandSettings failed:', e.message)
    return null
  }
}

export async function saveBrandSettings(settings) {
  try {
    const { error } = await supabase
      .from('charter_config')
      .upsert({ config_key: BRAND_SETTINGS_KEY, payload: settings, updated_at: new Date().toISOString() }, { onConflict: 'config_key' })
    if (error) throw error
    return true
  } catch (e) {
    console.error('saveBrandSettings failed:', e.message)
    return false
  }
}

// ─── EXCURSIONS ───────────────────────────────────────────────
export async function loadExcursionsFromDB() {
  const { data, error } = await supabase
    .from('excursions')
    .select('*')
    .order('sort_order')
    .order('created_at')
  if (error) { console.warn('loadExcursions:', error.message); return [] }
  return (data || []).map(e => ({
    _dbId:            e.id,
    id:               e.id,
    name:             e.name,
    category:         e.category,
    type:             e.excursion_type,
    provider:         e.provider || '',
    pricingModel:     e.pricing_model,
    mgrPrice:         e.mgr_price,
    nettoPrice:       e.netto_price,
    mgrPriceChild:    e.mgr_price_child,
    nettoPriceChild:  e.netto_price_child,
    hours:            e.duration_hours,
    extraHour:        e.extra_hour,
    maxPax:           e.max_pax,
    note:             e.note || '',
    nettoDetail:      e.netto_detail || '',
    isActive:         e.is_active,
    sortOrder:        e.sort_order,
    customFields:     e.custom_fields || [],
  }))
}

export async function saveExcursionToDB(exc) {
  const row = {
    name:               exc.name,
    category:           exc.category || 'Групповые туры',
    excursion_type:     exc.type || 'base',
    provider:           exc.provider || '',
    pricing_model:      exc.pricingModel || 'per_person',
    mgr_price:          exc.mgrPrice || 0,
    netto_price:        exc.nettoPrice || 0,
    mgr_price_child:    exc.mgrPriceChild || 0,
    netto_price_child:  exc.nettoPriceChild || 0,
    duration_hours:     exc.hours || 8,
    extra_hour:         exc.extraHour || 1000,
    max_pax:            exc.maxPax || 0,
    note:               exc.note || '',
    netto_detail:       exc.nettoDetail || '',
    is_active:          exc.isActive !== false,
    sort_order:         exc.sortOrder || 0,
    custom_fields:      exc.customFields || [],
    updated_at:         new Date().toISOString(),
  }
  if (exc._dbId) {
    const { error } = await supabase.from('excursions').update(row).eq('id', exc._dbId)
    if (error) { console.error('saveExcursion update:', error.message); return null }
    return exc._dbId
  } else {
    const { data, error } = await supabase.from('excursions').insert(row).select().single()
    if (error) { console.error('saveExcursion insert:', error.message); return null }
    return data?.id ?? null
  }
}

export async function deleteExcursionFromDB(id) {
  const { error } = await supabase.from('excursions').delete().eq('id', id)
  if (error) console.error('deleteExcursion:', error.message)
}

// ─── AUTH ─────────────────────────────────────────────────────
export async function fetchUserRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, display_name')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) { console.warn('fetchRole:', error.message); return null }
  return data ?? null
}

export async function saveDisplayName(userId, displayName) {
  const { error } = await supabase
    .from('user_roles')
    .update({ display_name: displayName })
    .eq('user_id', userId)
  if (error) { console.error('saveDisplayName:', error.message); return false }
  return true
}
