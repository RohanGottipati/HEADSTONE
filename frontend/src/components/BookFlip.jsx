import { useEffect, useMemo, useRef, useState } from 'react';

const C = {
  coverBg: '#3d2310',
  coverText: '#f5e6c8',
  pageBg: '#fefbf6',
  pageLine: '#e8e0d0',
  pageText: '#1c1208',
  pageMuted: '#8d7b62',
  accent: '#c44f28',
  green: '#2d6a38',
  brown: '#6b4226',
  shadow: 'rgba(28, 18, 8, 0.2)',
};

const BASE = `font-family:'Manrope',sans-serif;`;
const MONO = `font-family:'IBM Plex Mono',monospace;`;
const PREVIEW_SIZE = { width: 520, height: 380 };
const STORY_SIZE = { width: 980, height: 620 };

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function shorten(value, max = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function coverCSS(extra = '') {
  return `background:${C.coverBg};display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:32px 28px;height:100%;position:relative;box-sizing:border-box;overflow:hidden;${extra}`;
}

function pageCSS(extra = '') {
  return `background:${C.pageBg};display:flex;flex-direction:column;padding:28px 24px;height:100%;position:relative;box-sizing:border-box;background-image:repeating-linear-gradient(transparent,transparent 27px,${C.pageLine} 27px,${C.pageLine} 28px);background-position:0 36px;overflow:hidden;${extra}`;
}

function badgeCSS(color) {
  return `${MONO}font-size:0.58rem;font-weight:600;color:#fefbf6;background:${color};padding:4px 8px;border-radius:999px;white-space:nowrap;margin-top:2px;flex-shrink:0;letter-spacing:0.08em;text-transform:uppercase;`;
}

function pageNumCSS() {
  return `${MONO}position:absolute;bottom:16px;right:20px;font-size:0.6rem;color:${C.pageMuted};font-weight:600;letter-spacing:0.08em;`;
}

function sectionLabel(text) {
  return `<div style="${MONO}font-size:0.58rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.accent};margin-bottom:8px;">${escapeHtml(text)}</div>`;
}

function sourceDomain(url = '') {
  if (!url) return 'Public record';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Public record';
  }
}

