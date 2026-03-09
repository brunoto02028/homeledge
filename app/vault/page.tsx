import { Metadata } from 'next';
import { VaultClient } from './vault-client';

export const metadata: Metadata = {
  title: 'Vault | Clarity & Co',
};

export default function VaultPage() {
  return <VaultClient />;
}
