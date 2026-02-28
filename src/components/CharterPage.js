'use client';

import React, { useState, useEffect } from 'react';
import styles from './Portal.module.css';

const DEFAULT_DB = {
    tours: [
        { id: 't1', icon: '🏝', name: 'Пхи-Пхи + Бамбу', net: 25000, sell: 39000 },
        { id: 't2', icon: '🚣', name: 'Джеймс Бонд + Каное', net: 25000, sell: 39000 },
        { id: 't3', icon: '🗺', name: 'Пхи-Пхи + Джеймс Бонд', net: 35000, sell: 55000 },
    ],
    items: [
        { id: 'i1', tId: 't1', icon: '🎫', name: 'Нац. парк + обед', type: 'per_pax', net: 750, sell: 1000, mgr: false },
        { id: 'i2', tId: 't1', icon: '🚐', name: 'Доп. минивэн (>10 чел)', type: 'fixed', net: 2000, sell: 2500, mgr: true },
        { id: 'i3', tId: 't1', icon: '🗣', name: 'Русский гид', type: 'fixed', net: 2000, sell: 2500, mgr: true },
        { id: 'i4', tId: 't2', icon: '🎫', name: 'Нац. парк, каное, обед', type: 'per_pax', net: 800, sell: 1000, mgr: false },
        { id: 'i5', tId: 't2', icon: '🚐', name: 'Доп. минивэн (>10 чел)', type: 'fixed', net: 2000, sell: 2500, mgr: true },
        { id: 'i6', tId: 't3', icon: '🎫', name: 'Нац. парк, каное, обед', type: 'per_pax', net: 1500, sell: 2000, mgr: false },
        { id: 'i7', tId: 't3', icon: '🚐', name: 'Доп. минивэн (>10 чел)', type: 'fixed', net: 2000, sell: 2500, mgr: true },
    ]
};

const UID = () => Math.random().toString(36).substr(2, 9);
const FMT = (n) => new Intl.NumberFormat('ru-RU').format(n || 0) + ' ฿';

