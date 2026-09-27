(function () {
  'use strict';

  document.documentElement.className = document.documentElement.className.replace(/\bno-js\b/g, '') + ' js-enabled';

  
  var revealElements = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -60px 0px' });
    revealElements.forEach(function(el){ revealObserver.observe(el); });
  } else {
    revealElements.forEach(function(el){ el.classList.add('is-visible'); });
  }

  
  var DATA = window.FRESHFIND_MARKET_DATA || { DAYS:[], WEEK_ORDER:[], SHORT_DAY:{}, markets:[] };
  var DAYS = DATA.DAYS;
  var WEEK_ORDER = DATA.WEEK_ORDER;
  var SHORT_DAY = DATA.SHORT_DAY;

  var markets = DATA.markets;

  var state = { query:'', area:'all', day:'all', produce:'all', quick:'all', sort:'az', userLocation:null };

  var searchInput = document.getElementById('searchInput');
  var searchBtn = document.getElementById('searchBtn');
  var areaFilter = document.getElementById('areaFilter');
  var dayFilter = document.getElementById('dayFilter');
  var produceFilter = document.getElementById('produceFilter');
  var locateBtn = document.getElementById('locateBtn');
  var locNote = document.getElementById('locNote');
  var quickRow = document.querySelector('.quick-row');

  var marketGrid = document.getElementById('marketGrid');
  var resultCount = document.getElementById('resultCount');
  var sortSelect = document.getElementById('sortSelect');
  var emptyState = document.getElementById('emptyState');
  var resetFilters = document.getElementById('resetFilters');

  var mapEl = document.getElementById('map');
  var mapFallback = document.getElementById('mapFallback');
  var mapFallbackText = document.getElementById('mapFallbackText');

  var modal = document.getElementById('marketModal');
  var modalImage = document.getElementById('modalImage');
  var modalArea = document.getElementById('modalArea');
  var modalTitle = document.getElementById('modalTitle');
  var modalLocation = document.getElementById('modalLocation');
  var modalAddress = document.getElementById('modalAddress');
  var modalTags = document.getElementById('modalTags');
  var modalSchedule = document.getElementById('modalSchedule');
  var directionsLink = document.getElementById('directionsLink');

  var chatFab = document.getElementById('chatFab');
  var chatPanel = document.getElementById('chatPanel');
  var chatClose = document.getElementById('chatClose');
  var chatBody = document.getElementById('chatBody');
  var chatQuick = document.getElementById('chatQuick');
  var chatForm = document.getElementById('chatForm');
  var chatInput = document.getElementById('chatInput');

  function ffb(){ return window.FreshFindBookmarks || null; }
  function ffbId(m){ return 'market:find:' + m.id; }
  function findMarket(id){
    for (var i = 0; i < markets.length; i++) if (markets[i].id === id) return markets[i];
    return null;
  }
  function bookmarkEntry(m){
    return {
      id: ffbId(m), kind: 'market', title: m.name,
      meta: [m.location, formatTime(m.open) + '–' + formatTime(m.close)]
        .filter(Boolean).join(' · ')
    };
  }
  function isBookmarked(m){
    var api = ffb();
    return !!(api && m && api.has(ffbId(m)));
  }
  function repaintHearts(){
    var btns = document.querySelectorAll('.save-btn');
    for (var i = 0; i < btns.length; i++){
      var m = findMarket(btns[i].getAttribute('data-id'));
      if (!m) continue;
      var on = isBookmarked(m);
      btns[i].classList.toggle('is-saved', on);
      btns[i].setAttribute('aria-pressed', String(on));
      btns[i].textContent = on ? '♥' : '♡';
      btns[i].setAttribute('aria-label', (on ? 'Remove bookmark for ' : 'Bookmark ') + m.name);
    }
  }
  document.addEventListener('freshfind:bookmarks:change', repaintHearts);

  function toMinutes(v){ var p = v.split(':'); return parseInt(p[0],10)*60 + parseInt(p[1],10); }
  function formatTime(v){
    var p = v.split(':'), h = parseInt(p[0],10), m = p[1];
    var suf = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + m + ' ' + suf;
  }
  function isOpenNow(m){
    var now = new Date();
    var today = DAYS[now.getDay()];
    if (m.days.indexOf(today) === -1) return false;
    var mins = now.getHours()*60 + now.getMinutes();
    return mins >= toMinutes(m.open) && mins < toMinutes(m.close);
  }
  function isWeekendMarket(m){
    return m.days.indexOf('Saturday') !== -1 || m.days.indexOf('Sunday') !== -1;
  }
  function haversine(a,b){
    var R = 6371, toRad = function(d){ return d*Math.PI/180; };
    var dLat = toRad(b.lat-a.lat), dLng = toRad(b.lng-a.lng);
    var h = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*
            Math.sin(dLng/2)*Math.sin(dLng/2);
    return 2*R*Math.asin(Math.sqrt(h));
  }
  function formatDistance(km){
    return km < 1 ? Math.round(km*1000) + ' m away' : km.toFixed(1) + ' km away';
  }
  function matchesQuery(m, q){
    if (!q) return true;
    var hay = [m.name,m.area,m.location,m.address,m.produce.join(' '),m.items.join(' ')].join(' ').toLowerCase();
    return q.toLowerCase().split(/\s+/).every(function(t){ return t.length === 0 || hay.indexOf(t) !== -1; });
  }

  function getFilteredMarkets(){
    var list = markets.filter(function(m){
      if (state.area !== 'all' && m.area !== state.area) return false;
      if (state.day !== 'all' && m.days.indexOf(state.day) === -1) return false;
      if (state.produce !== 'all' && m.produce.indexOf(state.produce) === -1) return false;
      if (state.quick === 'open' && !isOpenNow(m)) return false;
      if (state.quick === 'weekend' && !isWeekendMarket(m)) return false;
      return matchesQuery(m, state.query);
    });
    return sortMarkets(list);
  }

  function sortMarkets(list){
    var copy = list.slice();
    if (state.sort === 'open') {
      copy.sort(function(a,b){
        var ao = isOpenNow(a) ? 0 : 1, bo = isOpenNow(b) ? 0 : 1;
        return ao - bo || a.name.localeCompare(b.name);
      });
    } else if (state.sort === 'nearest' && state.userLocation) {
      copy.sort(function(a,b){ return haversine(state.userLocation,a) - haversine(state.userLocation,b); });
    } else {
      copy.sort(function(a,b){ return a.name.localeCompare(b.name); });
    }
    return copy;
  }

  function createMarketCard(m, i){
    var open = isOpenNow(m);
    var saved = isBookmarked(m);
    var distance = '';
    if (state.userLocation) {
      distance = '<span class="distance">' + formatDistance(haversine(state.userLocation,m)) + '</span>';
    }
    var dayLabels = m.days.map(function(d){ return SHORT_DAY[d]; }).join(' · ');
    var tags = m.produce.slice(0,3).map(function(t){ return '<li class="tag">' + t + '</li>'; }).join('');

    return '' +
      '<article class="market-card" style="--i:' + i + '">' +
        '<div class="mc-image">' +
          '<img src="' + m.image + '" alt="' + m.name + ' market photo" loading="lazy" decoding="async" onerror="this.remove()">' +
          '<span class="mc-area-chip">' + m.area + '</span>' +
        '</div>' +
        '<div class="mc-content">' +
          '<div class="mc-head">' +
            '<div><h3>' + m.name + '</h3><p class="mc-loc">' + m.location + '</p></div>' +
            '<button class="save-btn' + (saved ? ' is-saved' : '') + '" type="button"' +
              ' data-id="' + m.id + '" aria-pressed="' + saved + '"' +
              ' aria-label="' + (saved ? 'Remove' : 'Save') + ' ' + m.name + '">' +
              (saved ? '♥' : '♡') +
            '</button>' +
          '</div>' +
          '<div class="mc-meta">' +
            '<span class="status ' + (open ? 'is-open' : 'is-closed') + '">' +
              (open ? 'Open now' : 'Closed') +
            '</span>' +
            '<span class="mc-hours">' + formatTime(m.open) + '–' + formatTime(m.close) + '</span>' +
          '</div>' +
          '<p class="mc-days">' + dayLabels + '</p>' +
          '<ul class="tags">' + tags + '</ul>' +
          '<div class="mc-foot">' +
            '<button class="btn btn-primary btn-sm" type="button" data-view="' + m.id + '">View</button>' +
            distance +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderMarkets(list){
    if (!marketGrid) return;
    marketGrid.innerHTML = list.map(createMarketCard).join('');
    marketGrid.hidden = list.length === 0;
    if (emptyState) emptyState.hidden = list.length !== 0;
    if (resultCount) {
      resultCount.innerHTML = (list.length === 1 ? '1 market' : list.length + ' markets') +
        '<small>Demo data — sample markets for illustration</small>';
    }
  }

  function render(){
    var list = getFilteredMarkets();
    renderMarkets(list);
    updateMap(list);
  }

  var map = null, markers = [], userMarker = null;
  var mapsReady = false, mapTimer = null;

  function setMapFallback(msg){ if (mapFallbackText) mapFallbackText.textContent = msg; if (mapFallback) mapFallback.hidden = false; }

  function popupHtml(m){
    return '<div class="freshfind-popup">' +
      '<strong>' + m.name + '</strong>' +
      '<span>' + m.location + '</span>' +
      '<button type="button" class="iw-btn" data-view="' + m.id + '">View details</button>' +
    '</div>';
  }

  function initFreshFindMap(){
    if (typeof L === 'undefined') {
      setMapFallback('The map could not load right now. All markets are still listed below.');
      return;
    }
    if (mapTimer) clearTimeout(mapTimer);

    map = L.map(mapEl, {
      center: [24.86, 67.06],
      zoom: 11,
      scrollWheelZoom: false,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapsReady = true;
    if (mapFallback) mapFallback.hidden = true;

    if (state.userLocation) placeUserMarker(state.userLocation);
    updateMap(getFilteredMarkets());

    setTimeout(function(){ map.invalidateSize(); }, 240);
    window.addEventListener('resize', function(){ map.invalidateSize(); });
  }
  window.initFreshFindMap = initFreshFindMap;

  function updateMap(list){
    if (!mapsReady || !map) return;

    markers.forEach(function(mk){ map.removeLayer(mk); });
    markers = [];
    if (!list.length) return;

    var bounds = [];

    list.forEach(function(m){
      var marker = L.marker([m.lat, m.lng], { title: m.name, riseOnHover: true }).addTo(map);

      marker.bindPopup(popupHtml(m), { minWidth: 210, maxWidth: 260, closeButton: true });

      marker.on('popupopen', function(e){
        var node = e.popup.getElement();
        var btn = node ? node.querySelector('.iw-btn') : null;
        if (btn) {
          btn.addEventListener('click', function(){
            openMarketModal(btn.getAttribute('data-view'));
            map.closePopup();
          });
        }
      });

      markers.push(marker);
      bounds.push([m.lat, m.lng]);
    });

    if (list.length === 1) {
      map.setView(bounds[0], 14);
    } else {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }

  function placeUserMarker(loc){
    if (!mapsReady || !map) return;
    if (userMarker) map.removeLayer(userMarker);

    userMarker = L.marker([loc.lat, loc.lng], {
      title: 'You are here',
      icon: L.divIcon({
        className: 'freshfind-user-dot',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      })
    }).addTo(map).bindPopup('You are here');
  }

  function loadLeaflet(){
    if (typeof L !== 'undefined') { initFreshFindMap(); return; }

    mapTimer = setTimeout(function(){
      if (!mapsReady) setMapFallback('The map is taking too long to load. All markets are still listed below.');
    }, 9000);

    if (!document.querySelector('link[data-leaflet]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      css.setAttribute('data-leaflet', '');
      document.head.appendChild(css);
    }

    var script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = initFreshFindMap;
    script.onerror = function(){
      if (mapTimer) clearTimeout(mapTimer);
      setMapFallback('The map could not load right now. All markets are still listed below.');
    };
    document.head.appendChild(script);
  }

  function useMyLocation(){
    if (!navigator.geolocation) {
      locNote.textContent = 'This browser does not support location services.';
      return;
    }
    locNote.textContent = 'Getting your location…';
    locateBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      function(pos){
        locateBtn.disabled = false;
        state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        locNote.textContent = 'Location found — showing the markets nearest to you.';
        state.sort = 'nearest'; sortSelect.value = 'nearest';
        placeUserMarker(state.userLocation);
        if (mapsReady && map) map.setView([state.userLocation.lat, state.userLocation.lng], 12);
        render();
      },
      function(err){
        locateBtn.disabled = false;
        locNote.textContent = err.code === 1
          ? 'Location permission denied — you can still search by area below.'
          : 'We could not get your location right now. Try searching by area instead.';
      },
      { enableHighAccuracy:false, timeout:8000, maximumAge:600000 }
    );
  }

  var lastFocused = null;

  function openMarketModal(id){
    var m = markets.find(function(x){ return x.id === id; });
    if (!m) return;
    lastFocused = document.activeElement;

    modalImage.src = m.image;
    modalImage.alt = m.name + ' market photo';
    modalArea.textContent = m.area;
    modalTitle.textContent = m.name;
    modalLocation.textContent = m.location;
    modalAddress.textContent = m.address;

    modalTags.innerHTML = m.produce.map(function(t){ return '<li class="tag">' + t + '</li>'; }).join('');

    modalSchedule.innerHTML = WEEK_ORDER.map(function(d){
      var openToday = m.days.indexOf(d) !== -1;
      return '<li class="' + (openToday ? 'is-open' : '') + '">' +
        '<span>' + d + '</span>' +
        '<span>' + (openToday ? formatTime(m.open) + ' – ' + formatTime(m.close) : 'Closed') + '</span>' +
      '</li>';
    }).join('');

    directionsLink.href = 'https://www.google.com/maps/dir/?api=1&destination=' + m.lat + ',' + m.lng;

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var cb = modal.querySelector('.modal-close');
    if (cb) cb.focus();
  }

  function closeMarketModal(){
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function toggleSave(id, button){
    var m = findMarket(id);
    var api = ffb();
    if (m && api){
      if (api.has(ffbId(m))) api.remove(ffbId(m));
      else api.add(bookmarkEntry(m));
    }
    repaintHearts();
  }

  var searchDebounce = null;

  if (searchInput) {
    searchInput.addEventListener('input', function(){
      if (searchDebounce) clearTimeout(searchDebounce);
      searchDebounce = setTimeout(function(){
        state.query = searchInput.value.trim(); render();
      }, 220);
    });
    searchInput.addEventListener('keydown', function(e){
      if (e.key === 'Enter') {
        e.preventDefault();
        if (searchDebounce) clearTimeout(searchDebounce);
        state.query = searchInput.value.trim(); render();
      }
    });
  }
  if (searchBtn) searchBtn.addEventListener('click', function(){
    if (searchDebounce) clearTimeout(searchDebounce);
    state.query = searchInput.value.trim(); render();
  });
  if (areaFilter) areaFilter.addEventListener('change', function(){ state.area = areaFilter.value; render(); });
  if (dayFilter) dayFilter.addEventListener('change', function(){ state.day = dayFilter.value; render(); });
  if (produceFilter) produceFilter.addEventListener('change', function(){ state.produce = produceFilter.value; render(); });
  if (sortSelect) sortSelect.addEventListener('change', function(){
    state.sort = sortSelect.value;
    if (state.sort === 'nearest' && !state.userLocation) {
      locNote.textContent = 'Allow location access to sort markets by distance.';
    }
    render();
  });
  if (locateBtn) locateBtn.addEventListener('click', useMyLocation);

  if (quickRow) quickRow.addEventListener('click', function(e){
    var pill = e.target.closest('.pill');
    if (!pill) return;
    state.quick = pill.getAttribute('data-quick');
    Array.prototype.forEach.call(quickRow.querySelectorAll('.pill'), function(item){
      item.classList.toggle('is-active', item === pill);
    });
    render();
  });

  if (resetFilters) resetFilters.addEventListener('click', function(){
    state.query = ''; state.area = 'all'; state.day = 'all';
    state.produce = 'all'; state.quick = 'all'; state.sort = 'az';
    searchInput.value = ''; areaFilter.value = 'all';
    dayFilter.value = 'all'; produceFilter.value = 'all';
    sortSelect.value = 'az'; locNote.textContent = '';
    Array.prototype.forEach.call(quickRow.querySelectorAll('.pill'), function(pill){
      pill.classList.toggle('is-active', pill.getAttribute('data-quick') === 'all');
    });
    render();
  });

  if (marketGrid) marketGrid.addEventListener('click', function(e){
    var sb = e.target.closest('.save-btn');
    if (sb) { toggleSave(sb.getAttribute('data-id'), sb); return; }
    var vb = e.target.closest('[data-view]');
    if (vb) openMarketModal(vb.getAttribute('data-view'));
  });

  if (modal) modal.addEventListener('click', function(e){
    if (e.target.closest('[data-close]')) closeMarketModal();
  });

  var botRules = [
    { test:/(^|\b)(hi|hello|hey|salam|assalam|good morning|good evening)\b/i,
      reply:"Hello! Ask me about markets, seasonal produce, opening times or anything else about FreshFind." },
    { test:/(what.{0,12}(is|does).{0,12}freshfind|about freshfind|who are you|what are you)/i,
      reply:"FreshFind helps you discover farmers markets and seasonal produce in one place. Search by area, day or produce, check opening times and save the markets you like." },
    { test:/(season|in season|seasonal|spring|summer|autumn|winter)/i,
      reply:"Seasonal highlights include strawberries in spring, mangoes in summer, apples in autumn and oranges in winter." },
    { test:/(open|opening|hours|closing|close|timing|what time)/i,
      reply:"Each market card shows its opening hours and operating days. Markets marked 'Open now' are trading at this moment, and you can sort by 'Open first' to see them at the top." },
    { test:/(save|saved|favourite|favorite|bookmark)/i,
      reply:"Tap the 🔖 on any market, produce guide entry or seasonal pick to save it. Your bookmarks are kept in one list where you can add a personal note, export the list as text, and share it on social." },
    { test:/(contact|email|reach|get in touch|phone)/i,
      reply:"You can reach FreshFind at hello@freshfind.example." },
    { test:/(find|near me|nearby|where|location|map|direction|market|markets|stall)/i,
      reply:"Use the Find a Market section to search by area, day or produce. You can also use the map, or tap 'Use my location' to sort markets by distance." },
    { test:/(produce|fruit|vegetable|egg|honey|herb|organic|dairy|bakery|bread|cheese|milk)/i,
      reply:"FreshFind includes fruits, vegetables, eggs, honey, herbs, organic produce, dairy and bakery. Use the produce filter in the Find a Market section to narrow things down." },
    { test:/(thank|thanks|cheers|great|nice)/i,
      reply:"Happy to help! Enjoy the market." }
  ];
  var BOT_FALLBACK = "I can help with markets, seasonal produce, opening times, market locations and FreshFind.";

  function getBotAnswer(msg){
    for (var i = 0; i < botRules.length; i++) if (botRules[i].test.test(msg)) return botRules[i].reply;
    return BOT_FALLBACK;
  }
  function addMessage(text, who){
    var b = document.createElement('div');
    b.className = 'msg ' + who;
    b.textContent = text;
    chatBody.appendChild(b);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  function sendChatMessage(text){
    var message = text.trim();
    if (!message) return;
    addMessage(message, 'user');
    chatInput.value = '';
    setTimeout(function(){ addMessage(getBotAnswer(message), 'bot'); }, 420);
  }
  function openChat(){
    chatPanel.classList.add('is-open');
    chatPanel.setAttribute('aria-hidden', 'false');
    chatFab.setAttribute('aria-expanded', 'true');
    chatInput.focus();
  }
  function closeChat(){
    chatPanel.classList.remove('is-open');
    chatPanel.setAttribute('aria-hidden', 'true');
    chatFab.setAttribute('aria-expanded', 'false');
  }
  if (chatFab) chatFab.addEventListener('click', function(){
    if (chatPanel.classList.contains('is-open')) closeChat(); else openChat();
  });
  if (chatClose) chatClose.addEventListener('click', closeChat);
  if (chatQuick) chatQuick.addEventListener('click', function(e){
    var btn = e.target.closest('button');
    if (btn) sendChatMessage(btn.textContent);
  });
  if (chatForm) chatForm.addEventListener('submit', function(e){
    e.preventDefault();
    sendChatMessage(chatInput.value);
  });

  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    if (modal && modal.classList.contains('is-open')) closeMarketModal();
    if (chatPanel && chatPanel.classList.contains('is-open')) closeChat();
  });

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  render();
  loadLeaflet();

})();
