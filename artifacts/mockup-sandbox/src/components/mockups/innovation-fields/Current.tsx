import './_group.css';

function FormField({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`operations-field ${className}`}><span>{label}</span>{children}</label>;
}

export function Current() {
  return (
    <div className="field-showcase">
      <section className="field-showcase-card">
        <header className="field-showcase-header">
          <span className="field-showcase-kicker">UniPod operations · form fields</span>
          <h1>Current fields</h1>
          <p>Existing text, date, number, and multiline controls extracted from the Operations form pattern.</p>
        </header>
        <form className="operations-form-grid">
          <FormField label="Department name"><input placeholder="Community Innovation Lab" /></FormField>
          <FormField label="Mentor"><input placeholder="Name of assigned mentor" /></FormField>
          <FormField label="Follow-up date"><input type="date" defaultValue="2026-11-12" /></FormField>
          <FormField label="Session capacity"><input type="number" defaultValue={18} /></FormField>
          <FormField label="Mentor notes" className="operations-field-wide"><textarea rows={3} placeholder="Add context for the next session…" /></FormField>
        </form>
      </section>
    </div>
  );
}
