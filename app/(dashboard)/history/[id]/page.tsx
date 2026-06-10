'use client';

import { useEffect, useState, useMemo, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ResumeData, resumeToPlainText, ResumeView } from '@/components/ResumeView';
import Link from 'next/link';

interface GenerationDetail {
  id: string;
  type: 'resume' | 'cover_letter';
  title: string | null;
  output_content: string | null;
  model_version: string | null;
  created_at: string;
}

export default function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const [data, setData] = useState<GenerationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const { data: gen, error: fetchErr } = await supabase
        .from('generations')
        .select('id, type, title, output_content, model_version, created_at')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchErr || !gen) {
        setError('Generation not found or you do not have permission to view it.');
      } else {
        setData(gen as GenerationDetail);
      }
      setLoading(false);
    }
    
    load();
  }, [id]);

  const parsedResume = useMemo<ResumeData | null>(() => {
    if (!data?.output_content || data.type !== 'resume') return null;
    try {
      return JSON.parse(data.output_content) as ResumeData;
    } catch {
      return null;
    }
  }, [data]);

  async function handleCopy() {
    if (!data?.output_content) return;
    const textToCopy = parsedResume ? resumeToPlainText(parsedResume) : data.output_content;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPDF() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <div className="spinner spinner-dark" />
        <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-6 text-center">
        <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--error)' }}>Error</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{error}</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold mb-2 inline-block no-underline" style={{ color: 'var(--gold)' }}>
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--navy)' }}>
            {data.title || (data.type === 'resume' ? 'Generated Resume' : 'Generated Cover Letter')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Generated on {new Date(data.created_at).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
            })} using {data.model_version?.replace('gemini-', '')}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="tooltip">
            <button onClick={handleCopy} className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <span className="tooltip-text">Copy to clipboard</span>
          </div>
          <div className="tooltip">
            <button onClick={handleDownloadPDF} className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
              PDF ↓
            </button>
            <span className="tooltip-text">Pro+ feature</span>
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="card p-8">
        {!data.output_content ? (
           <p className="text-sm" style={{ color: 'var(--muted)' }}>No content was generated or saved for this entry.</p>
        ) : data.type === 'resume' ? (
          parsedResume ? (
            <ResumeView data={parsedResume} />
          ) : (
            <pre className="text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--navy)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {data.output_content}
            </pre>
          )
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--navy)' }}>
            {data.output_content}
          </div>
        )}
      </div>
    </div>
  );
}
