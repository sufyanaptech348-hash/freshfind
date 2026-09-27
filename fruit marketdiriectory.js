

const TEXT = document.querySelector('.text');
const BTN  = document.getElementById('replay');

function split(el) {
  const raw = el.textContent;
  el.textContent = '';
  const chars = [];
  const tokens = raw.split(/(\s+)/);

  tokens.forEach(token => {
    if (!token) return;
    if (/^\s+$/.test(token)) {
      for (const ch of token) {
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        el.appendChild(s);
        chars.push(s);
      }
    } else {
      const word = document.createElement('span');
      word.className = 'word';
      for (const ch of token) {
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        word.appendChild(s);
        chars.push(s);
      }
      el.appendChild(word);
    }
  });
  return chars;
}

function run(fn){ fn(); BTN.onclick = fn; }

function spring(s, target, k = 0.08, d = 0.72) {
  s.vel += (target - s.pos) * k;
  s.vel *= d;
  s.pos += s.vel;
  return Math.abs(s.vel) + Math.abs(target - s.pos) < 0.05;
}

let _raf = null, _cleanup = () => {};
function loop(onTick, cleanup = () => {}) {
  cancelAnimationFrame(_raf);
  _cleanup(); _cleanup = cleanup;
  function tick() { if (!onTick()) _raf = requestAnimationFrame(tick); }
  _raf = requestAnimationFrame(tick);
}

function center_burst() {
  const chars = split(TEXT);
  const textRect = TEXT.getBoundingClientRect();
  const cx = textRect.left + textRect.width / 2;
  const offsets = chars.map(ch => {
    const r = ch.getBoundingClientRect();
    return (r.left + r.width / 2) - cx;
  });
  const xst = chars.map((_, i) => ({ pos: -offsets[i], vel: 0 }));
  const yst = chars.map(() => ({ pos: (Math.random() - 0.5) * 40, vel: 0 }));
  const ops = chars.map(() => ({ pos: 0, vel: 0 }));
  loop(() => chars.every((ch, i) => {
    const xd = spring(xst[i], 0, 0.07, 0.70);
    const yd = spring(yst[i], 0, 0.09, 0.68);
    spring(ops[i], 1, 0.08, 0.74);
    ch.style.transform = `translate(${xst[i].pos}px, ${yst[i].pos}px)`;
    ch.style.opacity   = ops[i].pos;
    return xd && yd;
  }));
}

run(center_burst);

