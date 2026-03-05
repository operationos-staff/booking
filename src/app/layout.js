import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export const metadata = {
  title: 'Остров Сокровищ — Portal Operation',
  description: 'Индивидуальные туры · Тайланд',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
