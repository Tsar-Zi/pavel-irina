/* Логика сайта. Данные берутся из js/config.js — здесь править ничего не нужно. */
(function () {
  "use strict";
  var W = window.WEDDING || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var pad = function (n) { return String(n).padStart(2, "0"); };

  /* ---------- Дата ---------- */
  var parts = (W.date || "2026-01-01").split("-").map(Number); // [г, м, д]
  var Y = parts[0], M = parts[1], D = parts[2];
  var MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  var MONTHS_NOM = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  var hasTime = /^\d{1,2}:\d{2}$/.test(W.time || "");
  var tz = W.timezone || "+03:00";
  var target = new Date(Y + "-" + pad(M) + "-" + pad(D) + "T" + (hasTime ? pad(W.time.split(":")[0]) + ":" + W.time.split(":")[1] : "00:00") + ":00" + tz);
  var dateLong = D + " " + MONTHS[M - 1] + " " + Y;

  /* ---------- Подстановка текстов ---------- */
  var cityLine = W.city ? "г. " + W.city : "";
  var bind = {
    groom: W.groom, bride: W.bride,
    dateShort: pad(D) + " / " + pad(M),
    dateDots: pad(D) + "." + pad(M) + "." + Y,
    welcome: W.welcomeText, quote: W.quote, quoteSource: W.quoteSource,
    locationText: W.locationText, cityLine: cityLine, venue: W.venue, address: W.address,
    dresscodeText: W.dresscodeText, telegramText: W.telegramText,
    timeLine: hasTime ? "в " + pad(W.time.split(":")[0]) + ":" + W.time.split(":")[1] : "",
    finalTitle: W.finalTitle,
    rsvpTitle: W.rsvp && W.rsvp.title, rsvpIntro: W.rsvp && W.rsvp.intro, rsvpDeadline: W.rsvp && W.rsvp.deadlineText,
    rsvpSuccessTitle: W.rsvp && W.rsvp.successTitle, rsvpSuccessText: W.rsvp && W.rsvp.successText
  };
  document.querySelectorAll("[data-bind]").forEach(function (el) {
    var v = bind[el.dataset.bind];
    if (v === undefined || v === null || v === "") { el.hidden = true; return; }
    el.hidden = false;
    // textContent + <br> для переносов строк (без innerHTML — безопаснее)
    el.textContent = "";
    String(v).split("\n").forEach(function (line, i) {
      if (i) el.appendChild(document.createElement("br"));
      if (el.dataset.bind === "welcome" && i === 0) {   // «Дорогие гости!» — каллиграфическим шрифтом
        var hi = document.createElement("span"); hi.className = "welcome-hi script"; hi.textContent = line; el.appendChild(hi);
      } else el.appendChild(document.createTextNode(line));
    });
  });
  document.title = (W.groom || "") + " и " + (W.bride || "") + " — " + dateLong;

  /* ---------- Положение фото ---------- */
  document.querySelectorAll("[data-photo]").forEach(function (img) {
    var p = W.photoPosition && W.photoPosition[img.dataset.photo];
    if (!p) return;
    var fr = img.parentElement;
    if (fr.classList.contains("frame")) fr.style.setProperty("--px", (parseFloat(p) / 100) || 0); // обложка: по горизонтали
    else img.style.objectPosition = p;
  });

  /* ---------- Календарь ---------- */
  (function buildCalendar() {
    var cal = $("#calendar");
    $("#calMonth").textContent = MONTHS_NOM[M - 1];
    var heads = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
    heads.forEach(function (h) {
      var c = document.createElement("div"); c.className = "cal-h"; c.setAttribute("role", "columnheader"); c.textContent = h; cal.appendChild(c);
    });
    var first = (new Date(Y, M - 1, 1).getDay() + 6) % 7; // понедельник = 0
    var days = new Date(Y, M, 0).getDate();
    for (var i = 0; i < first; i++) { var e = document.createElement("div"); e.className = "cal-d is-off"; cal.appendChild(e); }
    for (var d = 1; d <= days; d++) {
      var c = document.createElement("div"); c.className = "cal-d"; c.setAttribute("role", "cell");
      if (d === D) {
        c.classList.add("is-on"); c.setAttribute("aria-label", dateLong + " — день свадьбы");
        c.innerHTML = '<svg class="cal-ring" aria-hidden="true"><use href="#ring"/></svg><span>' + d + '</span><svg class="heart cal-heart" aria-hidden="true"><use href="#heart"/></svg>';
      } else c.textContent = d;
      cal.appendChild(c);
    }
  })();

  /* ---------- Адрес, маршрут, церемония ---------- */
  var fullAddress = [cityLine, W.address].filter(Boolean).join(", ");
  var place = [W.venue, fullAddress].filter(Boolean).join(", ");
  $("#routeBtn").href = "https://yandex.ru/maps/?text=" + encodeURIComponent([W.city, W.address].filter(Boolean).join(", "));
  var tg = $("#tgBtn");
  if (W.telegramUrl) tg.href = W.telegramUrl; else tg.hidden = true;

  /* ---------- Dress code ---------- */
  var sw = $("#swatches");
  (W.dresscode || []).forEach(function (c) {
    var li = document.createElement("li"), dot = document.createElement("i"), cap = document.createElement("span");
    dot.style.background = c.color; cap.textContent = c.name || "";
    li.appendChild(dot); li.appendChild(cap); sw.appendChild(li);
  });

  /* ---------- Плавная прокрутка к якорям ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-scroll]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var t = $(a.getAttribute("href")); if (!t) return;
      ev.preventDefault();
      t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var f = t.querySelector("input, select, textarea"); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, reduce ? 0 : 600);
    });
  });

  /* ---------- Обратный отсчёт ---------- */
  var cd = { d: $("#cdD"), h: $("#cdH"), m: $("#cdM"), s: $("#cdS") };

  // Циферблаты: деления, дуга «сколько осталось» и стрелка. Рисуются в SVG из этой таблицы.
  var NS = "http://www.w3.org/2000/svg";
  var DIALS = { d: { ticks: 12, major: 3 }, h: { ticks: 24, major: 6 }, m: { ticks: 60, major: 5 }, s: { ticks: 60, major: 5 } };
  var dialEls = {};
  function mk(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  document.querySelectorAll(".dial").forEach(function (el) {
    var u = el.dataset.unit, cfg = DIALS[u], svg = $("svg", el);
    svg.appendChild(mk("circle", { r: 47.5, class: "d-ring" }));
    for (var i = 0; i < cfg.ticks; i++) {
      var maj = i % cfg.major === 0;
      svg.appendChild(mk("line", { x1: 0, y1: maj ? -39 : -42, x2: 0, y2: -45, class: "d-tick" + (maj ? " d-major" : ""), transform: "rotate(" + (i * 360 / cfg.ticks) + ")" }));
    }
    var arc = mk("circle", { r: 33, class: "d-arc", pathLength: 100, "stroke-dasharray": "0 100", transform: "rotate(-90)" });
    var hand = mk("g", { class: "d-hand" });
    hand.appendChild(mk("line", { x1: 0, y1: -22, x2: 0, y2: -37, class: "d-needle" }));
    hand.appendChild(mk("circle", { cy: -37, r: 2.6, class: "d-tip" }));
    svg.appendChild(arc); svg.appendChild(hand);
    dialEls[u] = { arc: arc, hand: hand, last: null };
  });
  function setDial(u, f) {
    var d = dialEls[u]; if (!d) return;
    f = Math.max(0, Math.min(1, f));
    var a = f * 360, jump = d.last !== null && Math.abs(a - d.last) > 180; // переход через «12 часов» — без прокрутки назад
    d.hand.style.transition = jump ? "none" : "";
    d.hand.style.transform = "rotate(" + a + "deg)";
    d.arc.setAttribute("stroke-dasharray", (f * 100).toFixed(2) + " 100");
    d.last = a;
  }

  function tick() {
    var left = target.getTime() - Date.now();
    if (left <= 0) {
      $("#countdown").hidden = true; document.querySelectorAll(".cd-lead,.cd-tail").forEach(function (n) { n.hidden = true; });
      var done = $("#cdDone"); done.hidden = false; done.textContent = "Этот день настал!";
      return false;
    }
    var s = Math.floor(left / 1000);
    cd.d.textContent = Math.floor(s / 86400);
    cd.h.textContent = pad(Math.floor(s % 86400 / 3600));
    cd.m.textContent = pad(Math.floor(s % 3600 / 60));
    cd.s.textContent = pad(s % 60);
    var days = s / 86400, hrs = s % 86400 / 3600, mins = s % 3600 / 60, secs = s % 60;
    setDial("d", days / 365);        // стрелка дней: доля года, оставшаяся до свадьбы
    setDial("h", hrs / 24);
    setDial("m", mins / 60);
    setDial("s", secs / 60);
    return true;
  }
  if (tick()) {
    var timer = setInterval(function () { if (!tick()) clearInterval(timer); }, 1000);
  }

  /* ---------- Добавить в календарь (.ics) ---------- */
  $("#calBtn").addEventListener("click", function () {
    var uid = "wedding-" + W.date + "@invitation";
    var stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    var dt;
    if (hasTime) {
      var start = target, end = new Date(target.getTime() + 6 * 3600 * 1000);
      var f = function (d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""); };
      dt = "DTSTART:" + f(start) + "\r\nDTEND:" + f(end);
    } else {
      var next = new Date(Date.UTC(Y, M - 1, D + 1));
      var ymd = function (y, m, d) { return y + pad(m) + pad(d); };
      dt = "DTSTART;VALUE=DATE:" + ymd(Y, M, D) + "\r\nDTEND;VALUE=DATE:" + ymd(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
    }
    var esc = function (t) { return String(t).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); };
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding invitation//RU", "BEGIN:VEVENT",
      "UID:" + uid, "DTSTAMP:" + stamp, dt,
      "SUMMARY:" + esc("Свадьба: " + W.groom + " и " + W.bride),
      "LOCATION:" + esc(place), "DESCRIPTION:" + esc(hasTime ? "Начало в " + W.time : ""), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    var a = document.createElement("a"); a.href = url; a.download = "wedding.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  });

  /* ---------- Анкета гостя ---------- */
  (function rsvp() {
    var cfg = W.rsvp || {}, qs = cfg.questions || [];
    var form = $("#rsvpForm");
    var el = function (tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt) n.textContent = txt; return n; };

    qs.forEach(function (q) {
      var wrap = el(q.type === "radio" || q.type === "checkbox" ? "fieldset" : "div", "field");
      wrap.dataset.id = q.id;
      var labelText = q.label + (q.required || q.requiredIf ? " *" : "");
      var id = "q-" + q.id;
      if (wrap.tagName === "FIELDSET") {
        var lg = el("legend", "q", labelText); wrap.appendChild(lg);
        var chips = el("div", "chips");
        (q.options || []).forEach(function (o) {
          var lab = el("label", "chip"), inp = document.createElement("input");
          inp.type = q.type; inp.name = q.id; inp.value = o;
          lab.appendChild(inp); lab.appendChild(el("span", "", o)); chips.appendChild(lab);
        });
        wrap.appendChild(chips);
      } else {
        var lb = el("label", "q", labelText); lb.htmlFor = id; wrap.appendChild(lb);
        var inp2;
        if (q.type === "names") {
          // список имён: одно поле на каждого гостя + кнопка «Добавить»
          lb.removeAttribute("for"); lb.id = "lb-" + q.id;
          if (q.hint) wrap.appendChild(el("p", "hint", q.hint));
          var list = el("div", "names"); list.dataset.names = q.id;
          var addBtn = el("button", "btn btn--line btn--sm", "+ " + (q.addText || "Добавить"));
          addBtn.type = "button";
          var max = q.max || 6;
          var addRow = function () {
            var row = el("div", "names-row"), ni = document.createElement("input");
            ni.type = "text"; ni.autocomplete = "off"; ni.placeholder = q.placeholder || "Имя и фамилия"; ni.setAttribute("aria-labelledby", lb.id);
            ni.dataset.namesInput = q.id; row.appendChild(ni);
            var del = el("button", "names-del", "×"); del.type = "button"; del.setAttribute("aria-label", "Убрать гостя");
            del.addEventListener("click", function () { row.remove(); addBtn.hidden = false; });
            row.appendChild(del); list.appendChild(row); addBtn.hidden = list.children.length >= max; return ni;
          };
          addBtn.addEventListener("click", function () { var ni = addRow(); if (form.dataset.ready) ni.focus(); });
          wrap.appendChild(list); wrap.appendChild(addBtn);
          inp2 = null;
        } else if (q.type === "textarea") inp2 = document.createElement("textarea");
        else if (q.type === "select") {
          inp2 = document.createElement("select");
          var ph = el("option", "", "Выберите…"); ph.value = ""; inp2.appendChild(ph);
          (q.options || []).forEach(function (o) { var op = el("option", "", o); op.value = o; inp2.appendChild(op); });
        } else { inp2 = document.createElement("input"); inp2.type = "text"; inp2.autocomplete = q.id === "name" ? "name" : "off"; }
        if (inp2) { inp2.id = id; inp2.name = q.id; if (q.placeholder) inp2.placeholder = q.placeholder; wrap.appendChild(inp2); }
      }
      var err = el("p", "err"); err.hidden = true; err.id = "err-" + q.id; err.setAttribute("role", "alert"); wrap.appendChild(err);
      form.appendChild(wrap);
    });

    form.querySelectorAll(".names + .btn").forEach(function (b) { b.click(); });  // по умолчанию одно пустое поле (без фокуса, чтобы страница не прокручивалась)
    form.dataset.ready = "1";
    var hp = el("div", "hp"); hp.setAttribute("aria-hidden", "true");
    var hpi = document.createElement("input"); hpi.type = "text"; hpi.name = "website"; hpi.tabIndex = -1; hpi.autocomplete = "off"; hp.appendChild(hpi); form.appendChild(hp);

    var actions = el("div", "form-actions");
    var btn = el("button", "btn btn--solid", cfg.submitText || "Отправить"); btn.type = "submit";
    actions.appendChild(btn); form.appendChild(actions);
    var status = el("p", "form-status"); status.hidden = true; status.setAttribute("role", "status"); form.appendChild(status);

    function value(q) {
      if (q.type === "names") return Array.prototype.map.call(form.querySelectorAll('input[data-names-input="' + q.id + '"]'), function (i) { return i.value.trim(); }).filter(Boolean).join(", ");
      var f = form.elements[q.id];
      if (q.type === "checkbox") return Array.prototype.filter.call(form.querySelectorAll('input[name="' + q.id + '"]'), function (i) { return i.checked; }).map(function (i) { return i.value; });
      if (q.type === "radio") { var c = form.querySelector('input[name="' + q.id + '"]:checked'); return c ? c.value : ""; }
      return (f.value || "").trim();
    }
    function visible(q) {
      if (!q.showIf) return true;
      var dep = qs.filter(function (x) { return x.id === q.showIf.field; })[0];
      return !!dep && visible(dep) && value(dep) === q.showIf.value;
    }
    function refresh() {
      qs.forEach(function (q) { var w = form.querySelector('.field[data-id="' + q.id + '"]'); w.hidden = !visible(q); });
    }
    form.addEventListener("change", refresh); refresh();

    function validate() {
      var first = null;
      qs.forEach(function (q) {
        var w = form.querySelector('.field[data-id="' + q.id + '"]'), e = $("#err-" + q.id);
        var ok = true, msg = "";
        var isReq = q.required;
        if (q.requiredIf) { var rd = qs.filter(function (x) { return x.id === q.requiredIf.field; })[0]; isReq = !!rd && value(rd) === q.requiredIf.value; }
        if (!w.hidden && isReq) {
          var v = value(q);
          if (!v || (Array.isArray(v) && !v.length)) { ok = false; msg = q.type === "text" || q.type === "textarea" ? "Пожалуйста, заполните это поле." : "Пожалуйста, выберите ответ."; }
          else if (q.id === "name" && v.length < 3) { ok = false; msg = "Укажите имя и фамилию."; }
        }
        w.classList.toggle("invalid", !ok); e.hidden = ok; e.textContent = msg;
        if (!ok && !first) first = w;
      });
      return first;
    }
    form.addEventListener("input", function (ev) {
      var w = ev.target.closest(".field"); if (w && w.classList.contains("invalid")) { w.classList.remove("invalid"); $(".err", w).hidden = true; }
    });

    function show(msg) { status.textContent = msg; status.hidden = false; }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      status.hidden = true;
      var bad = validate();
      if (bad) { bad.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); var f = bad.querySelector("input, select, textarea"); if (f) f.focus({ preventScroll: true }); return; }
      if (hpi.value) return; // бот
      if (!cfg.endpoint) {
        console.warn("RSVP: не задан rsvp.endpoint в js/config.js — ответ никуда не отправлен.");
        show("Отправка анкеты пока не подключена: ответ никуда не ушёл. (Владельцу сайта: инструкция в README.md, раздел «Анкета».)");
        return;
      }
      var data = { submittedAt: new Date().toISOString() };
      qs.forEach(function (q) {
        var w = form.querySelector('.field[data-id="' + q.id + '"]');
        var v = w.hidden ? "" : value(q);
        data[q.id] = Array.isArray(v) ? v.join(", ") : v;
      });
      data._labels = qs.map(function (q) { return { id: q.id, label: q.label }; });
      btn.disabled = true; btn.textContent = "Отправляем…";
      // text/plain — «простой» запрос без preflight, его принимает Google Apps Script
      fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (j) {
          if (!j || j.ok !== true) throw new Error((j && j.error) || "bad response");
          form.hidden = true; var done = $("#rsvpDone"); done.hidden = false; done.focus();
        })
        .catch(function (e) {
          console.error("RSVP error:", e);
          btn.disabled = false; btn.textContent = cfg.submitText || "Отправить";
          show("Не удалось отправить ответ. Проверьте интернет и попробуйте ещё раз — или напишите нам в Telegram.");
        });
    });
  })();

  /* ---------- Лайтбокс ---------- */
  (function lightbox() {
    var lb = $("#lightbox"), big = $("img", lb), last = null;
    function close() { lb.hidden = true; document.body.style.overflow = ""; if (last) last.focus(); }
    document.querySelectorAll("img[data-zoom]").forEach(function (img) {
      img.tabIndex = 0; img.setAttribute("role", "button");
      var open = function () { last = img; big.src = img.currentSrc || img.src; big.alt = img.alt; lb.hidden = false; document.body.style.overflow = "hidden"; $(".lb-close", lb).focus(); };
      img.addEventListener("click", open);
      img.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    lb.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) close(); });
  })();

  /* ---------- Музыка ---------- */
  (function music() {
    var btn = $("#musicBtn"), audio = $("#audio");
    if (!W.music) return;
    audio.src = W.music; btn.hidden = false;
    btn.addEventListener("click", function () {
      if (audio.paused) {
        audio.play().then(function () { btn.setAttribute("aria-pressed", "true"); btn.setAttribute("aria-label", "Выключить музыку"); }).catch(function () {});
      } else { audio.pause(); btn.setAttribute("aria-pressed", "false"); btn.setAttribute("aria-label", "Включить музыку"); }
    });
  })();

  /* ---------- Плавное появление блоков ---------- */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (n) { io.observe(n); });
  } else {
    items.forEach(function (n) { n.classList.add("in"); });
  }
})();

