import { AppShell } from '../../components/layout/app-shell';
import { EmptyState, PageTitle } from '../../components/ui';

export default function TopicsPage() {
  return <AppShell step="DISCOVER"><PageTitle eyebrow="Reference" description="Topics are introduced through the discovery flow.">Topics</PageTitle><EmptyState title="Use discovery to begin" message="Choose a focused science and technology challenge to start a session." /></AppShell>;
}
