import { WorksheetBuilder } from '@/components/worksheet/WorksheetBuilder';
import TuteeWorksheetsPage from '@/pages/TuteeWorksheetsPage';
import { useAuth } from '@/hooks/useAuth';

export default function WorksheetsPage() {
  const { profile } = useAuth();
  if (profile?.role === 'tutee') return <TuteeWorksheetsPage />;
  return <WorksheetBuilder />;
}
