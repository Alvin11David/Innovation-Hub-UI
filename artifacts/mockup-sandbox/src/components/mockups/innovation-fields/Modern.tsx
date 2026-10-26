import './_group.css';
import './Modern.css';

function FormField({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`operations-field ${className}`}><span>{label}</span>{children}</label>;
}

export function Modern() {
  return (
    <div className="field-showcase modern-fields">
      <section className="field-showcase-card">
        <header className="field-showcase-header">
          <span className="field-showcase-kicker">UniPod operations · form fields</span>
          <h1>Modern fields</h1>
          <p>A clearer field system for queues, documents, operations, activity, reports, and settings.</p>
        </header>
        <form className="operations-form-grid">
          <FormField label="Department name"><input autoFocus placeholder="Community Innovation Lab" /></FormField>
          <FormField label="Mentor"><input placeholder="Name of assigned mentor" /></FormField>
          <FormField label="Follow-up date"><input type="date" defaultValue="2026-11-12" /></FormField>
          <FormField label="Session capacity"><input type="number" defaultValue={18} /></FormField>
          <FormField label="Mentor notes" className="operations-field-wide"><textarea rows={3} placeholder="Add context for the next session…" /></FormField>
        </form>
      </section>
    </div>
  );
}
