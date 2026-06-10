'use client';

import { useState, useCallback, useMemo } from 'react';
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

// ─── Resume JSON shape returned by Gemini ────────────────────────────────────

interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string | null;
  github?: string | null;
  summary?: string;
  experience?: {
    company: string;
    title: string;
    start: string;
    end: string;
    bullets: string[];
  }[];
  education?: {
    institution: string;
    degree: string;
    field: string;
    graduation: string;
  }[];
  skills?: string[];
  certifications?: string[];
  projects?: {
    name: string;
    description: string;
    technologies: string[];
    url?: string | null;
  }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/** Convert resume JSON into plain text for copying to clipboard */
function resumeToPlainText(r: ResumeData): string {
  const lines: string[] = [];

  if (r.name) lines.push(r.name.toUpperCase(), '');
  const contact = [r.email, r.phone, r.location].filter(Boolean).join('  •  ');
  if (contact) lines.push(contact);
  const links = [r.linkedin, r.github].filter(Boolean).join('  •  ');
  if (links) lines.push(links);
  if (contact || links) lines.push('');

  if (r.summary) {
    lines.push('PROFESSIONAL SUMMARY', '─'.repeat(40), r.summary, '');
  }

  if (r.experience?.length) {
    lines.push('WORK EXPERIENCE', '─'.repeat(40));
    for (const exp of r.experience) {
      lines.push(`${exp.title}  |  ${exp.company}  |  ${exp.start} – ${exp.end}`);
      for (const b of exp.bullets) lines.push(`  • ${b}`);
      lines.push('');
    }
  }

  if (r.education?.length) {
    lines.push('EDUCATION', '─'.repeat(40));
    for (const ed of r.education) {
      lines.push(`${ed.degree} in ${ed.field}  —  ${ed.institution} (${ed.graduation})`);
    }
    lines.push('');
  }

  if (r.skills?.length) {
    lines.push('SKILLS', '─'.repeat(40), r.skills.join('  •  '), '');
  }

  if (r.projects?.length) {
    lines.push('PROJECTS', '─'.repeat(40));
    for (const p of r.projects) {
      lines.push(`${p.name}${p.url ? ` — ${p.url}` : ''}`);
      lines.push(`  ${p.description}`);
      if (p.technologies?.length) lines.push(`  Tech: ${p.technologies.join(', ')}`);
      lines.push('');
    }
  }

  if (r.certifications?.length) {
    lines.push('CERTIFICATIONS', '─'.repeat(40));
    for (const c of r.certifications) lines.push(`  • ${c}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Section heading ─────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ marginBottom: 12 }}>
    <h3 style={{
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'var(--navy)', marginBottom: 6,
    }}>
      {children}
    </h3>
    <div style={{ height: 2, background: 'var(--navy)', opacity: 0.15, borderRadius: 1 }} />
  </div>
);

// ─── Resume View component ───────────────────────────────────────────────────

function ResumeView({ data }: { data: ResumeData }) {
  const contactParts = [data.email, data.phone, data.location].filter(Boolean);

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: 'var(--navy)' }}>
      {/* ── Header: Name + Contact ── */}
      <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 20,
        borderBottom: '2px solid var(--navy)' }}>
        {data.name && (
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em',
            color: 'var(--navy)', margin: 0, lineHeight: 1.2 }}>
            {data.name}
          </h2>
        )}
        {contactParts.length > 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 6 }}>
            {contactParts.join('  ·  ')}
          </p>
        )}
        {(data.linkedin || data.github) && (
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
            {[data.linkedin, data.github].filter(Boolean).map((link, i) => (
              <span key={i}>
                {i > 0 && '  ·  '}
                {link}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* ── Summary ── */}
      {data.summary && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Professional Summary</SectionTitle>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: '#3a3a4a' }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* ── Experience ── */}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Work Experience</SectionTitle>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: i < data.experience!.length - 1 ? 18 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)' }}>
                    {exp.title}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)', marginLeft: 8 }}>
                    {exp.company}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flexShrink: 0 }}>
                  {exp.start} – {exp.end}
                </span>
              </div>
              {exp.bullets?.length > 0 && (
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, listStyleType: 'disc' }}>
                  {exp.bullets.map((b, j) => (
                    <li key={j} style={{ fontSize: '0.8rem', lineHeight: 1.6, color: '#3a3a4a', marginBottom: 2 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Education ── */}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Education</SectionTitle>
          {data.education.map((ed, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>
                  {ed.degree} in {ed.field}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 8 }}>
                  {ed.institution}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flexShrink: 0 }}>
                {ed.graduation}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Skills ── */}
      {data.skills && data.skills.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Skills</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.skills.map((skill, i) => (
              <span key={i} style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 600,
                background: 'var(--cream-dark, #eee8dc)', color: 'var(--navy)',
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Projects ── */}
      {data.projects && data.projects.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Projects</SectionTitle>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: i < data.projects!.length - 1 ? 16 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>
                  {proj.name}
                </span>
                {proj.url && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--gold, #b8860b)' }}>
                    {proj.url}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: '#3a3a4a', margin: '4px 0' }}>
                {proj.description}
              </p>
              {proj.technologies?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {proj.technologies.map((t, j) => (
                    <span key={j} style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                      fontSize: '0.65rem', fontWeight: 600,
                      border: '1px solid var(--border, #d5d0c6)', color: 'var(--muted)',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Certifications ── */}
      {data.certifications && data.certifications.length > 0 && (
        <div>
          <SectionTitle>Certifications</SectionTitle>
          <ul style={{ margin: 0, paddingLeft: 18, listStyleType: 'disc' }}>
            {data.certifications.map((cert, i) => (
              <li key={i} style={{ fontSize: '0.8rem', lineHeight: 1.6, color: '#3a3a4a' }}>
                {cert}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────

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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const [tab, setTab]             = useState<Tab>('resume');
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]       = useState<Partial<FormState>>({});
  const [loading, setLoading]     = useState(false);
  const [apiError, setApiError]   = useState('');
  const [output, setOutput]       = useState<string>('');
  const [copied, setCopied]       = useState(false);
  const [isFresher, setIsFresher] = useState(false);

  // Parse resume JSON for formatted view
  const parsedResume = useMemo<ResumeData | null>(() => {
    if (!output || tab !== 'resume') return null;
    try {
      return JSON.parse(output) as ResumeData;
    } catch {
      return null;
    }
  }, [output, tab]);

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
        setOutput(resume);
      } else {
        const { coverLetter } = await apiGenerateCoverLetter(userInput, form.jobDescription);
        setOutput(coverLetter);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      if (msg.includes('Generation limit reached')) {
        setApiError('You have reached your monthly generation limit. Please upgrade your plan.');
      } else if (msg.includes('rate limit') || msg.includes('quota')) {
        setApiError('The AI service is temporarily busy. Please try again in a minute.');
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
    // If we have parsed resume data, copy the nicely formatted plain text
    const textToCopy = parsedResume ? resumeToPlainText(parsedResume) : output;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPDF() {
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
                parsedResume ? (
                  <ResumeView data={parsedResume} />
                ) : (
                  /* Fallback: raw text if JSON parsing failed */
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'var(--navy)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                    {output}
                  </pre>
                )
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

