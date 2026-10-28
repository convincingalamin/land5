/**
 * core/app.js : CORE UI (loaded on every page)
 * - Builds the header (logo, dropdown navigation, language + theme buttons), footer, mobile contact bar,
 *   floating "scroll to top" and chatbot buttons.
 * - Wires the contact form (email through Web3Forms + WhatsApp message builder).
 * - PAGES is the single source of truth for page URLs (key -> clean URL).
 * Depends on: nothing. Public globals: window.LAND (katha size used by every calculator).
 */
(function(){
window.LAND={kathaSf:720};
/* page key -> clean URL (single source of truth for navigation links) */
var PAGES={"index": "/", "services": "/services/", "porcha": "/services/porcha/", "namjari": "/services/namjari/", "khajna": "/services/khajna/", "dcr": "/services/dcr/", "mouza-map": "/services/mouza-map/", "digital-map": "/services/digital-map/", "dolil": "/deeds/", "sap-kobala": "/deeds/sap-kobala/", "heba": "/deeds/heba/", "heba-bil-ewaj": "/deeds/heba-bil-ewaj/", "bontonnama": "/deeds/bontonnama/", "baynanama": "/deeds/baynanama/", "bondhok": "/deeds/bondhok/", "izara": "/deeds/izara/", "mokhtarnama": "/deeds/mokhtarnama/", "binimoy": "/deeds/binimoy/", "osiyotnama": "/deeds/osiyotnama/", "tyagnama": "/deeds/tyagnama/", "puran-dolil-nokol": "/deeds/old-deed-copy/", "hisab": "/calculators/land-area/", "farayej": "/calculators/faraiz/", "hissa": "/calculators/ana-gonda-hissa/", "dolil-fee": "/calculators/deed-fee/", "nokol-fee": "/calculators/copy-fee/", "jano": "/learn/", "itihas": "/learn/land-history/", "jorip": "/learn/land-survey/", "faq": "/faq/", "about": "/about/", "contact": "/contact/", "privacy": "/privacy/"};
/** Return the clean URL for a page key (used by navigation and footer links). */
function U(k){return PAGES[k]||'/'}
var NO='8801745473151',P=document.body.dataset.p||'index';
/* social links: fill the empty ones and the icon appears automatically */
var SOC={facebook:'https://www.facebook.com/convincing.alamin11',youtube:'https://youtube.com/@convincing.alamin',instagram:'https://instagram.com/convincing.alamin/',telegram:'https://t.me/convincingalamin',linkedin:'https://linkedin.com/in/convincing-al-amin/',whatsapp:'https://wa.me/'+NO};
var NAV=[['index','হোম'],
{t:'সেবা',items:[['services','সব সেবা'],['porcha','পর্চা/রেকর্ড/খতিয়ান'],['namjari','নামজারি (খারিজ)'],['khajna','ভূমি উন্নয়ন কর (খাজনা)'],['dcr','ডিসিআর (DCR)'],['mouza-map','মৌজা ম্যাপ'],['digital-map','ডিজিটাল ম্যাপ ও মাপজোখ'],['dolil','দলিল']]},
{t:'ক্যালকুলেটর',items:[['hisab','জমির হিসাব ও একক রূপান্তর'],['farayej','ফারায়েজ (উত্তরাধিকার)'],['hissa','আনা-গণ্ডা ও হিস্যা'],['dolil-fee','দলিল ফি'],['nokol-fee','নকল তল্লাশ ফি']]},
{t:'জানুন',items:[['jano','জমি সম্পর্কে জানুন'],['faq','প্রশ্নোত্তর'],['itihas','জমির ইতিহাস'],['jorip','জরিপ ও বিডিএস']]},
['about','আমাদের সম্পর্কে']];
var nav=NAV.map(function(n){
 if(n.items){var on=n.items.some(function(i){return i[0]==P});
  return '<div class="dd'+(on?' on':'')+'"><button type="button" class="ddb" aria-expanded="false" aria-haspopup="true">'+n.t+'<i aria-hidden="true"></i></button><div class="ddm">'+n.items.map(function(i){return '<a href="'+U(i[0])+'"'+(i[0]==P?' class="on" aria-current="page"':'')+'>'+i[1]+'</a>'}).join('')+'</div></div>'}
 return '<a href="'+U(n[0])+'"'+(n[0]==P?' class="on" aria-current="page"':'')+'>'+n[1]+'</a>'}).join('');
var SI={facebook:'<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8z"/>',youtube:'<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>',instagram:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8h.01"/>',telegram:'<path d="M21 4 3 11l5 2 2 6 3-4 5 4z"/><path d="M8 13l9-6"/>',linkedin:'<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5V16M8 7.8v.01M12 16v-5.5M12 12.5a2.5 2.5 0 0 1 5 0V16"/>',whatsapp:'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>'};
var NM={facebook:'Facebook',youtube:'YouTube',instagram:'Instagram',telegram:'Telegram',linkedin:'LinkedIn',whatsapp:'WhatsApp'};
var soc=Object.keys(SOC).filter(function(k){return SOC[k]}).map(function(k){return '<a class="sc" href="'+SOC[k]+'" target="_blank" rel="noopener" aria-label="'+NM[k]+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+SI[k]+'</svg></a>'}).join('');
/** Build one footer link column. */
function col(t,items){return '<div><h4>'+t+'</h4>'+items.map(function(i){return '<a href="'+U(i[0])+'">'+i[1]+'</a>'}).join('')+'</div>'}
var FT='<footer><div class="wrap"><div class="fgd"><div class="fb"><a class="brand" href="/"><img src="/assets/img/icon.png" alt=""><span>আল-আমিন<small>ডিজিটাল ল্যান্ড সার্ভে</small></span></a><p>জমির কাগজ, মাপজোখ ও নকশা, এক জায়গায়। সেবা এলাকা সারা বাংলাদেশ।</p><div class="scs">'+soc+'</div></div>'+
 col('সেবা',NAV[1].items.slice(0,6))+col('ক্যালকুলেটর',NAV[2].items)+col('জানুন',NAV[3].items.concat([['about','আমাদের সম্পর্কে'],['contact','যোগাযোগ']]))+'</div>'+
 '<div class="fbt"><div>© ২০২৬ আল-আমিন ডিজিটাল ল্যান্ড সার্ভে। সর্বস্বত্ব সংরক্ষিত। · <a href="'+U('privacy')+'">গোপনীয়তা নীতি</a></div><div>এই সাইটের তথ্য সাধারণ ধারণার জন্য। চূড়ান্ত সিদ্ধান্তের আগে সরকারি অফিসের কাগজ যাচাই করুন।</div></div></div></footer>';
var FAB='<div class="mbar"><a class="mw" href="https://wa.me/'+NO+'" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true">'+SI.whatsapp+'</svg>WhatsApp</a><a class="mc" href="tel:+'+NO+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>কল করুন</a></div>'+
 '<div class="fab" id="fab"><button type="button" class="fab-top" id="gt" aria-label="উপরে যান" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button><button type="button" class="fab-chat" id="cb" aria-label="সহায়ক চ্যাট খুলুন" aria-expanded="false" aria-controls="cbp"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="8" width="15" height="11" rx="3.5"/><path d="M12 8V5.4"/><circle cx="12" cy="4.4" r="1.3" fill="#fff"/><circle cx="9.3" cy="13" r="1.2" fill="#fff" stroke="none"/><circle cx="14.7" cy="13" r="1.2" fill="#fff" stroke="none"/><path d="M9.6 16.3c1.4.9 3.4.9 4.8 0"/><path d="M2.5 12.5v3M21.5 12.5v3"/></svg></button></div>';
document.body.insertAdjacentHTML('afterbegin','<a class="skip" href="#main">মূল অংশে যান</a><header><div class="wrap hd"><a class="brand" href="/"><img src="/assets/img/icon.png" alt=""><span>আল-আমিন<small>ডিজিটাল ল্যান্ড সার্ভে</small></span></a><nav id="nv">'+nav+'<a class="btn wa pulse" href="/contact/">যোগাযোগ</a></nav><span class="hdr"><button type="button" class="lg" id="lg" aria-label="Switch to English" title="Switch to English">EN</button><button type="button" class="tg" id="tg" aria-label="থিম বদলান (ডার্ক/লাইট)" title="ডার্ক/লাইট থিম"><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button></span><button class="mb" aria-label="মেনু" aria-expanded="false">☰</button></div></header>');
document.body.insertAdjacentHTML('beforeend',FT+FAB);
var cs=document.getElementById('cs');if(cs)cs.innerHTML=soc;
var mn=document.querySelector('main');if(mn&&!mn.id)mn.id='main';
var h=document.querySelector('header'),b=h.querySelector('.mb');
var tgb=document.getElementById('tg');tgb.onclick=function(){var r=document.documentElement,t=r.dataset.theme=='dark'?'light':'dark';r.dataset.theme=t;try{localStorage.setItem('theme',t)}catch(e){}};
b.onclick=function(){var o=h.classList.toggle('open');b.setAttribute('aria-expanded',o)};
[].forEach.call(h.querySelectorAll('.ddb'),function(x){x.onclick=function(e){e.stopPropagation();var d=x.parentNode,o=!d.classList.contains('open');[].forEach.call(h.querySelectorAll('.dd.open'),function(y){y.classList.remove('open');y.firstChild.setAttribute('aria-expanded','false')});if(o){d.classList.add('open');x.setAttribute('aria-expanded','true')}}});
document.addEventListener('click',function(e){if(!h.contains(e.target)){[].forEach.call(h.querySelectorAll('.dd.open'),function(y){y.classList.remove('open');y.firstChild.setAttribute('aria-expanded','false')})}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){[].forEach.call(h.querySelectorAll('.dd.open'),function(y){y.classList.remove('open');y.firstChild.setAttribute('aria-expanded','false')});h.classList.remove('open')}});

var gt=document.getElementById('gt'),cb=document.getElementById('cb'),ld=false;
var sc=function(){gt.hidden=(window.pageYOffset||document.documentElement.scrollTop)<300};
window.addEventListener('scroll',sc,{passive:true});sc();
gt.onclick=function(){window.scrollTo({top:0,behavior:'smooth'})};
cb.onclick=function(){if(window.LandBot){window.LandBot.toggle();return}if(ld)return;ld=true;
var q=document.createElement('script');q.src='/assets/js/widgets/chatbot.js';q.onload=function(){window.LandBot.toggle()};
q.onerror=function(){ld=false;window.open('https://wa.me/'+NO,'_blank')};document.body.appendChild(q)};
/** Highlight the selected chip/radio label (works without the CSS :has selector). */
function sync(){[].forEach.call(document.querySelectorAll('.chips label'),function(l){var i=l.querySelector('input');l.classList.toggle('on',!!(i&&i.checked))})}
window.syncChips=sync;document.addEventListener('change',function(e){if(e.target.closest&&e.target.closest('.chips'))sync()});sync();
document.querySelectorAll('a[data-wa]').forEach(function(a){a.href='https://wa.me/'+NO+'?text='+encodeURIComponent(a.dataset.wa);a.target='_blank';a.rel='noopener'});
var f=document.getElementById('wf');
if(f){var pv=document.getElementById('pv'),fs=document.getElementById('fs'),KEY='21775341-add0-4b07-8243-9efeef803565';
var bm=function(){var T=function(x){return window.I18N?I18N.t(x):x},L=[T('*আসসালামু আলাইকুম*'),T('আমি জমি সংক্রান্ত সেবার জন্য যোগাযোগ করছি।'),''];
[].forEach.call(f.querySelectorAll('[data-l]'),function(e){if(e.type=='radio'&&!e.checked)return;var v=e.value.trim();if(v)L.push('*'+e.dataset.l+':* '+v)});
var ck=[].filter.call(f.querySelectorAll('input[type=checkbox]:checked'),function(e){return e.id!='bot'}).map(function(e){return e.value});if(ck.length)L.push(T('*আমার কাছে আছে:*')+' '+ck.join(', '));
L.push('',T('ধন্যবাদ।'));return L.join('\n')},up=function(){pv.textContent=bm()};
var say=function(t,k){fs.className='fsm '+(k||'');fs.innerHTML=t};
f.addEventListener('input',up);f.addEventListener('change',up);document.addEventListener('langchange',function(){setTimeout(up,0)});up();
var sendWa=function(){window.open('https://wa.me/'+NO+'?text='+encodeURIComponent(bm()),'_blank')};
document.getElementById('pw').onclick=sendWa;document.getElementById('pm').onclick=function(){if(f.reportValidity&&!f.reportValidity())return;if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event('submit',{cancelable:true}))};
f.onsubmit=function(e){e.preventDefault();if(document.getElementById('bot').checked)return;
 var ph=document.getElementById('ph').value.replace(/[০-৯]/g,function(d){return '০১২৩৪৫৬৭৮৯'.indexOf(d)}).replace(/[^\d]/g,''),nm=document.getElementById('n').value.trim();
 if(!nm){say('আপনার নাম লিখুন।','bad');document.getElementById('n').focus();return}
 if(ph.length<10||ph.length>14){say('সঠিক মোবাইল নম্বর দিন, যাতে আমরা যোগাযোগ করতে পারি।','bad');document.getElementById('ph').focus();return}
 var b=document.getElementById('sb'),sv=document.getElementById('s').value,data={access_key:KEY,subject:(window.I18N?I18N.t('নতুন অনুরোধ:'):'নতুন অনুরোধ:')+' '+sv+' ('+nm+')',from_name:'আল-আমিন ডিজিটাল ল্যান্ড সার্ভে (ওয়েবসাইট)',name:nm,phone:document.getElementById('ph').value.trim(),message:bm().replace(/\*/g,'')};
 [].forEach.call(f.querySelectorAll('[data-l]'),function(x){if(x.type=='radio'&&!x.checked)return;if(x.value.trim()&&x.id!='n'&&x.id!='ph')data[x.dataset.l]=x.value.trim()});
 b.disabled=true;b.textContent='পাঠানো হচ্ছে…';say('আপনার অনুরোধ পাঠানো হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন…');
 fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data)}).then(function(r){return r.json()}).then(function(j){
  if(j&&j.success){say('✓ আপনার অনুরোধ পাঠানো হয়েছে। আমরা শিগগির যোগাযোগ করব। চাইলে <a href="#" id="fw">WhatsApp-এও জানাতে পারেন</a>।','ok');var l=document.getElementById('fw');if(l)l.onclick=function(ev){ev.preventDefault();sendWa()};b.textContent='পাঠানো হয়েছে ✓';setTimeout(function(){b.disabled=false;b.textContent='জমা দিন'},8000)}
  else throw new Error('fail')}).catch(function(){say('দুঃখিত, এখন পাঠানো যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন, অথবা <a href="#" id="fw2">WhatsApp-এ পাঠান</a>।','bad');var l=document.getElementById('fw2');if(l)l.onclick=function(ev){ev.preventDefault();sendWa()};b.disabled=false;b.textContent='জমা দিন'})};
