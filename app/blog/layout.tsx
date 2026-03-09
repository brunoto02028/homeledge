import { MarketingPopup } from '@/components/marketing-popup';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MarketingPopup />
    </>
  );
}
