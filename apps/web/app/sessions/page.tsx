import { AppShell } from '../../components/layout/app-shell';
import { EmptyState, PageTitle } from '../../components/ui';

export default function SessionsPage() {
  return <AppShell step="DISCOVER"><PageTitle eyebrow="Learning record" description="Your current research journey will appear here.">Sessions</PageTitle><EmptyState title="No sessions yet" message="Generate a topic to create your first research session." /></AppShell>;
}
