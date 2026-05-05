'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './Portal.module.css';
import {
    todayISO, clipCopy, fmtDate,
    doPrintCustomClient, doPrintCustomOps,
} from '@/lib/utils';
import {
    loadAtoms, saveAtom, deleteAtom,
    saveAtomicTour, loadAtomicTour, loadAtomicTours, deleteAtomicTour,
    loadPartners,
    saveCalculation,
} from '@/lib/db';
import { LinkModal, TextModal } from './Modals';

const FMT = (n) => new Intl.NumberFormat('ru-RU').format(n || 0) + ' ฿';

// Расчёт цены атома с учётом режима (групповой / индивидуальный) и pax
function calcAtomPrice(atom, pax, mode = 'group', divisor = 1) {
    const totalPax = (pax.adults || 0) + (pax.children || 0);
    const u = atom.pricing_unit || 'per_pax';
    let sell = 0, net = 0, mgr = 0;

    if (u === 'per_pax') {
        sell = (atom.sell || 0) * totalPax;
        net  = (atom.net  || 0) * totalPax;
        mgr  = (atom.mgr  || atom.sell || 0) * totalPax;
    } else if (u === 'per_vehicle') {
        // Если делимый и групповой режим — цена остаётся фикс. (за машину) — но реально клиент платит «за машину»,
        // А показ для клиента в group-режиме обычно «N ÷ pax» — считаем фикс цена за единицу.
        sell = (atom.sell || 0);
        net  = (atom.net  || 0);
        mgr  = (atom.mgr  || atom.sell || 0);
        // В группе с делителем — делим на divisor (если задан)
        if (atom.divisible && mode === 'group' && divisor > 1) {
            sell = Math.round(sell / divisor) * totalPax;
            net  = Math.round(net  / divisor) * totalPax;
            mgr  = Math.round(mgr  / divisor) * totalPax;
        }
    } else {
        // per_group_fixed
        sell = (atom.sell || 0);
        net  = (atom.net  || 0);
        mgr  = (atom.mgr  || atom.sell || 0);
    }
    return { sell, net, mgr, margin: sell - net };
}

const MODE_LABELS = {
    group:      { label: 'Групповой', icon: '👥', tip: 'Цена за машину/лодку делится по pax (per_vehicle с divisible)' },
    individual: { label: 'Индивидуальный', icon: '👤', tip: 'Цена за машину/лодку идёт фикс. на всю группу' },
};

