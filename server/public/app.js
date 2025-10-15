// Toast helpers
function toast(msg, type='info'){
  let wrap = document.querySelector('.toast-wrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); }
  const t=document.createElement('div'); t.className='toast '+(type==='ok'?'ok':type==='err'?'err':'info'); t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(-4px)'; }, 2600);
  setTimeout(()=>{ wrap.removeChild(t); }, 3200);
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
  const ids = qsa('tbody input[type="checkbox"]:checked').map(cb => cb.value);
  if (!ids.length) return;
  if (!confirm(`Delete ${ids.length} file(s)?`)) return;
  try{
    const r = await fetch('/api/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids }) });
    const j = await r.json();
    if (j.ok){ toast('Deleted', 'err'); location.reload(); } else { toast(j.error || 'Failed', 'err'); }
  }catch(e){ toast('Network error', 'err'); }
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
      if (btn.dataset.action === 'getlink'){
        try{
          const r = await fetch('/api/getlink', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
          const j = await r.json();
          if (!j.ok){ toast(j.error || 'Failed', 'err'); return; }
          await navigator.clipboard.writeText(j.directUrl);
          toast('Link copied', 'ok');
        }catch(e){ toast('Network error', 'err'); }
      } else if (btn.dataset.action === 'delete'){
        if (!confirm('Delete this file?')) return;
        try{
          const r = await fetch('/api/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids: [id] }) });
          const j = await r.json();
          if (j.ok){ toast('Deleted', 'err'); location.reload(); } else { toast('Failed', 'err'); }
        }catch(e){ toast('Network error', 'err'); }
      }
    });
  }

  updateBulkState();
  filterTable();
});
