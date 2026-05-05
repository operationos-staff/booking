'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './Portal.module.css';
import {
    todayISO, clipCopy, fmtDate, fmt,
    calcCustomPart,
    doPrintVacationClient, doPrintVacationOps,
} from '@/lib/utils';
import {
    getCatalogItems,
    saveVacationPlan, loadVacationPlan, loadVacationPlans, deleteVacationPlan,
    saveCalculation,
} from '@/lib/db';
import { LinkModal, TextModal } from './Modals';

const FMT = (n) => new Intl.NumberFormat('ru-RU').format(n || 0) + ' ฿';
const UID = () => Math.random().toString(36).substr(2, 9);

const SOURCE_META = {
    packages:   { label: 'Групповые',     icon: '🚐', color: '#60a5fa' },
    options:    { label: 'Опции',         icon: '📍', color: '#a3a3a3' },
    charter:    { label: 'Морские',       icon: '🚤', color: '#8b5cf6' },
    land:       { label: 'Сухопутные',    icon: '🏔️', color: '#a78bfa' },
    sights:     { label: 'Обзорные',      icon: '🏛️', color: '#f59e0b' },
    individual: { label: 'Индивидуальные',icon: '👤', color: '#fb923c' },
    avia:       { label: 'Авиа ЮВА',      icon: '✈️', color: '#22d3ee' },
    fishing:    { label: 'Рыбалка',       icon: '🎣', color: '#0ea5e9' },
};

function isoBetween(from, to) {
    if (!from || !to) return [];
    const out = [];
    const a = new Date(from + 'T00:00:00');
    const b = new Date(to + 'T00:00:00');
    if (b < a) return [];
    let d = new Date(a);
    let safety = 0;
    while (d <= b && safety++ < 365) {
        out.push(d.toISOString().split('T')[0]);
        d = new Date(d.getTime() + 86400000);
    }
    return out;
}

const DAY_TYPES = {
    arrival:   { icon: '✈️', label: 'Прилёт',   color: '#22d3ee', defaultTitle: 'Прилёт',   defaultNotes: 'Встреча в аэропорту, трансфер в отель, заселение, отдых.' },
    active:    { icon: '🎯', label: 'Активный', color: '#f59e0b', defaultTitle: 'Активный день', defaultNotes: '' },
    rest:      { icon: '🏖',  label: 'Отдых',   color: '#10b981', defaultTitle: 'Свободный день', defaultNotes: 'Отдых на пляже / у бассейна. Рекомендации опциональны.' },
    transfer:  { icon: '🚐', label: 'Переезд', color: '#a78bfa', defaultTitle: 'Переезд',   defaultNotes: 'Трансфер между локациями.' },
    departure: { icon: '👋', label: 'Отъезд',   color: '#fb923c', defaultTitle: 'Отъезд',    defaultNotes: 'Выселение, трансфер в аэропорт, вылет.' },
};

function makeEmptyDay(date, dayNumber, type = 'active') {
    const meta = DAY_TYPES[type] || DAY_TYPES.active;
    return {
        date,
        title: `День ${dayNumber}. ${meta.defaultTitle}`,
        type,
        parts: [],
        notes: meta.defaultNotes || '',
    };
}

// Шаблон автогенерации: первый = arrival, последний = departure, остальные = active
function autoTypeForIndex(idx, total) {
    if (total <= 1) return 'active';
    if (idx === 0) return 'arrival';
    if (idx === total - 1) return 'departure';
    return 'active';
}

function nDaysWord(n) {
    const m10 = n % 10, m100 = n % 100;
    if (m100 >= 11 && m100 <= 14) return 'дней';
    if (m10 === 1) return 'день';
    if (m10 >= 2 && m10 <= 4) return 'дня';
    return 'дней';
}

