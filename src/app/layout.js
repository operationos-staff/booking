import './globals.css'

export const metadata = {
  title: 'Калькулятор туров — Пханг Нга',
  description: 'Индивидуальные туры · Тайланд',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
