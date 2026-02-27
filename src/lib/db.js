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
      hours:        pkg.hours,
      name_ru:      pkg.name,
      mgr_price:    pkg.mgrPrice,
      netto_price:  pkg.nettoPrice,
      netto_detail: pkg.nettoDetail || '',
      extra_hour:   pkg.extraHour   || 1000,
      note:         pkg.note        || '',
      updated_at:   new Date().toISOString(),
    }
    const dbId = pkg._dbId ?? (typeof pkg.id === 'number' ? pkg.id : null)
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
    const dbId = opt._dbId ?? (typeof opt.id === 'number' ? opt.id : null)
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
    .select('payload, client_name, tour_date')
    .eq('id', calcId)
    .single()
  if (error) { console.warn('loadCalc:', error.message); return null }
  return data
}

// ─── AUTH ─────────────────────────────────────────────────────
export async function fetchUserRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) { console.warn('fetchRole:', error.message); return null }
  return data?.role ?? null
}
