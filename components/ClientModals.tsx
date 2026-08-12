'use client';

import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/AuthModal').then(m => ({ default: m.AuthModal })), {
  ssr: false,
});
const PidModal = dynamic(() => import('@/components/PidModal').then(m => ({ default: m.PidModal })), {
  ssr: false,
});

export function ClientModals() {
  return (
    <>
      <AuthModal />
      <PidModal />
    </>
  );
}
