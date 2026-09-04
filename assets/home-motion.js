/* Squirrel Stash — homepage motion
 *
 * Adds the interactive layer on top of styles.css:
 *   1. Scroll reveals for [data-anim] (with optional per-item stagger).
 *   2. Scroll progress bar + sticky-nav state + nav scroll-spy.
 *   3. Pointer/scroll parallax on the hero phone stack.
 *   4. Cursor spotlight + 3D tilt on cards.
 *   5. Magnetic buttons.
 *   6. Back-to-top control.
 *   7. Pausing looping animations while they are off screen.
 *
 * Vanilla, no dependencies. The hidden reveal state lives behind the
 * `.motion-ready` class this file adds, so the page stays fully readable
 * if the script never loads. Honours prefers-reduced-motion and skips the
 * pointer effects on touch devices.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var raf = window.requestAnimationFrame.bind(window);

  /* Run `fn` at most once per frame. */
  function throttled(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      raf(function () {
        queued = false;
        fn();
      });
    };
  }

  /* ---------------------------------------------------------------
     1. Scroll reveal
     --------------------------------------------------------------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('[data-anim]'));

  // Containers can stagger their own [data-anim] children instead of every
  // item carrying a hand-written delay.
  Array.prototype.forEach.call(document.querySelectorAll('[data-anim-stagger]'), function (group) {
    var step = parseInt(group.getAttribute('data-anim-stagger'), 10) || 0;
    var base = parseInt(group.getAttribute('data-anim-base'), 10) || 0;
    Array.prototype.forEach.call(group.children, function (child, index) {
      if (child.hasAttribute('data-anim') && !child.hasAttribute('data-anim-delay')) {
        child.setAttribute('data-anim-delay', String(base + index * step));
      }
    });
  });

  revealables.forEach(function (el) {
    var delay = el.getAttribute('data-anim-delay');
    if (delay) {
      el.style.setProperty('--d', delay + 'ms');
    }
  });

  root.classList.add('motion-ready');

  if (!('IntersectionObserver' in window) || reduced.matches) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    revealables.forEach(function (el) { revealObserver.observe(el); });

    // Safety net: anything still hidden after load (e.g. an observer that
    // never fired) gets shown rather than staying invisible.
    window.addEventListener('load', function () {
      window.setTimeout(function () {
        revealables.forEach(function (el) {
          if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('is-in');
          }
        });
      }, 400);
    });
  }

  /* ---------------------------------------------------------------
     2. Scroll progress, sticky nav, scroll-spy, back-to-top
     --------------------------------------------------------------- */
  var progress = document.querySelector('.scroll-progress');
  var nav = document.querySelector('.product-nav');
  var toTop = document.querySelector('.back-to-top');
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.product-nav__links a[href^="#"]')
  );
  var navTargets = navLinks.map(function (link) {
    try {
      return document.querySelector(link.getAttribute('href'));
    } catch (error) {
      return null;
    }
  });

  var stage = document.querySelector('.screenshot-stage');
  var phones = stage
    ? Array.prototype.slice.call(stage.querySelectorAll('.phone-shot'))
    : [];
  // Per-phone parallax strength; the faded background phones drift more.
  var depths = [0.055, 0.11, -0.085];
  var pointerOffsets = phones.map(function () { return { x: 0, y: 0 }; });
  var scrollOffsets = phones.map(function () { return 0; });

  // Stagger the hero phones as the stack fades in.
  phones.forEach(function (phone, i) {
    phone.style.setProperty('--pd', i * 130 + 'ms');
  });

  function writePhone(index) {
    var el = phones[index];
    if (!el) return;
    el.style.setProperty('--px', pointerOffsets[index].x.toFixed(1) + 'px');
    el.style.setProperty('--py', (pointerOffsets[index].y + scrollOffsets[index]).toFixed(1) + 'px');
  }

  var onScroll = throttled(function () {
    var y = window.scrollY || window.pageYOffset || 0;

    if (progress) {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--sw-progress', scrollable > 0 ? Math.min(1, y / scrollable) : 0);
    }

    if (nav) {
      nav.classList.toggle('is-stuck', y > 12);
    }

    if (toTop) {
      toTop.classList.toggle('is-shown', y > window.innerHeight * 0.8);
    }

    if (navLinks.length) {
      var active = -1;
      for (var i = 0; i < navTargets.length; i++) {
        var target = navTargets[i];
        if (target && target.getBoundingClientRect().top <= 160) active = i;
      }
      navLinks.forEach(function (link, index) {
        link.classList.toggle('is-active', index === active);
      });
    }

    if (!reduced.matches && phones.length && stage) {
      // How far the stage has travelled up past its natural resting point.
      var travel = -stage.getBoundingClientRect().top;
      phones.forEach(function (_, index) {
        scrollOffsets[index] = travel * (depths[index] || 0);
        writePhone(index);
      });
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: reduced.matches ? 'auto' : 'smooth'
      });
    });
  }

  /* ---------------------------------------------------------------
     3. Pointer parallax on the hero phone stack
     --------------------------------------------------------------- */
  if (stage && phones.length && fine.matches && !reduced.matches) {
    var pointerX = 0;
    var pointerY = 0;

    var applyPointer = throttled(function () {
      phones.forEach(function (_, index) {
        var strength = (depths[index] || 0) * 320;
        pointerOffsets[index].x = pointerX * strength;
        pointerOffsets[index].y = pointerY * strength * 0.6;
        writePhone(index);
      });
    });

    stage.addEventListener('pointermove', function (event) {
      var box = stage.getBoundingClientRect();
      // -0.5 .. 0.5 relative to the stage centre.
      pointerX = (event.clientX - box.left) / box.width - 0.5;
      pointerY = (event.clientY - box.top) / box.height - 0.5;
      applyPointer();
    });

    stage.addEventListener('pointerleave', function () {
      pointerX = 0;
      pointerY = 0;
      applyPointer();
    });
  }

  /* ---------------------------------------------------------------
     4. Cards: cursor spotlight + subtle 3D tilt
     --------------------------------------------------------------- */
  if (fine.matches) {
    var TILT = reduced.matches ? 0 : 4.5;
    var cards = document.querySelectorAll(
      '.product-facts div, .capture-steps article, .privacy-grid article, .pro-panel'
    );

    Array.prototype.forEach.call(cards, function (card) {
      var localX = 0;
      var localY = 0;
      var ratioX = 0;
      var ratioY = 0;

      // The Pro panel is too large to tilt convincingly; it gets the
      // spotlight only.
      var tilt = TILT && !card.classList.contains('pro-panel');

      var paint = throttled(function () {
        card.style.setProperty('--mx', localX.toFixed(1) + 'px');
        card.style.setProperty('--my', localY.toFixed(1) + 'px');
        if (!tilt) return;
        // rotateX(a) * rotateY(b) approximated as one axis-angle rotation,
        // which the standalone `rotate` property can express without
        // touching `transform` (that one belongs to the reveal).
        var angleX = -ratioY * tilt;
        var angleY = ratioX * tilt;
        var angle = Math.sqrt(angleX * angleX + angleY * angleY);
        card.style.setProperty('--rax', angleX.toFixed(3));
        card.style.setProperty('--ray', angleY.toFixed(3));
        card.style.setProperty('--rang', angle.toFixed(2) + 'deg');
      });

      card.addEventListener('pointermove', function (event) {
        var box = card.getBoundingClientRect();
        localX = event.clientX - box.left;
        localY = event.clientY - box.top;
        ratioX = localX / box.width - 0.5;
        ratioY = localY / box.height - 0.5;
        paint();
      });

      card.addEventListener('pointerleave', function () {
        ratioX = 0;
        ratioY = 0;
        card.style.setProperty('--rax', '0');
        card.style.setProperty('--ray', '0');
        card.style.setProperty('--rang', '0deg');
      });
    });

    /* -------------------------------------------------------------
       5. Magnetic buttons
       ------------------------------------------------------------- */
    var MAGNET = reduced.matches ? 0 : 7;
    if (MAGNET) {
      Array.prototype.forEach.call(document.querySelectorAll('.product-button'), function (button) {
        var shiftX = 0;
        var shiftY = 0;

        var paintMagnet = throttled(function () {
          button.style.setProperty('--mgx', shiftX.toFixed(1) + 'px');
          button.style.setProperty('--mgy', shiftY.toFixed(1) + 'px');
        });

        button.addEventListener('pointermove', function (event) {
          var box = button.getBoundingClientRect();
          shiftX = ((event.clientX - box.left) / box.width - 0.5) * 2 * MAGNET;
          shiftY = ((event.clientY - box.top) / box.height - 0.5) * 2 * (MAGNET * 0.5);
          paintMagnet();
        });

        button.addEventListener('pointerleave', function () {
          shiftX = 0;
          shiftY = 0;
          paintMagnet();
        });
      });
    }
  }

  /* ---------------------------------------------------------------
     6. Pause looping animations while they are off screen
     --------------------------------------------------------------- */
  if ('IntersectionObserver' in window) {
    var loopers = document.querySelectorAll('.screenshot-stage, .pro-panel, .feature-list');
    if (loopers.length) {
      var loopObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-onscreen', entry.isIntersecting);
        });
      }, { rootMargin: '120px 0px' });

      Array.prototype.forEach.call(loopers, function (el) { loopObserver.observe(el); });
    }
  } else {
    Array.prototype.forEach.call(
      document.querySelectorAll('.screenshot-stage, .pro-panel, .feature-list'),
      function (el) { el.classList.add('is-onscreen'); }
    );
  }
})();
