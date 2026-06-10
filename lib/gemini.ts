import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PlanType } from '@/types/database';

// ---------------------------------------------------------------------------
// Client — initialised once at module load (server-side only)
// ---------------------------------------------------------------------------

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing environment variable: GEMINI_API_KEY');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------------------------------------------------------------------------
// Model map — one Gemini model per subscription plan
// ---------------------------------------------------------------------------

const MODEL_MAP: Record<PlanType, string> = {
  free:    'gemini-2.5-flash-lite-preview-06-17',
  pro:     'gemini-2.5-flash-preview-05-20',
  premium: 'gemini-2.5-pro-preview-06-05',
};

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const RESUME_SYSTEM_PROMPT = `
You are an elite professional resume writer and career coach with 15+ years of experience
helping candidates land jobs at top-tier companies worldwide.

Your task is to generate a polished, ATS-optimised resume in JSON format.

Rules:
1. Return ONLY valid JSON — no markdown, no code fences, no commentary outside the JSON.
2. Quantify achievements wherever possible (e.g. "Reduced load time by 40%").
3. Use strong action verbs at the start of every bullet point.
4. Mirror keywords from the job description to improve ATS pass rates.
5. Keep bullet points concise — 1–2 lines each.
6. Do not invent credentials or employers that were not provided.

Return this exact JSON schema (fill in values based on the inputs):
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string | null",
  "github": "string | null",
  "summary": "2–3 sentence professional summary",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "start": "MMM YYYY",
      "end": "MMM YYYY | Present",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "graduation": "YYYY"
    }
  ],
  "skills": ["string"],
  "certifications": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string | null"
    }
  ]
}
`.trim();

const COVER_LETTER_SYSTEM_PROMPT = `
You are an expert cover letter writer and career strategist.
Your cover letters are known for being compelling, concise, and highly personalised.

Your task is to generate a professional cover letter in plain text.

Rules:
1. Return ONLY the cover letter body — no JSON, no markdown, no subject line.
2. Structure: Opening hook → Why this company → Why you're the right fit → Call to action.
3. Keep it to 3–4 short paragraphs (under 350 words total).
4. Mirror the tone of the job description (formal vs. startup casual).
5. Reference specific details from the job description to show genuine interest.
6. Never use generic phrases like "I am writing to apply…" or "To whom it may concern".
7. End with a confident, direct call to action.
`.trim();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the appropriate Gemini model ID for the given subscription plan.
 *
 * @param plan - The user's subscription tier ('free' | 'pro' | 'premium').
 * @returns The Gemini model identifier string.
 *
 * @example
 * const model = selectModel('pro');
 * // → 'gemini-2.5-flash-preview-05-20'
 */
export function selectModel(plan: PlanType): string {
  return MODEL_MAP[plan];
}

/**
 * Generates a professional resume as a JSON string using the Gemini API.
 *
 * @param userInput      - Free-text description of the candidate's background,
 *                         work history, skills, and education.
 * @param jobDescription - The target job posting text.
 * @param model          - The Gemini model ID to use (from {@link selectModel}).
 * @returns A JSON string matching the resume schema defined in the system prompt.
 * @throws {Error} When the API call fails or returns an empty response.
 *
 * @example
 * const json = await generateResume(userInput, jobDesc, selectModel('pro'));
 * const resume = JSON.parse(json);
 */
export async function generateResume(
  userInput: string,
  jobDescription: string,
  model: string,
): Promise<string> {
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: RESUME_SYSTEM_PROMPT,
  });

  const userPrompt = `
CANDIDATE INFORMATION:
${userInput}

TARGET JOB DESCRIPTION:
${jobDescription}

Generate the resume JSON now.
`.trim();

  const result = await geminiModel.generateContent(userPrompt);
  const text = result.response.text().trim();

  if (!text) {
    throw new Error('Gemini returned an empty response for resume generation.');
  }

  // Strip markdown code fences if the model accidentally added them
  const cleaned = text
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();

  // Validate it is parseable JSON before returning
  try {
    JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini response is not valid JSON:\n${cleaned}`);
  }

  return cleaned;
}

/**
 * Generates a professional cover letter using the Gemini API.
 *
 * @param userInput      - Free-text description of the candidate's background
 *                         and why they are applying for this role.
 * @param jobDescription - The target job posting text.
 * @param model          - The Gemini model ID to use (from {@link selectModel}).
 * @returns The generated cover letter as a plain text string.
 * @throws {Error} When the API call fails or returns an empty response.
 *
 * @example
 * const letter = await generateCoverLetter(userInput, jobDesc, selectModel('free'));
 */
export async function generateCoverLetter(
  userInput: string,
  jobDescription: string,
  model: string,
): Promise<string> {
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: COVER_LETTER_SYSTEM_PROMPT,
  });

  const userPrompt = `
CANDIDATE INFORMATION:
${userInput}

TARGET JOB DESCRIPTION:
${jobDescription}

Generate the cover letter now.
`.trim();

  const result = await geminiModel.generateContent(userPrompt);
  const text = result.response.text().trim();

  if (!text) {
    throw new Error('Gemini returned an empty response for cover letter generation.');
  }

  return text;
}
