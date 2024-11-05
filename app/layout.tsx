export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' data-theme='light'>
      <body className='min-h-screen'>{children}</body>
    </html>
  )
}