const markets=[
{id:1,name:'Orchard Lane Fruit Market',area:'Clifton',days:['Friday','Saturday','Sunday'],hours:'8:00 AM – 5:00 PM',type:'fruit',distance:2.4,emoji:'🍎',image:'fruit%20img/orchad%20grove.jpg',description:'Seasonal fruit, citrus, berries, and orchard-fresh harvests.',
 address:'12 Orchard Lane, Block 5, Clifton',phone:'+92 300 1234567',rating:4.8,established:2012,products:['Apples','Oranges','Strawberries','Grapes','Lemons']},
{id:2,name:'Green Basket Vegetable Market',area:'Gulshan',days:['Tuesday','Thursday','Saturday'],hours:'7:00 AM – 4:00 PM',type:'vegetable',distance:4.1,emoji:'🥬',image:'https://placehold.co/600x400/416b45/ffffff?text=Green+Basket',description:'Fresh leafy greens, seasonal vegetables, herbs, and farm produce.',
 address:'45 Green Avenue, Block 6, Gulshan-e-Iqbal',phone:'+92 301 2345678',rating:4.6,established:2009,products:['Spinach','Tomatoes','Coriander','Potatoes','Cucumbers']},
{id:3,name:'Golden Meadow Dairy Market',area:'DHA',days:['Wednesday','Friday','Sunday'],hours:'9:00 AM – 6:00 PM',type:'dairy',distance:5.2,emoji:'🥛',image:'https://placehold.co/600x400/416b45/ffffff?text=Golden+Meadow',description:'Fresh milk, yogurt, butter, and locally produced dairy goods.',
 address:'7 Meadow Road, Phase 5, DHA',phone:'+92 302 3456789',rating:4.9,established:2015,products:['Fresh Milk','Yogurt','Butter','Cream','Cheese']},
{id:4,name:'Harvest Corner Farm Stand',area:'North Nazimabad',days:['Monday','Saturday'],hours:'8:00 AM – 3:00 PM',type:'vegetable',distance:7.3,emoji:'🥕',image:'https://placehold.co/600x400/416b45/ffffff?text=Harvest+Corner',description:'Farm-grown vegetables and naturally cultivated seasonal produce.',
 address:'88 Harvest Street, Block H, North Nazimabad',phone:'+92 303 4567890',rating:4.4,established:2011,products:['Carrots','Onions','Peas','Beetroot','Pumpkin']},
{id:5,name:'Fresh Orchard Collective',area:'PECHS',days:['Thursday','Friday','Saturday'],hours:'8:30 AM – 5:30 PM',type:'fruit',distance:6.7,emoji:'🍊',image:'fruit%20img/fresh.png',description:'Hand-picked seasonal fruits from local growers.',
 address:'23 Orchard Plaza, Block 2, PECHS',phone:'+92 304 5678901',rating:4.7,established:2016,products:['Mangoes','Kiwis','Peaches','Plums','Berries']},
{id:6,name:'Pure Pasture Dairy Hub',area:'Bahadurabad',days:['Tuesday','Sunday'],hours:'8:00 AM – 2:00 PM',type:'dairy',distance:3.8,emoji:'🧀',image:'https://placehold.co/600x400/416b45/ffffff?text=Pure+Pasture',description:'Farm-fresh dairy products with simple, trusted ingredients.',
 address:'5 Pasture Lane, Bahadurabad',phone:'+92 305 6789012',rating:4.5,established:2013,products:['Milk','Paneer','Ghee','Yogurt','Lassi']},
{id:7,name:'Sunrise Berry Farm Stall',area:'Saddar',days:['Monday','Wednesday','Friday'],hours:'7:30 AM – 4:30 PM',type:'fruit',distance:1.9,emoji:'🍓',image:'fruit%20img/sunrise%20barry.jpg',description:'Sweet berries, stone fruit, and small-batch jams made on the farm.',
 address:'19 Sunrise Road, Saddar',phone:'+92 306 7890123',rating:4.8,established:2018,products:['Strawberries','Blueberries','Raspberries','Jam','Cherries']},
{id:8,name:'Root & Leaf Vegetable Yard',area:'F.B. Area',days:['Monday','Tuesday','Thursday','Saturday'],hours:'6:30 AM – 3:30 PM',type:'vegetable',distance:8.5,emoji:'🥦',image:'https://placehold.co/600x400/416b45/ffffff?text=Root+%26+Leaf',description:'Crisp greens, root vegetables, and chemical-free produce delivered daily.',
 address:'60 Root Street, Block 4, F.B. Area',phone:'+92 307 8901234',rating:4.3,established:2008,products:['Broccoli','Cauliflower','Lettuce','Radish','Kale']},
{id:9,name:'Clover Dairy Barn',area:'Malir',days:['Wednesday','Saturday','Sunday'],hours:'9:00 AM – 7:00 PM',type:'dairy',distance:11.2,emoji:'🐄',image:'https://placehold.co/600x400/416b45/ffffff?text=Clover+Dairy',description:'Grass-fed milk, cream, and handmade cheeses from a family dairy.',
 address:'101 Clover Road, Malir Cantt',phone:'+92 308 9012345',rating:4.7,established:2014,products:['Milk','Cream','Cheddar','Mozzarella','Butter']},
{id:10,name:'Mango Grove Market',area:'Korangi',days:['Friday','Saturday','Sunday'],hours:'9:00 AM – 6:00 PM',type:'fruit',distance:9.4,emoji:'🥭',image:'fruit%20img/mango%20grove.jpg',description:'Peak-season mangoes, guavas, and tropical fruit straight from the grove.',
 address:'14 Mango Grove, Korangi No. 5',phone:'+92 309 0123456',rating:4.9,established:2017,products:['Sindhri Mangoes','Chaunsa','Guavas','Papaya','Bananas']},
{id:11,name:'Terra Verde Farmers Market',area:'Scheme 33',days:['Sunday'],hours:'7:00 AM – 1:00 PM',type:'vegetable',distance:12.8,emoji:'🌽',image:'https://placehold.co/600x400/416b45/ffffff?text=Terra+Verde',description:'Weekly market with sweet corn, squash, tomatoes, and artisan growers.',
 address:'3 Terra Verde Lane, Scheme 33',phone:'+92 310 1234567',rating:4.6,established:2019,products:['Sweet Corn','Squash','Tomatoes','Zucchini','Peppers']},
{id:12,name:'Willow Creek Creamery',area:'Garden East',days:['Monday','Thursday'],hours:'10:00 AM – 6:00 PM',type:'dairy',distance:5.9,emoji:'🧈',image:'https://placehold.co/600x400/416b45/ffffff?text=Willow+Creek',description:'Small-batch butter, yogurt, and fresh paneer made every morning.',
 address:'27 Willow Creek, Garden East',phone:'+92 311 2345678',rating:4.8,established:2020,products:['Butter','Yogurt','Paneer','Cream Cheese','Kefir']},
{id:13,name:'Vine & Stone Fruit Stand',area:'Tariq Road',days:['Tuesday','Friday','Saturday'],hours:'8:00 AM – 5:00 PM',type:'fruit',distance:4.6,emoji:'🍇',image:'fruit%20img/wine%20and%20stone.jpg',description:'Grapes, figs, pomegranates, and dried fruit from local vineyards.',
 address:'52 Vine Street, Tariq Road',phone:'+92 312 3456789',rating:4.5,established:2010,products:['Grapes','Figs','Pomegranates','Dates','Dried Apricots']},
{id:14,name:'Blue Hen Poultry & Dairy',area:'Nazimabad',days:['Monday','Wednesday','Sunday'],hours:'8:00 AM – 4:00 PM',type:'dairy',distance:6.3,emoji:'🥚',image:'https://placehold.co/600x400/416b45/ffffff?text=Blue+Hen',description:'Free-range eggs, fresh milk, and farm dairy in one convenient stop.',
 address:'36 Blue Hen Lane, Block 2, Nazimabad',phone:'+92 313 4567890',rating:4.4,established:2012,products:['Free-range Eggs','Milk','Yogurt','Chicken','Butter']},
{id:15,name:'Coastal Citrus Grove',area:'Defence Phase 2',days:['Wednesday','Saturday','Sunday'],hours:'8:00 AM – 6:00 PM',type:'fruit',distance:8.1,emoji:'🍋',image:'fruit%20img/citirus%20grove.jpg',description:'Bright citrus, limes, and tropical fruit grown along the coastal belt.',
 address:'14 Coastal Road, Defence Phase 2',phone:'+92 314 5678901',rating:4.7,established:2016,products:['Limes','Grapefruit','Oranges','Lemons','Tangerines']},
{id:16,name:'Herb Haven Garden Market',area:'Clifton Block 2',days:['Tuesday','Friday','Sunday'],hours:'7:30 AM – 3:30 PM',type:'vegetable',distance:2.9,emoji:'🌿',image:'https://placehold.co/600x400/416b45/ffffff?text=Herb+Haven',description:'Fragrant herbs, microgreens, and specialty salad vegetables.',
 address:'8 Garden Court, Clifton Block 2',phone:'+92 315 6789012',rating:4.6,established:2020,products:['Basil','Mint','Rosemary','Microgreens','Arugula']},
{id:17,name:'Alpine Dairy Fresh',area:'Federal B Area',days:['Monday','Wednesday','Friday'],hours:'9:00 AM – 5:00 PM',type:'dairy',distance:7.8,emoji:'🥛',image:'https://placehold.co/600x400/416b45/ffffff?text=Alpine+Dairy',description:'Chilled alpine-style dairy with fresh milk, curd, and flavored yogurt.',
 address:'29 Alpine Street, Block 12, F.B. Area',phone:'+92 316 7890123',rating:4.8,established:2018,products:['Milk','Curd','Flavored Yogurt','Butter','Cream']},
{id:18,name:'Tropical Paradise Fruit Stand',area:'Gulistan-e-Johar',days:['Thursday','Saturday','Sunday'],hours:'8:30 AM – 5:00 PM',type:'fruit',distance:10.5,emoji:'🍍',image:'fruit%20img/tropcial.jpg',description:'Pineapples, coconuts, dragon fruit, and exotic tropical treats.',
 address:'77 Paradise Lane, Block 15, Gulistan-e-Johar',phone:'+92 317 8901234',rating:4.5,established:2021,products:['Pineapples','Coconuts','Dragon Fruit','Lychees','Passion Fruit']},
{id:19,name:'Organic Roots Vegetable Farm',area:'Shah Faisal',days:['Monday','Thursday','Saturday'],hours:'6:30 AM – 2:30 PM',type:'vegetable',distance:9.9,emoji:'🥔',image:'https://placehold.co/600x400/416b45/ffffff?text=Organic+Roots',description:'Certified organic vegetables grown without pesticides or chemicals.',
 address:'5 Organic Way, Block 3, Shah Faisal Colony',phone:'+92 318 9012345',rating:4.7,established:2015,products:['Sweet Potatoes','Turnips','Ginger','Garlic','Green Beans']},
{id:20,name:'Morning Fresh Dairy Co-op',area:'Landhi',days:['Tuesday','Wednesday','Sunday'],hours:'7:00 AM – 4:00 PM',type:'dairy',distance:13.4,emoji:'🧀',image:'https://placehold.co/600x400/416b45/ffffff?text=Morning+Fresh',description:'A farmer-owned co-op offering fresh dairy at fair prices every morning.',
 address:'110 Co-op Road, Landhi No. 6',phone:'+92 319 0123456',rating:4.6,established:2013,products:['Milk','Yogurt','Cheese','Butter','Cottage Cheese']},
{id:21,name:'Whispering Pines Berry Farm',area:'DHA Phase 6',days:['Monday','Wednesday','Saturday'],hours:'8:00 AM – 4:00 PM',type:'fruit',distance:7.1,emoji:'🫐',image:'fruit%20img/whispring.jpg',description:'Woodland berries picked fresh daily, including rare varieties from the pines.',
 address:'18 Pine Trail, DHA Phase 6',phone:'+92 320 1234567',rating:4.9,established:2019,products:['Blackberries','Gooseberries','Mulberries','Currants','Elderberries']},
{id:22,name:'Highland Creamery & Cheese',area:'Clifton Block 9',days:['Tuesday','Friday','Sunday'],hours:'9:30 AM – 5:30 PM',type:'dairy',distance:3.2,emoji:'🧀',image:'https://placehold.co/600x400/416b45/ffffff?text=Highland+Creamery',description:'Artisan cheeses and creamery treats handcrafted from highland pasture milk.',
 address:'22 Highland Terrace, Clifton Block 9',phone:'+92 321 2345678',rating:4.8,established:2021,products:['Feta','Ricotta','Halloumi','Buttermilk','Heavy Cream']}
];

