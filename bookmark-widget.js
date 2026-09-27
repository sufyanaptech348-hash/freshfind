
const FFB_ROOT=(()=>{try{
  const s=document.currentScript;if(!s||!s.src)return '';
  const seg=p=>p.replace(/^\/+|\/+$/g,'').split('/').filter(Boolean);
  const from=seg(location.pathname).slice(0,-1);
  const to=seg(new URL(s.src).pathname).slice(0,-1);
  let i=0;while(i<from.length&&i<to.length&&from[i]===to[i])i++;
  const rest=to.slice(i).join('/');
  return '../'.repeat(from.length-i)+(rest?rest+'/':'');
}catch(e){return ''}})();

(function(){
"use strict";

if(!document.getElementById('ffbStyle')){
  const link=document.createElement('link');
  link.id='ffbStyle';link.rel='stylesheet';link.href=FFB_ROOT+'bookmark-widget.css';
  document.head.appendChild(link);
}

const KEY_LIST='ffBookmarks';
const KEY_NOTES='ffBookmarkNotes';
const read=(store,key,fallback)=>{try{const raw=store.getItem(key);return raw?JSON.parse(raw):fallback}catch(e){return fallback}};
const write=(store,key,value)=>{try{store.setItem(key,JSON.stringify(value))}catch(e){}};
let items=read(localStorage,KEY_LIST,[]);
let notes=read(sessionStorage,KEY_NOTES,{});
if(!Array.isArray(items))items=[];
const saveList=()=>{write(localStorage,KEY_LIST,items)};
const saveNotes=()=>{write(sessionStorage,KEY_NOTES,notes)};
const noteFor=id=>notes[id]||'';
const setNote=(id,value)=>{const text=(value||'').trim();if(text)notes[id]=text;else delete notes[id];saveNotes()};

const KIND_LABEL={market:'Market',produce:'Produce guide',season:'Seasonal pick',page:'Page'};
const KIND_EMOJI={market:'🏪',produce:'🥕',season:'🍃',page:'🌿'};

const DESCRIPTORS=[
  {
    sel:'.card[data-open],article.card[data-open],.grid > article.card',
    kind:'market',
    id:el=>'market:'+(el.dataset.open||el.querySelector('[data-open]')?.dataset.open||text(el,'h2')),
    title:el=>text(el,'h2')||el.getAttribute('aria-label')||'Market',
    meta:el=>[...el.querySelectorAll('.meta')].map(n=>n.textContent.trim()).join(' · ')
  },
  {
    sel:'.market-card',
    kind:'market',
    id:el=>'market:find:'+(el.querySelector('[data-view]')?.dataset.view||text(el,'h3')),
    title:el=>text(el,'h3')||'Market',
    meta:el=>[text(el,'.mc-loc'),el.querySelector('.mc-hours')?.textContent.trim()].filter(Boolean).join(' · ')
  },
  {
    sel:'.catalogue-card',
    kind:'produce',
    id:el=>'produce:'+(text(el,'h3')||'').toLowerCase(),
    title:el=>text(el,'h3')||'Produce',
    meta:el=>[text(el,'.catalogue-category'),text(el,'.catalogue-season')].filter(Boolean).join(' · ')
  },
  {
    sel:'article.product-item',
    kind:'season',
    id:el=>'season:'+(text(el,'.card-content h2')||text(el,'.card-number')||'').toLowerCase(),
    title:el=>text(el,'.card-content h2')||text(el,'.card-number')||'Seasonal pick',
    meta:el=>[text(el,'.card-number'),text(el,'.card-content p')].filter(Boolean).join(' · ')
  },
  {
    sel:'.product-grid .product-item',
    kind:'produce',
    id:el=>'produce:market:'+(text(el,'.name')||'').toLowerCase(),
    title:el=>text(el,'.name')||'Produce',
    meta:()=>'Available at this market'
  },
  {
    sel:'[data-ffb-title]',
    kind:'page',
    id:el=>'page:'+(el.dataset.ffbTitle||'').toLowerCase().replace(/\s+/g,'-'),
    title:el=>el.dataset.ffbTitle||document.title,
    meta:el=>el.dataset.ffbMeta||document.title.replace(/\s*[—|·].*$/,'').trim()
  }
];

function text(el,sel){const node=el.querySelector(sel);return node?node.textContent.trim():''}

const ICON_SVG='<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.6L6 20V5a1 1 0 0 1 1-1Z"/></svg>';
const ICON_CLOSE='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const ICON_TAG='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 12V4h8l9 9-8 8-9-9Z"/><circle cx="7.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/></svg>';

const root=document.createElement('div');
root.className='ffb-widget';root.id='ffbWidget';
root.innerHTML=
 '<button class="ffb-launcher" id="ffbLauncher" type="button" aria-label="Open your FreshFind bookmarks" aria-expanded="false">'+
   '<span class="ffb-icon-book">'+ICON_SVG+'</span>'+
   '<span class="icon-close">'+ICON_CLOSE+'</span>'+
   '<span class="ffb-count is-empty" id="ffbCount">0</span>'+
 '</button>'+
 '<div class="ffb-panel" id="ffbPanel" role="dialog" aria-label="FreshFind bookmarks">'+
   '<header class="ffb-head">'+
     '<div class="ffb-leaf">🔖</div>'+
     '<div class="ffb-head-text"><h2>Your Bookmarks</h2><p id="ffbSummary">Nothing saved yet</p></div>'+
     '<button class="ffb-icon-btn" id="ffbPageSave" type="button" aria-label="Bookmark this page">'+ICON_TAG+'</button>'+
     '<button class="ffb-icon-btn" id="ffbClose" type="button" aria-label="Close bookmarks">'+ICON_CLOSE+'</button>'+
   '</header>'+
   '<div class="ffb-tabs" id="ffbTabs" role="group" aria-label="Filter bookmarks"></div>'+
   '<div class="ffb-list" id="ffbList"></div>'+
   '<footer class="ffb-foot">'+
     '<div class="ffb-foot-row"><span class="ffb-foot-label">Export your list</span>'+
       '<button class="ffb-act ffb-act-accent" id="ffbCopy" type="button">Copy list</button>'+
       '<button class="ffb-act" id="ffbDownload" type="button">Download .txt</button>'+
     '</div>'+
     '<div class="ffb-foot-row"><span class="ffb-foot-label">Share recommendations</span>'+
       '<div class="ffb-social" id="ffbSocial"></div>'+
     '</div>'+
   '</footer>'+
   '<div class="ffb-toast" id="ffbToast" role="status" aria-live="polite"></div>'+
 '</div>';

function mount(){document.body.appendChild(root);boot()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();

function boot(){
const $=id=>document.getElementById(id);
const launcher=$('ffbLauncher'),count=$('ffbCount'),tabsEl=$('ffbTabs'),listEl=$('ffbList'),summaryEl=$('ffbSummary'),toastEl=$('ffbToast');
let filter='all';
let lastFocus=null;

const isSaved=id=>items.some(x=>x.id===id);
const findItem=id=>items.find(x=>x.id===id);

function toggle(entry){
  if(isSaved(entry.id)){
    items=items.filter(x=>x.id!==entry.id);
    delete notes[entry.id];saveNotes();
    saveList();syncButtons();render();
    toast('Removed from bookmarks');
  }else{
    items.unshift({...entry,savedAt:Date.now()});
    saveList();syncButtons();render();
    toast(entry.kind==='page'?'Page bookmarked':'Saved to bookmarks');
  }
  return isSaved(entry.id);
}
function removeItem(id){
  items=items.filter(x=>x.id!==id);
  delete notes[id];saveNotes();
  saveList();syncButtons();render();
}
let toastTimer=null;
function toast(message){
  if(!toastEl)return;
  toastEl.textContent=message;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toastEl.classList.remove('is-visible'),1900);
}

const injected=new Map();      
const buttons=new Map();       
const buttonFor=el=>el.querySelector(':scope > .ffb-btn');

function buildButton(entry,host,inline){
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='ffb-btn'+(inline?' ffb-btn-inline':'');
  btn.innerHTML='<span aria-hidden="true">🔖</span>';
  btn.setAttribute('aria-pressed',String(isSaved(entry.id)));
  btn.setAttribute('aria-label',(isSaved(entry.id)?'Remove bookmark for ':'Bookmark ')+entry.title);
  if(inline)btn.append(document.createTextNode(isSaved(entry.id)?'Bookmarked':'Bookmark this'));
  btn.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const nowSaved=toggle(entry);
    btn.setAttribute('aria-pressed',String(nowSaved));
    btn.setAttribute('aria-label',(nowSaved?'Remove bookmark for ':'Bookmark ')+entry.title);
    if(inline)btn.lastChild.nodeValue=nowSaved?'Bookmarked':'Bookmark this';
  });
  if(!inline)host.appendChild(btn);
  if(!buttons.has(entry.id))buttons.set(entry.id,[]);
  buttons.get(entry.id).push(btn);
  return btn;
}

function enhance(){
  DESCRIPTORS.forEach(desc=>{
    document.querySelectorAll(desc.sel).forEach(el=>{
      if(injected.has(el)||el.closest('#ffbWidget'))return;
      if(buttonFor(el))return;
      let entry;
      try{entry={id:desc.id(el),kind:desc.kind,title:desc.title(el),meta:desc.meta(el)||''}}catch(e){return}
      if(!entry.id||!entry.title)return;
      injected.set(el,entry);
      el.classList.add('ffb-host');
      buildButton(entry,el,false);
    });
  });
}

function syncButtons(){
  buttons.forEach((list,id)=>{
    const saved=isSaved(id);
    const item=findItem(id);
    list.forEach(btn=>{
      btn.classList.toggle('is-active',saved);
      btn.setAttribute('aria-pressed',String(saved));
      if(btn.classList.contains('ffb-btn-inline')){
        btn.setAttribute('aria-label',(saved?'Remove bookmark for ':'Bookmark ')+(item?item.title:'content'));
        if(btn.lastChild&&btn.lastChild.nodeType===3)btn.lastChild.nodeValue=saved?'Bookmarked':'Bookmark this';
      }else{
        btn.setAttribute('aria-label',(saved?'Remove bookmark for ':'Bookmark ')+(item?item.title:'content'));
      }
    });
  });
}

if(window.MutationObserver){
  const scheduled=new Set();
  const observer=new MutationObserver(records=>{
    records.forEach(record=>{
      record.addedNodes&&record.addedNodes.forEach(node=>{
        if(node.nodeType===1)scheduled.add(node);
      });
    });
    if(!scheduled.size)return;
    clearTimeout(observer._t);
    observer._t=setTimeout(()=>{scheduled.clear();enhance();syncButtons()},120);
  });
  const start=()=>observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
}

window.FreshFindBookmarks={
  add:entry=>toggle({kind:'page',meta:'',...entry}),
  remove:removeItem,
  has:isSaved,
  list:()=>items.map(x=>({...x,note:noteFor(x.id)})),
  text:()=>buildText(),
  mount:(el,entry,opts={})=>{
    if(!el)return null;
    el.classList.add('ffb-host');
    return buildButton({kind:'page',meta:'',...entry},el,!!opts.inline);
  }
};

const FILTERS=[['all','All'],['market','Markets'],['produce','Produce guide'],['season','Seasonal'],['page','Pages']];

function buildTabs(){
  tabsEl.innerHTML='';
  FILTERS.forEach(([key,label])=>{
    const total=key==='all'?items.length:items.filter(x=>x.kind===key).length;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='ffb-tab'+(filter===key?' is-active':'');
    btn.textContent=label+(total?' ('+total+')':'');
    btn.setAttribute('aria-pressed',String(filter===key));
    btn.addEventListener('click',()=>{filter=key;render()});
    tabsEl.appendChild(btn);
  });
}

function itemNode(item){
  const node=document.createElement('article');
  node.className='ffb-item';
  const note=noteFor(item.id);
  node.innerHTML=
    '<div class="ffb-item-top">'+
      '<div class="ffb-emoji" aria-hidden="true">'+(KIND_EMOJI[item.kind]||'🔖')+'</div>'+
      '<div class="ffb-item-body">'+
        '<h3 class="ffb-item-title"></h3>'+
        (item.meta?'<p class="ffb-item-meta"></p>':'')+
        '<span class="ffb-kind ffb-kind-'+item.kind+'">'+(KIND_LABEL[item.kind]||'Saved')+'</span>'+
      '</div>'+
      '<button class="ffb-remove" type="button" aria-label="Remove bookmark">×</button>'+
    '</div>'+
    '<p class="ffb-note-label">Personal note <span class="ffb-session-tag">this session only</span></p>'+
    '<textarea class="ffb-note" rows="1" placeholder="e.g. ask for the Saturday crate deal"></textarea>';
  node.querySelector('.ffb-item-title').textContent=item.title;
  if(item.meta)node.querySelector('.ffb-item-meta').textContent=item.meta;
  const area=node.querySelector('.ffb-note');
  area.value=note;
  area.addEventListener('input',()=>{setNote(item.id,area.value);area.style.height='auto';area.style.height=Math.min(area.scrollHeight,120)+'px'});
  node.querySelector('.ffb-remove').addEventListener('click',()=>{removeItem(item.id);toast('Bookmark removed')});
  return node;
}

const notesCount=()=>Object.keys(notes).filter(id=>isSaved(id)).length;

function notifyChange(){
  try{
    document.dispatchEvent(new CustomEvent('freshfind:bookmarks:change',{
      detail:{items:items.map(x=>({...x}))}
    }));
  }catch(e){}
}

function render(){
  buildTabs();
  const visible=filter==='all'?items:items.filter(x=>x.kind===filter);
  listEl.innerHTML='';
  if(!visible.length){
    const empty=document.createElement('div');
    empty.className='ffb-empty';
    empty.innerHTML='<span class="ffb-empty-icon" aria-hidden="true">🧺</span>'+
      '<strong>'+(items.length?'Nothing in this filter':'Your basket is empty')+'</strong>'+
      '<p>Tap the 🔖 button on any market, produce guide entry or seasonal pick to save it here, add a personal note, then export or share your list.</p>';
    listEl.appendChild(empty);
  }else{
    visible.forEach(item=>listEl.appendChild(itemNode(item)));
  }
  count.textContent=String(items.length);
  count.classList.toggle('is-empty',items.length===0);
  summaryEl.textContent=items.length
    ? items.length+(items.length===1?' bookmark':' bookmarks')+(notesCount()?' · '+notesCount()+' noted':'')
    : 'Nothing saved yet';
  const pageBtn=$('ffbPageSave');
  if(pageBtn){
    const current=pageEntry();
    pageBtn.classList.toggle('is-active',isSaved(current.id));
    pageBtn.setAttribute('aria-pressed',String(isSaved(current.id)));
    pageBtn.setAttribute('aria-label',(isSaved(current.id)?'Remove bookmark for this page':'Bookmark this page'));
  }
  syncSocial();
  notifyChange();
}

function buildText(){
  if(!items.length)return 'FreshFind — My Bookmarks\n\nNo bookmarks saved yet.';
  const stamp=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
  const lines=['🌿 FRESHFIND — MY BOOKMARKS','Exported '+stamp,'='.repeat(34),''];
  const order=['market','produce','season','page'];
  const headings={market:'FAVOURITE MARKETS',produce:'PRODUCT GUIDE ENTRIES',season:'SEASONAL PICKS',page:'PAGES'};
  order.forEach(kind=>{
    const group=items.filter(x=>x.kind===kind);
    if(!group.length)return;
    lines.push(headings[kind]+' ('+group.length+')','-'.repeat(34));
    group.forEach((item,index)=>{
      lines.push((index+1)+'. '+item.title+'  ['+(KIND_LABEL[kind]||'Saved')+']');
      if(item.meta)lines.push('   '+item.meta);
      const note=noteFor(item.id);
      if(note)lines.push('   Note: '+note);
      if(item.page)lines.push('   '+item.page);
    });
    lines.push('');
  });
  if(notesCount())lines.push('*Personal notes are session-only and are not saved permanently.*');
  return lines.join('\n');
}

async function copyText(value){
  try{
    if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);return true}
  }catch(e){}
  try{
    const area=document.createElement('textarea');
    area.value=value;
    area.setAttribute('readonly','');
    area.style.cssText='position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(area);
    area.select();
    const ok=document.execCommand('copy');
    area.remove();
    return ok;
  }catch(e){return false}
}

