'use client';

import React, { useState, useEffect } from 'react';
import styles from './Portal.module.css';
import { todayISO, doPrintCharter, clipCopy } from '@/lib/utils';
import { saveCalculation } from '@/lib/db';
import { LinkModal, TextModal } from './Modals';

const DEFAULT_DB = {
    tours: [
        {
            id: 'b1',
            icon: '🚤',
            name: '2 eng boat - Phi Phi Bamboo',
            net: 25000,
            mgrPrice: 40000,
            sell: 40000,
            color: '#fef08a',
            bType: '2 eng boat'
        },
        {
            id: 'b2',
            icon: '🚤',
            name: '2 eng boat - James Bond',
            net: 22000,
            mgrPrice: 37000,
            sell: 37000,
            color: '#fef08a',
            bType: '2 eng boat'
        },
        {
            id: 'b3',
            icon: '🚤',
            name: '2 eng boat - PP+JB',
            net: 35000,
            mgrPrice: 50000,
            sell: 50000,
            color: '#fef08a',
            bType: '2 eng boat'
        },
        {
            id: 'b4',
            icon: '🚤',
            name: '2 eng boat - PP+JB+Krabi',
            net: 35000,
            mgrPrice: 50000,
            sell: 50000,
            color: '#fef08a',
            bType: '2 eng boat'
        },
        {
            id: 'b5',
            icon: '🚤',
            name: '2 eng boat - PP+Krabi',
            net: 30000,
            mgrPrice: 45000,
            sell: 45000,
            color: '#fef08a',
            bType: '2 eng boat'
        },
        {
            id: 'b6',
            icon: '🚤',
            name: '2 eng boat - JB+ Krabi',
            net: 30000,
            mgrPrice: 45000,
            sell: 45000,
            color: '#fef08a',
            bType: '2 eng boat'
        },
        {
            id: 'b7',
            icon: '🚤',
            name: '2 eng boat - PP over',
            net: 35000,
            mgrPrice: 50000,
            sell: 50000,
            color: '#fef08a',
            bType: '2 eng boat'
        },
        {
            id: 'b8',
            icon: '🚤',
            name: '2 eng boat - Andaman Sunrise 2d',
            net: 45000,
            mgrPrice: 60000,
            sell: 60000,
            color: '#fef08a',
            bType: '2 eng boat'
        },
        {
            id: 'b9',
            icon: '🚤',
            name: '2 eng boat - Racha',
            net: 22000,
            mgrPrice: 37000,
            sell: 37000,
            color: '#fef08a',
            bType: '2 eng boat'
        },
        {
            id: 'b10',
            icon: '🚤',
            name: '3 eng boat - Phi Phi Bamboo',
            net: 32000,
            mgrPrice: 47000,
            sell: 47000,
            color: '#bfdbfe',
            bType: '3 eng boat'
        },
        {
            id: 'b11',
            icon: '🚤',
            name: '3 eng boat - James Bond',
            net: 45000,
            mgrPrice: 60000,
            sell: 60000,
            color: '#bfdbfe',
            bType: '3 eng boat'
        },
        {
            id: 'b12',
            icon: '🚤',
            name: '3 eng boat - PP+JB',
            net: 45000,
            mgrPrice: 60000,
            sell: 60000,
            color: '#bfdbfe',
            bType: '3 eng boat'
        },
        {
            id: 'b13',
            icon: '🚤',
            name: '3 eng boat - PP+JB+Krabi',
            net: 40000,
            mgrPrice: 55000,
            sell: 55000,
            color: '#bfdbfe',
            bType: '3 eng boat'
        },
        {
            id: 'b14',
            icon: '🚤',
            name: '3 eng boat - PP+Krabi',
            net: 40000,
            mgrPrice: 55000,
            sell: 55000,
            color: '#bfdbfe',
            bType: '3 eng boat'
        },
        {
            id: 'b15',
            icon: '🚤',
            name: '3 eng boat - JB+ Krabi',
            net: 45000,
            mgrPrice: 60000,
            sell: 60000,
            color: '#bfdbfe',
            bType: '3 eng boat'
        },
        {
            id: 'b16',
            icon: '🚤',
            name: '3 eng boat - PP over',
            net: 55000,
            mgrPrice: 70000,
            sell: 70000,
            color: '#bfdbfe',
            bType: '3 eng boat'
        },
        {
            id: 'b17',
            icon: '🚤',
            name: '3 eng boat - Andaman Sunrise 2d',
            net: 55000,
            mgrPrice: 70000,
            sell: 70000,
            color: '#bfdbfe',
            bType: '3 eng boat'
        },
        {
            id: 'b18',
            icon: '🚤',
            name: '3 eng boat - Rok+Ha',
            net: 32000,
            mgrPrice: 47000,
            sell: 47000,
            color: '#bfdbfe',
            bType: '3 eng boat'
        },
        {
            id: 'b19',
            icon: '🚤',
            name: '3 eng Luxury - Phi Phi Bamboo',
            net: 38000,
            mgrPrice: 53000,
            sell: 53000,
            color: '#fbcfe8',
            bType: '3 eng Luxury'
        },
        {
            id: 'b20',
            icon: '🚤',
            name: '3 eng Luxury - James Bond',
            net: 55000,
            mgrPrice: 70000,
            sell: 70000,
            color: '#fbcfe8',
            bType: '3 eng Luxury'
        },
        {
            id: 'b21',
            icon: '🚤',
            name: '3 eng Luxury - PP+JB',
            net: 55000,
            mgrPrice: 70000,
            sell: 70000,
            color: '#fbcfe8',
            bType: '3 eng Luxury'
        },
        {
            id: 'b22',
            icon: '🚤',
            name: '3 eng Luxury - PP+JB+Krabi',
            net: 50000,
            mgrPrice: 65000,
            sell: 65000,
            color: '#fbcfe8',
            bType: '3 eng Luxury'
        },
        {
            id: 'b23',
            icon: '🚤',
            name: '3 eng Luxury - PP+Krabi',
            net: 50000,
            mgrPrice: 65000,
            sell: 65000,
            color: '#fbcfe8',
            bType: '3 eng Luxury'
        },
        {
            id: 'b24',
            icon: '🚤',
            name: '3 eng Luxury - JB+ Krabi',
            net: 55000,
            mgrPrice: 70000,
            sell: 70000,
            color: '#fbcfe8',
            bType: '3 eng Luxury'
        },
        {
            id: 'b25',
            icon: '🚤',
            name: '3 eng Luxury - PP over',
            net: 65000,
            mgrPrice: 80000,
            sell: 80000,
            color: '#fbcfe8',
            bType: '3 eng Luxury'
        },
        {
            id: 'b26',
            icon: '🚤',
            name: '3 eng Luxury - Andaman Sunrise 2d',
            net: 70000,
            mgrPrice: 85000,
            sell: 85000,
            color: '#fbcfe8',
            bType: '3 eng Luxury'
        },
        {
            id: 'b27',
            icon: '🚤',
            name: '3 eng Luxury - Rok+Ha',
            net: 38000,
            mgrPrice: 53000,
            sell: 53000,
            color: '#fbcfe8',
            bType: '3 eng Luxury'
        },
        {
            id: 'b28',
            icon: '🚤',
            name: 'Catamaran Milan - Phi Phi Bamboo',
            net: 35000,
            mgrPrice: 50000,
            sell: 50000,
            color: '#bbf7d0',
            bType: 'Catamaran Milan'
        },
        {
            id: 'b29',
            icon: '🚤',
            name: 'Catamaran Milan - James Bond',
            net: 50000,
            mgrPrice: 65000,
            sell: 65000,
            color: '#bbf7d0',
            bType: 'Catamaran Milan'
        },
        {
            id: 'b30',
            icon: '🚤',
            name: 'Catamaran Milan - PP+JB',
            net: 50000,
            mgrPrice: 65000,
            sell: 65000,
            color: '#bbf7d0',
            bType: 'Catamaran Milan'
        },
        {
            id: 'b31',
            icon: '🚤',
            name: 'Catamaran Milan - PP+JB+Krabi',
            net: 45000,
            mgrPrice: 60000,
            sell: 60000,
            color: '#bbf7d0',
            bType: 'Catamaran Milan'
        },
        {
            id: 'b32',
            icon: '🚤',
            name: 'Catamaran Milan - PP+Krabi',
            net: 45000,
            mgrPrice: 60000,
            sell: 60000,
            color: '#bbf7d0',
            bType: 'Catamaran Milan'
        },
        {
            id: 'b33',
            icon: '🚤',
            name: 'Catamaran Milan - JB+ Krabi',
            net: 48000,
            mgrPrice: 63000,
            sell: 63000,
            color: '#bbf7d0',
            bType: 'Catamaran Milan'
        },
        {
            id: 'b34',
            icon: '🚤',
            name: 'Catamaran Milan - PP over',
            net: 60000,
            mgrPrice: 75000,
            sell: 75000,
            color: '#bbf7d0',
            bType: 'Catamaran Milan'
        },
        {
            id: 'b35',
            icon: '🚤',
            name: 'Catamaran Milan - Rok+Ha',
            net: 35000,
            mgrPrice: 50000,
            sell: 50000,
            color: '#bbf7d0',
            bType: 'Catamaran Milan'
        }
    ],
    items: [
        {
            id: 'i101',
            tId: 'ALL',
            icon: '🚐',
            name: 'Трансфер (1 VAN, Патонг/Ката/Карон)',
            type: 'fixed',
            net: 2000,
            mgrPrice: 2500,
            sell: 2500,
            mgr: true
        },
        {
            id: 'i102',
            tId: 'ALL',
            icon: '🚘',
            name: 'Трансфер (ALPHARD)',
            type: 'fixed',
            net: 10000,
            mgrPrice: 12000,
            sell: 12000,
            mgr: true
        },
        {
            id: 'i201',
            tId: 'ALL',
            icon: '🗣',
            name: 'Русский гид (1 день)',
            type: 'fixed',
            net: 2000,
            mgrPrice: 2500,
            sell: 2500,
            mgr: true
        },
        {
            id: 'i202',
            tId: 'ALL',
            icon: '🗣',
            name: 'Русский гид (С ночевкой / Симиланы)',
            type: 'fixed',
            net: 4000,
            mgrPrice: 5000,
            sell: 5000,
            mgr: true
        },
        {
            id: 'i203',
            tId: 'ALL',
            icon: '🇹🇭',
            name: 'Тайский гид',
            type: 'fixed',
            net: 1500,
            mgrPrice: 2000,
            sell: 2000,
            mgr: true
        },
        {
            id: 'i301',
            tId: 'ALL',
            icon: '🎫',
            name: 'Нац. парк Пхи-Пхи (Взрослый)',
            type: 'fixed',
            net: 400,
            mgrPrice: 400,
            sell: 400,
            mgr: true
        },
        {
            id: 'i302',
            tId: 'ALL',
            icon: '🎫',
            name: 'Нац. парк Пхи-Пхи (Детский)',
            type: 'fixed',
            net: 200,
            mgrPrice: 200,
            sell: 200,
            mgr: true
        },
        {
            id: 'i303',
            tId: 'ALL',
            icon: '🎫',
            name: 'Нац. парк Джеймс Бонд (Взрослый)',
            type: 'fixed',
            net: 300,
            mgrPrice: 300,
            sell: 300,
            mgr: true
        },
        {
            id: 'i304',
            tId: 'ALL',
            icon: '🎫',
            name: 'Нац. парк Джеймс Бонд (Детский)',
            type: 'fixed',
            net: 150,
            mgrPrice: 150,
            sell: 150,
            mgr: true
        },
        {
            id: 'i305',
            tId: 'ALL',
            icon: '🎫',
            name: 'Нац. парк Краби (Взрослый)',
            type: 'fixed',
            net: 300,
            mgrPrice: 300,
            sell: 300,
            mgr: true
        },
        {
            id: 'i306',
            tId: 'ALL',
            icon: '🎫',
            name: 'Нац. парк Краби (Детский)',
            type: 'fixed',
            net: 150,
            mgrPrice: 150,
            sell: 150,
            mgr: true
        },
        {
            id: 'i401',
            tId: 'ALL',
            icon: '🍽',
            name: 'Обед Harbour (Взрослый)',
            type: 'fixed',
            net: 350,
            mgrPrice: 500,
            sell: 500,
            mgr: true
        },
        {
            id: 'i402',
            tId: 'ALL',
            icon: '🍽',
            name: 'Обед Harbour (Детский)',
            type: 'fixed',
            net: 250,
            mgrPrice: 350,
            sell: 350,
            mgr: true
        },
        {
            id: 'i403',
            tId: 'ALL',
            icon: '🍽',
            name: 'Обед Panyee (Взрослый)',
            type: 'fixed',
            net: 200,
            mgrPrice: 300,
            sell: 300,
            mgr: true
        },
        {
            id: 'i404',
            tId: 'ALL',
            icon: '🍽',
            name: 'Обед Panyee (Детский)',
            type: 'fixed',
            net: 100,
            mgrPrice: 150,
            sell: 150,
            mgr: true
        },
        {
            id: 'i501',
            tId: 'ALL',
            icon: '🛶',
            name: 'Каноэ (Джеймс Бонд)',
            type: 'fixed',
            net: 150,
            mgrPrice: 250,
            sell: 250,
            mgr: true
        }
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
    const [pax, setPax] = useState({ adults: 2, children: 0 }); // New pax state
    const [client, setClient] = useState({ name: '', date: '', phone: '', note: '' });
    const [modal, setModal] = useState(null);
    const [shareUrl, setShareUrl] = useState('');
    const [mgrSelections, setMgrSelections] = useState({});
    const [mgrPricesOverrides, setMgrPricesOverrides] = useState({}); // New State for Admin Pricing Override

    // Admin Item Modal State
    const [showItemModal, setShowItemModal] = useState(false);

    // Track unsaved inline edits for items
    const [unsavedItems, setUnsavedItems] = useState({});
    const [editItem, setEditItem] = useState(null);
    const [adminSelTour, setAdminSelTour] = useState('');

    // Drag & Drop State
    const [dragTIdx, setDragTIdx] = useState(null);
    const [dragIIdx, setDragIIdx] = useState(null);
    const [dragMode, setDragMode] = useState(null); // Fix text selection by only enabling drag on handle

    // Load from LS
    useEffect(() => {
        const saved = localStorage.getItem('charter_db');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Auto-sync if hardcoded DB has more/different amount of tours (from our recent Excel import)
                if (!parsed.tours || parsed.tours.length !== DEFAULT_DB.tours.length) {
                    console.log("Syncing database from code... (length mismatch)");
                    setDb(DEFAULT_DB);
                    localStorage.setItem('charter_db', JSON.stringify(DEFAULT_DB));
                    if (DEFAULT_DB.tours.length) setAdminSelTour(DEFAULT_DB.tours[0].id);
                    return;
                }
                setDb(document.DEFAULT_DB_DEV || parsed); // Use memory override if available
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

    const resetDB = () => {
        if (!confirm("ВНИМАНИЕ! Это удалит все ваши изменения цен и вернет базу к заводским (из Excel). Продолжить?")) return;
        saveDB(DEFAULT_DB);
        alert("База данных успешно сброшена к заводским настройкам!");
        window.location.reload();
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

    // items that match tour id or say ALL
    const currentItems = db.items.filter(i => i.tId === sTour || i.tId === 'ALL');

    let sellTot = 0, netTot = 0, mgrTot = 0;
    let calcRowsC = [], calcRowsA = [], calcRowsM = [];
    const totalPax = (pax.adults || 0) + (pax.children || 0);
    const selOptsList = [];

    if (currentTourObj) {
        sellTot += currentTourObj.sell;
        netTot += currentTourObj.net;
        mgrTot += currentTourObj.mgrPrice || currentTourObj.sell;

        calcRowsC.push({ key: 'base', name: `🚤 Аренда катера (${currentTourObj.name})`, meta: 'Базовая стоимость', val: currentTourObj.sell });
        calcRowsA.push({ key: 'base-a', name: `🚤 Катер (${currentTourObj.name})`, meta: 'Нетто лодки', val: currentTourObj.net });
        calcRowsM.push({ key: 'base-m', name: `🚤 Катер (${currentTourObj.name})`, meta: 'Менедж. цена лодки', val: currentTourObj.mgrPrice || currentTourObj.sell });

        currentItems.forEach(i => {
            let qty = 0, labelMeta = '';
            if (i.mgr) {
                if (mgrSelections[i.id]) {
                    qty = i.type === 'per_pax' ? totalPax : mgrSelections[i.id];
                    labelMeta = i.type === 'per_pax' ? `${totalPax} гост. × ${FMT(i.sell)}` : `${mgrSelections[i.id]} шт × ${FMT(i.sell)}`;
                }
            } else {
                qty = i.type === 'per_pax' ? totalPax : 1;
                labelMeta = i.type === 'per_pax' ? `${totalPax} гост. × ${FMT(i.sell)} (авто)` : `Авто (вкл)`;
            }

            if (qty > 0) {
                const cNet = i.net * qty;
                const cMgr = (i.mgrPrice || i.sell) * qty;
                const cSell = i.sell * qty;

                sellTot += cSell;
                netTot += cNet;
                mgrTot += cMgr;

                const rowLabelMeta = i.type === 'per_pax' ? `${totalPax} гост. × ${FMT(i.sell)}` : `${qty} шт × ${FMT(i.sell)}`;

                calcRowsC.push({ key: i.id, name: `${i.icon} ${i.name}`, meta: i.mgr ? rowLabelMeta : labelMeta, val: cSell });
                calcRowsA.push({ key: i.id + '-a', name: `${i.icon} ${i.name}`, meta: i.type === 'per_pax' ? `${totalPax} чел × ${FMT(i.net)}` : `${qty} шт × ${FMT(i.net)}`, val: cNet });
                calcRowsM.push({ key: i.id + '-m', name: `${i.icon} ${i.name}`, meta: i.type === 'per_pax' ? `${totalPax} чел × ${FMT(i.mgrPrice || i.sell)}` : `${qty} шт × ${FMT(i.mgrPrice || i.sell)}`, val: cMgr });

                selOptsList.push({ ...i, meta: i.mgr ? rowLabelMeta : labelMeta, val: cSell, qty });
            }
        });
    }

    const profit = sellTot - netTot;
    const margin = sellTot > 0 ? (profit / sellTot) * 100 : 0;
    const marginVisualPct = Math.max(0, Math.min(100, margin * 2));

    const handlePublish = () => {
        if (!sTour) return;
        setModal('text');
    };

    const getClientData = () => {
        return {
            ...client,
            pax: `${pax.adults} взр. + ${pax.children} дет.`,
            tourName: `${currentTourObj.icon} ${currentTourObj.name}`,
            items: selOptsList,
            total: sellTot,
            gen: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
        };
    };

    const handlePrint = () => {
        if (!sTour) return;
        doPrintCharter(getClientData());
    };

    const handleLink = async () => {
        if (!sTour) return;
        const d = getClientData();
        const calcId = await saveCalculation('charters', d.name || 'charter', d.date || null, d);
        let url = `${location.origin}${location.pathname}?tour=${calcId || btoa(encodeURIComponent(JSON.stringify(d)))}`;
        setShareUrl(url);
        setModal('link');
        clipCopy(url).then(() => alert('Ссылка скопирована!'));
    };

    // ---- ADMIN LOGIC ----
    const addTour = () => {
        const newDb = { ...db };
        const newId = UID();
        newDb.tours.push({
            id: newId, icon: '🚤', name: 'Новый маршрут', net: 0,
            mgrPrice: 0,
            sell: 0
        });
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
            if (field === 'sell') {
                t.sell = Number(value) || 0;
                t.mgrPrice = Number(value) || 0; // Sync manager price
            } else if (['net', 'mgrPrice'].includes(field)) {
                t[field] = Number(value) || 0;
            } else {
                t[field] = value;
            }
            saveDB(newDb);
        }
    };

    // Items admin overrides for "ALL"
    const openAddItem = () => {
        if (!adminSelTour) { alert("Сначала выберите маршрут (или 'ALL' если добавим)!"); return; }
        setEditItem({
            tId: adminSelTour, name: '', icon: '', type: 'fixed', net: 0,
            mgrPrice: 0,
            sell: 0, mgr: true
        });
        setShowItemModal(true);
    };
    const saveItemModal = () => {
        if (!editItem.name) return;
        const newDb = { ...db };
        const iObj = { ...editItem, id: editItem.id || UID(), net: Number(editItem.net) || 0, sell: Number(editItem.sell) || 0, mgrPrice: Number(editItem.mgrPrice) || 0, icon: editItem.icon || '📌' };
        if (editItem.id) newDb.items[newDb.items.findIndex(x => x.id === editItem.id)] = iObj;
        else newDb.items.push(iObj);
        saveDB(newDb);
        setShowItemModal(false);
    };

    const updItemInline = (iId, field, value) => {
        setUnsavedItems(prev => {
            const currentObj = prev[iId] || { ...db.items.find(x => x.id === iId) };
            const val = ['net', 'mgrPrice', 'sell'].includes(field) ? (Number(value) || 0) : value;
            return {
                ...prev,
                [iId]: { ...currentObj, [field]: val }
            };
        });
    };

    const saveAllEdits = () => {
        const newDb = { ...db };
        Object.keys(unsavedItems).forEach(iId => {
            const idx = newDb.items.findIndex(x => x.id === iId);
            if (idx !== -1) {
                // if we updated sell, auto-sync mgrPrice just like before, unless mgrPrice was also explicitly updated in this batch
                const itemUpdates = unsavedItems[iId];
                if ('sell' in itemUpdates && !('mgrPrice' in itemUpdates)) {
                    itemUpdates.mgrPrice = itemUpdates.sell;
                }
                newDb.items[idx] = { ...newDb.items[idx], ...itemUpdates };
            }
        });
        saveDB(newDb);
        setUnsavedItems({});
    };

    const discardAllEdits = () => {
        if (confirm("Отменить все несохраненные изменения?")) {
            setUnsavedItems({});
        }
    };
    const delItem = (iId) => {
        if (!confirm("Удалить опцию?")) return;
        const newDb = { ...db };
        newDb.items = newDb.items.filter(i => i.id !== iId);
        saveDB(newDb);
    };

    const filteredTours = db.tours.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className={styles.theme} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
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
                                    <div key={t.id} className={`${styles.tourItem} ${isSel ? styles.active : ''}`} style={{ background: t.color || '', border: t.color ? 'none' : '' }} onClick={() => handleTourSelect(t.id)}>
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
                                        <div className={styles.cardTitle}><span>📝</span> Данные клиента</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div className={styles.fg}>
                                                <label>Имя клиента</label>
                                                <input type="text" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} placeholder="Например, Иван" />
                                            </div>
                                            <div className={styles.fg}>
                                                <label>Дата / Отель</label>
                                                <input type="date" value={client.date} onChange={e => setClient({ ...client, date: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.card}>
                                        <div className={styles.cardTitle}><span>👥</span> Количество гостей</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div className={styles.fg}>
                                                <label>Взрослые</label>
                                                <input type="number" value={pax.adults} min="1" onChange={(e) => setPax({ ...pax, adults: Number(e.target.value) || 0 })} />
                                            </div>
                                            <div className={styles.fg}>
                                                <label>Дети</label>
                                                <input type="number" value={pax.children} min="0" onChange={(e) => setPax({ ...pax, children: Number(e.target.value) || 0 })} />
                                            </div>
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
                                                        <div key={o.id} className={styles.optRow} style={{ flexWrap: 'wrap', gap: '8px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
                                                                <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: '#d4af37', flexShrink: 0 }} checked={isChecked} onChange={() => handleOptToggle(o.id)} />
                                                                <div className={styles.optName} onClick={() => handleOptToggle(o.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span style={{ fontSize: '1.2rem' }}>{o.icon}</span>
                                                                    <span style={{ lineHeight: 1.2 }}>{o.name}</span>
                                                                    <span className={styles.optBadge}>{o.type === 'fixed' ? 'Шт' : 'Чел'}</span>
                                                                </div>
                                                            </div>
                                                            {o.type === 'fixed' && (
                                                                <input type="number" className={styles.optQty} value={qty} min="1" disabled={!isChecked} onChange={(e) => handleOptQtyChange(o.id, e.target.value)} onClick={e => e.stopPropagation()} style={{ width: '50px' }} />
                                                            )}
                                                            <div className={styles.optPrice} style={{ marginLeft: 'auto', paddingRight: '8px' }}>+{FMT(o.sell)} ฿</div>
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
                                        {/* Internal Bookings / Admin View split */}
                                        {isAdmin ? (
                                            <>
                                                <div className={styles.rr}>
                                                    <div><div className={styles.rrName}>Пакет катера нетто</div><div className={styles.rrMeta}>Базовая стоимость лодки</div></div>
                                                    <div className={styles.rrVal}>{FMT(currentTourObj.net)}</div>
                                                </div>
                                                <div className={styles.rr}>
                                                    <div><div className={styles.rrName}>Опции нетто</div><div className={styles.rrMeta}>Сумма закупочных цен</div></div>
                                                    <div className={styles.rrVal}>{FMT(netTot - currentTourObj.net)}</div>
                                                </div>
                                                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.2)', margin: '10px 0' }}></div>
                                                <div className={styles.rr}><div>Общая Себестоимость</div><div className={styles.rrVal}>{FMT(netTot)}</div></div>
                                                <div className={styles.rr} style={{ color: 'var(--ok)', fontWeight: 800 }}><div>Базовая маржа</div><div className={styles.rrVal}>+{FMT(sellTot - netTot)}</div></div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={styles.rr}>
                                                    <div><div className={styles.rrName}>🚤 Аренда катера</div><div className={styles.rrMeta}>базовая стоимость</div></div>
                                                    <div className={styles.rrVal}>{FMT(currentTourObj.sell)}</div>
                                                </div>
                                                <div className={styles.rr}>
                                                    <div><div className={styles.rrName}>🎯 Выбранные опции</div><div className={styles.rrMeta}>дополнительные услуги</div></div>
                                                    <div className={styles.rrVal}>+{FMT(sellTot - currentTourObj.sell)}</div>
                                                </div>
                                            </>
                                        )}

                                        <div className={`${styles.rr} ${styles.rrTot}`}>
                                            <div>К ОПЛАТЕ:</div>
                                            <div>{FMT(sellTot)}</div>
                                        </div>

                                        <div style={{ marginTop: '24px', background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '8px' }}>Выбранные позиции</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ fontWeight: 600 }}>🚤 {currentTourObj.name}</div>
                                                <div style={{ fontWeight: 700 }}>{FMT(currentTourObj.sell)}</div>
                                            </div>
                                            {selOptsList.map(o => (
                                                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '8px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{o.icon || '•'} {o.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>{o.meta.split(' × ')[0].trim()}</div>
                                                    </div>
                                                    <div style={{ fontWeight: 700 }}>{FMT(o.val)}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
                                            <button className={`${styles.btn} ${styles.btnGh}`} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }} onClick={handlePrint}>🖨️ Печать PDF</button>
                                            <button className={`${styles.btn} ${styles.btnAcc}`} onClick={handlePublish}>📱 Текст / Мессенджер</button>
                                            <button className={`${styles.btn} ${styles.btnOk}`} onClick={handleLink}>🔗 Создать ссылку</button>
                                            <button className={`${styles.btn}`} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontWeight: 600 }} onClick={() => setSTour(null)}>🔄 Сбросить форму</button>
                                        </div>

                                        <div style={{ marginTop: '32px', borderTop: '1px dashed rgba(255,255,255,0.3)', paddingTop: '20px' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--warn)', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>🔒 Внутренний расчёт</div>
                                            {isAdmin ? (
                                                <>
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
                                                        <div>Профит компании: <span style={{ color: profit >= 0 ? '#10b981' : '#ef4444', fontSize: '1rem' }}>{FMT(profit)}</span></div>
                                                        <div>{margin.toFixed(1)}% маржа</div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {calcRowsM.map((r) => (
                                                        <div key={r.key} className={styles.rr} style={{ padding: '6px 0' }}>
                                                            <div><div className={styles.rrName}>{r.name}</div><div className={styles.rrMeta}>{r.meta}</div></div>
                                                            <div className={styles.rrVal}>{FMT(r.val)}</div>
                                                        </div>
                                                    ))}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                                        <div>К оплате в кассу:</div><div style={{ fontWeight: 700, color: 'var(--warn)' }}>{FMT(mgrTot)}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                        <div>Ваш профит: <span style={{ color: '#10b981', fontSize: '1rem' }}>{FMT(sellTot - mgrTot)}</span></div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
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
                                <div className={styles.cardTitle} style={{ borderBottom: 'none', marginBottom: 0, flex: 1 }}><span>🚤</span> Управление маршрутами ({db.tours.length} шт.)</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className={`${styles.btn} ${styles.btnErr}`} onClick={resetDB}>Сброс БД</button>
                                    <button className={`${styles.btn} ${styles.btnPri}`} onClick={addTour}>Добавить чартер</button>
                                </div>
                            </div>
                            <div className={styles.tblWrapper}>
                                <table className={styles.tbl} style={{ width: '100%', borderCollapse: 'collapse', userSelect: 'auto' }}>
                                    <thead><tr><th style={{ width: '24px' }}></th><th>Маршрут</th><th>Нетто ฿</th><th>Продажа ฿</th><th style={{ width: "120px" }}>Действия</th></tr></thead>
                                    <tbody>
                                        {db.tours.map((t, idx) => (
                                            <tr key={t.id}
                                                style={{ background: t.color || '', cursor: dragMode === t.id ? 'move' : 'default' }}
                                                draggable={dragMode === t.id}
                                                onDragStart={(e) => {
                                                    setDragTIdx(idx);
                                                    if (e.dataTransfer) e.dataTransfer.setData('text/plain', '');
                                                }}
                                                onDragOver={e => e.preventDefault()}
                                                onDrop={e => {
                                                    e.preventDefault();
                                                    if (dragTIdx === null || dragTIdx === idx) return;
                                                    const newTours = [...db.tours];
                                                    const [moved] = newTours.splice(dragTIdx, 1);
                                                    newTours.splice(idx, 0, moved);
                                                    saveDB({ ...db, tours: newTours });
                                                    setDragTIdx(null);
                                                }}
                                            >
                                                <td><div onMouseEnter={() => setDragMode(t.id)} onMouseLeave={() => setDragMode(null)} style={{ cursor: 'grab', opacity: 0.5, padding: '5px' }}>⋮⋮</div></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <input type="text" value={t.icon} onChange={e => updTour(t.id, 'icon', e.target.value)} style={{ width: '50px', textAlign: 'center' }} maxLength="4" />
                                                        <input type="text" value={t.name} onChange={e => updTour(t.id, 'name', e.target.value)} />
                                                    </div>
                                                </td>
                                                <td><input type="number" value={t.net === 0 ? '' : t.net} placeholder="0" onChange={e => updTour(t.id, 'net', e.target.value)} /></td>
                                                <td><input type="number" value={t.sell === 0 ? '' : t.sell} placeholder="0" onChange={e => updTour(t.id, 'sell', e.target.value)} style={{ color: 'var(--ok)', fontWeight: 700 }} /></td>
                                                <td><button className={`${styles.btn} ${styles.btnErr} ${styles.btnSm}`} onClick={() => delTour(t.id)}>Удалить</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className={styles.card} style={{ borderColor: 'var(--warn)', marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                                <div className={styles.cardTitle} style={{ marginBottom: 0, borderBottom: 'none' }}>
                                    <span>⚙️</span> Настройка доплат по маршруту
                                </div>
                                <button
                                    onClick={() => setAdminSelTour('ALL')}
                                    style={{
                                        background: adminSelTour === 'ALL' ? '#fde047' : '#fff',
                                        color: adminSelTour === 'ALL' ? '#b45309' : '#0f4c75',
                                        border: adminSelTour === 'ALL' ? '1px solid #facc15' : '1px solid #cbd5e1',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        boxShadow: adminSelTour === 'ALL' ? '0 4px 6px rgba(250, 204, 21, 0.2)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    🌟 ОБЩИЕ ОПЦИИ (ДЛЯ ВСЕХ ТУРОВ)
                                </button>
                            </div>

                            <div className={styles.fg} style={{ maxWidth: '400px', marginBottom: '24px' }}>
                                <label>Выберите маршрут:</label>
                                <select value={adminSelTour} onChange={e => setAdminSelTour(e.target.value)}>
                                    <option value="" disabled>--- Выберите маршрут ---</option>
                                    {db.tours.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--pri)', flex: 1 }}>Список доплат</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {Object.keys(unsavedItems).length > 0 && (
                                        <>
                                            <button className={`${styles.btn} ${styles.btnPri}`} onClick={saveAllEdits} style={{ padding: '8px 16px', background: '#10b981', borderColor: '#059669', animation: 'pulse 2s infinite' }}>💾 Сохранить цены</button>
                                            <button className={`${styles.btn} ${styles.btnGh}`} onClick={discardAllEdits} style={{ padding: '8px 16px' }}>Отменить</button>
                                        </>
                                    )}
                                    <button className={`${styles.btn} ${styles.btnAcc}`} onClick={openAddItem}>Добавить доплату</button>
                                </div>
                            </div>

                            <div className={styles.optList} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {db.items.filter(i => i.tId === adminSelTour).length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>Нет доплат</div>
                                ) : (
                                    db.items.filter(i => i.tId === adminSelTour).map(i => {
                                        const currentNet = unsavedItems[i.id]?.net ?? i.net;
                                        const currentSell = unsavedItems[i.id]?.sell ?? i.sell;
                                        const currentMgr = unsavedItems[i.id]?.mgr ?? i.mgr;
                                        const isEdited = !!unsavedItems[i.id];

                                        return (
                                            <div key={i.id} style={{ cursor: dragMode === i.id ? 'move' : 'default', padding: '12px 16px', background: isEdited ? '#fefce8' : '#fff', border: isEdited ? '1px solid #fde047' : '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', gap: '16px', transition: 'all 0.2s' }}
                                                draggable={dragMode === i.id}
                                                onDragStart={(e) => {
                                                    const globalIdx = db.items.findIndex(x => x.id === i.id);
                                                    setDragIIdx(globalIdx);
                                                    if (e.dataTransfer) e.dataTransfer.setData('text/plain', '');
                                                }}
                                                onDragOver={e => e.preventDefault()}
                                                onDrop={e => {
                                                    e.preventDefault();
                                                    const targetGlobalIdx = db.items.findIndex(x => x.id === i.id);
                                                    if (dragIIdx === null || dragIIdx === targetGlobalIdx) return;
                                                    const newItems = [...db.items];
                                                    const [moved] = newItems.splice(dragIIdx, 1);
                                                    newItems.splice(targetGlobalIdx, 0, moved);
                                                    saveDB({ ...db, items: newItems });
                                                    setDragIIdx(null);
                                                }}
                                            >
                                                <div onMouseEnter={() => setDragMode(i.id)} onMouseLeave={() => setDragMode(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', cursor: 'grab', opacity: 0.4, padding: '5px' }}>⋮⋮</div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                    <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: '#d4af37', flexShrink: 0 }} disabled={true} />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>{i.icon}</span>
                                                        <span style={{ lineHeight: 1.2, fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{i.name}</span>
                                                        <span className={styles.optBadge}>{i.type === 'per_pax' ? 'Чел' : 'Шт'}</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
                                                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '2px' }}>Нетто ฿</div>
                                                        <input type="number" className={styles.optQty} style={{ width: '80px', borderColor: '#fca5a5', background: '#fef2f2', color: '#dc2626', textAlign: 'right', fontWeight: 700 }} value={currentNet === 0 ? '' : currentNet} placeholder="0" onChange={(e) => updItemInline(i.id, 'net', e.target.value)} title="Закупочная цена (Нетто)" />
                                                    </div>
                                                    <div style={{ fontSize: '1.2rem', color: '#cbd5e1', padding: '0 4px', paddingTop: '14px' }}>/</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '80px' }}>
                                                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '2px' }}>Продажа ฿</div>
                                                        <input type="number" className={styles.optQty} style={{ width: '80px', borderColor: '#6ee7b7', background: '#ecfdf5', color: '#059669', textAlign: 'left', fontWeight: 800 }} value={currentSell === 0 ? '' : currentSell} placeholder="0" onChange={(e) => {
                                                            updItemInline(i.id, 'sell', e.target.value);
                                                        }} title="Розничная цена для клиента" />
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid #e2e8f0' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer', color: currentMgr ? '#0f4c75' : '#94a3b8', fontWeight: 600 }}>
                                                        <input type="checkbox" checked={currentMgr} onChange={e => updItemInline(i.id, 'mgr', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0f4c75' }} />
                                                        Видно Менеджеру
                                                    </label>
                                                    <div style={{ display: 'flex', gap: '4px', marginLeft: '10px' }}>
                                                        <button className={`${styles.btn} ${styles.btnGh} ${styles.btnSm}`} onClick={() => { setEditItem({ ...i }); setShowItemModal(true); }} style={{ padding: '6px' }}>✏️</button>
                                                        <button className={`${styles.btn} ${styles.btnErr} ${styles.btnSm}`} onClick={() => delItem(i.id)} style={{ padding: '6px' }}>🗑</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* --- LINK MODAL --- */}
            {modal === 'link' && <LinkModal url={shareUrl} onClose={() => setModal(null)} onToast={(msg) => alert(msg)} />}
            {modal === 'text' && <TextModal data={getClientData()} onClose={() => setModal(null)} onToast={m => alert(m)} />}

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
                                        <option value="fixed">🔒 Штучно (вводится вручную)</option>
                                        <option value="per_pax">👤 На человека (авт. множитель)</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div className={styles.fg} style={{ flex: 1 }}><label>Нетто / ฿</label><input type="number" value={editItem.net} onChange={e => setEditItem({ ...editItem, net: e.target.value })} /></div>
                                <div className={styles.fg} style={{ flex: 1 }}><label>Менеджер / ฿</label><input type="number" value={editItem.mgrPrice || editItem.sell} onChange={e => setEditItem({ ...editItem, mgrPrice: e.target.value })} /></div>
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
