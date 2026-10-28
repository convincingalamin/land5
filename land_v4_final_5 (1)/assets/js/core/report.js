/**
 * core/report.js : print + PDF download for every calculator result
 * Report.bar(box, getData) adds Print / PDF / Copy-link buttons under a result box.
 * PDF = html2canvas + jsPDF (lazy-loaded from /assets/vendor only when the button is pressed).
 */
/* /assets/js/core/report.js: print + PDF download for every calculator result.
   data = {title, sub?, inputs:[[label,value]], svg?, results:[[label,value]], extra?:html, notes?:[text]} */
(function(){
var bn=function(s){return String(s).replace(/\d/g,function(c){return'০১২৩৪৫৬৭৮৯'[c]})};
/** Escape text for HTML. */
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/** Today's date in Bengali digits (dd/mm/yyyy). */
function today(){var d=new Date();return bn(('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear())}
/** Build table rows from [label, value] pairs. */
function rows(a){return a.map(function(r){return'<tr><th>'+esc(r[0])+'</th><td>'+r[1]+'</td></tr>'}).join('')}
var DISC='ফলাফল আনুমানিক। চূড়ান্ত সিদ্ধান্তের আগে সরকারি কাগজ ও আইন অনুযায়ী যাচাই করুন।';
/** Build the printable/PDF report sheet HTML. */
function make(d){
 return'<div class="rp"><div class="rph"><img src="/assets/img/icon.png" alt=""><div><b>আল-আমিন ডিজিটাল ল্যান্ড সার্ভে</b><span>সারা বাংলাদেশে জমির কাগজ ও মাপজোখ</span></div><em>তারিখ: '+today()+'</em></div>'+
 '<h2>'+esc(d.title)+'</h2>'+(d.sub?'<p class="rps">'+d.sub+'</p>':'')+
 (d.inputs&&d.inputs.length?'<h3>দেওয়া তথ্য</h3><table>'+rows(d.inputs)+'</table>':'')+
 (d.svg?'<div class="rpg">'+d.svg+'</div>':'')+
 '<h3>ফলাফল</h3><table class="rpr">'+rows(d.results)+'</table>'+(d.extra||'')+
 (d.notes&&d.notes.length?'<ul class="rpn">'+d.notes.map(function(n){return'<li>'+n+'</li>'}).join('')+'</ul>':'')+
 '<p class="rpd">⚠️ '+DISC+'</p><div class="rpf">যোগাযোগ: +৮৮০১৭৪৫৪৭৩১৫১ (ফোন/WhatsApp) &middot; সেবা এলাকা: সারা বাংলাদেশ</div></div>'}

/** Open the browser print dialog for the report. */
function print(d){
 var r=document.getElementById('printroot');if(r)r.remove();
 r=document.createElement('div');r.id='printroot';r.innerHTML=make(d);document.body.appendChild(r);if(window.I18N)I18N.apply(r);
 var done=function(){var x=document.getElementById('printroot');if(x)x.remove();window.removeEventListener('afterprint',done)};
 window.addEventListener('afterprint',done);setTimeout(function(){window.print()},60)}

var loaded={};
/** Load a script once (used for PDF libraries). */
function load(src){return loaded[src]||(loaded[src]=new Promise(function(ok,no){var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=function(){delete loaded[src];no(new Error('load '+src))};document.head.appendChild(s)}))}
/** Render the report to canvas and download it as an A4 PDF. */
function pdf(d,st){
 st.className='rst';st.textContent='ফাইল তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন…';
 return load('/assets/vendor/html2canvas.min.js').then(function(){return load('/assets/vendor/jspdf.umd.min.js')}).then(function(){return document.fonts&&document.fonts.ready}).then(function(){
  var h=document.createElement('div');h.className='repsheet';h.style.cssText='position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1';h.innerHTML=make(d);document.body.appendChild(h);if(window.I18N)I18N.apply(h);
  return window.html2canvas(h,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false}).then(function(cv){
   h.remove();
   var J=window.jspdf.jsPDF,p=new J('p','mm','a4'),W=210,H=297,ph=Math.floor(cv.width*H/W),y=0,first=true;
   while(y<cv.height){var hh=Math.min(ph,cv.height-y),c=document.createElement('canvas');c.width=cv.width;c.height=hh;var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(cv,0,y,cv.width,hh,0,0,cv.width,hh);
    if(!first)p.addPage();p.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,W,hh*W/cv.width);first=false;y+=ph}
   var n=new Date(),f='land-calculation-'+n.getFullYear()+('0'+(n.getMonth()+1)).slice(-2)+('0'+n.getDate()).slice(-2)+'-'+('0'+n.getHours()).slice(-2)+('0'+n.getMinutes()).slice(-2)+'.pdf';
   p.save(f);st.className='rst ok';st.textContent='PDF ফাইল ডাউনলোড শুরু হয়েছে। না হলে আবার চাপুন, অথবা "প্রিন্ট" থেকে PDF সেভ করুন।'})
 }).catch(function(e){var x=document.querySelector('body>.repsheet');if(x)x.remove();st.className='rst bad';st.textContent='PDF তৈরি করা গেল না। "প্রিন্ট" বাটনে চেপে PDF হিসেবে সেভ করুন।'})}

/* adds [print] [PDF] [share link] under a result box. getData() is called fresh on every click. */
/** Add Print / PDF / Copy link buttons under a result box. */
function bar(box,getData,getLink){
 var o=box.querySelector('.ract');if(o)o.remove();
 var w=document.createElement('div');w.className='ract';
 w.innerHTML='<button type="button" class="btn dk" data-a="p">🖨️ প্রিন্ট</button><button type="button" class="btn dk" data-a="d">⬇️ PDF ডাউনলোড</button>'+(getLink?'<button type="button" class="btn ol2" data-a="l">🔗 লিংক কপি</button>':'')+'<p class="rst" role="status" aria-live="polite"></p>';
 var st=w.querySelector('.rst');
 w.onclick=function(e){var b=e.target.closest('button');if(!b)return;var a=b.dataset.a;
  if(a=='p')print(getData());
  else if(a=='d'){b.disabled=true;pdf(getData(),st).then(function(){b.disabled=false},function(){b.disabled=false})}
  else if(a=='l'){var u=getLink();var ok=function(){st.className='rst ok';st.textContent='লিংক কপি হয়েছে। এই লিংকে একই মাপ খুলবে।'};
   if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u).then(ok,function(){window.prompt('লিংক কপি করুন:',u)});else window.prompt('লিংক কপি করুন:',u)}};
 box.appendChild(w)}
window.Report={make:make,print:print,pdf:pdf,bar:bar,DISC:DISC};
})();
