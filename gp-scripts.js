// === Defesa contra .preload do GreatPages que mata todas as transições CSS ===
(function () {
  var killPreload = function () {
    document.body && document.body.classList.remove('preload');
    document.documentElement.classList.remove('preload');
  };
  killPreload();
  // Re-checa após DOMContentLoaded e load (caso o GreatPages re-aplique)
  document.addEventListener('DOMContentLoaded', killPreload);
  window.addEventListener('load', killPreload);
})();

// === Carrega Lenis (smooth scroll) dinamicamente ===
(function () {
  var s = document.createElement('script');
  s.src = 'https://unpkg.com/lenis@1.3.8/dist/lenis.min.js';
  s.onload = function () {
    if (typeof Lenis === 'undefined') return;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.lenis = lenis;
  };
  document.head.appendChild(s);
})();

// Phone mockup: animação de entrada + parallax floating
(function () {
  const phone = document.querySelector('.phone-mockup');
  if (!phone) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    phone.classList.add('in');
    return;
  }
  // Trigger entrada após paint inicial
  requestAnimationFrame(() => {
    requestAnimationFrame(() => phone.classList.add('in'));
  });
  // Após transição da entrada, ativa parallax
  phone.addEventListener('transitionend', function onEnd(e) {
    if (e.propertyName === 'transform') {
      phone.classList.add('parallax-active');
      phone.removeEventListener('transitionend', onEnd);
    }
  });
  // Parallax floating
  let ticking = false;
  function updateParallax() {
    if (phone.classList.contains('parallax-active')) {
      const y = window.scrollY * 0.08;
      phone.style.transform = 'translateY(' + (-y) + 'px)';
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
  }, { passive: true });

  // Mouse parallax floating (translate inverso ao mouse)
  const tilt = document.querySelector('.phone-tilt');
  const hero = document.querySelector('.hero');
  if (tilt && hero) {
    const MAX_OFFSET = 40; // px máximos de deslocamento
    let tiltTicking = false;
    let lastEvent = null;
    function applyParallax() {
      if (!lastEvent) { tiltTicking = false; return; }
      const r = hero.getBoundingClientRect();
      // Posição do mouse normalizada (-0.5 a 0.5 a partir do centro)
      const mx = (lastEvent.clientX - r.left) / r.width - 0.5;
      const my = (lastEvent.clientY - r.top) / r.height - 0.5;
      // Inverso: mouse pra esquerda → phone pra direita
      const offsetX = -mx * MAX_OFFSET * 2; // -40px a +40px
      const offsetY = -my * MAX_OFFSET * 2;
      tilt.style.setProperty('--mouse-x', offsetX + 'px');
      tilt.style.setProperty('--mouse-y', offsetY + 'px');
      tiltTicking = false;
    }
    window.addEventListener('mousemove', (e) => {
      lastEvent = e;
      if (!tiltTicking) { requestAnimationFrame(applyParallax); tiltTicking = true; }
    }, { passive: true });
  }
})();

// Nav theme toggle: troca logo preto/branco quando o nav passa por cima de seções escuras
(function () {
  const darkSections = document.querySelectorAll('.is-dark-bg');
  if (!darkSections.length) return;
  const lightOverrides = document.querySelectorAll('.form-section, .is-light-bg');
  const navY = 40; // linha de detecção (≈ centro vertical do nav)
  let ticking = false;
  function update() {
    let isDark = false;
    darkSections.forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.top <= navY && r.bottom >= navY) isDark = true;
    });
    // Override: se uma seção light (form-section) cobre a navY, força light theme
    lightOverrides.forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.top <= navY && r.bottom >= navY) isDark = false;
    });
    document.documentElement.toggleAttribute('data-nav-dark', isDark);
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

// LGPD Cookie banner
(function () {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('cookieAccept');
  const rejectBtn = document.getElementById('cookieReject');
  if (!banner) return;
  const KEY = 'nv_cookie_consent';
  const saved = localStorage.getItem(KEY);
  if (saved) return; // já decidiu, não mostra
  banner.hidden = false;
  // Pequeno delay pra animação suave após page load
  requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('show')));
  const close = (value) => {
    try { localStorage.setItem(KEY, value); } catch (_) {}
    banner.classList.remove('show');
    setTimeout(() => { banner.hidden = true; }, 400);
  };
  acceptBtn?.addEventListener('click', () => close('accepted'));
  rejectBtn?.addEventListener('click', () => close('rejected'));
})();