export default function AtomicTourPage({ role, toast: externalToast, user, brandSettings, onPage }) {
    const isAdmin = role === 'booking';
    const showToast = externalToast || ((msg) => alert(msg));

    const [atoms, setAtoms] = useState([]);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterGroup, setFilterGroup] = useState('all');
    const [searchQ, setSearchQ] = useState('');

    // Выбранные атомы (id → { qty, override })
    const [selected, setSelected] = useState({});
    const [pax, setPax] = useState({ adults: 2, children: 0, infants: 0 });
    const [mode, setMode] = useState('group');
    const [client, setClient] = useState({ name: '', date: todayISO(), phone: '', note: '' });
    const [tourName, setTourName] = useState('');
    const [groupSize, setGroupSize] = useState(11); // делитель для divisible-атомов в режиме group

    const [tourId, setTourId] = useState(null);
    const [savingFlag, setSavingFlag] = useState(false);
    const [modal, setModal] = useState(null);
    const [shareUrl, setShareUrl] = useState('');

    // Admin: панель редактирования атомов
    const [showAdmin, setShowAdmin] = useState(false);
    const [editAtom, setEditAtom] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const [as, ps] = await Promise.all([loadAtoms(), loadPartners()]);
            if (!cancelled) {
                setAtoms(as || []);
                setPartners(ps || []);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const partnerById = useMemo(() => {
        const m = new Map();
        for (const p of partners) m.set(p.id, p);
        return m;
    }, [partners]);

    const groups = useMemo(() => {
        const set = new Set();
        for (const a of atoms) set.add(a.group || 'Прочее');
        return Array.from(set);
    }, [atoms]);

    const filteredAtoms = useMemo(() => {
        const q = (searchQ || '').toLowerCase().trim();
        return atoms.filter(a => {
            if (filterGroup !== 'all' && a.group !== filterGroup) return false;
            if (q && !(a.name || '').toLowerCase().includes(q)) return false;
            return true;
        });
    }, [atoms, filterGroup, searchQ]);

    const groupedAtoms = useMemo(() => {
        const g = {};
        for (const a of filteredAtoms) {
            const k = a.group || 'Прочее';
            if (!g[k]) g[k] = [];
            g[k].push(a);
        }
        return g;
    }, [filteredAtoms]);

    // Итог
    const total = useMemo(() => {
        let sell = 0, net = 0, mgr = 0;
        for (const id of Object.keys(selected)) {
            const atom = atoms.find(a => a.id === id);
            if (!atom) continue;
            const sel = selected[id];
            const r = calcAtomPrice(atom, pax, mode, groupSize);
            // Для штучных (per_group_fixed) множим на qty
            const q = atom.pricing_unit === 'per_group_fixed' ? (sel.qty || 1) : 1;
            sell += r.sell * q;
            net  += r.net  * q;
            mgr  += r.mgr  * q;
        }
        return { sell, net, mgr, margin: sell - net };
    }, [selected, atoms, pax, mode, groupSize]);

    const toggleAtom = (atom) => {
        setSelected(prev => {
            const next = { ...prev };
            if (next[atom.id]) delete next[atom.id];
            else next[atom.id] = { qty: 1, override: null };
            return next;
        });
    };

    const setAtomQty = (id, q) => {
        setSelected(prev => ({
            ...prev,
            [id]: { ...(prev[id] || { qty: 1 }), qty: Math.max(1, Number(q) || 1) },
        }));
    };

    const setAtomOverride = (id, val) => {
        setSelected(prev => {
            const next = { ...prev };
            const cur = next[id] || { qty: 1 };
            if (val === '' || val == null) {
                delete cur.override;
            } else {
                cur.override = { sell_total: Number(val) || 0 };
            }
            next[id] = cur;
            return next;
        });
    };

    const clearSelection = () => {
        if (Object.keys(selected).length === 0) return;
        if (!confirm('Сбросить выбор?')) return;
        setSelected({});
    };

    // Build payload для сохранения и PDF
    const buildPayload = (forOps = false) => {
        const parts = Object.keys(selected).map(id => {
            const atom = atoms.find(a => a.id === id);
            if (!atom) return null;
            const sel = selected[id];
            const r = calcAtomPrice(atom, pax, mode, groupSize);
            const q = atom.pricing_unit === 'per_group_fixed' ? (sel.qty || 1) : 1;
            const sellTotal = sel.override?.sell_total != null ? Number(sel.override.sell_total) : r.sell * q;
            const netTotal  = r.net * q;
            return {
                global_id: 'atom:' + atom.id,
                source: 'atoms',
                source_id: atom.id,
                name: atom.name,
                icon: atom.icon || '🧩',
                category: atom.group || atom.category,
                pricing_model: atom.pricing_unit,
                qty: { ...pax },
                sell_base: r.sell, net_base: r.net,
                calculated: { sell: sellTotal, net: netTotal, margin: sellTotal - netTotal },
                override: sel.override || null,
                meta: { atom_qty: q, divisible: atom.divisible, mode },
            };
        }).filter(Boolean);

        return {
            ...client,
            pax: `${pax.adults} взр.${pax.children ? ' + ' + pax.children + ' дет.' : ''}${pax.infants ? ' + ' + pax.infants + ' млд.' : ''}`,
            tourName: tourName || 'Атомарный тур',
            parts,
            total: total.sell,
            totalNet: total.net,
            gen: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }),
            _savedAt: new Date().toISOString(),
            _brand: brandSettings || null,
            _kind: 'atomic',
            printTitle: forOps ? 'Атомарный тур (опс)' : 'Индивидуальная программа',
            items: parts.map(p => ({ icon: p.icon, name: p.name, meta: '' })),
        };
    };

    const handlePrintClient = () => {
        if (Object.keys(selected).length === 0) { showToast('Выбери хотя бы один атом', 'err'); return; }
        doPrintCustomClient(buildPayload(false));
    };
    const handlePrintOps = () => {
        if (!isAdmin) { showToast('PDF опс только для booking', 'err'); return; }
        if (Object.keys(selected).length === 0) { showToast('Выбери хотя бы один атом', 'err'); return; }
        doPrintCustomOps(buildPayload(true));
    };

    const handleSaveDraft = async () => {
        if (Object.keys(selected).length === 0) { showToast('Выбери хотя бы один атом', 'err'); return; }
        setSavingFlag(true);
        try {
            const id = await saveAtomicTour({
                id: tourId, client_name: client.name || tourName || '', status: 'draft',
                pax, mode,
                selected: Object.keys(selected).map(id => ({ atom_id: id, ...selected[id] })),
                total_sell: total.sell, total_net: total.net, total_margin: total.margin,
                notes: client.note || '',
                metadata: { tourName, group_size: groupSize, phone: client.phone, date: client.date },
            });
            if (id) { setTourId(id); showToast('Сохранено', 'ok'); }
            else showToast('Ошибка', 'err');
        } finally { setSavingFlag(false); }
    };

    const handleLink = async () => {
        if (Object.keys(selected).length === 0) { showToast('Выбери хотя бы один атом', 'err'); return; }
        const d = buildPayload(false);
        let url;
        if (user) {
            const calcId = await saveCalculation(user.id, d.name || '', d.date || null, d);
            if (calcId) url = `${location.origin}${location.pathname}?tour=${calcId}`;
        }
        if (!url) url = `${location.origin}${location.pathname}?tour=${btoa(encodeURIComponent(JSON.stringify(d)))}`;
        await handleSaveDraft();
        setShareUrl(url);
        setModal('link');
        clipCopy(url).then(() => showToast('Ссылка скопирована!', 'ok'));
        if (brandSettings?.tg_chat_id) {
            const msg = `🧬 <b>Новый атомарный тур</b>\n👤 ${d.name || 'Клиент'}\n📋 ${Object.keys(selected).length} атомов\n👥 ${d.pax}\n💰 ${(d.total || 0).toLocaleString('ru-RU')} ฿\n🔗 <a href="${url}">Открыть</a>`;
            fetch('/api/notify-telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, chatId: brandSettings.tg_chat_id }) }).catch(() => {});
        }
    };

    // ─── ADMIN: правка атомов ─────────────────────────────
    const openEditAtom = (a) => setEditAtom({ ...a });
    const openCreateAtom = () => setEditAtom({
        id: '', name: '', icon: '🧩', category: 'extra', group: 'Прочее',
        net: 0, sell: 0, mgr: 0, pricing_unit: 'per_pax', divisible: false, active: true, sort_order: 999, notes: '',
    });
    const saveEditAtom = async () => {
        if (!editAtom.name) { showToast('Укажи название', 'err'); return; }
        const id = await saveAtom(editAtom);
        if (id) {
            const fresh = await loadAtoms();
            setAtoms(fresh);
            setEditAtom(null);
            showToast('Сохранён', 'ok');
        } else showToast('Ошибка', 'err');
    };
    const removeAtom = async (id) => {
        if (!confirm('Удалить атом?')) return;
        const ok = await deleteAtom(id);
        if (ok) { setAtoms(atoms.filter(a => a.id !== id)); showToast('Удалён', 'ok'); }
    };

    return (
        <div className={styles.theme} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 360px', gap: '12px', padding: '16px', alignItems: 'flex-start' }}>

                {/* COLUMN 1 — фильтры/список атомов */}
                <aside style={{
                    background: 'var(--card-solid)', border: '1px solid var(--brd)',
                    borderRadius: '14px', padding: '14px',
                    maxHeight: 'calc(100vh - 32px)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', position: 'sticky', top: '16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '18px' }}>🧬</span>
                        <b style={{ color: 'var(--txt)', fontSize: '14px' }}>Атомы ({filteredAtoms.length})</b>
                        {isAdmin && (
                            <button onClick={() => setShowAdmin(s => !s)} title="Админка атомов" style={{
                                marginLeft: 'auto', background: 'transparent', border: '1px solid var(--brd2)',
                                color: 'var(--txm)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer',
                            }}>{showAdmin ? '✕ Закрыть' : '⚙️'}</button>
                        )}
                    </div>

                    <input type="text" className={styles.searchInput}
                        placeholder="Поиск атома..." value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                        style={{ marginBottom: '8px' }} />

                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <button onClick={() => setFilterGroup('all')} style={chipStyle(filterGroup === 'all')}>🌐 Все</button>
                        {groups.map(g => (
                            <button key={g} onClick={() => setFilterGroup(g)} style={chipStyle(filterGroup === g)}>
                                {g}
                            </button>
                        ))}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                        {loading ? (
                            <div style={{ color: 'var(--txl)', textAlign: 'center', padding: '24px', fontSize: '12px' }}>Загрузка…</div>
                        ) : filteredAtoms.length === 0 ? (
                            <div style={{ color: 'var(--txl)', textAlign: 'center', padding: '24px', fontSize: '12px' }}>Не найдено</div>
                        ) : (
                            Object.keys(groupedAtoms).map(g => (
                                <div key={g} style={{ marginBottom: '12px' }}>
                                    <div style={{
                                        fontSize: '10px', fontWeight: 800, color: 'var(--primary)',
                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                        margin: '6px 4px',
                                    }}>
                                        {g} · {groupedAtoms[g].length}
                                    </div>
                                    {groupedAtoms[g].map(a => {
                                        const isSel = !!selected[a.id];
                                        const partner = a.partner_id ? partnerById.get(a.partner_id) : null;
                                        return (
                                            <div key={a.id} style={{
                                                background: isSel ? 'rgba(245,158,11,0.12)' : 'var(--bg2)',
                                                border: `1px solid ${isSel ? '#f59e0b' : 'var(--brd2)'}`,
                                                borderRadius: '8px', padding: '8px 10px', marginBottom: '4px',
                                                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                            }} onClick={() => toggleAtom(a)}>
                                                <input type="checkbox" checked={isSel} readOnly style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }} />
                                                <span style={{ fontSize: '15px' }}>{a.icon || '•'}</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt)' }}>{a.name}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--txl)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        <span>{a.sell ? FMT(a.sell) : 'входит'} · {a.pricing_unit === 'per_pax' ? 'на чел' : a.pricing_unit === 'per_vehicle' ? 'за маш' : 'фикс'}</span>
                                                        {isAdmin && partner && (
                                                            <span style={{
                                                                background: `${partner.color}22`, color: partner.color,
                                                                padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700,
                                                            }}>
                                                                {partner.icon} {partner.short_name || partner.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {isAdmin && showAdmin && (
                                                    <button onClick={e => { e.stopPropagation(); openEditAtom(a); }} title="Редактировать" style={{ background: 'transparent', border: 'none', color: 'var(--txm)', cursor: 'pointer', fontSize: '11px' }}>✎</button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>

                    {isAdmin && showAdmin && (
                        <button onClick={openCreateAtom} style={{
                            marginTop: '8px', padding: '8px 12px', borderRadius: '8px',
                            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                            color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '12px',
                        }}>+ Добавить атом</button>
                    )}
                </aside>

                {/* COLUMN 2 — параметры и выбранные */}
                <main>
                    <div className={styles.card} style={{ marginBottom: '12px' }}>
                        <div className={styles.cardTitle}><span>🧬</span> Атомарный конструктор</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                            <div className={styles.fg}>
                                <label>Название тура</label>
                                <input type="text" value={tourName} onChange={e => setTourName(e.target.value)} placeholder="Например, «Тур Ивановых»" />
                            </div>
                            <div className={styles.fg}>
                                <label>Имя клиента</label>
                                <input type="text" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} placeholder="Иван" />
                            </div>
                            <div className={styles.fg}>
                                <label>Дата</label>
                                <input type="date" value={client.date} onChange={e => setClient({ ...client, date: e.target.value })} />
                            </div>
                            <div className={styles.fg}>
                                <label>Телефон</label>
                                <input type="text" value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} placeholder="+66..." />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                            <div className={styles.fg}>
                                <label>Взрослые</label>
                                <input type="number" value={pax.adults} min="0" onChange={e => setPax({ ...pax, adults: Number(e.target.value) || 0 })} />
                            </div>
                            <div className={styles.fg}>
                                <label>Дети 4-11</label>
                                <input type="number" value={pax.children} min="0" onChange={e => setPax({ ...pax, children: Number(e.target.value) || 0 })} />
                            </div>
                            <div className={styles.fg}>
                                <label>Младенцы 0-3</label>
                                <input type="number" value={pax.infants} min="0" onChange={e => setPax({ ...pax, infants: Number(e.target.value) || 0 })} />
                            </div>
                        </div>

                        {/* Режим */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--txl)', fontWeight: 700, textTransform: 'uppercase' }}>Режим:</span>
                            {Object.entries(MODE_LABELS).map(([k, m]) => (
                                <button key={k} onClick={() => setMode(k)} title={m.tip} style={{
                                    padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                    border: `1px solid ${mode === k ? '#f59e0b' : 'var(--brd2)'}`,
                                    background: mode === k ? 'rgba(245,158,11,0.18)' : 'transparent',
                                    color: mode === k ? '#f59e0b' : 'var(--txm)',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}>
                                    {m.icon} {m.label}
                                </button>
                            ))}
                            {mode === 'group' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--txl)' }}>Размер группы (для делителя):</span>
                                    <input type="number" min="1" value={groupSize} onChange={e => setGroupSize(Math.max(1, Number(e.target.value) || 1))} style={{ width: '60px', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--brd2)', background: 'var(--bg3)', color: 'var(--txt)', fontSize: '12px', textAlign: 'center' }} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Список выбранных атомов */}
                    <div className={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div className={styles.cardTitle} style={{ marginBottom: 0 }}><span>📋</span> Выбрано ({Object.keys(selected).length})</div>
                            {Object.keys(selected).length > 0 && (
                                <button onClick={clearSelection} style={{ background: 'transparent', border: '1px solid var(--brd2)', color: 'var(--txl)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>🗑 Сбросить</button>
                            )}
                        </div>

                        {Object.keys(selected).length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--txl)', border: '2px dashed var(--brd2)', borderRadius: '10px', fontSize: '13px' }}>
                                Кликни на атомы в каталоге слева — отметятся галочкой и появятся здесь с расчётом.
                            </div>
                        ) : (
                            Object.keys(selected).map(id => {
                                const atom = atoms.find(a => a.id === id);
                                if (!atom) return null;
                                const sel = selected[id];
                                const r = calcAtomPrice(atom, pax, mode, groupSize);
                                const q = atom.pricing_unit === 'per_group_fixed' ? (sel.qty || 1) : 1;
                                const ovr = sel.override?.sell_total != null;
                                const dispSell = ovr ? Number(sel.override.sell_total) : r.sell * q;
                                const dispNet  = r.net * q;
                                const dispMargin = dispSell - dispNet;
                                return (
                                    <div key={id} style={{
                                        background: 'var(--bg2)', border: `1px solid ${ovr ? '#f59e0b' : 'var(--brd2)'}`,
                                        borderRadius: '10px', padding: '10px', marginBottom: '6px',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                    }}>
                                        <span style={{ fontSize: '18px' }}>{atom.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt)' }}>{atom.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--txl)' }}>
                                                {atom.group} · {atom.pricing_unit === 'per_pax' ? `${FMT(atom.sell)} /чел × ${(pax.adults || 0) + (pax.children || 0)}` :
                                                  atom.pricing_unit === 'per_vehicle' ? `${FMT(atom.sell)} за единицу${atom.divisible && mode === 'group' ? ` ÷ ${groupSize}` : ''}` :
                                                  `${FMT(atom.sell)} фикс`}
                                            </div>
                                        </div>
                                        {atom.pricing_unit === 'per_group_fixed' && (
                                            <input type="number" min="1" value={sel.qty || 1} onChange={e => setAtomQty(id, e.target.value)} title="Кол-во" style={{ width: '50px', padding: '4px', borderRadius: '6px', border: '1px solid var(--brd2)', background: 'var(--bg3)', color: 'var(--txt)', textAlign: 'center', fontSize: '12px' }} />
                                        )}
                                        <input type="number" placeholder={String(r.sell * q)} value={sel.override?.sell_total ?? ''} onChange={e => setAtomOverride(id, e.target.value)} title="Своя цена" style={{ width: '90px', padding: '4px', borderRadius: '6px', border: '1px solid var(--brd2)', background: 'var(--bg3)', color: ovr ? '#f59e0b' : 'var(--txm)', textAlign: 'right', fontSize: '12px' }} />
                                        <div style={{ textAlign: 'right', minWidth: '90px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>{FMT(dispSell)}</div>
                                            {isAdmin && (
                                                <div style={{ fontSize: '9px', color: 'var(--txl)' }}>+{FMT(dispMargin)}</div>
                                            )}
                                        </div>
                                        <button onClick={() => toggleAtom(atom)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>

                {/* COLUMN 3 — итог */}
                <aside style={{ position: 'sticky', top: '16px' }}>
                    <div className={styles.resBox}>
                        <div className={styles.resHeader}><span>🧾 Итог</span></div>

                        {isAdmin ? (
                            <>
                                <div className={styles.rr}>
                                    <div><div className={styles.rrName}>Себестоимость</div><div className={styles.rrMeta}>Σ нетто всех атомов</div></div>
                                    <div className={styles.rrVal}>{FMT(total.net)}</div>
                                </div>
                                <div className={styles.rr} style={{ color: 'var(--ok)', fontWeight: 800 }}>
                                    <div>Маржа</div>
                                    <div className={styles.rrVal}>+{FMT(total.margin)}</div>
                                </div>
                            </>
                        ) : (
                            <div className={styles.rr}>
                                <div><div className={styles.rrName}>Атомов</div><div className={styles.rrMeta}>{Object.keys(selected).length} выбр.</div></div>
                                <div className={styles.rrVal}>{FMT(total.sell)}</div>
                            </div>
                        )}

                        <div className={`${styles.rr} ${styles.rrTot}`}>
                            <div>К ОПЛАТЕ:</div>
                            <div>{FMT(total.sell)}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                            <button className={styles.btn} style={{ background: 'var(--brd2)', color: 'var(--txt)', borderColor: 'var(--brd2)' }} onClick={handlePrintClient}>🖨 PDF клиенту</button>
                            {isAdmin && (
                                <button className={styles.btn} style={{ background: '#7f1d1d', color: '#fee2e2', borderColor: '#ef4444' }} onClick={handlePrintOps}>🔒 PDF опс</button>
                            )}
                            <button className={`${styles.btn} ${styles.btnOk}`} onClick={handleLink}>🔗 Создать ссылку</button>
                            <button className={styles.btn} style={{ background: 'transparent', color: 'var(--txm)', borderColor: 'var(--brd2)' }} onClick={handleSaveDraft} disabled={savingFlag}>
                                {savingFlag ? '⏳' : (tourId ? '💾 Обновить' : '💾 Сохранить')}
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {modal === 'link' && shareUrl && (
                <LinkModal url={shareUrl} onClose={() => setModal(null)} onToast={showToast} />
            )}

            {/* Edit atom modal */}
            {editAtom && (
                <ModalShell title={editAtom.id ? 'Редактирование атома' : 'Новый атом'}
                    onClose={() => setEditAtom(null)} onSave={saveEditAtom}
                    onDelete={editAtom.id ? () => { removeAtom(editAtom.id); setEditAtom(null); } : null}>
                    <Row label="Иконка"><input value={editAtom.icon} onChange={e => setEditAtom({ ...editAtom, icon: e.target.value })} style={mInput} /></Row>
                    <Row label="Название"><input value={editAtom.name} onChange={e => setEditAtom({ ...editAtom, name: e.target.value })} style={mInput} /></Row>
                    <Row label="Группа"><input value={editAtom.group} onChange={e => setEditAtom({ ...editAtom, group: e.target.value })} style={mInput} /></Row>
                    <Row label="Категория">
                        <select value={editAtom.category} onChange={e => setEditAtom({ ...editAtom, category: e.target.value })} style={mInput}>
                            <option value="transport">transport</option>
                            <option value="guide">guide</option>
                            <option value="meal">meal</option>
                            <option value="location">location</option>
                            <option value="activity">activity</option>
                            <option value="stay">stay</option>
                            <option value="shopping">shopping</option>
                            <option value="evening">evening</option>
                            <option value="extra">extra</option>
                        </select>
                    </Row>
                    <Row label="Тип цены">
                        <select value={editAtom.pricing_unit} onChange={e => setEditAtom({ ...editAtom, pricing_unit: e.target.value })} style={mInput}>
                            <option value="per_pax">за человека</option>
                            <option value="per_vehicle">за машину/лодку</option>
                            <option value="per_group_fixed">фикс. за группу</option>
                        </select>
                    </Row>
                    <Row label="Делимый (для группы)">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--txt)' }}>
                            <input type="checkbox" checked={!!editAtom.divisible} onChange={e => setEditAtom({ ...editAtom, divisible: e.target.checked })} />
                            <span style={{ fontSize: '12px' }}>В групповом режиме делится по pax</span>
                        </label>
                    </Row>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <Row label="Нетто"><input type="number" value={editAtom.net} onChange={e => setEditAtom({ ...editAtom, net: Number(e.target.value) || 0 })} style={mInput} /></Row>
                        <Row label="Менедж"><input type="number" value={editAtom.mgr} onChange={e => setEditAtom({ ...editAtom, mgr: Number(e.target.value) || 0 })} style={mInput} /></Row>
                        <Row label="Продажа"><input type="number" value={editAtom.sell} onChange={e => setEditAtom({ ...editAtom, sell: Number(e.target.value) || 0 })} style={mInput} /></Row>
                    </div>
                    <Row label="Длительность (часов)"><input type="number" value={editAtom.duration_hours || ''} onChange={e => setEditAtom({ ...editAtom, duration_hours: e.target.value ? Number(e.target.value) : null })} style={mInput} /></Row>
                    <Row label="Поставщик / Партнёр">
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <select value={editAtom.partner_id || ''} onChange={e => setEditAtom({ ...editAtom, partner_id: e.target.value || null })} style={mInput}>
                                <option value="">— не выбран —</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                                ))}
                            </select>
                            {onPage && (
                                <button onClick={() => onPage('partners')} title="Открыть раздел партнёров" style={{
                                    padding: '7px 10px', borderRadius: '8px', background: 'var(--brd2)',
                                    border: '1px solid var(--brd2)', color: 'var(--txm)', cursor: 'pointer', fontSize: '12px',
                                }}>👥 Партнёры</button>
                            )}
                        </div>
                    </Row>
                    <Row label="Заметка"><input value={editAtom.notes || ''} onChange={e => setEditAtom({ ...editAtom, notes: e.target.value })} style={mInput} /></Row>
                </ModalShell>
            )}
        </div>
    );
}

function chipStyle(active) {
    return {
        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
        border: `1px solid ${active ? '#f59e0b' : 'var(--brd2)'}`,
        background: active ? 'rgba(245,158,11,0.18)' : 'transparent',
        color: active ? '#f59e0b' : 'var(--txm)',
        cursor: 'pointer', fontFamily: 'inherit',
    };
}

const mInput = {
    width: '100%', padding: '7px 10px', fontSize: '13px',
    background: 'var(--bg3)', border: '1px solid var(--brd2)',
    borderRadius: '8px', color: 'var(--txt)', fontFamily: 'inherit',
};

function Row({ label, children }) {
    return (
        <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</label>
            {children}
        </div>
    );
}

function ModalShell({ title, children, onClose, onSave, onDelete }) {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card-solid, #1a1a1a)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', color: 'var(--txt)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--brd2)' }}>
                    <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '16px', fontWeight: 800 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--txl)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                </div>
                <div>{children}</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--brd2)' }}>
                    {onDelete ? <button onClick={onDelete} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', fontWeight: 700, cursor: 'pointer' }}>🗑 Удалить</button> : <span />}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', color: 'var(--txm)', border: '1px solid var(--brd2)', fontWeight: 600, cursor: 'pointer' }}>Отмена</button>
                        <button onClick={onSave} style={{ padding: '8px 14px', borderRadius: '8px', background: '#f59e0b', color: '#000', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Сохранить</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
