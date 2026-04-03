'use client';

import { useEffect } from 'react';

// Loads Bootstrap JS on the client so navbar toggler and other
// interactive components work correctly.
export default function BootstrapClient() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return null;
}
