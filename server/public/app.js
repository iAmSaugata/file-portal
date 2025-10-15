// Dashboard interactions & toasts
function qs(s, el=document){ return el.querySelector(s); }
function qsa(s, el=document){ return Array.from(el.querySelectorAll(s)); }

function showToast(msg, type='info'){
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(8px)'; }, 2200);
  setTimeout(()=>{ t.remove(); }, 2800);
}
function copyText(t){ navigator.clipboard.writeText(t).then(()=>showToast('Copied!', 'success')); }
function shareLink(url){ if (navigator.share){ navigator.share({ title:'Download', url }); } else { showToast('Share not supported', 'info'); } }
function showModal(inner){
  const wrap = document.createElement('div');
  wrap.style.position='fixed'; wrap.style.inset='0'; wrap.style.background='rgba(0,0,0,0.4)';
  wrap.style.display='flex'; wrap.style.alignItems='center'; wrap.style.justifyContent='center'; wrap.style.padding='16px';
  wrap.innerHTML = inner;
  wrap.addEventListener('click', (e)=>{ if (e.target===wrap) document.body.removeChild(wrap); });
  document.body.appendChild(wrap);
}

function filterTable() {
  const term = (qs('#search')?.value || '').toLowerCase();
  qsa('tbody tr').forEach(tr => {
    const name = tr.dataset.name || '';
    const extra = tr.dataset.search || ''; // also search comments
    tr.style.display = (name.includes(term) || extra.includes(term)) ? '' : 'none';
  });
}
function clearSearch(){ filterTable(); }

function updateBulkState(){
  const any = qsa('tbody input[type="checkbox"]:checked').length > 0;
  const btn = qs('#btnBulkDelete');
  if (btn) btn.disabled = !any;
}
async function bulkDelete(){
  const ids = qsa('tbody input[type="checkbox"]:checked').map(cb => cb.value);
  if (!ids.length) return;
  if (!confirm(`Delete ${ids.length} file(s)?`)) return;
  const r = await fetch('/api/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids }) });
  const j = await r.json();
  if (j.ok){ showToast(`Removed ${ids.length} file(s)`, 'error'); location.reload(); } else { showToast(j.error || 'Failed', 'error'); }
}
async function getLink(id){
  const r = await fetch('/api/getlink', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
  const j = await r.json();
  if (!j.ok){ showToast(j.error || 'Failed', 'error'); return; }
  const shareBtns = `
    <div class="small" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
      <button class="btn btn-muted small" onclick="copyText('${j.pageUrl}')">Copy</button>
      <button class="btn btn-primary small" onclick="shareLink('${j.pageUrl}')">Share</button>
      <button class="btn btn-primary small" onclick="shareLink('${j.directUrl}')">Share Direct</button>
      <button class="btn btn-muted small" onclick="copyText('${j.directUrl}')">Copy Direct</button>
      <button class="btn btn-muted small" onclick="copyText('wget -O "file" ${j.directUrl}')">Copy wget</button>
    </div>`;
  const html = `<div class="card" style="max-width:600px">
      <h3 style="margin:0 0 8px 0">Download Link</h3>
      <div class="panel">
        <div><strong>Page:</strong> <a href="${j.pageUrl}" target="_blank">${j.pageUrl}</a></div>
        <div><strong>Direct:</strong> <a href="${j.directUrl}" target="_blank">${j.directUrl}</a></div>
        ${shareBtns}
      </div>
    </div>`;
  showModal(html);
}
async function deleteOne(id, name){
  if (!confirm(`Delete "${name}"?`)) return;
  const r = await fetch('/api/delete', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ids:[id]})});
  const j = await r.json();
  if (j.ok){ showToast('Deleted 1 file', 'error'); location.reload(); } else { showToast(j.error || 'Failed', 'error'); }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const search = qs('#search'); if (search){ search.addEventListener('input', filterTable); }
  qsa('tbody input[type="checkbox"]').forEach(cb=> cb.addEventListener('change', updateBulkState));
  updateBulkState(); filterTable();
});
