self.onmessage = async (ev)=>{
  const file = ev.data.file;
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const arr = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  self.postMessage(arr);
};
