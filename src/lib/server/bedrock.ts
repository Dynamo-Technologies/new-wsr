import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';
import { env } from '$env/dynamic/private';

const MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

function getClient(): BedrockRuntimeClient {
  const config: Record<string, unknown> = {
    region: env.AWS_REGION || 'us-east-1'
  };

  // Use explicit creds if provided, otherwise falls back to EC2 instance role
  if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    };
  }

  return new BedrockRuntimeClient(config);
}

interface WSRInput {
  user_name: string;
  week_ending: string;
  accomplishments: string | null;
  this_week: string | null;
  blockers: string | null;
  next_week: string | null;
  work_type_tags: string[];
}

interface MSRContext {
  projectName: string;
  monthLabel: string;
}

export async function generateMSRSummary(
  wsrs: WSRInput[],
  context: MSRContext
): Promise<string> {
  const wsrText = wsrs
    .map(
      (w, i) =>
        `--- WSR ${i + 1}: ${w.user_name} (Week ending ${w.week_ending}) ---
Accomplishments: ${w.accomplishments || 'N/A'}
Current Work: ${w.this_week || 'N/A'}
Blockers: ${w.blockers || 'N/A'}
Next Week: ${w.next_week || 'N/A'}
Tags: ${w.work_type_tags?.join(', ') || 'None'}`
    )
    .join('\n\n');

  const prompt = `You are a professional technical writer creating a Monthly Status Report (MSR) for a federal contracting project.

Project: ${context.projectName}
Reporting Period: ${context.monthLabel}
Number of WSRs: ${wsrs.length}

Below are the individual Weekly Status Reports (WSRs) submitted by team members this month:

${wsrText}

Generate a professional MSR with these sections:

## Executive Summary
A 2-3 sentence overview of the month's progress.

## Key Accomplishments
Consolidated bullet points of major accomplishments across all team members. Group related items and remove duplicates.

## Ongoing Work
Current activities and their status.

## Blockers & Risks
Any blockers or risks identified, with suggested mitigations if apparent.

## Next Month Outlook
Expected focus areas for the upcoming month based on "Next Week" entries.

Keep the tone professional and concise. Use bullet points. Do not include individual names — summarize at the project level.`;

  const client = getClient();
  const response = await client.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    })
  );

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}

// --- Past Performance Narrative ---

interface PastPerfWSR {
  project_name: string;
  user_name: string;
  week_ending: string;
  accomplishments: string | null;
  this_week: string | null;
  work_type_tags: string[];
}

export async function generatePastPerformance(wsrs: PastPerfWSR[]): Promise<string> {
  const projects = [...new Set(wsrs.map((w) => w.project_name))];

  const wsrText = wsrs
    .map(
      (w, i) =>
        `--- WSR ${i + 1}: ${w.project_name} | ${w.user_name} (${w.week_ending}) ---
Accomplishments: ${w.accomplishments || 'N/A'}
Current Work: ${w.this_week || 'N/A'}
Tags: ${w.work_type_tags?.join(', ') || 'None'}`
    )
    .join('\n\n');

  const prompt = `You are a federal contracting proposal writer creating a Past Performance narrative based on weekly status reports.

Projects covered: ${projects.join(', ')}
Number of WSRs analyzed: ${wsrs.length}

Below are the relevant Weekly Status Reports:

${wsrText}

Generate a professional Past Performance narrative suitable for a government proposal response. Include:

## Project Overview
Brief description of the work performed, derived from the WSR content.

## Technical Approach & Capabilities Demonstrated
Key technical skills, methodologies, and tools used. Group by capability area.

## Key Accomplishments & Results
Major deliverables, milestones achieved, and measurable outcomes. Use strong action verbs.

## Challenges Overcome
Problems encountered and how the team resolved them (derived from blockers and resolutions).

## Relevance to Future Work
How this experience demonstrates readiness for similar contract work.

Write in third person (e.g., "The team delivered..."). Use professional, persuasive language appropriate for a government proposal. Focus on demonstrating capability and results. Do not include individual names.`;

  const client = getClient();
  const response = await client.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    })
  );

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}
