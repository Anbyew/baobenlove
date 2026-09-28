// Exports the backdoor Key Info page (/backdoor/info) to two printable PDFs —
// English and Chinese — each with the people directory and the locations.
// The PDFs hold phone numbers and emails, so they're git-ignored; only this
// script is committed.
//
// Run from wedding-site/ (for its tsx + the shared data/helpers):
//   cd wedding-site && npx tsx ../backdoor/key-info/export-pdf.ts
// Reads the saved Key Info document from the API (KEYINFO_API, default the
// local server on :3001) and prints with headless Google Chrome (CHROME).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LOCATION_SECTION_BLURBS, LOCATION_SECTIONS, PEOPLE_GROUPS,
  type KeyInfoDoc, type KeyLocation, type KeyPerson,
} from '../../wedding-site/src/app/backdoor/data/keyInfo';
import { GROUP_ZH, NAME_ZH } from '../../wedding-site/src/app/backdoor/data/keyInfoZh';
import { bi, sortWhen, zhLine } from '../../wedding-site/src/app/backdoor/lib/keyInfoText';

type Lang = 'en' | 'zh';

const API = process.env.KEYINFO_API ?? 'http://localhost:3001/keyinfo';
const SECRET = process.env.SEATING_SECRET ?? 'BKVendor2026';
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = dirname(fileURLToPath(import.meta.url));

