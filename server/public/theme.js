(function(){
  const COOKIE = 'theme';
  const MAX_AGE = 60 * 60 * 24 * 365; // one year

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
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      const label = isDark ? 'Disable Dark Theme' : 'Enable Dark Theme';
      btn.textContent = label;
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', label);
    });
  }

  function applyTheme(next){
    const theme = next === 'dark' ? 'dark' : 'light';
    document.body.dataset.theme = theme;
    updateButtons(theme);
    writeCookie(theme);
  }

  function detectInitial(){
    const fromCookie = readCookie(COOKIE).toLowerCase();
    if (fromCookie === 'dark' || fromCookie === 'light'){
      return fromCookie;
    }
    return document.body.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const initial = detectInitial();
    applyTheme(initial);

    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = document.body.dataset.theme === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    });
  });
})();
