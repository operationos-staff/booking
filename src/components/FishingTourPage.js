'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Portal.module.css';
import { todayISO, doPrintLand, clipCopy, fmtDate } from '@/lib/utils';
import { saveCalculation, loadFishingFromDB, saveFishingToDB } from '@/lib/db';
import { LinkModal, TextModal } from './Modals';

// =============================================================
// СУХОПУТНЫЕ ЭКСКУРСИИ — DEFAULT DB
// 13 авторских программ с tisland.link (без "Мой Пхукет+ПхНг" 5/8 —
// они уже есть в обычном CalculatorPage как DEF_PACKAGES)
// =============================================================

const UID = () => Math.random().toString(36).substr(2, 9);
const FMT = (n) => new Intl.NumberFormat('ru-RU').format(n || 0) + ' ฿';

// Группы маршрутов (аналог bType в чартере)
const DEFAULT_GROUPS = [
    { key: 'Полдня',          label: '🌅 Полдня',          icon: '🌅', color: '#fbbf24', bgColor: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.30)' },
    { key: '1 день',          label: '🎣 1 день',          icon: '🎣', color: '#22d3ee', bgColor: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.30)' },
    { key: '2 дня / 1 ночь',  label: '🌙 2 дня / 1 ночь', icon: '🌙', color: '#60a5fa', bgColor: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.30)' },
    { key: '3 дня и больше',  label: '🗓️ 3 дня и больше', icon: '🗓️', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.30)' },
];

