/* BytePro landing — interacciones vanilla, sin dependencias externas */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Progreso de scroll + navbar + to-top + línea de pasos */
  var progress = document.getElementById("scrollProgress");
  var navbar = document.getElementById("navbar");
  var toTop = document.getElementById("toTop");
  var stepsLine = document.getElementById("stepsLine");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? h.scrollTop / max : 0;
    if (progress) progress.style.width = (p * 100).toFixed(2) + "%";
    if (navbar) navbar.classList.toggle("scrolled", h.scrollTop > 12);
    if (toTop) toTop.classList.toggle("show", h.scrollTop > 600);
    if (stepsLine) {
      var steps = document.querySelector(".steps");
      if (steps) {
        var r = steps.getBoundingClientRect();
        var fill = Math.min(1, Math.max(0, (window.innerHeight * 0.65 - r.top) / r.height));
        stepsLine.style.setProperty("--fill", reduceMotion ? 1 : fill.toFixed(3));
      }
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* 2. Menú móvil */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

  /* 3. Reveal on-scroll con stagger */
  var revealEls = document.querySelectorAll(".reveal");
  revealEls.forEach(function (el) {
    var d = el.getAttribute("data-delay");
    if (d) el.style.transitionDelay = d + "ms";
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* 4. Rotador de palabras del hero: 2s pausa + 2s transición, sin mover el layout */
  var words = ["seguridad", "rapidez", "garantía", "confianza"];
  var HOLD_MS = 2000;       /* pausa con la palabra visible */
  var FADE_MS = 2000;       /* debe coincidir con la transición CSS de .typing */
  var typingEl = document.getElementById("typing");
  if (typingEl && !reduceMotion) {
    var wi = 0;
    typingEl.textContent = words[0];
    setTimeout(nextWord, HOLD_MS);
    function nextWord() {
      typingEl.classList.add("is-fading"); /* transición de salida (2s) */
      setTimeout(function () {
        wi = (wi + 1) % words.length;
        typingEl.textContent = words[wi];
        /* forzar reflow para que la entrada también anime */
        void typingEl.offsetWidth;
        typingEl.classList.remove("is-fading"); /* transición de entrada (2s) */
        setTimeout(nextWord, HOLD_MS + FADE_MS); /* visible + entrada antes del siguiente cambio */
      }, FADE_MS);
    }
  }

  /* 5. Contadores animados */
  function animateCount(dt) {
    var target = parseFloat(dt.getAttribute("data-count"));
    var decimals = parseInt(dt.getAttribute("data-decimals") || "0", 10);
    var prefix = dt.getAttribute("data-prefix") || "";
    var suffix = dt.getAttribute("data-suffix") || "";
    if (reduceMotion) { dt.textContent = prefix + target.toFixed(decimals) + suffix; return; }
    var start = null, dur = 1400;
    function frame(t) {
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      dt.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(animateCount);
  }

  /* 6. Tilt 3D + spotlight en cards */
  document.querySelectorAll(".tilt").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      if (reduceMotion) return;
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = "perspective(800px) rotateY(" + (x * 8).toFixed(2) + "deg) rotateX(" + (-y * 8).toFixed(2) + "deg) translateY(-6px)";
    });
    card.addEventListener("mouseleave", function () { card.style.transform = ""; });
  });
  document.querySelectorAll(".spot").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  });

  /* 7. Parallax del mockup con el mouse (hero) */
  var mockup = document.getElementById("heroMockup");
  var hero = document.querySelector(".hero");
  if (mockup && hero && !reduceMotion) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      mockup.style.translate = (x * 14).toFixed(1) + "px " + (y * 12).toFixed(1) + "px";
    });
    hero.addEventListener("mouseleave", function () { mockup.style.translate = "0 0"; });
  }

  /* 8. Botones magnéticos + ripple */
  document.querySelectorAll(".magnetic").forEach(function (btn) {
    btn.addEventListener("mousemove", function (e) {
      if (reduceMotion) return;
      var r = btn.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      btn.style.transform = "translate(" + (x * 0.12).toFixed(1) + "px," + (y * 0.15).toFixed(1) + "px)";
    });
    btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    btn.addEventListener("click", function (e) {
      var r = btn.getBoundingClientRect();
      var s = document.createElement("span");
      var size = Math.max(r.width, r.height);
      s.className = "ripple";
      s.style.width = s.style.height = size + "px";
      s.style.left = (e.clientX - r.left - size / 2) + "px";
      s.style.top = (e.clientY - r.top - size / 2) + "px";
      btn.appendChild(s);
      setTimeout(function () { s.remove(); }, 650);
    });
  });

  /* 9. Toast del catálogo demo */
  var toast = document.getElementById("toast");
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }
  document.querySelectorAll(".add-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      showToast("✓ " + (b.getAttribute("data-name") || "Producto") + " añadido (demo) — entra a la app para comprar");
    });
  });

  /* 10. Pill estado backend (no rompe sin backend) */
  var pill = document.getElementById("apiPill");
  function setPill(txt, cls) {
    if (!pill) return;
    pill.textContent = txt;
    pill.classList.remove("ok", "bad");
    if (cls) pill.classList.add(cls);
  }
  function checkApi() {
    setPill("● comprobando…", "");
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 2500);
    fetch("/api/health", { signal: ctrl.signal })
      .then(function (res) {
        clearTimeout(timer);
        if (res.ok) setPill("● API en línea", "ok");
        else setPill("● modo demo", "bad");
      })
      .catch(function () {
        clearTimeout(timer);
        setPill("● modo demo", "bad");
      });
  }
  if (pill) {
    checkApi();
    pill.addEventListener("click", checkApi);
  }
})();
