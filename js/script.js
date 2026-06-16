/* ===== GENPIX EVENTS — router + theme + interactions ===== */
(function () {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* --- Year --- */
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===== THEME TOGGLE ===== */
  const root = document.documentElement;
  const navLogo = $('#navLogo');
  const themeBtn = $('#themeToggle');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    if (navLogo) navLogo.src = (t === 'light') ? 'assets/logo/logo-black.png' : 'assets/logo/logo-white.png';
    if (themeBtn) themeBtn.textContent = (t === 'light') ? '☾' : '☀';
    try { localStorage.setItem('gp-theme', t); } catch (e) {}
  }
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('gp-theme') || 'dark'; } catch (e) {}
  applyTheme(savedTheme);
  if (themeBtn) themeBtn.addEventListener('click', () =>
    applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'));

  /* ===== NAV: sticky + progress + mobile menu ===== */
  const nav = $('#nav');
  const progress = $('#progress');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  const closeMenu = () => { navLinks.classList.remove('open'); nav.classList.remove('menu-open'); };
  navToggle.addEventListener('click', () => { navLinks.classList.toggle('open'); nav.classList.toggle('menu-open'); });

  /* ===== TYPEWRITER ===== */
  function buildTokens(el) {
    const tokens = [];
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) { for (const ch of node.textContent) tokens.push({ ch, cls: '' }); }
      else if (node.nodeName === 'BR') { tokens.push({ br: true }); }
      else if (node.nodeType === Node.ELEMENT_NODE) { const cls = node.className || ''; for (const ch of node.textContent) tokens.push({ ch, cls }); }
    });
    return tokens;
  }
  const twEls = $$('.tw');
  twEls.forEach(el => { el._twHTML = el.innerHTML; });
  function runTW(el, speed) {
    el.innerHTML = el._twHTML;                 // restore original
    if (reduceMotion) return;
    const tokens = buildTokens(el);
    el.style.minHeight = el.offsetHeight + 'px';
    el.textContent = '';
    const caret = document.createElement('span');
    caret.className = 'tw-caret'; caret.style.height = '1em';
    el.appendChild(caret);
    let i = 0;
    const step = () => {
      if (i >= tokens.length) { setTimeout(() => caret.remove(), 1200); return; }
      const t = tokens[i++];
      if (t.br) el.insertBefore(document.createElement('br'), caret);
      else if (t.ch === ' ') el.insertBefore(document.createTextNode(' '), caret);
      else { const s = document.createElement('span'); if (t.cls) s.className = t.cls; s.textContent = t.ch; el.insertBefore(s, caret); }
      setTimeout(step, t.ch === ' ' ? speed * 0.5 : speed);
    };
    step();
  }

  /* ===== COUNTERS ===== */
  function runCounter(el) {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    el.textContent = '0';
    const dur = 1400, start = performance.now();
    const tick = (now) => {
      const p = Math.max(0, Math.min((now - start) / dur, 1));
      const eased = Math.max(0, 1 - Math.pow(1 - p, 3));
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ===== ANIMATE A PAGE WHEN SHOWN ===== */
  function animatePage(page) {
    const secs = $$('[data-page="' + page + '"]');
    let i = 0;
    secs.forEach(sec => {
      $$('.reveal', sec).forEach(el => {
        el.classList.remove('in');
        const idx = i++;
        if (reduceMotion) { el.classList.add('in'); }
        else { setTimeout(() => el.classList.add('in'), 70 + (idx % 6) * 90); }
      });
      $$('.tw', sec).forEach(el => {
        const d = parseInt(el.dataset.twDelay || '0', 10) || 240;
        setTimeout(() => runTW(el, 36), d);
      });
      $$('.stat__num', sec).forEach(el => setTimeout(() => runCounter(el), 400));
    });
  }

  /* ===== SECTION ROUTER ===== */
  const PAGES = ['home', 'about', 'process', 'expertise', 'clients', 'work', 'contact'];
  const ALIAS = { shows: 'work', testimonials: 'clients', '': 'home' };
  const allPages = $$('[data-page]');
  const resolve = (hash) => { let p = (hash || '').replace('#', ''); p = ALIAS[p] || p; return PAGES.includes(p) ? p : 'home'; };

  function render(page) {
    page = PAGES.includes(page) ? page : 'home';
    allPages.forEach(s => s.classList.toggle('hidden-page', s.dataset.page !== page));
    Array.from(document.body.classList).forEach(c => { if (c.indexOf('page-') === 0) document.body.classList.remove(c); });
    document.body.classList.add('page-' + page);
    $$('.nav__links a').forEach(a => a.classList.toggle('active', resolve(a.getAttribute('href')) === page));
    window.scrollTo(0, 0);
    onScroll();
    closeMenu();
    animatePage(page);
    document.title = (page === 'home' ? 'GENPIX EVENTS — Where Events Become Experience'
      : page.charAt(0).toUpperCase() + page.slice(1) + ' · GENPIX EVENTS');
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return;
    e.preventDefault();
    if (!a.hasAttribute('data-link')) return;          // placeholder/social '#'
    const p = resolve(href);
    if (resolve(location.hash) === p) render(p);        // re-animate same page
    else location.hash = p;                             // triggers hashchange
  });
  window.addEventListener('hashchange', () => render(resolve(location.hash)));
  render(resolve(location.hash));

  /* ===== CONTACT FORM (demo) ===== */
  const form = $('#contactForm');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const note = $('#formNote'); note.hidden = false; form.reset();
    setTimeout(() => { note.hidden = true; }, 6000);
  });

  /* ===== LIGHTBOX ===== */
  const imgs = $$('#gallery img');
  const lb = $('#lightbox'), lbImg = $('#lbImg');
  let idx = 0;
  const show = (i) => { idx = (i + imgs.length) % imgs.length; lbImg.src = imgs[idx].src; lbImg.alt = imgs[idx].alt; };
  const open = (i) => { show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
  const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
  imgs.forEach((img, i) => img.addEventListener('click', () => open(i)));
  $('#lbClose').addEventListener('click', close);
  $('#lbNext').addEventListener('click', () => show(idx + 1));
  $('#lbPrev').addEventListener('click', () => show(idx - 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });
})();
