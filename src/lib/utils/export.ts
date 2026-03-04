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
  const lines = md.split('\n');
  const result: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table rows
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter((c) => c.trim() !== '');
      if (cells.every((c) => /^[\s-:]+$/.test(c))) continue;
      if (!inTable) {
        result.push('<table><thead><tr>');
        cells.forEach((c) => result.push(`<th>${c.trim()}</th>`));
        result.push('</tr></thead><tbody>');
        inTable = true;
      } else {
        result.push('<tr>');
        cells.forEach((c) => result.push(`<td>${c.trim()}</td>`));
        result.push('</tr>');
      }
      continue;
    }

    if (inTable) {
      result.push('</tbody></table>');
      inTable = false;
    }

    // Headings — strip any bold wrapping first (e.g. **## Heading**)
    const cleaned = line.replace(/^\*\*(.+)\*\*$/, '$1').trim();
    if (cleaned.startsWith('### ')) {
      result.push(`<h3>${cleaned.slice(4)}</h3>`);
    } else if (cleaned.startsWith('## ')) {
      result.push(`<h2>${cleaned.slice(3)}</h2>`);
    } else if (cleaned.startsWith('# ')) {
      result.push(`<h1>${cleaned.slice(2)}</h1>`);
    } else if (line.startsWith('- ')) {
      result.push(`<li>${line.slice(2)}</li>`);
    } else if (line === '---') {
      result.push('<hr />');
    } else {
      result.push(line);
    }
  }
  if (inTable) result.push('</tbody></table>');

  // Wrap consecutive <li> in <ul>
  let html = result.join('\n');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Inline formatting
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Paragraph breaks
  html = html.replace(/\n\n/g, '<br /><br />');

  return html.trim();
}

/**
 * Open content in a print-ready window for Save as PDF
 */
export function printAsPDF(title: string, content: string): void {
  // Strip leading # heading if it duplicates the title
  const cleaned = content.replace(/^#\s+.+\n*/m, '').trim();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #333; line-height: 1.7; font-size: 14px; }
    h1 { color: #fe4e51; border-bottom: 2px solid #fe4e51; padding-bottom: 8px; font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    h2 { color: #1a1a1a; font-size: 20px; font-weight: 700; margin-top: 28px; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    h3 { color: #374151; font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 8px; }
    p { margin: 8px 0; }
    strong { color: #111; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; font-size: 13px; }
    th { background: #f3f4f6; font-weight: 600; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin: 4px 0; line-height: 1.6; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    .print-date { color: #9ca3af; font-size: 12px; margin-bottom: 16px; }
    @media print { body { margin: 20px; } @page { margin: 1in; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="print-date">Generated: ${new Date().toLocaleString()}</p>
  <hr />
  <div>${markdownToHTML(cleaned)}</div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
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
