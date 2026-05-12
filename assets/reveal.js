/* Squirrel Wallet — site reveal helper
 * Adds `.is-visible` to elements with [data-reveal] when they enter the viewport
 * (so CSS can fade/slide them in). Also toggles `.is-scrolled` on the sticky
 * site-nav once the page scrolls past the hero, and triggers the hero
 * card-stack fan animation once on first scroll-into-view.
 *
 * Footprint target: < 1KB minified. Pure vanilla, no dependencies.
 * Respects prefers-reduced-motion (CSS already short-circuits transitions).
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    // Old browser — just expose everything so nothing stays hidden.
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.classList.add('is-visible');
    });
    document.querySelectorAll('.card-stack').forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }

  // 1) Generic reveal — fade & lift on first viewport entry.
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '-10% 0px', threshold: 0 });

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    revealObserver.observe(el);
  });

  // 2) Hero card-stack — fan animation triggers once on first view (mobile path,
  //    desktop also uses hover). On reduced-motion the CSS skips the transform.
  var stackObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Keep it open — no unobserve so the at-rest fanned state persists.
        stackObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '-15% 0px', threshold: 0.2 });

  document.querySelectorAll('.card-stack').forEach(function (el) {
    stackObserver.observe(el);
  });

  // 3) Sticky-nav border on scroll (rAF-throttled).
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (window.scrollY > 8) nav.classList.add('is-scrolled');
          else nav.classList.remove('is-scrolled');
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
