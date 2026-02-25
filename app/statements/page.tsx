import StatementsClient from './statements-client';

export const metadata = {
  title: 'Bank Statements | HomeLedger',
  description: 'Manage and categorize your bank statement transactions for HMRC reporting',
};

export default function StatementsPage() {
  return <StatementsClient />;
}
