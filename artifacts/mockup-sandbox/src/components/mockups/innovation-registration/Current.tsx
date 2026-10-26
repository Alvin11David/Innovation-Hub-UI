import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, Check, FilePlus2, FolderOpen, Lightbulb, Users, X } from "lucide-react";
import "./_group.css";

type IntakeForm = {
  category: string;
  title: string;
  summary: string;
  purpose: string;
  problem: string;
  outcome: string;
  submitter: string;
  email: string;
  studentNumber: string;
  programme: string;
  supervisor: string;
  officer: string;
  receiver: string;
};

export function Current() {
  const steps = ["Submission type", "Project information", "Supporting documents", "Review & register"];
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);
  const [form, setForm] = useState<IntakeForm>({
    category: "Student Project", title: "", summary: "", purpose: "", problem: "", outcome: "",
    submitter: "", email: "", studentNumber: "", programme: "", supervisor: "",
    officer: "Sarah Kintu", receiver: "",
  });
  const field = (name: keyof IntakeForm, value: string) => setForm(current => ({ ...current, [name]: value }));
  const next = () => {
    setError("");
    if (step === 0 && !form.category) return setError("Choose a submission pathway to continue.");
    if (step === 1 && (!form.title || !form.summary || !form.purpose || !form.submitter)) {
      return setError("Complete the title, summary, purpose, and submitter fields.");
    }
    setStep(Math.min(step + 1, 3));
  };
  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []).filter(file => file.size <= 15 * 1024 * 1024);
    setFiles(current => [...current, ...selected.map(file => ({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB` }))]);
    event.currentTarget.value = "";
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setDone(true);
  };

  if (done) return <div className="current-shell"><div className="current-complete"><div className="current-kicker">LOCAL PROTOTYPE RECORD CREATED</div><h1>Intake recorded.</h1><p>Your case was added to this browser’s demonstration workspace.</p></div></div>;

  return (
    <div className="current-shell">
      <div className="current-content">
        <header className="current-heading">
          <div className="current-kicker">STAFF INTAKE</div>
          <h1>Register a submission</h1>
          <p>Capture an incoming project or idea and start a clear, accountable case record.</p>
        </header>
        <div className="current-layout">
          <aside className="current-stepper">
            <div className="current-stepper-label">REGISTRATION FLOW</div>
            {steps.map((label, index) => (
              <button className={`current-step ${step === index ? "active" : ""} ${step > index ? "complete" : ""}`} key={label} onClick={() => index < step && setStep(index)}>
                <span>{step > index ? <Check size={13} /> : `0${index + 1}`}</span><b>{label}</b>
              </button>
            ))}
            <div className="current-staff-note"><Users size={17} /><p>Official intake is a staff workflow. Student details may be recorded by authorized personnel.</p></div>
          </aside>
          <form className="current-panel" onSubmit={submit}>
            <div className="current-panel-head">
              <div><div className="current-kicker">STEP 0{step + 1} / 04</div><h2>{steps[step]}</h2></div>
              <span className="current-progress"><i style={{ width: `${(step + 1) * 25}%` }} /></span>
            </div>
            {step === 0 && <div className="current-type-grid">
              <button type="button" className={`current-type-card ${form.category === "Student Project" ? "selected" : ""}`} onClick={() => field("category", "Student Project")}>
                <span className="current-type-icon"><FolderOpen size={21} /></span><span className="current-type-title">Student project</span><small>For a project associated with a student programme or academic supervision.</small><span className="current-type-bottom">Institutional project pathway <ArrowRight size={14} /></span>
              </button>
              <button type="button" className={`current-type-card ${form.category === "General Innovation" ? "selected" : ""}`} onClick={() => field("category", "General Innovation")}>
                <span className="current-type-icon"><Lightbulb size={21} /></span><span className="current-type-title">General innovation</span><small>For a new idea, initiative, or innovation outside the student-project pathway.</small><span className="current-type-bottom">General innovation pathway <ArrowRight size={14} /></span>
              </button>
            </div>}
            {step === 1 && <div className="current-form-grid">
              <label className="full">Project or idea title *<input value={form.title} onChange={event => field("title", event.target.value)} placeholder="A clear, descriptive title" /></label>
              <label className="full">Short summary *<textarea value={form.summary} onChange={event => field("summary", event.target.value)} placeholder="Describe the idea in a few sentences" /></label>
              <label>Purpose *<textarea value={form.purpose} onChange={event => field("purpose", event.target.value)} placeholder="What is this intended to do?" /></label>
              <label>Problem being addressed<textarea value={form.problem} onChange={event => field("problem", event.target.value)} placeholder="What need or challenge prompted this?" /></label>
              <label>Submitter name *<input value={form.submitter} onChange={event => field("submitter", event.target.value)} placeholder="Name or organization" /></label>
              <label>Contact email<input type="email" value={form.email} onChange={event => field("email", event.target.value)} placeholder="name@example.edu" /></label>
              {form.category === "Student Project" && <><label>Student number<input value={form.studentNumber} onChange={event => field("studentNumber", event.target.value)} placeholder="Optional staff-recorded detail" /></label><label>Programme or department<input value={form.programme} onChange={event => field("programme", event.target.value)} placeholder="Programme / department" /></label><label className="full">Supervisor or lecturer<input value={form.supervisor} onChange={event => field("supervisor", event.target.value)} placeholder="Optional" /></label></>}
              <label>Responsible initiating officer<input value={form.officer} onChange={event => field("officer", event.target.value)} /></label><label>Initial receiving officer<input value={form.receiver} onChange={event => field("receiver", event.target.value)} placeholder="Receiving officer" /></label>
            </div>}
            {step === 2 && <div><div className="current-upload"><FilePlus2 size={23} /><strong>Select supporting files</strong><p>Prototype only. Files remain local to this session; no server upload occurs.</p><input type="file" multiple onChange={addFiles} /><small>Maximum 15 MB each. Optional supporting documents.</small></div>{files.map((file, index) => <div className="current-file" key={`${file.name}-${index}`}><span>{file.name} · {file.size}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(current => current.filter((_, i) => i !== index))}><X size={14} /></button></div>)}</div>}
            {step === 3 && <div><div className="current-summary-band"><span className="current-kicker">{form.category}</span><h3>{form.title || "Untitled submission"}</h3><p>{form.summary || "No summary supplied."}</p></div><div className="current-summary-grid"><div><small>Submitter</small><strong>{form.submitter || "Not supplied"}</strong></div><div><small>Responsible officer</small><strong>{form.officer || "Sarah Kintu"}</strong></div><div><small>Supporting files</small><strong>{files.length} selected locally</strong></div><div><small>Privacy</small><strong>Stored in this browser</strong></div></div></div>}
            {error && <div className="current-error" role="alert">{error}</div>}
            <div className="current-actions">{step > 0 ? <button type="button" className="back" onClick={() => setStep(step - 1)}>Back</button> : <span />}{step < 3 ? <button type="button" onClick={next}>Continue <ArrowRight size={14} /></button> : <button type="submit">Register submission <Check size={14} /></button>}</div>
          </form>
        </div>
      </div>
    </div>
  );
}
