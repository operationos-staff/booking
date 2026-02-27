export const CAT_ICONS = {
  'Достопримечательности': '🏛️',
  'Активности': '🏄',
  'Храмы': '⛩️',
  'Культурные': '🎭',
  'Животные': '🐘',
  'Спа': '💆',
  'Питание': '🍜',
  'Природа': '🌿',
  'Пляжи': '🏖️',
}

export const CAT_COLORS = {
  'Достопримечательности': ['#DBEAFE', '#1D4ED8'],
  'Активности':            ['#D1FAE5', '#065F46'],
  'Храмы':                 ['#FEF3C7', '#92400E'],
  'Культурные':            ['#EDE9FE', '#5B21B6'],
  'Животные':              ['#FCE7F3', '#9D174D'],
  'Спа':                   ['#FDF2F8', '#831843'],
  'Питание':               ['#FEF9C3', '#713F12'],
  'Природа':               ['#DCFCE7', '#14532D'],
  'Пляжи':                 ['#E0F2FE', '#0C4A6E'],
}

export const ALL_CATS = Object.keys(CAT_ICONS)

export const DEF_PACKAGES = [
  { id: 'base8full', type: 'base', hours: 8, name: '8 часов (вэн + гид + лодка)',    mgrPrice: 15000, nettoPrice: 9500,  note: 'минивэн, русский гид, лонгтейл',     nettoDetail: 'вэн 3500 + гид 2000 + лонг 4000 = 9500',        extraHour: 1000 },
  { id: 'base8',     type: 'base', hours: 8, name: '8 часов (вэн + гид)',             mgrPrice: 12000, nettoPrice: 6000,  note: 'минивэн, русский гид (без лодки)',   nettoDetail: 'вэн 4000 + гид 2000 = 6000',                    extraHour: 1000 },
  { id: 'base5',     type: 'base', hours: 5, name: '5 часов (вэн + гид)',             mgrPrice: 10000, nettoPrice: 5000,  note: 'минивэн, русский гид',               nettoDetail: 'вэн 3000 + гид 2000 = 5000',                    extraHour: 1000 },
  { id: 'vip8full',  type: 'vip',  hours: 8, name: '8 часов (альфард + гид + лодка)', mgrPrice: 25000, nettoPrice: 15000, note: 'Тойота Альфард, гид, лонгтейл',      nettoDetail: 'альфард 9000 + гид 2000 + лонг 4000 = 15000',   extraHour: 1000 },
  { id: 'vip8',      type: 'vip',  hours: 8, name: '8 часов (альфард + гид)',          mgrPrice: 22000, nettoPrice: 11500, note: 'Тойота Альфард, гид (без лодки)',    nettoDetail: 'альфард 9500 + гид 2000 = 11500',               extraHour: 1000 },
  { id: 'vip5',      type: 'vip',  hours: 5, name: '5 часов (альфард + гид)',          mgrPrice: 20000, nettoPrice: 10000, note: 'Тойота Альфард, гид',                nettoDetail: 'альфард 8000 + гид 2000 = 10000',               extraHour: 1000 },
]

export const DEF_OPTIONS = [
  { id: 1,  name: 'Стеклянный мост',                      mgrA: 800,  mgrC: 550,  netA: 500,  netC: 300,  cat: 'Достопримечательности', only8h: false },
  { id: 2,  name: 'Стеклянный мост + завтрак/обед',       mgrA: 1000, mgrC: 800,  netA: 600,  netC: 400,  cat: 'Достопримечательности', only8h: false },
  { id: 3,  name: 'Нац. парк Джеймса Бонда',              mgrA: 300,  mgrC: 150,  netA: 300,  netC: 150,  cat: 'Достопримечательности', only8h: true  },
  { id: 4,  name: 'Катание на каноэ',                     mgrA: 250,  mgrC: 250,  netA: 150,  netC: 150,  cat: 'Активности',            only8h: true  },
  { id: 5,  name: 'Храм Суванкуха (обезьяны)',             mgrA: 20,   mgrC: 20,   netA: 20,   netC: 20,   cat: 'Храмы',                 only8h: false },
  { id: 6,  name: 'Смотровая Самет (без моста)',           mgrA: 300,  mgrC: 200,  netA: 100,  netC: 100,  cat: 'Достопримечательности', only8h: false },
  { id: 7,  name: 'Деревня каренов',                      mgrA: 500,  mgrC: 400,  netA: 250,  netC: 200,  cat: 'Культурные',            only8h: false },
  { id: 8,  name: 'Деревня слонов',                       mgrA: 500,  mgrC: 400,  netA: 250,  netC: 200,  cat: 'Животные',              only8h: false },
  { id: 9,  name: 'Мантра Спа',                           mgrA: 1200, mgrC: 1000, netA: 990,  netC: 790,  cat: 'Спа',                   only8h: true  },
  { id: 10, name: 'Обед в цыганской деревне',             mgrA: 350,  mgrC: 250,  netA: 250,  netC: 125,  cat: 'Питание',               only8h: true  },
  { id: 11, name: 'Храм Ада и Рая',                       mgrA: 0,    mgrC: 0,    netA: 0,    netC: 0,    cat: 'Храмы',                 only8h: false, free: true },
  { id: 12, name: 'Водопад',                              mgrA: 200,  mgrC: 100,  netA: 100,  netC: 50,   cat: 'Природа',               only8h: false },
  { id: 13, name: 'Белый храм',                           mgrA: 0,    mgrC: 0,    netA: 0,    netC: 0,    cat: 'Храмы',                 only8h: false, free: true },
  { id: 14, name: 'Кафе с кувшинками',                    mgrA: 0,    mgrC: 0,    netA: 0,    netC: 0,    cat: 'Питание',               only8h: false, special: 'заказать напиток' },
  { id: 15, name: 'Пляж с самолетами',                    mgrA: 50,   mgrC: 50,   netA: 40,   netC: 40,   cat: 'Пляжи',                 only8h: false },
  { id: 16, name: 'Горячие источники Натай',              mgrA: 500,  mgrC: 300,  netA: 400,  netC: 200,  cat: 'Спа',                   only8h: true  },
  { id: 17, name: 'Купание со слонами в море + прогулка', mgrA: 1000, mgrC: 1000, netA: 500,  netC: 500,  cat: 'Животные',              only8h: false },
  { id: 18, name: 'Купание со слонами в бассейне + душ',  mgrA: 1000, mgrC: 1000, netA: 500,  netC: 500,  cat: 'Животные',              only8h: false },
  { id: 19, name: 'Купание со слонами (полный пакет)',    mgrA: 1900, mgrC: 1900, netA: 1000, netC: 1000, cat: 'Животные',              only8h: false },
  { id: 20, name: 'Катание на квадроциклах',              mgrA: 1000, mgrC: 700,  netA: 500,  netC: 500,  cat: 'Активности',            only8h: true  },
  { id: 21, name: 'Сплав на бамбуковых плотах',           mgrA: 500,  mgrC: 400,  netA: 150,  netC: 150,  cat: 'Активности',            only8h: true  },
]
