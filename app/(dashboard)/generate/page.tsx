'use client';

import { useState, useCallback } from 'react';
import { apiGenerateResume, apiGenerateCoverLetter } from '@/lib/api';

type Tab = 'resume' | 'cover-letter';

interface FormState {
  fullName: string;
  email: string;
  experience: string;
  skills: string;
  education: string;
  targetJob: string;
  jobDescription: string;
}

const EMPTY_FORM: FormState = {
  fullName: '',
  email: '',
  experience: '',
  skills: '',
  education: '',
  targetJob: '',
  jobDescription: '',
};

function buildUserInput(f: FormState, isFresher: boolean): string {
  return [
    f.fullName     && `Name: ${f.fullName}`,
    f.email        && `Email: ${f.email}`,
    f.targetJob    && `Target Job: ${f.targetJob}`,
    isFresher ? `Experience: None (Fresher/Recent Graduate)` : (f.experience && `Experience:\n${f.experience}`),
    f.skills       && `Skills: ${f.skills}`,
    f.education    && `Education: ${f.education}`,
  ].filter(Boolean).join('\n\n');
}

const InputField = ({
  id, label, required, placeholder, value, error, multiline, rows, onChange,
}: {
  id: string; label: string; required?: boolean; placeholder: string;
  value: string; error?: string; multiline?: boolean; rows?: number;
  onChange: (val: string) => void;
}) => (
  <div>
    <label htmlFor={id} className="input-label">
      {label}{required && <span style={{ color: 'var(--error)' }}> *</span>}
    </label>
    {multiline ? (
      <textarea id={id} rows={rows ?? 4} placeholder={placeholder}
        className={`input-field resize-y ${error ? 'error' : ''}`}
        style={{ minHeight: 96 }}
        value={value} onChange={e => onChange(e.target.value)} />
    ) : (
      <input id={id} type="text" placeholder={placeholder}
        className={`input-field ${error ? 'error' : ''}`}
        value={value} onChange={e => onChange(e.target.value)} />
    )}
    {error && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{error}</p>}
  </div>
);

export default function GeneratePage() {
  const [tab, setTab]             = useState<Tab>('resume');
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]       = useState<Partial<FormState>>({});
  const [loading, setLoading]     = useState(false);
  const [apiError, setApiError]   = useState('');
  const [output, setOutput]       = useState<string>('');
  const [copied, setCopied]       = useState(false);
  const [isFresher, setIsFresher] = useState(false);

  const set = (field: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
    setApiError('');
  };

  const validate = useCallback(() => {
    const e: Partial<FormState> = {};
    if (!form.fullName.trim())     e.fullName     = 'Required.';
    if (!isFresher && !form.experience.trim())   e.experience   = 'Required.';
    if (!form.jobDescription.trim()) e.jobDescription = 'Required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  async function handleGenerate() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    setOutput('');

    try {
      const userInput = buildUserInput(form, isFresher);
      if (tab === 'resume') {
        const { resume } = await apiGenerateResume(userInput, form.jobDescription);
        // Pretty-print if JSON, else show raw
        try { setOutput(JSON.stringify(JSON.parse(resume), null, 2)); }
        catch { setOutput(resume); }
      } else {
        const { coverLetter } = await apiGenerateCoverLetter(userInput, form.jobDescription);
        setOutput(coverLetter);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      if (msg.includes('limit')) {
        setApiError('You have reached your monthly generation limit. Please upgrade your plan.');
      } else if (msg.includes('Unauthenticated')) {
        setApiError('Your session expired. Please log in again.');
      } else {
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPDF() {
    // Placeholder — PDF generation requires a Pro+ plan
    window.print();
  }



  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--navy)' }}>
          Generate
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Fill in your details and let AI do the writing.
        </p>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-8">
        {([['resume', '✦ Resume'], ['cover-letter', '◈ Cover Letter']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setOutput(''); setApiError(''); }}
            className={`tab-item ${tab === key ? 'active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Form ── */}
        <div className="card p-6 flex flex-col gap-5">
          <InputField id="fullName" label="Full Name" required placeholder="Tahmid Sadat"
            value={form.fullName} error={errors.fullName} onChange={val => set('fullName', val)} />
          <InputField id="email" label="Email" placeholder="you@example.com"
            value={form.email} onChange={val => set('email', val)} />
          <InputField id="targetJob" label="Target Job Title" placeholder="Senior Software Engineer"
            value={form.targetJob} onChange={val => set('targetJob', val)} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="fresher" checked={isFresher} onChange={e => setIsFresher(e.target.checked)} />
              <label htmlFor="fresher" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--navy)' }}>
                I am a fresher (no work experience)
              </label>
            </div>
            {!isFresher && (
              <InputField id="experience" label="Work Experience" required multiline rows={5}
                placeholder="Describe your roles, responsibilities, and achievements…"
                value={form.experience} error={errors.experience} onChange={val => set('experience', val)} />
            )}
          </div>

          <InputField id="skills" label="Skills" placeholder="TypeScript, React, Node.js, PostgreSQL…"
            value={form.skills} onChange={val => set('skills', val)} />
          <InputField id="education" label="Education"
            placeholder="BSc Computer Science, University of Dhaka, 2022"
            value={form.education} onChange={val => set('education', val)} />
          <InputField id="jobDescription" label="Target Job Description" required multiline rows={5}
            placeholder="Paste the full job description here…"
            value={form.jobDescription} error={errors.jobDescription} onChange={val => set('jobDescription', val)} />

          {apiError && <div className="alert-error">{apiError}</div>}

          <button onClick={handleGenerate} disabled={loading} className="btn-primary"
            style={{ justifyContent: 'center' }}>
            {loading
              ? <><span className="spinner" /> Generating…</>
              : `✦ Generate ${tab === 'resume' ? 'Resume' : 'Cover Letter'}`}
          </button>
        </div>

        {/* ── Output ── */}
        <div className="card p-6 flex flex-col" style={{ minHeight: 480 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: 'var(--navy)' }}>
              {tab === 'resume' ? 'Resume Output' : 'Cover Letter Output'}
            </h2>
            {output && (
              <div className="flex gap-2">
                <div className="tooltip">
                  <button onClick={handleCopy} className="btn-outline"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.8125rem' }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                  <span className="tooltip-text">Copy to clipboard</span>
                </div>
                <div className="tooltip">
                  <button onClick={handleDownloadPDF} className="btn-outline"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.8125rem' }}>
                    PDF ↓
                  </button>
                  <span className="tooltip-text">Pro+ feature</span>
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
              <div style={{ width: 40, height: 40, border: '3px solid var(--cream-dark)', borderTopColor: 'var(--navy)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                AI is crafting your {tab === 'resume' ? 'resume' : 'cover letter'}…
              </p>
            </div>
          )}

          {!loading && !output && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <div className="text-5xl" style={{ opacity: 0.2 }}>✦</div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Fill in the form and click Generate.<br />Your output will appear here.
              </p>
            </div>
          )}

          {!loading && output && (
            <div className="animate-fade-in flex-1 overflow-auto">
              {tab === 'resume' ? (
                <pre className="text-xs leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--navy)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                  {output}
                </pre>
              ) : (
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--navy)' }}>
                  {output}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
