import './globals.css'

export const metadata = {
  title: 'Портал бронирования — Пханг Нга',
  description: 'Индивидуальные туры · Тайланд',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
