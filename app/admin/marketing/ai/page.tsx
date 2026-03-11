import { redirect } from 'next/navigation';

export default function MarketingAIPage() {
  redirect('/admin/marketing?tab=composer');
}
