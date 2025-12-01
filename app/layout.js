import './globals.css'

export const metadata = {
  title: 'Asset Manager',
  description: 'Manage your company assets efficiently',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}