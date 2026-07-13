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

  function initHeaderControls() {
    var hamburger = document.querySelector('.navbar__hamburger');
    var mobileMenu = document.querySelector('.mobile-menu');
    var overlay = document.querySelector('.mobile-overlay');
    var contactTrigger = document.querySelector('.identity-contact-trigger');
    var contactPanel = document.querySelector('#identity-contact-panel');
    var contactLink = contactPanel ? contactPanel.querySelector('a') : null;

    function isMenuOpen() {
      return mobileMenu && mobileMenu.classList.contains('is-open');
    }

    function isContactOpen() {
      return contactPanel && !contactPanel.hidden;
    }

    function openMenu() {
      if (!hamburger || !mobileMenu) return;
      closeContact(false);
      hamburger.classList.add('is-active');
      mobileMenu.classList.add('is-open');
      if (overlay) overlay.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      hamburger.setAttribute('aria-expanded', 'true');
      window.requestAnimationFrame(function () {
        var links = mobileMenu.querySelectorAll('.mobile-menu__link');
        for (var i = 0; i < links.length; i++) {
          if (links[i].getClientRects().length > 0) {
            links[i].focus();
            return;
          }
        }
      });
    }

    function closeMenu(restoreFocus) {
      if (!hamburger || !mobileMenu) return;
      hamburger.classList.remove('is-active');
      mobileMenu.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
      hamburger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) hamburger.focus();
    }

    function openContact() {
      if (!contactTrigger || !contactPanel) return;
      closeMenu(false);
      contactPanel.hidden = false;
      contactTrigger.setAttribute('aria-expanded', 'true');
      if (contactLink) contactLink.focus();
    }

    function closeContact(restoreFocus) {
      if (!contactTrigger || !contactPanel) return;
      contactPanel.hidden = true;
      contactTrigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) contactTrigger.focus();
    }

    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', function () {
        if (isMenuOpen()) {
          closeMenu(false);
        } else {
          openMenu();
        }
      });
    }

    if (contactTrigger && contactPanel) {
      contactTrigger.addEventListener('click', function () {
        if (isContactOpen()) {
          closeContact(true);
        } else {
          openContact();
        }
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function () {
        closeMenu(true);
      });
    }

    var mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('.mobile-menu__link') : [];
    for (var i = 0; i < mobileLinks.length; i++) {
      mobileLinks[i].addEventListener('click', function () {
        closeMenu(false);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (isContactOpen()) {
        closeContact(true);
      } else if (isMenuOpen()) {
        closeMenu(true);
      }
    });

    document.addEventListener('click', function (e) {
      if (isContactOpen() && !contactPanel.contains(e.target) && !contactTrigger.contains(e.target)) {
        closeContact(true);
      }
    });
  }

  /* ============================================================
     Active Nav Highlight
     ============================================================ */

  function initActiveNav() {
    var links = document.querySelectorAll('.navbar__link, .mobile-menu__link');

    function updateActiveLinks() {
      var currentUrl = new URL(window.location.href);
      var currentFilename = currentUrl.pathname.split('/').pop() || 'index.html';
      var currentHash = currentUrl.hash;

      for (var i = 0; i < links.length; i++) {
        links[i].classList.remove('is-active');
        links[i].removeAttribute('aria-current');
      }

      for (var j = 0; j < links.length; j++) {
        var link = links[j];
        if (isActiveLink(link, currentFilename, currentHash)) {
          link.classList.add('is-active');
          link.setAttribute('aria-current', currentHash === '#about' ? 'location' : 'page');
        }
      }
    }

    function isActiveLink(link, currentFilename, currentHash) {
      var href = link.getAttribute('href');
      if (!href) return false;

      var linkUrl = new URL(href, window.location.href);
      var linkFilename = linkUrl.pathname.split('/').pop() || 'index.html';

      if (currentFilename !== 'index.html') {
        return linkFilename === currentFilename && !linkUrl.hash;
      }

      if (currentHash === '#about') {
        return linkFilename === 'index.html' && linkUrl.hash === '#about';
      }

      return linkFilename === 'index.html' && !linkUrl.hash;
    }

    updateActiveLinks();
    window.addEventListener('hashchange', updateActiveLinks);
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
      modal.setAttribute('aria-hidden', 'false');
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
      modal.setAttribute('aria-hidden', 'true');
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
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
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
    initHeaderControls();
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
