import './_group.css';
import { Router as WouterRouter } from 'wouter';
import { Dashboard } from './_shared/Pages';
import { Shell } from './_shared/Shell';
import { HubProvider } from './_shared/store';

export function Current() {
  return (
    <WouterRouter>
      <HubProvider>
        <Shell>
          <Dashboard />
        </Shell>
      </HubProvider>
    </WouterRouter>
  );
}
