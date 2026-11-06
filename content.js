// hs notes - annotate homestuck.com
// it's a vue spa so this only runs once per tab. page turns don't reload
// anything, so i just watch the url (bottom of file)

const api = globalThis.browser ?? globalThis.chrome; // zen/firefox = browser, chrome = chrome
const KEY = 'hsNotes';
const spare = ['#e00707', '#b536da', '#0715cd', '#4ac925', '#f2a400', '#00d5f2', '#ff6ff2', '#a0a0a0'];

const css = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  #ui { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
    font: bold 13px/1.4 "Courier New", Courier, monospace; color: #fff; }
  .tab, .panel { background: #000; border: 2px solid #fff; }
  .tab { color: #fff; padding: 8px 12px; cursor: pointer; font: inherit; }
  .tab:hover, .cmd:hover { background: #fff; color: #000; }
  .panel { width: 340px; max-height: 80vh; overflow-y: auto; padding: 12px; }
  .head { display: flex; justify-content: space-between; border-bottom: 2px solid #fff;
    padding-bottom: 6px; margin-bottom: 10px; }
  .cmd { background: none; border: none; color: #fff; font: inherit; cursor: pointer; padding: 1px 3px; }
  .row { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
  select, input[type=text], textarea { background: #000; color: #fff; border: 2px solid #fff;
    font: inherit; padding: 4px; }
  select, input[type=text] { flex: 1; min-width: 0; }
  textarea { width: 100%; height: 70px; resize: vertical; margin-bottom: 6px; }
  .lbl { color: #aaa; margin: 10px 0 4px; }
  .note { border-left: 4px solid #fff; padding: 2px 0 2px 8px; margin-bottom: 10px; }
  .who { font-size: 12px; }
  .quote { color: #aaa; font-style: italic; margin: 2px 0; }
  .text { white-space: pre-wrap; word-wrap: break-word; }
  .msg { color: #f2a400; margin-bottom: 8px; }
  .foot { border-top: 2px solid #fff; margin-top: 10px; padding-top: 8px; }
  .dim { color: #aaa; }
  .sw { display: inline-block; width: 20px; height: 20px; border: 2px solid #fff; }
`;

let me = null;     // {name, color} - typed once, then it's remembered
let books = {};    // bookName -> { notes: {path: [...]}, colors: {who: hex} }
let cur = null;    // selected book
let isOpen = false;
let pg = pathNow();
let draft = '';
let pickedQuote = '';
let lastPicked = '';
let flash = '';

function pathNow() { return location.pathname.replace(/\/+$/, '') || '/'; }

function pgLabel() {
  const m = pg.match(/^\/story\/(\d+)/);
  return m ? 'PAGE ' + m[1] : pg.toUpperCase();
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// "ff0000" / "#F00" / "#ff0000" -> "#ff0000", or null if it's junk
function fixHex(s) {
  if (typeof s !== 'string') return null;
  s = s.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map(c => c + c).join('');
  return /^[0-9a-f]{6}$/i.test(s) ? '#' + s.toLowerCase() : null;
}

// imported json goes into plain objects so keep these out
function sketchy(k) { return ['__proto__', 'constructor', 'prototype'].includes(k); }

// color of someone inside a book. no saved color -> pick one from their name
function colFor(bk, who) {
  const saved = fixHex(books[bk] && books[bk].colors[who]);
  if (saved) return saved;
  let h = 0;
  for (const c of who) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return spare[h % spare.length];
}

const here = () => (books[cur] && books[cur].notes[pg]) || [];

async function loadStuff() {
  try {
    const r = await api.storage.local.get(KEY);
    if (r[KEY]) {
      me = r[KEY].me || null;
      books = r[KEY].books || {};
      cur = r[KEY].cur;
    }
  } catch (e) { console.log('hs notes: load broke', e); }
  if (!books[cur]) cur = me ? me.name : null;
}

function saveStuff() { return api.storage.local.set({ [KEY]: { me, books, cur } }); }

// ui lives in a shadow root on <html>, outside vue's mount, so vue can't nuke it
const box = document.createElement('div');
box.id = 'hs-notes-box';
const sh = box.attachShadow({ mode: 'open' });
sh.innerHTML = `<style>${css}</style><div id="ui"></div>
  <input type="file" id="pick" accept=".json,application/json" style="display:none">`;
document.documentElement.appendChild(box);
const ui = sh.getElementById('ui');

function redraw() {
  if (!isOpen) {
    const n = here().length;
    ui.innerHTML = `<button class="tab" data-a="open">&gt; ANNOTATIONS${n ? ' [' + n + ']' : ''}</button>`;
    return;
  }

  const head = `<div class="head"><span>ANNOTATIONS // ${esc(pgLabel())}</span>
    <button class="cmd" data-a="close">[x]</button></div>`;
  const msg = flash ? `<div class="msg">${esc(flash)}</div>` : '';
  flash = '';

  // first time ever: ask who they are. never again after this
  if (!me) {
    ui.innerHTML = `<div class="panel">${head}${msg}
      <div class="lbl">&gt; WHO ARE YOU?</div>
      <div class="row"><input type="text" id="nm" maxlength="24" placeholder="username"></div>
      <div class="row"><input type="text" id="hx" maxlength="7" placeholder="#hex color (optional)">
        <button class="cmd" data-a="start">&gt; GO</button></div>
      <div class="dim">you only do this once.</div></div>`;
    return;
  }

  const opts = Object.keys(books).map(n =>
    `<option value="${esc(n)}" ${n === cur ? 'selected' : ''}>${esc(n)}${n === me.name ? ' (you)' : ''}</option>`).join('');

  const list = here();
  const listHtml = list.length ? list.map(n => {
    const c = colFor(cur, n.by);
    return `<div class="note" style="border-color:${esc(c)}">
      <div class="who" style="color:${esc(c)}">${esc(n.by)} <span class="dim">${new Date(n.ts).toLocaleDateString()}</span>
        ${n.by === me.name ? `<button class="cmd" data-a="del" data-id="${esc(n.id)}">[x]</button>` : ''}</div>
      ${n.quote ? `<div class="quote">"${esc(n.quote)}"</div>` : ''}
      <div class="text">${esc(n.text)}</div></div>`;
  }).join('') : `<div class="dim">(nothing on this page yet)</div>`;

  ui.innerHTML = `<div class="panel">${head}${msg}
    <div class="lbl">&gt; NOTEBOOK</div>
    <div class="row"><select id="bk">${opts}</select>
      ${cur !== me.name ? `<button class="cmd" data-a="rmbook">[remove]</button>` : ''}</div>

    <div class="lbl">&gt; NOTES</div>
    ${listHtml}

    <div class="lbl">&gt; ADD NOTE AS <span style="color:${esc(me.color)}">${esc(me.name)}</span></div>
    ${pickedQuote ? `<div class="quote">"${esc(pickedQuote)}" <button class="cmd" data-a="unquote">[x]</button></div>` : ''}
    <textarea id="draft" placeholder="type here...">${esc(draft)}</textarea>
    <div class="row"><button class="cmd" data-a="quote">&gt; QUOTE SELECTION</button>
      <button class="cmd" data-a="post">&gt; POST</button></div>

    <div class="lbl">&gt; YOUR COLOR</div>
    <div class="row"><span class="sw" style="background:${esc(me.color)}"></span>
      <input type="text" id="hx2" maxlength="7" value="${esc(me.color)}">
      <button class="cmd" data-a="setcolor">&gt; SET</button></div>

    <div class="foot row">
      <button class="cmd" data-a="export">&gt; EXPORT</button>
      <button class="cmd" data-a="import">&gt; IMPORT</button></div>
  </div>`;
}

ui.addEventListener('click', async e => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const a = el.dataset.a;

  if (a === 'open') isOpen = true;
  else if (a === 'close') isOpen = false;

  else if (a === 'start') {
    const name = sh.getElementById('nm').value.trim().slice(0, 24);
    const raw = sh.getElementById('hx').value.trim();
    const hx = raw ? fixHex(raw) : null;
    if (!name || sketchy(name)) flash = 'need a username.';
    else if (raw && !hx) flash = "that hex doesn't look right (try #ff0000)";
    else {
      me = { name, color: hx || colFor(null, name) };
      books[name] = books[name] || { notes: {}, colors: {} };
      books[name].colors[name] = me.color;
      cur = name;
      await saveStuff();
    }
  }

  else if (a === 'setcolor') {
    const hx = fixHex(sh.getElementById('hx2').value);
    if (!hx) flash = "that hex doesn't look right (try #ff0000)";
    else {
      me.color = hx;
      // update it everywhere i've written
      for (const b in books) if (b === me.name || books[b].colors[me.name]) books[b].colors[me.name] = hx;
      await saveStuff();
    }
  }

  else if (a === 'post') {
    const text = draft.trim();
    if (!text) flash = 'write something first.';
    else {
      const bk = books[cur];
      (bk.notes[pg] = bk.notes[pg] || []).push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        by: me.name, text, quote: pickedQuote, ts: Date.now(),
      });
      bk.colors[me.name] = me.color;
      draft = ''; pickedQuote = '';
      await saveStuff();
    }
  }

  else if (a === 'del') {
    books[cur].notes[pg] = here().filter(n => !(n.id === el.dataset.id && n.by === me.name));
    await saveStuff();
  }

  else if (a === 'quote') {
    if (!lastPicked) flash = 'select some text on the page first, then hit this.';
    else pickedQuote = lastPicked.slice(0, 300);
  }
  else if (a === 'unquote') pickedQuote = '';

  else if (a === 'rmbook') {
    if (confirm(`remove ${cur}'s notebook from this browser?`)) {
      delete books[cur];
      cur = me.name;
      await saveStuff();
    }
  }

  else if (a === 'export') {
    const bk = books[cur];
    const out = { app: 'hs-notes', v: 2, book: cur, notes: bk.notes, colors: bk.colors };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = cur + '-hs-notes.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  else if (a === 'import') { sh.getElementById('pick').click(); return; }

  redraw();
});

ui.addEventListener('change', async e => {
  if (e.target.id === 'bk') { cur = e.target.value; await saveStuff(); redraw(); }
});

ui.addEventListener('input', e => { if (e.target.id === 'draft') draft = e.target.value; });

// the site has arrow key shortcuts so keep typing from leaking out
ui.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key !== 'Enter') return;
  const id = e.target.id;
  if (id === 'nm' || id === 'hx') ui.querySelector('[data-a=start]').click();
  if (id === 'hx2') ui.querySelector('[data-a=setcolor]').click();
});
ui.addEventListener('keyup', e => e.stopPropagation());

// importing = merge by note id, so passing a notebook back and forth never doubles anything
sh.getElementById('pick').addEventListener('change', e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  const rd = new FileReader();
  rd.onload = async () => {
    try {
      const d = JSON.parse(rd.result);
      const name = String(d.book || '').trim().slice(0, 24);
      if (d.app !== 'hs-notes' || !name || sketchy(name) || typeof d.notes !== 'object') throw 0;

      const bk = books[name] = books[name] || { notes: {}, colors: {} };

      for (const p in d.notes) {
        if (sketchy(p) || !Array.isArray(d.notes[p])) continue;
        const mine = bk.notes[p] = bk.notes[p] || [];
        for (const n of d.notes[p]) {
          if (!n || typeof n.text !== 'string') continue;
          const id = String(n.id || '').slice(0, 30);
          const by = String(n.by || name).slice(0, 24);
          if (!id || sketchy(by) || mine.some(m => m.id === id)) continue;
          mine.push({
            id, by,
            text: n.text.slice(0, 5000),
            quote: typeof n.quote === 'string' ? n.quote.slice(0, 300) : '',
            ts: Number(n.ts) || Date.now(),
          });
        }
      }

      for (const who in (d.colors || {})) {
        const c = fixHex(d.colors[who]);
        if (c && !sketchy(who) && who !== me.name) bk.colors[who] = c; // don't let a file recolor me
      }

      cur = name;
      await saveStuff();
      flash = `imported ${name}'s notebook.`;
    } catch (err) {
      flash = "that file isn't a hs notes export.";
    }
    redraw();
  };
  rd.readAsText(f);
});

// remember the last thing selected on the page (clicking the panel clears the real selection)
document.addEventListener('mouseup', e => {
  if (e.composedPath().includes(box)) return;
  const s = String(window.getSelection()).trim();
  if (s) lastPicked = s;
});

// page turns: vue router does pushState which fires nothing, so check the path
// on a timer. navigation api (chrome) + popstate (back/forward) just make it quicker
function pageMaybeTurned() {
  const now = pathNow();
  if (now === pg) return;
  pg = now;
  draft = ''; pickedQuote = ''; lastPicked = '';
  redraw();
}
if (window.navigation) window.navigation.addEventListener('navigatesuccess', pageMaybeTurned);
window.addEventListener('popstate', pageMaybeTurned);
setInterval(pageMaybeTurned, 500);

loadStuff().then(redraw);
