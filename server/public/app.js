// Toast + Modal helpers
function toast(msg, type='info', ms=4200){
  let wrap = document.querySelector('.toast-wrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); }
  const t=document.createElement('div'); t.className='toast '+(type==='ok'?'ok':type==='err'?'err':'info'); t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(-4px)'; }, Math.max(2400, ms-600));
  setTimeout(()=>{ wrap.removeChild(t); }, ms);
}
function showModal({title, html, confirmText='Delete', cancelText='Cancel', confirmClass='btn btn-danger'}){
  return new Promise((resolve)=>{
    const ov=document.createElement('div'); ov.className='modal-overlay';
    ov.innerHTML = `<div class="modal-card">
      <h3 class="modal-title">${title}</h3>
      <div class="modal-body">${html}</div>
      <div class="modal-actions">
        <button class="btn btn-muted" data-x="cancel">${cancelText}</button>
        <button class="${confirmClass}" data-x="ok">${confirmText}</button>
      </div>
    </div>`;
    ov.addEventListener('click', (e)=>{ if (e.target===ov) { document.body.removeChild(ov); resolve(false); } });
    ov.querySelector('[data-x="cancel"]').onclick = ()=>{ document.body.removeChild(ov); resolve(false); };
    ov.querySelector('[data-x="ok"]').onclick = ()=>{ document.body.removeChild(ov); resolve(true); };
    document.body.appendChild(ov);
  });
}

function qs(s, el=document){ return el.querySelector(s); }
function qsa(s, el=document){ return Array.from(el.querySelectorAll(s)); }

function filterTable() {
  const term = (qs('#search')?.value || '').toLowerCase();
  qsa('tbody tr').forEach(tr => {
    const name = (tr.dataset.name || '').toLowerCase();
    const comments = (tr.dataset.comments || '').toLowerCase();
    tr.style.display = (name.includes(term) || comments.includes(term)) ? '' : 'none';
  });
}
function updateBulkState(){
  const any = qsa('tbody input[type="checkbox"]:checked').length > 0;
  const btn = qs('#btnBulkDelete');
  if (btn) btn.disabled = !any;
}
function clearSearch(){ const s = qs('#search'); if (s){ s.value=''; } filterTable(); }

async function bulkDelete(){
  const boxes = qsa('tbody input[type="checkbox"]:checked');
  const ids = boxes.map(cb => Number(cb.value));
  if (!ids.length) return;
  const names = boxes.map(cb => cb.closest('tr')?.dataset.fname || ('#'+cb.value));
  const items = names.map(n => `<li><b>•</b> ${n}</li>`).join('');
  const ok = await showModal({ 
    title: 'Confirm Delete', 
    html: `<p>The following files will be deleted:</p><ul>${items}</ul>`, 
    confirmText: 'Delete Selected', 
    confirmClass: 'btn btn-danger' 
  });
  if (!ok) return;
  try{
    const r = await fetch('/api/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids }) });
    const j = await r.json();
    if (j.ok){
      names.forEach(n => toast(`${n} deleted successfully`, 'err', 5000));
      location.reload();
    } else {
      toast(j.error || 'Failed', 'err', 5000);
    }
  }catch(e){ toast('Network error', 'err', 5000); }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const search = qs('#search'); if (search){ search.addEventListener('input', filterTable); }
  qsa('tbody input[type="checkbox"]').forEach(cb=> cb.addEventListener('change', updateBulkState));
  const bulkBtn = qs('#btnBulkDelete'); if (bulkBtn) bulkBtn.addEventListener('click', bulkDelete);

  // Event delegation for row action buttons
  const tbody = document.querySelector('tbody');
  if (tbody){
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = Number(btn.getAttribute('data-id'));
      const tr = btn.closest('tr');
      const fname = tr ? (tr.dataset.fname || '') : '';
      if (btn.dataset.action === 'getlink'){
        try{
          const r = await fetch('/api/getlink', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
          const j = await r.json();
          if (!j.ok){ toast(j.error || 'Failed', 'err', 5000); return; }
          await navigator.clipboard.writeText(j.directUrl);
          toast('Download link copied', 'ok', 5000);
        }catch(e){ toast('Network error', 'err', 5000); }
      } else if (btn.dataset.action === 'delete'){
        const ok = await showModal({ 
          title: 'Delete File', 
          html: `<p>Please confirm you want to delete this file:</p><ul><li><b>Name:</b> ${fname}</li></ul>`, 
          confirmText: 'Delete', 
          confirmClass: 'btn btn-danger'
        });
        if (!ok) return;
        try{
          const r = await fetch('/api/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids: [id] }) });
          const j = await r.json();
          if (j.ok){ toast(`${fname || 'File'} deleted successfully`, 'err', 5200); location.reload(); } else { toast('Failed', 'err', 5000); }
        }catch(e){ toast('Network error', 'err', 5000); }
      }
    });
  }

  updateBulkState();
  filterTable();
});
