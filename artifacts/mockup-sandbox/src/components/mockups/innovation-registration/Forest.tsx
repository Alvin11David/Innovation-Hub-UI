import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FilePlus2, FolderKanban, Lightbulb, ShieldCheck, Sparkles, X } from "lucide-react";
import "./_group.css";

type IntakeForm = {
  category: "Student Project" | "General Innovation";
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
type LocalFile = { name: string; size: string; key: string };

const steps = [
  { title: "Choose pathway", subtitle: "Route the idea" },
  { title: "Project details", subtitle: "Capture the brief" },
  { title: "Add documents", subtitle: "Optional evidence" },
  { title: "Check & register", subtitle: "Finish intake" },
];

export function Forest() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [form, setForm] = useState<IntakeForm>({
    category: "Student Project", title: "", summary: "", purpose: "", problem: "", outcome: "",
    submitter: "", email: "", studentNumber: "", programme: "", supervisor: "",
    officer: "Sarah Kintu", receiver: "",
  });
  const field = (name: keyof IntakeForm, value: string) => {
    setForm(current => ({ ...current, [name]: value }));
    setError("");
  };
  const validate = () => {
    if (step === 0 && !form.category) return "Choose a pathway before continuing.";
    if (step === 1) {
      const missing = !form.title.trim() || !form.summary.trim() || !form.purpose.trim() || !form.submitter.trim();
      if (missing) return "Add the title, summary, purpose and submitter name to continue.";
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Check the contact email format.";
    }
    return "";
  };
  const next = () => {
    const issue = validate();
    if (issue) return setError(issue);
    setError("");
    setStep(current => Math.min(3, current + 1));
  };
  const previous = () => { setError(""); setStep(current => Math.max(0, current - 1)); };
  const selectStep = (index: number) => {
    if (index < step) { setError(""); setStep(index); }
  };
  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? []);
    const tooLarge = selected.filter(file => file.size > 15 * 1024 * 1024);
    const allowed = selected.filter(file => file.size <= 15 * 1024 * 1024);
    setFiles(current => [...current, ...allowed.map(file => ({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, key: `${file.name}-${file.lastModified}-${file.size}` }))]);
    setError(tooLarge.length ? `${tooLarge.map(file => file.name).join(", ")} exceed the 15 MB limit and were not added.` : "");
    event.currentTarget.value = "";
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const issue = validate();
    if (issue) { setError(issue); setStep(1); return; }
    setError("");
    setComplete(true);
  };

  return (
    <div className="forest-shell">
      <div className="forest-content">
        <div className="forest-topline">
          <div className="forest-brand"><span className="forest-brand-mark"><FolderKanban size={15} /></span><span>INNOVATION HUB <span style={{ color: "#829788" }}>/ INTAKE</span></span></div>
          <span className="forest-local-tag"><i /> LOCAL WORKSPACE · NO UPLOADS</span>
        </div>
        <header className="forest-hero">
          <div><div className="forest-kicker">STAFF INTAKE · 04 STEPS</div><h1>Move a good idea <em>forward.</em></h1><p>Choose a pathway, capture the essential details, and create a clear case record for the people who will help it grow.</p></div>
          <div className="forest-hero-stamp">A CLEAR START<br />A USEFUL NEXT STEP<br />IDEAS IN MOTION ↗</div>
        </header>
        {!complete && <nav className="forest-progress" aria-label="Registration steps">
          {steps.map((item, index) => <button key={item.title} type="button" className={`forest-progress-step ${step === index ? "active" : ""} ${step > index ? "complete" : ""}`} disabled={index > step} aria-current={step === index ? "step" : undefined} onClick={() => selectStep(index)}>
            <span className="forest-progress-num">{step > index ? <Check size={13} /> : `0${index + 1}`}</span><span className="forest-progress-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></span>
          </button>)}
        </nav>}
        <form className="forest-card" onSubmit={submit} noValidate>
          {complete ? <div className="forest-success" role="status"><span className="forest-success-mark"><CheckCircle2 size={25} /></span><div className="forest-kicker" style={{ justifyContent: "center" }}>INTAKE COMPLETE</div><h2>Your idea is in motion.</h2><p>The local demonstration record is ready for the team. No files were uploaded and no one was notified.</p><span className="forest-success-code">STU-2026-008 · ILLUSTRATIVE</span><div className="forest-actions" style={{ justifyContent: "center", border: 0, paddingBottom: 0 }}><button type="button" className="secondary" onClick={() => { setComplete(false); setStep(0); }}>Register another idea <ArrowRight size={14} /></button></div></div> : <>
            <div className="forest-card-head"><div><div className="forest-step-index">STEP 0{step + 1} / 04</div><h2>{steps[step].title}</h2><p>{step === 0 ? "Start with the route that best describes the work." : step === 1 ? "A clear brief gives the receiving team a better first step." : step === 2 ? "Add useful evidence now, or keep moving without it." : "Give the record a final check before it enters the workspace."}</p></div><div className="forest-card-note"><ShieldCheck size={14} /> PRIVATE TO THIS BROWSER</div></div>
            {step === 0 && <div className="forest-type-grid" role="group" aria-label="Submission pathway">
              <button type="button" className={`forest-type-card ${form.category === "Student Project" ? "selected" : ""}`} aria-pressed={form.category === "Student Project"} onClick={() => field("category", "Student Project")}><span className="forest-type-mark"><FolderKanban size={21} /></span>{form.category === "Student Project" && <CheckCircle2 className="forest-selected-check" size={20} />}<h3>Student project</h3><p>Work led by a student and connected to a programme, course or academic supervisor.</p><span className="forest-type-foot">STUDENT PROJECT PATHWAY <ArrowRight size={15} /></span></button>
              <button type="button" className={`forest-type-card ${form.category === "General Innovation" ? "selected" : ""}`} aria-pressed={form.category === "General Innovation"} onClick={() => field("category", "General Innovation")}><span className="forest-type-mark"><Lightbulb size={21} /></span>{form.category === "General Innovation" && <CheckCircle2 className="forest-selected-check" size={20} />}<h3>General innovation</h3><p>A new idea, initiative or community solution outside the student-project pathway.</p><span className="forest-type-foot">GENERAL INNOVATION PATHWAY <ArrowRight size={15} /></span></button>
            </div>}
            {step === 1 && <div className="forest-fields">
              <label className="forest-field full">Project or idea title <span className="forest-required">*</span><input value={form.title} onChange={event => field("title", event.target.value)} placeholder="e.g. Solar-powered cold storage for local markets" aria-required="true" autoFocus /><small>Use a short name the team can recognize in a list.</small></label>
              <label className="forest-field full">Short summary <span className="forest-required">*</span><textarea value={form.summary} onChange={event => field("summary", event.target.value)} placeholder="What is the idea, and who could it help?" aria-required="true" /></label>
              <label className="forest-field">Purpose <span className="forest-required">*</span><textarea value={form.purpose} onChange={event => field("purpose", event.target.value)} placeholder="What do you want this work to achieve?" aria-required="true" /></label>
              <label className="forest-field">Problem being addressed<textarea value={form.problem} onChange={event => field("problem", event.target.value)} placeholder="What need or challenge prompted this?" /></label>
              <label className="forest-field">Submitter name <span className="forest-required">*</span><input value={form.submitter} onChange={event => field("submitter", event.target.value)} placeholder="Name or organization" aria-required="true" /></label>
              <label className="forest-field">Contact email <span style={{ color: "#9caf9f", fontWeight: 500 }}>(optional)</span><input type="email" value={form.email} onChange={event => field("email", event.target.value)} placeholder="name@example.edu" /></label>
              {form.category === "Student Project" && <>
                <label className="forest-field">Student number <span style={{ color: "#9caf9f", fontWeight: 500 }}>(optional)</span><input value={form.studentNumber} onChange={event => field("studentNumber", event.target.value)} placeholder="Recorded by staff at intake" /></label>
                <label className="forest-field">Programme or department<input value={form.programme} onChange={event => field("programme", event.target.value)} placeholder="Programme / department" /></label>
                <label className="forest-field">Supervisor or lecturer<input value={form.supervisor} onChange={event => field("supervisor", event.target.value)} placeholder="Optional" /></label>
              </>}
              <label className="forest-field">Responsible officer<input value={form.officer} onChange={event => field("officer", event.target.value)} /></label>
              <label className="forest-field">Receiving officer<input value={form.receiver} onChange={event => field("receiver", event.target.value)} placeholder="Assign at intake" /></label>
            </div>}
            {step === 2 && <><div className="forest-file-zone"><FilePlus2 size={26} /><h3>Bring the useful evidence</h3><p>Attach a short proposal, reference or supporting file. Each file must be 15 MB or less. This demo only keeps the selection in this browser.</p><label className="forest-actions" style={{ margin: "2px 0 0", padding: 0, border: 0 }}><span className="forest-file-button"><input type="file" multiple onChange={addFiles} aria-label="Choose supporting files" /></span></label><span style={{ color: "#8ea590", fontSize: 8 }}>Supporting evidence is optional</span></div>
              {files.length > 0 && <div className="forest-file-list" aria-label="Selected files">{files.map(file => <div className="forest-file-item" key={file.key}><FilePlus2 size={16} /><span><strong>{file.name}</strong> · {file.size} · Stored locally</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(current => current.filter(item => item.key !== file.key))}><X size={14} /></button></div>)}</div>}
            </>}
            {step === 3 && <div className="forest-review-grid"><div className="forest-review-band"><div className="forest-kicker">{form.category}</div><h3>{form.title || "Project title"}</h3><p>{form.summary || "Your summary will appear here."}</p></div><div className="forest-review-item"><small>SUBMITTER</small><strong>{form.submitter || "Not supplied"}</strong></div><div className="forest-review-item"><small>RESPONSIBLE OFFICER</small><strong>{form.officer || "Sarah Kintu"}</strong></div><div className="forest-review-item"><small>CONTACT EMAIL</small><strong>{form.email || "Not provided"}</strong></div><div className="forest-review-item"><small>SUPPORTING FILES</small><strong>{files.length} selected · local only</strong></div><div className="forest-footnote" style={{ gridColumn: "1/-1" }}><Sparkles size={14} /><span>After registration, staff can review the brief and send it to the relevant UniPod department. Registration does not approve partner work or notify external contacts.</span></div></div>}
            {error && <div className="forest-alert" role="alert">{error}</div>}
            <div className="forest-actions">{step > 0 ? <button type="button" className="secondary" onClick={previous}><ArrowLeft size={14} /> Back</button> : <span className="forest-footnote"><ShieldCheck size={14} /> Staff-entered details stay in this browser demo.</span>}{step < 3 ? <button type="button" onClick={next}>Continue <ArrowRight size={15} /></button> : <button type="submit">Create case record <Check size={15} /></button>}</div>
            {step === 0 && <div className="forest-footnote"><ShieldCheck size={14} /><span>This is a staff intake screen. Student details are recorded only by authorized personnel. No files upload to a server.</span></div>}
          </>}
        </form>
      </div>
    </div>
  );
}
