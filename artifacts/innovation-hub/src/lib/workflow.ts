// Shared business rules for the Innovation Hub prototype: who can do what,
// which stage transitions are legal, and when a case is actually ready to
// move forward. Centralized here (instead of ad hoc checks per button) so a
// future real backend can reuse the same rule table instead of re-deriving it.
import type { DocumentRequirement, HubSettings, Submission, Stage } from './model';

export type Action =
  | 'register'
  | 'reception'
  | 'fact-finding'
  | 'assign-reviewer'
  | 'record-review'
  | 'request-refinement'
  | 'resolve-refinement'
  | 'resubmit'
  | 'route'
  | 'respond-routing'
  | 'submit-ip'
  | 'update-ip'
  | 'verify-document'
  | 'save-outcome';

const permissions: Record<Action, string[]> = {
  register: ['Administrator', 'Innovation coordinator', 'Receiving officer', 'Receptionist', 'Fact-finding officer'],
  reception: ['Administrator', 'Innovation coordinator', 'Receptionist', 'Receiving officer'],
  'fact-finding': ['Administrator', 'Innovation coordinator', 'Fact-finding officer'],
  'assign-reviewer': ['Administrator', 'Innovation coordinator'],
  'record-review': ['Administrator', 'Innovation coordinator', 'Reviewer'],
  'request-refinement': ['Administrator', 'Innovation coordinator', 'Reviewer'],
  'resolve-refinement': ['Administrator', 'Innovation coordinator', 'Reviewer'],
  resubmit: ['Administrator', 'Innovation coordinator', 'Receptionist', 'Receiving officer', 'Fact-finding officer'],
  route: ['Administrator', 'Innovation coordinator', 'Sector officer'],
  'respond-routing': ['Administrator', 'Innovation coordinator', 'Sector officer'],
  'submit-ip': ['Administrator', 'Innovation coordinator', 'IP liaison'],
  'update-ip': ['Administrator', 'Innovation coordinator', 'IP liaison'],
  'verify-document': ['Administrator', 'Innovation coordinator', 'Receptionist', 'Receiving officer', 'Fact-finding officer'],
  'save-outcome': ['Administrator', 'Innovation coordinator'],
};

export function canPerform(role: string, action: Action): boolean {
  if (role === 'Read-only observer') return false;
  return permissions[action].includes(role);
}

export function allowedRolesLabel(action: Action): string {
  return permissions[action].join(', ');
}

// The sequence a case actually moves through in this prototype (matches the
// store's own domain actions: saveAssessment moves Fact-Finding -> Awaiting
// Routing, recordReview/route move a case on from there). Only used to guard
// *manual* stage changes (the "Next step" shortcut and the fixed reception/
// queue buttons) — dedicated actions like route(), resolveRefinement(), and
// saveAssessment() carry their own domain logic and aren't restricted by this.
const stageOrder: Stage[] = ['Received', 'Registered', 'Fact-Finding', 'Awaiting Routing', 'Under Review', 'Refinement Requested', 'Further Handling', 'Completed'];

export function allowedNextStages(current: Stage): Stage[] {
  const i = stageOrder.indexOf(current);
  if (i < 0) return []; // Draft, Not Pursued, Withdrawn: no generic manual next step
  const next: Stage[] = [];
  if (i > 0) next.push(stageOrder[i - 1]);
  if (i < stageOrder.length - 1) next.push(stageOrder[i + 1]);
  return next;
}

export function isStageTransitionAllowed(from: Stage, to: Stage): boolean {
  return from === to || allowedNextStages(from).includes(to);
}

export function missingRequiredDocs(s: Submission, requirements: DocumentRequirement[]): DocumentRequirement[] {
  return requirements.filter(r => r.category === s.category && r.required && !s.docs.some(d => d.kind === r.kind && d.status !== 'Rejected'));
}

export function reviewReadiness(s: Submission, settings: HubSettings): { met: boolean; completed: number; required: number } {
  const required = settings.requiredReviewers;
  const completed = s.reviews.filter(r => r.status === 'Completed').length;
  return { met: required > 0 ? completed >= required : true, completed, required };
}

// Can the given reviewer record their review right now? Blocks a later
// sequence step from completing before an earlier one, when assigned in
// Sequential mode.
export function canRecordReviewNow(s: Submission, reviewerName: string): { allowed: boolean; reason?: string } {
  const mine = s.reviews.find(r => r.reviewer === reviewerName && r.status !== 'Completed');
  if (!mine || mine.mode !== 'Sequential') return { allowed: true };
  const blocking = s.reviews.find(r => (r.sequence ?? 0) < (mine.sequence ?? 0) && r.status !== 'Completed');
  if (blocking) return { allowed: false, reason: `Waiting on ${blocking.reviewer}'s review (step ${blocking.sequence}) to complete first.` };
  return { allowed: true };
}
