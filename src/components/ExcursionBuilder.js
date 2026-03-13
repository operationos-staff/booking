'use client'
import { useState, useEffect, useCallback } from 'react'
import { EXCURSION_CATEGORIES, PACKAGE_TYPE_META } from '@/lib/constants'
import { loadExcursionsFromDB, saveExcursionToDB, deleteExcursionFromDB } from '@/lib/db'
import { fmt } from '@/lib/utils'

const PRICING_MODELS = [
  { key: 'per_person',  label: '👤 За человека',    desc: 'Цена × кол-во туристов (взр/дет)' },
  { key: 'per_vehicle', label: '🚐 За транспорт',   desc: 'Фиксированная цена за лодку / авто / автобус' },
  { key: 'per_group',   label: '🎯 За группу',      desc: 'Фиксированная цена за всю группу' },
]

const FIELD_TYPES = ['text', 'number', 'boolean', 'date']

const EMPTY = {
  name: '', category: 'Групповые туры', type: 'base', provider: '',
  pricingModel: 'per_person',
  mgrPrice: 0, nettoPrice: 0, mgrPriceChild: 0, nettoPriceChild: 0,
  hours: 8, extraHour: 1000, maxPax: 0,
  note: '', nettoDetail: '',
  isActive: true, sortOrder: 0,
  customFields: [],
}

