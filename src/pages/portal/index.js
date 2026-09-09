import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PortalIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/portal/login');
  }, [router]);

  return null;
}
