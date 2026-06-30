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
     Init
     ============================================================ */

  function init() {
    initI18n();
    initMobileNav();
    initActiveNav();
    initNavbarScroll();
    initScrollReveal();
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
