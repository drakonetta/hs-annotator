const A = globalThis.browser ?? globalThis.chrome;
const K = 'hsNotes';
const SP = ['#e00707', '#b536da', '#0715cd', '#4ac925', '#f2a400', '#00d5f2', '#ff6ff2', '#a0a0a0'];
const CSS = `
:host{all:initial}
*{box-sizing:border-box}
#ui{position:fixed;right:16px;bottom:16px;z-index:2147483647;font:bold 13px/1.4 "Courier New",Courier,monospace;color:#fff}
.tab,.panel{background:#000;border:2px solid #fff}
.tab{color:#fff;padding:8px 12px;cursor:pointer;font:inherit}
.tab:hover,.cmd:hover{background:#fff;color:#000}
.panel{width:340px;max-height:80vh;overflow-y:auto;padding:12px}
.head{display:flex;justify-content:space-between;border-bottom:2px solid #fff;padding-bottom:6px;margin-bottom:10px}
.cmd{background:none;border:none;color:#fff;font:inherit;cursor:pointer;padding:1px 3px}
.row{display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap}
select,input[type=text],textarea{background:#000;color:#fff;border:2px solid #fff;font:inherit;padding:4px}
select,input[type=text]{flex:1;min-width:0}
textarea{width:100%;height:70px;resize:vertical;margin-bottom:6px}
.lbl{color:#aaa;margin:10px 0 4px}
.note{border-left:4px solid #fff;padding:2px 0 2px 8px;margin-bottom:10px}
.who{font-size:12px}
.quote{color:#aaa;font-style:italic;margin:2px 0}
.text{white-space:pre-wrap;word-wrap:break-word}
.msg{color:#f2a400;margin-bottom:8px}
.foot{border-top:2px solid #fff;margin-top:10px;padding-top:8px}
.dim{color:#aaa}
.sw{display:inline-block;width:20px;height:20px;border:2px solid #fff}
`;

let me = null, bks = {}, cur = null, op = false, pg = P(), dr = '', pq = '', lp = '', fl = '';

function P() {
  const p = location.pathname.replace(/\/+$/, '') || '/', h = location.hostname.replace(/^www\./, '');
  return h === 'homestuck.com' ? p : h + p;
}
function L() { const m = pg.match(/^\/story\/(\d+)/); return m ? 'PAGE ' + m[1] : pg.replace(/^beyondcanon\.com\/?/, 'BC ').toUpperCase(); }
const E = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const H = s => {
  if (typeof s !== 'string') return null;
  s = s.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.replace(/./g, '$&$&');
  return /^[0-9a-f]{6}$/i.test(s) ? '#' + s.toLowerCase() : null;
};
const X = k => ['__proto__', 'constructor', 'prototype'].includes(k);
const C = (b, w) => {
  const s = H(bks[b] && bks[b].colors[w]);
  if (s) return s;
  let h = 0;
  for (const c of w) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SP[h % SP.length];
};
const hr = () => (bks[cur] && bks[cur].notes[pg]) || [];

async function ld() {
  try {
    const r = await A.storage.local.get(K);
    if (r[K]) { me = r[K].me || null; bks = r[K].books || {}; cur = r[K].cur; }
  } catch (e) { console.log('hs notes: load broke', e); }
  if (!bks[cur]) cur = me ? me.name : null;
}
const sv = () => A.storage.local.set({ [K]: { me, books: bks, cur } });

const bx = document.createElement('div');
bx.id = 'hs-notes-box';
const sh = bx.attachShadow({ mode: 'open' });
sh.innerHTML = `<style>${CSS}</style><div id="ui"></div><input type="file" id="pk" accept=".json,application/json" style="display:none">`;
document.documentElement.appendChild(bx);
const ui = sh.getElementById('ui');
const $ = id => sh.getElementById(id);

