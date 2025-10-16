
const STATE = {
  fuse: null,
  data: [],
  pageSize: 30,
  page: 1,
  lastQuery: ""
};

const els = {
  q: document.getElementById('q'),
  results: document.getElementById('results'),
  tpl: document.getElementById('card-tpl'),
  count: document.getElementById('count')
};

async function loadIndex() {
  const res = await fetch('search/index.json', { cache: 'no-store' });
  if (!res.ok) {
    els.results.innerHTML = `<p style="grid-column:1/-1;color:#f99">Missing <code>/search/index.json</code>. Run <code>tools/build_index.py</code> locally to generate it.</p>`;
    return;
  }
  const data = await res.json();
  STATE.data = data;
  STATE.fuse = new Fuse(data, {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.35,
    keys: [
      { name: 'title', weight: 0.55 },
      { name: 'tags', weight: 0.25 },
      { name: 'summary', weight: 0.20 }
    ]
  });
  render(data.slice(0, STATE.pageSize));
  els.count.textContent = `${data.length} items`;
}

function card(item) {
  const node = els.tpl.content.firstElementChild.cloneNode(true);
  node.querySelector('.title').textContent = item.title || item.id;
  node.querySelector('.summary').textContent = item.summary || '';
  node.querySelector('.meta').textContent = `path: ${item.path}${item.tags?.length ? ' • tags: ' + item.tags.join(', ') : ''}`;
  const raw = node.querySelector('.raw-link');
  raw.href = item.path;
  node.querySelector('.view-btn').addEventListener('click', async () => {
    const pre = node.querySelector('.json');
    if (!pre.classList.contains('hidden')) {
      pre.classList.add('hidden');
      return;
    }
    try {
      const r = await fetch(item.path, { cache: 'no-store' });
      const j = await r.json();
      pre.textContent = JSON.stringify(j, null, 2);
      pre.classList.remove('hidden');
    } catch (e) {
      pre.textContent = 'Failed to load JSON: ' + e;
      pre.classList.remove('hidden');
    }
  });
  return node;
}

function render(items) {
  els.results.innerHTML = '';
  items.forEach(x => els.results.appendChild(card(x)));
}

function search(q) {
  if (!STATE.fuse) return;
  STATE.page = 1;
  STATE.lastQuery = q;
  if (!q) {
    const slice = STATE.data.slice(0, STATE.pageSize);
    render(slice);
    els.count.textContent = `${STATE.data.length} items`;
    return;
  }
  const result = STATE.fuse.search(q).map(r => r.item);
  render(result.slice(0, STATE.pageSize));
  els.count.textContent = `${result.length} results`;
}

els.q.addEventListener('input', (e)=> {
  search(e.target.value.trim());
});

// Infinite scroll (optional)
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 80) {
    // load more
    let source = STATE.lastQuery ? STATE.fuse.search(STATE.lastQuery).map(r => r.item) : STATE.data;
    const next = source.slice(0, (++STATE.page) * STATE.pageSize);
    render(next);
  }
});

loadIndex();
