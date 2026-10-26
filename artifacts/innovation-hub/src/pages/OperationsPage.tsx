import { useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight, Banknote, BriefcaseBusiness, CalendarDays, Camera, Check, CheckCircle2,
  ChevronRight, CircleAlert, ClipboardList, Clock3, FileText, HardDrive, Handshake,
  MapPin, Plus, ShieldCheck, Users, Wrench,
} from 'lucide-react';
import {
  trainingCourses, useOperationsState,
  type InnovationPartner, type OperationsDepartment, type OperationsState,
  type PartnerMouStatus, type PodAsset, type StartupMentorship, type StartupStage,
  type TrainingCourse, type TrainingPayment, type TrainingSession,
} from '@/lib/operations';
import { getPaymentProof, savePaymentProof } from '@/lib/operationsFiles';
import '../operations.css';

type OperationsTab = 'Overview' | 'Departments & mentorship' | 'Training & payments' | 'UniPod partners' | 'Equipment';
const tabs: OperationsTab[] = ['Overview', 'Departments & mentorship', 'Training & payments', 'UniPod partners', 'Equipment'];
const stages: StartupStage[] = ['Idea', 'Validation', 'Prototype', 'Pilot', 'Early growth', 'Scaling'];
const paymentStatuses: TrainingPayment['status'][] = ['Pending review', 'Verified', 'Needs update'];
const mouStatuses: PartnerMouStatus[] = ['Required', 'Under review', 'Signed'];
const assetStatuses: PodAsset['status'][] = ['Available', 'In use at the Pod', 'Needs repair'];

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function shortDate(value: string) {
  if (!value) return 'Date not set';
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function FormField({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`operations-field ${className}`}><span>{label}</span>{children}</label>;
}

function EmptyState({ title, detail, icon }: { title: string; detail: string; icon: ReactNode }) {
  return <div className="operations-empty"><span className="operations-empty-icon">{icon}</span><h3>{title}</h3><p>{detail}</p></div>;
}

function PanelHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="operations-panel-heading"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action}</div>;
}

function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`operations-status operations-status-${tone}`}>{children}</span>;
}

