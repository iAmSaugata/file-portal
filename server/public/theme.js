(function(){
  const COOKIE = 'theme';
  const MAX_AGE = 60 * 60 * 24 * 365; // one year

  const body = document.body;
  if (!body){
    return;
  }

  const toggles = Array.from(document.querySelectorAll('.theme-toggle'));

  function readCookie(name){
    const pairs = document.cookie ? document.cookie.split(';') : [];
    for (const pair of pairs){
      const [rawKey, rawVal] = pair.split('=');
      if (rawKey && rawKey.trim() === name){
        return decodeURIComponent(rawVal || '').trim();
      }
    }
    return '';
  }

  function writeCookie(value){
    let cookie = `${COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
    if (location.protocol === 'https:'){
      cookie += '; Secure';
    }
    document.cookie = cookie;
  }

  function updateButtons(theme){
    const isDark = theme === 'dark';
    const label = isDark ? 'Disable Dark Theme' : 'Enable Dark Theme';
    toggles.forEach(btn => {
      btn.textContent = label;
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', label);
    });
  }

  function applyTheme(next, { persist = true } = {}){
    const theme = next === 'dark' ? 'dark' : 'light';
    const current = body.dataset.theme === 'dark' ? 'dark' : 'light';
    if (theme === current){
      updateButtons(theme);
      return;
    }
    body.dataset.theme = theme;
    updateButtons(theme);
    if (persist){
      writeCookie(theme);
    }
  }

  const fromCookie = readCookie(COOKIE).toLowerCase();
  if (fromCookie === 'dark' || fromCookie === 'light'){
    applyTheme(fromCookie, { persist: false });
  } else {
    updateButtons(body.dataset.theme === 'dark' ? 'dark' : 'light');
  }

  if (toggles.length){
    toggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const current = body.dataset.theme === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    });
  }
})();
