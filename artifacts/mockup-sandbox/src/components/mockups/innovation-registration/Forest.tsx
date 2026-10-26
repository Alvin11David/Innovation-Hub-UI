import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, Check, CheckCircle2, FilePlus2, FolderKanban, Lightbulb, ShieldCheck, X } from "lucide-react";
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
  const [invalid, setInvalid] = useState<string[]>([]);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [form, setForm] = useState<IntakeForm>({
    category: "Student Project", title: "", summary: "", purpose: "", problem: "", outcome: "",
    submitter: "", email: "", studentNumber: "", programme: "", supervisor: "",
    officer: "Sarah Kintu", receiver: "",
  });
  useEffect(() => { headingRef.current?.focus(); }, [step]);
  const field = (name: keyof IntakeForm, value: string) => {
    setForm(current => ({ ...current, [name]: value }));
    setInvalid(current => current.filter(item => item !== name));
    setError("");
  };
  const validate = () => {
    if (step === 0 && !form.category) return "Choose a pathway before continuing.";
    if (step === 1) {
      const required = ["title", "summary", "purpose", "submitter"].filter(name => !form[name as keyof IntakeForm].trim());
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) required.push("email");
      if (required.length) {
        setInvalid(required);
        return required.includes("email") ? "Check the contact email and complete the required fields." : "Complete the title, summary, purpose, and submitter fields.";
      }
    }
    return "";
  };
  const next = () => {
    const issue = validate();
    if (issue) return setError(issue);
    setInvalid([]);
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

  const report = (name: string) => invalid.includes(name);
  const reviewValue = (value: string) => value.trim() || "Not supplied";
  return <div className="forest-shell">
    <div className="forest-content">
      <div className="forest-topline"><div className="forest-brand"><span className="forest-brand-mark"><FolderKanban size={15}/></span><span>INNOVATION HUB <span>/ STAFF INTAKE</span></span></div><span className="forest-local-tag"><i/> LOCAL WORKSPACE</span></div>
      <header className="forest-hero"><div><div className="forest-kicker">STAFF INTAKE · 04 STEPS</div><h1>Register a <em>submission.</em></h1><p>Record a student project or general innovation with a clear, accountable starting point.</p></div><div className="forest-hero-stamp">CLEAR RECORD<br/>RESPONSIBLE INTAKE</div></header>
      {!complete && <nav className="forest-progress" aria-label="Registration steps">{steps.map((item,index)=><button key={item.title} type="button" className={`forest-progress-step ${step===index?"active":""} ${step>index?"complete":""}`} disabled={index>step} aria-current={step===index?"step":undefined} onClick={()=>selectStep(index)}><span className="forest-progress-num">{step>index?<Check size={13}/>:`0${index+1}`}</span><span className="forest-progress-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></span></button>)}</nav>}
      <form className="forest-card" onSubmit={submit} noValidate>
        {complete?<div className="forest-success" role="status"><span className="forest-success-mark"><CheckCircle2 size={25}/></span><div className="forest-kicker">INTAKE COMPLETE</div><h2>Record created.</h2><p>This prototype confirms the registration interaction only. Files were not uploaded and nobody was notified.</p><div className="forest-actions"><button type="button" onClick={()=>{setComplete(false);setStep(0);setError("");setInvalid([]);}}>Register another submission <ArrowRight size={14}/></button></div></div>:<>
          <div className="forest-card-head"><div><div className="forest-step-index">STEP 0{step+1} / 04</div><h2 ref={headingRef} tabIndex={-1}>{steps[step].title}</h2><p>{step===0?"Choose the pathway that best describes the work.":step===1?"Capture the essentials; optional details can stay blank.":step===2?"Attach useful supporting material, or continue without it.":"Review every detail before creating the record."}</p></div><div className="forest-card-note"><ShieldCheck size={14}/> LOCAL DEMO · NO UPLOADS</div></div>
          {step===0&&<div className="forest-type-grid" role="group" aria-label="Submission pathway"><button type="button" className={`forest-type-card ${form.category==="Student Project"?"selected":""}`} aria-pressed={form.category==="Student Project"} onClick={()=>field("category","Student Project")}><span className="forest-type-mark"><FolderKanban size={21}/></span>{form.category==="Student Project"&&<CheckCircle2 className="forest-selected-check" size={20}/>}<span className="forest-path-code">PATHWAY 01</span><h3>Student project</h3><p>Work connected to a student programme, course, or academic supervision.</p><span className="forest-type-foot">STUDENT PROJECT <ArrowRight size={15}/></span></button><button type="button" className={`forest-type-card ${form.category==="General Innovation"?"selected":""}`} aria-pressed={form.category==="General Innovation"} onClick={()=>field("category","General Innovation")}><span className="forest-type-mark"><Lightbulb size={21}/></span>{form.category==="General Innovation"&&<CheckCircle2 className="forest-selected-check" size={20}/>}<span className="forest-path-code">PATHWAY 02</span><h3>General innovation</h3><p>A new idea or initiative outside the student-project pathway.</p><span className="forest-type-foot">GENERAL INNOVATION <ArrowRight size={15}/></span></button></div>}
          {step===1&&<div className="forest-fields"><div className="forest-field-section">PROJECT OR IDEA <small>* Required fields</small></div>
            <label className={`forest-field full ${report("title")?"has-error":""}`}><span>Project or idea title <i>*</i></span><input value={form.title} onChange={event=>field("title",event.target.value)} placeholder="A clear, descriptive title" aria-required="true" aria-invalid={report("title")} autoComplete="off"/>{report("title")&&<small className="forest-field-error">This field is required.</small>}</label>
            <label className={`forest-field full ${report("summary")?"has-error":""}`}><span>Short summary <i>*</i></span><textarea value={form.summary} onChange={event=>field("summary",event.target.value)} placeholder="Describe the idea and who it could help" aria-required="true" aria-invalid={report("summary")}/>{report("summary")&&<small className="forest-field-error">This field is required.</small>}</label>
            <label className={`forest-field ${report("purpose")?"has-error":""}`}><span>Purpose <i>*</i></span><textarea value={form.purpose} onChange={event=>field("purpose",event.target.value)} placeholder="What is this intended to do?" aria-required="true" aria-invalid={report("purpose")}/>{report("purpose")&&<small className="forest-field-error">This field is required.</small>}</label>
            <label className="forest-field"><span>Problem being addressed <em>Optional</em></span><textarea value={form.problem} onChange={event=>field("problem",event.target.value)} placeholder="What need or challenge prompted this?"/></label>
            <label className="forest-field"><span>Intended outcome <em>Optional</em></span><textarea value={form.outcome} onChange={event=>field("outcome",event.target.value)} placeholder="What would a useful result look like?"/></label>
            <div className="forest-field-section full">SUBMITTER & RESPONSIBILITY</div>
            <label className={`forest-field ${report("submitter")?"has-error":""}`}><span>Submitter name <i>*</i></span><input value={form.submitter} onChange={event=>field("submitter",event.target.value)} placeholder="Name or organization" aria-required="true" aria-invalid={report("submitter")}/>{report("submitter")&&<small className="forest-field-error">This field is required.</small>}</label>
            <label className={`forest-field ${report("email")?"has-error":""}`}><span>Contact email <em>Optional</em></span><input type="email" value={form.email} onChange={event=>field("email",event.target.value)} placeholder="name@example.edu" aria-invalid={report("email")}/>{report("email")&&<small className="forest-field-error">Enter a valid email address.</small>}</label>
            {form.category==="Student Project"&&<><div className="forest-field-section full">STUDENT PROJECT DETAILS <small>Optional staff-recorded details</small></div><label className="forest-field"><span>Student number <em>Optional</em></span><input value={form.studentNumber} onChange={event=>field("studentNumber",event.target.value)} placeholder="Staff-recorded detail"/></label><label className="forest-field"><span>Programme or department <em>Optional</em></span><input value={form.programme} onChange={event=>field("programme",event.target.value)} placeholder="Programme / department"/></label><label className="forest-field full"><span>Supervisor or lecturer <em>Optional</em></span><input value={form.supervisor} onChange={event=>field("supervisor",event.target.value)} placeholder="Name"/></label></>}
            <label className="forest-field"><span>Responsible initiating officer</span><input value={form.officer} onChange={event=>field("officer",event.target.value)} placeholder="Staff member"/></label><label className="forest-field"><span>Initial receiving officer</span><input value={form.receiver} onChange={event=>field("receiver",event.target.value)} placeholder="Receiving officer"/></label>
          </div>}
          {step===2&&<><div className="forest-file-zone"><FilePlus2 size={24}/><h3>Supporting documents</h3><p>Choose a proposal, reference, or useful evidence. Each file may be up to 15 MB. Files stay in this session and are not uploaded.</p><label className="forest-file-select">Choose files<input type="file" multiple onChange={addFiles} aria-label="Choose supporting files"/></label><span className="forest-file-note">OPTIONAL · LOCAL SELECTION ONLY</span></div>{files.length>0&&<div className="forest-file-list" aria-label="Selected files">{files.map(file=><div className="forest-file-item" key={file.key}><FilePlus2 size={16}/><span><strong>{file.name}</strong><small>{file.size} · Local selection</small></span><button type="button" aria-label={`Remove ${file.name}`} onClick={()=>setFiles(current=>current.filter(item=>item.key!==file.key))}><X size={14}/></button></div>)}</div>}<div className="forest-disclosure"><ShieldCheck size={16}/> Files are not uploaded. Nobody is notified.</div></>}
          {step===3&&<div className="forest-review"><div className="forest-review-band"><span className="forest-review-category">{form.category}</span><h3>{form.title||"Untitled submission"}</h3><p>{form.summary||"No summary supplied."}</p></div><div className="forest-review-section"><div className="forest-field-section">PROJECT DETAILS</div><div className="forest-review-grid"><ReviewItem label="Purpose" value={reviewValue(form.purpose)}/><ReviewItem label="Problem being addressed" value={reviewValue(form.problem)}/><ReviewItem label="Intended outcome" value={reviewValue(form.outcome)}/></div></div><div className="forest-review-section"><div className="forest-field-section">SUBMITTER & RESPONSIBILITY</div><div className="forest-review-grid"><ReviewItem label="Submitter" value={reviewValue(form.submitter)}/><ReviewItem label="Contact email" value={reviewValue(form.email)}/><ReviewItem label="Responsible initiating officer" value={reviewValue(form.officer)}/><ReviewItem label="Initial receiving officer" value={reviewValue(form.receiver)}/>{form.category==="Student Project"&&<><ReviewItem label="Student number" value={reviewValue(form.studentNumber)}/><ReviewItem label="Programme or department" value={reviewValue(form.programme)}/><ReviewItem label="Supervisor or lecturer" value={reviewValue(form.supervisor)}/></>}</div></div><div className="forest-review-section"><div className="forest-field-section">SUPPORTING DOCUMENTS</div><strong>{files.length?`${files.length} file${files.length===1?"":"s"} selected locally`:"No files selected"}</strong>{files.length>0&&<p>{files.map(file=>file.name).join(" · ")}</p>}</div><div className="forest-disclosure"><ShieldCheck size={16}/> Registration records intake only. Files are not uploaded and nobody is notified.</div></div>}
          {error&&<div className="forest-alert" role="alert">{error}</div>}
          <div className="forest-actions">{step>0?<button type="button" className="secondary" onClick={previous}>Back</button>:<span className="forest-actions-note">You can review details before registration.</span>}{step<3?<button type="button" onClick={next}>Continue <ArrowRight size={15}/></button>:<button type="submit">Register submission <Check size={15}/></button>}</div>
          {step===0&&<div className="forest-footnote"><ShieldCheck size={14}/><span>Staff workflow. Student details should only be entered by authorized personnel.</span></div>}
        </>}
      </form>
    </div>
  </div>;
}

function ReviewItem({label,value}:{label:string;value:string}) { return <div className="forest-review-item"><small>{label}</small><strong>{value}</strong></div>; }
