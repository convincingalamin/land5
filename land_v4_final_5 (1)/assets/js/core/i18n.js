/**
 * core/i18n.js : Bangla / English switch
 * Bengali text in the HTML is the source. window.EN (assets/i18n/en-dict.js, loaded lazily) maps exact Bengali
 * strings to English. Text nodes and some attributes are translated, including content added later
 * (MutationObserver). Numbers are matched through a "{n}" pattern so "28.00 decimal" style strings work.
 * Unknown strings simply stay Bengali. Public API: window.I18N = {apply, set, get, t}.
 */
/* /assets/js/core/i18n.js: বাংলা / English switch. Bengali is the source text; window.EN maps exact Bengali strings to English.
   Text nodes + some attributes are translated, dynamic content too (MutationObserver). Unknown strings stay Bengali. */
(function(){
var EN=window.EN||{},BD='০১২৩৪৫৬৭৮৯',ATTR=['placeholder','aria-label','title','alt','data-wa','data-ph','data-l','value'];
var lang='bn',busy=false;
function stored(){try{return localStorage.getItem('lang')}catch(e){return null}}
/** Collapse whitespace so dictionary keys match regardless of formatting. */
function norm(s){return s.replace(/\s+/g,' ').trim()}
/** Convert Bengali digits to ASCII digits (English mode). */
function digits(s){return s.replace(/[০-৯]/g,function(c){return BD.indexOf(c)})}
var NUM=/[০-৯0-9]+(?:,[০-৯0-9]{2,3})*(?:\.[০-৯0-9]+)?/g,WORDS=window.ENW||[];
/** Translate one string: exact match, then number pattern ({n}), then word-level fallback for number-heavy text. */
function tx(s){ /* translate one string (already trimmed): exact, then number-pattern, then word-level for number-heavy text */
 var k=norm(s),v=EN[k];if(v!=null)return v;
 var nums=[],p=k.replace(NUM,function(m){nums.push(m);return'{n}'});
 if(nums.length){if((v=EN[p])!=null){var i=0;return v.replace(/\{n\}/g,function(){return nums[i++]||''})}
  if(WORDS.length&&/[\u0980-\u09FF]/.test(p)){var o=k,hit=false;WORDS.forEach(function(w){if(o.indexOf(w[0])>-1){o=o.split(w[0]).join(w[1]);hit=true}});if(hit&&!/[\u0980-\u09FF]/.test(o))return o}}
 return null}
/** Translate a text node in place (remembers the Bengali original). */
function trText(n){
 if(n.__bn===undefined){if(!/[\u0980-\u09FF]/.test(n.nodeValue))return;n.__bn=n.nodeValue}
 else if(n.nodeValue!==n.__en)n.__bn=n.nodeValue; /* content changed by the page */
 var src=n.__bn,m=/^(\s*)([\s\S]*?)(\s*)$/.exec(src),core=m[2],t=tx(core),out=t!=null?m[1]+t+m[3]:src;
 out=digits(out);n.__en=out;if(n.nodeValue!==out)n.nodeValue=out}
/** Restore the Bengali original of a text node. */
function backText(n){if(n.__bn!==undefined&&n.nodeValue===n.__en){n.nodeValue=n.__bn}n.__bn=undefined;n.__en=undefined}
/** Translate placeholder/aria-label/title/alt/data-* attributes of an element. */
function trAttrs(el){
 ATTR.forEach(function(a){if(a=='value'){var tg=el.tagName,ty=el.type;if(!(tg=='OPTION'||(tg=='INPUT'&&(ty=='radio'||ty=='checkbox'))))return;if(el.closest&&el.closest('[data-geo]'))return /* geo option values must stay Bengali */}var v=el.getAttribute(a);if(v==null||!/[\u0980-\u09FF]/.test(v)&&el.__abn&&el.__abn[a]===undefined)return;
  el.__abn=el.__abn||{};var cur=v;if(el.__abn[a]!==undefined&&el.__aen&&el.__aen[a]===cur)cur=el.__abn[a];else el.__abn[a]=cur;
  var t=tx(cur),out=digits(t!=null?t:cur);el.__aen=el.__aen||{};el.__aen[a]=out;if(v!==out)el.setAttribute(a,out)})}
/** Restore the original attributes. */
function backAttrs(el){if(!el.__abn)return;ATTR.forEach(function(a){if(el.__abn[a]!==undefined&&el.getAttribute(a)===(el.__aen||{})[a])el.setAttribute(a,el.__abn[a])});el.__abn=null;el.__aen=null}
/** Visit every text node and element under a root. */
function walk(root,fn,fa){
 var w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:function(n){if(n.nodeType==1){var t=n.tagName;if(t=='SCRIPT'||t=='STYLE'||t=='NOSCRIPT')return NodeFilter.FILTER_REJECT}return NodeFilter.FILTER_ACCEPT}}),n,L=[];
 if(root.nodeType==1)L.push(root);
 while((n=w.nextNode()))L.push(n);
 L.forEach(function(x){if(x.nodeType==3)fn(x);else fa(x)})}
