import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import Providers from '@/components/Providers';
import BootstrapClient from '@/components/BootstrapClient';
import HealthPing from '@/components/HealthPing';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'ScholarAid',
  description: 'Find scholarships, stay organised, and get extra support for stronger applications.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <BootstrapClient />
          <HealthPing />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