// Mobile drawer — abre/fecha
(function () {
  const burger = document.getElementById('navBurger');
  const drawer = document.getElementById('navDrawer');
  const closeBtn = document.getElementById('navDrawerClose');
  const ctaBtn = document.getElementById('navDrawerCta');
  if (!burger || !drawer) return;

  const open = () => {
    drawer.classList.add('is-open');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
  };
  const close = () => {
    drawer.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
  };

  burger.addEventListener('click', () => {
    drawer.classList.contains('is-open') ? close() : open();
  });
  closeBtn?.addEventListener('click', close);
  ctaBtn?.addEventListener('click', () => {
    close();
    setTimeout(() => document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' }), 350);
  });
  drawer.querySelectorAll('[data-drawer-link]').forEach(a => {
    a.addEventListener('click', close);
  });
  // Esc fecha
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });
})();

// Nav active dinâmico — clique + scroll-spy
(function () {
  const navLinks = document.querySelectorAll('.nav-center a');
  const indicator = document.querySelector('.nav-indicator');
  if (!navLinks.length) return;

  let currentHref = null;
  const moveIndicator = (link) => {
    if (!indicator || !link) return;
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
    indicator.style.width = `${link.offsetWidth}px`;
  };

  const setActive = (href) => {
    if (href === currentHref) return; // skip se já é o ativo
    currentHref = href;
    let activeLink = null;
    navLinks.forEach(a => {
      const isActive = a.getAttribute('href') === href;
      a.classList.toggle('active', isActive);
      if (isActive) activeLink = a;
    });
    moveIndicator(activeLink);
  };

  // Posiciona o indicator no carregamento
  const initialActive = document.querySelector('.nav-center a.active');
  if (initialActive) {
    requestAnimationFrame(() => moveIndicator(initialActive));
  }
  // Reposiciona em resize (caso o nav mude de largura)
  window.addEventListener('resize', () => {
    const current = document.querySelector('.nav-center a.active');
    if (current) moveIndicator(current);
  }, { passive: true });

  // Flag pra suprimir scroll-spy durante scroll programático (clique no nav)
  let suppressSpy = false;
  let suppressTimeout = null;
  const suppressFor = (ms) => {
    suppressSpy = true;
    clearTimeout(suppressTimeout);
    suppressTimeout = setTimeout(() => { suppressSpy = false; }, ms);
  };

  // Click handler — marca ativo imediatamente e bloqueia scroll-spy durante o smooth scroll
  navLinks.forEach(a => {
    a.addEventListener('click', () => {
      setActive(a.getAttribute('href'));
      suppressFor(900); // ~tempo do smooth scroll
    });
  });

  // Scroll-spy via IntersectionObserver
  if ('IntersectionObserver' in window) {
    const sectionsMap = new Map();
    navLinks.forEach(a => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        const target = document.querySelector(href);
        if (target) sectionsMap.set(target, href);
      }
    });

    const observer = new IntersectionObserver((entries) => {
      if (suppressSpy) return; // ignora durante scroll programático
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length > 0) {
        const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const href = sectionsMap.get(top.target);
        if (href) setActive(href);
      }
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

    sectionsMap.forEach((_, target) => observer.observe(target));

    // "Início" (href="#") fica ativo quando scroll estiver no topo
    const handleTop = () => {
      if (suppressSpy) return;
      if (window.scrollY < 200) setActive('#');
    };
    window.addEventListener('scroll', handleTop, { passive: true });
    handleTop();
  }
})();

/* Pilares f-card — stagger animation para elementos internos */
(function () {
  if (!('IntersectionObserver' in window)) return;
  const cards = document.querySelectorAll('.f-card');
  if (!cards.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-animated');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  cards.forEach(c => io.observe(c));
})();

/* Stats counter animation */
(function () {
  if (!('IntersectionObserver' in window)) return;
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const useThousand = el.dataset.format === 'thousand';
    const duration = parseInt(el.dataset.duration, 10) || 2200;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutQuart — desacelera no fim de forma suave
      const eased = 1 - Math.pow(1 - t, 4);
      const value = Math.floor(target * eased);
      const formatted = useThousand ? value.toLocaleString('pt-BR') : value;
      el.textContent = prefix + formatted + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  counters.forEach(c => io.observe(c));
})();

(function () {
  if (!('IntersectionObserver' in window)) return; // no-op: page stays fully visible
  const els = document.querySelectorAll('.reveal');

  // Arma o estado inicial (todos invisíveis) antes do paint
  document.documentElement.classList.add('reveal-armed');

  // Identifica above-the-fold pra disparar a animação imediatamente (com stagger leve)
  const aboveFold = [];
  const belowFold = [];
  els.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95 && r.bottom > 0) aboveFold.push(el);
    else belowFold.push(el);
  });

  // Above-the-fold: dispara entrada com stagger pra ter efeito de cascata na primeira tela
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      aboveFold.forEach((el, i) => {
        setTimeout(() => el.classList.add('in'), i * 80);
      });
    });
  });

  // Below-the-fold: IntersectionObserver clássico, dispara quando entra na viewport
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
  belowFold.forEach(el => io.observe(el));
})();

