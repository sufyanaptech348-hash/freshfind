

(function () {
  'use strict';

  

  var stageImages = document.querySelectorAll('.stage-image');
  var stageDots = document.querySelectorAll('.stage-dot');
  var stageBadge = document.getElementById('stageBadge');
  var stageTitle = document.getElementById('stageTitle');
  var stageMeta  = document.getElementById('stageMeta');
  var stageViewport = document.querySelector('.stage-viewport');

  var stageData = [
    { badge: 'Featured',  title: 'Daily Harvest',       meta: 'Hand-picked, same-day from local farms' },
    { badge: 'Nearby',    title: 'Neighborhood Stalls', meta: 'Family-run markets around Karachi' },
    { badge: 'Seasonal',  title: 'Fresh Picks',         meta: 'What is ripest right now' },
    { badge: 'Community', title: 'Meet the Growers',    meta: 'The people behind your basket' }
  ];

  var stageIndex = 0;
  var stageTimer = null;
  var stagePaused = false;

  function setStage(i) {
    if (!stageImages.length) return;
    stageIndex = (i + stageImages.length) % stageImages.length;

    stageImages.forEach(function (img, idx) {
      img.classList.toggle('is-active', idx === stageIndex);
    });
    stageDots.forEach(function (dot, idx) {
      dot.classList.toggle('is-active', idx === stageIndex);
    });

    var d = stageData[stageIndex];
    if (d) {
      if (stageBadge) stageBadge.textContent = d.badge;
      if (stageTitle) stageTitle.textContent = d.title;
      if (stageMeta)  stageMeta.textContent  = d.meta;
    }
  }

  function startStageAuto() {
    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || stageImages.length < 2) return;
    if (stageTimer) clearInterval(stageTimer);
    stageTimer = setInterval(function () {
      if (!stagePaused && !document.hidden) setStage(stageIndex + 1);
    }, 5000);
  }

  if (stageViewport) {
    stageViewport.addEventListener('mouseenter', function () { stagePaused = true; });
    stageViewport.addEventListener('mouseleave', function () { stagePaused = false; });
  }

  stageDots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      setStage(parseInt(dot.getAttribute('data-index'), 10));
      startStageAuto();
    });
  });

  
  var stageSection = document.querySelector('.intro-section');
  window.addEventListener('scroll', function () {
    if (!stageSection || !stageImages.length) return;
    var rect = stageSection.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) return;

    var progress = Math.min(1, Math.max(0, -rect.top / total));
    var target = Math.min(stageImages.length - 1, Math.floor(progress * stageImages.length));

    if (target !== stageIndex) setStage(target);
  }, { passive: true });

  setStage(0);
  startStageAuto();


  

  var DATA = window.FRESHFIND_MARKET_DATA || null;
  var rail = document.getElementById('homeRail');

  if (!DATA || !DATA.markets || !DATA.markets.length || !rail) {

    setupReveals();
    return;
  }

  var markets = DATA.markets;
  var SHORT_DAY = DATA.SHORT_DAY || {};
  var WEEK_ORDER = DATA.WEEK_ORDER || DATA.DAYS || [];
  var ROTATE_MS = 5200;

  function toMinutes(v) {
    var p = String(v).split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function formatTime(v) {
    var p = String(v).split(':');
    var h = parseInt(p[0], 10);
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + p[1] + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function formatDistance(km) {
    return km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km';
  }
  function haversine(a, b) {
    var R = 6371, toRad = function (d) { return d * Math.PI / 180; };
    var dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function isOpenNow(m) {
    var now = new Date();
    if (m.days.indexOf(DATA.DAYS[now.getDay()]) === -1) return false;
    var mins = now.getHours() * 60 + now.getMinutes();
    return mins >= toMinutes(m.open) && mins < toMinutes(m.close);
  }
  function dayLabels(m) {
    return m.days.map(function (d) { return SHORT_DAY[d] || d; }).join(' · ');
  }
  function hoursLabel(m) {
    return formatTime(m.open) + ' – ' + formatTime(m.close);
  }
  function matchesQuery(m, q) {
    if (!q) return true;
    var hay = [m.name, m.area, m.location, m.address,
      m.produce.join(' '), m.items.join(' ')].join(' ').toLowerCase();
    return q.toLowerCase().split(/\s+/).every(function (t) {
      return !t || hay.indexOf(t) !== -1;
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function mapsUrl(m) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(m.lat + ',' + m.lng);
  }
  function marketsWith(item) {
    var want = item.toLowerCase();
    return markets.filter(function (m) {
      return m.items.some(function (i) { return i.toLowerCase().indexOf(want) !== -1; });
    });
  }

  var FALLBACK_SEASON = {
    Winter: ['Orange', 'Spinach', 'Potato', 'Carrot'],
    Spring: ['Strawberry', 'Mint', 'Kale', 'Lettuce'],
    Summer: ['Mango', 'Watermelon', 'Banana', 'Lemon'],
    Autumn: ['Guava', 'Pomegranate', 'Apple', 'Grapes']
  };
  var MONTH_SEASON = [
    'Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer',
    'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'
  ];
  var seasonProduce = FALLBACK_SEASON;

  function loadSeasonProduce() {
    if (!window.fetch) return Promise.resolve();
    return fetch('produce.json')
      .then(function (r) { if (!r.ok) throw new Error('no'); return r.json(); })
      .then(function (json) {
        if (!json || !json.products) return;
        var grouped = {};
        json.products.forEach(function (p) {
          if (!p || !p.name || !p.season || p.season === 'Year-round') return;
          (grouped[p.season] = grouped[p.season] || []).push(p.name);
        });
        if (grouped.Winter && grouped.Spring && grouped.Summer && grouped.Autumn) {
          seasonProduce = grouped;
        }
      })
      .catch(function () {});
  }

  function currentSeason() {
    var name = MONTH_SEASON[new Date().getMonth()];
    return { name: name, produce: seasonProduce[name] || [] };
  }

  
  var areaSel = document.getElementById('hfArea');
  var daySel = document.getElementById('hfDay');
  var produceSel = document.getElementById('hfProduce');

  function fillSelect(sel, values, allLabel) {
    if (!sel) return;
    sel.innerHTML = '<option value="all">' + escapeHtml(allLabel) + '</option>' +
      values.map(function (v) {
        return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>';
      }).join('');
  }
  fillSelect(areaSel, DATA.areas || [], 'All areas');
  fillSelect(daySel, WEEK_ORDER, 'Any day');
  fillSelect(produceSel, DATA.produce || [], 'Any produce');

  var queryInput = document.getElementById('hfQuery');
  var statusEl = document.getElementById('hfStatus');
  var resultsEl = document.getElementById('hfResults');
  var form = document.getElementById('hfForm');
  var resetBtn = document.getElementById('hfReset');
  var origin = null;
  var lastHits = [];

  function requestLocation() {
    if (origin || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (pos) {
      origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (lastHits.length) runQuickFind();
    }, function () {});
  }

  function runQuickFind() {
    if (!resultsEl) return 0;

    var q = (queryInput && queryInput.value || '').trim();
    var area = areaSel ? areaSel.value : 'all';
    var day = daySel ? daySel.value : 'all';
    var produce = produceSel ? produceSel.value : 'all';

    var hits = markets.filter(function (m) {
      if (area !== 'all' && m.area !== area) return false;
      if (day !== 'all' && m.days.indexOf(day) === -1) return false;
      if (produce !== 'all' && m.produce.indexOf(produce) === -1) return false;
      return matchesQuery(m, q);
    });

    if (origin) {
      hits.sort(function (a, b) { return haversine(origin, a) - haversine(origin, b); });
    } else {
      hits.sort(function (a, b) {
        return (isOpenNow(b) ? 1 : 0) - (isOpenNow(a) ? 1 : 0) || a.name.localeCompare(b.name);
      });
    }
    lastHits = hits;

    if (!hits.length) {
      resultsEl.innerHTML = '<p class="home-result-empty">No markets match that yet. ' +
        'Try another area or day, or <a href="marketfind.html">browse all ' +
        markets.length + ' markets</a>.</p>';
      if (statusEl) statusEl.textContent = 'No matching markets.';
      return 0;
    }

    resultsEl.innerHTML = hits.slice(0, 4).map(function (m) {
      var dist = origin ? ' · ' + formatDistance(haversine(origin, m)) + ' away' : '';
      return '<a class="home-result" href="' + mapsUrl(m) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="home-result-name">' + escapeHtml(m.name) +
        (isOpenNow(m) ? '<span class="home-result-open">Open</span>' : '') +
        '</span>' +
        '<span class="home-result-meta">' + escapeHtml(m.area) + ' · ' +
        escapeHtml(dayLabels(m)) + ' · ' + escapeHtml(hoursLabel(m)) + dist + '</span></a>';
    }).join('') + (hits.length > 4
      ? '<a class="home-result" href="marketfind.html">' +
        '<span class="home-result-name">See all ' + hits.length + ' matches</span>' +
        '<span class="home-result-meta">Open the full market finder</span></a>'
      : '');

    if (statusEl) statusEl.textContent = hits.length === 1 ? '1 market matches.' : hits.length + ' markets match.';
    return hits.length;
  }

  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault(); requestLocation(); runQuickFind();
  });
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (queryInput) queryInput.value = '';
    if (areaSel) areaSel.value = 'all';
    if (daySel) daySel.value = 'all';
    if (produceSel) produceSel.value = 'all';
    if (resultsEl) resultsEl.innerHTML = '';
    if (statusEl) statusEl.textContent = '';
    lastHits = [];
  });
  if (queryInput) queryInput.addEventListener('input', function () {
    requestLocation(); runQuickFind();
  });
  [areaSel, daySel, produceSel].forEach(function (sel) {
    if (!sel) return;
    sel.addEventListener('change', function () { requestLocation(); runQuickFind(); });
  });

  
  var track = document.getElementById('hfHighlights');
  var dotsEl = document.getElementById('hfDots');
  var prevBtn = document.getElementById('hfPrev');
  var nextBtn = document.getElementById('hfNext');
  var slides = [];
  var current = 0;
  var timer = null;
  var paused = false;

  var cityCentre = (function () {
    var lat = 0, lng = 0;
    markets.forEach(function (m) { lat += m.lat; lng += m.lng; });
    return { lat: lat / markets.length, lng: lng / markets.length };
  })();

  function buildSlides() {
    var out = [], seen = {};
    var today = DATA.DAYS[new Date().getDay()];
    function add(s) {
      if (seen[s.title]) return;
      seen[s.title] = true;
      out.push(s);
    }

    markets.filter(isOpenNow).slice(0, 1).forEach(function (m) {
      add({ badge: 'Open now', title: m.name, meta: m.area + ' · until ' + formatTime(m.close) + ' today', image: m.image, href: mapsUrl(m), external: true });
    });
    markets.slice().sort(function (a, b) { return haversine(cityCentre, a) - haversine(cityCentre, b); })
      .slice(0, 3).forEach(function (m) {
        add({ badge: 'Nearby', title: m.name, meta: formatDistance(haversine(cityCentre, m)) + ' away · ' + dayLabels(m) + ' · ' + hoursLabel(m), image: m.image, href: mapsUrl(m), external: true });
      });
    var todayMarkets = markets.filter(function (m) { return m.days.indexOf(today) !== -1; });
    if (todayMarkets.length) {
      add({ badge: 'Today · ' + (SHORT_DAY[today] || today), title: todayMarkets.length + (todayMarkets.length === 1 ? ' market' : ' markets') + ' trading', meta: todayMarkets.map(function (m) { return m.area; }).join(' · '), image: todayMarkets[0].image, href: 'marketfind.html', external: false });
    }
    var season = currentSeason();
    season.produce.forEach(function (item) {
      if (out.length >= 6) return;
      var sellers = marketsWith(item);
      if (!sellers.length) return;
      var m = sellers[0];
      add({ badge: 'In season · ' + season.name, title: item, meta: sellers.length > 1 ? 'At ' + sellers.length + ' markets · nearest is ' + m.area : 'At ' + m.name + ' · ' + m.area, image: m.image, href: mapsUrl(m), external: true });
    });
    return out;
  }

  function renderSlides() {
    if (!track) return;
    track.innerHTML = slides.map(function (s, i) {
      return '<a class="home-highlight' + (i === 0 ? ' is-active' : '') + '" ' +
        'style="background-image:url(&quot;' + escapeHtml(s.image) + '&quot;)" ' +
        'href="' + escapeHtml(s.href) + '"' +
        (s.external ? ' target="_blank" rel="noopener noreferrer"' : '') +
        ' aria-hidden="' + (i === 0 ? 'false' : 'true') + '" ' +
        'tabindex="' + (i === 0 ? '0' : '-1') + '">' +
        '<span class="home-highlight-badge">' + escapeHtml(s.badge) + '</span>' +
        '<h3 class="home-highlight-title">' + escapeHtml(s.title) + '</h3>' +
        '<p class="home-highlight-meta">' + escapeHtml(s.meta) + '</p></a>';
    }).join('');
    if (dotsEl) {
      dotsEl.innerHTML = slides.map(function (s, i) {
        return '<button class="home-highlights-dot' + (i === 0 ? ' is-active' : '') + '" type="button" data-index="' + i + '" aria-label="Show highlight ' + (i + 1) + '"></button>';
      }).join('');
    }
  }

  function show(i) {
    if (!slides.length || !track) return;
    current = (i + slides.length) % slides.length;
    Array.prototype.forEach.call(track.children, function (el, idx) {
      var on = idx === current;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
      el.setAttribute('tabindex', on ? '0' : '-1');
    });
    if (dotsEl) {
      Array.prototype.forEach.call(dotsEl.children, function (el, idx) {
        el.classList.toggle('is-active', idx === current);
      });
    }
  }

  function startRotation() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || slides.length < 2 || timer) return;
    timer = setInterval(function () {
      if (!paused && !document.hidden) show(current + 1);
    }, ROTATE_MS);
  }

  if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1); startRotation(); });
  if (prevBtn) prevBtn.addEventListener('click', function () { show(current - 1); startRotation(); });
  if (dotsEl) dotsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.home-highlights-dot');
    if (!btn) return;
    show(parseInt(btn.getAttribute('data-index'), 10));
    startRotation();
  });

  rail.addEventListener('mouseenter', function () { paused = true; });
  rail.addEventListener('mouseleave', function () { paused = false; });

  
  var clockEl = document.getElementById('hfClock');
  if (clockEl) {
    var tick = function () {
      clockEl.textContent = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(new Date());
    };
    tick();
    setInterval(tick, 1000);
  }

  
  var visitorEl = document.getElementById('hfVisitor');
  if (visitorEl) visitorEl.textContent = markets.length.toLocaleString();

  
  var openEl = document.getElementById('hfOpenNow');
  var refreshOpen;
  if (openEl) {
    refreshOpen = function () {
      var n = markets.filter(isOpenNow).length;
      openEl.textContent = n + (n === 1 ? ' market open now' : ' markets open now');
    };
    refreshOpen();
    setInterval(refreshOpen, 60000);
  }

  
  slides = buildSlides();
  renderSlides();
  show(0);
  startRotation();

  loadSeasonProduce().then(function () {
    slides = buildSlides();
    renderSlides();
    show(current);
    startRotation();
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && refreshOpen) refreshOpen();
  });


  

  function setupReveals() {
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach(function (el) { revealIO.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }

    var counters = document.querySelectorAll('[data-count]');
    function animateCount(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var duration = 1400;
      var start = performance.now();
      function tick(now) {
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      }
      requestAnimationFrame(tick);
    }
    if ('IntersectionObserver' in window && counters.length) {
      var countIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { countIO.observe(el); });
    } else {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
    }

    var yearEl = document.getElementById('hfYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  setupReveals();

  console.log('? Home extras loaded');

})();


