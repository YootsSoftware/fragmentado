import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('https://fragmentado.com'),
  title: 'Fragmentado',
  description:
    'Sitio oficial de Fragmentado, proyecto de música regional mexicana original desde la Sierra Mixe de Oaxaca. Escucha nuestra música, mira nuestros videos y solicita información para contrataciones.',
  keywords: [
    'Fragmentado',
    'música regional mexicana',
    'Sierra Mixe',
    'Oaxaca',
    'música original',
    'contrataciones musicales',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: '/',
    siteName: 'Fragmentado',
    title: 'Fragmentado | Música Regional Mexicana Original desde Oaxaca',
    description:
      'Canciones originales, videos y contrataciones de Fragmentado desde la Sierra Mixe de Oaxaca.',
    images: [
      {
        url: '/pausa-min.jpg',
        width: 1500,
        height: 1500,
        alt: 'Fragmentado, música regional mexicana original desde Oaxaca',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fragmentado | Música Regional Mexicana Original desde Oaxaca',
    description:
      'Canciones originales, videos y contrataciones de Fragmentado desde la Sierra Mixe de Oaxaca.',
    images: ['/pausa-min.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
