import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-4 text-center mt-auto">
      <div className="container">
        <p>
          © {new Date().getFullYear()} ScholarAid. All rights reserved.{' '}
          <Link href="/about">About</Link> ·{' '}
          <Link href="/contact">Contact</Link>
        </p>
      </div>
    </footer>
  );
}