/** Translate a DOM subtree (also used for the print/PDF sheet). */
function apply(root){if(lang!='en')return;busy=true;try{walk(root||document.body,trText,trAttrs)}finally{busy=false}}
/** Translate or restore the document title. */
function title(){
 if(lang=='en'){if(document.__ot===undefined)document.__ot=document.title;var wt=tx(document.__ot);document.title=wt!=null?wt:document.__ot.split(' | ').map(function(p){var t=tx(p);return t!=null?t:p}).join(' | ')}
 else if(document.__ot!==undefined){document.title=document.__ot;document.__ot=undefined}}
/** Translate or restore the meta description. */
function metaDesc(){var m=document.querySelector('meta[name=description]');if(!m)return;
 if(lang=='en'){if(m.__ob===undefined)m.__ob=m.content;var t=tx(m.__ob);if(t!=null)m.content=t}else if(m.__ob!==undefined){m.content=m.__ob;m.__ob=undefined}}
/* The English dictionary (~300 KB, ~60 KB gzipped) is loaded only when English is actually needed. */
/** Load the English dictionary on demand. */
function loadDict(cb){
 if(window.EN&&Object.keys(window.EN).length){EN=window.EN;WORDS=window.ENW||[];cb();return}
 var sc=document.createElement('script');sc.src='/assets/i18n/en-dict.js';
 sc.onload=function(){EN=window.EN||{};WORDS=window.ENW||[];cb()};sc.onerror=function(){cb()};document.head.appendChild(sc)}
/** Switch the page language and notify other scripts (langchange event). */
function setLang(l,save){
 if(l=='en'&&!(window.EN&&Object.keys(window.EN).length)){loadDict(function(){setLang(l,save)});return}
 lang=l;var r=document.documentElement;r.lang=l=='en'?'en':'bn';r.classList.toggle('en',l=='en');
 if(save){try{localStorage.setItem('lang',l)}catch(e){}}
 busy=true;
 if(l=='en')apply(document.body);
 else{try{walk(document.body,backText,backAttrs)}finally{busy=false}}
 busy=false;title();metaDesc();
 var b=document.getElementById('lg');if(b){b.textContent=l=='en'?'বাংলা':'EN';b.setAttribute('aria-label',l=='en'?'Switch to Bangla':'Switch to English');b.title=l=='en'?'Switch to Bangla':'Switch to English'}
 document.dispatchEvent(new CustomEvent('langchange',{detail:l}))}
var mo=new MutationObserver(function(ms){if(lang!='en'||busy)return;busy=true;try{ms.forEach(function(m){
  if(m.type=='characterData'){if(m.target.nodeType==3)trText(m.target)}
  else if(m.type=='attributes'){trAttrs(m.target)}
  else m.addedNodes.forEach(function(n){if(n.nodeType==3)trText(n);else if(n.nodeType==1)walk(n,trText,trAttrs)})})}finally{busy=false}});
/** Hook the toggle button, start the observer and apply the saved language. */
function init(){
 var b=document.getElementById('lg');if(b)b.onclick=function(){setLang(lang=='en'?'bn':'en',true)};
 mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR});
 var s=stored();if(s=='en')setLang('en',false);else{lang='bn';title()}}
window.I18N={apply:apply,set:setLang,get:function(){return lang},t:function(bn){var t=tx(bn);return lang=='en'&&t!=null?t:bn}};
init();
})();