export function OperationsPage() {
  const [state, setState] = useOperationsState();
  const [activeTab, setActiveTab] = useState<OperationsTab>('Overview');
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [savingProof, setSavingProof] = useState(false);
  const [sessionForPayment, setSessionForPayment] = useState<string | null>(null);
  const [paymentSettingsDraft, setPaymentSettingsDraft] = useState(state.paymentSettings);
  const [partnerDrafts, setPartnerDrafts] = useState<Record<string, { mouStatus: PartnerMouStatus; mouReference: string }>>({});
  const [assetDrafts, setAssetDrafts] = useState<Record<string, { status: PodAsset['status']; assignedTo: string; issue: string }>>({});

  const updateState = (updater: (current: OperationsState) => OperationsState) => setState(updater);
  const closeForm = () => setOpenForm(null);
  const goTo = (tab: OperationsTab) => {
    setActiveTab(tab);
    setOpenForm(null);
    setNotice('');
  };

  function addDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const department: OperationsDepartment = {
      id: newId('department'),
      name: String(data.get('name')).trim(),
      manager: String(data.get('manager')),
      mentor: String(data.get('mentor')).trim(),
      supervisedGroup: String(data.get('supervisedGroup')).trim(),
      createdAt: new Date().toISOString(),
    };
    if (!department.name || !department.manager || !department.mentor || !department.supervisedGroup) return;
    updateState(current => ({ ...current, departments: [...current.departments, department] }));
    event.currentTarget.reset();
    closeForm();
    setNotice('Department added.');
  }

  function addMentorship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const startup: StartupMentorship = {
      id: newId('mentorship'),
      startupName: String(data.get('startupName')).trim(),
      founder: String(data.get('founder')).trim(),
      department: String(data.get('department')).trim(),
      mentor: String(data.get('mentor')).trim(),
      stage: String(data.get('stage')) as StartupStage,
      capacityNeeds: String(data.get('capacityNeeds')).trim(),
      nextFollowUp: String(data.get('nextFollowUp')),
      notes: String(data.get('notes')).trim(),
    };
    if (!startup.startupName || !startup.founder || !startup.department || !startup.mentor || !startup.nextFollowUp) return;
    updateState(current => ({ ...current, startups: [...current.startups, startup] }));
    event.currentTarget.reset();
    closeForm();
    setNotice('Mentorship record added.');
  }

  function addSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const session: TrainingSession = {
      id: newId('session'),
      course: String(data.get('course')) as TrainingCourse,
      instructor: String(data.get('instructor')).trim(),
      date: String(data.get('date')),
      startTime: String(data.get('startTime')),
      endTime: String(data.get('endTime')),
      location: String(data.get('location')).trim(),
      capacity: Number(data.get('capacity')),
    };
    if (!session.instructor || !session.date || !session.startTime || !session.endTime || !session.location || !session.capacity || session.capacity < 1) return;
    if (session.endTime <= session.startTime) {
      setNotice('End time must be later than the start time.');
      return;
    }
    updateState(current => ({ ...current, sessions: [...current.sessions, session].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)) }));
    event.currentTarget.reset();
    closeForm();
    setNotice('Training session scheduled.');
  }

  async function addPayment(event: FormEvent<HTMLFormElement>, sessionId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const proof = form.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0];
    const paymentId = newId('payment');
    const payment: TrainingPayment = {
      id: paymentId,
      sessionId,
      traineeName: String(data.get('traineeName')).trim(),
      amount: Number(state.paymentSettings.amount),
      currency: state.paymentSettings.currency,
      transactionReference: String(data.get('transactionReference')).trim(),
      proofFileName: proof?.name ?? '',
      proofFileId: paymentId,
      status: 'Pending review',
      submittedAt: new Date().toISOString(),
    };
    if (!state.paymentSettings.published) {
      setNotice('Publish the session fee and bank details before recording trainee payments.');
      return;
    }
    if (!payment.traineeName || !payment.transactionReference || !payment.proofFileName || !payment.amount || payment.amount < 1) {
      setNotice('Add a trainee, transaction reference and proof file name to record payment.');
      return;
    }
    if (!proof) {
      setNotice('Choose an image or PDF as proof of payment.');
      return;
    }
    if (proof.size > 10 * 1024 * 1024) {
      setNotice('Proof files must be 10 MB or smaller.');
      return;
    }
    setSavingProof(true);
    try {
      await savePaymentProof(paymentId, proof);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save the proof file in this browser.');
      setSavingProof(false);
      return;
    }
    updateState(current => ({ ...current, payments: [...current.payments, payment] }));
    form.reset();
    setSessionForPayment(null);
    setNotice('Trainee payment recorded for review.');
    setSavingProof(false);
  }

  async function downloadProof(payment: TrainingPayment) {
    try {
      const proof = await getPaymentProof(payment.proofFileId);
      if (!proof) {
        setNotice('The proof file is not available in this browser.');
        return;
      }
      const url = URL.createObjectURL(proof);
      const link = document.createElement('a');
      link.href = url;
      link.download = payment.proofFileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not open the proof file.');
    }
  }

  function savePaymentSettings(publish: boolean) {
    const settings = paymentSettingsDraft;
    if (publish && (!settings.amount.trim() || Number(settings.amount) <= 0 || !settings.currency.trim() || !settings.bankName.trim() || !settings.accountName.trim() || !settings.accountNumber.trim())) {
      setNotice('Add a valid fee and complete bank details before publishing payment instructions.');
      return;
    }
    updateState(current => ({ ...current, paymentSettings: { ...settings, published: publish } }));
    setPaymentSettingsDraft({ ...settings, published: publish });
    setNotice(publish ? 'Payment instructions published for trainees.' : 'Payment details saved as unpublished.');
  }

  function addPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const partner: InnovationPartner = {
      id: newId('partner'),
      name: String(data.get('name')).trim(),
      contact: String(data.get('contact')).trim(),
      purpose: String(data.get('purpose')).trim(),
      mouStatus: String(data.get('mouStatus')) as PartnerMouStatus,
      mouReference: String(data.get('mouReference')).trim(),
    };
    if (!partner.name || !partner.contact || !partner.purpose) return;
    if (partner.mouStatus === 'Signed' && !partner.mouReference) {
      setNotice('A signed MoU reference is required before recording a partner as approved.');
      return;
    }
    updateState(current => ({ ...current, partners: [...current.partners, partner] }));
    event.currentTarget.reset();
    closeForm();
    setNotice('Partner record added.');
  }

  function savePartnerMou(event: FormEvent<HTMLFormElement>, partnerId: string) {
    event.preventDefault();
    const draft = partnerDrafts[partnerId];
    if (!draft) return;
    if (draft.mouStatus === 'Signed' && !draft.mouReference.trim()) {
      setNotice('A signed MoU reference is required before recording a partner as approved.');
      return;
    }
    updateState(current => ({
      ...current,
      partners: current.partners.map(partner => partner.id === partnerId ? { ...partner, ...draft, mouReference: draft.mouReference.trim() } : partner),
    }));
    setPartnerDrafts(current => { const next = { ...current }; delete next[partnerId]; return next; });
    setNotice('MoU status saved.');
  }

  function addAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const asset: PodAsset = {
      id: newId('asset'),
      name: String(data.get('name')).trim(),
      category: String(data.get('category')).trim(),
      status: 'Available',
      assignedTo: '',
      issue: '',
      managerNotified: false,
      updatedAt: new Date().toISOString(),
    };
    if (!asset.name || !asset.category) return;
    updateState(current => ({ ...current, assets: [...current.assets, asset] }));
    event.currentTarget.reset();
    closeForm();
    setNotice('Equipment added to the register.');
  }

  function saveAsset(event: FormEvent<HTMLFormElement>, assetId: string) {
    event.preventDefault();
    const draft = assetDrafts[assetId];
    if (!draft) return;
    if (draft.status === 'Needs repair' && !draft.issue.trim()) {
      setNotice('Describe the repair issue so both managers can follow up.');
      return;
    }
    updateState(current => ({
      ...current,
      assets: current.assets.map(asset => asset.id === assetId ? {
        ...asset,
        ...draft,
        issue: draft.status === 'Needs repair' ? draft.issue.trim() : '',
        managerNotified: draft.status === 'Needs repair',
        updatedAt: new Date().toISOString(),
      } : asset),
    }));
    setAssetDrafts(current => { const next = { ...current }; delete next[assetId]; return next; });
    setNotice(draft.status === 'Needs repair' ? 'Repair issue recorded for both managers.' : 'Equipment record updated.');
  }

  function reviewPayment(paymentId: string, status: TrainingPayment['status']) {
    updateState(current => ({
      ...current,
      payments: current.payments.map(payment => payment.id === paymentId ? { ...payment, status } : payment),
    }));
    setNotice(`Payment marked ${status.toLowerCase()}.`);
  }

  const upcoming = state.sessions.filter(session => `${session.date}T${session.endTime}` >= new Date().toISOString().slice(0, 16)).slice(0, 3);
  const pendingPayments = state.payments.filter(payment => payment.status !== 'Verified').length;
  const repairCount = state.assets.filter(asset => asset.status === 'Needs repair').length;
  const unsignedPartners = state.partners.filter(partner => partner.mouStatus !== 'Signed' || !partner.mouReference).length;
  const managerNames = state.managers.map(manager => manager.name).join(' and ');

  return (
    <main className="operations-page page-enter" data-testid="page-operations">
      <header className="operations-header">
        <div>
          <div className="operations-eyebrow"><span /> OPERATIONS WORKSPACE</div>
          <h1>Operations</h1>
          <p>Keep UniPod departments, training, partnerships and equipment moving.</p>
        </div>
        <div className="operations-header-meta" data-testid="text-local-prototype">
          <span className="operations-live-dot" /> Local prototype
          <small>Changes stay in this browser</small>
        </div>
      </header>

      <nav className="operations-tabs" aria-label="Operations sections" data-testid="nav-operations-tabs">
        {tabs.map((tab, index) => (
          <button key={tab} type="button" className={activeTab === tab ? 'is-active' : ''} aria-current={activeTab === tab ? 'page' : undefined}
            onClick={() => goTo(tab)} data-testid={`tab-operations-${index + 1}`}>
            {tab}<ChevronRight className="operations-tab-chevron" size={13} aria-hidden="true" />
          </button>
        ))}
      </nav>

      {notice && <div className="operations-notice" role="status" data-testid="status-operations-notice"><CheckCircle2 size={16} />{notice}<button type="button" aria-label="Dismiss message" data-testid="button-dismiss-notice" onClick={() => setNotice('')}>Dismiss</button></div>}

      {activeTab === 'Overview' && (
        <section className="operations-content" aria-label="Operations overview">
          <div className="operations-overview-banner">
            <div className="operations-overview-copy">
              <span className="operations-overview-kicker">A clear view of what needs attention</span>
              <h2>Make the next step<br /><em>easy to see.</em></h2>
              <p>Review scheduled work, keep records current, and give trainees accurate payment instructions.</p>
            </div>
            <div className="operations-banner-mark" aria-hidden="true"><ClipboardList size={30} /><span>UNI<br />POD</span></div>
            <div className="operations-banner-foot"><span>01 — OPERATIONS</span><span>MANAGER DESK</span></div>
          </div>

          <div className="operations-metrics" data-testid="group-operations-metrics">
            <article className="operations-metric"><span>Departments</span><strong data-testid="value-department-count">{state.departments.length}</strong><small>Teams currently registered</small><BriefcaseBusiness size={17} /></article>
            <article className="operations-metric"><span>Sessions ahead</span><strong data-testid="value-upcoming-session-count">{upcoming.length}</strong><small>Scheduled multimedia training</small><CalendarDays size={17} /></article>
            <article className="operations-metric operations-metric-attention"><span>Payments to review</span><strong data-testid="value-pending-payment-count">{pendingPayments}</strong><small>Pending or needs an update</small><Banknote size={17} /></article>
            <article className="operations-metric"><span>Equipment repairs</span><strong data-testid="value-equipment-repair-count">{repairCount}</strong><small>On-site issues reported</small><Wrench size={17} /></article>
          </div>

          <div className="operations-overview-grid">
            <section className="operations-panel operations-attention-panel">
              <PanelHeading title="Next actions" detail="Work that may need a manager's attention." />
              {pendingPayments + repairCount + unsignedPartners === 0
                ? <EmptyState title="No open items" detail="New reviews and follow-ups will appear here when they are recorded." icon={<Check size={18} />} />
                : <div className="operations-action-list">
                  {pendingPayments > 0 && <button type="button" className="operations-action-row" onClick={() => goTo('Training & payments')} data-testid="action-review-payments"><span className="operations-action-icon"><Banknote size={17} /></span><span><b>Review trainee payments</b><small>{pendingPayments} payment{pendingPayments === 1 ? '' : 's'} need attention</small></span><ArrowRight size={16} /></button>}
                  {repairCount > 0 && <button type="button" className="operations-action-row" onClick={() => goTo('Equipment')} data-testid="action-review-repairs"><span className="operations-action-icon action-amber"><Wrench size={17} /></span><span><b>Follow up on equipment repairs</b><small>{repairCount} item{repairCount === 1 ? '' : 's'} reported to both managers</small></span><ArrowRight size={16} /></button>}
                  {unsignedPartners > 0 && <button type="button" className="operations-action-row" onClick={() => goTo('UniPod partners')} data-testid="action-review-partners"><span className="operations-action-icon action-slate"><Handshake size={17} /></span><span><b>Confirm partner MoUs</b><small>{unsignedPartners} partner{unsignedPartners === 1 ? '' : 's'} without a signed MoU record</small></span><ArrowRight size={16} /></button>}
                </div>}
              <div className="operations-policy-callout"><ShieldCheck size={16} /><p>Partner work is approved only when a signed MoU and reference are recorded.</p></div>
            </section>

            <section className="operations-panel operations-schedule-panel">
              <PanelHeading title="Upcoming training" detail="Next scheduled classes at UniPod."
                action={<button type="button" className="operations-text-button" onClick={() => goTo('Training & payments')} data-testid="action-open-training">View training <ArrowRight size={14} /></button>} />
              {upcoming.length ? <div className="operations-upcoming-list">{upcoming.map(session => <article className="operations-upcoming-item" key={session.id} data-testid={`item-upcoming-session-${session.id}`}>
                <div className="operations-date-chip"><span>{new Date(`${session.date}T12:00:00`).toLocaleDateString('en-GB', { month: 'short' })}</span><b>{new Date(`${session.date}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit' })}</b></div>
                <div className="operations-upcoming-copy"><b>{session.course}</b><span>{session.startTime}–{session.endTime} · {session.location}</span><small>Instructor: {session.instructor}</small></div>
              </article>)}</div>
                : <EmptyState title="Nothing scheduled yet" detail="Create a multimedia session to put the next class on the calendar." icon={<CalendarDays size={18} />} />}
            </section>
          </div>

          <section className="operations-panel operations-manager-panel">
            <PanelHeading title="People responsible" detail="Both UniPod managers are administrators for this workspace." />
            <div className="operations-manager-list">{state.managers.map((manager, index) => <article className="operations-manager" key={manager.id} data-testid={`item-manager-${manager.id}`}>
              <span className={`operations-initials manager-initials-${index + 1}`}>{manager.name.split(' ').filter(Boolean).map(part => part[0]).join('').replace('.', '').slice(0, 2)}</span>
              <span><b data-testid={`text-manager-name-${manager.id}`}>{manager.name}</b><small>{manager.role}</small></span><ShieldCheck size={16} aria-label="Administrator" />
            </article>)}</div>
          </section>

          <section className="operations-panel operations-policy-panel">
            <PanelHeading title="Working policies" detail="Shared expectations for UniPod operations." />
            <div className="operations-policy-grid">
              <article><span className="operations-policy-icon"><FileText size={16} /></span><div><b>Brief routing</b><p data-testid="text-policy-brief-routing">{state.policies.briefRouting}</p></div></article>
              <article><span className="operations-policy-icon"><Users size={16} /></span><div><b>Staffing & instruction</b><p data-testid="text-policy-staffing">{state.policies.staffing}</p></div></article>
              <article><span className="operations-policy-icon"><HardDrive size={16} /></span><div><b>Equipment use</b><p data-testid="text-policy-equipment">{state.policies.equipment}</p></div></article>
            </div>
          </section>
        </section>
      )}

      {activeTab === 'Departments & mentorship' && (
        <section className="operations-content">
          <div className="operations-section-intro"><div><div className="operations-eyebrow">PEOPLE & TEAMS</div><h2>Departments & mentorship</h2><p>Assign department ownership and keep startup support focused on its next step.</p></div>
            <button type="button" className="operations-button operations-button-primary" onClick={() => setOpenForm(openForm === 'department' ? null : 'department')} data-testid="button-add-department"><Plus size={15} />Add department</button></div>
          <div className="operations-split-grid">
            <section className="operations-panel">
              <PanelHeading title="UniPod departments" detail={`${state.departments.length} department${state.departments.length === 1 ? '' : 's'} in the register`} />
              {openForm === 'department' && <form className="operations-form" onSubmit={addDepartment} data-testid="form-add-department">
                <div className="operations-form-title"><h3>New department</h3><button type="button" className="operations-icon-button" onClick={closeForm} aria-label="Close department form" data-testid="button-close-department-form">×</button></div>
                <div className="operations-form-grid">
                  <FormField label="Department name"><input name="name" required maxLength={90} data-testid="input-department-name" /></FormField>
                  <FormField label="Department manager"><select name="manager" required defaultValue="" data-testid="select-department-manager"><option value="" disabled>Select a manager</option>{state.managers.map(manager => <option key={manager.id} value={manager.name}>{manager.name}</option>)}</select></FormField>
                  <FormField label="Mentor"><input name="mentor" required maxLength={100} data-testid="input-department-mentor" /></FormField>
                  <FormField label="Supervised group"><input name="supervisedGroup" required maxLength={120} data-testid="input-supervised-group" /></FormField>
                </div>
                <div className="operations-form-actions"><button className="operations-button operations-button-primary" type="submit" data-testid="button-save-department">Save department</button></div>
              </form>}
              {state.departments.length ? <div className="operations-record-list">{state.departments.map(department => <article className="operations-record-card" key={department.id} data-testid={`card-department-${department.id}`}>
                <div className="operations-record-top"><span className="operations-record-icon"><BriefcaseBusiness size={17} /></span><span className="operations-record-main"><b data-testid={`text-department-name-${department.id}`}>{department.name}</b><small>Supervised group · {department.supervisedGroup}</small></span><StatusPill tone="green">Active</StatusPill></div>
                <div className="operations-record-meta"><span><small>Manager</small><b>{department.manager}</b></span><span><small>Mentor</small><b>{department.mentor}</b></span></div>
              </article>)}</div>
                : <EmptyState title="No departments registered" detail="Add a department and assign its manager, mentor and supervised group." icon={<BriefcaseBusiness size={18} />} />}
            </section>
            <section className="operations-panel">
              <PanelHeading title="Startup mentorship" detail={`${state.startups.length} mentorship record${state.startups.length === 1 ? '' : 's'}`} action={<button type="button" className="operations-text-button" onClick={() => setOpenForm(openForm === 'mentorship' ? null : 'mentorship')} data-testid="button-add-mentorship"><Plus size={14} />Add startup</button>} />
              {openForm === 'mentorship' && <form className="operations-form" onSubmit={addMentorship} data-testid="form-add-mentorship">
                <div className="operations-form-title"><h3>New mentorship record</h3><button type="button" className="operations-icon-button" onClick={closeForm} aria-label="Close mentorship form" data-testid="button-close-mentorship-form">×</button></div>
                <div className="operations-form-grid">
                  <FormField label="Startup name"><input name="startupName" required maxLength={100} data-testid="input-startup-name" /></FormField>
                  <FormField label="Founder"><input name="founder" required maxLength={100} data-testid="input-startup-founder" /></FormField>
                  <FormField label="Department"><input name="department" required maxLength={90} list="operations-departments-list" data-testid="input-startup-department" /><datalist id="operations-departments-list">{state.departments.map(department => <option key={department.id} value={department.name} />)}</datalist></FormField>
                  <FormField label="Mentor"><input name="mentor" required maxLength={100} data-testid="input-startup-mentor" /></FormField>
                  <FormField label="Maturity stage"><select name="stage" defaultValue="Idea" data-testid="select-startup-stage">{stages.map(stage => <option key={stage}>{stage}</option>)}</select></FormField>
                  <FormField label="Next follow-up"><input name="nextFollowUp" type="date" required data-testid="input-startup-follow-up" /></FormField>
                  <FormField label="Capacity-building needs" className="operations-field-wide"><textarea name="capacityNeeds" rows={2} maxLength={500} data-testid="input-startup-capacity-needs" /></FormField>
                  <FormField label="Notes" className="operations-field-wide"><textarea name="notes" rows={2} maxLength={700} data-testid="input-startup-notes" /></FormField>
                </div>
                <div className="operations-form-actions"><button className="operations-button operations-button-primary" type="submit" data-testid="button-save-mentorship">Save mentorship record</button></div>
              </form>}
              {state.startups.length ? <div className="operations-record-list">{state.startups.map(startup => <article className="operations-record-card" key={startup.id} data-testid={`card-mentorship-${startup.id}`}>
                <div className="operations-record-top"><span className="operations-record-icon record-icon-lime"><LightbulbIcon /></span><span className="operations-record-main"><b data-testid={`text-startup-name-${startup.id}`}>{startup.startupName}</b><small>{startup.founder} · {startup.department}</small></span><StatusPill tone="olive">{startup.stage}</StatusPill></div>
                <div className="operations-record-meta"><span><small>Mentor</small><b>{startup.mentor}</b></span><span><small>Next follow-up</small><b>{shortDate(startup.nextFollowUp)}</b></span></div>
                {startup.capacityNeeds && <p className="operations-record-note"><strong>Capacity needs</strong>{startup.capacityNeeds}</p>}
                {startup.notes && <p className="operations-record-note"><strong>Notes</strong>{startup.notes}</p>}
              </article>)}</div>
                : <EmptyState title="No startups in mentorship" detail="Record a founder, mentor, maturity stage and next follow-up when a startup is ready for support." icon={<Users size={18} />} />}
            </section>
          </div>
        </section>
      )}

      {activeTab === 'Training & payments' && (
        <section className="operations-content">
          <div className="operations-section-intro"><div><div className="operations-eyebrow">SCHEDULED LEARNING</div><h2>Training & payments</h2><p>Publish accurate payment instructions, schedule instructors and review proof per session.</p></div>
            <button type="button" className="operations-button operations-button-primary" onClick={() => setOpenForm(openForm === 'session' ? null : 'session')} data-testid="button-create-session"><Plus size={15} />Schedule session</button></div>

          <section className="operations-trainee-notice" data-testid="notice-trainee-payment">
            <span className="operations-notice-icon"><Banknote size={19} /></span><div><b>Trainee payment instructions</b><p>Trainees pay <strong>per session</strong> and submit proof of payment for that session. Payment is made outside this workspace; staff review the submitted transaction reference and proof here.</p></div>
          </section>

          <div className="operations-training-grid">
            <section className="operations-panel operations-payment-settings">
              <PanelHeading title="Fee & bank details" detail={state.paymentSettings.published ? 'Published instructions visible to trainees.' : 'Unpublished — trainees will not see bank details yet.'}
                action={<StatusPill tone={state.paymentSettings.published ? 'green' : 'amber'}>{state.paymentSettings.published ? 'Published' : 'Unpublished'}</StatusPill>} />
              <form className="operations-form operations-settings-form" onSubmit={event => { event.preventDefault(); savePaymentSettings(false); }} data-testid="form-payment-settings">
                <div className="operations-form-grid">
                  <FormField label="Fee per session"><div className="operations-amount-field"><input aria-label="Fee amount" type="number" min="1" step="any" value={paymentSettingsDraft.amount} onChange={event => setPaymentSettingsDraft(current => ({ ...current, amount: event.target.value }))} data-testid="input-payment-amount" /><select aria-label="Fee currency" value={paymentSettingsDraft.currency} onChange={event => setPaymentSettingsDraft(current => ({ ...current, currency: event.target.value }))} data-testid="select-payment-currency"><option value="UGX">UGX</option><option value="USD">USD</option><option value="KES">KES</option><option value="TZS">TZS</option></select></div></FormField>
                  <FormField label="Bank name"><input value={paymentSettingsDraft.bankName} onChange={event => setPaymentSettingsDraft(current => ({ ...current, bankName: event.target.value }))} maxLength={100} data-testid="input-bank-name" /></FormField>
                  <FormField label="Account name"><input value={paymentSettingsDraft.accountName} onChange={event => setPaymentSettingsDraft(current => ({ ...current, accountName: event.target.value }))} maxLength={120} data-testid="input-account-name" /></FormField>
                  <FormField label="Account number"><input value={paymentSettingsDraft.accountNumber} onChange={event => setPaymentSettingsDraft(current => ({ ...current, accountNumber: event.target.value }))} maxLength={80} data-testid="input-account-number" /></FormField>
                  <FormField label="Trainee instructions" className="operations-field-wide"><textarea rows={2} value={paymentSettingsDraft.instructions} onChange={event => setPaymentSettingsDraft(current => ({ ...current, instructions: event.target.value }))} maxLength={600} data-testid="input-payment-instructions" /></FormField>
                  <FormField label="WhatsApp group URL" className="operations-field-wide"><input type="url" placeholder="https://" value={paymentSettingsDraft.whatsappGroupUrl} onChange={event => setPaymentSettingsDraft(current => ({ ...current, whatsappGroupUrl: event.target.value }))} data-testid="input-training-whatsapp-url" /></FormField>
                </div>
                <p className="operations-form-hint">Bank details are blank by default. Enter verified details before publishing; this workspace does not process payments.</p>
                <div className="operations-form-actions operations-settings-actions">
                  <button className="operations-button operations-button-outline" type="submit" data-testid="button-save-unpublished-payment">Save as unpublished</button>
                  <button className="operations-button operations-button-primary" type="button" onClick={() => savePaymentSettings(true)} data-testid="button-publish-payment">Publish to trainees</button>
                </div>
              </form>
              {state.paymentSettings.published && <div className="operations-published-details" data-testid="card-published-payment-details">
                <div className="operations-published-head"><CheckCircle2 size={15} /><b>Published trainee view</b></div>
                <p><strong>{state.paymentSettings.currency} {state.paymentSettings.amount}</strong> per session</p>
                <dl><div><dt>Bank</dt><dd>{state.paymentSettings.bankName}</dd></div><div><dt>Account name</dt><dd>{state.paymentSettings.accountName}</dd></div><div><dt>Account number</dt><dd>{state.paymentSettings.accountNumber}</dd></div></dl>
                {state.paymentSettings.instructions && <p className="operations-published-instructions">{state.paymentSettings.instructions}</p>}
                {state.paymentSettings.whatsappGroupUrl && <a href={state.paymentSettings.whatsappGroupUrl} target="_blank" rel="noreferrer" data-testid="link-training-whatsapp">Join the training WhatsApp group <ArrowRight size={13} /></a>}
              </div>}
            </section>
            <section className="operations-panel operations-sessions-panel">
              <PanelHeading title="Scheduled sessions" detail={`${state.sessions.length} recorded session${state.sessions.length === 1 ? '' : 's'}`} />
              {openForm === 'session' && <form className="operations-form" onSubmit={addSession} data-testid="form-create-session">
                <div className="operations-form-title"><h3>Schedule multimedia training</h3><button type="button" className="operations-icon-button" onClick={closeForm} aria-label="Close session form" data-testid="button-close-session-form">×</button></div>
                <div className="operations-form-grid">
                  <FormField label="Course"><select name="course" defaultValue={trainingCourses[0]} data-testid="select-session-course">{trainingCourses.map(course => <option key={course}>{course}</option>)}</select></FormField>
                  <FormField label="Instructor"><input name="instructor" required maxLength={100} data-testid="input-session-instructor" /></FormField>
                  <FormField label="Date"><input name="date" type="date" required data-testid="input-session-date" /></FormField>
                  <FormField label="Location"><input name="location" required maxLength={120} data-testid="input-session-location" /></FormField>
                  <FormField label="Start time"><input name="startTime" type="time" required data-testid="input-session-start-time" /></FormField>
                  <FormField label="End time"><input name="endTime" type="time" required data-testid="input-session-end-time" /></FormField>
                  <FormField label="Capacity"><input name="capacity" type="number" min="1" step="1" required data-testid="input-session-capacity" /></FormField>
                </div>
                <div className="operations-form-actions"><button className="operations-button operations-button-primary" type="submit" data-testid="button-save-session">Add to schedule</button></div>
              </form>}
              {state.sessions.length ? <div className="operations-session-list">{state.sessions.map(session => {
                const sessionPayments = state.payments.filter(payment => payment.sessionId === session.id);
                return <article className="operations-session-card" key={session.id} data-testid={`card-training-session-${session.id}`}>
                  <div className="operations-session-top"><span className="operations-course-mark"><Camera size={17} /></span><div><span className="operations-course-label">MULTIMEDIA TRAINING</span><h3 data-testid={`text-session-course-${session.id}`}>{session.course}</h3></div><span className="operations-capacity">{sessionPayments.length}/{session.capacity}<small>recorded</small></span></div>
                  <div className="operations-session-details"><span><CalendarDays size={14} />{shortDate(session.date)}</span><span><Clock3 size={14} />{session.startTime}–{session.endTime}</span><span><MapPin size={14} />{session.location}</span></div>
                  <div className="operations-session-instructor">Instructor <b>{session.instructor}</b></div>
                  <div className="operations-session-actions">{state.paymentSettings.published
                    ? <button type="button" className="operations-button operations-button-outline" onClick={() => setSessionForPayment(sessionForPayment === session.id ? null : session.id)} data-testid={`button-record-payment-${session.id}`}><Plus size={14} />Record trainee payment</button>
                    : <span className="operations-form-hint">Publish the fee and bank details to record trainee payments.</span>}<span>{sessionPayments.length} payment record{sessionPayments.length === 1 ? '' : 's'}</span></div>
                  {state.paymentSettings.published && sessionForPayment === session.id && <form className="operations-form operations-payment-form" onSubmit={event => addPayment(event, session.id)} data-testid={`form-record-payment-${session.id}`}>
                    <div className="operations-form-title"><h3>Record a trainee payment</h3><button type="button" className="operations-icon-button" onClick={() => setSessionForPayment(null)} aria-label="Close payment form" data-testid={`button-close-payment-form-${session.id}`}>×</button></div>
                     <p className="operations-form-hint">Fee recorded for this session: <strong>{state.paymentSettings.currency} {Number(state.paymentSettings.amount).toLocaleString()}</strong>.</p>
                    <div className="operations-form-grid">
                      <FormField label="Trainee name"><input name="traineeName" required maxLength={100} data-testid={`input-trainee-name-${session.id}`} /></FormField>
                      <FormField label="Transaction reference"><input name="transactionReference" required maxLength={120} data-testid={`input-transaction-reference-${session.id}`} /></FormField>
                      <FormField label="Proof of payment"><input name="proof" type="file" required accept="image/*,.pdf" data-testid={`input-payment-proof-${session.id}`} /></FormField>
                    </div>
                     <p className="operations-form-hint">Proof files are saved only in this browser. Confirm the actual payment outside this workspace.</p>
                     <div className="operations-form-actions"><button className="operations-button operations-button-primary" type="submit" disabled={savingProof} data-testid={`button-save-payment-${session.id}`}>{savingProof ? 'Saving proof…' : 'Add to review'}</button></div>
                  </form>}
                  {sessionPayments.length > 0 && <div className="operations-payment-list"><h4>Payment proof & review</h4>{sessionPayments.map(payment => <article className="operations-payment-row" key={payment.id} data-testid={`row-training-payment-${payment.id}`}>
                    <span className="operations-payment-person"><b>{payment.traineeName}</b><small>{payment.transactionReference} · {payment.currency} {payment.amount}</small><small className="operations-proof-name"><FileText size={12} />{payment.proofFileName}</small></span>
                    <div className="operations-payment-review"><StatusPill tone={payment.status === 'Verified' ? 'green' : payment.status === 'Needs update' ? 'amber' : 'blue'}>{payment.status}</StatusPill><button type="button" className="operations-button operations-button-outline" onClick={() => void downloadProof(payment)} data-testid={`button-download-proof-${payment.id}`}>View proof</button>
                      {payment.status !== 'Verified' ? <div className="operations-review-buttons"><button type="button" onClick={() => reviewPayment(payment.id, 'Verified')} data-testid={`button-verify-payment-${payment.id}`}>Verify</button><button type="button" onClick={() => reviewPayment(payment.id, 'Needs update')} data-testid={`button-needs-update-payment-${payment.id}`}>Request update</button></div> : <span className="operations-verified-label"><Check size={13} />Reviewed</span>}
                    </div>
                  </article>)}</div>}
                </article>;
              })}</div>
                : <EmptyState title="No sessions scheduled" detail="Add a photography, videography, campaign marketing or production class led by a scheduled instructor." icon={<CalendarDays size={18} />} />}
            </section>
          </div>
        </section>
      )}

      {activeTab === 'UniPod partners' && (
        <section className="operations-content">
          <div className="operations-section-intro"><div><div className="operations-eyebrow">PARTNERSHIPS</div><h2>UniPod partners</h2><p>Track partner contacts and MoU progress. A signed MoU is required before partner work is approved.</p></div>
            <button type="button" className="operations-button operations-button-primary" onClick={() => setOpenForm(openForm === 'partner' ? null : 'partner')} data-testid="button-add-partner"><Plus size={15} />Add partner</button></div>
          <div className="operations-partner-rule" data-testid="notice-partner-mou"><ShieldCheck size={18} /><p><b>Approval rule</b> Partner work is not approved while an MoU is required or under review. Record a signed MoU and its reference before describing work as approved.</p></div>
          <section className="operations-panel">
            <PanelHeading title="Partner register" detail={`${state.partners.length} partner${state.partners.length === 1 ? '' : 's'} recorded`} />
            {openForm === 'partner' && <form className="operations-form operations-partner-form" onSubmit={addPartner} data-testid="form-add-partner">
              <div className="operations-form-title"><h3>New partner record</h3><button type="button" className="operations-icon-button" onClick={closeForm} aria-label="Close partner form" data-testid="button-close-partner-form">×</button></div>
              <div className="operations-form-grid">
                <FormField label="Partner organisation"><input name="name" required maxLength={120} data-testid="input-partner-name" /></FormField>
                <FormField label="Contact person or details"><input name="contact" required maxLength={120} data-testid="input-partner-contact" /></FormField>
                <FormField label="Purpose of partnership" className="operations-field-wide"><textarea name="purpose" rows={2} required maxLength={500} data-testid="input-partner-purpose" /></FormField>
                <FormField label="MoU status"><select name="mouStatus" defaultValue="Required" data-testid="select-partner-mou-status">{mouStatuses.map(status => <option key={status}>{status}</option>)}</select></FormField>
                <FormField label="Signed MoU reference"><input name="mouReference" maxLength={120} data-testid="input-partner-mou-reference" /></FormField>
              </div>
              <p className="operations-form-hint">If marking an MoU signed, provide its reference. Partner work remains unapproved until then.</p>
              <div className="operations-form-actions"><button className="operations-button operations-button-primary" type="submit" data-testid="button-save-partner">Save partner</button></div>
            </form>}
            {state.partners.length ? <div className="operations-partner-list">{state.partners.map(partner => {
              const draft = partnerDrafts[partner.id] ?? { mouStatus: partner.mouStatus, mouReference: partner.mouReference };
              const approved = partner.mouStatus === 'Signed' && Boolean(partner.mouReference.trim());
              return <article className="operations-partner-card" key={partner.id} data-testid={`card-partner-${partner.id}`}>
                <div className="operations-partner-main"><span className="operations-record-icon partner-icon"><Handshake size={18} /></span><div><h3 data-testid={`text-partner-name-${partner.id}`}>{partner.name}</h3><p>{partner.purpose}</p></div><StatusPill tone={approved ? 'green' : partner.mouStatus === 'Under review' ? 'blue' : 'amber'}>{approved ? 'Signed MoU' : partner.mouStatus}</StatusPill></div>
                <div className={`operations-approval-copy ${approved ? 'is-approved' : ''}`} data-testid={`status-partner-approval-${partner.id}`}><span>{approved ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}</span>{approved ? `Approved for partner work · MoU ${partner.mouReference}` : 'Partner work is not approved until a signed MoU is recorded.'}</div>
                <div className="operations-partner-contact"><span><small>Contact</small><b>{partner.contact}</b></span>{partner.mouReference && <span><small>MoU reference</small><b>{partner.mouReference}</b></span>}</div>
                <form className="operations-mou-form" onSubmit={event => savePartnerMou(event, partner.id)} data-testid={`form-partner-mou-${partner.id}`}>
                  <FormField label="MoU status"><select value={draft.mouStatus} onChange={event => setPartnerDrafts(current => ({ ...current, [partner.id]: { ...draft, mouStatus: event.target.value as PartnerMouStatus } }))} data-testid={`select-mou-status-${partner.id}`}>{mouStatuses.map(status => <option key={status}>{status}</option>)}</select></FormField>
                  <FormField label="MoU reference"><input value={draft.mouReference} onChange={event => setPartnerDrafts(current => ({ ...current, [partner.id]: { ...draft, mouReference: event.target.value } }))} maxLength={120} data-testid={`input-mou-reference-${partner.id}`} /></FormField>
                  <button type="submit" className="operations-button operations-button-outline" data-testid={`button-save-mou-${partner.id}`}>Save MoU status</button>
                </form>
              </article>;
            })}</div>
              : <EmptyState title="No partners recorded" detail="Add an organisation, contact, purpose and MoU status when a partnership is ready to track." icon={<Handshake size={18} />} />}
          </section>
        </section>
      )}

      {activeTab === 'Equipment' && (
        <section className="operations-content">
          <div className="operations-section-intro"><div><div className="operations-eyebrow">UNIPOD ASSETS</div><h2>Equipment register</h2><p>Track availability, on-site use and repairs across the equipment held at UniPod.</p></div>
            <button type="button" className="operations-button operations-button-primary" onClick={() => setOpenForm(openForm === 'asset' ? null : 'asset')} data-testid="button-add-equipment"><Plus size={15} />Add equipment</button></div>
          <div className="operations-equipment-rule"><HardDrive size={19} /><div><b>On-site use only</b><p>UniPod equipment stays on-site. Record in-use status only for use at the Pod; report repair issues for manager follow-up.</p></div><span>POLICY</span></div>
          <section className="operations-panel">
            <PanelHeading title="Asset register" detail={`${state.assets.length} item${state.assets.length === 1 ? '' : 's'} · ${repairCount} repair${repairCount === 1 ? '' : 's'} requiring follow-up`} />
            {openForm === 'asset' && <form className="operations-form operations-asset-add-form" onSubmit={addAsset} data-testid="form-add-equipment">
              <div className="operations-form-title"><h3>Add equipment</h3><button type="button" className="operations-icon-button" onClick={closeForm} aria-label="Close equipment form" data-testid="button-close-equipment-form">×</button></div>
              <div className="operations-form-grid">
                <FormField label="Equipment name"><input name="name" required maxLength={100} data-testid="input-equipment-name" /></FormField>
                <FormField label="Category"><input name="category" required maxLength={80} data-testid="input-equipment-category" /></FormField>
              </div>
              <div className="operations-form-actions"><button className="operations-button operations-button-primary" type="submit" data-testid="button-save-equipment">Add to register</button></div>
            </form>}
            {state.assets.length ? <div className="operations-asset-list">{state.assets.map((asset, index) => {
              const draft = assetDrafts[asset.id] ?? { status: asset.status, assignedTo: asset.assignedTo, issue: asset.issue };
              return <article className="operations-asset-card" key={asset.id} data-testid={`card-equipment-${asset.id}`}>
                <div className="operations-asset-heading"><span className={`operations-asset-icon asset-tone-${index % 3}`}><HardDrive size={18} /></span><span><b data-testid={`text-equipment-name-${asset.id}`}>{asset.name}</b><small>{asset.category}</small></span><StatusPill tone={asset.status === 'Available' ? 'green' : asset.status === 'Needs repair' ? 'amber' : 'blue'}>{asset.status}</StatusPill></div>
                {asset.status === 'Needs repair' && <div className="operations-repair-alert" data-testid={`notice-equipment-repair-${asset.id}`}><CircleAlert size={15} /><span><b>Repair issue · visible to both managers</b><small>{asset.issue}</small></span><span className="operations-manager-visibility">{managerNames}</span></div>}
                <form className="operations-asset-form" onSubmit={event => saveAsset(event, asset.id)} data-testid={`form-equipment-${asset.id}`}>
                  <FormField label="Status"><select value={draft.status} onChange={event => setAssetDrafts(current => ({ ...current, [asset.id]: { ...draft, status: event.target.value as PodAsset['status'] } }))} data-testid={`select-equipment-status-${asset.id}`}>{assetStatuses.map(status => <option key={status}>{status}</option>)}</select></FormField>
                  <FormField label="In-use at the Pod by"><input value={draft.assignedTo} disabled={draft.status !== 'In use at the Pod'} placeholder={draft.status === 'In use at the Pod' ? 'Name or team' : 'Only needed while in use'} onChange={event => setAssetDrafts(current => ({ ...current, [asset.id]: { ...draft, assignedTo: event.target.value } }))} data-testid={`input-equipment-assigned-${asset.id}`} /></FormField>
                  {draft.status === 'Needs repair' && <FormField label="Repair issue" className="operations-field-wide"><textarea value={draft.issue} onChange={event => setAssetDrafts(current => ({ ...current, [asset.id]: { ...draft, issue: event.target.value } }))} required rows={2} maxLength={400} data-testid={`input-equipment-issue-${asset.id}`} /></FormField>}
                  <div className="operations-asset-actions"><span>{asset.updatedAt ? `Updated ${new Date(asset.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Not yet updated'}</span><button type="submit" className="operations-button operations-button-outline" data-testid={`button-save-equipment-${asset.id}`}>{draft.status === 'Needs repair' ? 'Report / update repair' : 'Save equipment status'}</button></div>
                </form>
              </article>;
            })}</div>
              : <EmptyState title="No equipment in the register" detail="Add equipment as it is inventoried. No sample assets are preloaded." icon={<HardDrive size={18} />} />}
          </section>
        </section>
      )}

      <footer className="operations-footer"><span><ShieldCheck size={14} />STAFF OPERATIONS</span><p>Local prototype only. Records are saved in this browser; no login, external payment processing or shared team database is connected.</p></footer>
    </main>
  );
}

function LightbulbIcon() {
  return <BriefcaseBusiness size={17} />;
}

export default OperationsPage;