const TEXT = {
  en: {
    title: 'Key Info',
    subtitle: 'Yuwei & Ben · October 3, 2026',
    people: 'People',
    locations: 'Locations',
    cols: ['Name', 'Role', 'Contact', 'Notes'],
    contact: 'Contact',
    legend: 'Pronunciations are pinyin-based guesses · ★ = preferred family contact',
    generated: (d: string) => `Exported ${d} from baoben.love/backdoor/info`,
  },
  zh: {
    title: '婚礼关键信息',
    subtitle: 'Yuwei & Ben · 2026年10月3日',
    people: '人员',
    locations: '地点',
    cols: ['姓名', '身份', '联系方式', '备注'],
    contact: '联系人',
    legend: '英文名下方为中文音译，方便称呼 · ★ = 家人首选联系人（英语较好）',
    generated: (d: string) => `导出于 ${d}（baoben.love/backdoor/info）`,
  },
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// One language's version of a multi-line field (item override wins in zh).
function say(lang: Lang, text?: string, override?: string): string[] {
  return bi(text, override).map((p) => (lang === 'zh' ? p.zh || p.en : p.en)).filter(Boolean);
}

const groupName = (lang: Lang, g: string) => (lang === 'zh' ? GROUP_ZH[g] ?? g : g);

function personRow(lang: Lang, p: KeyPerson): string {
  const nameZh = p.nameZh || NAME_ZH[p.name] || '';
  const sub = lang === 'en' ? p.pronunciation : nameZh;
  const contact = [p.phone, p.email].filter(Boolean).map((c) => `<div>${esc(c)}</div>`).join('');
  const notes = [
    ...say(lang, p.language).map((l) => `<li class="lang">${esc(l)}</li>`),
    ...say(lang, p.dietary, p.dietaryZh).map((l) => `<li class="diet">${esc(l)}</li>`),
    ...say(lang, p.notes, p.notesZh).map((l) => `<li>${esc(l)}</li>`),
  ].join('');
  return `<tr>
    <td class="name"><div>${esc(p.name)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</td>
    <td class="role">${say(lang, p.role, p.roleZh).map(esc).join('<br>')}</td>
    <td class="contact">${contact}</td>
    <td class="notes">${notes ? `<ul>${notes}</ul>` : ''}</td>
  </tr>`;
}

function locationBlock(lang: Lang, l: KeyLocation): string {
  const nameZh = l.nameZh || NAME_ZH[l.name] || '';
  const title = lang === 'zh' && nameZh ? nameZh : l.name;
  const alt = lang === 'zh' && nameZh ? l.name : '';
  const role = say(lang, l.role, l.roleZh).join(' · ');
  const extra = (l.moreAddresses ?? '').split('\n').map((x) => x.trim()).filter(Boolean).map((line) => {
    const i = line.indexOf(': ');
    const [label, address] = i > 0 ? [line.slice(0, i), line.slice(i + 2)] : ['', line];
    const lbl = label ? `${esc(lang === 'zh' ? zhLine(label) : label)}: ` : '';
    return `<div class="addr more">${lbl}${esc(address)}</div>`;
  }).join('');
  const when = say(lang, sortWhen(l.when).lines.join('\n'), l.whenZh);
  const notes = say(lang, l.notes, l.notesZh);
  return `<div class="place">
    ${role ? `<div class="place-role">${esc(role)}</div>` : ''}
    <div class="place-name">${esc(title)}${alt ? ` <span class="alt">${esc(alt)}</span>` : ''}</div>
    ${l.address ? `<div class="addr">${esc(l.address)}</div>` : ''}
    ${extra}
    ${when.length ? `<ul class="when">${when.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
    ${notes.length ? `<ul class="pnotes">${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
    ${l.contact ? `<div class="pcontact">${TEXT[lang].contact}: ${esc(l.contact)}</div>` : ''}
  </div>`;
}

function buildHtml(lang: Lang, doc: KeyInfoDoc, exportedOn: string): string {
  const t = TEXT[lang];
  const groups = [...PEOPLE_GROUPS, ...new Set(doc.people.map((p) => p.group))]
    .filter((g, i, all) => all.indexOf(g) === i);
  const people = groups.map((g) => {
    const rows = doc.people.filter((p) => p.group === g);
    if (!rows.length) return '';
    return `<section class="group">
      <h3>${esc(groupName(lang, g))}</h3>
      <table>
        <colgroup><col style="width:24%"><col style="width:22%"><col style="width:26%"><col style="width:28%"></colgroup>
        <thead><tr>${t.cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((p) => personRow(lang, p)).join('')}</tbody>
      </table>
    </section>`;
  }).join('');

  const sections = [...LOCATION_SECTIONS, ...new Set(doc.locations.map((l) => l.section))]
    .filter((x, i, all) => x && all.indexOf(x) === i);
  const locations = sections.map((sec) => {
    const places = doc.locations
      .filter((l) => (l.section || LOCATION_SECTIONS[0]) === sec)
      .map((l, i) => ({ l, i, first: sortWhen(l.when).first }))
      .sort((a, b) => a.first - b.first || a.i - b.i)
      .map((x) => x.l);
    if (!places.length) return '';
    const blurb = say(lang, LOCATION_SECTION_BLURBS[sec]);
    return `<section class="group">
      <h3>${esc(groupName(lang, sec))}</h3>
      ${blurb.length ? `<ul class="blurb">${blurb.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      <div class="places">${places.map((l) => locationBlock(lang, l)).join('')}</div>
    </section>`;
  }).join('');

  return `<!doctype html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8">
<title>${t.title}</title>
<style>
  @page { size: Letter; margin: 14mm 13mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", sans-serif;
         color: #2a2a2a; font-size: 9.5pt; line-height: 1.4; margin: 0; }
  header { border-bottom: 2px solid #78B7D0; padding-bottom: 6px; margin-bottom: 10px;
           display: flex; justify-content: space-between; align-items: flex-end; }
  h1 { font-size: 20pt; margin: 0; font-weight: 600; letter-spacing: 0.01em; }
  .subtitle { color: #555; font-size: 10pt; }
  .meta { color: #888; font-size: 8pt; text-align: right; }
  h2 { font-size: 13pt; margin: 14px 0 4px; color: #2a2a2a; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
  h2.page { break-before: page; }
  .legend { color: #666; font-size: 8.5pt; margin: 0 0 6px; }
  h3 { font-size: 9pt; letter-spacing: 0.12em; text-transform: uppercase; color: #3b7f99;
       margin: 12px 0 4px; break-after: avoid; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { text-align: left; font-weight: 600; font-size: 8pt; color: #777; border-bottom: 1px solid #ccc; padding: 3px 5px; }
  td { vertical-align: top; padding: 4px 5px; border-bottom: 1px solid #eee; word-wrap: break-word; }
  tr { break-inside: avoid; }
  .name div:first-child { font-weight: 600; }
  .sub { color: #3b7f99; font-size: 8.5pt; font-style: ${lang === 'en' ? 'italic' : 'normal'}; }
  .role { color: #444; }
  .contact { font-size: 8.5pt; }
  ul { margin: 0; padding-left: 12px; }
  li { margin: 0; }
  .notes li.lang { color: #3b7f99; }
  .notes li.diet { color: #a15c00; }
  .places { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .place { border: 1px solid #ddd; border-radius: 6px; padding: 7px 9px; break-inside: avoid; }
  .place-role { font-size: 7.5pt; letter-spacing: 0.12em; text-transform: uppercase; color: #3b7f99; }
  .place-name { font-weight: 600; font-size: 10.5pt; margin: 1px 0 3px; }
  .alt { font-weight: 400; color: #777; font-size: 8.5pt; }
  .addr { font-size: 9pt; }
  .addr.more { color: #555; font-size: 8.5pt; }
  .when { margin-top: 4px; }
  .pnotes { color: #666; margin-top: 2px; }
  .pcontact { color: #666; font-size: 8.5pt; margin-top: 4px; }
  .blurb { color: #555; margin-bottom: 6px; }
</style>
</head>
<body>
  <header>
    <div><h1>${t.title}</h1><div class="subtitle">${t.subtitle}</div></div>
    <div class="meta">${esc(t.generated(exportedOn))}</div>
  </header>
  <h2>${t.people}</h2>
  <p class="legend">${esc(t.legend)}</p>
  ${people}
  <h2 class="page">${t.locations}</h2>
  ${locations}
</body>
</html>`;
}

async function main() {
  const res = await fetch(API, { headers: { 'x-seating-secret': SECRET } });
  if (!res.ok) throw new Error(`Could not load Key Info from ${API} (${res.status})`);
  const { data } = (await res.json()) as { data: KeyInfoDoc | null };
  if (!data) throw new Error('Key Info has not been created yet — open /backdoor/info once first.');

  const exportedOn = new Date().toISOString().slice(0, 10);
  // KEYINFO_HTML_DIR keeps the intermediate HTML (handy for previewing).
  const work = process.env.KEYINFO_HTML_DIR ?? mkdtempSync(join(tmpdir(), 'keyinfo-pdf-'));
  for (const lang of ['en', 'zh'] as const) {
    const html = join(work, `key-info-${lang}.html`);
    writeFileSync(html, buildHtml(lang, data, exportedOn));
    const pdf = join(OUT_DIR, `Key-Info-${lang === 'en' ? 'English' : 'Chinese'}.pdf`);
    execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
      `--print-to-pdf=${pdf}`, `file://${html}`,
    ], { stdio: 'ignore' });
    console.log(`Wrote ${pdf}`);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
