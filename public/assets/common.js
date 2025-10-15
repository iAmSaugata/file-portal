// Brand and auth helpers + toasts
async function loadBrand(){
  const r = await fetch('/api/brand'); const b = await r.json();
  const brandEl = document.querySelector('.brand-title'); if (brandEl) brandEl.textContent = b.title || 'File Management';
  const logo = document.querySelector('.brand-logo'); if (logo && b.logo) logo.src = b.logo;
  if (b.primary) document.documentElement.style.setProperty('--primary', b.primary);
  const footer = document.querySelector('.footer'); if (footer) footer.textContent = b.footer || '';
}
function toast(msg, type='info'){
  const wrap = document.querySelector('.toast') || (()=>{const d=document.createElement('div');d.className='toast';document.body.appendChild(d);return d})();
  const t = document.createElement('div'); t.className=`t ${type}`; t.textContent = msg;
  wrap.appendChild(t); setTimeout(()=>{ t.remove(); }, 2600);
}
async function post(url, data){
  const r = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}
function fmtBytes(n){ if(n<1024) return n+' B'; const u=['KB','MB','GB','TB']; let i=-1; do{ n/=1024; i++; }while(n>=1024 && i<u.length-1); return n.toFixed(1)+' '+u[i]; }
function fmtDate(ts){ const d = new Date(ts); return d.toLocaleString(); }

// Duplicate tracking (session)
const finishedNames = new Set(JSON.parse(sessionStorage.getItem('finishedNames') || '[]'));
const finishedHashes = new Set(JSON.parse(sessionStorage.getItem('finishedHashes') || '[]'));
function rememberDoneName(n){ finishedNames.add(n); sessionStorage.setItem('finishedNames', JSON.stringify([...finishedNames])); }
function rememberDoneHash(h){ finishedHashes.add(h); sessionStorage.setItem('finishedHashes', JSON.stringify([...finishedHashes])); }
function alreadyUploadedName(n){ return finishedNames.has(n); }
function alreadyUploadedHash(h){ return finishedHashes.has(h); }
