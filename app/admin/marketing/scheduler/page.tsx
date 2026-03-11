import { redirect } from 'next/navigation';

export default function SchedulerPage() {
  redirect('/admin/marketing?tab=scheduler');
}
