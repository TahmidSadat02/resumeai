'use client';

import { useState, useCallback, useMemo } from 'react';
import { apiGenerateResume, apiGenerateCoverLetter } from '@/lib/api';

type Tab = 'resume' | 'cover-letter';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectEntry {
  name: string;
  description: string;
  technologies: string;
  url: string;
}

interface FormState {
  // Personal
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  // Experience
  experience: string;
  // Education
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  cgpa: string;
  // Skills
  skills: string;
  // Extra-curricular
  leetcode: string;
  codeforces: string;
  certifications: string;
  achievements: string;
  languages: string;
  // Target Job
  targetJob: string;
  jobDescription: string;
}

const EMPTY_FORM: FormState = {
  fullName: '', email: '', phone: '', location: '',
  linkedin: '', github: '', portfolio: '',
  experience: '',
  institution: '', degree: '', fieldOfStudy: '', graduationYear: '', cgpa: '',
  skills: '',
  leetcode: '', codeforces: '', certifications: '', achievements: '', languages: '',
  targetJob: '', jobDescription: '',
};

const EMPTY_PROJECT: ProjectEntry = { name: '', description: '', technologies: '', url: '' };

// ─── Resume JSON shape returned by Gemini ────────────────────────────────────

import { ResumeData, resumeToPlainText, ResumeView, ATSResumeView } from '@/components/ResumeView';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUserInput(f: FormState, isFresher: boolean, projects: ProjectEntry[]): string {
  const parts: string[] = [];

  // Personal info
  if (f.fullName) parts.push(`Name: ${f.fullName}`);
  if (f.email) parts.push(`Email: ${f.email}`);
  if (f.phone) parts.push(`Phone: ${f.phone}`);
  if (f.location) parts.push(`Location: ${f.location}`);
  if (f.linkedin) parts.push(`LinkedIn: ${f.linkedin}`);
  if (f.github) parts.push(`GitHub: ${f.github}`);
  if (f.portfolio) parts.push(`Portfolio: ${f.portfolio}`);

  // Target
  if (f.targetJob) parts.push(`Target Job: ${f.targetJob}`);

  // Experience
  if (isFresher) {
    parts.push('Experience: None (Fresher/Recent Graduate)');
  } else if (f.experience) {
    parts.push(`Experience:\n${f.experience}`);
  }

  // Education
  const eduParts = [f.degree, f.fieldOfStudy, f.institution, f.graduationYear].filter(Boolean);
  if (eduParts.length > 0) {
    let edu = `Education: ${f.degree || 'Degree not specified'}`;
    if (f.fieldOfStudy) edu += ` in ${f.fieldOfStudy}`;
    if (f.institution) edu += `, ${f.institution}`;
    if (f.graduationYear) edu += ` (${f.graduationYear})`;
    if (f.cgpa) edu += ` — CGPA: ${f.cgpa}`;
    parts.push(edu);
  }

  // Skills
  if (f.skills) parts.push(`Skills: ${f.skills}`);

  // Projects
  const filledProjects = projects.filter(p => p.name.trim());
  if (filledProjects.length > 0) {
    const projText = filledProjects.map((p, i) => {
      let line = `${i + 1}. ${p.name}`;
      if (p.description) line += `\n   Description: ${p.description}`;
      if (p.technologies) line += `\n   Technologies: ${p.technologies}`;
      if (p.url) line += `\n   URL: ${p.url}`;
      return line;
    }).join('\n');
    parts.push(`Projects:\n${projText}`);
  }

  // Extra-curricular
  const extras: string[] = [];
  if (f.leetcode) extras.push(`LeetCode: ${f.leetcode}`);
  if (f.codeforces) extras.push(`Codeforces/HackerRank: ${f.codeforces}`);
  if (f.certifications) extras.push(`Certifications:\n${f.certifications}`);
  if (f.achievements) extras.push(`Achievements:\n${f.achievements}`);
  if (f.languages) extras.push(`Languages: ${f.languages}`);
  if (extras.length > 0) {
    parts.push(`Extra-Curricular & Achievements:\n${extras.join('\n')}`);
  }

  return parts.join('\n\n');
}

