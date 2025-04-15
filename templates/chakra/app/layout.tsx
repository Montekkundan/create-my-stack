import { Providers } from './providers'

export const metadata = {
  title: 'Create My Stack',
  description: 'Built with create-my-stack',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
