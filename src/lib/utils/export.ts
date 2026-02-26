/**
 * Export utilities for MSR, Quarterly Reviews, and Past Performance reports
 */

/**
 * Convert markdown text to a downloadable .md file
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, `${filename}.md`);
}

/**
 * Convert content to a basic HTML string for printing as PDF
 */
export function downloadAsHTML(title: string, content: string, filename: string): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #111; line-height: 1.6; }
    h1 { color: #fe4e51; border-bottom: 2px solid #fe4e51; padding-bottom: 8px; }
    h2 { color: #374151; margin-top: 24px; }
    h3 { color: #6b7280; }
    pre { background: #f3f4f6; padding: 12px; border-radius: 6px; white-space: pre-wrap; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .print-date { color: #9ca3af; font-size: 12px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Dynamo WSR Platform</h1>
  </div>
  <h2>${title}</h2>
  <p class="print-date">Generated: ${new Date().toLocaleString()}</p>
  <hr />
  <div>${markdownToHTML(content)}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  triggerDownload(blob, `${filename}.html`);
}

/**
 * Simple markdown-to-HTML converter for export
 */
function markdownToHTML(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '')
    .trim();
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format a WSR into a readable markdown section
 */
export function wsrToMarkdown(wsr: {
  user?: { full_name?: string };
  week_ending: string;
  report_type: string;
  accomplishments?: string | null;
  blockers?: string | null;
  this_week?: string | null;
  next_week?: string | null;
  hours_narrative?: string | null;
  work_type_tags?: string[];
}): string {
  const lines: string[] = [
    `### ${wsr.user?.full_name ?? 'Unknown'} — Week Ending ${wsr.week_ending}`,
    `*Report Type: ${wsr.report_type}*`,
    ''
  ];

  if (wsr.accomplishments) {
    lines.push('**Accomplishments:**', wsr.accomplishments, '');
  }
  if (wsr.this_week) {
    lines.push('**This Week:**', wsr.this_week, '');
  }
  if (wsr.blockers) {
    lines.push('**Blockers / Risks:**', wsr.blockers, '');
  }
  if (wsr.next_week) {
    lines.push('**Next Week:**', wsr.next_week, '');
  }
  if (wsr.hours_narrative) {
    lines.push('**Hours:**', wsr.hours_narrative, '');
  }
  if (wsr.work_type_tags?.length) {
    lines.push(`**Tags:** ${wsr.work_type_tags.join(', ')}`, '');
  }

  lines.push('---', '');
  return lines.join('\n');
}