function toTitleCase(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function statusMeta(entry = {}) {
  if (entry.is_alive) {
    return { label: 'Still live', color: C.green };
  }

  switch (entry.how_far) {
    case 'won':
      return { label: 'Won early', color: C.green };
    case 'placed':
      return { label: 'Placed', color: '#8a6130' };
    case 'shipped':
      return { label: 'Shipped', color: C.accent };
    case 'abandoned':
      return { label: 'Ended', color: C.brown };
    default:
      return { label: 'Unknown', color: '#85715a' };
  }
}

function storyPositionCopy(index, total, entry) {
  if (total <= 1) {
    return 'A single visible attempt can still reveal how the category first took shape.';
  }
  if (index === 0) {
    return 'One of the earliest visible attempts in the record, setting the first recognizable shape of the category.';
  }
  if (index === total - 1 && entry?.is_alive) {
    return 'One of the latest survivors, showing which parts of the idea the market still rewards.';
  }
  if (index === total - 1) {
    return 'One of the latest documented attempts, close enough to the present to show what still remained unsolved.';
  }
  return 'A later wave in the story, reacting to what earlier launches had already taught the market.';
}

function buildBulletList(items, emptyText, color, maxItems = 2) {
  const safeItems = Array.isArray(items)
    ? items.map((item) => shorten(item, 96)).filter(Boolean).slice(0, maxItems)
    : [];

  if (!safeItems.length) {
    return `<p style="${BASE}font-size:0.72rem;line-height:1.65;color:${C.pageMuted};">${escapeHtml(shorten(emptyText, 150))}</p>`;
  }

  return safeItems
    .map(
      (item) => `
        <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;">
          <div style="width:7px;height:7px;border-radius:999px;background:${color};margin-top:7px;flex-shrink:0;"></div>
          <div style="${BASE}font-size:0.72rem;line-height:1.65;color:${C.pageText};">${escapeHtml(item)}</div>
        </div>`
    )
    .join('');
}

function buildCallout(label, text, tone = 'accent') {
  const borderColor = tone === 'success' ? C.green : tone === 'quiet' ? C.pageLine : C.accent;
  const textColor = tone === 'success' ? C.green : C.pageMuted;

  return `
    <div style="border:1px solid ${borderColor};border-radius:14px;padding:14px 14px 12px;background:rgba(255,255,255,0.45);box-shadow:0 8px 24px rgba(28,18,8,0.04);">
      <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${textColor};margin-bottom:8px;">${escapeHtml(label)}</div>
      <div style="${BASE}font-size:0.76rem;line-height:1.65;color:${C.pageText};">${escapeHtml(shorten(text, 165) || 'No reliable signal was captured.')}</div>
    </div>`;
}

function formatAttemptYear(entry) {
  if (entry?.year) {
    return String(entry.year);
  }
  return 'Unknown year';
}

function buildAttemptOutcome(entry) {
  if (entry?.is_alive) {
    return entry.did_right?.[0] || 'It stayed alive long enough to prove the core demand never disappeared.';
  }
  if (entry?.cause_of_death && entry.cause_of_death !== 'no public record of continuation') {
    return entry.cause_of_death;
  }
  return 'No public record fully explains how this attempt ended.';
}

function buildAttemptStrength(entry) {
  return entry?.did_well || buildAttemptDifference(entry);
}

function buildAttemptWeakness(entry) {
  return entry?.did_poorly || entry?.project_lacks || buildAttemptOutcome(entry);
}

function buildAttemptAdvice(entry) {
  return entry?.avoid_mistakes || entry?.improvement_suggestions || buildAttemptLesson(entry);
}

function buildAttemptLesson(entry) {
  if (entry?.lesson) return entry.lesson;
  if (entry?.is_alive) {
    return 'Survival in this category usually comes from compounding distribution and retention after launch.';
  }
  return 'The category kept attracting builders, but durability after launch was the recurring test.';
}

function buildAttemptDifference(entry) {
  return (
    entry?.what_made_it_different ||
    entry?.did_right?.[0] ||
    'This attempt mattered because it gave the market another concrete version of the idea to react to.'
  );
}

function buildFrontCover({ title = 'SCOUT', subtitle = 'A field guide to ideas that came before yours' } = {}) {
  return `
    <div style="${coverCSS()}">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 8px);pointer-events:none;"></div>
      <div style="width:3px;height:100%;position:absolute;left:0;top:0;background:rgba(0,0,0,0.35);box-shadow:2px 0 8px rgba(0,0,0,0.3);"></div>
      <div style="margin-bottom:auto;padding-top:8px;">
        <div style="${BASE}font-weight:800;font-size:0.65rem;letter-spacing:0.18em;color:${C.accent};margin-bottom:16px;">IDEA ARCHIVE</div>
        <div style="${BASE}font-weight:800;font-size:2.2rem;line-height:1.0;letter-spacing:-0.02em;color:${C.coverText};max-width:190px;overflow-wrap:anywhere;">${escapeHtml(shorten(title, 42))}</div>
        <div style="width:32px;height:2px;background:${C.accent};margin-top:12px;margin-bottom:14px;"></div>
        <div style="${BASE}font-weight:400;font-size:0.72rem;line-height:1.55;color:rgba(245,230,200,0.6);max-width:160px;">${escapeHtml(shorten(subtitle, 88))}</div>
      </div>
      <div style="${BASE}font-weight:600;font-size:0.6rem;letter-spacing:0.1em;color:rgba(245,230,200,0.35);margin-top:auto;">VOL. I — 2024</div>
    </div>`;
}

function buildInsideCover(text) {
  return `<div style="background:#2a1a0e;display:flex;align-items:center;justify-content:center;height:100%;box-sizing:border-box;"><div style="${MONO}font-size:0.65rem;color:rgba(245,230,200,0.25);letter-spacing:0.1em;text-transform:uppercase;text-align:center;padding:0 24px;line-height:1.8;">${escapeHtml(text)}</div></div>`;
}

function buildIntroPage() {
  return `
    <div style="${pageCSS()}">
      <div style="${BASE}font-weight:800;font-size:0.6rem;letter-spacing:0.14em;color:${C.accent};margin-bottom:18px;margin-top:4px;">FOREWORD</div>
      <p style="${BASE}font-weight:500;font-size:0.75rem;line-height:1.9;color:${C.pageText};margin-bottom:14px;">Every idea arrives feeling original. Most aren&apos;t. This archive documents the ones that came before — built, abandoned, or silently competing.</p>
      <p style="${BASE}font-weight:400;font-size:0.72rem;line-height:1.9;color:${C.pageMuted};">Use it to find the gap no one has claimed yet.</p>
      <div style="${pageNumCSS()}">1</div>
    </div>`;
}

function buildCasePage(num, title, year, status, statusColor, notes, pageNum) {
  const noteItems = notes
    .map(
      (note) => `
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-start;">
          <div style="${BASE}color:${C.accent};font-size:0.6rem;margin-top:3px;flex-shrink:0;">—</div>
          <div style="${BASE}font-size:0.72rem;line-height:1.7;color:${C.pageText};font-weight:400;">${escapeHtml(note)}</div>
        </div>`
    )
    .join('');
  return `
    <div style="${pageCSS()}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;margin-top:4px;gap:12px;">
        <div>
          <div style="${MONO}font-weight:800;font-size:0.58rem;letter-spacing:0.14em;color:${C.pageMuted};margin-bottom:4px;">CASE ${escapeHtml(num)}</div>
          <div style="${BASE}font-weight:700;font-size:0.95rem;color:${C.pageText};line-height:1.2;">${escapeHtml(title)}</div>
        </div>
        <div style="${badgeCSS(statusColor)}">${escapeHtml(status)}</div>
      </div>
      <div style="${MONO}font-size:0.62rem;font-weight:600;color:${C.pageMuted};margin-bottom:10px;letter-spacing:0.06em;">${escapeHtml(year)}</div>
      ${noteItems}
      <div style="${pageNumCSS()}">${pageNum}</div>
    </div>`;
}

function buildGapPagePreview() {
  return `
    <div style="background:#fdf8f0;display:flex;flex-direction:column;padding:28px 24px;height:100%;box-sizing:border-box;justify-content:center;overflow:hidden;">
      <div style="border:1.5px solid ${C.accent};border-radius:8px;padding:24px 20px;position:relative;">
        <div style="${MONO}font-weight:800;font-size:0.6rem;letter-spacing:0.16em;color:${C.accent};margin-bottom:12px;">THE GAP</div>
        <div style="${BASE}font-weight:700;font-size:0.9rem;color:${C.pageText};line-height:1.35;margin-bottom:12px;">What no one has built yet</div>
        <div style="${BASE}font-size:0.7rem;line-height:1.75;color:${C.pageMuted};">Every archive has a blank page at the end. That&apos;s yours. SCOUT maps the territory — you plant the flag.</div>
      </div>
      <div style="${pageNumCSS()}">6</div>
    </div>`;
}

function buildBackCover(title = 'SCOUT') {
  return `
    <div style="${coverCSS('align-items:center;justify-content:center;')}">
      <div style="width:3px;height:100%;position:absolute;right:0;top:0;background:rgba(0,0,0,0.35);box-shadow:-2px 0 8px rgba(0,0,0,0.3);"></div>
      <div style="text-align:center;max-width:220px;">
        <div style="${BASE}font-weight:800;font-size:1.4rem;color:${C.coverText};letter-spacing:-0.02em;margin-bottom:10px;line-height:1.15;">${escapeHtml(title)}</div>
        <div style="width:24px;height:2px;background:${C.accent};margin:0 auto 12px;"></div>
        <div style="${BASE}font-size:0.65rem;color:rgba(245,230,200,0.45);letter-spacing:0.06em;line-height:1.6;">Open yours<br>before you build.</div>
      </div>
    </div>`;
}

function buildStoryCover(data, timeline) {
  const years = timeline.map((entry) => entry.year).filter(Boolean);
  const span = years.length ? `${Math.min(...years)} — ${Math.max(...years)}` : 'Unmapped';
  return `
    <div style="${coverCSS('padding:42px 36px;')}">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at top right, rgba(196,79,40,0.22), transparent 42%),repeating-linear-gradient(135deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 9px);pointer-events:none;"></div>
      <div style="width:5px;height:100%;position:absolute;left:0;top:0;background:rgba(0,0,0,0.35);box-shadow:2px 0 12px rgba(0,0,0,0.32);"></div>
      <div style="${MONO}font-size:0.7rem;letter-spacing:0.22em;color:${C.accent};text-transform:uppercase;margin-bottom:24px;">Idea archive</div>
      <div style="${BASE}font-size:2.9rem;font-weight:800;line-height:1.02;letter-spacing:-0.04em;color:${C.coverText};max-width:360px;overflow-wrap:anywhere;margin-bottom:16px;">${escapeHtml(shorten(data.idea || 'Untitled idea', 64))}</div>
      <div style="width:44px;height:2px;background:${C.accent};margin-bottom:16px;"></div>
      <div style="${BASE}font-size:0.92rem;line-height:1.7;color:rgba(245,230,200,0.7);max-width:340px;">A chronological story of every visible attempt, from the first recorded build to the opening you could still claim now.</div>
      <div style="margin-top:auto;display:flex;gap:12px;flex-wrap:wrap;">
        <div style="${badgeCSS('rgba(196,79,40,0.88)')}border:none;">${timeline.length} attempts</div>
        <div style="${badgeCSS('rgba(42,26,14,0.78)')}border:1px solid rgba(245,230,200,0.14);">${escapeHtml(span)}</div>
      </div>
    </div>`;
}

function buildStoryIntroPage(data, timeline, pageNumber) {
  const years = timeline.map((entry) => entry.year).filter(Boolean);
  const earliest = years.length ? Math.min(...years) : null;
  const latest = years.length ? Math.max(...years) : null;
  const survivors = timeline.filter((entry) => entry.is_alive).length;
  const attemptsCopy = timeline.length
    ? `This archive follows ${timeline.length} real attempt${timeline.length === 1 ? '' : 's'} ${earliest && latest ? `from ${earliest} to ${latest}` : 'through the available record'}, ordered from oldest to newest so the category matures page by page.`
    : 'This archive could not confirm a strong public lineage of predecessor products, which means absence of history is part of the signal.';

  const turnSentence = shorten(
    data.turn_sentence || 'The recurring pattern only becomes obvious when the pages are viewed as one continuous story.',
    150
  );

  return `
    <div style="${pageCSS('padding:34px 30px;')}">
      ${sectionLabel('Foreword')}
      <div style="${BASE}font-size:1.36rem;font-weight:800;line-height:1.18;color:${C.pageText};margin-bottom:14px;max-width:360px;">How this idea learned to become a market</div>
      <p style="${BASE}font-size:0.82rem;line-height:1.82;color:${C.pageText};max-width:390px;margin-bottom:16px;">${escapeHtml(attemptsCopy)}</p>
      <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:16px;align-items:start;flex:1;min-height:0;">
        <div>
          <div style="border:1px solid ${C.pageLine};border-radius:18px;padding:16px;background:rgba(255,255,255,0.46);margin-bottom:14px;">
            <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};margin-bottom:8px;">What repeats</div>
            <div style="${BASE}font-size:0.92rem;line-height:1.7;color:${C.pageText};font-weight:700;">${escapeHtml(turnSentence)}</div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div style="border:1px solid ${C.pageLine};border-radius:999px;padding:8px 12px;background:#fffaf3;${MONO}font-size:0.58rem;letter-spacing:0.12em;text-transform:uppercase;color:${C.pageMuted};">${timeline.length} attempts logged</div>
            <div style="border:1px solid ${C.pageLine};border-radius:999px;padding:8px 12px;background:#fffaf3;${MONO}font-size:0.58rem;letter-spacing:0.12em;text-transform:uppercase;color:${C.pageMuted};">${survivors} still alive</div>
            <div style="border:1px solid ${C.pageLine};border-radius:999px;padding:8px 12px;background:#fffaf3;${MONO}font-size:0.58rem;letter-spacing:0.12em;text-transform:uppercase;color:${C.pageMuted};">${data.research_quality?.distinct_domains || 0} domains checked</div>
          </div>
        </div>
        <div style="border-left:1px solid ${C.pageLine};padding-left:16px;">
          <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};margin-bottom:8px;">Archive note</div>
          <p style="${BASE}font-size:0.72rem;line-height:1.8;color:${C.pageMuted};margin-bottom:12px;">Each turn tracks one attempt: what it shipped, the angle it tried, what moved the category forward, and what stalled or survived.</p>
          <p style="${BASE}font-size:0.72rem;line-height:1.8;color:${C.pageMuted};">By the final pages, the repeated pattern, the open gap, and your place in the story should feel obvious.</p>
        </div>
      </div>
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildAttemptPage(entry, index, total, pageNumber) {
  const status = statusMeta(entry);
  const source = entry.sources?.[0]?.title || sourceDomain(entry.source_url);
  const title = shorten(entry.title || 'Unknown attempt', 48);
  const narrativeLead = shorten(entry.did_well || storyPositionCopy(index, total, entry), 150);
  const built = shorten(
    entry.what_was_built || 'No reliable public description captured for what this team actually shipped.',
    230
  );

  return `
    <div style="${pageCSS('padding:34px 30px;')}">
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px;">
        <div>
          <div style="${MONO}font-size:0.58rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};margin-bottom:6px;">Attempt ${String(index + 1).padStart(2, '0')}</div>
          <div style="${BASE}font-size:1.46rem;font-weight:800;line-height:1.1;color:${C.pageText};max-width:330px;overflow-wrap:anywhere;">${escapeHtml(title)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <div style="${badgeCSS(status.color)}">${escapeHtml(status.label)}</div>
          <div style="${MONO}font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:${C.pageMuted};">${escapeHtml(formatAttemptYear(entry))}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.08fr 0.92fr;gap:16px;align-items:start;flex:1;min-height:0;">
        <div>
          <p style="${BASE}font-size:0.72rem;line-height:1.8;color:${C.pageMuted};margin-bottom:14px;">${escapeHtml(narrativeLead)}</p>
          <div style="border:1px solid ${C.pageLine};border-radius:18px;padding:16px;background:rgba(255,255,255,0.42);margin-bottom:14px;">
            ${sectionLabel('What they built')}
            <p style="${BASE}font-size:0.79rem;line-height:1.8;color:${C.pageText};">${escapeHtml(built)}</p>
          </div>
          <div style="margin-bottom:14px;">
            ${sectionLabel('What moved the story forward')}
            ${buildBulletList(
              entry.did_right,
              entry.did_well || 'The public record shows the attempt existed, but not enough detail survived to prove which choices worked best.',
              C.green
            )}
          </div>
          <div>
            ${sectionLabel('Where it still broke down')}
            ${buildBulletList(
              entry.did_wrong,
              buildAttemptWeakness(entry),
              C.accent
            )}
          </div>
        </div>

        <div style="display:grid;gap:12px;align-self:stretch;">
          ${buildCallout('What worked', buildAttemptStrength(entry), 'success')}
          ${buildCallout('What failed', buildAttemptWeakness(entry), entry.is_alive ? 'quiet' : 'accent')}
          ${buildCallout('Build differently', buildAttemptAdvice(entry), 'quiet')}
          <div style="margin-top:auto;border-top:1px solid ${C.pageLine};padding-top:12px;">
            <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};margin-bottom:8px;">Evidence</div>
            <div style="${BASE}font-size:0.72rem;line-height:1.7;color:${C.pageText};">${escapeHtml(shorten(source, 84))}</div>
            <div style="${MONO}font-size:0.54rem;letter-spacing:0.14em;text-transform:uppercase;color:${C.pageMuted};margin-top:6px;">Confidence: ${escapeHtml(toTitleCase(entry.confidence || 'low'))}</div>
          </div>
        </div>
      </div>

      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildCompetitorsPage(competitors, pageNumber) {
  const cards = Array.isArray(competitors) ? competitors.slice(0, 4) : [];
  const content = cards.length
    ? cards
        .map(
          (competitor) => `
            <div style="border:1px solid ${C.pageLine};border-radius:16px;padding:14px;background:rgba(255,255,255,0.46);">
              <div style="${BASE}font-size:0.9rem;font-weight:800;color:${C.pageText};line-height:1.3;margin-bottom:6px;overflow-wrap:anywhere;">${escapeHtml(shorten(competitor.name || 'Unknown competitor', 42))}</div>
              <div style="${MONO}font-size:0.54rem;letter-spacing:0.14em;text-transform:uppercase;color:${C.green};margin-bottom:8px;">Still standing</div>
              <p style="${BASE}font-size:0.7rem;line-height:1.7;color:${C.pageText};margin-bottom:8px;">${escapeHtml(shorten(competitor.signal || 'Visible current market signal.', 96))}</p>
              <p style="${BASE}font-size:0.68rem;line-height:1.65;color:${C.pageMuted};">Weak spot: ${escapeHtml(shorten(competitor.weakness || 'No clear vulnerability captured.', 88))}</p>
            </div>`
        )
        .join('')
    : `<div style="border:1px solid ${C.pageLine};border-radius:18px;padding:18px;background:rgba(255,255,255,0.46);${BASE}font-size:0.78rem;line-height:1.8;color:${C.pageMuted};">No live competitor pages were strong enough to feature here, which usually means the public record is thin or the space is still fragmented.</div>`;

  return `
    <div style="${pageCSS('padding:34px 30px;')}">
      ${sectionLabel('Who is still standing')}
      <div style="${BASE}font-size:1.38rem;font-weight:800;line-height:1.18;color:${C.pageText};margin-bottom:12px;max-width:360px;">The market that survived the earlier waves</div>
      <p style="${BASE}font-size:0.78rem;line-height:1.8;color:${C.pageMuted};margin-bottom:18px;max-width:400px;">These are the products or companies still occupying the shelf after the historical attempts above. Their presence shows what the category learned to reward — and what they still haven&apos;t solved cleanly.</p>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-content:start;">
        ${content}
      </div>
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildIndexPage(data, timeline, pageNumber, pageIndex, totalPages) {
  const rows = timeline.slice(pageIndex * 4, pageIndex * 4 + 4);
  const start = pageIndex * 4;
  const content = rows.length
    ? rows
        .map((entry, offset) => {
          const index = start + offset;
          const status = statusMeta(entry);
          return `
            <a href="/product/${index}" style="display:grid;grid-template-columns:76px 1fr auto;gap:12px;align-items:start;text-decoration:none;border:1px solid ${C.pageLine};border-radius:16px;padding:13px 14px;background:rgba(255,255,255,0.48);margin-bottom:10px;color:${C.pageText};">
              <div style="${MONO}font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:${C.pageMuted};line-height:1.5;">${escapeHtml(formatAttemptYear(entry))}</div>
              <div style="min-width:0;">
                <div style="${BASE}font-size:0.9rem;font-weight:800;line-height:1.25;color:${C.pageText};overflow-wrap:anywhere;margin-bottom:5px;">${escapeHtml(shorten(entry.title || `Attempt ${index + 1}`, 54))}</div>
                <div style="${BASE}font-size:0.68rem;line-height:1.55;color:${C.pageMuted};overflow-wrap:anywhere;">${escapeHtml(shorten(entry.what_was_built || buildAttemptDifference(entry), 110))}</div>
              </div>
              <div style="${badgeCSS(status.color)}">${escapeHtml(status.label)}</div>
            </a>`;
        })
        .join('')
    : `<div style="border:1px solid ${C.pageLine};border-radius:18px;padding:18px;background:rgba(255,255,255,0.46);${BASE}font-size:0.78rem;line-height:1.8;color:${C.pageMuted};">No attempts were found. Try a more specific idea on the cover page.</div>`;

  return `
    <div style="${pageCSS('padding:34px 30px;background-image:none;background:linear-gradient(180deg,#fefbf6 0%,#f9f0e5 100%);')}">
      ${sectionLabel('The notebook index')}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:14px;">
        <div>
          <div style="${BASE}font-size:1.38rem;font-weight:800;line-height:1.16;color:${C.pageText};max-width:360px;overflow-wrap:anywhere;">Every attempt at ${escapeHtml(shorten(data.idea || 'this idea', 48))}</div>
          <p style="${BASE}font-size:0.74rem;line-height:1.72;color:${C.pageMuted};margin-top:10px;max-width:390px;">Ordered oldest to newest. Open any row to jump directly to that attempt inside the notebook.</p>
        </div>
        <div style="${MONO}font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:${C.pageMuted};white-space:nowrap;">${timeline.length} logged</div>
      </div>
      <div style="flex:1;min-height:0;">${content}</div>
      ${
        totalPages > 1
          ? `<div style="${MONO}position:absolute;bottom:16px;left:30px;font-size:0.56rem;letter-spacing:0.14em;text-transform:uppercase;color:${C.pageMuted};">Index ${pageIndex + 1} / ${totalPages}</div>`
          : ''
      }
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildPatternPage(data, timeline, pageNumber) {
  const repeatingNotes = timeline
    .flatMap((entry) => [...(entry.did_wrong || []), entry.cause_of_death || ''])
    .map((item) => shorten(item, 88))
    .filter(Boolean)
    .slice(0, 3);

  return `
    <div style="${pageCSS('padding:34px 30px;background-image:none;background:linear-gradient(180deg,#fefbf6 0%,#faf2e7 100%);')}">
      ${sectionLabel('The recurring pattern')}
      <div style="${BASE}font-size:1.52rem;font-weight:800;line-height:1.15;color:${C.pageText};max-width:390px;margin-bottom:16px;">${escapeHtml(shorten(data.turn_sentence || 'The archive could not prove a single dominant failure mode.', 150))}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;flex:1;min-height:0;">
        <div style="border:1px solid rgba(196,79,40,0.18);border-radius:22px;padding:18px;background:rgba(255,255,255,0.56);box-shadow:0 18px 46px rgba(196,79,40,0.08);">
          <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.accent};margin-bottom:10px;">What the judges should see</div>
          <p style="${BASE}font-size:0.8rem;line-height:1.85;color:${C.pageText};">By the time the reader reaches this spread, the same weakness should feel undeniable: each attempt solved enough to launch, but not enough to escape the same trap.</p>
        </div>
        <div>
          ${sectionLabel('Repeated signals')}
          ${buildBulletList(
            repeatingNotes,
            'The research captured the overall pattern more clearly than the individual postmortems.',
            C.accent
          )}
          <div style="margin-top:16px;${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};">Pattern confidence — ${escapeHtml(toTitleCase(data.pattern_confidence || 'low'))}</div>
        </div>
      </div>
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildGapPage(data, pageNumber) {
  return `
    <div style="${pageCSS('padding:34px 30px;background-image:none;background:linear-gradient(180deg,#fdf8f0 0%,#fffdf8 100%);justify-content:center;')}">
      <div style="border:1.5px solid ${C.accent};border-radius:20px;padding:26px 24px;background:rgba(255,255,255,0.58);box-shadow:0 24px 70px rgba(196,79,40,0.1);">
        ${sectionLabel('The gap still open')}
        <div style="${BASE}font-weight:800;font-size:1.48rem;color:${C.pageText};line-height:1.18;margin-bottom:14px;max-width:420px;">What nobody has fully claimed yet</div>
        <div style="${BASE}font-size:0.82rem;line-height:1.9;color:${C.pageText};margin-bottom:16px;">${escapeHtml(shorten(data.gap || 'The archive did not find a strong enough opening to name with confidence.', 350))}</div>
        <div style="border-top:1px solid rgba(196,79,40,0.16);padding-top:14px;">
          <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};margin-bottom:8px;">Why now</div>
          <div style="${BASE}font-size:0.74rem;line-height:1.75;color:${C.pageMuted};">${escapeHtml(shorten(data.clock || 'Timing is still unclear from the public record.', 150))}</div>
        </div>
      </div>
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildFinalChapterPage(data, timeline, pageNumber) {
  const firstLiveCompetitor = data.competitors?.[0]?.name;
  const survivorCount = timeline.filter((entry) => entry.is_alive).length;
  const finalNote = firstLiveCompetitor
    ? `The category still has survivors like ${firstLiveCompetitor}, but none has closed the story for good.`
    : survivorCount
      ? `Some attempts survived, but survival is not the same thing as finishing the story.`
      : 'The archive ends without a definitive winner, which is exactly why a new chapter is still possible.';

  return `
    <div style="${pageCSS('padding:34px 30px;background-image:none;background:linear-gradient(145deg,#fdf6ee 0%,#f7eee2 45%,#fefbf6 100%);')}">
      ${sectionLabel('Your chapter')}
      <div style="${BASE}font-size:1.7rem;font-weight:800;line-height:1.08;color:${C.pageText};max-width:360px;margin-bottom:12px;overflow-wrap:anywhere;">The next chapter belongs to ${escapeHtml(shorten(data.idea || 'this idea', 46))}</div>
      <p style="${BASE}font-size:0.8rem;line-height:1.82;color:${C.pageMuted};max-width:410px;margin-bottom:18px;">${escapeHtml(shorten(finalNote, 160))}</p>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start;">
        ${buildCallout('Repeat no more', data.turn_sentence || 'No dominant failure pattern was proven strongly enough to feature here.', 'accent')}
        ${buildCallout('Open space', data.gap || 'The market opening still needs sharper evidence.', 'success')}
        ${buildCallout('Timing window', data.clock || 'The timing signal is still incomplete.', 'quiet')}
      </div>
      <div style="margin-top:auto;border-top:1px solid ${C.pageLine};padding-top:16px;display:flex;justify-content:space-between;gap:18px;align-items:flex-end;">
        <div>
          <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};margin-bottom:8px;">What the book leaves you with</div>
          <div style="${BASE}font-size:0.76rem;line-height:1.75;color:${C.pageText};max-width:400px;">Use the pages before this one as constraints, not inspiration alone: keep what survived, refuse the repeated trap, and build the version the story has been pointing toward.</div>
        </div>
        <div style="${MONO}font-size:0.58rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.accent};white-space:nowrap;">Next: build the plan</div>
      </div>
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildBuildLoadingPage(data, planState, planError, pageNumber) {
  const isError = planState === 'error';
  return `
    <div style="${pageCSS('padding:34px 30px;background-image:none;background:linear-gradient(180deg,#fdf8f0 0%,#fffdf8 100%);justify-content:center;')}">
      <div style="border:1.5px solid ${isError ? '#a85050' : C.accent};border-radius:22px;padding:28px 26px;background:rgba(255,255,255,0.58);box-shadow:0 24px 70px rgba(196,79,40,0.1);">
        ${sectionLabel('The next chapter')}
        <div style="${BASE}font-weight:800;font-size:1.52rem;color:${C.pageText};line-height:1.16;margin-bottom:14px;max-width:410px;">${isError ? 'The build plan needs another pass' : 'Drafting your build plan'}</div>
        <p style="${BASE}font-size:0.82rem;line-height:1.85;color:${C.pageText};margin-bottom:16px;">${escapeHtml(
          isError
            ? `The planner could not finish this draft${planError ? `: ${planError}` : '.'}`
            : `The notebook is turning the archive for "${data.idea || 'this idea'}" into the first version worth shipping.`
        )}</p>
        <div style="border-top:1px solid rgba(196,79,40,0.16);padding-top:14px;">
          <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};margin-bottom:8px;">Input signal</div>
          <div style="${BASE}font-size:0.74rem;line-height:1.75;color:${C.pageMuted};">${escapeHtml(shorten(data.gap || data.turn_sentence || 'Waiting on the research archive.', 170))}</div>
        </div>
      </div>
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildPlanSummaryPage(data, plan, pageNumber) {
  return `
    <div style="${pageCSS('padding:34px 30px;background-image:none;background:linear-gradient(145deg,#fdf6ee 0%,#f7eee2 48%,#fefbf6 100%);')}">
      ${sectionLabel('The next chapter')}
      <div style="${BASE}font-size:1.54rem;font-weight:800;line-height:1.12;color:${C.pageText};max-width:390px;margin-bottom:12px;overflow-wrap:anywhere;">${escapeHtml(shorten(plan?.headline || `Your build of ${data.idea || 'this idea'}`, 92))}</div>
      <p style="${BASE}font-size:0.8rem;line-height:1.82;color:${C.pageMuted};max-width:410px;margin-bottom:18px;">${escapeHtml(shorten(plan?.positioning || data.gap || 'Use the archive as constraints for what to build next.', 240))}</p>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start;">
        ${buildCallout('Wedge', data.gap || 'The opening still needs sharper evidence.', 'success')}
        ${buildCallout('Avoid', data.turn_sentence || 'No dominant failure pattern was proven strongly enough to feature here.', 'accent')}
        ${buildCallout('Timing', data.clock || 'Timing is still unclear from the public record.', 'quiet')}
      </div>
      <div style="margin-top:auto;border-top:1px solid ${C.pageLine};padding-top:16px;">
        <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};margin-bottom:8px;">How to read this plan</div>
        <div style="${BASE}font-size:0.76rem;line-height:1.75;color:${C.pageText};max-width:410px;">Borrow what survived, refuse what kept killing prior attempts, and ship the smallest test that can prove repeat use.</div>
      </div>
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildPlanBorrowAvoidPage(plan, pageNumber) {
  const borrow = Array.isArray(plan?.borrow_from_winners) ? plan.borrow_from_winners.slice(0, 3) : [];
  const avoid = Array.isArray(plan?.avoid_from_losers) ? plan.avoid_from_losers.slice(0, 3) : [];
  const borrowContent = borrow.length
    ? borrow
        .map(
          (item) => `
            <div style="border:1px solid ${C.pageLine};border-radius:16px;padding:13px;background:rgba(255,255,255,0.48);margin-bottom:10px;">
              <div style="${BASE}font-size:0.8rem;font-weight:800;line-height:1.35;color:${C.pageText};margin-bottom:6px;overflow-wrap:anywhere;">${escapeHtml(shorten(item.feature, 78))}</div>
              <div style="${BASE}font-size:0.68rem;line-height:1.65;color:${C.pageMuted};overflow-wrap:anywhere;">${escapeHtml(shorten(item.why, 110))}</div>
              ${item.source ? `<div style="${MONO}font-size:0.52rem;letter-spacing:0.12em;text-transform:uppercase;color:${C.green};margin-top:8px;">From ${escapeHtml(shorten(item.source, 34))}</div>` : ''}
            </div>`
        )
        .join('')
    : `<p style="${BASE}font-size:0.74rem;line-height:1.75;color:${C.pageMuted};">No clear winners were available to borrow from yet.</p>`;
  const avoidContent = avoid.length
    ? avoid
        .map(
          (item) => `
            <div style="border:1px solid rgba(196,79,40,0.22);border-left:3px solid ${C.accent};border-radius:16px;padding:13px;background:rgba(255,255,255,0.48);margin-bottom:10px;">
              <div style="${BASE}font-size:0.8rem;font-weight:800;line-height:1.35;color:${C.pageText};margin-bottom:6px;overflow-wrap:anywhere;">${escapeHtml(shorten(item.mistake, 78))}</div>
              <div style="${BASE}font-size:0.68rem;line-height:1.65;color:${C.pageMuted};overflow-wrap:anywhere;">${escapeHtml(shorten(item.why, 110))}</div>
              ${item.source ? `<div style="${MONO}font-size:0.52rem;letter-spacing:0.12em;text-transform:uppercase;color:${C.accent};margin-top:8px;">Killed ${escapeHtml(shorten(item.source, 34))}</div>` : ''}
            </div>`
        )
        .join('')
    : `<p style="${BASE}font-size:0.74rem;line-height:1.75;color:${C.pageMuted};">No clear failure modes were extracted from past attempts.</p>`;

  return `
    <div style="${pageCSS('padding:34px 30px;background-image:none;background:#fefbf6;')}">
      ${sectionLabel('Borrow and avoid')}
      <div style="${BASE}font-size:1.34rem;font-weight:800;line-height:1.18;color:${C.pageText};max-width:390px;margin-bottom:16px;">Use the archive as product constraints</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">
        <div>
          <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.green};margin-bottom:10px;">Borrow from winners</div>
          ${borrowContent}
        </div>
        <div>
          <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.accent};margin-bottom:10px;">Do not repeat</div>
          ${avoidContent}
        </div>
      </div>
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildPlanMvpPage(plan, pageNumber) {
  const must = Array.isArray(plan?.mvp?.must_have_features) ? plan.mvp.must_have_features.slice(0, 4) : [];
  const defer = Array.isArray(plan?.mvp?.explicitly_not_in_mvp) ? plan.mvp.explicitly_not_in_mvp.slice(0, 3) : [];
  return `
    <div style="${pageCSS('padding:34px 30px;background-image:none;background:linear-gradient(180deg,#fffdf8 0%,#f9f0e5 100%);')}">
      ${sectionLabel('MVP')}
      <div style="${BASE}font-size:1.42rem;font-weight:800;line-height:1.16;color:${C.pageText};max-width:390px;margin-bottom:12px;">The smallest thing worth shipping</div>
      <p style="${BASE}font-size:0.8rem;line-height:1.8;color:${C.pageText};max-width:420px;margin-bottom:16px;">${escapeHtml(shorten(plan?.mvp?.summary || 'MVP plan unavailable.', 220))}</p>
      <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:16px;align-items:start;">
        <div>
          ${sectionLabel('Must have')}
          ${buildBulletList(must, 'No must-have features were returned.', C.green, 4)}
          <div style="margin-top:14px;">
            ${sectionLabel('First user test')}
            <p style="${BASE}font-size:0.74rem;line-height:1.75;color:${C.pageText};">${escapeHtml(shorten(plan?.mvp?.first_user_test || 'No first user test was returned.', 150))}</p>
          </div>
        </div>
        <div style="border-left:1px solid ${C.pageLine};padding-left:16px;">
          ${sectionLabel('Defer')}
          ${buildBulletList(defer, 'No explicit deferrals were returned.', C.accent, 3)}
        </div>
      </div>
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildPlanGrowthPage(plan, pageNumber) {
  const features = Array.isArray(plan?.v1_features) ? plan.v1_features.slice(0, 3) : [];
  const risks = Array.isArray(plan?.risks) ? plan.risks.slice(0, 2) : [];
  const featureContent = features.length
    ? features
        .map(
          (item) => `
            <div style="border:1px solid ${C.pageLine};border-radius:16px;padding:13px;background:rgba(255,255,255,0.48);margin-bottom:10px;">
              <div style="${BASE}font-size:0.8rem;font-weight:800;line-height:1.35;color:${C.pageText};margin-bottom:5px;overflow-wrap:anywhere;">${escapeHtml(shorten(item.feature, 78))}</div>
              <div style="${BASE}font-size:0.68rem;line-height:1.62;color:${C.pageMuted};overflow-wrap:anywhere;">${escapeHtml(shorten(item.why, 104))}</div>
            </div>`
        )
        .join('')
    : `<p style="${BASE}font-size:0.74rem;line-height:1.75;color:${C.pageMuted};">No V1 features were returned.</p>`;
  const riskContent = risks.length
    ? risks
        .map(
          (item) => `
            <div style="border:1px solid rgba(196,79,40,0.18);border-radius:16px;padding:13px;background:rgba(255,255,255,0.48);margin-bottom:10px;">
              <div style="${BASE}font-size:0.78rem;font-weight:800;line-height:1.35;color:${C.pageText};margin-bottom:5px;overflow-wrap:anywhere;">${escapeHtml(shorten(item.risk, 72))}</div>
              <div style="${BASE}font-size:0.68rem;line-height:1.62;color:${C.pageMuted};overflow-wrap:anywhere;">${escapeHtml(shorten(item.mitigation, 104))}</div>
            </div>`
        )
        .join('')
    : `<p style="${BASE}font-size:0.74rem;line-height:1.75;color:${C.pageMuted};">No risks were returned.</p>`;

  return `
    <div style="${pageCSS('padding:34px 30px;background-image:none;background:#fefbf6;')}">
      ${sectionLabel('After the MVP')}
      <div style="${BASE}font-size:1.34rem;font-weight:800;line-height:1.18;color:${C.pageText};max-width:390px;margin-bottom:16px;">Add only what strengthens the loop</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">
        <div>
          <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.green};margin-bottom:10px;">V1 features</div>
          ${featureContent}
        </div>
        <div>
          <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.accent};margin-bottom:10px;">Risks</div>
          ${riskContent}
        </div>
      </div>
      ${
        plan?.moat
          ? `<div style="margin-top:auto;border-top:1px solid ${C.pageLine};padding-top:14px;"><div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};margin-bottom:8px;">Moat</div><div style="${BASE}font-size:0.74rem;line-height:1.72;color:${C.pageText};">${escapeHtml(shorten(plan.moat, 170))}</div></div>`
          : ''
      }
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildPlanNextStepsPage(plan, pageNumber) {
  const steps = Array.isArray(plan?.next_three_steps) ? plan.next_three_steps.slice(0, 3) : [];
  const content = steps.length
    ? steps
        .map(
          (step, index) => `
            <div style="display:grid;grid-template-columns:44px 1fr;gap:14px;align-items:start;border-bottom:1px solid ${C.pageLine};padding:14px 0;">
              <div style="${BASE}font-size:1.5rem;font-weight:800;color:${C.accent};line-height:1;">${String(index + 1).padStart(2, '0')}</div>
              <div style="${BASE}font-size:0.86rem;line-height:1.7;color:${C.pageText};overflow-wrap:anywhere;">${escapeHtml(shorten(step, 150))}</div>
            </div>`
        )
        .join('')
    : `<p style="${BASE}font-size:0.78rem;line-height:1.8;color:${C.pageMuted};">No next steps were returned.</p>`;

  return `
    <div style="${pageCSS('padding:34px 30px;background-image:none;background:linear-gradient(180deg,#fdf8f0 0%,#fffdf8 100%);')}">
      ${sectionLabel('This week')}
      <div style="${BASE}font-size:1.5rem;font-weight:800;line-height:1.14;color:${C.pageText};max-width:380px;margin-bottom:16px;">The next three moves</div>
      <div style="max-width:420px;">${content}</div>
      <div style="margin-top:auto;border-top:1px solid rgba(196,79,40,0.16);padding-top:14px;">
        <div style="${MONO}font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:${C.pageMuted};margin-bottom:8px;">Iteration desk</div>
        <div style="${BASE}font-size:0.74rem;line-height:1.75;color:${C.pageMuted};">Use the notes below the notebook to rewrite this plan as you learn from users.</div>
      </div>
      <div style="${pageNumCSS()}">${pageNumber}</div>
    </div>`;
}

function buildPreviewPages({ coverTitle, coverSubtitle } = {}) {
  return [
    { hard: true, label: 'Cover', html: buildFrontCover({ title: coverTitle, subtitle: coverSubtitle }) },
    { hard: true, label: 'Inside cover', html: buildInsideCover('— open before you build —') },
    { label: 'Foreword', html: buildIntroPage() },
    {
      label: 'AI Writing Assistants',
      html: buildCasePage(
        '001',
        'AI Writing Assistants',
        '2019 – present',
        'ACTIVE',
        C.green,
        [
          'Jasper, Copy.ai, and Writesonic proved the appetite fast.',
          'The generic layer saturated once the models became common.',
          'What remains open is a sharper vertical wedge.',
        ],
        2
      ),
    },
    {
      label: 'Smart Task Managers',
      html: buildCasePage(
        '002',
        'Smart Task Managers',
        '2020 – 2023',
        'ABANDONED',
        C.accent,
        [
          'A polished product experience drew early attention.',
          'Distribution never became strong enough to compound.',
          'Users kept falling back to simpler workflows they already knew.',
        ],
        3
      ),
    },
    {
      label: 'Social Reading Apps',
      html: buildCasePage(
        '003',
        'Social Reading Apps',
        '2012 – 2022',
        'GRAVEYARD',
        C.brown,
        [
          'Readmill and Findings proved the desire for shared reading trails.',
          'The social layer never stayed sticky enough on its own.',
          'Annotation plus community is still not owned by a default product.',
        ],
        4
      ),
    },
    { label: 'The gap', html: buildGapPagePreview() },
    {
      label: 'No-Code Databases',
      html: buildCasePage(
        '004',
        'No-Code Databases',
        '2018 – present',
        'ACTIVE',
        C.green,
        [
          'Airtable and Notion proved the category can support massive businesses.',
          'Migration and handoff still feel too technical for teams in motion.',
          'Vertical-specific workflows remain underbuilt.',
        ],
        7
      ),
    },
    { hard: true, label: 'Your turn', html: buildInsideCover('— your turn —') },
    { hard: true, label: 'Back cover', html: buildBackCover() },
  ];
}

function buildStoryPages(data, { plan = null, planState = 'idle', planError = null } = {}) {
  const timeline = (data.timeline || []).slice().sort((a, b) => (a.year || 0) - (b.year || 0));
  const pages = [];
  let logicalPage = 1;

  pages.push({ id: 'cover', hard: true, label: 'Cover', html: buildStoryCover(data, timeline) });
  pages.push({ id: 'prompt', hard: true, label: 'Prompt', html: buildInsideCover(`Prompt — ${data.idea || 'Untitled idea'}`) });
  pages.push({ id: 'history', label: 'Foreword', html: buildStoryIntroPage(data, timeline, logicalPage++) });

  const indexPages = timeline.length ? chunk(timeline, 4) : [[]];
  indexPages.forEach((_entries, pageIndex) => {
    pages.push({
      id: pageIndex === 0 ? 'index' : `index-${pageIndex + 1}`,
      label: pageIndex === 0 ? 'Notebook index' : `Notebook index ${pageIndex + 1}`,
      html: buildIndexPage(data, timeline, logicalPage++, pageIndex, indexPages.length),
    });
  });

  if (timeline.length) {
    timeline.forEach((entry, index) => {
      pages.push({
        id: `attempt-${index}`,
        label: entry.title || `Attempt ${index + 1}`,
        html: buildAttemptPage(entry, index, timeline.length, logicalPage++),
      });
    });
  } else {
    pages.push({
      id: 'attempt-empty',
      label: 'No clear lineage',
      html: `
        <div style="${pageCSS('padding:34px 30px;justify-content:center;')}">
          ${sectionLabel('No lineage found')}
          <div style="${BASE}font-size:1.44rem;font-weight:800;line-height:1.16;color:${C.pageText};margin-bottom:14px;max-width:360px;">The archive could not prove a clean historical trail.</div>
          <p style="${BASE}font-size:0.82rem;line-height:1.85;color:${C.pageMuted};max-width:400px;">That does not mean the idea is new. It means public evidence is thin, scattered, or hidden behind adjacent categories. Treat that absence as a research signal and an opportunity to define the category more clearly than the builders before you.</p>
          <div style="${pageNumCSS()}">${logicalPage++}</div>
        </div>`,
    });
  }

  pages.push({ id: 'living-market', label: 'Living market', html: buildCompetitorsPage(data.competitors || [], logicalPage++) });
  pages.push({ id: 'pattern', label: 'Pattern', html: buildPatternPage(data, timeline, logicalPage++) });
  pages.push({ id: 'gap', label: 'Gap', html: buildGapPage(data, logicalPage++) });
  pages.push({ id: 'chapter', label: 'Your chapter', html: buildFinalChapterPage(data, timeline, logicalPage++) });

  if (!plan) {
    pages.push({
      id: 'build',
      label: planState === 'error' ? 'Build plan error' : 'Build plan',
      html: buildBuildLoadingPage(data, planState, planError, logicalPage++),
    });
  } else {
    pages.push({ id: 'build', label: 'Build plan', html: buildPlanSummaryPage(data, plan, logicalPage++) });
    pages.push({ id: 'build-borrow', label: 'Borrow and avoid', html: buildPlanBorrowAvoidPage(plan, logicalPage++) });
    pages.push({ id: 'build-mvp', label: 'MVP', html: buildPlanMvpPage(plan, logicalPage++) });
    pages.push({ id: 'build-growth', label: 'After the MVP', html: buildPlanGrowthPage(plan, logicalPage++) });
    pages.push({ id: 'build-next', label: 'Next steps', html: buildPlanNextStepsPage(plan, logicalPage++) });
  }

  pages.push({ id: 'back-matter', hard: true, label: 'Back matter', html: buildInsideCover('— the next chapter is yours —') });
  pages.push({ id: 'back-cover', hard: true, label: 'Back cover', html: buildBackCover(shorten(data.idea || 'SCOUT', 26)) });

  return pages;
}

export default function BookFlip({
  data = null,
  variant,
  autoOpen = false,
  coverTitle,
  coverSubtitle,
  targetPageId = null,
  plan = null,
  planState = 'idle',
  planError = null,
  onNavigate = null,
}) {
  const resolvedVariant = variant || (data ? 'story' : 'preview');
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const turnRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);

  const { pages, dimensions } = useMemo(() => {
    if (resolvedVariant === 'story' && data) {
      return { pages: buildStoryPages(data, { plan, planState, planError }), dimensions: STORY_SIZE };
    }
    return {
      pages: buildPreviewPages({ coverTitle, coverSubtitle }),
      dimensions: PREVIEW_SIZE,
    };
  }, [coverSubtitle, coverTitle, data, plan, planError, planState, resolvedVariant]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    function updateScale() {
      const width = viewport.clientWidth || dimensions.width;
      const nextScale = Math.min(1, width / dimensions.width);
      setScale(nextScale > 0 ? nextScale : 1);
    }

    updateScale();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateScale);
      observer.observe(viewport);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [dimensions.width]);

  useEffect(() => {
    const $ = window.$;
    const container = containerRef.current;
    if (!$ || !container) return undefined;

    setCurrentPage(1);
    container.innerHTML = '';

    const book = document.createElement('div');
    book.style.cssText = `width:${dimensions.width}px;height:${dimensions.height}px;`;

    pages.forEach(({ hard, html }) => {
      const page = document.createElement('div');
      if (hard) page.className = 'hard';
      page.innerHTML = html;
      book.appendChild(page);
    });

    container.appendChild(book);

    const jqBook = $(book);
    turnRef.current = jqBook;

    jqBook.turn({
      width: dimensions.width,
      height: dimensions.height,
      autoCenter: true,
      display: 'double',
      acceleration: true,
      gradients: true,
      elevation: resolvedVariant === 'story' ? 70 : 50,
      when: {
        turned: (_event, page) => setCurrentPage(page),
      },
    });

    let openTimeout;
    if (resolvedVariant === 'story' && autoOpen) {
      openTimeout = window.setTimeout(() => {
        try {
          jqBook.turn('page', 2);
        } catch {
          // ignore turn.js timing errors during initial mount
        }
      }, 480);
    }

    function onKey(event) {
      if (event.key === 'ArrowRight') {
        jqBook.turn('next');
      }
      if (event.key === 'ArrowLeft') {
        jqBook.turn('previous');
      }
    }

    function onBookClick(event) {
      const link = event.target.closest?.('a[href^="/"]');
      if (!link || !book.contains(link) || !onNavigate) return;
      event.preventDefault();
      onNavigate(link.getAttribute('href'));
    }

    window.addEventListener('keydown', onKey);
    book.addEventListener('click', onBookClick);

    return () => {
      window.removeEventListener('keydown', onKey);
      book.removeEventListener('click', onBookClick);
      if (openTimeout) {
        window.clearTimeout(openTimeout);
      }
      try {
        jqBook.turn('destroy');
      } catch {
        // ignore teardown issues when turn.js already detached
      }
      turnRef.current = null;
      if (container.contains(book)) {
        container.removeChild(book);
      }
    };
  }, [autoOpen, dimensions.height, dimensions.width, onNavigate, pages, resolvedVariant]);

  useEffect(() => {
    if (!targetPageId || resolvedVariant !== 'story') return undefined;

    const targetIndex = pages.findIndex((page) => page.id === targetPageId);
    if (targetIndex < 0) return undefined;

    const timeout = window.setTimeout(() => {
      try {
        turnRef.current?.turn('page', targetIndex + 1);
      } catch {
        // ignore turn.js timing errors while pages are being rebuilt
      }
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [pages, resolvedVariant, targetPageId]);

  function goPrevious() {
    turnRef.current?.turn('previous');
  }

  function goNext() {
    turnRef.current?.turn('next');
  }

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < pages.length;
  const currentLabel = pages[Math.max(0, currentPage - 1)]?.label || 'Cover';
  const stageHeight = dimensions.height * scale;

  return (
    <div style={{ width: '100%' }}>
      <div ref={viewportRef} style={{ width: '100%', overflow: 'visible' }}>
        <div
          style={{
            width: '100%',
            height: stageHeight,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: dimensions.width,
              height: dimensions.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              filter: `drop-shadow(0 28px 72px ${C.shadow}) drop-shadow(0 8px 18px rgba(28,18,8,0.12))`,
              lineHeight: 0,
            }}
          >
            <div ref={containerRef} />
          </div>
        </div>
      </div>

      {resolvedVariant === 'story' && (
        <div style={{ marginTop: '18px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              padding: '0 4px',
            }}
          >
            <button
              type="button"
              onClick={goPrevious}
              disabled={!canGoPrevious}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.72rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                borderRadius: '999px',
                border: '1px solid rgba(28,18,8,0.12)',
                background: '#fffdf9',
                color: canGoPrevious ? '#1c1208' : '#a49682',
                padding: '10px 14px',
                cursor: canGoPrevious ? 'pointer' : 'not-allowed',
              }}
            >
              ← Previous
            </button>

            <div style={{ textAlign: 'center', flex: '1 1 220px' }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.66rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#8d7b62',
                  marginBottom: '6px',
                }}
              >
                Page {currentPage} of {pages.length}
              </div>
              <div
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#1c1208',
                }}
              >
                {currentLabel}
              </div>
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.72rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                borderRadius: '999px',
                border: '1px solid rgba(196,79,40,0.22)',
                background: '#fff0e9',
                color: canGoNext ? '#c44f28' : '#d1b7ab',
                padding: '10px 14px',
                cursor: canGoNext ? 'pointer' : 'not-allowed',
              }}
            >
              Next →
            </button>
          </div>

          <p
            style={{
              marginTop: '10px',
              textAlign: 'center',
              fontFamily: "'Manrope', sans-serif",
              fontSize: '0.82rem',
              color: '#8d7b62',
            }}
          >
            Turn the pages with the buttons or your keyboard arrows.
          </p>
        </div>
      )}
    </div>
  );
}