document.getElementById('cp').onclick=function(){var b=this,old=b.innerHTML;(navigator.clipboard?navigator.clipboard.writeText(bm()):Promise.reject()).then(function(){b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';b.title='কপি হয়েছে'},function(){b.title='কপি করা যায়নি'});setTimeout(function(){b.innerHTML=old;b.title='কপি করুন'},2200)}}
var c=document.getElementById('conv');
if(c){var Bn='০১২৩৪৫৬৭৮৯',o=c.querySelector('output');
var up=function(){var kk=window.LAND.kathaSf/435.6,U={sh:1,ka:kk,bi:20*kk,ac:100,sf:1/435.6},v=parseFloat(String(c.querySelector('input').value).replace(/[০-৯]/g,function(d){return '০১২৩৪৫৬৭৮৯'.indexOf(d)})),u=c.querySelector('select').value;if(!(v>0)){o.textContent='সংখ্যা লিখুন';return}
var s=v*U[u],r=[['শতাংশ','sh'],['বিঘা','bi'],['কাঠা','ka'],['একর','ac'],['বর্গফুট','sf']];
o.textContent=r.map(function(x){var q=s/U[x[1]];return (q>=100?q.toFixed(0):q.toFixed(2)).replace(/\d/g,function(d){return Bn[d]})+' '+x[0]}).join(' = ')};
c.addEventListener('input',up);document.addEventListener('landchange',up);up()}
})();
