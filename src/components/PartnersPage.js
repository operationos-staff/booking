'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './Portal.module.css';
import { loadPartners, savePartner, deletePartner, loadAtoms } from '@/lib/db';

const CATEGORY_LABELS = {
    transport: '🚐 Транспорт',
    guide:     '🗣 Гид',
    meal:      '🍜 Питание',
    location:  '📍 Локации',
    activity:  '🎯 Активности',
    stay:      '🏨 Проживание',
    shopping:  '🛍 Шоппинг',
    evening:   '🌃 Вечерние',
    extra:     '➕ Доплаты',
};

const COLOR_PRESETS = ['#f59e0b','#10b981','#22d3ee','#8b5cf6','#a78bfa','#ec4899','#fb923c','#0ea5e9','#84cc16','#fbbf24'];

function openAtomsByPartner(partnerId, onPage) {
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('atomic_filter_partner', partnerId);
    }
    onPage && onPage('atomic');
}

export default function PartnersPage({ role, toast: externalToast, onPage }) {
    const isAdmin = role === 'booking';
    const showToast = externalToast || ((m) => alert(m));

    const [partners, setPartners] = useState([]);
    const [atoms, setAtoms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState('all');
    const [searchQ, setSearchQ] = useState('');
    const [edit, setEdit] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const [ps, as] = await Promise.all([loadPartners(), loadAtoms()]);
            if (!cancelled) {
                setPartners(ps);
                setAtoms(as);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const filtered = useMemo(() => {
        const q = (searchQ || '').toLowerCase().trim();
        return partners.filter(p => {
            if (filterCat !== 'all' && !(p.categories || []).includes(filterCat)) return false;
            if (q && !((p.name || '').toLowerCase().includes(q) || (p.short_name || '').toLowerCase().includes(q))) return false;
            return true;
        });
    }, [partners, filterCat, searchQ]);

    // Атомов на каждого партнёра
    const atomCount = useMemo(() => {
        const m = new Map();
        for (const a of atoms) {
            if (a.partner_id) m.set(a.partner_id, (m.get(a.partner_id) || 0) + 1);
        }
        return m;
    }, [atoms]);

    const openCreate = () => setEdit({
        id: '', name: '', short_name: '', icon: '🏢', color: '#8b5cf6',
        categories: [], contact_phone: '', contact_email: '', contact_telegram: '', contact_whatsapp: '',
        website: '', address: '', notes: '', active: true, sort_order: 999,
    });
    const openEdit = (p) => setEdit({ ...p, categories: [...(p.categories || [])] });

    const save = async () => {
        if (!edit.name) { showToast('Укажи название', 'err'); return; }
        const id = await savePartner(edit);
        if (id) {
            const fresh = await loadPartners();
            setPartners(fresh);
            setEdit(null);
            showToast('Сохранено', 'ok');
        } else showToast('Ошибка', 'err');
    };

    const remove = async (id, name) => {
        if (!confirm(`Удалить партнёра «${name}»? Атомы привязанные к нему получат пустого партнёра.`)) return;
        const ok = await deletePartner(id);
        if (ok) {
            setPartners(prev => prev.filter(p => p.id !== id));
            setEdit(null);
            showToast('Удалён', 'ok');
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--txm)' }}>
                Раздел партнёров доступен только операционному отделу.
            </div>
        );
    }

    return (
        <div className={styles.theme} style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px', maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '24px' }}>👥</span>
                <h1 style={{ margin: 0, color: 'var(--txt)', fontSize: '20px', fontWeight: 800 }}>Партнёры / Поставщики</h1>
                <span style={{ color: 'var(--txl)', fontSize: '13px' }}>· {partners.length} активных</span>
                <div style={{ flex: 1 }} />
                <button onClick={openCreate} style={btnAdd}>+ Новый партнёр</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Поиск по названию..." value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    style={{
                        flex: 1, minWidth: '220px', padding: '8px 12px',
                        borderRadius: '8px', border: '1px solid var(--brd2)',
                        background: 'var(--bg3)', color: 'var(--txt)', fontFamily: 'inherit',
                    }} />
                <button onClick={() => setFilterCat('all')} style={chipStyle(filterCat === 'all')}>🌐 Все</button>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => setFilterCat(k)} style={chipStyle(filterCat === k)}>{v}</button>
                ))}
            </div>

            {loading ? (
                <div style={{ color: 'var(--txl)', padding: '40px', textAlign: 'center' }}>Загрузка…</div>
            ) : filtered.length === 0 ? (
                <div style={{ color: 'var(--txl)', padding: '40px', textAlign: 'center' }}>
                    {partners.length === 0 ? 'Пока нет партнёров. Нажми «+ Новый партнёр».' : 'Ничего не найдено по фильтрам.'}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {filtered.map(p => {
                        const cnt = atomCount.get(p.id) || 0;
                        return (
                        <div key={p.id} style={{
                            background: 'var(--bg2)', border: `1px solid ${p.color || 'var(--brd)'}55`,
                            borderRadius: '12px', padding: '14px',
                            borderLeft: `4px solid ${p.color || '#8b5cf6'}`,
                            display: 'flex', flexDirection: 'column',
                        }}>
                            <div onClick={() => openEdit(p)} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '24px' }}>{p.icon || '🏢'}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 800, color: 'var(--txt)', fontSize: '14px' }}>{p.name}</div>
                                    {p.short_name && p.short_name !== p.name && (
                                        <div style={{ fontSize: '10px', color: 'var(--txl)' }}>{p.short_name}</div>
                                    )}
                                </div>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700, color: p.color, opacity: 0.9,
                                    background: `${p.color}22`, padding: '2px 8px', borderRadius: '6px',
                                }}>
                                    {cnt} атом.
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                {(p.categories || []).map(c => (
                                    <span key={c} style={{
                                        fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                                        background: 'var(--brd2)', color: 'var(--txm)',
                                    }}>
                                        {CATEGORY_LABELS[c] || c}
                                    </span>
                                ))}
                            </div>
                            {(p.contact_phone || p.contact_telegram || p.contact_email) && (
                                <div style={{ fontSize: '11px', color: 'var(--txm)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {p.contact_phone    && <span>📱 {p.contact_phone}</span>}
                                    {p.contact_telegram && <span>✈️ {p.contact_telegram}</span>}
                                    {p.contact_email    && <span>✉️ {p.contact_email}</span>}
                                </div>
                            )}
                            {p.notes && (
                                <div style={{ fontSize: '11px', color: 'var(--txl)', marginTop: '6px', fontStyle: 'italic' }}>
                                    {p.notes.length > 80 ? p.notes.slice(0, 80) + '…' : p.notes}
                                </div>
                            )}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); openAtomsByPartner(p.id, onPage); }}
                                disabled={cnt === 0}
                                style={{
                                    marginTop: '10px',
                                    padding: '7px 10px',
                                    borderRadius: '8px',
                                    border: `1px solid ${cnt > 0 ? (p.color || '#8b5cf6') + '55' : 'var(--brd2)'}`,
                                    background: cnt > 0 ? (p.color || '#8b5cf6') + '18' : 'transparent',
                                    color: cnt > 0 ? (p.color || '#8b5cf6') : 'var(--txl)',
                                    fontSize: '12px', fontWeight: 700,
                                    cursor: cnt > 0 ? 'pointer' : 'not-allowed',
                                    fontFamily: 'inherit',
                                    opacity: cnt > 0 ? 1 : 0.6,
                                }}
                                title={cnt > 0 ? 'Открыть атомы этого партнёра в Атомном туре' : 'У партнёра пока нет атомов'}
                            >
                                🧬 Открыть атомы ({cnt})
                            </button>
                        </div>
                        );
                    })}
                </div>
            )}

            {edit && (
                <div onClick={() => setEdit(null)} style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.7)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '20px',
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--card-solid, #1a1a1a)', border: '1px solid rgba(245,158,11,0.3)',
                        borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '600px',
                        maxHeight: '90vh', overflow: 'auto', color: 'var(--txt)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--brd2)' }}>
                            <h3 style={{ margin: 0, color: '#f59e0b' }}>{edit.id ? 'Редактирование партнёра' : 'Новый партнёр'}</h3>
                            <button onClick={() => setEdit(null)} style={{ background: 'transparent', border: 'none', color: 'var(--txl)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <Row label="Иконка"><input value={edit.icon} onChange={e => setEdit({ ...edit, icon: e.target.value })} style={mInput} maxLength={4} /></Row>
                            <Row label="Цвет">
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {COLOR_PRESETS.map(c => (
                                        <button key={c} onClick={() => setEdit({ ...edit, color: c })} style={{
                                            width: '24px', height: '24px', borderRadius: '6px',
                                            background: c, border: edit.color === c ? '2px solid #fff' : '1px solid var(--brd2)',
                                            cursor: 'pointer',
                                        }} />
                                    ))}
                                </div>
                            </Row>
                        </div>
                        <Row label="Название (полное)"><input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} style={mInput} /></Row>
                        <Row label="Короткое имя (для бейджа)"><input value={edit.short_name} onChange={e => setEdit({ ...edit, short_name: e.target.value })} style={mInput} placeholder="например, «Elephant Sanctuary»" /></Row>

                        <Row label="Категории услуг">
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {Object.entries(CATEGORY_LABELS).map(([k, v]) => {
                                    const on = (edit.categories || []).includes(k);
                                    return (
                                        <button key={k} onClick={() => {
                                            const cur = new Set(edit.categories || []);
                                            on ? cur.delete(k) : cur.add(k);
                                            setEdit({ ...edit, categories: Array.from(cur) });
                                        }} style={{
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                            border: `1px solid ${on ? edit.color : 'var(--brd2)'}`,
                                            background: on ? `${edit.color}22` : 'transparent',
                                            color: on ? edit.color : 'var(--txm)',
                                            cursor: 'pointer', fontFamily: 'inherit',
                                        }}>{v}</button>
                                    );
                                })}
                            </div>
                        </Row>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <Row label="Телефон"><input value={edit.contact_phone} onChange={e => setEdit({ ...edit, contact_phone: e.target.value })} style={mInput} placeholder="+66..." /></Row>
                            <Row label="WhatsApp"><input value={edit.contact_whatsapp} onChange={e => setEdit({ ...edit, contact_whatsapp: e.target.value })} style={mInput} /></Row>
                            <Row label="Telegram"><input value={edit.contact_telegram} onChange={e => setEdit({ ...edit, contact_telegram: e.target.value })} style={mInput} placeholder="@username" /></Row>
                            <Row label="Email"><input value={edit.contact_email} onChange={e => setEdit({ ...edit, contact_email: e.target.value })} style={mInput} /></Row>
                            <Row label="Сайт"><input value={edit.website} onChange={e => setEdit({ ...edit, website: e.target.value })} style={mInput} /></Row>
                            <Row label="Адрес"><input value={edit.address} onChange={e => setEdit({ ...edit, address: e.target.value })} style={mInput} /></Row>
                        </div>

                        <Row label="Заметки">
                            <textarea value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })}
                                style={{ ...mInput, minHeight: '70px', fontFamily: 'inherit' }}
                                placeholder="Условия работы, скидки, спецификация..." />
                        </Row>

                        <Row label="Активный">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--txt)' }}>
                                <input type="checkbox" checked={edit.active} onChange={e => setEdit({ ...edit, active: e.target.checked })} />
                                <span style={{ fontSize: '12px' }}>Показывать в списке</span>
                            </label>
                        </Row>

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--brd2)' }}>
                            {edit.id ? (
                                <button onClick={() => remove(edit.id, edit.name)} style={btnDel}>🗑 Удалить</button>
                            ) : <span />}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setEdit(null)} style={btnCancel}>Отмена</button>
                                <button onClick={save} style={btnSave}>Сохранить</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Row({ label, children }) {
    return (
        <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</label>
            {children}
        </div>
    );
}

function chipStyle(active) {
    return {
        padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
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

const btnAdd = {
    padding: '8px 14px', borderRadius: '8px',
    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
    color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '13px',
};
const btnSave = {
    padding: '8px 16px', borderRadius: '8px',
    background: '#f59e0b', color: '#000', border: 'none',
    fontWeight: 800, cursor: 'pointer',
};
const btnCancel = {
    padding: '8px 16px', borderRadius: '8px',
    background: 'transparent', color: 'var(--txm)', border: '1px solid var(--brd2)',
    fontWeight: 600, cursor: 'pointer',
};
const btnDel = {
    padding: '8px 14px', borderRadius: '8px',
    background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)',
    fontWeight: 700, cursor: 'pointer',
};
