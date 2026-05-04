'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Portal.module.css';
import { todayISO, doPrintLand, clipCopy, fmtDate } from '@/lib/utils';
import { saveCalculation, loadLandFromDB, saveLandToDB } from '@/lib/db';
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
    { key: '1 день',          label: '🏔️ 1 день',          icon: '🏔️', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.30)' },
    { key: '2 дня / 1 ночь',  label: '🌙 2 дня / 1 ночь', icon: '🌙', color: '#60a5fa', bgColor: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.30)' },
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
        // ─── ПОЛДНЯ ────────────────────────────────────────────
        {
            id: 'r1845', icon: '🌅', name: 'Рассвет на Самет Нангше',
            group: 'Полдня', days: 0.5,
            mgrAdult: 2400, mgrChild: 2000, mgrInfant: 0,
            sellAdult: 2400, sellChild: 2000,
            netAdult: 0, netChild: 0,
            duration: '~04:00-12:00', groupSize: '~11', transport: 'комфортный минивэн',
            guide: 'Русскоговорящий', meals: 'Завтрак буфет',
            description: 'Самая красивая смотровая на Пхукете! Рассвет на стеклянном мосту Самет Нангше. Прогулка на лодке по заливу и пляж с самолетами.',
            program: [
                'Выезд из отелей (~04:00)',
                'Рассвет на смотровой Самет Нангше',
                'Завтрак буфет с видом на залив',
                'Прогулка по стеклянному мосту SkyWalk',
                'Катание на лонгтейле по заливу Пханг Нга',
                'Пляж Майкао с самолётами',
                'Возвращение в отели (~12:00)',
            ],
            included: ['Трансфер с Пхукета и Натай-Кок Лой', 'Русский гид', 'Завтрак буфет', 'Все входные билеты', 'Медицинская страховка'],
            color: '#fbbf24', excursId: 1845, provider: 'Остров Сокровищ',
        },
        // ─── 1 ДЕНЬ ────────────────────────────────────────────
        {
            id: 'r2191', icon: '🏝️', name: 'Сказки Као Лака',
            group: '1 день', days: 1,
            mgrAdult: 3500, mgrChild: 3000, mgrInfant: 0,
            sellAdult: 3500, sellChild: 3000,
            netAdult: 0, netChild: 0,
            duration: '~04:00-16:00', groupSize: '~11', transport: 'комфортный минивэн',
            guide: 'Русскоговорящий', meals: 'Завтрак буфет + обед с морепродуктами',
            description: 'Рассвет на стеклянном мосту с завтраком, прогулка на лонгтейле, бамбуковые плоты, слоны, водопад, обед с морепродуктами.',
            program: [
                'Выезд из отелей (~04:00)',
                'Встреча рассвета на стеклянном мосту',
                'Завтрак', 'Катание на лонгтейле по заливу',
                'Катание на слонах (по желанию)', 'Шоу слоненка', 'Купание со слоном',
                'Прогулка на бамбуковых плотах', 'Обед с морепродуктами', 'Водопад, купание',
                'Возвращение в отели (~16:00)',
            ],
            included: ['Трансфер с Пхукета и Натай', 'Русский гид', 'Питание по программе', 'Медстраховка'],
            color: '#a78bfa', excursId: 2191, provider: 'Остров Сокровищ',
        },
        {
            id: 'r378', icon: '🌴', name: 'Као Лак: водопады и природа',
            group: '1 день', days: 1,
            mgrAdult: 2500, mgrChild: 1600, mgrInfant: 0,
            sellAdult: 2500, sellChild: 1600,
            netAdult: 0, netChild: 0,
            duration: '~06:00-17:00', groupSize: '~11', transport: 'комфортный минивэн',
            guide: 'Русскоговорящий', meals: 'Обед с морепродуктами',
            description: 'Идеальная программа для семей. Слоны, бамбуковые плоты, водопад, храм Лежащего Будды с обезьянами.',
            program: [
                'Выезд из отелей (~06:00)',
                'Катание на слонах', 'Шоу слоненка', 'Купание со слоном',
                'Бамбуковые плоты по реке', 'Обед с морепродуктами', 'Водопад, купание',
                'Пещерный храм Ват Суван Куха (обезьяны)',
                'Возвращение в отели (~16:00)',
            ],
            included: ['Трансфер с Пхукета и Натай', 'Русский гид', 'Питание по программе', 'Вход в Храм обезьян', 'Медстраховка'],
            color: '#a78bfa', excursId: 378, provider: 'Остров Сокровищ',
        },
        {
            id: 'r2484', icon: '🛕', name: 'Природа и Нирвана: Белый храм + Mantra Spa',
            group: '1 день', days: 1,
            mgrAdult: 3500, mgrChild: 3000, mgrInfant: 0,
            sellAdult: 3500, sellChild: 3000,
            netAdult: 0, netChild: 0,
            duration: '~08:00-19:30', groupSize: '~11', transport: 'комфортный минивэн',
            guide: 'Русскоговорящий', meals: 'Обед',
            description: 'Белый храм Wat Kanan, Самет Нангше, заповедник для слонов, деревня Каренов, обед и Mantra Spa.',
            program: [
                'Выезд из отеля (08:00)',
                'Белый храм Wat Kanan (09:30-10:00)',
                'Смотровая Самет Нангше (11:10-11:50)',
                'Слоновий заповедник: кормление, душ, общение (12:10-13:00)',
                'Деревня Каренов', 'Обед в локальном ресторане Fashi (13:20-14:10)',
                'Mantra Spa: бассейны, сауны, термальные ванны (14:30-17:30)',
                'Прибытие в отели (~19:30)',
            ],
            included: ['Трансфер с Пхукета', 'Русский гид', 'Питание', 'Все входные билеты', 'Шкафчик/полотенце/вода в спа', 'Медстраховка'],
            color: '#a78bfa', excursId: 2484, provider: 'Остров Сокровищ',
        },
        {
            id: 'r1642', icon: '🚣', name: 'Джангл трофи 5в1: рафтинг + водопад',
            group: '1 день', days: 1,
            mgrAdult: 2200, mgrChild: 1800, mgrInfant: 0,
            sellAdult: 2200, sellChild: 1800,
            netAdult: 0, netChild: 0,
            duration: '~06:00-18:00', groupSize: '6-11', transport: 'комфортный минивэн',
            guide: 'Русскоговорящий', meals: 'Обед',
            description: 'Активный отдых в нацпарке Пханг Нга. Рафтинг 5 км, водопад, обезьяны, аптека "Ривер Квай".',
            program: [
                'Выезд из отелей (~06:00-07:00)',
                'Пещерный храм Суван Куха (обезьяны, сталактиты)',
                'Рафтинг 5 км по реке',
                'Обед', 'Водопад, купание',
                'Аптека "Ривер Квай"',
                'Возвращение (~17:00)',
            ],
            included: ['Трансфер с Пхукета', 'Русский гид', 'Питание', 'Вход в храм', 'Снаряжение для рафтинга', 'Медстраховка'],
            color: '#a78bfa', excursId: 1642, provider: 'Остров Сокровищ',
        },
        {
            id: 'r480', icon: '🌊', name: 'Водопады Амазонии (Малая Амазония)',
            group: '1 день', days: 1,
            mgrAdult: 3200, mgrChild: 2500, mgrInfant: 0,
            sellAdult: 3200, sellChild: 2500,
            netAdult: 0, netChild: 0,
            duration: '~05:00-20:00', groupSize: '~11', transport: 'комфортный минивэн',
            guide: 'Русскоговорящий', meals: 'Обед',
            description: 'Дикие джунгли Као Лака, мемориал цунами, два водопада, каноэ по Баньяновой Роще, плавание со слонами.',
            program: [
                'Выезд из отелей (~05:00-06:00)',
                'Купание со слоном',
                'Каноэ по Баньяновой Роще',
                'Нацпарк Сри Пханга, водопад Тамнанг',
                'Обед в кафе у реки',
                'Мемориал Цунами 2004 года',
                'Водопад Тонпрай', 'Аптека "Ривер Квай"',
                'Возвращение (~19:00-20:00)',
            ],
            included: ['Трансфер с Пхукета и Као Лак', 'Русский гид', 'Питание', 'Входные билеты', 'Медстраховка'],
            color: '#a78bfa', excursId: 480, provider: 'Остров Сокровищ',
        },
        {
            id: 'r1482', icon: '🌅', name: 'Удивительная Пханг Нга',
            group: '1 день', days: 1,
            mgrAdult: 2200, mgrChild: 1900, mgrInfant: 0,
            sellAdult: 2200, sellChild: 1900,
            netAdult: 0, netChild: 0,
            duration: '~06:50-18:30', groupSize: '~12', transport: 'минивэн',
            guide: 'Русскоговорящий', meals: 'Обед',
            description: 'Самет Нангше, водопад, лодка по мангровым, слоновье СПА, шоу слоненка, Храм Чёрного Монаха, плавучая деревня цыган.',
            program: [
                'Выезд из отеля (06:50)',
                'Остановка у водопада (08:30)',
                'Слоновье СПА (09:50): грязь, душ, купание со слоном, шоу',
                'Храм Чёрного Монаха (11:40)',
                'Лонгтейл по мангровым (12:00)',
                'Обед в деревне морских цыган (12:30)',
                'Плавучая деревня цыган (12:45)',
                'Пещера обезьян, храм Суван Куха (14:15)',
                'Смотровая Самет Нангше (15:20)',
                'Пляж с самолётами (16:50)',
                'Выезд в отель (17:30)',
            ],
            included: ['Трансфер', 'Русский гид', 'Питание', 'Билеты в нацпарк', 'Купание со слоном', 'Катание на слонах', 'Медстраховка'],
            color: '#a78bfa', excursId: 1482, provider: 'Остров Сокровищ',
        },
        {
            id: 'r2239', icon: '🎢', name: 'Рафтинг-приключение: рафт + зиплайн',
            group: '1 день', days: 1,
            mgrAdult: 1700, mgrChild: 1600, mgrInfant: 0,
            sellAdult: 1700, sellChild: 1600,
            netAdult: 0, netChild: 0,
            duration: '~07:00-16:00', groupSize: '6-11', transport: 'комфортный минивэн',
            guide: 'Англоговорящий', meals: 'Обед',
            description: 'Сплав по реке 5,5 км, тарзанка Flying Fox 200 м, прогулка по джунглям к водопаду, храм Суван Куха.',
            program: [
                'Выезд из отелей (~07:00)',
                'Храм Суван Куха (обезьяны, сталактиты)',
                'Рафтинг 5,5 км',
                'Обед',
                'Тарзанка Flying Fox 200 м',
                'Прогулка по джунглям к водопаду',
                'Возвращение (~16:00)',
            ],
            included: ['Трансфер из Ката, Карон, Патонг и др.', 'Англ. гид', 'Питание', 'Снаряжение', 'Медстраховка'],
            color: '#a78bfa', excursId: 2239, provider: 'Остров Сокровищ',
        },
        {
            id: 'r2172', icon: '🏞️', name: 'Ленивое озеро Чео Лан (1 день)',
            group: '1 день', days: 1,
            mgrAdult: 3000, mgrChild: 2500, mgrInfant: 0,
            sellAdult: 3000, sellChild: 2500,
            netAdult: 0, netChild: 0,
            duration: '~06:00-19:00', groupSize: '~11', transport: 'минивэн + лонгтейл',
            guide: 'Русскоговорящий', meals: 'Обед',
            description: 'Спокойный однодневный вариант озера Чео Лан. Прогулка на лодке, купание, обед, видовое кафе на дереве, аптека.',
            program: [
                'Выезд из отелей (05:00-06:00)',
                'Прогулка на лонгтейле по Чео Лан (09:30)',
                'Свободное время: купание, каноэ',
                'Обед (12:00)',
                'Выезд с озера (12:30)',
                'Видовое кафе на дереве (14:30)',
                'Аптека тайской медицины (15:30)',
                'Возвращение (~19:00)',
            ],
            included: ['Трансфер с Пхукета и Натай', 'Русский гид', 'Питание', 'Билеты в нацпарк', 'Медстраховка'],
            color: '#a78bfa', excursId: 2172, provider: 'Остров Сокровищ',
        },
        {
            id: 'r2214', icon: '🐘', name: 'Аватар Плюс (на джипах)',
            group: '1 день', days: 1,
            mgrAdult: 3300, mgrChild: 3000, mgrInfant: 0,
            sellAdult: 3300, sellChild: 3000,
            netAdult: 0, netChild: 0,
            duration: '~07:00-18:15', groupSize: '~12', transport: '2 джипа по 8 чел.',
            guide: 'Русскоговорящий', meals: 'Обед',
            description: 'Пляж Майкао, Самет Нангше, мангровая лодка, слоновья ферма, Храм Ада и Рая, горячие источники.',
            program: [
                'Сбор из отелей (07:00)',
                'Пляж Май Као: фото с самолётами (08:50)',
                'Смотровая Самет Нангше (10:20)',
                'Лонгтейл по мангровым (11:20)',
                'Обед (13:00)',
                'Слоновья ферма: прогулка 30 мин, шоу, СПА (13:45)',
                'Храм Ада и Рая (15:15)',
                'Горячие источники (16:40)',
                'Возвращение в отель (~17:15)',
            ],
            included: ['Трансфер с Пхукета', 'Русский гид', 'Питание + питьевая вода', 'Входные билеты', 'Медстраховка'],
            color: '#a78bfa', excursId: 2214, provider: 'Остров Сокровищ',
        },
        {
            id: 'r2245', icon: '🐅', name: 'Очарование Краби',
            group: '1 день', days: 1,
            mgrAdult: 3200, mgrChild: 2500, mgrInfant: 0,
            sellAdult: 3200, sellChild: 2500,
            netAdult: 0, netChild: 0,
            duration: '~06:00-19:30', groupSize: '6-11', transport: 'минивэн',
            guide: 'Русскоговорящий', meals: 'Обед',
            description: 'Белый храм Краби, Храм Тигра, мангровая лодка с пещерой 3000 лет, катание на слонах, горячие источники.',
            program: [
                'Встреча в отеле (6:00-6:30)',
                'Деревня слонов: прогулка на слонах (9:30)',
                'Белый храм Краби (10:30)',
                'Лонгтейл по мангровым + пещера 3000 лет (11:30)',
                'Храм Тигра (12:30)',
                'Обед у горячих источников (14:00)',
                'Купание в горячих источниках 35-40°C (15:00)',
                'Возвращение (18:30)',
            ],
            included: ['Групповой трансфер', 'Русский гид', 'Питание', 'Билеты в нацпарк', 'Медстраховка'],
            color: '#a78bfa', excursId: 2245, provider: 'Остров Сокровищ',
        },
        // ─── 2 ДНЯ / 1 НОЧЬ ───────────────────────────────────
        {
            id: 'r838', icon: '🌙', name: 'Секретное озеро Чео Лан (с ночёвкой)',
            group: '2 дня / 1 ночь', days: 2,
            mgrAdult: 7900, mgrChild: 6900, mgrInfant: 0,
            sellAdult: 7900, sellChild: 6900,
            netAdult: 0, netChild: 0,
            duration: '~06:00-18:00', groupSize: '~11', transport: 'минивэн + лонгтейл',
            guide: 'Русскоговорящий', meals: 'Обед-ужин-завтрак-обед',
            description: 'Ночёвка в домиках на озере. Пещерный храм с обезьянами, храм Рамы X, вечернее сафари, бамбуковые плоты, Самет Нангше.',
            program: [
                'День 1 — 06:00-07:00 Выезд', 'Храм Суван Куха (обезьяны)',
                'Водопад', 'Храм Рамы X', 'Лонгтейл по Чео Лан до домиков',
                'Обед на озере', 'Свободное время, каноэ',
                'Вечернее сафари на закате', 'Скалы Гуилинь', 'Ужин',
                'День 2 — 09:00 Выселение', 'Завтрак',
                'Бамбуковые плоты', 'Чай/кофе в бамбуке', 'Обед',
                'Самет Нангше', 'Аптека "Ривер Квай"', 'Возвращение (17:00)',
            ],
            included: ['Трансфер с Пхукета и Натай', 'Русский гид', 'Проживание + питание (2-местное)', 'Билеты в нацпарк и храм', 'Медстраховка'],
            color: '#60a5fa', excursId: 838, provider: 'Остров Сокровищ',
        },
        {
            id: 'r2073', icon: '🛖', name: 'Чео Лан: бунгало на воде (стандарт)',
            group: '2 дня / 1 ночь', days: 2,
            mgrAdult: 4900, mgrChild: 4400, mgrInfant: 0,
            sellAdult: 4900, sellChild: 4400,
            netAdult: 0, netChild: 0,
            duration: '~06:50-14:30', groupSize: '~12', transport: 'минивэн + лонгтейл',
            guide: 'Русскоговорящий', meals: 'Обед-ужин-завтрак',
            description: 'Бунгало на понтонах. Пещера обезьян, деревня слонов с СПА на выбор, прогулка по озеру, ночь под звёздами, утреннее сафари.',
            program: [
                'День 1 — 06:50 Выезд', '08:05 Мост Сарасин',
                '09:20 Пещера обезьян, храм Суван Куха',
                '10:30 Деревня слонов (опц. СПА или катание)',
                '12:50 Пирс Чео Лан, лодка', '13:40 Обед в плавучем ресторане',
                '14:30 Свободное время, купание, каноэ',
                '17:50 Вечернее сафари', '19:50 Ужин', '21:50 Ночь в бунгало',
                'День 2 — 07:00 Завтрак, выселение',
                '08:00 Утреннее сафари', '10:15 Обзорная площадка',
                '11:00 Храм Ват Махатхат Вачирамонгкон',
                '13:30 Прибытие в отель',
            ],
            included: ['Трансфер с Пхукета', 'Русский гид', 'Проживание + питание', 'Билеты в нацпарк', 'Активность в деревне слонов', 'Медстраховка'],
            color: '#60a5fa', excursId: 2073, provider: 'Остров Сокровищ',
        },
    ],
    items: [
        // ─── ТИПОВЫЕ ДОПЛАТЫ (доступны для всех маршрутов) ───
        { id: 'i_tx1', tId: 'ALL', cat: 'transfer', icon: '🚐', name: 'Индивидуальный трансфер из Као Лак', type: 'fixed', mgr: true,
          mgrPrice: 4000, sell: 4000, net: 0, note: 'за машину туда-обратно' },
        { id: 'i_tx2', tId: 'ALL', cat: 'transfer', icon: '🚐', name: 'Трансфер Натай → Кок Лой', type: 'fixed', mgr: true,
          mgrPrice: 3500, sell: 3500, net: 0, note: 'за машину туда-обратно' },
        { id: 'i_tx3', tId: 'ALL', cat: 'transfer', icon: '🧳', name: 'Доплата за багаж', type: 'fixed', mgr: true,
          mgrPrice: 500, sell: 500, net: 0, note: 'за сумку' },

        // ─── СПЕЦИФИЧНЫЕ ДОПЛАТЫ ─────────────────────────────
        { id: 'i_h838', tId: 'r838', cat: 'hotel', icon: '🛏️', name: 'Одноместное размещение', type: 'fixed', mgr: true,
          mgrPrice: 1500, sell: 1500, net: 0, note: 'доплата' },
        { id: 'i_h2073', tId: 'r2073', cat: 'hotel', icon: '🛏️', name: 'Одноместное размещение', type: 'fixed', mgr: true,
          mgrPrice: 1000, sell: 1000, net: 0, note: 'доплата' },
        { id: 'i_x2484', tId: 'r2484', cat: 'extra', icon: '🔐', name: 'Депозит за шкафчик в спа', type: 'fixed', mgr: true,
          mgrPrice: 100, sell: 100, net: 0, note: 'возвращается при сдаче ключа' },
        { id: 'i_x2073', tId: 'r2073', cat: 'extra', icon: '🐘', name: 'Вторая активность в деревне слонов', type: 'per_pax', mgr: true,
          mgrPrice: 300, sell: 300, net: 0, note: 'на человека' },
        { id: 'i_t1642', tId: 'r1642', cat: 'extra', icon: '🛕', name: 'Вход в храм Суван Куха', type: 'per_pax', mgr: true,
          mgrPrice: 20, sell: 20, net: 0, note: 'на человека' },
        { id: 'i_t2239', tId: 'r2239', cat: 'extra', icon: '🛕', name: 'Вход в храм', type: 'per_pax', mgr: true,
          mgrPrice: 20, sell: 20, net: 0, note: 'на человека' },
        { id: 'i_t1482', tId: 'r1482', cat: 'extra', icon: '🛕', name: 'Вход в храм Суван Куха', type: 'per_pax', mgr: true,
          mgrPrice: 20, sell: 20, net: 0, note: 'на человека' },
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
            dynamic.push({ key: g, label: `🏔️ ${g}`, icon: '🏔️', ...ec });
        }
    });
    return dynamic;
}

