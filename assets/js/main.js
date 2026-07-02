/**
 * joeych-pages — Main JS
 * i18n toggle, mobile nav, scroll reveal, navbar state
 * Vanilla JS, no dependencies
 */

(function () {
  'use strict';

  /* ============================================================
     i18n — Bilingual Toggle (zh default / en)
     ============================================================ */

  var LANG_KEY = 'site-lang';
  var DEFAULT_LANG = 'zh';

  function getLang() {
    try {
      return localStorage.getItem(LANG_KEY) || DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  function setLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      // localStorage unavailable — silent fail
    }
  }

  /**
   * Apply language to all translatable elements.
   * Pattern:
   *   - Chinese text inline in HTML (default visible)
   *   - English in data-en attribute
   *   - data-zh holds the original Chinese (for round-trip)
   *   - Attribute translations: data-en-alt, data-en-aria-label, data-en-title, data-en-placeholder
   */
  function applyLang(lang) {
    var els = document.querySelectorAll('[data-en]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (lang === 'en') {
        // Store original zh text if not already stored
        if (!el.hasAttribute('data-zh')) {
          el.setAttribute('data-zh', el.textContent.trim());
        }
        el.textContent = el.getAttribute('data-en');
      } else {
        // Restore zh text
        var zhText = el.getAttribute('data-zh');
        if (zhText) {
          el.textContent = zhText;
        }
      }
    }

    // Handle attribute translations (alt, aria-label, title, placeholder)
    var attrMap = ['alt', 'aria-label', 'title', 'placeholder'];
    for (var a = 0; a < attrMap.length; a++) {
      var attr = attrMap[a];
      var dataAttr = 'data-en-' + attr;
      var attrEls = document.querySelectorAll('[' + dataAttr + ']');
      for (var j = 0; j < attrEls.length; j++) {
        var attrEl = attrEls[j];
        if (lang === 'en') {
          if (!attrEl.hasAttribute('data-orig-' + attr)) {
            var origVal = attrEl.getAttribute(attr);
            if (origVal) {
              attrEl.setAttribute('data-orig-' + attr, origVal);
            }
          }
          attrEl.setAttribute(attr, attrEl.getAttribute(dataAttr));
        } else {
          var savedVal = attrEl.getAttribute('data-orig-' + attr);
          if (savedVal) {
            attrEl.setAttribute(attr, savedVal);
          }
        }
      }
    }

    // Update <html lang>
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');

    // Notify modal / other components of language change
    var event;
    if (typeof Event === 'function') {
      try {
        event = new Event('langChanged', { bubbles: true });
      } catch (e) {
        event = document.createEvent('Event');
        event.initEvent('langChanged', true, false);
      }
    } else {
      event = document.createEvent('Event');
      event.initEvent('langChanged', true, false);
    }
    document.dispatchEvent(event);

    // Update toggle button label
    var toggleBtns = document.querySelectorAll('.lang-toggle');
    for (var k = 0; k < toggleBtns.length; k++) {
      toggleBtns[k].textContent = lang === 'en' ? 'EN' : '中';
    }
  }

  function initI18n() {
    var currentLang = getLang();
    applyLang(currentLang);

    // Bind toggle buttons
    var toggleBtns = document.querySelectorAll('.lang-toggle');
    for (var i = 0; i < toggleBtns.length; i++) {
      toggleBtns[i].addEventListener('click', function () {
        var newLang = getLang() === 'en' ? 'zh' : 'en';
        setLang(newLang);
        applyLang(newLang);
      });
    }
  }

  /* ============================================================
     Mobile Navigation
     ============================================================ */

  function initMobileNav() {
    var hamburger = document.querySelector('.navbar__hamburger');
    var mobileMenu = document.querySelector('.mobile-menu');
    var overlay = document.querySelector('.mobile-overlay');
    if (!hamburger || !mobileMenu) return;

    function openMenu() {
      hamburger.classList.add('is-active');
      mobileMenu.classList.add('is-open');
      if (overlay) overlay.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      hamburger.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      hamburger.classList.remove('is-active');
      mobileMenu.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
      hamburger.setAttribute('aria-expanded', 'false');
    }

    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.contains('is-open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // Close menu when a mobile link is clicked
    var mobileLinks = mobileMenu.querySelectorAll('.mobile-menu__link');
    for (var i = 0; i < mobileLinks.length; i++) {
      mobileLinks[i].addEventListener('click', closeMenu);
    }

    // Close menu on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        closeMenu();
        hamburger.focus();
      }
    });
  }

  /* ============================================================
     Active Nav Highlight
     ============================================================ */

  function initActiveNav() {
    // Get current page filename
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';

    // Normalize: if empty, treat as index.html
    if (!filename || filename === '') filename = 'index.html';

    // Desktop nav links
    var desktopLinks = document.querySelectorAll('.navbar__link');
    for (var i = 0; i < desktopLinks.length; i++) {
      var link = desktopLinks[i];
      var href = link.getAttribute('href');
      if (href === filename || (filename === '' && href === './index.html') || (filename === 'index.html' && href === './')) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    }

    // Mobile nav links
    var mobileLinks = document.querySelectorAll('.mobile-menu__link');
    for (var j = 0; j < mobileLinks.length; j++) {
      var mLink = mobileLinks[j];
      var mHref = mLink.getAttribute('href');
      if (mHref === filename || (filename === '' && mHref === './index.html') || (filename === 'index.html' && mHref === './')) {
        mLink.classList.add('is-active');
        mLink.setAttribute('aria-current', 'page');
      }
    }
  }

  /* ============================================================
     Navbar Scroll State
     ============================================================ */

  function initNavbarScroll() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    var scrollThreshold = 10;

    function updateNavbar() {
      if (window.scrollY > scrollThreshold) {
        navbar.classList.add('is-scrolled');
      } else {
        navbar.classList.remove('is-scrolled');
      }
    }

    // Initial check
    updateNavbar();

    // Throttled scroll listener
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateNavbar();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ============================================================
     Scroll Reveal (IntersectionObserver)
     ============================================================ */

  function initScrollReveal() {
    var revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length === 0) return;

    // Check for reduced motion preference
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Show all elements immediately
      for (var i = 0; i < revealEls.length; i++) {
        revealEls[i].classList.add('is-visible');
      }
      return;
    }

    // IntersectionObserver
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        for (var j = 0; j < entries.length; j++) {
          if (entries[j].isIntersecting) {
            entries[j].target.classList.add('is-visible');
            observer.unobserve(entries[j].target);
          }
        }
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      });

      for (var k = 0; k < revealEls.length; k++) {
        observer.observe(revealEls[k]);
      }
    } else {
      // Fallback: show all
      for (var l = 0; l < revealEls.length; l++) {
        revealEls[l].classList.add('is-visible');
      }
    }
  }

  /* ============================================================
     Certificate Modal Carousel
     ============================================================ */

  function initCertificateModal() {
    var modal = document.querySelector('.certificate-modal');
    if (!modal) return;

    var backdrop = modal.querySelector('.certificate-modal__backdrop');
    var closeBtn = modal.querySelector('.certificate-modal__close');
    var prevBtn = modal.querySelector('.certificate-modal__nav--prev');
    var nextBtn = modal.querySelector('.certificate-modal__nav--next');
    var figure = modal.querySelector('.certificate-modal__figure');
    var caption = modal.querySelector('.certificate-modal__caption');
    var img = figure ? figure.querySelector('img') : null;

    var fallbackCert = {
      src: 'assets/img/avatar-cartoon.jpg',
      zh: '证书待补充，暂以卡通头像占位',
      en: 'Certificate pending; cartoon avatar placeholder'
    };

    function cert(src, zh, en) {
      return { src: src, zh: zh, en: en };
    }

    var certificateRules = [
      {
        keywords: ['职业技能赛项'],
        certs: [cert('assets/img/certificates/2025/集成电路国三.jpg', '全国大学生集成电路创新创业大赛（职业技能赛项）国三', 'IC Innovation Contest — National Third')]
      },
      {
        keywords: ['瑞萨', '东部'],
        certs: [
          cert('assets/img/certificates/2024/瑞萨省一.jpg', '全国大学生电子设计竞赛（瑞萨杯）东部第一名', 'Electronic Design Contest (Renesas) — Eastern-China First'),
          cert('assets/img/certificates/2024/瑞萨国三.jpg', '全国大学生电子设计竞赛（瑞萨杯）国三', 'Electronic Design Contest (Renesas) — National Third')
        ]
      },
      {
        keywords: ['TI', '一等奖'],
        certs: [cert('assets/img/certificates/2024/24电赛 省一.png', '全国大学生电子设计竞赛（TI杯）省一', 'Electronic Design Contest (TI) — Provincial First')]
      },
      {
        keywords: ['RAICOM'],
        certs: [
          cert('assets/img/certificates/2024/24智能侦察 省一.jpg', 'RAICOM 智能侦察省一', 'RAICOM Intelligent Reconnaissance — Provincial First'),
          cert('assets/img/certificates/2024/24智能侦察 国二.jpg', 'RAICOM 智能侦察国二', 'RAICOM Intelligent Reconnaissance — National Second')
        ]
      },
      {
        keywords: ['智能汽车'],
        certs: [
          cert('assets/img/certificates/2024/24智能车 省三（个人）.png', '全国大学生智能汽车竞赛省三（个人）', 'Smart Car Competition — Provincial Third (Individual)'),
          cert('assets/img/certificates/2024/24智能车 省三（团队）.png', '全国大学生智能汽车竞赛省三（团队）', 'Smart Car Competition — Provincial Third (Team)')
        ]
      },
      {
        keywords: ['嵌入式芯片'],
        certs: [cert('assets/img/certificates/2024/24嵌赛 省三.png', '全国大学生嵌入式芯片与系统设计竞赛省三', 'Embedded Chip and System Design Contest — Provincial Third')]
      },
      {
        keywords: ['iCAN'],
        certs: [cert('assets/img/certificates/2023/23ican 国一.jpg', 'iCAN 大学生创新创业赛国一', 'iCAN Innovation Contest — National First')]
      },
      {
        keywords: ['TI', '二等奖'],
        certs: [cert('assets/img/certificates/2023/23电赛 省二.jpg', '全国大学生电子设计竞赛（TI杯）省二', 'Electronic Design Contest (TI) — Provincial Second')]
      },
      {
        keywords: ['雨骤'],
        certs: [cert('assets/img/certificates/2023/23集创赛 东部三.jpg', '全国大学生集成电路创新创业大赛（雨骤杯）东部三等', 'IC Innovation Contest (Yuzhou Cup) — East-China Third')]
      },
      {
        keywords: ['博创'],
        certs: [cert('assets/img/certificates/2023/23博创杯 国三.jpg', '全国大学生嵌入式人工智能设计大赛（博创杯）国三', 'Embedded AI Design Contest (Bochuang Cup) — National Third')]
      },
      {
        keywords: ['ResGatNet'],
        certs: [cert('assets/img/certificates/2024/屏幕截图 2024-11-08 003146.png', '论文收录截图：ResGatNet', 'Paper acceptance screenshot: ResGatNet')]
      },
      {
        keywords: ['Bifunctional flexible metasurface'],
        certs: [
          cert('assets/img/certificates/2024/Bifunctional flexible metasurface based on graphene and vanadium dioxide for polarization conversion and absorption.png', '论文：Bifunctional flexible metasurface based on graphene and vanadium dioxide for polarization conversion and absorption', 'Paper: Bifunctional flexible metasurface based on graphene and vanadium dioxide for polarization conversion and absorption'),
          cert('assets/img/certificates/2024/屏幕截图 2024-11-08 003221.png', '论文收录截图：Bifunctional flexible metasurface', 'Paper acceptance screenshot: Bifunctional flexible metasurface')
        ]
      },
      {
        keywords: ['Design and theoretical analysis'],
        certs: [
          cert('assets/img/certificates/2024/Design and theoretical analysis of a tunable bifunctional metasurface absorber based on vanadium dioxide and photoconductive silicon.png', '论文：Design and theoretical analysis of a tunable bifunctional metasurface absorber based on vanadium dioxide and photoconductive silicon', 'Paper: Design and theoretical analysis of a tunable bifunctional metasurface absorber based on vanadium dioxide and photoconductive silicon'),
          cert('assets/img/certificates/2024/屏幕截图 2024-11-08 003256.png', '论文收录截图：Design and theoretical analysis', 'Paper acceptance screenshot: Design and theoretical analysis')
        ]
      },
      {
        keywords: ['Dual-broadband flexible metasurface'],
        certs: [cert('assets/img/certificates/2024/Dual-broadband flexible metasurface based on the staggered triangular checkerboard layout for RCS reduction.png', '论文：Dual-broadband flexible metasurface based on the staggered triangular checkerboard layout for RCS reduction', 'Paper: Dual-broadband flexible metasurface based on the staggered triangular checkerboard layout for RCS reduction')]
      },
      {
        keywords: ['双频带柔性极化转换'],
        certs: [cert('assets/img/certificates/2024/屏幕截图 2024-11-08 003313.png', '论文收录截图：双频带柔性极化转换超表面的仿真研究', 'Paper acceptance screenshot: Simulation Study of a Dual-band Flexible Polarization-Conversion Metasurface')]
      },
      {
        keywords: ['基于字典动态学习'],
        certs: [cert('assets/img/certificates/2024/陶宇-发明专利证书-基于字典动态学习的目标参数估计方法、系统及存储介质.png', '发明专利：基于字典动态学习的目标参数估计方法、系统及存储介质', 'Patent: Target parameter estimation based on dynamic dictionary learning')]
      },
      {
        keywords: ['二氧化钒和光导硅'],
        certs: [cert('assets/img/certificates/2024/常熟理工学院-2024100166689 -一种基于二氧化钒和光导硅的动态可调太赫兹吸波器-发明专利证书(签章).png', '发明专利：一种基于二氧化钒和光导硅的动态可调太赫兹吸波器', 'Patent: Tunable terahertz absorber based on VO2 and photoconductive silicon')]
      }
    ];

    function getEntryText(entry) {
      return (entry.textContent || '').replace(/\s+/g, ' ');
    }

    function matchesRule(text, rule) {
      for (var i = 0; i < rule.keywords.length; i++) {
        if (text.indexOf(rule.keywords[i]) === -1) return false;
      }
      return true;
    }

    function resolveEntryCerts(entry) {
      var text = getEntryText(entry);
      for (var i = 0; i < certificateRules.length; i++) {
        if (matchesRule(text, certificateRules[i])) {
          return certificateRules[i].certs;
        }
      }
      return [fallbackCert];
    }

    function attachEntryCertificates() {
      var entries = document.querySelectorAll('.award-card, .pub-item');
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (!entry.hasAttribute('data-certs')) {
          entry.setAttribute('data-certs', JSON.stringify(resolveEntryCerts(entry)));
        }
        entry.classList.add('certificate-trigger');
        entry.setAttribute('role', 'button');
        entry.setAttribute('tabindex', '0');
        if (!entry.hasAttribute('aria-label')) {
          entry.setAttribute('aria-label', '查看对应证书 / View related certificate');
        }
      }
    }

    attachEntryCertificates();

    var triggers = document.querySelectorAll('[data-certs]');
    if (triggers.length === 0) return;

    var slides = [];
    var currentIndex = 0;
    var lastFocused = null;

    function parseCerts(raw) {
      try {
        var parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(function (item) {
          if (typeof item === 'string') {
            return { src: item, zh: '', en: '' };
          }
          return {
            src: item.src || '',
            zh: item.zh || item.caption || '',
            en: item.en || item.captionEn || ''
          };
        }).filter(function (item) {
          return item.src;
        });
      } catch (e) {
        return [];
      }
    }

    function getCaption(slide) {
      var lang = getLang();
      if (lang === 'en' && slide.en) return slide.en;
      return slide.zh || '';
    }

    function updateSlide() {
      var slide = slides[currentIndex];
      if (!slide || !img) return;
      img.src = slide.src;
      img.alt = getCaption(slide) || 'Certificate';
      if (caption) {
        caption.textContent = getCaption(slide);
      }
      if (prevBtn) prevBtn.disabled = currentIndex === 0;
      if (nextBtn) nextBtn.disabled = currentIndex === slides.length - 1;
    }

    function openModal(trigger) {
      var raw = trigger.getAttribute('data-certs');
      slides = parseCerts(raw);
      if (slides.length === 0) return;

      currentIndex = 0;
      lastFocused = document.activeElement;
      updateSlide();
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';

      // Move focus to close button for accessibility
      if (closeBtn) {
        setTimeout(function () {
          closeBtn.focus();
        }, 0);
      }
    }

    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) {
        lastFocused.focus();
      }
    }

    function nextSlide() {
      if (currentIndex < slides.length - 1) {
        currentIndex += 1;
        updateSlide();
      }
    }

    function prevSlide() {
      if (currentIndex > 0) {
        currentIndex -= 1;
        updateSlide();
      }
    }

    // Bind triggers
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function () {
        openModal(this);
      });
      triggers[i].addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(this);
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Tab') {
        // Focus trap
        var focusable = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Update caption if language is toggled while modal is open
    document.addEventListener('langChanged', function () {
      if (modal.classList.contains('is-open')) {
        updateSlide();
      }
    });
  }

  /* ============================================================
     Init
     ============================================================ */

  function init() {
    initI18n();
    initMobileNav();
    initActiveNav();
    initNavbarScroll();
    initScrollReveal();
    initCertificateModal();
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
