(() => {
  "use strict";
  
  
const ROOT=(()=>{try{
  const s=document.currentScript;if(!s||!s.src)return '';
  const seg=p=>p.replace(/^\/+|\/+$/g,'').split('/').filter(Boolean);
  const from=seg(location.pathname).slice(0,-1);
  const to=seg(new URL(s.src).pathname).slice(0,-1);
  let i=0;while(i<from.length&&i<to.length&&from[i]===to[i])i++;
  const rest=to.slice(i).join('/');
  return '../'.repeat(from.length-i)+(rest?rest+'/':'');
}catch(e){return ''}})();
const navigationItems = [['01','HOME','index.html','vids/farm-growth.mp4','FreshFind / Home'],['02','MARKET FIND','marketfind.html','vids/farm-growth.mp4','Find a Market'],['03','MARKET DIRECTORY / DETAIL','market.html','vids/farm-growth.mp4','Market Directory & Detail'],['05','PRODUCE','progress.html','vids/fruit.mp4','Fresh Produce'],['06','SEASONS','Seasonal.html','vids/fruit.mp4','Seasonal Freshness'],['07','ASK FRESHFIND','chat.html','vids/chat.mp4','Ask FreshFind'],['08','CONTACT','contact.html','vids/colorflow-animation (3).mp4','Get in Touch'],['09','ABOUT','about.html','vids/farm-growth.mp4','About FreshFind']];
const nav=document.createElement('header');nav.className='ff-nav';nav.id='freshFindNav';nav.innerHTML=`<a href="${ROOT}index.html" class="ff-logo" aria-label="FreshFind home"><span class="ff-logo-mark">âœ¦</span><span>FreshFind</span></a><nav class="ff-nav-links" aria-label="Primary">${navigationItems.map(x=>`<a class="ff-nav-link${x[1].length>14?' ff-menu-link-long':''}" href="${ROOT}${x[2]}" title="${x[4]}">${x[1]}</a>`).join('')}</nav><button class="ff-menu-button" id="openMenu" type="button" aria-label="Open navigation" aria-expanded="false"><span class="ff-menu-text">Explore</span><span class="ff-menu-icon"><span></span><span></span></span></button></div>`;
const menu=document.createElement('div');menu.className='ff-menu';menu.id='freshFindMenu';menu.setAttribute('aria-hidden','true');menu.innerHTML=`<div class="ff-menu-header"><div class="ff-menu-label">FreshFind / Navigation</div><button class="ff-close" id="closeMenu" type="button" aria-label="Close navigation"></button></div><div class="ff-menu-content"><div class="ff-menu-inner"><div class="ff-menu-kicker">Explore your local food system</div><nav aria-label="Main navigation"><ul class="ff-menu-links">${navigationItems.map(x=>`<li><a href="${ROOT}${x[2]}" data-video="${x[3]}" data-label="${x[4]}" class="${x[1].length>14?'ff-menu-link-long':''}"><span class="ff-number">${x[0]}</span>${x[1]}</a></li>`).join('')}</ul></nav></div></div><div class="ff-video-preview" id="ffVideoPreview"><video class="ff-preview-video" id="ffPreviewVideo" muted playsinline loop preload="metadata"></video><div class="ff-video-overlay"></div><div class="ff-video-label" id="ffVideoLabel">FreshFind</div></div>`;
document.body.prepend(menu);document.body.prepend(nav);

const here=decodeURIComponent((location.pathname.split('/').pop()||'index.html')).toLowerCase();
let marked=false;document.querySelectorAll('.ff-nav-links a').forEach(a=>{if(marked)return;const h=a.getAttribute('href')||'';const base=decodeURIComponent(h.split('#')[0]).toLowerCase();if(base===here&&h.indexOf('#')===-1){a.setAttribute('aria-current','page');marked=true;}});
const open=document.getElementById('openMenu'),close=document.getElementById('closeMenu'),pv=document.getElementById('ffPreviewVideo'),pc=document.getElementById('ffVideoPreview'),pl=document.getElementById('ffVideoLabel'),links=[...document.querySelectorAll('.ff-menu-links a')];let current='';
function stop(){pv.pause();pv.removeAttribute('src');pv.load();pv.style.opacity='0';pc.classList.remove('playing');current=''}
function openMenu(){menu.classList.add('open');menu.setAttribute('aria-hidden','false');open.setAttribute('aria-expanded','true');document.body.classList.add('ff-menu-open');setTimeout(()=>close.focus(),500)}
function closeMenu(){menu.classList.remove('open');menu.setAttribute('aria-hidden','true');open.setAttribute('aria-expanded','false');document.body.classList.remove('ff-menu-open');stop();open.focus()}
open.addEventListener('click',openMenu);close.addEventListener('click',closeMenu);
function change(link){const src=link.dataset.video?ROOT+link.dataset.video:'';if(!src||current===src){if(current===src)pv.play().catch(()=>{});return}current=src;pl.textContent=link.dataset.label||link.textContent.trim();pv.style.opacity='0';setTimeout(()=>{pv.pause();pv.src=src;pv.load();pv.addEventListener('loadeddata',()=>pv.play().then(()=>{pc.classList.add('playing');pv.style.opacity='1'}).catch(()=>pv.style.opacity='1'),{once:true})},120)}
links.forEach(l=>{l.addEventListener('mouseenter',()=>change(l));l.addEventListener('focus',()=>change(l));l.addEventListener('click',closeMenu)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open'))closeMenu()});window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>40),{passive:true});
})();