function download(){
  const blob=new Blob([buildText()],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download='freshfind-bookmarks-'+new Date().toISOString().slice(0,10)+'.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

$('ffbCopy').addEventListener('click',async()=>{
  if(!items.length){toast('Nothing to export yet');return}
  toast(await copyText(buildText())?'List copied to clipboard':'Copy failed — use Download instead');
});
$('ffbDownload').addEventListener('click',()=>{
  if(!items.length){toast('Nothing to export yet');return}
  download();
  toast('Bookmarks exported as a text file');
});

const SOCIAL=[
  {key:'whatsapp',label:'WhatsApp',bg:'#25D366',link:t=>'https://api.whatsapp.com/send?text='+encodeURIComponent(t)},
  {key:'facebook',label:'Facebook',bg:'#1877F2',link:()=>'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(location.href.split('#')[0])},
  {key:'x',label:'X',bg:'#000000',link:t=>'https://twitter.com/intent/tweet?text='+encodeURIComponent(t)},
  {key:'telegram',label:'Telegram',bg:'#229ED9',link:t=>'https://t.me/share/url?url='+encodeURIComponent(location.href.split('#')[0])+'&text='+encodeURIComponent(t)},
  {key:'email',label:'Email',bg:'#123c2b',link:t=>'mailto:?subject='+encodeURIComponent('FreshFind — my bookmarked markets & produce')+'&body='+encodeURIComponent(t)},
  {key:'copy',label:'Copy link',copy:true}
];
function shareText(){
  if(!items.length)return 'FreshFind — discover local markets and seasonal produce. '+location.href.split('#')[0];
  const titles=items.slice(0,6).map(x=>'• '+x.title).join('\n');
  return 'FreshFind — my bookmarked markets & produce:\n'+titles+
    (items.length>6?'\n• +'+(items.length-6)+' more':'')+
    '\n\nOpen my list: '+location.href.split('#')[0];
}
function syncSocial(){
  const wrap=$('ffbSocial');
  if(!wrap)return;
  wrap.innerHTML='';
  SOCIAL.forEach(channel=>{
    if(channel.copy){
      const btn=document.createElement('button');
      btn.type='button';btn.className='ffb-social';
      btn.style.cssText='border:0;cursor:pointer';
      btn.textContent='🔗';btn.title='Copy share text';
      btn.setAttribute('aria-label','Copy share text');
      btn.addEventListener('click',async()=>{toast(await copyText(shareText())?'Share text copied':'Copy failed')});
      wrap.appendChild(btn);
      return;
    }
    const link=document.createElement('a');
    link.href=channel.link(shareText());
    link.target='_blank';link.rel='noopener noreferrer';
    link.style.background=channel.bg;
    link.title='Share on '+channel.label;
    link.setAttribute('aria-label','Share on '+channel.label);
    link.textContent=channel.label.slice(0,2);
    wrap.appendChild(link);
  });
}

function openPanel(){
  root.classList.add('is-open');
  launcher.setAttribute('aria-expanded','true');
  lastFocus=document.activeElement;
  setTimeout(()=>$('ffbClose').focus(),240);
}
function closePanel(){
  root.classList.remove('is-open');
  launcher.setAttribute('aria-expanded','false');
  if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus();
}
launcher.addEventListener('click',()=>root.classList.contains('is-open')?closePanel():openPanel());
$('ffbClose').addEventListener('click',closePanel);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&root.classList.contains('is-open'))closePanel();
});

function pageEntry(){
  const title=(document.querySelector('main h1, .hero h1, h1')?.textContent||document.title).trim();
  return {
    id:'page:'+(location.pathname.split('/').pop()||'index.html').toLowerCase(),
    kind:'page',title,meta:title,page:location.href.split('#')[0]
  };
}
$('ffbPageSave').addEventListener('click',()=>{
  const saved=toggle(pageEntry());
  const btn=$('ffbPageSave');
  btn.classList.toggle('is-active',saved);
  btn.setAttribute('aria-pressed',String(saved));
  if(!saved)openPanel();
});

const start=()=>{enhance();syncButtons();render()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
window.addEventListener('storage',e=>{
  if(e.key===KEY_LIST){items=read(localStorage,KEY_LIST,[]);syncButtons();render()}
  if(e.key===KEY_NOTES){notes=read(sessionStorage,KEY_NOTES,{});render()}
});
}
})();


