import React from 'react';

export interface ResumeATSData {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  education: {
    institution: string;
    location: string;
    degree: string;
    field: string;
    graduation: string;
    cgpa?: string;
  }[];
  projects: {
    name: string;
    technologies: string;
    url?: string;
    bullets: string[];
  }[];
  skills: {
    languages: string;
    frameworks: string;
    databases: string;
    tools: string;
  };
  certifications: {
    name: string;
    issuer: string;
    year: string;
  }[];
}

export interface ResumeData {
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

export function resumeToPlainText(r: ResumeData): string {
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

export function resumeATSToPlainText(r: ResumeATSData): string {
  const lines: string[] = [];

  if (r.name) lines.push(r.name.toUpperCase(), '');
  const contact = [r.phone, r.email, r.linkedin, r.github].filter(Boolean).join('  |  ');
  if (contact) lines.push(contact, '');

  if (r.education?.length) {
    lines.push('EDUCATION', '—'.repeat(40));
    for (const ed of r.education) {
      lines.push(`${ed.institution}  |  ${ed.location}`);
      lines.push(`${ed.degree} in ${ed.field}  —  ${ed.graduation}`);
      if (ed.cgpa) lines.push(`  • CGPA: ${ed.cgpa}`);
      lines.push('');
    }
  }

  if (r.projects?.length) {
    lines.push('PROJECTS', '—'.repeat(40));
    for (const p of r.projects) {
      lines.push(`${p.name}${p.technologies ? ` | ${p.technologies}` : ''}  —  ${p.url || ''}`);
      for (const b of p.bullets) lines.push(`  • ${b}`);
      lines.push('');
    }
  }

  if (r.skills) {
    lines.push('TECHNICAL SKILLS', '—'.repeat(40));
    if (r.skills.languages) lines.push(`Languages: ${r.skills.languages}`);
    if (r.skills.frameworks) lines.push(`Frameworks & Libraries: ${r.skills.frameworks}`);
    if (r.skills.databases) lines.push(`Databases & Backend: ${r.skills.databases}`);
    if (r.skills.tools) lines.push(`Tools & Platforms: ${r.skills.tools}`);
    lines.push('');
  }

  if (r.certifications?.length) {
    lines.push('CERTIFICATIONS', '—'.repeat(40));
    for (const c of r.certifications) {
      lines.push(`${c.name}`);
      lines.push(`  ${c.issuer} — ${c.year}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

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

export function ResumeView({ data }: { data: ResumeData }) {
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

export function ResumeATSView({ data }: { data: ResumeATSData }) {
  return (
    <div
      className="ats-resume-print-view text-left text-black bg-white"
      style={{
        fontFamily: "'Times New Roman', Times, Georgia, serif",
        fontSize: '11px',
        color: '#000',
        backgroundColor: '#fff',
        lineHeight: '1.4',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#000' }}>
          {data.name}
        </h1>
        <div style={{ fontSize: '11px', color: '#000' }}>
          {[
            data.phone,
            data.email,
            data.linkedin,
            data.github
          ].filter(Boolean).join(' | ')}
        </div>
      </div>

      {/* ── Education ── */}
      {data.education && data.education.length > 0 && (
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 2px 0', color: '#000' }}>
            EDUCATION
          </h2>
          <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }} />
          {data.education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>{edu.institution}</span>
                <span>{edu.location}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic' }}>
                <span>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</span>
                <span style={{ fontStyle: 'normal' }}>{edu.graduation}</span>
              </div>
              {edu.cgpa && (
                <ul style={{ margin: '2px 0 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                  <li>CGPA: {edu.cgpa}</li>
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Projects ── */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 2px 0', color: '#000' }}>
            PROJECTS
          </h2>
          <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }} />
          {data.projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>{proj.name}</span>
                  {proj.technologies && (
                    <span style={{ marginLeft: '6px', color: '#000' }}>
                      | {proj.technologies}
                    </span>
                  )}
                </div>
                {proj.url && (
                  <span style={{ fontSize: '11px' }}>{proj.url}</span>
                )}
              </div>
              {proj.bullets && proj.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                  {proj.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} style={{ marginBottom: '2px' }}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Technical Skills ── */}
      {data.skills && (
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 2px 0', color: '#000' }}>
            TECHNICAL SKILLS
          </h2>
          <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {data.skills.languages && (
              <div>
                <span style={{ fontWeight: 'bold' }}>Languages: </span>
                <span>{data.skills.languages}</span>
              </div>
            )}
            {data.skills.frameworks && (
              <div>
                <span style={{ fontWeight: 'bold' }}>Frameworks & Libraries: </span>
                <span>{data.skills.frameworks}</span>
              </div>
            )}
            {data.skills.databases && (
              <div>
                <span style={{ fontWeight: 'bold' }}>Databases & Backend: </span>
                <span>{data.skills.databases}</span>
              </div>
            )}
            {data.skills.tools && (
              <div>
                <span style={{ fontWeight: 'bold' }}>Tools & Platforms: </span>
                <span>{data.skills.tools}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Certifications ── */}
      {data.certifications && data.certifications.length > 0 && (
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 2px 0', color: '#000' }}>
            CERTIFICATIONS
          </h2>
          <div style={{ borderBottom: '1px solid #000', marginBottom: '6px' }} />
          {data.certifications.map((cert, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>{cert.name}</div>
              <div style={{ fontSize: '11px', color: '#000' }}>
                {cert.issuer}{cert.year ? ` — ${cert.year}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