document.getElementById('cnpj')?.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 14);
  v = v.replace(/^(\d{2})(\d)/, '$1.$2')
       .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
       .replace(/\.(\d{3})(\d)/, '.$1/$2')
       .replace(/(\d{4})(\d)/, '$1-$2');
  e.target.value = v;
});
document.getElementById('telefone')?.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
  else if (v.length > 0) v = v.replace(/^(\d{0,2}).*/, '($1');
  e.target.value = v;
});
const form = document.getElementById('leadForm');
const successEl = document.getElementById('formSuccess');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  const fields = [
    { id: 'nome', test: (v) => v.trim().length >= 2 },
    { id: 'email', test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && !/@(gmail|hotmail|yahoo|outlook|icloud)\./i.test(v) },
    { id: 'telefone', test: (v) => v.replace(/\D/g, '').length >= 10 },
    { id: 'cnpj', test: (v) => v.replace(/\D/g, '').length === 14 },
    { id: 'volume', test: (v) => v.length > 0 },
  ];
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    const target = f.id === 'volume' ? el.closest('.custom-select') : el;
    if (!f.test(el.value)) { target.classList.add('error'); ok = false; } else target.classList.remove('error');
  });
  if (!ok) return;
  form.style.display = 'none';
  successEl.classList.add('show');
});
['nome','email','telefone','cnpj'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', (e) => e.target.classList.remove('error'));
});

/* Custom select interaction */
document.querySelectorAll('[data-custom-select]').forEach(cs => {
  const trigger = cs.querySelector('.custom-select-trigger');
  const valueEl = cs.querySelector('.custom-select-value');
  const options = Array.from(cs.querySelectorAll('.custom-select-options li'));
  const hidden = cs.querySelector('.custom-select-hidden');
  let activeIndex = -1;

  // Atributos ARIA pra acessibilidade
  options.forEach((li, i) => {
    li.setAttribute('tabindex', '-1');
    li.setAttribute('id', `cs-opt-${i}`);
  });

  const setActive = (idx) => {
    options.forEach(o => o.removeAttribute('aria-selected'));
    if (idx >= 0 && idx < options.length) {
      activeIndex = idx;
      options[idx].setAttribute('aria-selected', 'true');
      options[idx].focus();
      trigger.setAttribute('aria-activedescendant', options[idx].id);
    }
  };
  const open = () => {
    cs.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    // foca o item selecionado, ou primeiro
    const selectedIdx = options.findIndex(o => o.classList.contains('is-selected'));
    setActive(selectedIdx >= 0 ? selectedIdx : 0);
  };
  const close = () => {
    cs.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  };
  const select = (li) => {
    valueEl.textContent = li.textContent;
    trigger.classList.remove('is-empty');
    options.forEach(o => o.classList.remove('is-selected'));
    li.classList.add('is-selected');
    hidden.value = li.dataset.value;
    hidden.dispatchEvent(new Event('change', { bubbles: true }));
    cs.classList.remove('error');
    close();
    trigger.focus();
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    cs.classList.contains('is-open') ? close() : open();
  });
  options.forEach(li => {
    li.addEventListener('click', () => select(li));
  });
  document.addEventListener('click', (e) => {
    if (!cs.contains(e.target)) close();
  });

  // Teclado no trigger
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      cs.classList.contains('is-open') ? null : open();
    }
    if (e.key === 'ArrowUp' && !cs.classList.contains('is-open')) {
      e.preventDefault(); open();
    }
  });

  // Teclado nos options (quando aberto)
  cs.addEventListener('keydown', (e) => {
    if (!cs.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); trigger.focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(activeIndex + 1, options.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(activeIndex - 1, 0)); }
    if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
    if (e.key === 'Enter' || e.key === ' ') {
      if (activeIndex >= 0) { e.preventDefault(); select(options[activeIndex]); }
    }
    if (e.key === 'Tab') { close(); }
  });
});