const productEmoji = {
  'Apples':'🍎','Oranges':'🍊','Strawberries':'🍓','Grapes':'🍇','Lemons':'🍋',
  'Spinach':'🥬','Tomatoes':'🍅','Coriander':'🌿','Potatoes':'🥔','Cucumbers':'🥒',
  'Fresh Milk':'🥛','Yogurt':'🥣','Butter':'🧈','Cream':'🍶','Cheese':'🧀',
  'Carrots':'🥕','Onions':'🧅','Peas':'🫛','Beetroot':'🫒','Pumpkin':'🎃',
  'Mangoes':'🥭','Kiwis':'🥝','Peaches':'🍑','Plums':'🍑','Berries':'🫐',
  'Milk':'🥛','Paneer':'🧀','Ghee':'🧈','Lassi':'🥛',
  'Blueberries':'🫐','Raspberries':'🍓','Jam':'🍯','Cherries':'🍒',
  'Broccoli':'🥦','Cauliflower':'🥦','Lettuce':'🥬','Radish':'🥕','Kale':'🥬',
  'Cheddar':'🧀','Mozzarella':'🧀',
  'Sindhri Mangoes':'🥭','Chaunsa':'🥭','Guavas':'🍈','Papaya':'🍈','Bananas':'🍌',
  'Sweet Corn':'🌽','Squash':'🎃','Zucchini':'🥒','Peppers':'🌶️',
  'Cream Cheese':'🧀','Kefir':'🥛',
  'Figs':'🍈','Pomegranates':'🍎','Dates':'🌴','Dried Apricots':'🍑',
  'Free-range Eggs':'🥚','Chicken':'🍗',
  'Limes':'🍋','Grapefruit':'🍊','Tangerines':'🍊',
  'Basil':'🌿','Mint':'🌿','Rosemary':'🌿','Microgreens':'🥬','Arugula':'🥬',
  'Curd':'🥣','Flavored Yogurt':'🥣',
  'Pineapples':'🍍','Coconuts':'🥥','Dragon Fruit':'🐉','Lychees':'🍒','Passion Fruit':'🍈',
  'Sweet Potatoes':'🍠','Turnips':'🥬','Ginger':'🫚','Garlic':'🧄','Green Beans':'🫛',
  'Cottage Cheese':'🧀',
  'Blackberries':'🫐','Gooseberries':'🫐','Mulberries':'🫐','Currants':'🍇','Elderberries':'🫐',
  'Feta':'🧀','Ricotta':'🧀','Halloumi':'🧀','Buttermilk':'🥛','Heavy Cream':'🍶'
};