function rd() {
  if (!op) {
    const n = hr().length;
    ui.innerHTML = `<button class="tab" data-a="o">&gt; ANNOTATIONS${n ? ' [' + n + ']' : ''}</button>`;
    return;
  }
  const hd = `<div class="head"><span>ANNOTATIONS // ${E(L())}</span><button class="cmd" data-a="x">[x]</button></div>`;
  const ms = fl ? `<div class="msg">${E(fl)}</div>` : '';
  fl = '';
  if (!me) {
    ui.innerHTML = `<div class="panel">${hd}${ms}
<div class="lbl">&gt; WHO ARE YOU?</div>
<div class="row"><input type="text" id="nm" maxlength="24" placeholder="username"></div>
<div class="row"><input type="text" id="hx" maxlength="7" placeholder="#hex color (optional)"><button class="cmd" data-a="go">&gt; GO</button></div>
<div class="dim">you only do this once.</div></div>`;
    return;
  }
  const op2 = Object.keys(bks).map(n => `<option value="${E(n)}" ${n === cur ? 'selected' : ''}>${E(n)}${n === me.name ? ' (you)' : ''}</option>`).join('');
  const ls = hr();
  const lh = ls.length ? ls.map(n => {
    const c = C(cur, n.by);
    return `<div class="note" style="border-color:${E(c)}"><div class="who" style="color:${E(c)}">${E(n.by)} <span class="dim">${new Date(n.ts).toLocaleDateString()}</span> ${n.by === me.name ? `<button class="cmd" data-a="d" data-id="${E(n.id)}">[x]</button>` : ''}</div>${n.quote ? `<div class="quote">"${E(n.quote)}"</div>` : ''}<div class="text">${E(n.text)}</div></div>`;
  }).join('') : `<div class="dim">(nothing on this page yet)</div>`;
  ui.innerHTML = `<div class="panel">${hd}${ms}
<div class="lbl">&gt; NOTEBOOK</div>
<div class="row"><select id="bk">${op2}</select>${cur !== me.name ? `<button class="cmd" data-a="rm">[remove]</button>` : ''}</div>
<div class="lbl">&gt; NOTES</div>
${lh}
<div class="lbl">&gt; ADD NOTE AS <span style="color:${E(me.color)}">${E(me.name)}</span></div>
${pq ? `<div class="quote">"${E(pq)}" <button class="cmd" data-a="uq">[x]</button></div>` : ''}
<textarea id="dr" placeholder="type here...">${E(dr)}</textarea>
<div class="row"><button class="cmd" data-a="q">&gt; QUOTE SELECTION</button><button class="cmd" data-a="p">&gt; POST</button></div>
<div class="lbl">&gt; YOUR COLOR</div>
<div class="row"><span class="sw" style="background:${E(me.color)}"></span><input type="text" id="hx2" maxlength="7" value="${E(me.color)}"><button class="cmd" data-a="col">&gt; SET</button></div>
<div class="foot row"><button class="cmd" data-a="ex">&gt; EXPORT ALL</button><button class="cmd" data-a="exm">&gt; EXPORT MINE</button><button class="cmd" data-a="im">&gt; IMPORT</button></div>
</div>`;
}

