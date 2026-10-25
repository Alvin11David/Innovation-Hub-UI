import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Shell } from '@/components/Shell';
import { HubProvider } from '@/lib/store';
import { ActivityPage, Dashboard, DetailPage, DocumentsPage, QueuePage, ReceptionPage, RegisterPage, ReportsPage, SettingsPage, SubmissionsPage } from '@/pages/Pages';
import { Link, Route, Switch, Router as WouterRouter } from 'wouter';
import './index.css';
import './app.css';

const queryClient = new QueryClient();

function AppRoutes() {
  return <Shell><Switch>
    <Route path="/" component={Dashboard}/>
    <Route path="/submissions" component={()=><SubmissionsPage/>}/>
    <Route path="/submissions/student" component={()=><SubmissionsPage preset="Student Project"/>}/>
    <Route path="/submissions/innovations" component={()=><SubmissionsPage preset="General Innovation"/>}/>
    <Route path="/submissions/:id" component={DetailPage}/>
    <Route path="/register" component={RegisterPage}/>
    <Route path="/reception" component={ReceptionPage}/>
    <Route path="/fact-finding" component={()=><QueuePage kind="fact"/>}/>
    <Route path="/reviews" component={()=><QueuePage kind="reviews"/>}/>
    <Route path="/routing" component={()=><QueuePage kind="routing"/>}/>
    <Route path="/refinement" component={()=><QueuePage kind="refinement"/>}/>
    <Route path="/documents" component={DocumentsPage}/>
    <Route path="/activity" component={ActivityPage}/>
    <Route path="/reports" component={ReportsPage}/>
    <Route path="/settings" component={SettingsPage}/>
    <Route><div className="not-found page-enter"><div className="eyebrow">404 · NOT FOUND</div><h1>This page isn't in the workspace.</h1><p>The address may be out of date. Your case records are still here.</p><Link href="/" className="btn btn-primary">Back to overview</Link></div></Route>
  </Switch></Shell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><HubProvider><WouterRouter><AppRoutes/></WouterRouter></HubProvider></TooltipProvider></QueryClientProvider>;
}

export default App;
