// Client helpers
function qs(s, el=document){ return el.querySelector(s); }
function qsa(s, el=document){ return Array.from(el.querySelectorAll(s)); }

// Search filter by file name
function filterTable() {
  const term = qs('#search').value.toLowerCase();
  qsa('tbody tr').forEach(tr => {
    const name = tr.dataset.name || '';
    tr.style.display = name.includes(term) ? '' : 'none';
  });
}

// Enable/disable bulk delete
function updateBulkState(){
  const any = qsa('tbody input[type="checkbox"]:checked').length > 0;
  const btn = qs('#btnBulkDelete');
  btn.disabled = !any;
}

function clearSearch(){
  qs('#search').value = '';
  filterTable();
}

// Delete selected
async function bulkDelete(){
  const ids = qsa('tbody input[type="checkbox"]:checked').map(cb => cb.value);
  if (!ids.length) return;

  if (!confirm(`Delete ${ids.length} file(s)?`)) return;

  const r = await fetch('/api/delete', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ ids })
  });
  const j = await r.json();
  if (j.ok){
    location.reload();
  } else {
    alert(j.error || 'Failed');
  }
}

// GetLink for a file
async function getLink(id){
  const r = await fetch('/api/getlink', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id })
  });
  const j = await r.json();
  if (!j.ok){ alert(j.error || 'Failed'); return; }

  // Pop-up
  const shareBtns = `
    <div class="small" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
      <button class="btn btn-muted small" onclick="copyText('${j.pageUrl}')">Copy</button>
      <button class="btn btn-primary small" onclick="shareLink('${j.pageUrl}')">Share</button>
      <button class="btn btn-primary small" onclick="shareLink('${j.directUrl}')">Share Direct</button>
      <button class="btn btn-muted small" onclick="copyText('${j.directUrl}')">Copy Direct</button>
      <button class="btn btn-muted small" onclick="copyText('wget -O "file" ${j.directUrl}')">Copy wget</button>
    </div>
  `;
  const html = `
    <div class="card" style="max-width:600px">
      <h3 style="margin:0 0 8px 0">Download Link</h3>
      <div class="panel">
        <div><strong>Page:</strong> <a href="${j.pageUrl}" target="_blank">${j.pageUrl}</a></div>
        <div><strong>Direct:</strong> <a href="${j.directUrl}" target="_blank">${j.directUrl}</a></div>
        ${shareBtns}
      </div>
    </div>
  `;
  showModal(html);
}

function copyText(t){
  navigator.clipboard.writeText(t).then(()=>{
    alert('Copied!');
  });
}

function shareLink(url){
  if (navigator.share){
    navigator.share({ title:'Download', url });
  } else {
    alert('Share not supported on this device.');
  }
}

// Simple modal
function showModal(inner){
  const wrap = document.createElement('div');
  wrap.style.position='fixed';
  wrap.style.inset='0';
  wrap.style.background='rgba(0,0,0,0.4)';
  wrap.style.display='flex';
  wrap.style.alignItems='center';
  wrap.style.justifyContent='center';
  wrap.style.padding='16px';
  wrap.innerHTML = inner;
  wrap.addEventListener('click', (e)=>{
    if (e.target===wrap) document.body.removeChild(wrap);
  });
  document.body.appendChild(wrap);
}

document.addEventListener('DOMContentLoaded', ()=>{
  const search = qs('#search');
  if (search){
    search.addEventListener('input', filterTable);
  }
  qsa('tbody input[type="checkbox"]').forEach(cb=>{
    cb.addEventListener('change', updateBulkState);
  });
  updateBulkState();
  // Store a bit of info in localStorage on load (after login)
  try { localStorage.setItem('fm_lastVisit', String(Date.now())); } catch{}
});