function dl(mine) {
  const b = bks[cur];
  let n = b.notes, c = b.colors;
  if (mine) {
    n = {};
    for (const k in b.notes) {
      const f = b.notes[k].filter(z => z.by === me.name);
      if (f.length) n[k] = f;
    }
    if (!Object.keys(n).length) { fl = "you haven't written anything in this notebook yet."; return; }
    c = { [me.name]: me.color };
  }
  const u = URL.createObjectURL(new Blob([JSON.stringify({ app: 'hs-notes', v: 2, book: cur, notes: n, colors: c }, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = u;
  a.download = cur + (mine ? '-' + me.name + '-only' : '') + '-hs-notes.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

ui.addEventListener('click', async e => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const a = el.dataset.a;
  if (a === 'o') op = true;
  else if (a === 'x') op = false;
  else if (a === 'go') {
    const nm = $('nm').value.trim().slice(0, 24), rw = $('hx').value.trim(), hx = rw ? H(rw) : null;
    if (!nm || X(nm)) fl = 'need a username.';
    else if (rw && !hx) fl = "that hex doesn't look right (try #ff0000)";
    else {
      me = { name: nm, color: hx || C(null, nm) };
      bks[nm] = bks[nm] || { notes: {}, colors: {} };
      bks[nm].colors[nm] = me.color;
      cur = nm;
      await sv();
    }
  }
  else if (a === 'col') {
    const hx = H($('hx2').value);
    if (!hx) fl = "that hex doesn't look right (try #ff0000)";
    else {
      me.color = hx;
      for (const b in bks) if (b === me.name || bks[b].colors[me.name]) bks[b].colors[me.name] = hx;
      await sv();
    }
  }
  else if (a === 'p') {
    const t = dr.trim();
    if (!t) fl = 'write something first.';
    else {
      const b = bks[cur];
      (b.notes[pg] = b.notes[pg] || []).push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), by: me.name, text: t, quote: pq, ts: Date.now() });
      b.colors[me.name] = me.color;
      dr = ''; pq = '';
      await sv();
    }
  }
  else if (a === 'd') {
    bks[cur].notes[pg] = hr().filter(n => !(n.id === el.dataset.id && n.by === me.name));
    await sv();
  }
  else if (a === 'q') { if (!lp) fl = 'select some text on the page first, then hit this.'; else pq = lp.slice(0, 300); }
  else if (a === 'uq') pq = '';
  else if (a === 'rm') {
    if (confirm(`remove ${cur}'s notebook from this browser?`)) { delete bks[cur]; cur = me.name; await sv(); }
  }
  else if (a === 'ex') dl(false);
  else if (a === 'exm') dl(true);
  else if (a === 'im') { $('pk').click(); return; }
  rd();
});

ui.addEventListener('change', async e => { if (e.target.id === 'bk') { cur = e.target.value; await sv(); rd(); } });
ui.addEventListener('input', e => { if (e.target.id === 'dr') dr = e.target.value; });
ui.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key !== 'Enter') return;
  const i = e.target.id;
  if (i === 'nm' || i === 'hx') ui.querySelector('[data-a=go]').click();
  if (i === 'hx2') ui.querySelector('[data-a=col]').click();
});
ui.addEventListener('keyup', e => e.stopPropagation());

$('pk').addEventListener('change', e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try {
      const d = JSON.parse(r.result), nm = String(d.book || '').trim().slice(0, 24);
      if (d.app !== 'hs-notes' || !nm || X(nm) || typeof d.notes !== 'object') throw 0;
      const b = bks[nm] = bks[nm] || { notes: {}, colors: {} };
      for (const p in d.notes) {
        if (X(p) || !Array.isArray(d.notes[p])) continue;
        const m = b.notes[p] = b.notes[p] || [];
        for (const n of d.notes[p]) {
          if (!n || typeof n.text !== 'string') continue;
          const id = String(n.id || '').slice(0, 30), by = String(n.by || nm).slice(0, 24);
          if (!id || X(by) || m.some(z => z.id === id)) continue;
          m.push({ id, by, text: n.text.slice(0, 5000), quote: typeof n.quote === 'string' ? n.quote.slice(0, 300) : '', ts: Number(n.ts) || Date.now() });
        }
      }
      for (const w in (d.colors || {})) {
        const c = H(d.colors[w]);
        if (c && !X(w) && w !== me.name) b.colors[w] = c;
      }
      cur = nm;
      await sv();
      fl = `imported ${nm}'s notebook.`;
    } catch (err) { fl = "that file isn't a hs notes export."; }
    rd();
  };
  r.readAsText(f);
});

document.addEventListener('mouseup', e => {
  if (e.composedPath().includes(bx)) return;
  const s = String(window.getSelection()).trim();
  if (s) lp = s;
});

function pm() {
  const n = P();
  if (n === pg) return;
  pg = n; dr = ''; pq = ''; lp = '';
  rd();
}
if (window.navigation) window.navigation.addEventListener('navigatesuccess', pm);
window.addEventListener('popstate', pm);
setInterval(pm, 500);

ld().then(rd);