const $ = id => document.getElementById(id);
const areaSelect = $('area');
const daySelect = $('day');
const produceSelect = $('produce');
const sortSelect = $('sort');

const params = new URLSearchParams(location.search);
const forcedProduce = params.get('type') || 'fruit';
if (['fruit','vegetable','dairy'].includes(forcedProduce)) {
  produceSelect.value = forcedProduce;
  produceSelect.disabled = true;
}

function getFilteredMarkets(ignoreArea = false) {
  return markets.filter(m => {
    if (!ignoreArea && areaSelect.value !== 'all' && m.area !== areaSelect.value) return false;
    if (daySelect.value !== 'all' && !m.days.includes(daySelect.value)) return false;
    if (produceSelect.value !== 'all' && m.type !== produceSelect.value) return false;
    return true;
  });
}

function populateAreas() {
  const current = areaSelect.value;
  const relevant = markets.filter(m => {
    if (daySelect.value !== 'all' && !m.days.includes(daySelect.value)) return false;
    if (produceSelect.value !== 'all' && m.type !== produceSelect.value) return false;
    return true;
  });
  const areas = [...new Set(relevant.map(m => m.area))].sort();
  areaSelect.innerHTML = '<option value="all">All areas</option>';
  areas.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    areaSelect.appendChild(opt);
  });
  areaSelect.value = areas.includes(current) ? current : 'all';
}

