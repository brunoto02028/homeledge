import { Metadata } from 'next';
import { VaultClient } from './vault-client';

export const metadata: Metadata = {
  title: 'Vault | HomeLedger',
};

export default function VaultPage() {
  return <VaultClient />;
}