export default function ExcursionBuilder({ toast, role }) {
  const [excursions, setExcursions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [isNew, setIsNew] = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [newTypeName, setNewTypeName] = useState('')
  const [showNewType, setShowNewType] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const data = await loadExcursionsFromDB()
    setExcursions(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const upd = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const selectExc = (exc) => {
    setForm({ ...EMPTY, ...exc })
    setIsNew(false)
  }

  const newExc = () => {
    setForm(EMPTY)
    setIsNew(true)
  }

  const save = async () => {
    if (!form.name.trim()) { toast('Введите название', 'err'); return }
    setSaving(true)
    try {
      const id = await saveExcursionToDB(form)
      if (!id) throw new Error('Нет ID')
      toast(isNew ? 'Экскурсия создана!' : 'Сохранено!', 'ok')
      await loadAll()
      // Select the saved item
      const updated = await loadExcursionsFromDB()
      setExcursions(updated)
      const saved = updated.find(e => e._dbId === id || e.id === id)
      if (saved) { setForm({ ...EMPTY, ...saved }); setIsNew(false) }
    } catch (e) {
      toast('Ошибка: ' + e.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!form._dbId) return
    if (!confirm(`Удалить "${form.name}"?`)) return
    await deleteExcursionFromDB(form._dbId)
    toast('Удалено', 'ok')
    setForm(EMPTY); setIsNew(true)
    await loadAll()
  }

  // ── Custom Fields ──
  const addCustomField = () => {
    upd('customFields', [...(form.customFields || []), { key: '', label: '', value: '', fieldType: 'text' }])
  }
  const updCustomField = (i, k, v) => {
    const cf = [...(form.customFields || [])]
    cf[i] = { ...cf[i], [k]: v }
    upd('customFields', cf)
  }
  const removeCustomField = (i) => {
    const cf = [...(form.customFields || [])]
    cf.splice(i, 1)
    upd('customFields', cf)
  }

  // ── Type management ──
  const allTypes = Object.entries(PACKAGE_TYPE_META)
  const typeExists = allTypes.some(([k]) => k === form.type)

  const cats = ['all', ...EXCURSION_CATEGORIES.map(c => c.key)]
  const filtered = filterCat === 'all' ? excursions : excursions.filter(e => e.category === filterCat)

  const pm = PRICING_MODELS.find(p => p.key === form.pricingModel) || PRICING_MODELS[0]
  const isPerPerson = form.pricingModel === 'per_person'
  const isPerVehicle = form.pricingModel === 'per_vehicle'

  const S = {
    page: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px', height: 'calc(100vh - 120px)' },
    sidebar: { background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    sideHead: { padding: '14px 16px', borderBottom: '1px solid var(--brd)', display: 'flex', flexDirection: 'column', gap: '8px' },
    list: { flex: 1, overflowY: 'auto', padding: '8px' },
    listItem: (active) => ({
      padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
      background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
      border: `1px solid ${active ? 'rgba(245,158,11,0.4)' : 'transparent'}`,
      marginBottom: '4px', transition: 'all 0.12s',
    }),
    panel: { background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: '14px', overflowY: 'auto', padding: '24px' },
    section: { marginBottom: '24px' },
    sectionTitle: { fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--brd)' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
    field: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '10px', fontWeight: 700, color: 'var(--txm)', textTransform: 'uppercase', letterSpacing: '0.06em' },
    inp: { background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
    inpGold: { borderColor: 'rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.06)', color: '#fbbf24', fontWeight: 800 },
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>🏗️ Конструктор экскурсий</h1>
          <p style={{ fontSize: '11px', color: 'var(--txl)', margin: '3px 0 0' }}>
            Создавайте любые типы экскурсий с произвольными полями
          </p>
        </div>
        <button
          className="btn btn-p"
          onClick={newExc}
          style={{ padding: '9px 18px', background: 'var(--pr)', width: 'auto' }}
        >
          ➕ Новая экскурсия
        </button>
      </div>

      <div style={S.page}>
        {/* ── LEFT SIDEBAR ── */}
        <div style={S.sidebar}>
          <div style={S.sideHead}>
            <div style={{ fontSize: '11px', color: 'var(--txl)', fontWeight: 600 }}>
              {loading ? 'Загрузка...' : `${excursions.length} экскурсий`}
            </div>
            {/* Category filter */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {cats.map(c => {
                const catMeta = EXCURSION_CATEGORIES.find(x => x.key === c)
                return (
                  <button key={c} onClick={() => setFilterCat(c)} style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                    border: '1px solid', cursor: 'pointer', fontFamily: 'inherit',
                    background: filterCat === c ? 'rgba(245,158,11,0.2)' : 'transparent',
                    borderColor: filterCat === c ? '#f59e0b' : 'var(--brd)',
                    color: filterCat === c ? '#f59e0b' : 'var(--txl)',
                  }}>
                    {c === 'all' ? 'Все' : `${catMeta?.icon || ''} ${c}`}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={S.list}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--txl)', padding: '20px', fontSize: '12px' }}>
                {loading ? 'Загрузка...' : 'Нет экскурсий'}
              </div>
            )}
            {filtered.map(exc => {
              const isActive = form._dbId === exc._dbId
              const pm = PRICING_MODELS.find(p => p.key === exc.pricingModel)
              const catMeta = EXCURSION_CATEGORIES.find(c => c.key === exc.category)
              return (
                <div
                  key={exc.id}
                  style={S.listItem(isActive)}
                  onClick={() => selectExc(exc)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--txt)', lineHeight: 1.3 }}>
                      {!exc.isActive && <span style={{ color: '#64748b', marginRight: '4px' }}>⏸</span>}
                      {exc.name}
                    </div>
                    <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {fmt(exc.mgrPrice)} ฿
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--txl)' }}>
                      {catMeta?.icon} {exc.category}
                    </span>
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--txl)' }}>
                      {pm?.label || exc.pricingModel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT FORM ── */}
        <div style={S.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--txt)' }}>
              {isNew ? '✨ Новая экскурсия' : `✏️ ${form.name || 'Редактирование'}`}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isNew && (
                <button onClick={del} style={{
                  padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                  border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)',
                  color: '#f87171', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  🗑️ Удалить
                </button>
              )}
              <button onClick={save} disabled={saving} style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                border: 'none', background: saving ? '#64748b' : '#f59e0b',
                color: '#111', cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
              }}>
                {saving ? '⏳ Сохранение...' : (isNew ? '✅ Создать' : '💾 Сохранить')}
              </button>
            </div>
          </div>

          {/* ── SECTION 1: Основное ── */}
          <div style={S.section}>
            <div style={S.sectionTitle}>📋 Основная информация</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={S.field}>
                <label style={S.label}>Название экскурсии *</label>
                <input
                  style={S.inp} value={form.name} placeholder="напр. Снорклинг острова Симилан"
                  onChange={e => upd('name', e.target.value)}
                />
              </div>
              <div style={S.grid2}>
                <div style={S.field}>
                  <label style={S.label}>Категория</label>
                  <select style={S.inp} value={form.category} onChange={e => upd('category', e.target.value)}>
                    {EXCURSION_CATEGORIES.map(c => (
                      <option key={c.key} value={c.key}>{c.icon} {c.key}</option>
                    ))}
                  </select>
                </div>
                <div style={S.field}>
                  <label style={S.label}>Тип</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select style={{ ...S.inp, flex: 1 }} value={typeExists ? form.type : '__custom__'} onChange={e => {
                      if (e.target.value === '__custom__') setShowNewType(true)
                      else upd('type', e.target.value)
                    }}>
                      {allTypes.map(([k, m]) => (
                        <option key={k} value={k}>{m.icon} {k}</option>
                      ))}
                      {!typeExists && <option value={form.type}>{form.type}</option>}
                      <option value="__custom__">+ Новый тип...</option>
                    </select>
                  </div>
                  {showNewType && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <input
                        style={{ ...S.inp, flex: 1 }}
                        value={newTypeName} placeholder="Название типа..."
                        onChange={e => setNewTypeName(e.target.value)}
                      />
                      <button onClick={() => {
                        if (newTypeName.trim()) { upd('type', newTypeName.trim()); setNewTypeName(''); setShowNewType(false) }
                      }} style={{ padding: '8px 12px', borderRadius: '8px', background: '#f59e0b', border: 'none', color: '#111', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
                        ✓
                      </button>
                      <button onClick={() => setShowNewType(false)} style={{ padding: '8px 10px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--brd)', color: 'var(--txl)', cursor: 'pointer' }}>✕</button>
                    </div>
                  )}
                  {!typeExists && !showNewType && (
                    <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>
                      Текущий: <b>{form.type}</b>
                    </div>
                  )}
                </div>
              </div>
              <div style={S.grid2}>
                <div style={S.field}>
                  <label style={S.label}>Провайдер / оператор</label>
                  <input style={S.inp} value={form.provider} placeholder="напр. Sea Captain Tours"
                    onChange={e => upd('provider', e.target.value)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Активна</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '36px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--txt)' }}>
                      <input type="checkbox" checked={form.isActive} onChange={e => upd('isActive', e.target.checked)} style={{ width: 'auto', accentColor: '#f59e0b' }} />
                      {form.isActive ? '✅ Показывать' : '⏸ Скрыта'}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: Модель цен ── */}
          <div style={S.section}>
            <div style={S.sectionTitle}>💰 Модель ценообразования</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {PRICING_MODELS.map(pm => (
                <button key={pm.key} onClick={() => upd('pricingModel', pm.key)} style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'center',
                  border: `1.5px solid ${form.pricingModel === pm.key ? '#f59e0b' : 'var(--brd)'}`,
                  background: form.pricingModel === pm.key ? 'rgba(245,158,11,0.1)' : 'transparent',
                  color: form.pricingModel === pm.key ? '#f59e0b' : 'var(--txl)',
                }}>
                  <div style={{ fontWeight: 800, fontSize: '13px' }}>{pm.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{pm.desc}</div>
                </button>
              ))}
            </div>

            {/* Price fields */}
            {isPerPerson ? (
              <div style={S.grid2}>
                <div style={S.field}>
                  <label style={S.label}>Цена менеджер (взр.) ฿</label>
                  <input type="number" min="0" style={{ ...S.inp, ...S.inpGold }} value={form.mgrPrice}
                    onChange={e => upd('mgrPrice', parseInt(e.target.value) || 0)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Цена менеджер (дет.) ฿</label>
                  <input type="number" min="0" style={{ ...S.inp, ...S.inpGold }} value={form.mgrPriceChild}
                    onChange={e => upd('mgrPriceChild', parseInt(e.target.value) || 0)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Нетто (взр.) ฿</label>
                  <input type="number" min="0" style={S.inp} value={form.nettoPrice}
                    onChange={e => upd('nettoPrice', parseInt(e.target.value) || 0)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Нетто (дет.) ฿</label>
                  <input type="number" min="0" style={S.inp} value={form.nettoPriceChild}
                    onChange={e => upd('nettoPriceChild', parseInt(e.target.value) || 0)} />
                </div>
              </div>
            ) : (
              <div style={S.grid2}>
                <div style={S.field}>
                  <label style={S.label}>
                    {isPerVehicle ? 'Цена менеджер (за транспорт) ฿' : 'Цена менеджер (за группу) ฿'}
                  </label>
                  <input type="number" min="0" style={{ ...S.inp, ...S.inpGold }} value={form.mgrPrice}
                    onChange={e => upd('mgrPrice', parseInt(e.target.value) || 0)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Нетто ฿</label>
                  <input type="number" min="0" style={S.inp} value={form.nettoPrice}
                    onChange={e => upd('nettoPrice', parseInt(e.target.value) || 0)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Макс. пассажиров</label>
                  <input type="number" min="0" style={S.inp} value={form.maxPax}
                    onChange={e => upd('maxPax', parseInt(e.target.value) || 0)} />
                </div>
                {isPerVehicle && (
                  <div style={S.field}>
                    <label style={S.label}>Тип транспорта</label>
                    <input style={S.inp} value={(form.customFields || []).find(f => f.key === 'vehicle_type')?.value || ''}
                      placeholder="лодка / минивэн / автобус / катамаран..."
                      onChange={e => {
                        const cf = [...(form.customFields || [])]
                        const idx = cf.findIndex(f => f.key === 'vehicle_type')
                        if (idx >= 0) cf[idx] = { ...cf[idx], value: e.target.value }
                        else cf.push({ key: 'vehicle_type', label: 'Тип транспорта', value: e.target.value, fieldType: 'text' })
                        upd('customFields', cf)
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SECTION 3: Параметры ── */}
          <div style={S.section}>
            <div style={S.sectionTitle}>⏱️ Параметры</div>
            <div style={S.grid3}>
              <div style={S.field}>
                <label style={S.label}>Длительность (ч)</label>
                <input type="number" min="1" style={S.inp} value={form.hours}
                  onChange={e => upd('hours', parseInt(e.target.value) || 1)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Доп. час ฿</label>
                <input type="number" min="0" style={S.inp} value={form.extraHour}
                  onChange={e => upd('extraHour', parseInt(e.target.value) || 0)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Порядок сортировки</label>
                <input type="number" style={S.inp} value={form.sortOrder}
                  onChange={e => upd('sortOrder', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* ── SECTION 4: Описание ── */}
          <div style={S.section}>
            <div style={S.sectionTitle}>📝 Описание</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={S.field}>
                <label style={S.label}>Примечание (видно менеджеру)</label>
                <input style={S.inp} value={form.note} placeholder="Доп. информация, особенности..."
                  onChange={e => upd('note', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Детали нетто (расшифровка стоимости)</label>
                <input style={S.inp} value={form.nettoDetail} placeholder="напр. лодка 15000 + гид 2000 = 17000"
                  onChange={e => upd('nettoDetail', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── SECTION 5: Дополнительные поля ── */}
          <div style={S.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--brd)' }}>
              <div style={S.sectionTitle} style={{ margin: 0, borderBottom: 'none', padding: 0, fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ⚙️ Дополнительные поля
              </div>
              <button onClick={addCustomField} style={{
                padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.08)',
                color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                + Добавить поле
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--txl)', marginBottom: '10px' }}>
              Добавьте любые данные: тип судна, включённое оборудование, место встречи, мин. возраст и т.д.
            </div>
            {(form.customFields || []).length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--txl)', fontSize: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--brd)' }}>
                Нет доп. полей — нажмите «+ Добавить поле»
              </div>
            )}
            {(form.customFields || []).map((cf, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto auto',
                gap: '8px', marginBottom: '8px', alignItems: 'center',
                padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                border: '1px solid var(--brd)',
              }}>
                <div style={S.field}>
                  {i === 0 && <label style={S.label}>Тип</label>}
                  <select style={{ ...S.inp, fontSize: '11px' }} value={cf.fieldType || 'text'} onChange={e => updCustomField(i, 'fieldType', e.target.value)}>
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={S.field}>
                  {i === 0 && <label style={S.label}>Ключ (eng)</label>}
                  <input style={{ ...S.inp, fontSize: '11px' }} value={cf.key} placeholder="boat_type"
                    onChange={e => updCustomField(i, 'key', e.target.value)} />
                </div>
                <div style={S.field}>
                  {i === 0 && <label style={S.label}>Название поля</label>}
                  <input style={{ ...S.inp, fontSize: '11px' }} value={cf.label} placeholder="Тип судна"
                    onChange={e => updCustomField(i, 'label', e.target.value)} />
                </div>
                <div style={S.field}>
                  {i === 0 && <label style={S.label}>Значение</label>}
                  {cf.fieldType === 'boolean' ? (
                    <select style={{ ...S.inp, fontSize: '11px' }} value={cf.value} onChange={e => updCustomField(i, 'value', e.target.value)}>
                      <option value="true">Да</option>
                      <option value="false">Нет</option>
                    </select>
                  ) : (
                    <input
                      type={cf.fieldType === 'number' ? 'number' : cf.fieldType === 'date' ? 'date' : 'text'}
                      style={{ ...S.inp, fontSize: '11px' }}
                      value={cf.value}
                      placeholder={cf.fieldType === 'number' ? '0' : 'значение...'}
                      onChange={e => updCustomField(i, 'value', e.target.value)}
                    />
                  )}
                </div>
                <button onClick={() => removeCustomField(i)} style={{
                  padding: '6px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
                  cursor: 'pointer', fontSize: '12px', marginTop: i === 0 ? '16px' : '0',
                }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
