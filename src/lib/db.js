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
