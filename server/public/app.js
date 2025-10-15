// Toast helpers (longer)
function toast(msg, type='info'){
  let wrap = document.querySelector('.toast-wrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); }
  const t=document.createElement('div'); t.className='toast '+(type==='ok'?'ok':type==='err'?'err':'info'); t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(-4px)'; }, 4600);
  setTimeout(()=>{ wrap.removeChild(t); }, 5200);
}

function qs(s, el=document){ return el.querySelector(s); }
function qsa(s, el=document){ return Array.from(el.querySelectorAll(s)); }

// Modal helpers
function modalConfirm(title, bodyHTML, onConfirm){
  const wrap = document.createElement('div');
  wrap.style.position='fixed'; wrap.style.inset='0'; wrap.style.background='rgba(0,0,0,0.45)';
  wrap.style.display='flex'; wrap.style.alignItems='center'; wrap.style.justifyContent='center'; wrap.style.zIndex='9998';
  const card = document.createElement('div'); card.className='card'; card.style.maxWidth='520px'; card.style.padding='18px';
  card.innerHTML = `<h3 style="margin:0 0 10px 0">${title}</h3><div class="panel">${bodyHTML}</div>
    <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:10px">
      <button class="btn btn-muted" data-x>Cancel</button>
      <button class="btn btn-danger" data-ok>Delete</button>
    </div>`;
  wrap.appendChild(card);
  wrap.addEventListener('click',(e)=>{ if(e.target===wrap){ document.body.removeChild(wrap); } });
  card.querySelector('[data-x]').onclick = ()=> document.body.removeChild(wrap);
  card.querySelector('[data-ok]').onclick = ()=>{ document.body.removeChild(wrap); onConfirm&&onConfirm(); };
  document.body.appendChild(wrap);
}

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
  const cbs = qsa('tbody input[type="checkbox"]:checked');
  const ids = cbs.map(cb => Number(cb.value));
  if (!ids.length) return;
  const names = cbs.map(cb => cb.closest('tr').querySelector('.filename span').textContent.trim());
  const listHtml = '<ul style="margin:0;padding-left:18px">'+names.map(n=>'<li>'+n+'</li>').join('')+'</ul>';
  modalConfirm('Delete Selected', '<div>The following files will be deleted:</div>'+listHtml, async ()=>{
    for (let i=0;i<ids.length;i++){
      try{
        const r = await fetch('/api/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids: [ids[i]] }) });
        const j = await r.json();
        if (j.ok){ toast(names[i] + ' Delete Successfully', 'err'); }
      }catch(e){ toast('Network error', 'err'); }
    }
    location.reload();
  });
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
      const name = btn.getAttribute('data-name') || 'File';
      if (btn.dataset.action === 'getlink'){
        try{
          const r = await fetch('/api/getlink', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
          const j = await r.json();
          if (!j.ok){ toast(j.error || 'Failed', 'err'); return; }
          await navigator.clipboard.writeText(j.directUrl);
          toast('Download Link Copied for ' + name, 'ok');
        }catch(e){ toast('Network error', 'err'); }
      } else if (btn.dataset.action === 'delete'){
        modalConfirm('Delete File', '<div>Are you sure you want to delete <b>'+name+'</b>?</div>', async ()=>{
          try{
            const r = await fetch('/api/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids: [id] }) });
            const j = await r.json();
            if (j.ok){ toast(name + ' Delete Successfully', 'err'); location.reload(); } else { toast('Failed', 'err'); }
          }catch(e){ toast('Network error', 'err'); }
        });
      }
    });
  }

  updateBulkState();
  filterTable();
});
