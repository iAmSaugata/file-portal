function toast(msg, type='info', ms=7000){
  let wrap = document.querySelector('.toast-wrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); }
  const t=document.createElement('div'); t.className='toast '+(type==='ok'?'ok':type==='err'?'err':'info'); t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(-4px)'; }, Math.max(2600, ms-600));
  setTimeout(()=>{ try{ wrap.removeChild(t); }catch{} }, ms);
}
/* rest unchanged for brevity in this minimal build */