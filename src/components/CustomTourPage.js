'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './Portal.module.css';
import {
    todayISO, clipCopy, fmtDate, fmt,
    calcCustomPart, calcCustomTotal,
    doPrintCustomClient, doPrintCustomOps,
} from '@/lib/utils';
import {
    getCatalogItems, saveCustomTour, loadCustomTour,
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

export default function CustomTourPage({ role, toast: externalToast, user, brandSettings, onPage }) {
    const isAdmin = role === 'booking';
    const showToast = externalToast || ((msg) => alert(msg));

    // ─── каталог ──────────────────────────────────────────────
    const [catalog, setCatalog] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [filterSource, setFilterSource] = useState('all');
    const [searchQ, setSearchQ] = useState('');

    // ─── корзина (parts) ──────────────────────────────────────
    const [parts, setParts] = useState([]);
    const [pax, setPax] = useState({ adults: 2, children: 0, infants: 0 });
    const [client, setClient] = useState({ name: '', date: todayISO(), phone: '', note: '' });
    const [tourName, setTourName] = useState('');
    const [tourId, setTourId] = useState(null);
    const [modal, setModal] = useState(null);
    const [shareUrl, setShareUrl] = useState('');
    const [savingFlag, setSavingFlag] = useState(false);

    // ─── загрузка каталога ────────────────────────────────────
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

    const filteredCatalog = useMemo(() => {
        const q = (searchQ || '').toLowerCase().trim();
        return (catalog || []).filter(it => {
            if (filterSource !== 'all' && it.source !== filterSource) return false;
            if (q && !(it.name || '').toLowerCase().includes(q)) return false;
            return true;
        });
    }, [catalog, filterSource, searchQ]);

    // Группировка по source для левой колонки
    const grouped = useMemo(() => {
        const g = {};
        for (const it of filteredCatalog) {
            const s = it.source || 'other';
            if (!g[s]) g[s] = [];
            g[s].push(it);
        }
        return g;
    }, [filteredCatalog]);

    // ─── helpers корзины ──────────────────────────────────────
    function addPartFromCatalog(it) {
        const part = {
            uid: UID(),
            global_id: it.global_id,
            source: it.source,
            source_id: it.source_id,
            name: it.name,
            icon: it.icon || SOURCE_META[it.source]?.icon || '📦',
            category: it.category,
            pricing_model: it.pricing_model,
            // Снэпшот цен
            sell_base: it.sell_base, net_base: it.net_base,
            extra_pax_sell: it.extra_pax_sell, extra_pax_net: it.extra_pax_net,
            inclusive_pax: it.inclusive_pax,
            sell_adult: it.sell_adult, sell_child: it.sell_child, sell_infant: it.sell_infant,
            net_adult: it.net_adult, net_child: it.net_child, net_infant: it.net_infant,
            // Гости персонально для этой части (по умолчанию = общему pax)
            qty: { ...pax },
            override: null,
            meta: it.meta || {},
            snapshotTime: new Date().toISOString(),
        };
        // Пересчитываем
        part.calculated = calcCustomPart(part, part.qty);
        setParts(prev => [...prev, part]);
        showToast(`Добавлено: ${it.name}`, 'ok');
    }

    function updatePart(uid, patch) {
        setParts(prev => prev.map(p => {
            if (p.uid !== uid) return p;
            const np = { ...p, ...patch };
            // Если override не объект — оставим
            if (patch.override !== undefined) np.override = patch.override;
            np.calculated = calcCustomPart(np, np.qty);
            return np;
        }));
    }

    function removePart(uid) {
        setParts(prev => prev.filter(p => p.uid !== uid));
    }

    function clearAll() {
        if (!confirm('Очистить весь собранный тур?')) return;
        setParts([]);
        setTourId(null);
        setTourName('');
        setShareUrl('');
    }

    // ─── итоги ────────────────────────────────────────────────
    const total = useMemo(() => calcCustomTotal(parts, pax), [parts, pax]);

    // ─── client data для PDF/share ────────────────────────────
    const buildData = (forOps = false) => ({
        ...client,
        pax: `${pax.adults} взр.${pax.children ? ' + ' + pax.children + ' дет.' : ''}${pax.infants ? ' + ' + pax.infants + ' млд.' : ''}`,
        tourName: tourName || 'Кастомная программа',
        parts: parts.map(p => ({
            ...p,
            // Для PDF опс нужны source/source_id и override
        })),
        total: total.sell,
        totalNet: total.net,
        gen: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }),
        _savedAt: new Date().toISOString(),
        _brand: brandSettings || null,
        _kind: 'custom',
        printTitle: forOps ? 'Кастомный тур (опс)' : 'Индивидуальная программа',
        // Для ClientPage — items должны быть совместимы
        items: parts.map(p => ({
            icon: p.icon, name: p.name,
            meta: `${p.qty?.adults || 0} взр${p.qty?.children ? ' + ' + p.qty.children + ' дет' : ''}`,
        })),
    });

    const handlePrintClient = () => {
        if (!parts.length) { showToast('Соберите тур из каталога', 'err'); return; }
        doPrintCustomClient(buildData(false));
    };

    const handlePrintOps = () => {
        if (!parts.length) { showToast('Соберите тур из каталога', 'err'); return; }
        if (!isAdmin) { showToast('PDF опс доступен только booking', 'err'); return; }
        doPrintCustomOps(buildData(true));
    };

    const handlePublish = () => {
        if (!parts.length) { showToast('Соберите тур из каталога', 'err'); return; }
        setModal('text');
    };

    const handleSaveDraft = async () => {
        if (!parts.length) { showToast('Соберите тур из каталога', 'err'); return; }
        setSavingFlag(true);
        try {
            const id = await saveCustomTour({
                id: tourId,
                client_name: client.name || tourName || '',
                status: 'draft',
                parts: parts,
                total_sell: total.sell,
                total_net:  total.net,
                total_margin: total.margin,
                pricing_snapshot: {
                    captured_at: new Date().toISOString(),
                    valid_until: new Date(Date.now() + 14 * 86400000).toISOString(),
                },
                notes: client.note || '',
                metadata: {
                    pax, tourName,
                    date: client.date, phone: client.phone,
                },
            });
            if (id) {
                setTourId(id);
                showToast('Черновик сохранён', 'ok');
            } else {
                showToast('Не удалось сохранить', 'err');
            }
        } catch (e) {
            showToast('Ошибка: ' + e.message, 'err');
        } finally {
            setSavingFlag(false);
        }
    };

    const handleLink = async () => {
        if (!parts.length) { showToast('Соберите тур из каталога', 'err'); return; }
        const d = buildData(false);
        let url;
        if (user) {
            const calcId = await saveCalculation(user.id, d.name || '', d.date || null, d);
            if (calcId) url = `${location.origin}${location.pathname}?tour=${calcId}`;
        }
        if (!url) url = `${location.origin}${location.pathname}?tour=${btoa(encodeURIComponent(JSON.stringify(d)))}`;
        // Также сохраним черновик-кастом
        await handleSaveDraft();
        setShareUrl(url);
        setModal('link');
        clipCopy(url).then(() => showToast('Ссылка скопирована!', 'ok'));

        if (brandSettings?.tg_chat_id && d) {
            const msg = `🧩 <b>Новый кастомный тур</b>\n👤 ${d.name || 'Клиент'}\n📋 ${parts.length} позиций\n👥 ${d.pax}\n📅 ${d.date || '—'}\n💰 ${(d.total || 0).toLocaleString('ru-RU')} ฿\n🔗 <a href="${url}">Открыть расчёт</a>`;
            fetch('/api/notify-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, chatId: brandSettings.tg_chat_id }),
            }).catch(() => {});
        }
    };

    // ─── RENDER ───────────────────────────────────────────────
    return (
        <div className={styles.theme} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
            <div className={styles.container} style={{ display: 'grid', gridTemplateColumns: '320px 1fr 360px', gap: '12px', padding: '16px', alignItems: 'flex-start' }}>

                {/* ─── COLUMN 1: КАТАЛОГ ────────────────────── */}
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
                        placeholder="Поиск по названию..." value={searchQ}
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
                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                        margin: '6px 4px',
                                    }}>
                                        {SOURCE_META[src]?.icon} {SOURCE_META[src]?.label || src} · {grouped[src].length}
                                    </div>
                                    {grouped[src].map(it => (
                                        <div key={it.global_id} style={{
                                            background: 'var(--bg2)', border: '1px solid var(--brd2)',
                                            borderRadius: '8px', padding: '8px 10px', marginBottom: '4px',
                                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                        }}
                                            onClick={() => addPartFromCatalog(it)}
                                            title="Добавить в тур"
                                        >
                                            <span style={{ fontSize: '16px' }}>{it.icon}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--txl)' }}>
                                                    {it.pricing_model === 'per_pax' && it.sell_adult ? `${FMT(it.sell_adult)} /взр` : null}
                                                    {it.pricing_model === 'base_plus_extra' && it.sell_base ? `от ${FMT(it.sell_base)}` : null}
                                                    {it.pricing_model === 'per_vehicle' && it.sell_base ? `${FMT(it.sell_base)} (фикс)` : null}
                                                </div>
                                            </div>
                                            <button style={{
                                                background: '#10b981', color: '#fff', border: 'none',
                                                borderRadius: '6px', padding: '4px 8px', fontSize: '12px',
                                                fontWeight: 800, cursor: 'pointer',
                                            }}>+</button>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* ─── COLUMN 2: КОРЗИНА ────────────────────── */}
                <main style={{ minHeight: '60vh' }}>
                    {/* Header корзины */}
                    <div className={styles.card} style={{ marginBottom: '12px' }}>
                        <div className={styles.cardTitle}><span>🧩</span> Конструктор кастомного тура</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                            <div className={styles.fg}>
                                <label>Название тура</label>
                                <input type="text" value={tourName} onChange={e => setTourName(e.target.value)} placeholder="Например, «Большое путешествие Ивановых»" />
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
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
                    </div>

                    {/* Список частей */}
                    <div className={styles.card}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div className={styles.cardTitle} style={{ marginBottom: 0 }}><span>📋</span> Собрано ({parts.length})</div>
                            {parts.length > 0 && (
                                <button onClick={clearAll} style={{ background: 'transparent', border: '1px solid var(--brd2)', color: 'var(--txl)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>🗑 Очистить</button>
                            )}
                        </div>

                        {parts.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '40px 20px', color: 'var(--txl)',
                                border: '2px dashed var(--brd2)', borderRadius: '12px', fontSize: '13px',
                            }}>
                                Кликни на карточки в каталоге слева, чтобы добавить активности в тур
                            </div>
                        ) : (
                            parts.map((p, idx) => (
                                <PartRow key={p.uid} part={p} idx={idx}
                                    onUpdate={patch => updatePart(p.uid, patch)}
                                    onRemove={() => removePart(p.uid)}
                                    isAdmin={isAdmin}
                                />
                            ))
                        )}
                    </div>
                </main>

                {/* ─── COLUMN 3: ИТОГ ────────────────────────── */}
                <aside style={{ position: 'sticky', top: '16px' }}>
                    <div className={styles.resBox}>
                        <div className={styles.resHeader}>
                            <span>🧾 Смета</span>
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
                                <div><div className={styles.rrName}>Позиций</div><div className={styles.rrMeta}>{parts.length} активн.</div></div>
                                <div className={styles.rrVal}>{FMT(total.sell)}</div>
                            </div>
                        )}

                        <div className={`${styles.rr} ${styles.rrTot}`}>
                            <div>К ОПЛАТЕ:</div>
                            <div>{FMT(total.sell)}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                            <button className={`${styles.btn}`} style={{ background: 'var(--brd2)', color: 'var(--txt)', borderColor: 'var(--brd2)' }} onClick={handlePrintClient}>🖨 PDF клиенту</button>
                            {isAdmin && (
                                <button className={`${styles.btn}`} style={{ background: '#7f1d1d', color: '#fee2e2', borderColor: '#ef4444' }} onClick={handlePrintOps}>🔒 PDF оперейшен</button>
                            )}
                            <button className={`${styles.btn} ${styles.btnAcc}`} onClick={handlePublish}>📱 Текст / Мессенджер</button>
                            <button className={`${styles.btn} ${styles.btnOk}`} onClick={handleLink}>🔗 Создать ссылку</button>
                            <button className={`${styles.btn}`} style={{ background: 'transparent', color: 'var(--txm)', borderColor: 'var(--brd2)', marginTop: '4px' }} onClick={handleSaveDraft} disabled={savingFlag}>
                                {savingFlag ? '⏳ Сохраняю…' : (tourId ? '💾 Обновить черновик' : '💾 Сохранить как черновик')}
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {modal === 'link' && shareUrl && (
                <LinkModal url={shareUrl} onClose={() => setModal(null)} onToast={showToast} />
            )}
            {modal === 'text' && (
                <TextModal data={buildData(false)} onClose={() => setModal(null)} onToast={showToast} />
            )}
        </div>
    );
}

