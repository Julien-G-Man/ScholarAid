import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import Providers from '@/components/Providers';
import BootstrapClient from '@/components/BootstrapClient';
import HealthPing from '@/components/HealthPing';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RouteScrollToTop from '@/components/RouteScrollToTop';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://scholar-aid.netlify.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ScholarAid | Find Scholarships and Win More Applications',
    template: '%s | ScholarAid',
  },
  description:
    'Discover scholarships, track deadlines, and get AI-powered application support to improve your chances.',
  keywords: [
    'scholarships',
    'scholarship finder',
    'scholarship applications',
    'student funding',
    'study abroad scholarships',
    'financial aid',
    'AI scholarship assistant',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/logos/logo.png',
    shortcut: '/logos/logo.png',
    apple: '/logos/logo.png',
  },
  openGraph: {
    title: 'ScholarAid | Find Scholarships and Win More Applications',
    description:
      'Discover scholarships, track deadlines, and get AI-powered application support to improve your chances.',
    url: '/',
    siteName: 'ScholarAid',
    images: [
      {
        url: '/img/graduation.png',
        width: 1200,
        height: 630,
        alt: 'ScholarAid hero image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScholarAid | Find Scholarships and Win More Applications',
    description:
      'Discover scholarships, track deadlines, and get AI-powered application support to improve your chances.',
    images: ['/img/graduation.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <BootstrapClient />
          <HealthPing />
          <Navbar />
          <RouteScrollToTop />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
