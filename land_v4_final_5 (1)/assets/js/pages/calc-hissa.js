/**
 * pages/calc-hissa.js : "Ana-Gonda & Hissa" calculator
 * 1) Khatian shares for many owners (ana-gonda with symbols, decimal fraction, or land amount),
 * 2) ana-gonda converter, 3) symbol table and "read the symbols" tool.
 */
/* /assets/js/pages/calc-hissa.js: আনা-গণ্ডা ও হিস্যা. Multi-owner khatian share, converter, symbols. Uses LM + Report. */
(function(){
var LM=window.LM,bn=LM.bn,fmt=LM.fmt,nv=LM.nv;
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
var DISC='ফলাফল আনুমানিক। চূড়ান্ত সিদ্ধান্তের আগে সরকারি কাগজ ও আইন অনুযায়ী যাচাই করুন।';
var KEYS=['ana','gonda','kora','kranti','til'],NAMES={ana:'আনা',gonda:'গণ্ডা',kora:'কড়া',kranti:'ক্রান্তি',til:'তিল'};
/* traditional symbols (ana 1..16, kora 1..3, kranti 1..2); gonda and til are written as plain numbers */
var ANA=['','⁄','৵','৶','৷','৷⁄','৷৵','৷৶','৷৷','৷৷⁄','৷৷৵','৷৷৶','৸','৸⁄','৸৵','৸৶','১'],KORA=['','৷','৷৷','৸'],KRANTI=['','৴','৴৴'];

var MAXV={ana:16,gonda:19,kora:3,kranti:2,til:19},SYM={ana:ANA,kora:KORA,kranti:KRANTI};
/** Options with the traditional symbols for ana/kora/kranti. */
function selOpts(k,sel){var o='';for(var i=0;i<=MAXV[k];i++){var sy=SYM[k]&&SYM[k][i]?SYM[k][i]+'  ':'';o+='<option value="'+i+'"'+(String(sel||0)==String(i)?' selected':'')+'>'+(i?sy+bn(i)+' '+NAMES[k]:'০ '+NAMES[k])+'</option>'}return o}
/** Escape text for HTML. */
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/** Result header box. */
function bigBox(l,m,s,body,warn){return'<div class="rbig"><small>'+l+'</small><b>'+m+'</b>'+(s?'<span>'+s+'</span>':'')+'</div>'+(warn||'')+body+'<p class="rnote">⚠️ '+DISC+' <i>গণনা নির্ভুল সূত্রে হয়েছে। ফল ততটাই সঠিক, খতিয়ানের তথ্য যতটা সঠিক।</i></p>'}
/** Render warnings. */
function warn(a){return a.map(function(w){return'<div class="rwarn">'+w+'</div>'}).join('')}
/** Parse 0.25, 1/4 or 25% into a number. */
function parseFrac(t){ /* "0.25" "1/4" "25%" "১/৪" */
 t=String(t||'').replace(/[০-৯]/g,function(d){return'০১২৩৪৫৬৭৮৯'.indexOf(d)}).replace(/\s+/g,'').replace(/,/g,'.');if(!t)return NaN;
 if(/%$/.test(t)){var p=parseFloat(t);return isNaN(p)?NaN:p/100}
 if(t.indexOf('/')>-1){var q=t.split('/');var a=parseFloat(q[0]),b=parseFloat(q[1]);return(isNaN(a)||!b||isNaN(b))?NaN:a/b}
 return parseFloat(t)}
/** Switch tab. */
function tab(t){$$('.tabs button').forEach(function(b){b.setAttribute('aria-selected',b.dataset.t==t)});$$('.pan').forEach(function(p){p.hidden=p.dataset.t!=t});if(history.replaceState)history.replaceState(null,'','#'+t)}
$$('.tabs button').forEach(function(b){b.onclick=function(){tab(b.dataset.t)}});

/* ---------- 1. khatian share, many owners ---------- */
var OWN=[],mode='ana',sdata=null;
var SV={cs:['সিএস (CS)','ana'],sa:['এসএ (SA)','ana'],rs:['আরএস (RS)','dec'],brs:['বিআরএস (BRS)','dec'],bds:['বিডিএস (BDS)','dec'],city:['সিটি জরিপ','dec']};
/** Empty owner record. */
function newOwner(){return{name:'',ana:{},dec:'',land:'',lu:'sh',n:''}}
/** Options for the area unit select. */
function areaOpts(sel){return LM.AREA.filter(function(x){return['sh','ac','bi','ka','sf'].indexOf(x[0])>-1}).map(function(x){return'<option value="'+x[0]+'"'+(x[0]==sel?' selected':'')+'>'+x[1]+'</option>'}).join('')}
/** One owner row (depends on the share mode). */
function rowHtml(o,i){
 var inp='';
 if(mode=='ana')inp='<p class="hint" style="margin:0 0 4px">খতিয়ানে যে চিহ্ন বা সংখ্যা লেখা আছে, তার সাথে মিলিয়ে বেছে নিন।</p><div class="fgrid five">'+KEYS.map(function(k){return'<div class="fld"><label>'+NAMES[k]+'</label><select data-k="'+k+'">'+selOpts(k,o.ana[k])+'</select></div>'}).join('')+'</div>';
 else if(mode=='dec')inp='<div class="fld"><label>অংশ (খতিয়ানের মোট ১ ধরে)</label><input data-k="dec" inputmode="decimal" autocomplete="off" placeholder="যেমন ০.২৫ বা ১/৪ বা ২৫%" value="'+esc(o.dec)+'"></div>';
 else inp='<div class="fgrid"><div class="fld"><label>তাঁর জমির পরিমাণ</label><input data-k="land" inputmode="decimal" autocomplete="off" placeholder="যেমন ৮.২৫" value="'+esc(o.land)+'"></div><div class="fld"><label>একক</label><select data-k="lu">'+areaOpts(o.lu)+'</select></div></div>';
 return'<div class="own" data-i="'+i+'"><div class="ownh"><b>ব্যক্তি '+bn(i+1)+'</b>'+(OWN.length>1?'<button type="button" class="btn ol2" data-rm="'+i+'">বাদ দিন</button>':'')+'</div><div class="fgrid"><div class="fld"><label>নাম (ঐচ্ছিক)</label><input data-k="name" autocomplete="off" placeholder="যেমন আল-আমিন" value="'+esc(o.name)+'"></div><div class="fld"><label>সমান ভাগে কতজন (ঐচ্ছিক)</label><input data-k="n" inputmode="numeric" autocomplete="off" placeholder="১" value="'+esc(o.n)+'"><small class="hint">এই অংশ কয়েকজন ওয়ারিশ সমান ভাগ করলে</small></div></div>'+inp+'</div>'}
/** Render all owner rows. */
function renderOwners(){$('#own').innerHTML=OWN.map(rowHtml).join('')}
/** Copy values from the rows into the OWN array. */
function readOwners(){$$('#own .own').forEach(function(el){var o=OWN[+el.dataset.i];$$('[data-k]',el).forEach(function(f){var k=f.dataset.k;if(KEYS.indexOf(k)>-1)o.ana[k]=f.value;else o[k]=f.value})})}
/** Fraction of the whole khatian owned by one person. */
function fracOf(o,tot){
 if(mode=='ana'){var a={},any=false;KEYS.forEach(function(k){var v=nv(o.ana[k]);a[k]=isNaN(v)?0:v;if(v>0)any=true});return any?LM.anaToFrac(a):NaN}
 if(mode=='dec')return parseFrac(o.dec);
 var v=nv(o.land);return isNaN(v)?NaN:LM.toSqft(v,o.lu)/tot}
/** Calculate every owner's land, check the total and build the report. */
function calcShare(){
 readOwners();var box=$('#hr'),tv=nv($('#tv').value),tu=$('#tu').value;
 if(isNaN(tv)||tv<=0){box.innerHTML='<p class="rhint">খতিয়ানের মোট জমির পরিমাণ দিন।</p>';sdata=null;return}
 var tot=LM.toSqft(tv,tu),rows=[],sum=0,got=0,w=[];
 OWN.forEach(function(o,i){var f=fracOf(o,tot);if(isNaN(f)||f<0)return;got++;sum+=f;rows.push({o:o,i:i,f:f})});
 if(!got){box.innerHTML='<p class="rhint">ব্যক্তির অংশ দিন, ফলাফল এখানে আসবে।</p>';sdata=null;return}
 var diff=1-sum,st;
 if(Math.abs(diff)<1e-6)st='<div class="rok">✓ সবার অংশ মিলেছে: মোট ১৬ আনা (পুরো খতিয়ান)।</div>';
 else if(diff>0){st='<div class="rwarn">অংশ এখনো মেলেনি। বাকি আছে '+LM.anaText(LM.fracToAna(diff))+' ('+fmt(diff*100,3)+'%), যা প্রায় '+fmt(LM.fromSqft(tot*diff,'sh'))+' শতাংশ জমি। আরও ব্যক্তি যোগ করুন, অথবা খতিয়ান আবার দেখুন।</div>'}
 else st='<div class="rerr">অংশের যোগফল পুরো খতিয়ানের চেয়ে '+LM.anaText(LM.fracToAna(-diff))+' ('+fmt(-diff*100,3)+'%) বেশি। সংখ্যাগুলো আবার মিলিয়ে দেখুন।</div>';
 var h='<div class="tw res"><table class="ft"><thead><tr><th>ব্যক্তি</th><th>অংশ</th><th>শতকরা</th><th>জমি</th></tr></thead><tbody>',rep=[];
 rows.forEach(function(r){var sf=tot*r.f,nm=r.o.name.trim()||('ব্যক্তি '+bn(r.i+1)),n=Math.floor(nv(r.o.n))||1,an=LM.anaText(LM.fracToAna(r.f));
  var land=fmt(LM.fromSqft(sf,'sh'))+' শতাংশ',sub='<small>'+LM.compose(sf)+' · '+LM.acreDec(sf)+'</small>';
  var each=n>1?'<small>সমান '+bn(n)+' ভাগে প্রত্যেকে: '+fmt(LM.fromSqft(sf/n,'sh'))+' শতাংশ ('+LM.compose(sf/n)+')</small>':'';
  h+='<tr><td>'+esc(nm)+'</td><td>'+an+'<small>'+fmt(r.f*16,4)+'/১৬ আনা</small></td><td>'+fmt(r.f*100,3)+'%</td><td><b>'+land+'</b>'+sub+each+'</td></tr>';
  rep.push([nm,'<b>'+land+'</b> · '+an+' ('+fmt(r.f*100,3)+'%) · '+LM.compose(sf)+(n>1?' · সমান '+bn(n)+' ভাগে প্রত্যেকে '+fmt(LM.fromSqft(sf/n,'sh'))+' শতাংশ':'')])});
 h+='<tr class="tot"><td><b>মোট</b></td><td>'+LM.anaText(LM.fracToAna(Math.min(sum,1)))+'</td><td>'+fmt(sum*100,3)+'%</td><td>'+fmt(LM.fromSqft(tot*sum,'sh'))+' শতাংশ</td></tr></tbody></table></div>';
 box.innerHTML=bigBox('খতিয়ানের মোট জমি',fmt(tv)+' '+LM.nm(LM.AREA,tu),fmt(LM.fromSqft(tot,'sh'))+' শতাংশ = '+LM.compose(tot),st+h);
 var sv=$('#sv').value;
 sdata={title:'খতিয়ানের হিস্যা: কার কত জমি',inputs:[['জরিপ',SV[sv][0]],['মোট জমি',fmt(tv)+' '+LM.nm(LM.AREA,tu)+' = '+fmt(LM.fromSqft(tot,'sh'))+' শতাংশ'],['অংশ দেওয়ার পদ্ধতি',{ana:'আনা-গণ্ডা',dec:'দশমিক/ভগ্নাংশ',land:'জমির পরিমাণ'}[mode]],['কাঠা-বিঘার মান','১ কাঠা = '+fmt(LM.kk(),2)+' বর্গফুট']],results:rep.concat([['যোগফল',Math.abs(diff)<1e-6?'মিলেছে (১৬ আনা)':(diff>0?'বাকি '+fmt(diff*100,3)+'%':'বেশি '+fmt(-diff*100,3)+'%')]]),notes:['১ আনা = ২০ গণ্ডা, ১ গণ্ডা = ৪ কড়া, ১ কড়া = ৩ ক্রান্তি, ১ ক্রান্তি = ২০ তিল। পুরো খতিয়ান = ১৬ আনা।']};
 Report.bar(box,function(){return sdata})}
/** Change how shares are entered. */
function setMode(m,keep){mode=m;$('#sm').value=m;if(!keep)OWN.forEach(function(o){o.ana={};o.dec='';o.land=''});renderOwners();calcShare()}
/** Initialise the multi-owner tab. */
function mountShare(){
 $('#sv').innerHTML=Object.keys(SV).map(function(k){return'<option value="'+k+'">'+SV[k][0]+'</option>'}).join('');
 $('#tu').innerHTML=areaOpts('ac');OWN=[newOwner(),newOwner()];
 $('#sv').onchange=function(){setMode(SV[this.value][1])};
 $('#sm').onchange=function(){setMode(this.value)};
 $('#addo').onclick=function(){readOwners();OWN.push(newOwner());renderOwners();calcShare();var l=$$('#own .own');if(l.length)l[l.length-1].scrollIntoView({block:'nearest'})};
 $('#reso').onclick=function(){OWN=[newOwner(),newOwner()];$('#tv').value='';renderOwners();calcShare()};
 $('#own').addEventListener('input',calcShare);
 $('#own').addEventListener('click',function(e){var b=e.target.closest('[data-rm]');if(!b)return;readOwners();OWN.splice(+b.dataset.rm,1);renderOwners();calcShare()});
 $('#tv').addEventListener('input',calcShare);$('#tu').addEventListener('input',calcShare);
 document.addEventListener('landchange',calcShare);
 setMode('ana',true)}

/* ---------- 2. converter ---------- */
var cdata=null;
/** Ana-gonda converter. */
function calcConv(){
 var m=$('#cm').value,box=$('#cr');$$('.cin').forEach(function(e){e.hidden=e.dataset.m!=m});
 var f=NaN;
 if(m=='ana'){var a={},any=false;KEYS.forEach(function(k){var v=nv($('#c_'+k).value);a[k]=isNaN(v)?0:v;if(v>0)any=true});if(any)f=LM.anaToFrac(a)}
 else if(m=='frac')f=parseFrac($('#c_frac').value);
 else if(m=='pct'){var p=nv($('#c_pct').value);f=isNaN(p)?NaN:p/100}
 else{var t=nv($('#c_tilt').value);f=isNaN(t)?NaN:t/LM.TILTOTAL}
 if(isNaN(f)||f<0){box.innerHTML='<p class="rhint">একটি মান দিন, বাকি সব রূপ এখানে আসবে।</p>';cdata=null;return}
 var w=f>1?warn(['মান ১৬ আনা (পুরো জমি) ছাড়িয়েছে।']):'',an=LM.fracToAna(f),tv=nv($('#c_tot').value),tu=$('#c_tu').value,extra='',rows=[['আনা-গণ্ডা-কড়া-ক্রান্তি-তিল','<b>'+LM.anaText(an)+'</b>'],['আনার হিসাবে',fmt(f*16,5)+' আনা (১৬-র মধ্যে)'],['ভগ্নাংশ (দশমিক)',fmt(f,6)],['শতকরা',fmt(f*100,4)+'%'],['মোট তিল (৭৬,৮০০-র মধ্যে)',fmt(f*LM.TILTOTAL,2)]];
 if(!isNaN(tv)&&tv>0){var sf=LM.toSqft(tv,tu)*f;rows.push(['মোট '+fmt(tv)+' '+LM.nm(LM.AREA,tu)+' জমিতে এই অংশ','<b>'+fmt(LM.fromSqft(sf,'sh'))+' শতাংশ</b> ('+LM.compose(sf)+')'])}
 box.innerHTML=bigBox('ফলাফল',LM.anaText(an),fmt(f*100,4)+'% = '+fmt(f*16,4)+' আনা','<table class="ut"><tbody>'+rows.map(function(r){return'<tr><th>'+r[0]+'</th><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table>',w);
 cdata={title:'আনা-গণ্ডা কনভার্টার',inputs:[['দেওয়া মান',{ana:'আনা-গণ্ডা',frac:'ভগ্নাংশ',pct:'শতকরা',til:'তিল'}[m]]],results:rows,notes:['১৬ আনা = পুরো জমি = ৭৬,৮০০ তিল']};
 Report.bar(box,function(){return cdata})}
/** Initialise the converter tab. */
function mountConv(){
 KEYS.forEach(function(k){$('#c_'+k).innerHTML=selOpts(k,0)});
 $('#c_tu').innerHTML=areaOpts('sh');
 $$('#panC input,#panC select').forEach(function(e){e.addEventListener('input',calcConv)});calcConv()}

/* ---------- 3. symbols ---------- */
/** Build the symbol tables. */
function mountSymbols(){
 var ta='<table class="ut sy"><thead><tr><th>আনা</th><th>চিহ্ন</th><th>আনা</th><th>চিহ্ন</th></tr></thead><tbody>';
 for(var i=1;i<=8;i++){ta+='<tr><td>'+bn(i)+' আনা</td><td class="sym">'+ANA[i]+'</td><td>'+bn(i+8)+' আনা'+(i+8==16?' (পুরো)':'')+'</td><td class="sym">'+ANA[i+8]+'</td></tr>'}
 $('#sa').innerHTML=ta+'</tbody></table>';
 $('#sk').innerHTML='<table class="ut sy"><thead><tr><th>একক</th><th>চিহ্ন</th></tr></thead><tbody>'+[1,2,3].map(function(i){return'<tr><td>'+bn(i)+' কড়া</td><td class="sym">'+KORA[i]+'</td></tr>'}).join('')+[1,2].map(function(i){return'<tr><td>'+bn(i)+' ক্রান্তি</td><td class="sym">'+KRANTI[i]+'</td></tr>'}).join('')+'</tbody></table>';
 var o=function(arr,max,sym){var s='';for(var i=0;i<=max;i++)s+='<option value="'+i+'">'+(i?(sym&&arr[i]?arr[i]+'  ('+bn(i)+')':bn(i)):'০')+'</option>';return s};
 $('#r_ana').innerHTML=o(ANA,16,1);$('#r_gonda').innerHTML=o([],19);$('#r_kora').innerHTML=o(KORA,3,1);$('#r_kranti').innerHTML=o(KRANTI,2,1);$('#r_til').innerHTML=o([],19);
 $$('#panS select,#panS input').forEach(function(e){e.addEventListener('input',readSym)});readSym()}
/** Read selected symbols. */
function readSym(){var a={};KEYS.forEach(function(k){a[k]=+$('#r_'+k).value});var f=LM.anaToFrac(a),box=$('#rs'),tv=nv($('#r_tot').value),tu=$('#r_tu').value;
 if(!f){box.innerHTML='<p class="rhint">খতিয়ানে যা লেখা আছে, তার সাথে মিলিয়ে চিহ্ন বেছে নিন।</p>';return}
 var rows=[['পড়ুন','<b>'+LM.anaText(a)+'</b>'],['আনার হিসাবে',fmt(f*16,5)+' আনা'],['শতকরা',fmt(f*100,4)+'%']];
 if(!isNaN(tv)&&tv>0){var sf=LM.toSqft(tv,tu)*f;rows.push(['জমি','<b>'+fmt(LM.fromSqft(sf,'sh'))+' শতাংশ</b> ('+LM.compose(sf)+')'])}
 box.innerHTML='<table class="ut"><tbody>'+rows.map(function(r){return'<tr><th>'+r[0]+'</th><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table>'}
/** Initialise the page. */
function mount(){
 $('#bg').onchange=function(){window.LAND.kathaSf=parseFloat(this.value);document.dispatchEvent(new Event('landchange'))};
 $('#r_tu').innerHTML=areaOpts('sh');
 mountShare();mountConv();mountSymbols();
 var h=(location.hash||'').slice(1);tab(['h','c','s'].indexOf(h)>-1?h:'h')}
mount();
})();