// ─── Input field ─────────────────────────────────────────────────────────────

const InputField = ({
  id, label, required, placeholder, value, error, multiline, rows, type, onChange,
}: {
  id: string; label: string; required?: boolean; placeholder: string;
  value: string; error?: string; multiline?: boolean; rows?: number;
  type?: string; onChange: (val: string) => void;
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
      <input id={id} type={type ?? 'text'} placeholder={placeholder}
        className={`input-field ${error ? 'error' : ''}`}
        value={value} onChange={e => onChange(e.target.value)} />
    )}
    {error && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{error}</p>}
  </div>
);

// ─── Collapsible Section ─────────────────────────────────────────────────────

const Section = ({
  title, badge, defaultOpen, children,
}: {
  title: string; badge?: string; defaultOpen?: boolean; children: React.ReactNode;
}) => (
  <div className="form-section">
    <details open={defaultOpen}>
      <summary>
        {title}
        {badge && <span className="section-badge">{badge}</span>}
      </summary>
      <div className="section-body">
        {children}
      </div>
    </details>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const [tab, setTab]             = useState<Tab>('resume');
  const [format, setFormat]       = useState<'standard' | 'ats'>('standard');
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]       = useState<Partial<FormState>>({});
  const [loading, setLoading]     = useState(false);
  const [apiError, setApiError]   = useState('');
  const [output, setOutput]       = useState<string>('');
  const [copied, setCopied]       = useState(false);
  const [isFresher, setIsFresher] = useState(false);
  const [projects, setProjects]   = useState<ProjectEntry[]>([{ ...EMPTY_PROJECT }]);

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

  const setProject = (index: number, field: keyof ProjectEntry, value: string) => {
    setProjects(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addProject = () => {
    if (projects.length < 4) {
      setProjects(prev => [...prev, { ...EMPTY_PROJECT }]);
    }
  };

  const removeProject = (index: number) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  };

  const validate = useCallback(() => {
    const e: Partial<FormState> = {};
    if (!form.fullName.trim())       e.fullName       = 'Required.';
    if (!form.email.trim())          e.email          = 'Required.';
    if (!form.skills.trim())         e.skills         = 'Required.';
    if (!form.institution.trim())    e.institution    = 'Required.';
    if (!isFresher && !form.experience.trim()) e.experience = 'Required.';
    if (!form.jobDescription.trim()) e.jobDescription = 'Required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, isFresher]);

  async function handleGenerate() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    setOutput('');

    try {
      const userInput = buildUserInput(form, isFresher, projects);
      if (tab === 'resume') {
        const { resume } = await apiGenerateResume(userInput, form.jobDescription, format);
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
    const textToCopy = format === 'standard' && parsedResume ? resumeToPlainText(parsedResume) : output;
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
      <div className="mb-8 no-print">
        <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--navy)' }}>
          Generate
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Fill in your details and let AI do the writing.
        </p>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-8 no-print">
        {([['resume', '✦ Resume'], ['cover-letter', '◈ Cover Letter']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setOutput(''); setApiError(''); }}
            className={`tab-item ${tab === key ? 'active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Format Selector Toggle */}
      {tab === 'resume' && (
        <div className="mb-6 flex items-center gap-3 bg-white p-3 rounded-xl border no-print" style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--navy)' }}>
            Resume Format
            <span className="tooltip">
              <span className="cursor-help text-[10px] font-bold bg-[var(--cream-dark)] text-[var(--navy)] w-4.5 h-4.5 flex items-center justify-center rounded-full">?</span>
              <span className="tooltip-text text-left" style={{ width: 260, whiteSpace: 'normal', bottom: 'calc(100% + 8px)', left: 0, transform: 'none' }}>
                ATS (Applicant Tracking System) format uses clean plain text with no tables, columns, or graphics so hiring software can read it correctly.
              </span>
            </span>
          </span>
          <div className="flex bg-[var(--cream)] p-1 rounded-lg gap-1">
            <button
              type="button"
              onClick={() => { setFormat('standard'); setOutput(''); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                format === 'standard' ? 'bg-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--navy)]'
              }`}
              style={{
                color: format === 'standard' ? 'var(--navy)' : undefined,
                fontWeight: format === 'standard' ? 700 : 500,
              }}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => { setFormat('ats'); setOutput(''); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                format === 'ats' ? 'bg-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--navy)]'
              }`}
              style={{
                color: format === 'ats' ? 'var(--navy)' : undefined,
                fontWeight: format === 'ats' ? 700 : 500,
              }}
            >
              ATS Optimized
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Form ── */}
        <div className="flex flex-col gap-4 no-print">

          {/* ─── Personal Info ─── */}
          <Section title="Personal Information" badge="required" defaultOpen>
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField id="fullName" label="Full Name" required placeholder="Tahmid Sadat"
                value={form.fullName} error={errors.fullName} onChange={val => set('fullName', val)} />
              <InputField id="email" label="Email" required type="email" placeholder="you@example.com"
                value={form.email} error={errors.email} onChange={val => set('email', val)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField id="phone" label="Phone Number" placeholder="+880 1700-000000"
                value={form.phone} onChange={val => set('phone', val)} />
              <InputField id="location" label="Location / City" placeholder="Dhaka, Bangladesh"
                value={form.location} onChange={val => set('location', val)} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <InputField id="linkedin" label="LinkedIn URL" placeholder="linkedin.com/in/username"
                value={form.linkedin} onChange={val => set('linkedin', val)} />
              <InputField id="github" label="GitHub URL" placeholder="github.com/username"
                value={form.github} onChange={val => set('github', val)} />
              <InputField id="portfolio" label="Portfolio URL" placeholder="yoursite.com"
                value={form.portfolio} onChange={val => set('portfolio', val)} />
            </div>
          </Section>

          {/* ─── Experience ─── */}
          <Section title="Work Experience" badge={isFresher ? 'fresher' : 'required'} defaultOpen>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="fresher" checked={isFresher}
                onChange={e => setIsFresher(e.target.checked)}
                style={{ accentColor: 'var(--navy)' }} />
              <label htmlFor="fresher" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--navy)' }}>
                I am a fresher (no work experience)
              </label>
            </div>
            {!isFresher && (
              <InputField id="experience" label="Work Experience" required multiline rows={5}
                placeholder={"Company: Acme Inc.\nRole: Software Engineer\nDuration: Jan 2023 — Present\nDescription: Built microservices with Go…"}
                value={form.experience} error={errors.experience} onChange={val => set('experience', val)} />
            )}
          </Section>

          {/* ─── Education ─── */}
          <Section title="Education" badge="required" defaultOpen>
            <InputField id="institution" label="Institution Name" required placeholder="University of Dhaka"
              value={form.institution} error={errors.institution} onChange={val => set('institution', val)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField id="degree" label="Degree" placeholder="B.Sc."
                value={form.degree} onChange={val => set('degree', val)} />
              <InputField id="fieldOfStudy" label="Field of Study" placeholder="Computer Science & Engineering"
                value={form.fieldOfStudy} onChange={val => set('fieldOfStudy', val)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField id="graduationYear" label="Graduation Year" placeholder="2024"
                value={form.graduationYear} onChange={val => set('graduationYear', val)} />
              <InputField id="cgpa" label="CGPA (optional)" placeholder="3.85 / 4.00"
                value={form.cgpa} onChange={val => set('cgpa', val)} />
            </div>
          </Section>

          {/* ─── Skills ─── */}
          <Section title="Skills" badge="required" defaultOpen>
            <InputField id="skills" label="Skills (comma-separated)" required
              placeholder="TypeScript, React, Node.js, PostgreSQL, Docker…"
              value={form.skills} error={errors.skills} onChange={val => set('skills', val)} />
          </Section>

          {/* ─── Projects ─── */}
          <Section title="Projects" badge="optional">
            {projects.map((proj, i) => (
              <div key={i} style={{
                padding: '0.875rem', borderRadius: '0.5rem',
                background: 'var(--cream)', border: '1px solid var(--border)',
              }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold" style={{ color: 'var(--navy)' }}>
                    Project {i + 1}
                  </span>
                  {projects.length > 1 && (
                    <button type="button" onClick={() => removeProject(i)}
                      className="text-xs font-medium cursor-pointer"
                      style={{ color: 'var(--error)', background: 'none', border: 'none' }}>
                      ✕ Remove
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <InputField id={`proj-name-${i}`} label="Project Name" placeholder="AI Resume Builder"
                    value={proj.name} onChange={val => setProject(i, 'name', val)} />
                  <InputField id={`proj-desc-${i}`} label="Description" multiline rows={2}
                    placeholder="Brief description of the project and your role…"
                    value={proj.description} onChange={val => setProject(i, 'description', val)} />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <InputField id={`proj-tech-${i}`} label="Technologies" placeholder="React, Node.js, PostgreSQL"
                      value={proj.technologies} onChange={val => setProject(i, 'technologies', val)} />
                    <InputField id={`proj-url-${i}`} label="URL / GitHub Link" placeholder="github.com/user/project"
                      value={proj.url} onChange={val => setProject(i, 'url', val)} />
                  </div>
                </div>
              </div>
            ))}
            {projects.length < 4 && (
              <button type="button" onClick={addProject} className="btn-outline"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', width: '100%', justifyContent: 'center' }}>
                + Add Project
              </button>
            )}
          </Section>

          {/* ─── Extra-Curricular & Achievements ─── */}
          <Section title="Extra-Curricular & Achievements" badge="optional">
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField id="leetcode" label="LeetCode Profile URL" placeholder="leetcode.com/u/username"
                value={form.leetcode} onChange={val => set('leetcode', val)} />
              <InputField id="codeforces" label="Codeforces / HackerRank URL" placeholder="codeforces.com/profile/username"
                value={form.codeforces} onChange={val => set('codeforces', val)} />
            </div>
            <InputField id="certifications" label="Certifications (one per line)" multiline rows={3}
              placeholder={"AWS Certified Solutions Architect\nGoogle Cloud Professional Data Engineer"}
              value={form.certifications} onChange={val => set('certifications', val)} />
            <InputField id="achievements" label="Achievements / Awards" multiline rows={3}
              placeholder={"Dean's List 2023\nICPC Regional Finalist"}
              value={form.achievements} onChange={val => set('achievements', val)} />
            <InputField id="languages" label="Languages Spoken (comma-separated)" placeholder="Bengali, English, Hindi"
              value={form.languages} onChange={val => set('languages', val)} />
          </Section>

          {/* ─── Target Job ─── */}
          <Section title="Target Job" badge="required" defaultOpen>
            <InputField id="targetJob" label="Target Job Title" placeholder="Senior Software Engineer"
              value={form.targetJob} onChange={val => set('targetJob', val)} />
            <InputField id="jobDescription" label="Target Job Description" required multiline rows={5}
              placeholder="Paste the full job description here…"
              value={form.jobDescription} error={errors.jobDescription} onChange={val => set('jobDescription', val)} />
          </Section>

          {/* Error & Generate */}
          {apiError && <div className="alert-error">{apiError}</div>}

          <button onClick={handleGenerate} disabled={loading} className="btn-primary"
            style={{ justifyContent: 'center', width: '100%' }}>
            {loading
              ? <><span className="spinner" /> Generating…</>
              : `✦ Generate ${tab === 'resume' ? 'Resume' : 'Cover Letter'}`}
          </button>
        </div>

        {/* ── Output ── */}
        <div className={`card p-6 flex flex-col ${format === 'ats' ? 'ats-mode' : 'standard-mode'}`} style={{ minHeight: 480, maxHeight: 'calc(100vh - 48px)', position: 'sticky', top: 24, alignSelf: 'start' }}>
          <div className="flex items-center justify-between mb-4 no-print">
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
                format === 'ats' ? (
                  <ATSResumeView text={output} />
                ) : parsedResume ? (
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