// ─── Часть в корзине ───────────────────────────────────────
function PartRow({ part, idx, onUpdate, onRemove, isAdmin }) {
    const [overrideOpen, setOverrideOpen] = useState(!!part.override);
    const calc = part.calculated || { sell: 0, net: 0, margin: 0 };
    const meta = SOURCE_META[part.source] || {};
    const overridden = !!(part.override?.sell_total || part.override?.sell_total === 0);

    const setQty = (key, val) => {
        const v = Math.max(0, Number(val) || 0);
        onUpdate({ qty: { ...part.qty, [key]: v } });
    };

    const setOverride = (val) => {
        if (val === '' || val == null) {
            onUpdate({ override: null });
        } else {
            onUpdate({ override: { ...part.override, sell_total: Number(val) || 0 } });
        }
    };

    const setOverrideComment = (txt) => {
        onUpdate({ override: { ...(part.override || {}), comment: txt } });
    };

    return (
        <div style={{
            background: 'var(--bg2)', border: `1px solid ${overridden ? '#f59e0b' : 'var(--brd2)'}`,
            borderRadius: '10px', padding: '12px', marginBottom: '8px',
            position: 'relative',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ fontSize: '20px' }}>{part.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--txt)' }}>{part.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--txl)', marginTop: '2px' }}>
                        <span style={{ background: meta.color + '22', color: meta.color, padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {meta.icon} {meta.label}
                        </span>
                        <span style={{ marginLeft: '6px', color: 'var(--txl)' }}>· {part.pricing_model === 'per_pax' ? 'за чел' : part.pricing_model === 'base_plus_extra' ? 'база+чел' : 'за машину'}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '14px' }}>{FMT(calc.sell)}</div>
                    {isAdmin && (
                        <div style={{ fontSize: '10px', color: 'var(--txl)' }}>нетто {FMT(calc.net)} · маржа +{FMT(calc.margin)}</div>
                    )}
                </div>
                <button onClick={onRemove} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }} title="Удалить">✕</button>
            </div>

            {/* Гости + override */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <NumIn label="Взр" value={part.qty?.adults || 0} onChange={v => setQty('adults', v)} />
                    <NumIn label="Дет" value={part.qty?.children || 0} onChange={v => setQty('children', v)} />
                    <NumIn label="Млд" value={part.qty?.infants || 0} onChange={v => setQty('infants', v)} />
                </div>
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="fg" style={{ flex: 1, minWidth: '120px' }}>
                            <label style={{ fontSize: '10px', color: 'var(--txm)', display: 'block', marginBottom: '2px' }}>Своя цена за всю позицию</label>
                            <input type="number" value={part.override?.sell_total ?? ''} onChange={e => setOverride(e.target.value)} placeholder={`(стандарт: ${calc.sell})`} style={inlineInput} />
                        </div>
                        <div className="fg" style={{ flex: 2, minWidth: '160px' }}>
                            <label style={{ fontSize: '10px', color: 'var(--txm)', display: 'block', marginBottom: '2px' }}>Комментарий</label>
                            <input type="text" value={part.override?.comment || ''} onChange={e => setOverrideComment(e.target.value)} placeholder="напр. скидка постоянному клиенту" style={inlineInput} />
                        </div>
                        {overridden && (
                            <button onClick={() => setOverride('')} style={{ background: 'transparent', border: '1px solid var(--brd2)', color: 'var(--txl)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>↺ Сбросить</button>
                        )}
                    </div>
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

const inlineInput = {
    width: '100%', padding: '6px 8px', fontSize: '12px',
    background: 'var(--bg3)', border: '1px solid var(--brd2)',
    borderRadius: '6px', color: 'var(--txt)', fontFamily: 'inherit',
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