/* видео: автозапуск без звука (браузеры иначе не разрешают); играет, пока в зоне видимости; звук включается кнопкой плеера */
(function () {
  var v = document.querySelector(".film-frame video"); if (!v) return;
  v.muted = true;
  function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) play(); else v.pause(); }); }, { threshold: 0.35 }).observe(v);
  } else play();
})();

/* вступительное видео: конверт раскрывается и открывает фото, затем плавно появляется сайт */
(function () {
  var root = document.documentElement, box = document.getElementById("intro");
  if (!box || !root.classList.contains("intro-on")) return;
  var v = document.getElementById("introVideo"), skip = document.getElementById("introSkip"), open = document.getElementById("introOpen");
  var closed = false;
  function close() {
    if (closed) return; closed = true;
    root.classList.add("intro-go");
    window.scrollTo(0, 0);
    box.classList.add("is-out");
    setTimeout(function () { box.remove(); root.classList.remove("intro-on"); }, 1000);
  }
  function play() {
    v.muted = false;
    var p = v.play();
    if (p && p.catch) p.catch(function () {            // со звуком не разрешили, пробуем без звука
      v.muted = true; var p2 = v.play();
      if (p2 && p2.catch) p2.catch(function () { open.hidden = false; });
    });
  }
  v.addEventListener("ended", close); v.addEventListener("error", close);
  v.addEventListener("timeupdate", function () { if (v.currentTime > v.duration - 1.2) root.classList.add("intro-go"); });
  skip.addEventListener("click", close);
  open.addEventListener("click", function () { open.hidden = true; play(); });
  setTimeout(function () { if (!closed && v.paused && v.readyState < 2) close(); }, 12000);
  play();
})();