const EXTRA_COLORS = [
    { color: '#fda4af', bgColor: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.30)' },
    { color: '#86efac', bgColor: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)' },
    { color: '#fcd34d', bgColor: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
    { color: '#a5f3fc', bgColor: 'rgba(6,182,212,0.10)', border: 'rgba(6,182,212,0.30)' },
];

// Категории доплат
const ITEM_CATS = [
    { key: 'transfer', label: '🚐 Трансфер', icon: '🚐' },
    { key: 'meal',     label: '🍜 Питание',  icon: '🍜' },
    { key: 'guide',    label: '🗣 Гид',      icon: '🗣' },
    { key: 'hotel',    label: '🏨 Отель',    icon: '🏨' },
    { key: 'location', label: '📍 Локация',  icon: '📍' },
    { key: 'extra',    label: '➕ Прочее',   icon: '➕' },
];

const DEFAULT_DB = {
    routes: [
        {
            id: 'r1947', icon: '🎣', name: 'Озерная рыбалка на Пхукете с гарантированным',
            group: 'Полдня', days: 0.5,
            pricingMode: 'per_pax',
            baseSell: 0, extraPaxSell: 0, inclusivePax: 0,
            extraAdult: 2900, extraChild: 2900, extraInfant: 0,
            baseNet: 0, extraPaxNet: 0,
            extraAdultNet: 0, extraChildNet: 0, extraInfantNet: 0,
            mgrBase: 0, mgrExtraPax: 0,
            mgrExtraAdult: 2900, mgrExtraChild: 2900, mgrExtraInfant: 0,
            duration: 'полдня, 09:30-13:30/13:30-18:00', groupSize: '',
            transport: '', guide: 'Русскоговорящий', meals: 'в кафе по меню',
            description: 'уловом полдня Озерная рыбалка для профессионалов и любителей. Улов гарантирован! Программа на полдня и на целый день.',
            program: ['Озерная рыбалка для профессионалов и любителей.', 'Возможные трофеи: гигантская арапайма, меконгский сом,', 'сиамский карп,', 'аллигаторова щука, краснохвостый сом и другие виды.', 'Программы на полдня и на целый день.', 'Включено в стоимость: 2 удочки, 1 сачок и наживка.', 'Места для рыбаков оборудованы вдоль берега озера', '(пирсы-беседки).', 'Для сопровождающих есть уютное кафе на территории', 'парка (обед оплачивается', 'отдельно).'],
            included: ['2 удочки, 1 сачок и наживка', 'Медицинская страховка'],
            color: '#0ea5e9', excursId: 1947, provider: 'Остров Сокровищ',
        },
        {
            id: 'r2373', icon: '🎣', name: 'Озерная трофейная рыбалка',
            group: '1 день', days: 1,
            pricingMode: 'per_pax',
            baseSell: 0, extraPaxSell: 0, inclusivePax: 0,
            extraAdult: 2000, extraChild: 2000, extraInfant: 0,
            baseNet: 0, extraPaxNet: 0,
            extraAdultNet: 0, extraChildNet: 0, extraInfantNet: 0,
            mgrBase: 0, mgrExtraPax: 0,
            mgrExtraAdult: 2000, mgrExtraChild: 2000, mgrExtraInfant: 0,
            duration: '2 часа', groupSize: '',
            transport: '', guide: 'Русскоговорящий', meals: 'не включено',
            description: '2 часа Хотите поймать рыбу мечты? Здесь каждый сможет испытать азарт спортивной рыбалки и насладиться красотой природы в уникальном рыболовном парке.',
            program: ['Рыбалка на озере с редкими трофейными видами.', 'Спокойная атмосфера и живописные виды для полного', 'отдыха.', 'Возможность выбрать удобный формат программы:', '2 часа - экспресс-вариант для первых впечатлений.', '4 часа - оптимальное время для комфортной рыбалки.', '8 часов - целый день в стиле «big fishing».', 'Программа идеально подойдёт как для опытных', 'рыболовов, так и для новичков.', 'Сотрудники парка помогут с оборудованием и поделятся', 'секретами успешной ловли.'],
            included: ['2 спиннинга и прикормка для рыб', 'Медицинская страховка'],
            color: '#0ea5e9', excursId: 2373, provider: 'Остров Сокровищ',
        },
        {
            id: 'r2529', icon: '🎣', name: 'Морская рыбалка на рассвете - на катамаране',
            group: '1 день', days: 1,
            pricingMode: 'per_pax',
            baseSell: 0, extraPaxSell: 0, inclusivePax: 0,
            extraAdult: 3000, extraChild: 3000, extraInfant: 0,
            baseNet: 0, extraPaxNet: 0,
            extraAdultNet: 0, extraChildNet: 0, extraInfantNet: 0,
            mgrBase: 0, mgrExtraPax: 0,
            mgrExtraAdult: 3000, mgrExtraChild: 3000, mgrExtraInfant: 0,
            duration: '1 день, ~05:30-16:00', groupSize: '15 рыбаков, 5 сопровождающих',
            transport: 'катамаран', guide: 'Русскоговорящий', meals: 'завтрак, обед',
            description: 'Рыбак Рыболовный морской тур на катамаране: троллинг в пути, глубоководная донка на якоре, проверка крабовых ловушек и зрелищный мастер-класс по подводной охоте. Остановка у острова Рача Яй для снорклинга и обед из свежего улова прямо на борту.',
            program: ['Морская рыбалка на рассвете (Comfort+) - выход в море', 'раньше всех. Пока другие', 'ещё спят, вы уже на лучших рыболовных точках.', 'Для ценителей эксклюзива: крабовые ловушки и', 'подводная охота.', 'Программа:', '05:30–05:45 Сбор гостей по отелям.', '06:45 Прибытие на пирс, знакомство с гидом.', '07:15 Выход в море.', 'Троллинг и глубоководная рыбалка.', 'Проверка крабовых ловушек.', 'Подводная охота.'],
            included: ['Трансфер из основных районов Пхукета', 'Русскоговорящий гид', 'Питание по программе', 'Удочки для троллинга и донной рыбалки', 'Wi-Fi на борту', 'Дождевики при непогоде', 'Полотенце', 'Универсальные маски для снорклинга для взрослых'],
            color: '#0ea5e9', excursId: 2529, provider: 'Остров Сокровищ',
        },
        {
            id: 'r2364', icon: '🎣', name: 'Морская рыбалка на рассвете - крабовые',
            group: '1 день', days: 1,
            pricingMode: 'per_pax',
            baseSell: 0, extraPaxSell: 0, inclusivePax: 0,
            extraAdult: 3000, extraChild: 3000, extraInfant: 0,
            baseNet: 0, extraPaxNet: 0,
            extraAdultNet: 0, extraChildNet: 0, extraInfantNet: 0,
            mgrBase: 0, mgrExtraPax: 0,
            mgrExtraAdult: 3000, mgrExtraChild: 3000, mgrExtraInfant: 0,
            duration: '1 день, ~05:30-16:00', groupSize: '11 человек',
            transport: 'рыбацкая лодка', guide: 'Русскоговорящий', meals: 'завтрак, обед',
            description: 'ловушки и подводная охота Рыбак Троллинг в пути и глубоководная донка на якоре, уникальная проверка крабовых ловушек и зрелищный мастер-класс по подводной охоте. Остановка у острова Рача Яй, снорклинг. Обед из свежего улова на борту.',
            program: ['Морская рыбалка на рассвете (Comfort+) - выход в море', 'раньше всех. Пока другие', 'ещё спят, вы уже на лучших рыболовных точках.', 'Для ценителей эксклюзива: крабовые ловушки и', 'подводная охота.', 'Программа:', '05:30–05:45 Сбор гостей по отелям.', '06:45 Прибытие на пирс, знакомство с гидом.', '07:15 Выход в море.', 'Троллинг и глубоководная рыбалка.', 'Проверка крабовых ловушек.', 'Подводная охота.'],
            included: ['Трансфер из основных районов Пхукета', 'Русскоговорящий гид', 'Питание по программе', 'Удочки для троллинга и донной рыбалки', 'Wi-Fi на борту', 'Дождевики при непогоде', 'Полотенце', 'Универсальные маски для снорклинга для взрослых'],
            color: '#0ea5e9', excursId: 2364, provider: 'Остров Сокровищ',
        },
        {
            id: 'r722', icon: '⛵', name: 'Рыбалка на Пхукете - Национальная тайская',
            group: 'Полдня', days: 0.5,
            pricingMode: 'per_pax',
            baseSell: 0, extraPaxSell: 0, inclusivePax: 0,
            extraAdult: 3500, extraChild: 3500, extraInfant: 0,
            baseNet: 0, extraPaxNet: 0,
            extraAdultNet: 0, extraChildNet: 0, extraInfantNet: 0,
            mgrBase: 0, mgrExtraPax: 0,
            mgrExtraAdult: 3500, mgrExtraChild: 3500, mgrExtraInfant: 0,
            duration: 'полдня, ~12:30-21:00', groupSize: '3-5 рыбаков в одной лодке, может быть несколько',
            transport: 'традиционная тайская лодка "лонгтейл"', guide: 'Русскоговорящий', meals: 'ужин из улова в кафе на берегу',
            description: 'рыбалка Рыбалка проходит на традиционной деревянной тайской лодке. Улов гарантируем! Рыбалка на леску или спиннинг. Встреча заката в море и ужин из улова в ресторане на берегу моря.',
            program: ['Эта экскурсия предлагает уникальный опыт традиционной', 'тайской рыбалки с', 'гарантированным уловом, в сопровождении морских цыган', 'островов Андаманского моря.', 'Морские цыгане - это опытные рыбаки, ведущие', 'обособленный образ жизни, и именно', 'они поставляют большинство морепродуктов на местные', 'рынки и в рестораны. Эти', 'знатоки рыболовных мест с удовольствием помогут вам с', 'ловлей.', 'Группа туристов небольшая, что гарантирует', 'индивидуальный подход.'],
            included: ['Трансфер со всех районов Пхукета', 'Русскоговорящий гид', 'Вода на лодке', 'Питание по программе', 'Медицинская страховка'],
            color: '#0ea5e9', excursId: 722, provider: 'Остров Сокровищ',
        }
    ],
    items: [
        // ─── Базовые типовые доплаты ────────────────────
        { id: 'i_kao_lak', tId: 'ALL', cat: 'transfer', icon: '🚐', name: 'Индивидуальный трансфер из Као Лак', type: 'fixed', mgr: true,
          mgrPrice: 4000, sell: 4000, net: 0, note: 'за машину туда-обратно' },
        { id: 'i_rod_rent', tId: 'ALL', cat: 'extra', icon: '🎣', name: 'Аренда снастей (доп. удочка)', type: 'fixed', mgr: true,
          mgrPrice: 500, sell: 500, net: 0, note: 'опционально' },
    ],
};

// Динамические группы маршрутов
function buildGroups(routes) {
    const knownKeys = new Set(DEFAULT_GROUPS.map(g => g.key));
    const dynamic = [...DEFAULT_GROUPS];
    let extraIdx = 0;
    routes.forEach(r => {
        const g = r.group;
        if (g && !knownKeys.has(g)) {
            knownKeys.add(g);
            const ec = EXTRA_COLORS[extraIdx % EXTRA_COLORS.length];
            extraIdx++;
            dynamic.push({ key: g, label: `🎣 ${g}`, icon: '🎣', ...ec });
        }
    });
    return dynamic;
}

export default function FishingTourPage({ role, toast: externalToast, user, brandSettings, onPage }) {
    const isAdmin = role === 'booking';
    const showToast = externalToast || ((msg) => alert(msg));

    const [db, setDb] = useState(DEFAULT_DB);
    const [activeTab, setActiveTab] = useState('calc');
    const [searchQuery, setSearchQuery] = useState('');
    const [dbLoaded, setDbLoaded] = useState(false);
    const [savingDb, setSavingDb] = useState(false);

    // Calc state
    const [sRoute, setSRoute] = useState(null);
    const [pax, setPax] = useState({ adults: 2, children: 0, infants: 0 });
    const [client, setClient] = useState({ name: '', date: todayISO(), phone: '', note: '' });
    const [modal, setModal] = useState(null);
    const [shareUrl, setShareUrl] = useState('');
    const [mgrSelections, setMgrSelections] = useState({});

    // Admin state
    const [showItemModal, setShowItemModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [editRoute, setEditRoute] = useState(null);
    const [adminFilterRoute, setAdminFilterRoute] = useState('');
    const [openGroups, setOpenGroups] = useState({});
    const [collapseAll, setCollapseAll] = useState(true);
    const [showAddGroup, setShowAddGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [unsavedRoutes, setUnsavedRoutes] = useState({});
    const [unsavedItems, setUnsavedItems] = useState({});

    const GROUPS = React.useMemo(() => buildGroups(db.routes), [db.routes]);

    // ─── Загрузка ─────────────────────────────────────────────
    useEffect(() => {
        const loadData = async () => {
            try {
                const dbData = await loadFishingFromDB();
                if (dbData && dbData.routes && dbData.routes.length > 0) {
                    setDb(dbData);
                    localStorage.setItem('fishing_db', JSON.stringify(dbData));
                    setDbLoaded(true);
                    return;
                }
            } catch (e) {
                console.warn('Fishing: Supabase load failed:', e.message);
            }
            const saved = localStorage.getItem('fishing_db');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.routes && parsed.routes.length > 0) {
                        setDb(parsed);
                        setDbLoaded(true);
                        return;
                    }
                } catch { }
            }
            setDb(DEFAULT_DB); localStorage.setItem('fishing_db', JSON.stringify(DEFAULT_DB));
            setDbLoaded(true);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (!isAdmin && activeTab === 'admin') setActiveTab('calc');
    }, [isAdmin, activeTab]);

    const saveDB = useCallback(async (newDb) => {
        setDb(newDb);
        localStorage.setItem('fishing_db', JSON.stringify(newDb));
        if (isAdmin) {
            try {
                await saveFishingToDB(newDb);
            } catch (e) {
                console.warn('Fishing: Supabase save failed:', e.message);
            }
        }
    }, [isAdmin]);

    const saveFishingToCloud = async () => {
        setSavingDb(true);
        try {
            const ok = await saveFishingToDB(db);
            if (ok) showToast('Рыбалка сохранены в базу!', 'ok');
            else showToast('Ошибка сохранения', 'err');
        } catch (e) {
            showToast('Ошибка: ' + e.message, 'err');
        } finally {
            setSavingDb(false);
        }
    };

    const resetDB = async () => {
        if (!confirm('Сбросить все изменения и вернуть к заводским настройкам?')) return;
        setDb(DEFAULT_DB); localStorage.setItem('fishing_db', JSON.stringify(DEFAULT_DB));
        localStorage.setItem('fishing_db', JSON.stringify(DEFAULT_DB));
        if (isAdmin) await saveFishingToDB(DEFAULT_DB);
        showToast('База сброшена к заводским настройкам', 'ok');
    };

    // ─── CALC LOGIC ───────────────────────────────────────────
    const handleRouteSelect = (rId) => {
        setSRoute(rId);
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
        const num = Math.max(1, Number(val) || 1);
        setMgrSelections(prev => ({ ...prev, [iId]: num }));
    };

    const currentRoute = db.routes.find(r => r.id === sRoute);
    const currentItems = db.items.filter(i => i.tId === sRoute || i.tId === 'ALL');

    let sellTot = 0, netTot = 0, mgrTot = 0;
    const totalPax = (pax.adults || 0) + (pax.children || 0); // младенцы 0₿
    const selOptsList = [];

    if (currentRoute) {
        // Модель цен: per_pax (за взр/дет/мл) или base_plus_extra (база + доплата за каждого сверх вкл.)
        const mode = currentRoute.pricingMode || 'base_plus_extra';
        const a = pax.adults || 0;
        const c = pax.children || 0;
        const inf = pax.infants || 0;
        let baseSell, baseMgr, baseNet;
        if (mode === 'per_pax') {
            baseSell = (currentRoute.extraAdult || 0) * a + (currentRoute.extraChild || 0) * c + (currentRoute.extraInfant || 0) * inf;
            baseMgr  = (currentRoute.mgrExtraAdult || currentRoute.extraAdult || 0) * a + (currentRoute.mgrExtraChild || currentRoute.extraChild || 0) * c + (currentRoute.mgrExtraInfant || currentRoute.extraInfant || 0) * inf;
            baseNet  = (currentRoute.extraAdultNet || 0) * a + (currentRoute.extraChildNet || 0) * c + (currentRoute.extraInfantNet || 0) * inf;
        } else {
            const incPax = currentRoute.inclusivePax || 0;
            const extraN = Math.max(0, totalPax - incPax);
            baseSell = (currentRoute.baseSell || 0) + extraN * (currentRoute.extraPaxSell || 0);
            baseMgr  = (currentRoute.mgrBase  || currentRoute.baseSell || 0) + extraN * (currentRoute.mgrExtraPax || currentRoute.extraPaxSell || 0);
            baseNet  = (currentRoute.baseNet  || 0) + extraN * (currentRoute.extraPaxNet || 0);
        }
        sellTot += baseSell;
        netTot  += baseNet;
        mgrTot  += baseMgr;

        currentItems.forEach(i => {
            let qty = 0, labelMeta = '';
            if (i.mgr) {
                if (mgrSelections[i.id]) {
                    qty = i.type === 'per_pax' ? totalPax : mgrSelections[i.id];
                    labelMeta = i.type === 'per_pax' ? `${totalPax} гост × ${FMT(i.sell)}` : `${mgrSelections[i.id]} шт × ${FMT(i.sell)}`;
                }
            } else {
                qty = i.type === 'per_pax' ? totalPax : 1;
                labelMeta = i.type === 'per_pax' ? `${totalPax} гост × ${FMT(i.sell)} (авто)` : 'Авто (вкл)';
            }
            if (qty > 0) {
                const cNet = (i.net || 0) * qty;
                const cMgr = (i.mgrPrice || i.sell) * qty;
                const cSell = i.sell * qty;
                sellTot += cSell;
                netTot += cNet;
                mgrTot += cMgr;
                selOptsList.push({ ...i, meta: labelMeta, val: cSell, qty });
            }
        });
    }

    const profit = sellTot - netTot;
    const margin = sellTot > 0 ? (profit / sellTot) * 100 : 0;
    const marginVisualPct = Math.max(0, Math.min(100, margin * 2));

    // ─── Действия ─────────────────────────────────────────────
    const getClientData = () => {
        if (!currentRoute) return null;
        const paxStr = `${pax.adults} взр.${pax.children ? ' + ' + pax.children + ' дет.' : ''}${pax.infants ? ' + ' + pax.infants + ' млд.' : ''}`;
        return {
            ...client,
            pax: paxStr,
            tourName: `${currentRoute.icon} ${currentRoute.name}`,
            meta: {
                duration: currentRoute.duration,
                days: currentRoute.group,
                transport: currentRoute.transport,
                guide: currentRoute.guide,
                meals: currentRoute.meals,
                groupSize: currentRoute.groupSize,
            },
            program: currentRoute.program || [],
            included: currentRoute.included || [],
            items: selOptsList.map(o => ({ icon: o.icon, name: o.name, meta: o.meta })),
            total: sellTot,
            gen: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }),
            _savedAt: new Date().toISOString(),
            _brand: brandSettings || null,
            _kind: 'fishing',
            printTitle: 'Смета рыбалки',
            routeBadge: '🎣 Маршрут',
        };
    };

    const handlePublish = () => { if (!sRoute) return; setModal('text'); };

    const handlePrint = () => {
        if (!sRoute) return;
        doPrintLand(getClientData());
    };

    const handleLink = async () => {
        if (!sRoute) return;
        const d = getClientData();
        if (!d) { showToast('Выберите маршрут', 'err'); return; }
        let url;
        if (user) {
            const calcId = await saveCalculation(user.id, d.name || '', d.date || null, d);
            if (calcId) url = `${location.origin}${location.pathname}?tour=${calcId}`;
        }
        if (!url) url = `${location.origin}${location.pathname}?tour=${btoa(encodeURIComponent(JSON.stringify(d)))}`;
        setShareUrl(url);
        setModal('link');
        clipCopy(url).then(() => showToast('Ссылка скопирована!', 'ok'));

        if (brandSettings?.tg_chat_id && d) {
            const msg = `🎣 <b>Новая рыбалка</b>\n🎣 ${d.name || 'Клиент не указан'}\n🗺 ${d.tourName}\n👥 ${d.pax}\n📅 ${d.date || '—'}\n💰 ${(d.total || 0).toLocaleString('ru-RU')} ฿\n🔗 <a href="${url}">Открыть расчёт</a>`;
            fetch('/api/notify-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, chatId: brandSettings.tg_chat_id }),
            }).catch(() => {});
        }
    };

    // ─── ADMIN: routes ────────────────────────────────────────
    const openAddRoute = (group) => {
        const g = group || GROUPS[0]?.key || '1 день';
        setEditRoute({
            id: '', icon: '🎣', name: '',
            group: g,
            days: g === 'Полдня' ? 0.5 : (g === '2 дня / 1 ночь' ? 2 : (g === '3 дня и больше' ? 3 : 1)),
            pricingMode: 'per_pax',
            baseSell: 0, extraPaxSell: 0, inclusivePax: 0,
            extraAdult: 0, extraChild: 0, extraInfant: 0,
            baseNet: 0, extraPaxNet: 0,
            extraAdultNet: 0, extraChildNet: 0, extraInfantNet: 0,
            mgrBase: 0, mgrExtraPax: 0,
            mgrExtraAdult: 0, mgrExtraChild: 0, mgrExtraInfant: 0,
            duration: '', groupSize: '', transport: 'Авиаперелёт',
            guide: 'Русскоговорящий', meals: '',
            description: '', program: [], included: [],
            provider: 'Остров Сокровищ', excursId: 0,
            color: GROUPS.find(x => x.key === g)?.color || '#22d3ee',
        });
        setShowRouteModal(true);
    };

    const openEditRoute = (rId) => {
        const r = db.routes.find(x => x.id === rId);
        if (!r) return;
        setEditRoute({ ...r });
        setShowRouteModal(true);
    };

    const saveRouteModal = async () => {
        if (!editRoute.name) { showToast('Укажите название', 'err'); return; }
        const newDb = { ...db, routes: [...db.routes] };
        const obj = {
            ...editRoute,
            id: editRoute.id || 'r' + UID(),
            pricingMode:  editRoute.pricingMode || 'base_plus_extra',
            baseSell:     Number(editRoute.baseSell)     || 0,
            extraPaxSell: Number(editRoute.extraPaxSell) || 0,
            inclusivePax: Number(editRoute.inclusivePax) || 0,
            extraAdult:   Number(editRoute.extraAdult)   || 0,
            extraChild:   Number(editRoute.extraChild)   || 0,
            extraInfant:  Number(editRoute.extraInfant)  || 0,
            baseNet:      Number(editRoute.baseNet)      || 0,
            extraPaxNet:  Number(editRoute.extraPaxNet)  || 0,
            extraAdultNet:  Number(editRoute.extraAdultNet)  || 0,
            extraChildNet:  Number(editRoute.extraChildNet)  || 0,
            extraInfantNet: Number(editRoute.extraInfantNet) || 0,
            mgrBase:      Number(editRoute.mgrBase)      || 0,
            mgrExtraPax:  Number(editRoute.mgrExtraPax)  || 0,
            mgrExtraAdult:  Number(editRoute.mgrExtraAdult)  || 0,
            mgrExtraChild:  Number(editRoute.mgrExtraChild)  || 0,
            mgrExtraInfant: Number(editRoute.mgrExtraInfant) || 0,
            days: Number(editRoute.days) || 1,
            program: Array.isArray(editRoute.program) ? editRoute.program :
                     (editRoute.program || '').split('\n').map(x => x.trim()).filter(Boolean),
            included: Array.isArray(editRoute.included) ? editRoute.included :
                      (editRoute.included || '').split('\n').map(x => x.trim()).filter(Boolean),
        };
        const idx = newDb.routes.findIndex(x => x.id === obj.id);
        if (idx !== -1) newDb.routes[idx] = obj;
        else newDb.routes.push(obj);
        await saveDB(newDb);
        setShowRouteModal(false);
        showToast(idx !== -1 ? 'Маршрут обновлён' : 'Маршрут добавлен', 'ok');
    };

    const delRoute = async (rId) => {
        if (!confirm('Удалить маршрут и все его доплаты?')) return;
        const newDb = {
            ...db,
            routes: db.routes.filter(r => r.id !== rId),
            items: db.items.filter(i => i.tId !== rId),
        };
        await saveDB(newDb);
        if (sRoute === rId) setSRoute(null);
        showToast('Маршрут удалён', 'ok');
    };

    const updRouteInline = (rId, field, value) => {
        setUnsavedRoutes(prev => {
            const cur = prev[rId] || { ...db.routes.find(x => x.id === rId) };
            const numFields = ['baseSell','extraPaxSell','inclusivePax','extraAdult','extraChild','extraInfant','baseNet','extraPaxNet','extraAdultNet','extraChildNet','extraInfantNet','mgrBase','mgrExtraPax','mgrExtraAdult','mgrExtraChild','mgrExtraInfant','days'];
            const v = numFields.includes(field) ? (Number(value) || 0) : value;
            return { ...prev, [rId]: { ...cur, [field]: v } };
        });
    };

    const saveAllEdits = async () => {
        const newDb = { ...db, routes: [...db.routes], items: [...db.items] };
        Object.keys(unsavedRoutes).forEach(rId => {
            const idx = newDb.routes.findIndex(x => x.id === rId);
            if (idx !== -1) newDb.routes[idx] = { ...newDb.routes[idx], ...unsavedRoutes[rId] };
        });
        Object.keys(unsavedItems).forEach(iId => {
            const idx = newDb.items.findIndex(x => x.id === iId);
            if (idx !== -1) newDb.items[idx] = { ...newDb.items[idx], ...unsavedItems[iId] };
        });
        await saveDB(newDb);
        setUnsavedRoutes({});
        setUnsavedItems({});
        showToast('Сохранено', 'ok');
    };

    const discardAllEdits = () => {
        if (!confirm('Отменить все несохранённые изменения?')) return;
        setUnsavedRoutes({});
        setUnsavedItems({});
    };

    // ─── ADMIN: items ─────────────────────────────────────────
    const openAddItem = () => {
        setEditItem({
            id: '', tId: 'ALL', cat: 'extra', icon: '➕',
            name: '', type: 'fixed', mgr: true,
            net: 0, mgrPrice: 0, sell: 0, note: '',
        });
        setShowItemModal(true);
    };

    const openEditItem = (iId) => {
        const i = db.items.find(x => x.id === iId);
        if (!i) return;
        setEditItem({ ...i });
        setShowItemModal(true);
    };

    const saveItemModal = async () => {
        if (!editItem.name) { showToast('Укажите название', 'err'); return; }
        const newDb = { ...db, items: [...db.items] };
        const obj = {
            ...editItem,
            id: editItem.id || 'i' + UID(),
            net: Number(editItem.net) || 0,
            mgrPrice: Number(editItem.mgrPrice) || 0,
            sell: Number(editItem.sell) || 0,
            icon: editItem.icon || ITEM_CATS.find(c => c.key === editItem.cat)?.icon || '➕',
        };
        const idx = newDb.items.findIndex(x => x.id === obj.id);
        if (idx !== -1) newDb.items[idx] = obj;
        else newDb.items.push(obj);
        await saveDB(newDb);
        setShowItemModal(false);
        showToast('Опция сохранена', 'ok');
    };

    const updItemInline = (iId, field, value) => {
        setUnsavedItems(prev => {
            const cur = prev[iId] || { ...db.items.find(x => x.id === iId) };
            const numFields = ['net','mgrPrice','sell'];
            const v = numFields.includes(field) ? (Number(value) || 0) : value;
            return { ...prev, [iId]: { ...cur, [field]: v } };
        });
    };

    const delItem = async (iId) => {
        if (!confirm('Удалить опцию?')) return;
        const newDb = { ...db, items: db.items.filter(i => i.id !== iId) };
        await saveDB(newDb);
        showToast('Опция удалена', 'ok');
    };

    const addGroup = async () => {
        const name = newGroupName.trim();
        if (!name) { showToast('Введите название группы', 'err'); return; }
        if (GROUPS.find(g => g.key.toLowerCase() === name.toLowerCase())) {
            showToast('Такая группа уже есть', 'err'); return;
        }
        // создадим маршрут-заглушку чтобы группа показывалась
        const ec = EXTRA_COLORS[(GROUPS.length - DEFAULT_GROUPS.length) % EXTRA_COLORS.length];
        const newDb = { ...db, routes: [...db.routes] };
        const newId = 'r' + UID();
        newDb.routes.push({
            id: newId, icon: '🎣', name: `${name} - Новый маршрут`,
            group: name, days: 1,
            pricingMode: 'per_pax',
            baseSell: 0, extraPaxSell: 0, inclusivePax: 0,
            extraAdult: 0, extraChild: 0, extraInfant: 0,
            baseNet: 0, extraPaxNet: 0,
            extraAdultNet: 0, extraChildNet: 0, extraInfantNet: 0,
            mgrBase: 0, mgrExtraPax: 0,
            mgrExtraAdult: 0, mgrExtraChild: 0, mgrExtraInfant: 0,
            duration: '', groupSize: '', transport: 'Авиаперелёт', guide: 'Русскоговорящий',
            meals: '', description: '', program: [], included: [],
            color: ec.color, provider: 'Остров Сокровищ',
        });
        await saveDB(newDb);
        setNewGroupName('');
        setShowAddGroup(false);
        showToast(`Группа "${name}" создана`, 'ok');
    };

    const filteredRoutes = db.routes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const isDirty = Object.keys(unsavedRoutes).length > 0 || Object.keys(unsavedItems).length > 0;

    return (
        <div className={styles.theme} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
            {/* Tabs */}
            {isAdmin && (
                <div style={{ padding: '20px 24px 0', borderBottom: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setActiveTab('calc')} style={{
                            padding: '10px 20px', borderRadius: '12px 12px 0 0',
                            border: '1px solid var(--border)', borderBottom: 'none',
                            background: activeTab === 'calc' ? 'var(--card)' : 'transparent',
                            fontWeight: 800, color: activeTab === 'calc' ? 'var(--pri)' : 'var(--txl)',
                            cursor: 'pointer',
                            marginBottom: activeTab === 'calc' ? '-2px' : '0',
                        }}>🧮 Калькулятор</button>
                        <button onClick={() => setActiveTab('admin')} style={{
                            padding: '10px 20px', borderRadius: '12px 12px 0 0',
                            border: '1px solid var(--border)', borderBottom: 'none',
                            background: activeTab === 'admin' ? 'var(--card)' : 'transparent',
                            fontWeight: 800, color: activeTab === 'admin' ? 'var(--pri)' : 'var(--txl)',
                            cursor: 'pointer',
                            marginBottom: activeTab === 'admin' ? '-2px' : '0',
                        }}>⚙️ Настройка</button>
                    </div>
                </div>
            )}

            {/* CALC TAB */}
            {activeTab === 'calc' && (
                <div className={`${styles.container} charter-container-mobile`}>
                    {/* SIDEBAR */}
                    <aside className={`${styles.sidebar} charter-sidebar-mobile`}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitle}><span>🎣</span> Рыбалка</div>
                            <input type="text" className={styles.searchInput}
                                placeholder="Поиск маршрута..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className={`${styles.tourList} charter-tourlist-mobile`}>
                            {filteredRoutes.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--txl)', marginTop: '20px', fontSize: '0.9rem' }}>Не найдено</div>
                            ) : (() => {
                                const groups = {};
                                const groupOrder = [];
                                filteredRoutes.forEach(r => {
                                    const g = r.group || 'Другие';
                                    if (!groups[g]) { groups[g] = []; groupOrder.push(g); }
                                    groups[g].push(r);
                                });
                                const orderedKeys = ['Полдня', '1 день', '2 дня / 1 ночь', '3 дня и больше',
                                    ...groupOrder.filter(g => !['Полдня', '1 день', '2 дня / 1 ночь', '3 дня и больше'].includes(g))];
                                return orderedKeys.filter(g => groups[g]).map(gName => {
                                    const isOpen = openGroups[gName] !== false;
                                    const meta = GROUPS.find(x => x.key === gName);
                                    return (
                                        <div key={gName} style={{ marginBottom: '4px' }}>
                                            <button
                                                onClick={() => setOpenGroups(prev => ({ ...prev, [gName]: !isOpen }))}
                                                style={{
                                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '9px 12px',
                                                    background: isOpen ? 'rgba(245,158,11,0.12)' : 'var(--brd2)',
                                                    border: '1px solid ' + (isOpen ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.1)'),
                                                    borderRadius: '8px', cursor: 'pointer',
                                                    color: isOpen ? '#f59e0b' : '#a3a3a3',
                                                    fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
                                                    letterSpacing: '0.02em', marginBottom: '2px',
                                                }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>{meta?.icon || '🎣'}</span>
                                                    <span>{gName}</span>
                                                    <span style={{
                                                        fontSize: '0.65rem', padding: '1px 6px', borderRadius: '99px',
                                                        background: isOpen ? 'rgba(245,158,11,0.2)' : 'var(--brd2)',
                                                        color: isOpen ? '#f59e0b' : '#737373', fontWeight: 700,
                                                    }}>{groups[gName].length}</span>
                                                </span>
                                                <span style={{
                                                    fontSize: '0.7rem', transition: 'transform 0.2s',
                                                    transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                                    display: 'inline-block', opacity: 0.7,
                                                }}>▼</span>
                                            </button>
                                            {isOpen && (
                                                <div style={{ paddingLeft: '4px', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '4px' }}>
                                                    {groups[gName].map(r => {
                                                        const isSel = sRoute === r.id;
                                                        return (
                                                            <div key={r.id}
                                                                className={`${styles.tourItem} ${isSel ? styles.active : ''}`}
                                                                style={{
                                                                    background: isSel ? 'rgba(245,158,11,0.15)' : 'var(--brd2)',
                                                                    border: '1px solid ' + (isSel ? 'rgba(245,158,11,0.5)' : 'rgba(245,158,11,0.08)'),
                                                                }}
                                                                onClick={() => handleRouteSelect(r.id)}>
                                                                <div className={styles.tourIcon}>{r.icon}</div>
                                                                <div className={styles.tourInfo}>
                                                                    <div className={styles.tourName}>{r.name}</div>
                                                                    <div className={styles.tourPrice}>
                                                                        от <span>{FMT(r.pricingMode === 'per_pax' ? r.extraAdult : r.baseSell)}</span>{r.pricingMode === 'per_pax' ? ' /чел' : ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </aside>

                    {/* MAIN PANEL */}
                    <main className={`${styles.mainPanel} charter-main-mobile`}>
                        {!sRoute ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyStateIco}>🎣</div>
                                <h3>Маршрут не выбран</h3>
                                <p>Выберите маршрут сухопутной экскурсии из списка слева для расчёта.</p>
                            </div>
                        ) : (
                            <div className={styles.mainLayout}>
                                {/* LEFT SIDE */}
                                <div>
                                    {/* Описание маршрута */}
                                    <div className={styles.card}>
                                        <div className={styles.cardTitle}><span>{currentRoute.icon}</span> {currentRoute.name}</div>
                                        {currentRoute.description && (
                                            <div style={{ color: 'var(--txm)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '12px' }}>
                                                {currentRoute.description}
                                            </div>
                                        )}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px', fontSize: '0.82rem', color: 'var(--txm)' }}>
                                            {currentRoute.duration && <div>⏱ <b>Время:</b> {currentRoute.duration}</div>}
                                            {currentRoute.group && <div>📅 <b>Длительность:</b> {currentRoute.group}</div>}
                                            {currentRoute.transport && <div>🚐 <b>Транспорт:</b> {currentRoute.transport}</div>}
                                            {currentRoute.guide && <div>🗣 <b>Гид:</b> {currentRoute.guide}</div>}
                                            {currentRoute.meals && <div style={{ gridColumn: '1/-1' }}>🍽 <b>Питание:</b> {currentRoute.meals}</div>}
                                            {currentRoute.groupSize && <div>👥 <b>Группа:</b> {currentRoute.groupSize}</div>}
                                        </div>
                                        {currentRoute.program?.length > 0 && (
                                            <details style={{ marginTop: '12px' }}>
                                                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: '#f59e0b' }}>📍 Программа</summary>
                                                <ol style={{ margin: '8px 0 0 18px', fontSize: '0.85rem', color: 'var(--txt)', lineHeight: 1.6 }}>
                                                    {currentRoute.program.map((p, i) => <li key={i}>{p}</li>)}
                                                </ol>
                                            </details>
                                        )}
                                        {currentRoute.included?.length > 0 && (
                                            <details style={{ marginTop: '8px' }}>
                                                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: '#10b981' }}>✓ Включено</summary>
                                                <ul style={{ margin: '8px 0 0 18px', fontSize: '0.85rem', color: 'var(--txt)', lineHeight: 1.6 }}>
                                                    {currentRoute.included.map((p, i) => <li key={i}>{p}</li>)}
                                                </ul>
                                            </details>
                                        )}
                                    </div>

                                    {/* Клиент */}
                                    <div className={styles.card}>
                                        <div className={styles.cardTitle}><span>📝</span> Данные клиента</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div className={styles.fg}>
                                                <label>Имя клиента</label>
                                                <input type="text" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} placeholder="Например, Иван" />
                                            </div>
                                            <div className={styles.fg}>
                                                <label>Дата</label>
                                                <input type="date" value={client.date} onChange={e => setClient({ ...client, date: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Гости */}
                                    <div className={styles.card}>
                                        <div className={styles.cardTitle}><span>👥</span> Количество гостей</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                            <div className={styles.fg}>
                                                <label>Взрослые</label>
                                                <input type="number" value={pax.adults} min="0" onChange={(e) => setPax({ ...pax, adults: Number(e.target.value) || 0 })} />
                                            </div>
                                            <div className={styles.fg}>
                                                <label>Дети 4-11</label>
                                                <input type="number" value={pax.children} min="0" onChange={(e) => setPax({ ...pax, children: Number(e.target.value) || 0 })} />
                                            </div>
                                            <div className={styles.fg}>
                                                <label>Младенцы 0-3</label>
                                                <input type="number" value={pax.infants} min="0" onChange={(e) => setPax({ ...pax, infants: Number(e.target.value) || 0 })} />
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--txl)', marginTop: '8px' }}>
                                            Младенцы 0-3 — бесплатно, без места в минивэне
                                        </div>
                                    </div>

                                    {/* Доплаты */}
                                    <div className={styles.card}>
                                        <div className={styles.cardTitle}><span>➕</span> Дополнительные опции</div>
                                        <div className={styles.optList}>
                                            {currentItems.filter(i => i.mgr).length === 0 ? (
                                                <div style={{ color: 'var(--txl)', fontSize: '0.85rem' }}>Дополнительных опций для этого маршрута нет.</div>
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
                                                                    {o.note && <span style={{ fontSize: '0.7rem', color: 'var(--txl)' }}>· {o.note}</span>}
                                                                </div>
                                                            </div>
                                                            {o.type === 'fixed' && (
                                                                <input type="number" className={styles.optQty} value={qty} min="1" disabled={!isChecked} onChange={(e) => handleOptQtyChange(o.id, e.target.value)} onClick={e => e.stopPropagation()} style={{ width: '50px' }} />
                                                            )}
                                                            <div className={styles.optPrice} style={{ marginLeft: 'auto', paddingRight: '8px' }}>+{FMT(o.sell)}</div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT SIDE: Sticky quote */}
                                <div>
                                    <div className={styles.resBox}>
                                        <div className={styles.resHeader}>
                                            <span>🧾 Смета: {currentRoute.name}</span>
                                        </div>
                                        {(() => {
                                            const mode = currentRoute.pricingMode || 'base_plus_extra';
                                            const a = pax.adults || 0;
                                            const c = pax.children || 0;
                                            const inf = pax.infants || 0;
                                            let baseLine, baseSellLine, metaTxt;
                                            if (mode === 'per_pax') {
                                                baseLine = (currentRoute.extraAdultNet || 0) * a + (currentRoute.extraChildNet || 0) * c + (currentRoute.extraInfantNet || 0) * inf;
                                                baseSellLine = (currentRoute.extraAdult || 0) * a + (currentRoute.extraChild || 0) * c + (currentRoute.extraInfant || 0) * inf;
                                                const parts = [];
                                                if (a) parts.push(`${a} взр × ${FMT(currentRoute.extraAdult)}`);
                                                if (c) parts.push(`${c} дет × ${FMT(currentRoute.extraChild)}`);
                                                if (inf && currentRoute.extraInfant) parts.push(`${inf} млд × ${FMT(currentRoute.extraInfant)}`);
                                                metaTxt = parts.join(' + ') || 'нет гостей';
                                            } else {
                                                const incPax = currentRoute.inclusivePax || 0;
                                                const extraN = Math.max(0, totalPax - incPax);
                                                baseLine = (currentRoute.baseNet || 0) + extraN * (currentRoute.extraPaxNet || 0);
                                                baseSellLine = (currentRoute.baseSell || 0) + extraN * (currentRoute.extraPaxSell || 0);
                                                metaTxt = incPax > 0
                                                    ? `${incPax} вкл. ${extraN > 0 ? `+ ${extraN} × ${FMT(currentRoute.extraPaxSell)}` : ''}`
                                                    : (extraN > 0 ? `база + ${extraN} × ${FMT(currentRoute.extraPaxSell)}` : 'базовая цена');
                                            }
                                            return isAdmin ? (
                                                <>
                                                    <div className={styles.rr}>
                                                        <div><div className={styles.rrName}>База нетто</div><div className={styles.rrMeta}>{metaTxt}</div></div>
                                                        <div className={styles.rrVal}>{FMT(baseLine)}</div>
                                                    </div>
                                                    <div className={styles.rr}>
                                                        <div><div className={styles.rrName}>Опции нетто</div><div className={styles.rrMeta}>Сумма закупочных цен</div></div>
                                                        <div className={styles.rrVal}>{FMT(netTot - baseLine)}</div>
                                                    </div>
                                                    <div style={{ borderBottom: '1px dashed var(--brd2)', margin: '10px 0' }}></div>
                                                    <div className={styles.rr}><div>Общая Себестоимость</div><div className={styles.rrVal}>{FMT(netTot)}</div></div>
                                                    <div className={styles.rr} style={{ color: 'var(--ok)', fontWeight: 800 }}><div>Базовая маржа</div><div className={styles.rrVal}>+{FMT(sellTot - netTot)}</div></div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className={styles.rr}>
                                                        <div><div className={styles.rrName}>🎣 Экскурсия</div><div className={styles.rrMeta}>{metaTxt}</div></div>
                                                        <div className={styles.rrVal}>{FMT(baseSellLine)}</div>
                                                    </div>
                                                    {selOptsList.length > 0 && (
                                                        <div className={styles.rr}>
                                                            <div><div className={styles.rrName}>🎯 Выбранные опции</div><div className={styles.rrMeta}>дополнительные услуги</div></div>
                                                            <div className={styles.rrVal}>+{FMT(sellTot - baseSellLine)}</div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}

                                        <div className={`${styles.rr} ${styles.rrTot}`}>
                                            <div>К ОПЛАТЕ:</div>
                                            <div>{FMT(sellTot)}</div>
                                        </div>

                                        <div style={{ marginTop: '24px', background: 'var(--bg3)', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--txm)', textTransform: 'uppercase', marginBottom: '8px' }}>Выбранные позиции</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid var(--brd2)' }}>
                                                <div style={{ fontWeight: 600 }}>{currentRoute.icon} {currentRoute.name}</div>
                                                <div style={{ fontWeight: 700 }}>{FMT((currentRoute.pricingMode === 'per_pax')
                                                    ? ((currentRoute.extraAdult||0)*pax.adults + (currentRoute.extraChild||0)*pax.children + (currentRoute.extraInfant||0)*pax.infants)
                                                    : ((currentRoute.baseSell || 0) + Math.max(0, totalPax - (currentRoute.inclusivePax || 0)) * (currentRoute.extraPaxSell || 0)))}</div>
                                            </div>
                                            {selOptsList.map(o => (
                                                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '8px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{o.icon || '•'} {o.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--txm)' }}>{o.meta}</div>
                                                    </div>
                                                    <div style={{ fontWeight: 700 }}>{FMT(o.val)}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
                                            <button className={`${styles.btn} ${styles.btnGh}`} style={{ color: '#fff', borderColor: 'var(--brd2)', background: 'var(--brd2)' }} onClick={handlePrint}>🖨️ Печать PDF</button>
                                            <button className={`${styles.btn} ${styles.btnAcc}`} onClick={handlePublish}>📱 Текст / Мессенджер</button>
                                            <button className={`${styles.btn} ${styles.btnOk}`} onClick={handleLink}>🔗 Создать ссылку</button>
                                            <button className={`${styles.btn}`} style={{ background: 'transparent', color: 'var(--txm)', marginTop: '8px', fontWeight: 600 }} onClick={() => setSRoute(null)}>🔄 Сбросить</button>
                                        </div>

                                        {isAdmin && (
                                            <div style={{ marginTop: '32px', borderTop: '1px dashed var(--brd2)', paddingTop: '20px' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--warn)', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>🔒 Внутренний расчёт</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0' }}>
                                                    <div>Итого нетто:</div><div style={{ fontWeight: 700 }}>{FMT(netTot)}</div>
                                                </div>
                                                <div style={{ marginTop: '12px', background: 'var(--bg3)', height: '6px', borderRadius: '10px' }}>
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

            {/* ADMIN TAB */}
            {activeTab === 'admin' && isAdmin && (
                <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
                    {/* Action bar */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button onClick={() => openAddRoute()} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>+ Добавить маршрут</button>
                        <button onClick={openAddItem} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>+ Добавить опцию</button>
                        <button onClick={() => setShowAddGroup(true)} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#a855f7', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>+ Группа</button>
                        <div style={{ flex: 1 }} />
                        {isDirty && (
                            <>
                                <button onClick={discardAllEdits} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>✕ Отменить</button>
                                <button onClick={saveAllEdits} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>💾 Сохранить правки</button>
                            </>
                        )}
                        <button onClick={saveFishingToCloud} disabled={savingDb} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', color: '#60a5fa', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>{savingDb ? '⏳ Сохранение...' : '☁️ Сохранить в БД'}</button>
                        <button onClick={resetDB} style={{ padding: '10px 16px', borderRadius: '10px', background: 'var(--bg3)', border: '1px solid var(--brd2)', color: 'var(--txm)', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>↺ Сбросить</button>
                    </div>

                    {showAddGroup && (
                        <div style={{ marginBottom: '20px', padding: '14px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Название группы (напр. 3 дня / 2 ночи)" style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--brd2)', background: 'var(--bg3)', color: 'var(--txt)' }} />
                            <button onClick={addGroup} style={{ padding: '8px 14px', borderRadius: '8px', background: '#a855f7', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Создать</button>
                            <button onClick={() => { setShowAddGroup(false); setNewGroupName(''); }} style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', color: 'var(--txl)', border: '1px solid var(--brd2)', cursor: 'pointer' }}>Отмена</button>
                        </div>
                    )}

                    {/* Routes list grouped */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ color: 'var(--txt)', fontSize: '15px', marginBottom: '12px', fontWeight: 700 }}>🎣 Маршруты ({db.routes.length})</h3>
                        {(() => {
                            const groups = {};
                            db.routes.forEach(r => {
                                const g = r.group || 'Другие';
                                if (!groups[g]) groups[g] = [];
                                groups[g].push(r);
                            });
                            const order = ['Полдня', '1 день', '2 дня / 1 ночь', '3 дня и больше', ...Object.keys(groups).filter(g => !['Полдня', '1 день', '2 дня / 1 ночь', '3 дня и больше'].includes(g))];
                            return order.filter(g => groups[g]).map(gName => {
                                const meta = GROUPS.find(x => x.key === gName);
                                return (
                                    <div key={gName} style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '6px 10px', background: meta?.bgColor || 'var(--brd2)', border: `1px solid ${meta?.border || 'var(--brd2)'}`, borderRadius: '8px' }}>
                                            <span style={{ fontSize: '14px' }}>{meta?.icon || '🎣'}</span>
                                            <b style={{ color: meta?.color || 'var(--txt)', fontSize: '13px' }}>{gName}</b>
                                            <span style={{ fontSize: '11px', color: 'var(--txl)' }}>· {groups[gName].length} маршр.</span>
                                            <div style={{ flex: 1 }} />
                                            <button onClick={() => openAddRoute(gName)} style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--brd2)', border: '1px solid var(--brd2)', color: 'var(--txm)', fontSize: '11px', cursor: 'pointer' }}>+</button>
                                        </div>
                                        <div style={{ overflow: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '900px', tableLayout: 'fixed' }}>
                                                <colgroup>
                                                    <col style={{ width: '50px' }} />
                                                    <col />
                                                    <col style={{ width: '100px' }} />
                                                    <col style={{ width: '100px' }} />
                                                    <col style={{ width: '70px' }} />
                                                    <col style={{ width: '110px' }} />
                                                    <col style={{ width: '110px' }} />
                                                    <col style={{ width: '110px' }} />
                                                    <col style={{ width: '110px' }} />
                                                    <col style={{ width: '80px' }} />
                                                </colgroup>
                                                <thead>
                                                    <tr style={{ background: 'var(--brd2)' }}>
                                                        <th style={{ padding: '8px', textAlign: 'left', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Иконка</th>
                                                        <th style={{ padding: '8px', textAlign: 'left', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Название</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }} title="Базовая нетто (за машину/лодку)">Нетто база</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }} title="Нетто за каждого (сверх включённых)">Нетто +чел</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }} title="Сколько человек уже включено в базу">Вкл.</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Менедж база</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Менедж +чел</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Продажа база</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Продажа +чел</th>
                                                        <th style={{ padding: '8px', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {groups[gName].map(r => {
                                                        const cur = unsavedRoutes[r.id] || r;
                                                        const dirty = !!unsavedRoutes[r.id];
                                                        return (
                                                            <tr key={r.id} style={{ borderTop: '1px solid var(--brd2)', background: dirty ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                                                                <td style={{ padding: '6px 8px', fontSize: '16px' }}>{r.icon}</td>
                                                                <td style={{ padding: '6px 8px' }}>
                                                                    <input type="text" value={cur.name} onChange={e => updRouteInline(r.id, 'name', e.target.value)} style={inlineInput} />
                                                                </td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.baseNet} onChange={e => updRouteInline(r.id, 'baseNet', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.extraPaxNet} onChange={e => updRouteInline(r.id, 'extraPaxNet', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.inclusivePax} onChange={e => updRouteInline(r.id, 'inclusivePax', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.mgrBase} onChange={e => updRouteInline(r.id, 'mgrBase', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.mgrExtraPax} onChange={e => updRouteInline(r.id, 'mgrExtraPax', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.baseSell} onChange={e => updRouteInline(r.id, 'baseSell', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.extraPaxSell} onChange={e => updRouteInline(r.id, 'extraPaxSell', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                                    <button onClick={() => openEditRoute(r.id)} title="Редактировать детали" style={smIcon}>✎</button>
                                                                    <button onClick={() => delRoute(r.id)} title="Удалить" style={{ ...smIcon, color: '#ef4444' }}>🗑</button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {/* Items list */}
                    <div>
                        <h3 style={{ color: 'var(--txt)', fontSize: '15px', marginBottom: '12px', fontWeight: 700 }}>➕ Доплаты и опции ({db.items.length})</h3>
                        <div style={{ marginBottom: '8px' }}>
                            <select value={adminFilterRoute} onChange={e => setAdminFilterRoute(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', background: 'var(--bg3)', color: 'var(--txt)', border: '1px solid var(--brd2)', fontSize: '12px' }}>
                                <option value="">Все опции</option>
                                <option value="ALL">Только общие (ALL)</option>
                                {db.routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div style={{ overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1000px', tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '50px' }} />
                                    <col />
                                    <col style={{ width: '130px' }} />
                                    <col style={{ width: '160px' }} />
                                    <col style={{ width: '90px' }} />
                                    <col style={{ width: '90px' }} />
                                    <col style={{ width: '90px' }} />
                                    <col style={{ width: '90px' }} />
                                    <col style={{ width: '80px' }} />
                                    <col style={{ width: '80px' }} />
                                </colgroup>
                                <thead>
                                    <tr style={{ background: 'var(--brd2)' }}>
                                        <th style={{ padding: '8px', textAlign: 'left', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Иконка</th>
                                        <th style={{ padding: '8px', textAlign: 'left', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Название</th>
                                        <th style={{ padding: '8px', textAlign: 'left', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Категория</th>
                                        <th style={{ padding: '8px', textAlign: 'left', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Маршрут</th>
                                        <th style={{ padding: '8px', textAlign: 'left', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Тип</th>
                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Нетто</th>
                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Менедж</th>
                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Продажа</th>
                                        <th style={{ padding: '8px', textAlign: 'center', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Видна Mgr</th>
                                        <th style={{ padding: '8px', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {db.items.filter(i => !adminFilterRoute || i.tId === adminFilterRoute).map(i => {
                                        const cur = unsavedItems[i.id] || i;
                                        const dirty = !!unsavedItems[i.id];
                                        const tName = i.tId === 'ALL' ? 'Общая' : (db.routes.find(r => r.id === i.tId)?.name || '?');
                                        return (
                                            <tr key={i.id} style={{ borderTop: '1px solid var(--brd2)', background: dirty ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                                                <td style={{ padding: '6px 8px', fontSize: '16px' }}>{i.icon}</td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <input type="text" value={cur.name} onChange={e => updItemInline(i.id, 'name', e.target.value)} style={inlineInput} />
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <select value={cur.cat} onChange={e => updItemInline(i.id, 'cat', e.target.value)} style={inlineInput}>
                                                        {ITEM_CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                                    </select>
                                                </td>
                                                <td style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--txm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tName}>{tName}</td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <select value={cur.type} onChange={e => updItemInline(i.id, 'type', e.target.value)} style={inlineInput}>
                                                        <option value="fixed">шт</option>
                                                        <option value="per_pax">на чел.</option>
                                                    </select>
                                                </td>
                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.net} onChange={e => updItemInline(i.id, 'net', e.target.value)} style={inlineInputNum} /></td>
                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.mgrPrice} onChange={e => updItemInline(i.id, 'mgrPrice', e.target.value)} style={inlineInputNum} /></td>
                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.sell} onChange={e => updItemInline(i.id, 'sell', e.target.value)} style={inlineInputNum} /></td>
                                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                                    <input type="checkbox" checked={!!cur.mgr} onChange={e => updItemInline(i.id, 'mgr', e.target.checked)} />
                                                </td>
                                                <td style={{ padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                    <button onClick={() => openEditItem(i.id)} title="Редактировать" style={smIcon}>✎</button>
                                                    <button onClick={() => delItem(i.id)} title="Удалить" style={{ ...smIcon, color: '#ef4444' }}>🗑</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {modal === 'link' && shareUrl && (
                <LinkModal url={shareUrl} onClose={() => setModal(null)} onToast={showToast} />
            )}
            {modal === 'text' && currentRoute && (
                <TextModal data={getClientData()} onClose={() => setModal(null)} onToast={showToast} />
            )}

            {/* ROUTE MODAL */}
            {showRouteModal && editRoute && (
                <ModalShell title={editRoute.id ? 'Редактирование маршрута' : 'Новый маршрут'} onClose={() => setShowRouteModal(false)} onSave={saveRouteModal}>
                    <FormRow label="Иконка"><input type="text" value={editRoute.icon || ''} onChange={e => setEditRoute({ ...editRoute, icon: e.target.value })} style={modalInput} maxLength={4} /></FormRow>
                    <FormRow label="Название"><input type="text" value={editRoute.name || ''} onChange={e => setEditRoute({ ...editRoute, name: e.target.value })} style={modalInput} /></FormRow>
                    <FormRow label="Группа">
                        <select value={editRoute.group || ''} onChange={e => setEditRoute({ ...editRoute, group: e.target.value })} style={modalInput}>
                            {GROUPS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
                        </select>
                    </FormRow>
                    <FormRow label="Длительность (дни)"><input type="number" step="0.5" value={editRoute.days || 1} onChange={e => setEditRoute({ ...editRoute, days: e.target.value })} style={modalInput} /></FormRow>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <FormRow label="Время"><input type="text" value={editRoute.duration || ''} onChange={e => setEditRoute({ ...editRoute, duration: e.target.value })} style={modalInput} placeholder="~06:00-17:00" /></FormRow>
                        <FormRow label="Группа (чел.)"><input type="text" value={editRoute.groupSize || ''} onChange={e => setEditRoute({ ...editRoute, groupSize: e.target.value })} style={modalInput} placeholder="~11" /></FormRow>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <FormRow label="Транспорт"><input type="text" value={editRoute.transport || ''} onChange={e => setEditRoute({ ...editRoute, transport: e.target.value })} style={modalInput} placeholder="комфортный минивэн" /></FormRow>
                        <FormRow label="Гид"><input type="text" value={editRoute.guide || ''} onChange={e => setEditRoute({ ...editRoute, guide: e.target.value })} style={modalInput} placeholder="Русскоговорящий" /></FormRow>
                    </div>
                    <FormRow label="Питание"><input type="text" value={editRoute.meals || ''} onChange={e => setEditRoute({ ...editRoute, meals: e.target.value })} style={modalInput} placeholder="Обед" /></FormRow>
                    <FormRow label="Описание"><textarea value={editRoute.description || ''} onChange={e => setEditRoute({ ...editRoute, description: e.target.value })} style={{ ...modalInput, minHeight: '60px' }} /></FormRow>
                    <FormRow label="Программа (по строкам)">
                        <textarea
                            value={Array.isArray(editRoute.program) ? editRoute.program.join('\n') : (editRoute.program || '')}
                            onChange={e => setEditRoute({ ...editRoute, program: e.target.value })}
                            style={{ ...modalInput, minHeight: '120px', fontFamily: 'inherit' }}
                            placeholder={`Выезд из отелей\nХрам ...\nОбед\nВозвращение`} />
                    </FormRow>
                    <FormRow label="В цену включено (по строкам)">
                        <textarea
                            value={Array.isArray(editRoute.included) ? editRoute.included.join('\n') : (editRoute.included || '')}
                            onChange={e => setEditRoute({ ...editRoute, included: e.target.value })}
                            style={{ ...modalInput, minHeight: '80px', fontFamily: 'inherit' }}
                            placeholder={`Трансфер\nГид\nОбед`} />
                    </FormRow>
                    <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase' }}>Цены — модель ценообразования</div>
                    <FormRow label="Режим расчёта">
                        <select value={editRoute.pricingMode || 'per_pax'} onChange={e => setEditRoute({ ...editRoute, pricingMode: e.target.value })} style={modalInput}>
                            <option value="per_pax">За человека (взр / дет / мл)</option>
                            <option value="base_plus_extra">База + доплата за каждого</option>
                        </select>
                    </FormRow>
                    {(editRoute.pricingMode || 'per_pax') === 'per_pax' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            <FormRow label="Нетто взр"><input type="number" value={editRoute.extraAdultNet || 0} onChange={e => setEditRoute({ ...editRoute, extraAdultNet: e.target.value })} style={modalInput} /></FormRow>
                            <FormRow label="Нетто дет"><input type="number" value={editRoute.extraChildNet || 0} onChange={e => setEditRoute({ ...editRoute, extraChildNet: e.target.value })} style={modalInput} /></FormRow>
                            <FormRow label="Нетто мл"><input type="number" value={editRoute.extraInfantNet || 0} onChange={e => setEditRoute({ ...editRoute, extraInfantNet: e.target.value })} style={modalInput} /></FormRow>
                            <FormRow label="Менедж взр"><input type="number" value={editRoute.mgrExtraAdult || 0} onChange={e => setEditRoute({ ...editRoute, mgrExtraAdult: e.target.value })} style={modalInput} /></FormRow>
                            <FormRow label="Менедж дет"><input type="number" value={editRoute.mgrExtraChild || 0} onChange={e => setEditRoute({ ...editRoute, mgrExtraChild: e.target.value })} style={modalInput} /></FormRow>
                            <FormRow label="Менедж мл"><input type="number" value={editRoute.mgrExtraInfant || 0} onChange={e => setEditRoute({ ...editRoute, mgrExtraInfant: e.target.value })} style={modalInput} /></FormRow>
                            <FormRow label="Продажа взр"><input type="number" value={editRoute.extraAdult || 0} onChange={e => setEditRoute({ ...editRoute, extraAdult: e.target.value })} style={modalInput} /></FormRow>
                            <FormRow label="Продажа дет"><input type="number" value={editRoute.extraChild || 0} onChange={e => setEditRoute({ ...editRoute, extraChild: e.target.value })} style={modalInput} /></FormRow>
                            <FormRow label="Продажа мл"><input type="number" value={editRoute.extraInfant || 0} onChange={e => setEditRoute({ ...editRoute, extraInfant: e.target.value })} style={modalInput} /></FormRow>
                        </div>
                    ) : (
                        <>
                            <FormRow label="Включено в базу человек (0 = за каждого)">
                                <input type="number" value={editRoute.inclusivePax || 0} onChange={e => setEditRoute({ ...editRoute, inclusivePax: e.target.value })} style={modalInput} />
                            </FormRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <FormRow label="Нетто база"><input type="number" value={editRoute.baseNet || 0} onChange={e => setEditRoute({ ...editRoute, baseNet: e.target.value })} style={modalInput} /></FormRow>
                                <FormRow label="Нетто +чел"><input type="number" value={editRoute.extraPaxNet || 0} onChange={e => setEditRoute({ ...editRoute, extraPaxNet: e.target.value })} style={modalInput} /></FormRow>
                                <FormRow label="Менедж база"><input type="number" value={editRoute.mgrBase || 0} onChange={e => setEditRoute({ ...editRoute, mgrBase: e.target.value })} style={modalInput} /></FormRow>
                                <FormRow label="Менедж +чел"><input type="number" value={editRoute.mgrExtraPax || 0} onChange={e => setEditRoute({ ...editRoute, mgrExtraPax: e.target.value })} style={modalInput} /></FormRow>
                                <FormRow label="Продажа база"><input type="number" value={editRoute.baseSell || 0} onChange={e => setEditRoute({ ...editRoute, baseSell: e.target.value })} style={modalInput} /></FormRow>
                                <FormRow label="Продажа +чел"><input type="number" value={editRoute.extraPaxSell || 0} onChange={e => setEditRoute({ ...editRoute, extraPaxSell: e.target.value })} style={modalInput} /></FormRow>
                            </div>
                        </>
                    )}
                </ModalShell>
            )}

            {/* ITEM MODAL */}
            {showItemModal && editItem && (
                <ModalShell title={editItem.id ? 'Редактирование опции' : 'Новая опция'} onClose={() => setShowItemModal(false)} onSave={saveItemModal}>
                    <FormRow label="Иконка"><input type="text" value={editItem.icon || ''} onChange={e => setEditItem({ ...editItem, icon: e.target.value })} style={modalInput} maxLength={4} /></FormRow>
                    <FormRow label="Название"><input type="text" value={editItem.name || ''} onChange={e => setEditItem({ ...editItem, name: e.target.value })} style={modalInput} /></FormRow>
                    <FormRow label="Категория">
                        <select value={editItem.cat || 'extra'} onChange={e => setEditItem({ ...editItem, cat: e.target.value })} style={modalInput}>
                            {ITEM_CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                    </FormRow>
                    <FormRow label="Маршрут">
                        <select value={editItem.tId || 'ALL'} onChange={e => setEditItem({ ...editItem, tId: e.target.value })} style={modalInput}>
                            <option value="ALL">Общая (для всех маршрутов)</option>
                            {db.routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </FormRow>
                    <FormRow label="Тип">
                        <select value={editItem.type || 'fixed'} onChange={e => setEditItem({ ...editItem, type: e.target.value })} style={modalInput}>
                            <option value="fixed">Штучно (фикс. количество)</option>
                            <option value="per_pax">На человека (× кол-во гостей)</option>
                        </select>
                    </FormRow>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <FormRow label="Нетто"><input type="number" value={editItem.net || 0} onChange={e => setEditItem({ ...editItem, net: e.target.value })} style={modalInput} /></FormRow>
                        <FormRow label="Менедж"><input type="number" value={editItem.mgrPrice || 0} onChange={e => setEditItem({ ...editItem, mgrPrice: e.target.value })} style={modalInput} /></FormRow>
                        <FormRow label="Продажа"><input type="number" value={editItem.sell || 0} onChange={e => setEditItem({ ...editItem, sell: e.target.value })} style={modalInput} /></FormRow>
                    </div>
                    <FormRow label="Примечание"><input type="text" value={editItem.note || ''} onChange={e => setEditItem({ ...editItem, note: e.target.value })} style={modalInput} /></FormRow>
                    <FormRow label="Видна менеджеру">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--txt)', fontSize: '13px' }}>
                            <input type="checkbox" checked={!!editItem.mgr} onChange={e => setEditItem({ ...editItem, mgr: e.target.checked })} />
                            Менеджер может выбрать опцию при расчёте
                        </label>
                    </FormRow>
                </ModalShell>
            )}
        </div>
    );
}

// ─── small style helpers ──────────────────────────────────────
const inlineInput = {
    width: '100%', padding: '4px 6px', fontSize: '12px',
    background: 'var(--bg3)', border: '1px solid var(--brd2)',
    borderRadius: '6px', color: 'var(--txt)', fontFamily: 'inherit',
};
const inlineInputNum = { ...inlineInput, textAlign: 'right', maxWidth: '90px' };
const smIcon = {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--txm)', fontSize: '14px', padding: '4px 6px',
};
const modalInput = {
    width: '100%', padding: '8px 10px', fontSize: '13px',
    background: 'var(--bg3)', border: '1px solid var(--brd2)',
    borderRadius: '8px', color: 'var(--txt)', fontFamily: 'inherit',
};

function FormRow({ label, children }) {
    return (
        <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</label>
            {children}
        </div>
    );
}

function ModalShell({ title, children, onClose, onSave }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--card, #1a1a1a)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '600px',
                maxHeight: '90vh', overflow: 'auto', color: 'var(--txt)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--brd2)' }}>
                    <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '16px', fontWeight: 800 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--txl)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>
                <div>{children}</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--brd2)' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--txl)', border: '1px solid var(--brd2)', fontWeight: 600, cursor: 'pointer' }}>Отмена</button>
                    <button onClick={onSave} style={{ padding: '8px 16px', borderRadius: '8px', background: '#f59e0b', color: '#000', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Сохранить</button>
                </div>
            </div>
        </div>
    );
}