export default function CharterPage({ role }) {
    const isAdmin = role === 'booking';
    const [db, setDb] = useState(DEFAULT_DB);
    const [activeTab, setActiveTab] = useState('calc');
    const [searchQuery, setSearchQuery] = useState('');

    // Calc State
    const [sTour, setSTour] = useState(null);
    const [pax, setPax] = useState(2);
    const [mgrSelections, setMgrSelections] = useState({});

    // Admin Item Modal State
    const [showItemModal, setShowItemModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [adminSelTour, setAdminSelTour] = useState('');

    // Load from LS
    useEffect(() => {
        const saved = localStorage.getItem('charter_db');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setDb(parsed);
                if (parsed.tours?.length) setAdminSelTour(parsed.tours[0].id);
            } catch (e) { }
        } else {
            if (DEFAULT_DB.tours.length) setAdminSelTour(DEFAULT_DB.tours[0].id);
        }
    }, []);

    // Force manager view if role changes while in admin
    useEffect(() => {
        if (!isAdmin && activeTab === 'admin') {
            setActiveTab('calc');
        }
    }, [isAdmin, activeTab]);

    const saveDB = (newDb) => {
        setDb(newDb);
        localStorage.setItem('charter_db', JSON.stringify(newDb));
    };

    // ---- CALC LOGIC ----
    const handleTourSelect = (tId) => {
        setSTour(tId);
        setMgrSelections({});
    };

    const handleOptToggle = (iId) => {
        setMgrSelections(prev => {
            const copy = { ...prev };
            if (copy[iId]) delete copy[iId];
            else copy[iId] = 1;
            return copy;
        });
    };

    const handleOptQtyChange = (iId, val) => {
        const num = Number(val) || 1;
        setMgrSelections(prev => ({ ...prev, [iId]: num }));
    };

    const currentTourObj = db.tours.find(t => t.id === sTour);
    const currentItems = db.items.filter(i => i.tId === sTour);

    let sellTot = 0, netTot = 0;
    let calcRowsC = [], calcRowsA = [];

    if (currentTourObj) {
        sellTot += currentTourObj.sell;
        netTot += currentTourObj.net;
        calcRowsC.push({ key: 'base', name: `🚤 Аренда катера (${currentTourObj.name})`, meta: 'Базовая стоимость', val: currentTourObj.sell });
        calcRowsA.push({ key: 'base-a', name: `🚤 Катер (${currentTourObj.name})`, meta: 'Нетто лодки', val: currentTourObj.net });

        currentItems.forEach(i => {
            let qty = 0, labelMeta = '';
            if (i.mgr) {
                if (mgrSelections[i.id]) {
                    qty = i.type === 'per_pax' ? pax : mgrSelections[i.id];
                    labelMeta = i.type === 'per_pax' ? `${pax} гост. × ${FMT(i.sell)}` : `${mgrSelections[i.id]} шт × ${FMT(i.sell)}`;
                }
            } else {
                qty = i.type === 'per_pax' ? pax : 1;
                labelMeta = i.type === 'per_pax' ? `${pax} гост. × ${FMT(i.sell)} (авто)` : `Авто (вкл)`;
            }

            if (qty > 0) {
                sellTot += i.sell * qty;
                netTot += i.net * qty;
                calcRowsC.push({ key: i.id, name: `${i.icon} ${i.name}`, meta: labelMeta, val: i.sell * qty });
                calcRowsA.push({ key: i.id + '-a', name: `${i.icon} ${i.name}`, meta: i.type === 'per_pax' ? `${pax} чел × ${FMT(i.net)}` : `${qty} шт × ${FMT(i.net)}`, val: i.net * qty });
            }
        });
    }

    const profit = sellTot - netTot;
    const margin = sellTot > 0 ? (profit / sellTot) * 100 : 0;
    const marginVisualPct = Math.max(0, Math.min(100, margin * 2));

    const handlePublish = () => {
        if (!sTour) return;
        let txt = `🌴 Private Charter Quote\n📍 Маршрут: ${currentTourObj.icon} ${currentTourObj.name}\n👥 Гостей: ${pax} чел.\n\n`;
        txt += `🚤 Аренда катера: ${FMT(currentTourObj.sell)}\n`;
        currentItems.forEach(i => {
            let qty = 0;
            if (i.mgr && mgrSelections[i.id]) qty = i.type === 'per_pax' ? pax : mgrSelections[i.id];
            if (!i.mgr) qty = i.type === 'per_pax' ? pax : 1;
            if (qty > 0) txt += `${i.icon} ${i.name}: ${FMT(i.sell * qty)}\n`;
        });
        txt += `\n💰 ИТОГО: ${FMT(sellTot)}`;
        navigator.clipboard.writeText(txt).then(() => alert("✅ Смета скопирована!"))
            .catch(() => alert("Смета:\n\n" + txt));
    };

    // ---- ADMIN LOGIC ----
    const addTour = () => {
        const newDb = { ...db };
        const newId = UID();
        newDb.tours.push({ id: newId, icon: '🚤', name: 'Новый маршрут', net: 0, sell: 0 });
        saveDB(newDb);
        setAdminSelTour(newId);
    };
    const delTour = (id) => {
        if (!confirm("Удалить маршрут и все его доплаты?")) return;
        const newDb = { ...db };
        newDb.tours = newDb.tours.filter(t => t.id !== id);
        newDb.items = newDb.items.filter(i => i.tId !== id);
        saveDB(newDb);
        if (sTour === id) setSTour(null);
        if (adminSelTour === id) setAdminSelTour(newDb.tours.length ? newDb.tours[0].id : '');
    };
    const updTour = (tId, field, value) => {
        const newDb = { ...db };
        const t = newDb.tours.find(x => x.id === tId);
        if (t) {
            if (field === 'net' || field === 'sell') t[field] = Number(value) || 0;
            else t[field] = value;
            saveDB(newDb);
        }
    };

    const openAddItem = () => {
        if (!adminSelTour) { alert("Сначала выберите маршрут!"); return; }
        setEditItem({ tId: adminSelTour, name: '', icon: '', type: 'fixed', net: 0, sell: 0, mgr: true });
        setShowItemModal(true);
    };
    const saveItemModal = () => {
        if (!editItem.name) return;
        const newDb = { ...db };
        const iObj = { ...editItem, id: editItem.id || UID(), net: Number(editItem.net) || 0, sell: Number(editItem.sell) || 0, icon: editItem.icon || '📌' };
        if (editItem.id) newDb.items[newDb.items.findIndex(x => x.id === editItem.id)] = iObj;
        else newDb.items.push(iObj);
        saveDB(newDb);
        setShowItemModal(false);
    };

    const filteredTours = db.tours.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* LOCAL TABS BAR (just to switch between Calc and Admin if Admin) */}
            {isAdmin && (
                <div style={{ padding: '20px 24px 0', borderBottom: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setActiveTab('calc')}
                            style={{
                                padding: '10px 20px', borderRadius: '12px 12px 0 0', border: '1px solid var(--border)', borderBottom: 'none', background: activeTab === 'calc' ? 'var(--card)' : 'transparent', fontWeight: 800, color: activeTab === 'calc' ? 'var(--pri)' : 'var(--txl)', cursor: 'pointer', transition: 'all 0.2s', borderBottom: activeTab === 'calc' ? '2px solid var(--card)' : 'none', marginBottom: activeTab === 'calc' ? '-2px' : '0'
                            }}
                        >
                            🧮 Калькулятор
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            style={{
                                padding: '10px 20px', borderRadius: '12px 12px 0 0', border: '1px solid var(--border)', borderBottom: 'none', background: activeTab === 'admin' ? 'var(--card)' : 'transparent', fontWeight: 800, color: activeTab === 'admin' ? 'var(--pri)' : 'var(--txl)', cursor: 'pointer', transition: 'all 0.2s', borderBottom: activeTab === 'admin' ? '2px solid var(--card)' : 'none', marginBottom: activeTab === 'admin' ? '-2px' : '0'
                            }}
                        >
                            ⚙️ Настройка чартеров
                        </button>
                    </div>
                </div>
            )}

            {/* --- PAGE: CALC (Master-Detail) --- */}
            {activeTab === 'calc' && (
                <div className={styles.container}>
                    {/* SIDEBAR */}
                    <aside className={styles.sidebar}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}><span>📍</span> Чартерные маршруты</div>
                            <input type="text" className={styles.searchInput} placeholder="Поиск (из 50+ маршрутов)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className={styles.tourList}>
                            {filteredTours.map(t => {
                                const isSel = sTour === t.id;
                                return (
                                    <div key={t.id} className={`${styles.tourItem} ${isSel ? styles.active : ''}`} onClick={() => handleTourSelect(t.id)}>
                                        <div className={styles.tourIcon}>{t.icon}</div>
                                        <div className={styles.tourInfo}>
                                            <div className={styles.tourName}>{t.name}</div>
                                            <div className={styles.tourPrice}>База: <span>{FMT(t.sell)}</span></div>
                                        </div>
                                    </div>
                                )
                            })}
                            {filteredTours.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '20px', fontSize: '0.9rem' }}>Не найдено</div>}
                        </div>
                    </aside>

                    {/* MAIN PANEL */}
                    <main className={styles.mainPanel}>
                        {!sTour ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyStateIco}>🚤</div>
                                <h3>Маршрут не выбран</h3>
                                <p>Пожалуйста, выберите маршрут чартера из боковой панели для начала расчета сметы.</p>
                            </div>
                        ) : (
                            <div className={styles.mainLayout}>
                                {/* Left Side: Inputs & Options */}
                                <div>
                                    <div className={styles.card}>
                                        <div className={styles.cardTitle}><span>👥</span> Количество гостей</div>
                                        <div className={styles.fg}>
                                            <label>Всего человек на борту</label>
                                            <input type="number" value={pax} min="1" onChange={(e) => setPax(Number(e.target.value) || 1)} />
                                        </div>
                                    </div>

                                    <div className={styles.card}>
                                        <div className={styles.cardTitle}><span>➕</span> Дополнительные опции</div>
                                        <div className={styles.optList}>
                                            {currentItems.filter(i => i.mgr).length === 0 ? (
                                                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Дополнительных опций для выбора нет.</div>
                                            ) : (
                                                currentItems.filter(i => i.mgr).map(o => {
                                                    const isChecked = !!mgrSelections[o.id];
                                                    const qty = mgrSelections[o.id] || 1;
                                                    return (
                                                        <div key={o.id} className={styles.optRow}>
                                                            <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: '#d4af37' }} checked={isChecked} onChange={() => handleOptToggle(o.id)} />
                                                            <div className={styles.optName} onClick={() => handleOptToggle(o.id)}>
                                                                {o.icon} {o.name} <span className={styles.optBadge}>{o.type === 'fixed' ? 'Шт' : 'Чел'}</span>
                                                            </div>
                                                            {o.type === 'fixed' && (
                                                                <input type="number" className={styles.optQty} value={qty} min="1" disabled={!isChecked} onChange={(e) => handleOptQtyChange(o.id, e.target.value)} onClick={e => e.stopPropagation()} />
                                                            )}
                                                            <div className={styles.optPrice}>+{FMT(o.sell)}</div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Sticky Quote */}
                                <div>
                                    <div className={styles.resBox}>
                                        <div className={styles.resHeader}>
                                            <span>🧾 Смета: {currentTourObj.name}</span>
                                        </div>
                                        {calcRowsC.map((r) => (
                                            <div key={r.key} className={styles.rr}>
                                                <div><div className={styles.rrName}>{r.name}</div><div className={styles.rrMeta}>{r.meta}</div></div>
                                                <div className={styles.rrVal}>{FMT(r.val)}</div>
                                            </div>
                                        ))}
                                        <div className={`${styles.rr} ${styles.rrTot}`}>
                                            <div>ИТОГО:</div>
                                            <div>{FMT(sellTot)}</div>
                                        </div>
                                        <button className={`${styles.btn} ${styles.btnGh}`} style={{ width: '100%', marginTop: '24px' }} onClick={handlePublish}>📤 Копировать для клиента</button>

                                        {isAdmin && (
                                            <div style={{ marginTop: '32px', borderTop: '1px dashed rgba(255,255,255,0.3)', paddingTop: '20px' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--warn)', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>🔒 Внутренний расчёт</div>
                                                {calcRowsA.map((r) => (
                                                    <div key={r.key} className={styles.rr} style={{ padding: '6px 0' }}>
                                                        <div><div className={styles.rrName}>{r.name}</div><div className={styles.rrMeta}>{r.meta}</div></div>
                                                        <div className={styles.rrVal}>{FMT(r.val)}</div>
                                                    </div>
                                                ))}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                                    <div>Итого Нетто:</div><div style={{ fontWeight: 700 }}>{FMT(netTot)}</div>
                                                </div>
                                                <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.3)', height: '6px', borderRadius: '10px' }}>
                                                    <div style={{ height: '100%', background: profit >= 0 ? 'linear-gradient(90deg, #d4af37, #fde047)' : '#ef4444', borderRadius: '10px', width: `${marginVisualPct}%` }}></div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    <div>Профит: <span style={{ color: profit >= 0 ? '#10b981' : '#ef4444', fontSize: '1rem' }}>{FMT(profit)}</span></div>
                                                    <div>{margin.toFixed(1)}% маржа</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            )}

            {/* --- PAGE: ADMIN --- */}
            {activeTab === 'admin' && isAdmin && (
                <div style={{ padding: '30px 20px', background: '#f8fafc', minHeight: 'calc(100vh - 120px)' }}>
                    <div className={styles.adminView}>

                        <div className={styles.card} style={{ borderColor: 'var(--warn)' }}>
                            <div className={styles.cardTitleFlex}>
                                <div className={styles.cardTitle} style={{ borderBottom: 'none', marginBottom: 0 }}><span>🚤</span> Управление маршрутами (Например: 50+ штук)</div>
                                <button className={`${styles.btn} ${styles.btnPri} ${styles.btnSm}`} onClick={addTour}>➕ Добавить чартер</button>
                            </div>
                            <div className={styles.tblWrapper}>
                                <table className={styles.tbl}>
                                    <thead><tr><th>Маршрут</th><th>Нетто ฿</th><th>Продажа ฿</th><th width="80">Действия</th></tr></thead>
                                    <tbody>
                                        {db.tours.map(t => (
                                            <tr key={t.id}>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <input type="text" value={t.icon} onChange={e => updTour(t.id, 'icon', e.target.value)} style={{ width: '50px', textAlign: 'center' }} maxLength="4" />
                                                        <input type="text" value={t.name} onChange={e => updTour(t.id, 'name', e.target.value)} />
                                                    </div>
                                                </td>
                                                <td><input type="number" value={t.net} onChange={e => updTour(t.id, 'net', e.target.value)} /></td>
                                                <td><input type="number" value={t.sell} onChange={e => updTour(t.id, 'sell', e.target.value)} /></td>
                                                <td><button className={`${styles.btn} ${styles.btnErr} ${styles.btnSm}`} onClick={() => delTour(t.id)}>Удалить</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className={styles.card} style={{ borderColor: 'var(--warn)', marginTop: '24px' }}>
                            <div className={styles.cardTitle}><span>⚙️</span> Настройка доплат по маршруту</div>
                            <div className={styles.fg} style={{ maxWidth: '400px', marginBottom: '24px' }}>
                                <label>Выберите маршрут:</label>
                                <select value={adminSelTour} onChange={e => setAdminSelTour(e.target.value)}>
                                    {db.tours.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--pri)' }}>Список доплат</div>
                                <button className={`${styles.btn} ${styles.btnAcc} ${styles.btnSm}`} onClick={openAddItem}>➕ Добавить доплату</button>
                            </div>

                            <div className={styles.tblWrapper}>
                                <table className={styles.tbl}>
                                    <thead><tr><th>Опция</th><th>Тип</th><th>Нетто ฿</th><th>Продажа ฿</th><th>Видимость</th><th width="80">Действия</th></tr></thead>
                                    <tbody>
                                        {db.items.filter(i => i.tId === adminSelTour).length === 0 ? (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)' }}>Нет доплат</td></tr>
                                        ) : (
                                            db.items.filter(i => i.tId === adminSelTour).map(i => (
                                                <tr key={i.id}>
                                                    <td><span style={{ fontSize: '1.2rem' }}>{i.icon}</span> <b>{i.name}</b></td>
                                                    <td><span className={styles.optBadge}>{i.type === 'per_pax' ? '👤 На человека' : '🔒 На группу'}</span></td>
                                                    <td style={{ color: 'var(--err)', fontWeight: 700 }}>{FMT(i.net)}</td>
                                                    <td style={{ color: 'var(--ok)', fontWeight: 700 }}>{FMT(i.sell)}</td>
                                                    <td>{i.mgr ? '✔️ Выбирает Менеджер' : '⚡ Автоматически'}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button className={`${styles.btn} ${styles.btnGh} ${styles.btnSm}`} onClick={() => { setEditItem({ ...i }); setShowItemModal(true); }}>✏️</button>
                                                            <button className={`${styles.btn} ${styles.btnErr} ${styles.btnSm}`} onClick={() => delItem(i.id)}>🗑</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* --- ITEM MODAL --- */}
            {showItemModal && (
                <div className={styles.modalOv}>
                    <div className={styles.modalBox}>
                        <h3>{editItem?.id ? '✏️ Редактировать опцию' : '➕ Добавить опцию'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className={styles.fg}><label>Название опции</label><input type="text" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} /></div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div className={styles.fg} style={{ flex: 1 }}><label>Иконка</label><input type="text" value={editItem.icon} onChange={e => setEditItem({ ...editItem, icon: e.target.value })} maxLength="4" /></div>
                                <div className={styles.fg} style={{ flex: 2 }}><label>Тип расчёта</label>
                                    <select value={editItem.type} onChange={e => setEditItem({ ...editItem, type: e.target.value })}>
                                        <option value="fixed">🔒 Фиксировано (за группу/услугу)</option>
                                        <option value="per_pax">👤 На человека</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div className={styles.fg} style={{ flex: 1 }}><label>Нетто / ฿</label><input type="number" value={editItem.net} onChange={e => setEditItem({ ...editItem, net: e.target.value })} /></div>
                                <div className={styles.fg} style={{ flex: 1 }}><label>Продажа / ฿</label><input type="number" value={editItem.sell} onChange={e => setEditItem({ ...editItem, sell: e.target.value })} /></div>
                            </div>
                            <div className={styles.fg} style={{ marginTop: '10px' }}>
                                <label className={styles.tglWrap}>
                                    <input type="checkbox" className={styles.srOnly} checked={editItem.mgr} onChange={e => setEditItem({ ...editItem, mgr: e.target.checked })} />
                                    <div className={styles.tgl}></div>
                                    <div>Выбирает менеджер <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', fontWeight: 'normal' }}>Опция будет видна в калькуляторе.</span></div>
                                </label>
                            </div>
                        </div>
                        <div className={styles.btnGrp}>
                            <button className={`${styles.btn} ${styles.btnGh}`} onClick={() => setShowItemModal(false)}>Отмена</button>
                            <button className={`${styles.btn} ${styles.btnOk}`} onClick={saveItemModal}>💾 Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
