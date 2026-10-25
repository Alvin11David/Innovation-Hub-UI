import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { demoState, initialState, type Submission, type State, type Stage } from './model';

type HubContextValue = {
  state: State;
  update: (id: string, patch: Partial<Submission>, action?: string) => void;
  register: (record: Omit<Submission, 'activities' | 'reviews' | 'feedback' | 'revisions' | 'routing' | 'revisionHistory'>) => void;
  reset: () => void;
  setRole: (role: string) => void;
  updateConfig: (patch: Partial<Pick<State, 'sectors' | 'reviewers' | 'documents'>>) => void;
  setStage: (id: string, stage: Stage, action?: string) => void;
};
const HubContext = createContext<HubContextValue | null>(null);
export function HubProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  useEffect(() => { localStorage.setItem('innovation-hub-state', JSON.stringify(state)); }, [state]);
  const update = useCallback((id: string, patch: Partial<Submission>, action = 'Submission updated') => {
    setState(current => ({ ...current, submissions: current.submissions.map(s => s.id === id ? {
      ...s, ...patch, updated: new Date().toISOString().slice(0,10),
      activities: [{ id: `act-${Date.now()}`, action, actor: current.displayName, date: new Date().toISOString().slice(0,10) }, ...s.activities],
    } : s) }));
  }, []);
  const register = useCallback((record: Omit<Submission, 'activities' | 'reviews' | 'feedback' | 'revisions' | 'routing' | 'revisionHistory'>) => {
    setState(current => ({ ...current, submissions: [{ ...record, activities:[{id:`act-${Date.now()}`,action:'Submission registered',actor:current.displayName,date:record.created}], reviews:[], feedback:[], routing:[], revisionHistory:[], revisions:0 }, ...current.submissions] }));
  }, []);
  const reset = useCallback(() => setState(demoState), []);
  const setRole = useCallback((role: string) => setState(s => ({ ...s, role })), []);
  const updateConfig = useCallback((patch: Partial<Pick<State, 'sectors' | 'reviewers' | 'documents'>>) => setState(s => ({ ...s, ...patch })), []);
  const setStage = useCallback((id: string, stage: Stage, action?: string) => update(id, { stage }, action || `Moved to ${stage}`), [update]);
  const value = useMemo(() => ({ state, update, register, reset, setRole, updateConfig, setStage }), [state, update, register, reset, setRole, updateConfig, setStage]);
  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}
export function useHub() {
  const value = useContext(HubContext);
  if (!value) throw new Error('useHub must be used inside HubProvider');
  return value;
}