function render() {
  const list = getFilteredMarkets();
  if (sortSelect.value === 'alpha') list.sort((a,b) => a.name.localeCompare(b.name));
  if (sortSelect.value === 'proximity') list.sort((a,b) => a.distance - b.distance);
  if (sortSelect.value === 'next') list.sort((a,b) => a.days[0].localeCompare(b.days[0]));

  $('heading').textContent =
    produceSelect.value === 'all' ? 'All Markets'
    : produceSelect.value.charAt(0).toUpperCase() + produceSelect.value.slice(1) + ' Markets';
  $('count').textContent = `${list.length} market${list.length === 1 ? '' : 's'}`;

  const container = $('markets');
  if (!list.length) {
    container.innerHTML = '<div class="empty">No markets match your selected filters.</div>';
    return;
  }

  container.innerHTML = list.map(m => `
    <article class="card ${m.type}">
      <div class="thumb" data-open="${m.id}" role="button" tabindex="0" aria-label="View details for ${m.name}">
        <img src="${m.image}" alt="${m.name}" loading="lazy">
      </div>
      <div class="content">
        <span class="tag">${m.type.toUpperCase()}</span>
        <h2>${m.name}</h2>
        <div class="meta">📍 ${m.area}</div>
        <div class="meta">📅 ${m.days.join(', ')}</div>
        <div class="meta">🕒 ${m.hours}</div>
        <p>${m.description}</p>
        <button class="details" type="button" data-open="${m.id}">View market details ↗</button>
      </div>
    </article>
  `).join('');
}

