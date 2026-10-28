/**
 * pages/calc-fees.js : Deed fee and certified-copy (nokol/tallash) fee calculators
 * Every rate is editable on the page because government fee rates change.
 */
/* /assets/js/pages/calc-fees.js: দলিল ফি ও নকল তল্লাশ ফি ক্যালকুলেটর. Every rate is editable because fee rates change. */
(function(){
var LM=window.LM,bn=LM.bn,nv=LM.nv,M=LM.money;
var $=function(s){return document.querySelector(s)};
var NOTE='ফির হার নিয়মিত বদলায়। চূড়ান্ত হারের জন্য সংশ্লিষ্ট সরকারি অফিসে যাচাই করুন।';
var DISC='ফলাফল আনুমানিক। চূড়ান্ত সিদ্ধান্তের আগে সরকারি কাগজ ও আইন অনুযায়ী যাচাই করুন।';
/** Read a numeric field with a default. */
function num(id,d){var v=nv($('#'+id).value);return isNaN(v)?(d==null?0:d):v}
/** Result box with the required fee-change note. */
function box(main,sub,rows,extra,warn){
 return'<div class="rbig"><small>মোট আনুমানিক খরচ</small><b>'+main+'</b>'+(sub?'<span>'+sub+'</span>':'')+'</div>'+(warn||'')+'<table class="ut"><tbody>'+rows.map(function(r){return'<tr><th>'+r[0]+'</th><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table>'+(extra||'')+
 '<div class="rwarn">📌 '+NOTE+'</div><p class="rnote">⚠️ '+DISC+'</p>'}
var data=null;

/* ---------- দলিল ফি ---------- */
/** Deed registration cost. */
function calcDolil(){
 var out=$('#fr'),v=num('dv',NaN),m=num('dm',0),kind=$('#dk').value;
 if(isNaN(v)||v<=0){out.innerHTML='<p class="rhint">দলিলে লেখা মূল্য (টাকা) দিন, খরচের হিসাব এখানে আসবে।</p>';data=null;return}
 var w=[],base=v;if(m>v){base=m;w.push('<div class="rwarn">দলিলের মূল্য সরকারি মৌজা মূল্যের (<b>'+M(m,0)+' টাকা</b>) কম হওয়ায় হিসাব মৌজা মূল্য ধরে করা হয়েছে। সাধারণত সরকারি ন্যূনতম মূল্যের কম মূল্যে দলিল হয় না।</div>')}
 var rr=num('rr'),mn=num('rm'),sd=num('sd'),lt=num('lt'),st=num('st'),ot=num('ot'),wr=num('wr');
 var reg=Math.max(base*rr/100,base>0?mn:0),stamp=base*sd/100,loc=base*lt/100,src=base*st/100,rows=[
  ['রেজিস্ট্রেশন ফি ('+bn(rr)+'%'+(mn?', ন্যূনতম '+bn(mn)+' টাকা':'')+')',M(reg,0)+' টাকা'],
  ['স্ট্যাম্প শুল্ক ('+bn(sd)+'%)',M(stamp,0)+' টাকা'],
  ['স্থানীয় সরকার কর ('+bn(lt)+'%)',M(loc,0)+' টাকা'],
  ['উৎস কর ('+bn(st)+'%)',M(src,0)+' টাকা']];
 if(ot)rows.push(['অন্যান্য নির্দিষ্ট খরচ',M(ot,0)+' টাকা']);if(wr)rows.push(['দলিল লেখকের ফি',M(wr,0)+' টাকা']);
 var tot=reg+stamp+loc+src+ot+wr;rows.push(['<b>মোট খরচ</b>','<b>'+M(tot,0)+' টাকা</b>']);
 var pct=tot/base*100,extra='<div class="rcomp"><div><small>দলিল মূল্যের তুলনায়</small>'+LM.fmt(pct,2)+'%</div><div><small>ক্রেতার মোট (মূল্য + খরচ)</small>'+M(base+tot,0)+' টাকা</div></div>'+(kind!='sell'?'<div class="note">এটি সাফ কবলার হার ধরে হিসাব। অন্য দলিলের (হেবা, বণ্টননামা ইত্যাদি) হার ভিন্ন হয়। সাব-রেজিস্ট্রি অফিস থেকে হার জেনে নিচের "হারগুলো বদলান" অংশে বসান।</div>':'');
 out.innerHTML=box(M(tot,0)+' টাকা','দলিল মূল্য '+M(base,0)+' টাকা',rows,extra,w.join(''));
 data={title:'দলিল ফি: রেজিস্ট্রেশন খরচের হিসাব',inputs:[['দলিলের ধরন',kind=='sell'?'সাফ কবলা (বিক্রয়)':'অন্য দলিল (হার নিজে দেওয়া)'],['দলিলে লেখা মূল্য',M(v,0)+' টাকা'],['এলাকা',$('#da').options[$('#da').selectedIndex].text]].concat(m?[['সরকারি মৌজা মূল্য',M(m,0)+' টাকা']]:[]),results:rows,notes:[NOTE,'হার ব্যবহারকারী যা দিয়েছেন তা-ই ধরা হয়েছে।']};
 Report.bar(out,function(){return data})}
/** Initialise the deed fee page. */
function mountDolil(){
 $('#da').addEventListener('input',function(){$('#lt').value=this.value=='city'?'২':'৩';calcDolil()});
 ['dk','dv','dm','rr','rm','sd','lt','st','ot','wr'].forEach(function(i){$('#'+i).addEventListener('input',calcDolil)});
 $('#rst').onclick=function(){$('#rr').value='১';$('#rm').value='১০০';$('#sd').value='১.৫';$('#lt').value=$('#da').value=='city'?'২':'৩';$('#st').value='৩';$('#ot').value='';$('#wr').value='';calcDolil()};
 $('#rst').click()}

/* ---------- নকল তল্লাশ ফি ---------- */
/** Certified copy cost (search, inspection, stamp, court, per-page fees). */
function calcNokol(){
 var out=$('#nr'),pg=Math.floor(num('npg',NaN));
 if(isNaN(pg)||pg<=0){out.innerHTML='<p class="rhint">নকলের পাতার সংখ্যা দিন (প্রতি ৩০০ শব্দে এক পাতা)।</p>';data=null;return}
 var search=$('#ns').value=='yes',yr=Math.max(1,Math.floor(num('nyr',1))),it=Math.max(1,Math.floor(num('nit',1))),insp=Math.max(0,Math.floor(num('nin',1))),rows=[],tot=0;
 var big=$('#nst').value=='big',ga=num('nga'),gg=num('ngg'),cf=num('ncf'),f1=num('nf1'),f1x=num('nf1x'),cap=num('ncap');
 /** Add one fee line. */
 function add(l,x){rows.push([l,M(x,0)+' টাকা']);tot+=x}
 if(search){var per=Math.min(f1+f1x*(yr-1),cap||1e12);add('তল্লাশ ফি ('+bn(yr)+' বছর'+(it>1?', '+bn(it)+'টি নাম/সম্পত্তি':'')+')',per*it);add('পরিদর্শন ফি ('+bn(insp)+'টি)',num('nf2')*insp)}
 add('স্ট্যাম্প শুল্ক (নকলের আবেদনে)',big?num('ns2'):num('ns1'));
 add('কোর্ট ফি',cf);
 add('জি(এ) ফি ('+bn(pg)+' পাতা × '+bn(ga)+' টাকা)',ga*pg);
 add('জিজি ফি ('+bn(pg)+' পাতা × '+bn(gg)+' টাকা)',gg*pg);
 if($('#nug').checked){var u=pg<=4?num('nu1'):num('nu2')*pg;add(pg<=4?'অগ্রাধিকার ফি (জি(বি))':'অতিরিক্ত ফি, ৪ পাতার বেশি ('+bn(pg)+' পাতা × '+bn(num('nu2'))+' টাকা)',u)}
 rows.push(['<b>মোট সরকারি ফি</b>','<b>'+M(tot,0)+' টাকা</b>']);
 var w=search?'':'<div class="rhint" style="margin:10px 0">তল্লাশ ছাড়া সরাসরি নকল: দলিলের নম্বর, সাল ও খণ্ড (বহি) জানা থাকলে বা মূল দলিল/সত্যায়িত অনুলিপি দাখিল করলে তল্লাশ ফি লাগে না।</div>';
 out.innerHTML=box(M(tot,0)+' টাকা','সার্টিফাইড কপি, '+bn(pg)+' পাতা',rows,'',w);
 data={title:'নকল তল্লাশ ফি: দলিলের নকলের খরচ',inputs:[['তল্লাশ',search?'লাগবে ('+bn(yr)+' বছর)':'লাগবে না'],['নকলের পাতা',bn(pg)],['মূল দলিলের স্ট্যাম্প শুল্ক',big?'১,০০০ টাকার বেশি':'১,০০০ টাকা বা কম'],['অগ্রাধিকার',$('#nug').checked?'হ্যাঁ':'না']],results:rows,notes:[NOTE,'এটি সরকারি ফির হিসাব। দলিল লেখক বা মধ্যস্থতাকারীর সেবা ফি আলাদা।']};
 Report.bar(out,function(){return data})}
/** Initialise the copy fee page. */
function mountNokol(){
 ['ns','nyr','nit','nin','npg','nst','nug','ns1','ns2','ncf','nga','ngg','nf1','nf1x','ncap','nf2','nu1','nu2'].forEach(function(i){var e=$('#'+i);e.addEventListener('input',calcNokol);e.addEventListener('change',function(){})});
 $('#ns').addEventListener('input',function(){$('#nsw').hidden=this.value!='yes'});
 calcNokol()}
if($('#dv'))mountDolil();if($('#npg'))mountNokol();
})();