export default function VacationPlanPage({ role, toast: externalToast, user, brandSettings, onPage }) {
    const isAdmin = role === 'booking';
    const showToast = externalToast || ((msg) => alert(msg));

    // ─── каталог ──────────────────────────────────────────────
    const [catalog, setCatalog] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [filterSource, setFilterSource] = useState('all');
    const [searchQ, setSearchQ] = useState('');

    // ─── план ─────────────────────────────────────────────────
    const [planId, setPlanId] = useState(null);
    const [client, setClient] = useState({ name: '', phone: '', note: '' });
    const [pax, setPax] = useState({ adults: 2, children: 0, infants: 0 });
    const [dateFrom, setDateFrom] = useState(todayISO());
    const [dateTo, setDateTo] = useState('');
    const [days, setDays] = useState([]);  // [{date,title,parts:[],notes}]
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [savingFlag, setSavingFlag] = useState(false);
    const [modal, setModal] = useState(null);
    const [shareUrl, setShareUrl] = useState('');

    // ─── список черновиков ────────────────────────────────────
    const [drafts, setDrafts] = useState([]);
    const [showDrafts, setShowDrafts] = useState(false);

    // загрузка каталога
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setCatalogLoading(true);
            const data = await getCatalogItems();
            if (!cancelled) {
                setCatalog(data || []);
                setCatalogLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // загрузка списка черновиков (когда панель видна)
    useEffect(() => {
        if (!showDrafts) return;
        loadVacationPlans({ limit: 30 }).then(setDrafts);
    }, [showDrafts]);

    const filteredCatalog = useMemo(() => {
        const q = (searchQ || '').toLowerCase().trim();
        return (catalog || []).filter(it => {
            if (filterSource !== 'all' && it.source !== filterSource) return false;
            if (q && !(it.name || '').toLowerCase().includes(q)) return false;
            return true;
        });
    }, [catalog, filterSource, searchQ]);

    const grouped = useMemo(() => {
        const g = {};
        for (const it of filteredCatalog) {
            const s = it.source || 'other';
            if (!g[s]) g[s] = [];
            g[s].push(it);
        }
        return g;
    }, [filteredCatalog]);

    // ─── helpers дней ─────────────────────────────────────────
    const generateDays = () => {
        const isoList = isoBetween(dateFrom, dateTo);
        if (isoList.length === 0) {
            showToast('Укажи корректные даты от-до', 'err'); return;
        }
        const existingByDate = new Map();
        for (const d of days) existingByDate.set(d.date, d);
        const newDays = isoList.map((date, i) =>
            existingByDate.get(date) || makeEmptyDay(date, i + 1, autoTypeForIndex(i, isoList.length))
        );
        setDays(newDays);
        setActiveDayIdx(0);
        showToast(`Создано ${newDays.length} дней`, 'ok');
    };

    // Шаблон на N дней: ставит date_to = date_from + N-1, генерирует с автотипами
    const applyTemplate = (n) => {
        if (!dateFrom) { showToast('Сначала укажи дату прибытия', 'err'); return; }
        if (days.length > 0 && !confirm(`Заменить текущий план шаблоном на ${n} ${nDaysWord(n)}?`)) return;
        const start = new Date(dateFrom + 'T00:00:00');
        const end = new Date(start.getTime() + (n - 1) * 86400000);
        const endIso = end.toISOString().split('T')[0];
        setDateTo(endIso);
        const isoList = [];
        for (let i = 0; i < n; i++) {
            const d = new Date(start.getTime() + i * 86400000);
            isoList.push(d.toISOString().split('T')[0]);
        }
        const newDays = isoList.map((date, i) => makeEmptyDay(date, i + 1, autoTypeForIndex(i, n)));
        // Для туров 5+ дней автоматически отметим один из дней как rest (середина)
        if (n >= 5) {
            const midIdx = Math.floor(n / 2);
            if (newDays[midIdx]?.type === 'active') {
                newDays[midIdx] = { ...newDays[midIdx], type: 'rest', title: `День ${midIdx + 1}. Свободный день`, notes: DAY_TYPES.rest.defaultNotes };
            }
        }
        setDays(newDays);
        setActiveDayIdx(0);
        showToast(`Шаблон на ${n} ${nDaysWord(n)} применён`, 'ok');
    };

    const setDayType = (idx, newType) => {
        setDays(prev => prev.map((d, i) => {
            if (i !== idx) return d;
            const meta = DAY_TYPES[newType] || DAY_TYPES.active;
            // Title обновляем только если он остался дефолтным
            const wasDefault = (d.title || '').match(/^День \d+\.?\s*(.*)?$/);
            const newTitle = wasDefault ? `День ${idx + 1}. ${meta.defaultTitle}` : d.title;
            // Notes обновляем только если они пустые или дефолтные от старого типа
            const oldType = d.type || 'active';
            const oldDefaultNotes = DAY_TYPES[oldType]?.defaultNotes || '';
            const wasDefaultNotes = !d.notes || d.notes === oldDefaultNotes;
            const newNotes = wasDefaultNotes ? meta.defaultNotes : d.notes;
            return { ...d, type: newType, title: newTitle, notes: newNotes };
        }));
    };

    const addDay = () => {
        const last = days[days.length - 1]?.date;
        let next = last;
        if (next) {
            const d = new Date(next + 'T00:00:00');
            d.setDate(d.getDate() + 1);
            next = d.toISOString().split('T')[0];
        } else next = dateFrom || todayISO();
        setDays(prev => [...prev, makeEmptyDay(next, prev.length + 1)]);
        setActiveDayIdx(days.length);
    };

    const removeDay = (idx) => {
        if (!confirm('Удалить этот день?')) return;
        setDays(prev => {
            const next = prev.filter((_, i) => i !== idx);
            return next.map((d, i) => ({ ...d, title: d.title?.startsWith('День ') ? `День ${i + 1}` : d.title }));
        });
        setActiveDayIdx(0);
    };

    const updateDay = (idx, patch) => {
        setDays(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
    };

    const addPartToDay = (dayIdx, item) => {
        const part = {
            uid: UID(),
            global_id: item.global_id,
            source: item.source,
            source_id: item.source_id,
            name: item.name,
            icon: item.icon || SOURCE_META[item.source]?.icon || '📦',
            category: item.category,
            pricing_model: item.pricing_model,
            // Признаки доплаты для группировки в дне
            is_addon: !!item.is_addon,
            parent_source: item.parent_source || null,
            tId: item.tId || null,
            sell_base: item.sell_base, net_base: item.net_base,
            extra_pax_sell: item.extra_pax_sell, extra_pax_net: item.extra_pax_net,
            inclusive_pax: item.inclusive_pax,
            sell_adult: item.sell_adult, sell_child: item.sell_child, sell_infant: item.sell_infant,
            net_adult: item.net_adult, net_child: item.net_child, net_infant: item.net_infant,
            qty: { ...pax },
            override: null,
            meta: item.meta || {},
            snapshotTime: new Date().toISOString(),
        };
        part.calculated = calcCustomPart(part, part.qty);
        setDays(prev => prev.map((d, i) =>
            i === dayIdx ? { ...d, parts: [...(d.parts || []), part] } : d
        ));
    };

    const updatePart = (dayIdx, uid, patch) => {
        setDays(prev => prev.map((d, i) => {
            if (i !== dayIdx) return d;
            return {
                ...d, parts: (d.parts || []).map(p => {
                    if (p.uid !== uid) return p;
                    const np = { ...p, ...patch };
                    np.calculated = calcCustomPart(np, np.qty);
                    return np;
                }),
            };
        }));
    };

    const removePart = (dayIdx, uid) => {
        setDays(prev => prev.map((d, i) =>
            i === dayIdx ? { ...d, parts: (d.parts || []).filter(p => p.uid !== uid) } : d
        ));
    };

    const movePartToDay = (fromDayIdx, uid, toDayIdx) => {
        if (fromDayIdx === toDayIdx) return;
        let movedPart = null;
        setDays(prev => {
            const next = prev.map((d, i) => {
                if (i === fromDayIdx) {
                    const list = (d.parts || []).filter(p => {
                        if (p.uid === uid) { movedPart = p; return false; }
                        return true;
                    });
                    return { ...d, parts: list };
                }
                return d;
            });
            if (movedPart) {
                next[toDayIdx] = { ...next[toDayIdx], parts: [...(next[toDayIdx].parts || []), movedPart] };
            }
            return next;
        });
    };

    // ─── Итоги ────────────────────────────────────────────────
    const dayTotals = useMemo(() => days.map(d => {
        let sell = 0, net = 0;
        for (const p of (d.parts || [])) {
            const c = calcCustomPart(p, p.qty || pax);
            sell += c.sell; net += c.net;
        }
        return { sell, net, margin: sell - net };
    }), [days, pax]);

    const total = useMemo(() => dayTotals.reduce((acc, t) => ({
        sell: acc.sell + t.sell, net: acc.net + t.net, margin: acc.margin + t.margin,
    }), { sell: 0, net: 0, margin: 0 }), [dayTotals]);

    // ─── Drag & Drop (HTML5) ─────────────────────────────────
    const [dragData, setDragData] = useState(null);  // { kind: 'catalog'|'part', payload }
    const [dragOverDayIdx, setDragOverDayIdx] = useState(null);

    const onDragStartCatalog = (it) => (e) => {
        e.dataTransfer.effectAllowed = 'copy';
        try { e.dataTransfer.setData('text/plain', it.global_id); } catch {}
        setDragData({ kind: 'catalog', payload: it });
    };

    const onDragStartPart = (dayIdx, p) => (e) => {
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', p.uid); } catch {}
        setDragData({ kind: 'part', payload: { dayIdx, uid: p.uid } });
    };

    const onDragOverDay = (dayIdx) => (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = dragData?.kind === 'part' ? 'move' : 'copy';
        setDragOverDayIdx(dayIdx);
    };

    const onDropDay = (dayIdx) => (e) => {
        e.preventDefault();
        if (dragData?.kind === 'catalog') {
            addPartToDay(dayIdx, dragData.payload);
        } else if (dragData?.kind === 'part') {
            movePartToDay(dragData.payload.dayIdx, dragData.payload.uid, dayIdx);
        }
        setDragData(null);
        setDragOverDayIdx(null);
    };

    const onDragEnd = () => { setDragData(null); setDragOverDayIdx(null); };

    // ─── Save / Load / Share ─────────────────────────────────
    const buildSnapshot = () => ({
        captured_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 14 * 86400000).toISOString(),
    });

    const handleSaveDraft = async () => {
        if (days.length === 0) { showToast('Добавь хотя бы один день', 'err'); return; }
        setSavingFlag(true);
        try {
            const id = await saveVacationPlan({
                id: planId,
                client_name: client.name || '',
                status: 'draft',
                date_from: dateFrom || null,
                date_to: dateTo || null,
                pax: pax,
                days: days,
                total_sell: total.sell,
                total_net:  total.net,
                total_margin: total.margin,
                pricing_snapshot: buildSnapshot(),
                notes: client.note || '',
                metadata: { phone: client.phone },
            });
            if (id) { setPlanId(id); showToast('План сохранён', 'ok'); }
            else showToast('Не удалось сохранить', 'err');
        } finally { setSavingFlag(false); }
    };

    const buildClientPayload = () => ({
        name: client.name, phone: client.phone, note: client.note,
        pax: `${pax.adults} взр.${pax.children ? ' + ' + pax.children + ' дет.' : ''}${pax.infants ? ' + ' + pax.infants + ' млд.' : ''}`,
        dateFrom, dateTo,
        days: days,
        total: total.sell,
        totalNet: total.net,
        gen: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }),
        _savedAt: new Date().toISOString(),
        _brand: brandSettings || null,
        _kind: 'vacation',
        // Для ClientPage — items (плоский список из всех дней)
        items: days.flatMap(d => (d.parts || []).map(p => ({
            icon: p.icon, name: p.name + (d.date ? ' · ' + fmtDate(d.date) : ''),
            meta: `${p.qty?.adults || 0} взр${p.qty?.children ? ' + ' + p.qty.children + ' дет' : ''}`,
        }))),
        tourName: client.name ? `Программа отдыха · ${client.name}` : 'Программа отдыха',
    });

    const handlePrintClient = () => {
        if (days.length === 0) { showToast('Добавь дни', 'err'); return; }
        doPrintVacationClient(buildClientPayload());
    };

    const handlePrintOps = () => {
        if (!isAdmin) { showToast('PDF опс доступен только booking', 'err'); return; }
        if (days.length === 0) { showToast('Добавь дни', 'err'); return; }
        doPrintVacationOps(buildClientPayload());
    };

    const handlePublish = () => {
        if (days.length === 0) { showToast('Добавь дни', 'err'); return; }
        setModal('text');
    };

    const handleLink = async () => {
        if (days.length === 0) { showToast('Добавь дни', 'err'); return; }
        const d = buildClientPayload();
        let url;
        if (user) {
            const calcId = await saveCalculation(user.id, d.name || '', dateFrom || null, d);
            if (calcId) url = `${location.origin}${location.pathname}?tour=${calcId}`;
        }
        if (!url) url = `${location.origin}${location.pathname}?tour=${btoa(encodeURIComponent(JSON.stringify(d)))}`;
        await handleSaveDraft();
        setShareUrl(url);
        setModal('link');
        clipCopy(url).then(() => showToast('Ссылка скопирована!', 'ok'));

        if (brandSettings?.tg_chat_id) {
            const msg = `📅 <b>Новый план отдыха</b>\n👤 ${d.name || 'Клиент'}\n📆 ${days.length} дн (${fmtDate(dateFrom)} — ${fmtDate(dateTo)})\n👥 ${d.pax}\n💰 ${(d.total || 0).toLocaleString('ru-RU')} ฿\n🔗 <a href="${url}">Открыть план</a>`;
            fetch('/api/notify-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, chatId: brandSettings.tg_chat_id }),
            }).catch(() => {});
        }
    };

    const handleLoadDraft = async (id) => {
        const p = await loadVacationPlan(id);
        if (!p) { showToast('Не удалось загрузить', 'err'); return; }
        setPlanId(p.id);
        setClient({ name: p.client_name || '', phone: p.metadata?.phone || '', note: p.notes || '' });
        setPax(p.pax || { adults: 2, children: 0, infants: 0 });
        setDateFrom(p.date_from || todayISO());
        setDateTo(p.date_to || '');
        setDays(p.days || []);
        setActiveDayIdx(0);
        setShowDrafts(false);
        showToast('План загружен', 'ok');
    };

    const handleDeleteDraft = async (id) => {
        if (!confirm('Удалить этот план?')) return;
        const ok = await deleteVacationPlan(id);
        if (ok) {
            setDrafts(prev => prev.filter(d => d.id !== id));
            if (planId === id) {
                setPlanId(null); setDays([]); setClient({ name: '', phone: '', note: '' });
            }
            showToast('Удалён', 'ok');
        }
    };

    const newPlan = () => {
        if (days.length > 0 && !confirm('Сбросить текущий план?')) return;
        setPlanId(null);
        setClient({ name: '', phone: '', note: '' });
        setPax({ adults: 2, children: 0, infants: 0 });
        setDateFrom(todayISO()); setDateTo('');
        setDays([]); setActiveDayIdx(0);
        setShareUrl('');
    };

    const activeDay = days[activeDayIdx];
    const activeDayTotal = dayTotals[activeDayIdx] || { sell: 0, net: 0, margin: 0 };

    // ─── RENDER ───────────────────────────────────────────────
    return (
        <div className={styles.theme} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }} onDragEnd={onDragEnd}>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 360px', gap: '12px', padding: '16px', alignItems: 'flex-start' }}>

                {/* COLUMN 1 — каталог */}
                <aside style={{
                    background: 'var(--card-solid)', border: '1px solid var(--brd)',
                    borderRadius: '14px', padding: '14px',
                    maxHeight: 'calc(100vh - 32px)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', position: 'sticky', top: '16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '18px' }}>📚</span>
                        <b style={{ color: 'var(--txt)', fontSize: '14px' }}>Каталог ({filteredCatalog.length})</b>
                    </div>

                    <input type="text" className={styles.searchInput}
                        placeholder="Поиск..." value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                        style={{ marginBottom: '8px' }} />

                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <button onClick={() => setFilterSource('all')} style={chipStyle(filterSource === 'all')}>🌐 Все</button>
                        {Object.keys(SOURCE_META).map(k => (
                            <button key={k} onClick={() => setFilterSource(k)} style={chipStyle(filterSource === k, SOURCE_META[k].color)}>
                                {SOURCE_META[k].icon} {SOURCE_META[k].label}
                            </button>
                        ))}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                        {catalogLoading ? (
                            <div style={{ color: 'var(--txl)', textAlign: 'center', padding: '24px', fontSize: '12px' }}>Загрузка…</div>
                        ) : filteredCatalog.length === 0 ? (
                            <div style={{ color: 'var(--txl)', textAlign: 'center', padding: '24px', fontSize: '12px' }}>Ничего не найдено</div>
                        ) : (
                            Object.keys(grouped).map(src => (
                                <div key={src} style={{ marginBottom: '14px' }}>
                                    <div style={{
                                        fontSize: '10px', fontWeight: 800, color: SOURCE_META[src]?.color || 'var(--txl)',
                                        textTransform: 'uppercase', letterSpacing: '0.5px', margin: '6px 4px',
                                    }}>
                                        {SOURCE_META[src]?.icon} {SOURCE_META[src]?.label || src} · {grouped[src].length}
                                    </div>
                                    {grouped[src].map(it => (
                                        <div key={it.global_id}
                                            draggable
                                            onDragStart={onDragStartCatalog(it)}
                                            onClick={() => activeDay && addPartToDay(activeDayIdx, it)}
                                            style={{
                                                background: 'var(--bg2)', border: '1px solid var(--brd2)',
                                                borderRadius: '8px', padding: '8px 10px', marginBottom: '4px',
                                                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'grab',
                                            }}
                                            title="Перетащи в день или кликни — добавит в текущий"
                                        >
                                            <span style={{ fontSize: '16px' }}>{it.icon}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--txl)' }}>
                                                    {it.pricing_model === 'per_pax' && it.sell_adult ? `${FMT(it.sell_adult)} /взр` :
                                                     it.pricing_model === 'base_plus_extra' && it.sell_base ? `от ${FMT(it.sell_base)}` :
                                                     it.sell_base ? `${FMT(it.sell_base)}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* COLUMN 2 — план */}
                <main>
                    {/* Шапка плана */}
                    <div className={styles.card} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div className={styles.cardTitle} style={{ marginBottom: 0 }}>
                                <span>📅</span> План отдыха {planId ? <span style={{ fontSize: '10px', color: 'var(--txl)', fontWeight: 600 }}>· #{planId.slice(0, 6)}</span> : ''}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={newPlan} style={miniBtn}>+ Новый</button>
                                <button onClick={() => setShowDrafts(s => !s)} style={miniBtn}>📂 Мои планы</button>
                            </div>
                        </div>
                        {showDrafts && (
                            <div style={{ background: 'var(--bg3)', border: '1px solid var(--brd2)', borderRadius: '8px', padding: '8px', marginBottom: '12px', maxHeight: '180px', overflowY: 'auto' }}>
                                {drafts.length === 0 ? (
                                    <div style={{ color: 'var(--txl)', fontSize: '12px', padding: '12px', textAlign: 'center' }}>Сохранённых планов пока нет</div>
                                ) : drafts.map(d => (
                                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer' }}>
                                        <div style={{ flex: 1, minWidth: 0 }} onClick={() => handleLoadDraft(d.id)}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--txt)' }}>{d.client_name || '— без имени —'}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--txl)' }}>{d.date_from ? fmtDate(d.date_from) : ''} {d.date_to ? '— ' + fmtDate(d.date_to) : ''} · {FMT(d.total_sell)}</div>
                                        </div>
                                        <button onClick={() => handleDeleteDraft(d.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>🗑</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                            <div className={styles.fg}>
                                <label>Имя клиента</label>
                                <input type="text" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} placeholder="Иван Петров" />
                            </div>
                            <div className={styles.fg}>
                                <label>Телефон</label>
                                <input type="text" value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} placeholder="+66..." />
                            </div>
                            <div className={styles.fg}>
                                <label>Прибытие</label>
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            </div>
                            <div className={styles.fg}>
                                <label>Отъезд</label>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
                            <div className={styles.fg}>
                                <label>Взрослые</label>
                                <input type="number" min="0" value={pax.adults} onChange={e => setPax({ ...pax, adults: Number(e.target.value) || 0 })} />
                            </div>
                            <div className={styles.fg}>
                                <label>Дети 4-11</label>
                                <input type="number" min="0" value={pax.children} onChange={e => setPax({ ...pax, children: Number(e.target.value) || 0 })} />
                            </div>
                            <div className={styles.fg}>
                                <label>Младенцы 0-3</label>
                                <input type="number" min="0" value={pax.infants} onChange={e => setPax({ ...pax, infants: Number(e.target.value) || 0 })} />
                            </div>
                            <button onClick={generateDays} className={`${styles.btn} ${styles.btnAcc}`} style={{ height: '38px' }}>🪄 Сгенерировать дни</button>
                        </div>

                        {/* Шаблоны */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--txl)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>📋 Шаблоны:</span>
                            {[3, 5, 7, 10].map(n => (
                                <button key={n} onClick={() => applyTemplate(n)} style={{
                                    padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                    border: '1px solid var(--brd2)', background: 'var(--bg3)', color: 'var(--txm)',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}>
                                    {n} {nDaysWord(n)}
                                </button>
                            ))}
                            <span style={{ fontSize: '10px', color: 'var(--txl)', marginLeft: '4px' }}>
                                · автоматически расставит Прилёт / Активные / Отъезд
                            </span>
                        </div>
                    </div>

                    {/* Лента дней */}
                    {days.length === 0 ? (
                        <div className={styles.card} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--txl)' }}>
                            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🗓</div>
                            <div style={{ fontWeight: 700, color: 'var(--txt)', fontSize: '14px', marginBottom: '4px' }}>Дней пока нет</div>
                            <div style={{ fontSize: '12px' }}>Укажи даты прибытия и отъезда выше, нажми «Сгенерировать дни» — система создаст карточки на каждый день.</div>
                        </div>
                    ) : (
                        <>
                            {/* Горизонтальная лента */}
                            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px', padding: '4px 0' }}>
                                {days.map((d, idx) => {
                                    const t = dayTotals[idx] || { sell: 0 };
                                    const isActive = idx === activeDayIdx;
                                    const isOver = dragOverDayIdx === idx;
                                    const dt = DAY_TYPES[d.type || 'active'] || DAY_TYPES.active;
                                    return (
                                        <div key={idx}
                                            onClick={() => setActiveDayIdx(idx)}
                                            onDragOver={onDragOverDay(idx)}
                                            onDragLeave={() => setDragOverDayIdx(null)}
                                            onDrop={onDropDay(idx)}
                                            style={{
                                                minWidth: '150px', cursor: 'pointer',
                                                padding: '10px 12px', borderRadius: '10px',
                                                background: isActive ? `${dt.color}33` : (isOver ? 'rgba(16,185,129,0.18)' : `${dt.color}11`),
                                                border: '1.5px solid ' + (isActive ? dt.color : (isOver ? '#10b981' : `${dt.color}55`)),
                                                transition: 'all 0.15s',
                                            }}>
                                            <div style={{ fontSize: '10px', color: dt.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {dt.icon} День {idx + 1} · {dt.label}
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--txt)' }}>{d.date ? fmtDate(d.date).split(' ').slice(0, 2).join(' ') : '—'}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--txl)', marginTop: '4px' }}>
                                                {(d.parts || []).length} активн.
                                            </div>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                                                {FMT(t.sell)}
                                            </div>
                                        </div>
                                    );
                                })}
                                <button onClick={addDay} style={{
                                    minWidth: '60px', padding: '10px',
                                    background: 'transparent', border: '1.5px dashed var(--brd2)',
                                    borderRadius: '10px', cursor: 'pointer',
                                    color: 'var(--txm)', fontSize: '20px',
                                }}>+</button>
                            </div>

                            {/* Активный день */}
                            {activeDay && (
                                <div className={styles.card}
                                    onDragOver={onDragOverDay(activeDayIdx)}
                                    onDragLeave={() => setDragOverDayIdx(null)}
                                    onDrop={onDropDay(activeDayIdx)}
                                    style={{
                                        border: dragOverDayIdx === activeDayIdx ? '2px solid #10b981' : undefined,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                        <input type="text" value={activeDay.title || ''}
                                            onChange={e => updateDay(activeDayIdx, { title: e.target.value })}
                                            placeholder={`День ${activeDayIdx + 1}`}
                                            style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--brd2)', background: 'var(--bg3)', color: 'var(--txt)', fontSize: '14px', fontWeight: 700 }}
                                        />
                                        <input type="date" value={activeDay.date || ''}
                                            onChange={e => updateDay(activeDayIdx, { date: e.target.value })}
                                            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--brd2)', background: 'var(--bg3)', color: 'var(--txt)' }}
                                        />
                                        <button onClick={() => removeDay(activeDayIdx)} style={{ background: 'transparent', border: '1px solid var(--brd2)', color: '#ef4444', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer' }}>🗑</button>
                                    </div>

                                    {/* Тип дня */}
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--txl)', fontWeight: 700, textTransform: 'uppercase', marginRight: '4px' }}>Тип дня:</span>
                                        {Object.entries(DAY_TYPES).map(([key, m]) => {
                                            const isActive = (activeDay.type || 'active') === key;
                                            return (
                                                <button key={key} onClick={() => setDayType(activeDayIdx, key)} style={{
                                                    padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                    border: `1px solid ${isActive ? m.color : 'var(--brd2)'}`,
                                                    background: isActive ? `${m.color}22` : 'transparent',
                                                    color: isActive ? m.color : 'var(--txm)',
                                                    cursor: 'pointer', fontFamily: 'inherit',
                                                }}>
                                                    {m.icon} {m.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {(activeDay.parts || []).length === 0 ? (
                                        <div style={{
                                            padding: '24px', textAlign: 'center',
                                            border: '2px dashed var(--brd2)', borderRadius: '10px',
                                            color: 'var(--txl)', fontSize: '12px',
                                        }}>
                                            Перетащи активность из каталога слева, или кликни по карточке в каталоге — она добавится в этот день.
                                        </div>
                                    ) : (
                                        groupParts(activeDay.parts || []).map((group, gi) => (
                                            <PartGroup key={group.key} group={group} groupIndex={gi}
                                                isAdmin={isAdmin}
                                                onUpdate={(uid, patch) => updatePart(activeDayIdx, uid, patch)}
                                                onRemove={(uid) => removePart(activeDayIdx, uid)}
                                                onDragStartPart={(p) => onDragStartPart(activeDayIdx, p)}
                                            />
                                        ))
                                    )}

                                    <div style={{ marginTop: '12px' }}>
                                        <textarea value={activeDay.notes || ''}
                                            onChange={e => updateDay(activeDayIdx, { notes: e.target.value })}
                                            placeholder="Заметки по дню (например, время выезда из отеля или особые пожелания)"
                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--brd2)', background: 'var(--bg3)', color: 'var(--txt)', minHeight: '50px', fontFamily: 'inherit', fontSize: '12px' }}
                                        />
                                    </div>

                                    <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--bg3)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'var(--txm)' }}>День {activeDayIdx + 1}: {(activeDay.parts || []).length} активн.</span>
                                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                                            {FMT(activeDayTotal.sell)}
                                            {isAdmin && <span style={{ color: 'var(--ok)', fontWeight: 600, marginLeft: '8px' }}>· маржа +{FMT(activeDayTotal.margin)}</span>}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* COLUMN 3 — итог */}
                <aside style={{ position: 'sticky', top: '16px' }}>
                    <div className={styles.resBox}>
                        <div className={styles.resHeader}>
                            <span>🧾 Итог за весь отдых</span>
                        </div>

                        {isAdmin ? (
                            <>
                                <div className={styles.rr}>
                                    <div><div className={styles.rrName}>Всего нетто</div><div className={styles.rrMeta}>Себестоимость</div></div>
                                    <div className={styles.rrVal}>{FMT(total.net)}</div>
                                </div>
                                <div className={styles.rr} style={{ color: 'var(--ok)', fontWeight: 800 }}>
                                    <div>Маржа</div>
                                    <div className={styles.rrVal}>+{FMT(total.margin)}</div>
                                </div>
                            </>
                        ) : (
                            <div className={styles.rr}>
                                <div><div className={styles.rrName}>Дней</div><div className={styles.rrMeta}>{days.length}</div></div>
                                <div className={styles.rrVal}>{FMT(total.sell)}</div>
                            </div>
                        )}

                        <div className={`${styles.rr} ${styles.rrTot}`}>
                            <div>К ОПЛАТЕ:</div>
                            <div>{FMT(total.sell)}</div>
                        </div>

                        {/* Сводка по дням */}
                        <div style={{ marginTop: '20px', background: 'var(--bg3)', padding: '12px', borderRadius: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--txl)', textTransform: 'uppercase', marginBottom: '8px' }}>По дням</div>
                            {days.length === 0 ? (
                                <div style={{ fontSize: '11px', color: 'var(--txl)' }}>—</div>
                            ) : days.map((d, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '4px 0', borderBottom: '1px solid var(--brd2)' }}>
                                    <span style={{ color: 'var(--txt)' }}>День {i + 1} · {(d.parts || []).length} акт.</span>
                                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{FMT(dayTotals[i]?.sell || 0)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Кнопки */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                            <button className={styles.btn} style={{ background: 'var(--brd2)', color: 'var(--txt)', borderColor: 'var(--brd2)' }} onClick={handlePrintClient}>🖨 PDF клиенту (программа)</button>
                            {isAdmin && (
                                <button className={styles.btn} style={{ background: '#7f1d1d', color: '#fee2e2', borderColor: '#ef4444' }} onClick={handlePrintOps}>🔒 PDF оперейшен</button>
                            )}
                            <button className={`${styles.btn} ${styles.btnAcc}`} onClick={handlePublish}>📱 Текст / Мессенджер</button>
                            <button className={`${styles.btn} ${styles.btnOk}`} onClick={handleLink}>🔗 Создать ссылку</button>
                            <button className={styles.btn} style={{ background: 'transparent', color: 'var(--txm)', borderColor: 'var(--brd2)', marginTop: '4px' }} onClick={handleSaveDraft} disabled={savingFlag}>
                                {savingFlag ? '⏳ Сохраняю…' : (planId ? '💾 Обновить план' : '💾 Сохранить план')}
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {modal === 'link' && shareUrl && (
                <LinkModal url={shareUrl} onClose={() => setModal(null)} onToast={showToast} />
            )}
            {modal === 'text' && (
                <TextModal data={buildClientPayload()} onClose={() => setModal(null)} onToast={showToast} />
            )}
        </div>
    );
}

// ─── Часть в дне ────────────────────────────────────────────
function PartRow({ part, dayIdx, isAdmin, onUpdate, onRemove, onDragStart }) {
    const [overrideOpen, setOverrideOpen] = useState(!!part.override);
    const calc = part.calculated || { sell: 0, net: 0, margin: 0 };
    const overridden = !!(part.override?.sell_total || part.override?.sell_total === 0);
    const meta = SOURCE_META[part.source] || {};

    const setQty = (key, val) => {
        const v = Math.max(0, Number(val) || 0);
        onUpdate({ qty: { ...part.qty, [key]: v } });
    };

    const setOverride = (val) => {
        if (val === '' || val == null) onUpdate({ override: null });
        else onUpdate({ override: { ...part.override, sell_total: Number(val) || 0 } });
    };

    return (
        <div draggable onDragStart={onDragStart}
            style={{
                background: 'var(--bg2)', border: `1px solid ${overridden ? '#f59e0b' : 'var(--brd2)'}`,
                borderRadius: '10px', padding: '10px', marginBottom: '8px', cursor: 'grab',
            }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ fontSize: '20px' }}>{part.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--txt)' }}>{part.name}</div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>
                        <span style={{ background: meta.color + '22', color: meta.color, padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {meta.icon} {meta.label}
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '14px' }}>{FMT(calc.sell)}</div>
                    {isAdmin && (
                        <div style={{ fontSize: '10px', color: 'var(--txl)' }}>+{FMT(calc.margin)}</div>
                    )}
                </div>
                <button onClick={onRemove} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }} title="Удалить">✕</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'flex-end' }}>
                <NumIn label="Взр" value={part.qty?.adults || 0} onChange={v => setQty('adults', v)} />
                <NumIn label="Дет" value={part.qty?.children || 0} onChange={v => setQty('children', v)} />
                <NumIn label="Млд" value={part.qty?.infants || 0} onChange={v => setQty('infants', v)} />
                <div style={{ flex: 1 }} />
                <button onClick={() => setOverrideOpen(o => !o)} style={{
                    background: overridden ? '#f59e0b22' : 'transparent',
                    border: `1px solid ${overridden ? '#f59e0b' : 'var(--brd2)'}`,
                    color: overridden ? '#f59e0b' : 'var(--txm)',
                    borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer',
                }}>
                    💰 Своя цена {overridden ? '✓' : ''}
                </button>
            </div>
            {overrideOpen && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px' }}>
                    <input type="number" value={part.override?.sell_total ?? ''} onChange={e => setOverride(e.target.value)} placeholder={`(стандарт: ${calc.sell})`} style={{ width: '100%', padding: '6px 8px', fontSize: '12px', background: 'var(--bg3)', border: '1px solid var(--brd2)', borderRadius: '6px', color: 'var(--txt)' }} />
                </div>
            )}
        </div>
    );
}

function NumIn({ label, value, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label style={{ fontSize: '9px', color: 'var(--txl)' }}>{label}</label>
            <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)} style={{ width: '46px', padding: '4px', borderRadius: '6px', border: '1px solid var(--brd2)', background: 'var(--bg3)', color: 'var(--txt)', textAlign: 'center', fontSize: '12px' }} />
        </div>
    );
}

const miniBtn = {
    padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
    background: 'var(--brd2)', border: '1px solid var(--brd2)', color: 'var(--txm)',
    cursor: 'pointer', fontFamily: 'inherit',
};

function chipStyle(active, color) {
    return {
        padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
        border: `1px solid ${active ? (color || '#f59e0b') : 'var(--brd2)'}`,
        background: active ? `${color || '#f59e0b'}22` : 'transparent',
        color: active ? (color || '#f59e0b') : 'var(--txm)',
        cursor: 'pointer', fontFamily: 'inherit',
    };
}

// ─── Группировка маршрут+опции в дне ─────────────────────────
function groupParts(parts) {
    const groups = [];
    const unattached = { key: 'unattached', route: null, items: [] };
    let current = null;
    for (const p of (parts || [])) {
        const isAddon = !!p.is_addon || p.source === 'options';
        if (!isAddon) {
            current = { key: p.uid, route: p, items: [] };
            groups.push(current);
            continue;
        }
        const r = current?.route;
        const matches = r && p.parent_source && p.parent_source === r.source
            && (p.tId === 'ALL' || String(p.tId) === String(r.source_id));
        if (matches) current.items.push(p);
        else if (r && !p.parent_source && r.source !== 'options') current.items.push(p);
        else unattached.items.push(p);
    }
    if (unattached.items.length > 0) groups.push(unattached);
    return groups;
}

function PartGroup({ group, groupIndex, isAdmin, onUpdate, onRemove, onDragStartPart }) {
    if (group.key === 'unattached') {
        return (
            <div style={{ marginTop: groupIndex > 0 ? '14px' : 0, marginBottom: '8px' }}>
                <div style={{
                    fontSize: '10px', fontWeight: 800, color: 'var(--txl)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    margin: '4px 0 6px 4px',
                }}>
                    📌 Прочее (не привязано к маршруту)
                </div>
                {group.items.map((p) => (
                    <PartRow key={p.uid} part={p}
                        onUpdate={patch => onUpdate(p.uid, patch)}
                        onRemove={() => onRemove(p.uid)}
                        onDragStart={onDragStartPart(p)}
                        isAdmin={isAdmin}
                    />
                ))}
            </div>
        );
    }
    const meta = SOURCE_META[group.route?.source] || {};
    const groupColor = meta.color || '#f59e0b';
    return (
        <div style={{
            marginTop: groupIndex > 0 ? '12px' : 0,
            border: `1px solid ${groupColor}33`,
            borderRadius: '12px',
            background: `${groupColor}05`,
            padding: '6px',
        }}>
            <PartRow part={group.route}
                onUpdate={patch => onUpdate(group.route.uid, patch)}
                onRemove={() => onRemove(group.route.uid)}
                onDragStart={onDragStartPart(group.route)}
                isAdmin={isAdmin}
            />
            {group.items.length > 0 && (
                <div style={{
                    paddingLeft: '20px',
                    borderLeft: `2px solid ${groupColor}`,
                    marginLeft: '14px', marginTop: '4px',
                    position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute', left: '-8px', top: '-6px',
                        fontSize: '10px', color: groupColor, fontWeight: 700,
                        background: 'var(--card-solid)', padding: '0 6px',
                    }}>
                        ↳ Опции к маршруту · {group.items.length}
                    </div>
                    {group.items.map((p) => (
                        <PartRow key={p.uid} part={p}
                            onUpdate={patch => onUpdate(p.uid, patch)}
                            onRemove={() => onRemove(p.uid)}
                            onDragStart={onDragStartPart(p)}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
