/* ===== GENPIX EVENTS — interactions ===== */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Year --- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* --- Sticky nav + scroll progress --- */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('progress');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --- Mobile menu --- */
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const closeMenu = () => { links.classList.remove('open'); nav.classList.remove('menu-open'); };
  toggle.addEventListener('click', () => { links.classList.toggle('open'); nav.classList.toggle('menu-open'); });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  /* --- Typewriter (preserves <br> and .gold spans) --- */
  function buildTokens(el) {
    const tokens = [];
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const ch of node.textContent) tokens.push({ ch, cls: '' });
      } else if (node.nodeName === 'BR') {
        tokens.push({ br: true });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const cls = node.className || '';
        for (const ch of node.textContent) tokens.push({ ch, cls });
      }
    });
    return tokens;
  }

  function typewriter(el, speed) {
    const tokens = buildTokens(el);
    // reserve height to avoid layout jump
    el.style.minHeight = el.offsetHeight + 'px';
    el.textContent = '';
    const caret = document.createElement('span');
    caret.className = 'tw-caret';
    caret.style.height = '1em';
    el.appendChild(caret);

    let i = 0;
    const step = () => {
      if (i >= tokens.length) {
        setTimeout(() => caret.remove(), 1400);
        return;
      }
      const t = tokens[i++];
      if (t.br) {
        el.insertBefore(document.createElement('br'), caret);
      } else if (t.ch === ' ') {
        el.insertBefore(document.createTextNode(' '), caret);
      } else {
        const s = document.createElement('span');
        if (t.cls) s.className = t.cls;
        s.textContent = t.ch;
        el.insertBefore(s, caret);
      }
      setTimeout(step, t.ch === ' ' ? speed * 0.5 : speed);
    };
    step();
  }

  const twEls = Array.from(document.querySelectorAll('.tw'));
  const runTW = (el) => {
    if (el.dataset.twDone) return;
    el.dataset.twDone = '1';
    if (reduceMotion) return; // leave text as-is
    const delay = parseInt(el.dataset.twDelay || '0', 10);
    setTimeout(() => typewriter(el, 38), delay);
  };

  /* --- Scroll reveal + trigger typewriters --- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) { setTimeout(() => e.target.classList.add('in'), (i % 4) * 90); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));

    const tw = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { runTW(e.target); tw.unobserve(e.target); } });
    }, { threshold: 0.6 });
    twEls.forEach(el => {
      if (el.classList.contains('hero__title')) runTW(el); // hero types on load
      else tw.observe(el);
    });
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* --- Animated counters --- */
  const counters = document.querySelectorAll('.stat__num');
  const runCounter = (el) => {
    const target = +el.dataset.count, dur = 1400, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  } else {
    counters.forEach(c => c.textContent = c.dataset.count);
  }

  /* --- Contact form (demo) --- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const note = document.getElementById('formNote');
      note.hidden = false;
      form.reset();
      setTimeout(() => { note.hidden = true; }, 6000);
    });
  }

  /* --- Gallery lightbox --- */
  const imgs = Array.from(document.querySelectorAll('#gallery img'));
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  let idx = 0;
  const show = (i) => { idx = (i + imgs.length) % imgs.length; lbImg.src = imgs[idx].src; lbImg.alt = imgs[idx].alt; };
  const open = (i) => { show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
  const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
  imgs.forEach((img, i) => img.addEventListener('click', () => open(i)));
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbNext').addEventListener('click', () => show(idx + 1));
  document.getElementById('lbPrev').addEventListener('click', () => show(idx - 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });
})();
