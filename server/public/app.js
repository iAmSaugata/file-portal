function toast(msg, type='info', ms=6000){
  let wrap = document.querySelector('.toast-wrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); }
  const t=document.createElement('div'); t.className='toast '+(type==='ok'?'ok':type==='err'?'err':'info'); t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(-4px)'; }, Math.max(2600, ms-600));
  setTimeout(()=>{ try{ wrap.removeChild(t); }catch{} }, ms);
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

function modalConfirm({title='Confirm', bodyHTML='', confirmText='Delete', onConfirm}){
  const back = document.createElement('div'); back.className='modal-backdrop';
  back.innerHTML = `<div class="modal">
      <h3>${title}</h3>
      <div class="panel" style="max-height:260px; overflow:auto;">${bodyHTML}</div>
      <div class="actions" style="margin-top:10px">
        <button class="btn btn-muted" id="m-cancel">Cancel</button>
        <button class="btn btn-danger" id="m-ok">${confirmText}</button>
      </div>
    </div>`;
  document.body.appendChild(back);
  const close = ()=>{ document.body.removeChild(back); };
  back.addEventListener('click', (e)=>{ if (e.target===back) close(); });
  back.querySelector('#m-cancel').onclick = close;
  back.querySelector('#m-ok').onclick = async ()=>{ try{ await onConfirm?.(); } finally { close(); } };
}

async function bulkDelete(){
  const selected = qsa('tbody input[type="checkbox"]:checked');
  if (!selected.length) return;
  const names = selected.map(cb => cb.closest('tr').dataset.filename || 'File');
  modalConfirm({
    title: 'Delete Selected',
    bodyHTML: `<div class="small">The following files will be deleted:</div><ul>${names.map(n=>`<li>${n}</li>`).join('')}</ul>`,
    confirmText: 'Delete',
    onConfirm: async ()=>{
      const ids = selected.map(cb => Number(cb.value));
      try{
        const r = await fetch('/api/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids }) });
        const j = await r.json();
        if (j.ok){
          names.forEach(n=>toast(`${n} Delete Successfully`, 'err', 7000));
          location.reload();
        } else { toast(j.error || 'Failed', 'err', 7000); }
      }catch(e){ toast('Network error', 'err', 7000); }
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  const search = qs('#search'); if (search){ search.addEventListener('input', filterTable); }
  qsa('tbody input[type="checkbox"]').forEach(cb=> cb.addEventListener('change', updateBulkState));
  const bulkBtn = qs('#btnBulkDelete'); if (bulkBtn) bulkBtn.addEventListener('click', bulkDelete);

  const tbody = document.querySelector('tbody');
  if (tbody){
    tbody.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const tr = btn.closest('tr');
      const id = Number(btn.getAttribute('data-id'));
      const fname = tr?.dataset?.filename || 'File';
      if (btn.dataset.action === 'getlink'){
        try{
          const r = await fetch('/api/getlink', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
          const j = await r.json();
          if (!j.ok){ toast(j.error || 'Failed', 'err', 7000); return; }
          window.open(j.pageUrl, '_blank', 'noopener');
          toast('Opening download page for ' + fname, 'info', 6000);
        }catch(e){ toast('Network error', 'err', 7000); }
      } else if (btn.dataset.action === 'delete'){
        modalConfirm({
          title: 'Delete File',
          bodyHTML: `<div>Delete <b>${fname}</b>?</div>`,
          confirmText: 'Delete',
          onConfirm: async ()=>{
            try{
              const r = await fetch('/api/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids: [id] }) });
              const j = await r.json();
              if (j.ok){ toast(`${fname} Delete Successfully`, 'err', 7000); location.reload(); } else { toast('Failed', 'err', 7000); }
            }catch(e){ toast('Network error', 'err', 7000); }
          }
        });
      }
    });
  }

  updateBulkState();
  filterTable();
});