const modal = $('modal');
const modalImg = $('modalImg');
const modalTag = $('modalTag');
const modalTitle = $('modalTitle');
const modalDesc = $('modalDesc');
const modalAddress = $('modalAddress');
const modalArea = $('modalArea');
const modalDistance = $('modalDistance');
const modalPhone = $('modalPhone');
const modalMapFrame = $('modalMapFrame');
const modalSchedule = $('modalSchedule');
const modalProductsGrid = $('modalProductsGrid');
const modalCall = $('modalCall');
const modalMap = $('modalMap');
let lastFocused = null;

const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function fillModal(m) {
  modalImg.src = m.image;
  modalImg.alt = m.name;
  modalTag.textContent = m.type.toUpperCase();
  modalTag.className = 'tag tag-' + m.type;
  modalTitle.textContent = m.name;
  modalDesc.textContent = m.description;
  modalAddress.textContent = m.address || '—';
  modalArea.textContent = m.area;
  modalDistance.textContent = `${m.distance.toFixed(1)} km away`;
  modalPhone.textContent = m.phone || '—';

  const mapQuery = encodeURIComponent(m.address || m.area);
  modalMapFrame.src = `https://maps.google.com/maps?q=${mapQuery}&output=embed`;

  const tbody = modalSchedule.querySelector('tbody');
  tbody.innerHTML = ALL_DAYS.map(day => {
    const isOpen = m.days.includes(day);
    return `<tr class="${isOpen ? 'open' : 'closed'}">
      <td class="day">${day}</td>
      <td class="hours">${isOpen ? m.hours : 'Closed'}</td>
    </tr>`;
  }).join('');

  modalProductsGrid.innerHTML = (m.products || []).map(p => {
    const emoji = productEmoji[p] || '🧺';
    return `<div class="product-item">
      <div class="emoji">${emoji}</div>
      <div class="name">${p}</div>
    </div>`;
  }).join('');

  const tel = (m.phone || '').replace(/[^\d+]/g, '');
  modalCall.href = tel ? `tel:${tel}` : '#';
  modalCall.style.display = tel ? '' : 'none';
  const query = encodeURIComponent(`${m.name}, ${m.address || m.area}`);
  modalMap.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function openDetail(id, push = true) {
  const m = markets.find(x => x.id === Number(id));
  if (!m) return;
  fillModal(m);
  lastFocused = document.activeElement;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  $('modal').querySelector('.modal-close').focus();
  if (push && location.hash !== `#market-${m.id}`) {
    history.pushState({ market: m.id }, '', `#market-${m.id}`);
  }
}

function closeDetail(push = true) {
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
  if (push && location.hash.startsWith('#market-')) {
    history.pushState(null, '', location.pathname + location.search);
  }
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

document.addEventListener('click', e => {
  const trigger = e.target.closest('[data-open]');
  if (trigger) {
    e.preventDefault();
    openDetail(trigger.dataset.open);
    return;
  }
  if (e.target.closest('[data-close]')) {
    e.preventDefault();
    closeDetail();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.hidden) { closeDetail(); return; }
  const trigger = e.target.closest?.('.thumb[data-open]');
  if (trigger && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    openDetail(trigger.dataset.open);
  }
});

modal.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const focusables = modal.querySelectorAll('button, a[href], iframe, [tabindex]:not([tabindex="-1"])');
  const list = [...focusables].filter(el => el.offsetParent !== null);
  if (!list.length) return;
  const first = list[0], last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

function syncFromHash() {
  const match = location.hash.match(/^#market-(\d+)$/);
  if (match) openDetail(match[1], false);
  else closeDetail(false);
}
window.addEventListener('popstate', syncFromHash);
window.addEventListener('hashchange', syncFromHash);

areaSelect.addEventListener('change', render);
daySelect.addEventListener('change', () => { populateAreas(); render(); });
produceSelect.addEventListener('change', () => { populateAreas(); render(); });
sortSelect.addEventListener('change', render);

populateAreas();
render();
syncFromHash();