export default function LandTourPage({ role, toast: externalToast, user, brandSettings, onPage }) {
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
                const dbData = await loadLandFromDB();
                if (dbData && dbData.routes && dbData.routes.length > 0) {
                    setDb(dbData);
                    localStorage.setItem('land_db', JSON.stringify(dbData));
                    setDbLoaded(true);
                    return;
                }
            } catch (e) {
                console.warn('Land: Supabase load failed:', e.message);
            }
            const saved = localStorage.getItem('land_db');
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
            setDb(DEFAULT_DB);
            setDbLoaded(true);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (!isAdmin && activeTab === 'admin') setActiveTab('calc');
    }, [isAdmin, activeTab]);

    const saveDB = useCallback(async (newDb) => {
        setDb(newDb);
        localStorage.setItem('land_db', JSON.stringify(newDb));
        if (isAdmin) {
            try {
                await saveLandToDB(newDb);
            } catch (e) {
                console.warn('Land: Supabase save failed:', e.message);
            }
        }
    }, [isAdmin]);

    const saveLandToCloud = async () => {
        setSavingDb(true);
        try {
            const ok = await saveLandToDB(db);
            if (ok) showToast('Сухопутные сохранены в базу!', 'ok');
            else showToast('Ошибка сохранения', 'err');
        } catch (e) {
            showToast('Ошибка: ' + e.message, 'err');
        } finally {
            setSavingDb(false);
        }
    };

    const resetDB = async () => {
        if (!confirm('Сбросить все изменения и вернуть к заводским настройкам?')) return;
        setDb(DEFAULT_DB);
        localStorage.setItem('land_db', JSON.stringify(DEFAULT_DB));
        if (isAdmin) await saveLandToDB(DEFAULT_DB);
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
        const baseSell = (currentRoute.sellAdult || 0) * (pax.adults || 0)
                       + (currentRoute.sellChild || 0) * (pax.children || 0);
        const baseMgr  = (currentRoute.mgrAdult  || 0) * (pax.adults || 0)
                       + (currentRoute.mgrChild  || 0) * (pax.children || 0);
        const baseNet  = (currentRoute.netAdult  || 0) * (pax.adults || 0)
                       + (currentRoute.netChild  || 0) * (pax.children || 0);
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
            _kind: 'land',
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
            const msg = `🏔️ <b>Новая сухопутная экскурсия</b>\n👤 ${d.name || 'Клиент не указан'}\n🗺 ${d.tourName}\n👥 ${d.pax}\n📅 ${d.date || '—'}\n💰 ${(d.total || 0).toLocaleString('ru-RU')} ฿\n🔗 <a href="${url}">Открыть расчёт</a>`;
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
            id: '', icon: '🏔️', name: '',
            group: g,
            days: g === 'Полдня' ? 0.5 : (g === '2 дня / 1 ночь' ? 2 : 1),
            mgrAdult: 0, mgrChild: 0, mgrInfant: 0,
            sellAdult: 0, sellChild: 0, netAdult: 0, netChild: 0,
            duration: '', groupSize: '~11', transport: 'комфортный минивэн',
            guide: 'Русскоговорящий', meals: '',
            description: '', program: [], included: [],
            provider: 'Остров Сокровищ', excursId: 0,
            color: GROUPS.find(x => x.key === g)?.color || '#a78bfa',
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
            mgrAdult: Number(editRoute.mgrAdult) || 0,
            mgrChild: Number(editRoute.mgrChild) || 0,
            mgrInfant: Number(editRoute.mgrInfant) || 0,
            sellAdult: Number(editRoute.sellAdult) || 0,
            sellChild: Number(editRoute.sellChild) || 0,
            netAdult:  Number(editRoute.netAdult)  || 0,
            netChild:  Number(editRoute.netChild)  || 0,
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
            const numFields = ['mgrAdult','mgrChild','mgrInfant','sellAdult','sellChild','netAdult','netChild','days'];
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
            id: newId, icon: '🏔️', name: `${name} - Новый маршрут`,
            group: name, days: 1,
            mgrAdult: 0, mgrChild: 0, mgrInfant: 0,
            sellAdult: 0, sellChild: 0, netAdult: 0, netChild: 0,
            duration: '', groupSize: '', transport: '', guide: 'Русскоговорящий',
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
                            <div className={styles.panelTitle}><span>🏔️</span> Сухопутные туры</div>
                            {onPage && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <button onClick={() => onPage('hub')} style={{
                                        padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                        border: '1px solid var(--brd2)', cursor: 'pointer', fontFamily: 'inherit',
                                        background: 'transparent', color: 'var(--txm)',
                                    }}>← Все типы</button>
                                </div>
                            )}
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
                                const orderedKeys = ['Полдня', '1 день', '2 дня / 1 ночь',
                                    ...groupOrder.filter(g => !['Полдня', '1 день', '2 дня / 1 ночь'].includes(g))];
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
                                                    <span>{meta?.icon || '🏔️'}</span>
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
                                                                        от <span>{FMT(r.sellAdult)}</span> /чел
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
                                <div className={styles.emptyStateIco}>🏔️</div>
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
                                        {isAdmin ? (
                                            <>
                                                <div className={styles.rr}>
                                                    <div><div className={styles.rrName}>База нетто</div><div className={styles.rrMeta}>Себестоимость по гостям</div></div>
                                                    <div className={styles.rrVal}>{FMT((currentRoute.netAdult || 0) * pax.adults + (currentRoute.netChild || 0) * pax.children)}</div>
                                                </div>
                                                <div className={styles.rr}>
                                                    <div><div className={styles.rrName}>Опции нетто</div><div className={styles.rrMeta}>Сумма закупочных цен</div></div>
                                                    <div className={styles.rrVal}>{FMT(netTot - ((currentRoute.netAdult || 0) * pax.adults + (currentRoute.netChild || 0) * pax.children))}</div>
                                                </div>
                                                <div style={{ borderBottom: '1px dashed var(--brd2)', margin: '10px 0' }}></div>
                                                <div className={styles.rr}><div>Общая Себестоимость</div><div className={styles.rrVal}>{FMT(netTot)}</div></div>
                                                <div className={styles.rr} style={{ color: 'var(--ok)', fontWeight: 800 }}><div>Базовая маржа</div><div className={styles.rrVal}>+{FMT(sellTot - netTot)}</div></div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={styles.rr}>
                                                    <div><div className={styles.rrName}>🏔️ Экскурсия</div><div className={styles.rrMeta}>{pax.adults} взр × {FMT(currentRoute.sellAdult)}{pax.children ? ` + ${pax.children} дет × ${FMT(currentRoute.sellChild)}` : ''}</div></div>
                                                    <div className={styles.rrVal}>{FMT((currentRoute.sellAdult || 0) * pax.adults + (currentRoute.sellChild || 0) * pax.children)}</div>
                                                </div>
                                                {selOptsList.length > 0 && (
                                                    <div className={styles.rr}>
                                                        <div><div className={styles.rrName}>🎯 Выбранные опции</div><div className={styles.rrMeta}>дополнительные услуги</div></div>
                                                        <div className={styles.rrVal}>+{FMT(sellTot - ((currentRoute.sellAdult || 0) * pax.adults + (currentRoute.sellChild || 0) * pax.children))}</div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className={`${styles.rr} ${styles.rrTot}`}>
                                            <div>К ОПЛАТЕ:</div>
                                            <div>{FMT(sellTot)}</div>
                                        </div>

                                        <div style={{ marginTop: '24px', background: 'var(--bg3)', padding: '16px', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--txm)', textTransform: 'uppercase', marginBottom: '8px' }}>Выбранные позиции</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid var(--brd2)' }}>
                                                <div style={{ fontWeight: 600 }}>{currentRoute.icon} {currentRoute.name}</div>
                                                <div style={{ fontWeight: 700 }}>{FMT((currentRoute.sellAdult || 0) * pax.adults + (currentRoute.sellChild || 0) * pax.children)}</div>
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
                        <button onClick={saveLandToCloud} disabled={savingDb} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', color: '#60a5fa', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>{savingDb ? '⏳ Сохранение...' : '☁️ Сохранить в БД'}</button>
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
                        <h3 style={{ color: 'var(--txt)', fontSize: '15px', marginBottom: '12px', fontWeight: 700 }}>🏔️ Маршруты ({db.routes.length})</h3>
                        {(() => {
                            const groups = {};
                            db.routes.forEach(r => {
                                const g = r.group || 'Другие';
                                if (!groups[g]) groups[g] = [];
                                groups[g].push(r);
                            });
                            const order = ['Полдня', '1 день', '2 дня / 1 ночь', ...Object.keys(groups).filter(g => !['Полдня', '1 день', '2 дня / 1 ночь'].includes(g))];
                            return order.filter(g => groups[g]).map(gName => {
                                const meta = GROUPS.find(x => x.key === gName);
                                return (
                                    <div key={gName} style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '6px 10px', background: meta?.bgColor || 'var(--brd2)', border: `1px solid ${meta?.border || 'var(--brd2)'}`, borderRadius: '8px' }}>
                                            <span style={{ fontSize: '14px' }}>{meta?.icon || '🏔️'}</span>
                                            <b style={{ color: meta?.color || 'var(--txt)', fontSize: '13px' }}>{gName}</b>
                                            <span style={{ fontSize: '11px', color: 'var(--txl)' }}>· {groups[gName].length} маршр.</span>
                                            <div style={{ flex: 1 }} />
                                            <button onClick={() => openAddRoute(gName)} style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--brd2)', border: '1px solid var(--brd2)', color: 'var(--txm)', fontSize: '11px', cursor: 'pointer' }}>+</button>
                                        </div>
                                        <div style={{ overflow: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '900px' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--brd2)' }}>
                                                        <th style={{ padding: '8px', textAlign: 'left', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Иконка</th>
                                                        <th style={{ padding: '8px', textAlign: 'left', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Название</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Нетто взр</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Нетто дет</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Менедж взр</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Менедж дет</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Продажа взр</th>
                                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--txl)', fontWeight: 600, fontSize: '11px' }}>Продажа дет</th>
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
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.netAdult} onChange={e => updRouteInline(r.id, 'netAdult', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.netChild} onChange={e => updRouteInline(r.id, 'netChild', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.mgrAdult} onChange={e => updRouteInline(r.id, 'mgrAdult', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.mgrChild} onChange={e => updRouteInline(r.id, 'mgrChild', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.sellAdult} onChange={e => updRouteInline(r.id, 'sellAdult', e.target.value)} style={inlineInputNum} /></td>
                                                                <td style={{ padding: '6px 8px' }}><input type="number" value={cur.sellChild} onChange={e => updRouteInline(r.id, 'sellChild', e.target.value)} style={inlineInputNum} /></td>
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
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '900px' }}>
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
                                                <td style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--txm)' }}>{tName}</td>
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
                    <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase' }}>Цены</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <FormRow label="Нетто взр"><input type="number" value={editRoute.netAdult || 0} onChange={e => setEditRoute({ ...editRoute, netAdult: e.target.value })} style={modalInput} /></FormRow>
                        <FormRow label="Менедж взр"><input type="number" value={editRoute.mgrAdult || 0} onChange={e => setEditRoute({ ...editRoute, mgrAdult: e.target.value })} style={modalInput} /></FormRow>
                        <FormRow label="Продажа взр"><input type="number" value={editRoute.sellAdult || 0} onChange={e => setEditRoute({ ...editRoute, sellAdult: e.target.value })} style={modalInput} /></FormRow>
                        <FormRow label="Нетто дет"><input type="number" value={editRoute.netChild || 0} onChange={e => setEditRoute({ ...editRoute, netChild: e.target.value })} style={modalInput} /></FormRow>
                        <FormRow label="Менедж дет"><input type="number" value={editRoute.mgrChild || 0} onChange={e => setEditRoute({ ...editRoute, mgrChild: e.target.value })} style={modalInput} /></FormRow>
                        <FormRow label="Продажа дет"><input type="number" value={editRoute.sellChild || 0} onChange={e => setEditRoute({ ...editRoute, sellChild: e.target.value })} style={modalInput} /></FormRow>
                    </div>
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
