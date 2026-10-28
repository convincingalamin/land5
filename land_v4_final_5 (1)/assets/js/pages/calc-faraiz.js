/**
 * pages/calc-faraiz.js : Faraiz (inheritance) calculator
 * Muslim (Hanafi) engine with awl/radd, deductions (funeral, debts, bequest <= 1/3) and children of a pre-deceased child;
 * a simple Hindu (Dayabhaga) engine. Fractions are exact (numerator/denominator pairs).
 */
/* /assets/js/pages/calc-faraiz.js: Muslim (Hanafi) + simple Hindu inheritance calculator, with estate, deductions, pre-deceased children's children, print/PDF. */
(function(){
var LM=window.LM,bn=LM.bn,fmt=LM.fmt,nv=LM.nv;
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
var DISC='ফলাফল আনুমানিক। চূড়ান্ত সিদ্ধান্তের আগে সরকারি কাগজ ও আইন অনুযায়ী যাচাই করুন।';
/* ---------- fractions ---------- */
/** Greatest common divisor. */
function g(a,b){return b?g(b,a%b):a}
/** Create a reduced fraction [numerator, denominator]. */
function F(n,d){d=d||1;var k=g(Math.abs(n),Math.abs(d))||1;return[n/k,d/k]}
/** Add fractions. */
function add(a,b){return F(a[0]*b[1]+b[0]*a[1],a[1]*b[1])}
/** Subtract fractions. */
function sub(a,b){return add(a,[-b[0],b[1]])}
/** Multiply fractions. */
function mul(a,b){return F(a[0]*b[0],a[1]*b[1])}
/** Divide a fraction by an integer. */
function dvn(a,k){return F(a[0],a[1]*k)}
/** Format a fraction in Bengali digits. */
function ff(a){return a[0]===0?'০':(a[1]===1?bn(a[0]):bn(a[0])+'/'+bn(a[1]))}
/** Fraction to number. */
function val(a){return a[0]/a[1]}
/* ---------- Muslim (Hanafi) ---------- */
/** Hanafi inheritance engine (fixed shares, residue, awl, radd, blocking). */
function muslim(I){
 var sh={},N=[],ch=I.s+I.d>0,sib=I.fb+I.fs+I.pb+I.ps+I.ub+I.us,gfo=I.gf>0&&I.f===0;
 var sp=I.h?F(1,ch?4:2):I.w?F(1,ch?8:4):F(0,1);
 var bs=I.s>0||I.f>0||gfo,FB=bs?0:I.fb,FS=bs?0:I.fs,bu=ch||I.f>0||gfo,UB=bu?0:I.ub,US=bu?0:I.us;
 var PB=(bs||FB>0)?0:I.pb,mg=FS>0&&FB===0&&I.d>0;
 var PS=(bs||FB>0||mg||(FS>=2&&PB===0))?0:I.ps,psG=PS>0&&PB===0&&I.d>0&&FS===0;
 /** Add a share to the result map. */
 function give(id,l,c,t){if(!c||t[0]===0)return;if(!sh[id])sh[id]={l:l,c:c,t:F(0,1)};sh[id].t=add(sh[id].t,t)}
 if(I.h)give('h','স্বামী',1,sp);if(I.w)give('w','স্ত্রী',I.w,sp);
 if(I.m){var um=!ch&&sib<2&&I.f>0&&(I.h||I.w);
  give('m','মাতা',1,um?mul(sub(F(1,1),sp),F(1,3)):(ch||sib>=2?F(1,6):F(1,3)));
  if(um)N.push('মাতা স্বামী/স্ত্রীর অংশ বাদে অবশিষ্টের ১/৩ পেয়েছেন (উমারিয়াতাইন মাসআলা)।')}
 if(ch&&I.f)give('f','পিতা',1,F(1,6));if(ch&&gfo)give('gf','দাদা (পিতার পিতা)',1,F(1,6));
 if(I.d&&I.s===0)give('d','কন্যা',I.d,I.d===1?F(1,2):F(2,3));
 if(FS&&FB===0&&!mg)give('fs','সহোদরা বোন',FS,FS===1?F(1,2):F(2,3));
 if(PS&&PB===0&&!psG&&I.d===0){if(FS===0)give('ps','বৈমাত্রেয় বোন',PS,PS===1?F(1,2):F(2,3));else if(FS===1)give('ps','বৈমাত্রেয় বোন',PS,F(1,6))}
 var U=UB+US;if(U)give('u','বৈপিত্রেয় ভাই/বোন',U,U===1?F(1,6):F(1,3));
 var S=F(0,1),k;for(k in sh)S=add(S,sh[k].t);var R=sub(F(1,1),S),u;
 if(R[0]>0){
  if(I.s>0){u=2*I.s+I.d;give('s','পুত্র',I.s,mul(R,F(2*I.s,u)));give('d','কন্যা',I.d,mul(R,F(I.d,u)))}
  else if(I.f)give('f','পিতা',1,R);else if(gfo)give('gf','দাদা (পিতার পিতা)',1,R);
  else if(FB>0){u=2*FB+FS;give('fb','সহোদর ভাই',FB,mul(R,F(2*FB,u)));give('fs','সহোদরা বোন',FS,mul(R,F(FS,u)))}
  else if(mg)give('fs','সহোদরা বোন',FS,R);
  else if(PB>0){u=2*PB+PS;give('pb','বৈমাত্রেয় ভাই',PB,mul(R,F(2*PB,u)));give('ps','বৈমাত্রেয় বোন',PS,mul(R,F(PS,u)))}
  else if(psG)give('ps','বৈমাত্রেয় বোন',PS,R);
  else{var O=F(0,1),Sp=F(0,1);for(k in sh){if(k==='h'||k==='w')Sp=add(Sp,sh[k].t);else O=add(O,sh[k].t)}
   if(O[0]>0){for(k in sh)if(k!=='h'&&k!=='w')sh[k].t=mul(sh[k].t,mul(sub(F(1,1),Sp),F(O[1],O[0])));N.push('অবশিষ্ট অংশ স্বামী/স্ত্রী বাদে বাকি ভগ্নাংশভোগীদের মধ্যে আনুপাতিক হারে ফেরত গেছে (রদ)।')}
   else if(Sp[0]>0){for(k in sh)sh[k].t=F(1,1);N.push('অন্য কোনো ওয়ারিশ নেই। দূরের আত্মীয় (যাবিল আরহাম) থাকলে তারা আগে পেতে পারেন, নইলে স্বামী/স্ত্রী পান।')}}
 }else if(R[0]<0){for(k in sh)sh[k].t=mul(sh[k].t,F(S[1],S[0]));N.push('অংশের যোগফল ১-এর বেশি হওয়ায় সবার অংশ আনুপাতিক হারে কমানো হয়েছে (আউল)।')}
 var X=[];if(I.gf>0&&!gfo)X.push('দাদা (পিতা থাকায়)');if(I.fb>FB)X.push('সহোদর ভাই');if(I.fs>FS)X.push('সহোদরা বোন');if(I.pb>PB)X.push('বৈমাত্রেয় ভাই');if(I.ps>PS)X.push('বৈমাত্রেয় বোন');if(I.ub+I.us>U)X.push('বৈপিত্রেয় ভাই/বোন');
 if(X.length)N.push('বঞ্চিত (অন্যের কারণে কিছু পান না): '+X.join(', ')+'।');
 return{sh:sh,N:N}}
/* ---------- Hindu (Dayabhaga, simple) ---------- */
/** Simple Dayabhaga inheritance. */
function hindu(I){var sh={},N=[];
 function give(l,c,t){if(c&&t[0])sh[l]={l:l,c:c,t:t}}
 if(I.s>0){var u=I.s+I.w;give('পুত্র',I.s,F(I.s,u));give('স্ত্রী (পুত্রের সমান অংশ)',I.w,F(I.w,u));if(I.d)N.push('পুত্র থাকলে কন্যা সাধারণত উত্তরাধিকারী নন। তবে ভাই-বোনের ভরণ ও বিবাহের ব্যয় দাবি করা যেতে পারে।')}
 else if(I.w){give('স্ত্রী (বিধবা, জীবনস্বত্ব)',1,F(1,1));if(I.d)N.push('বিধবা সম্পূর্ণ সম্পত্তি জীবনস্বত্বে ভোগ করেন। তাঁর মৃত্যুর পর যোগ্য কন্যারা (সাধারণত অবিবাহিতা বা পুত্রবতী) সমান ভাগে পান।')}
 else if(I.d>0){give('কন্যা',I.d,F(1,1));N.push('শুধু অবিবাহিতা বা পুত্রবতী কন্যাই এই সূত্রে উত্তরাধিকারী গণ্য হন।')}
 else if(I.f)give('পিতা',1,F(1,1));else if(I.m)give('মাতা',1,F(1,1));else if(I.b)give('ভাই (সহোদর)',I.b,F(1,1));
 return{sh:sh,N:N}}
window.Faraiz={muslim:muslim,hindu:hindu,F:F,ff:ff}; /* for tests */

/* ---------- UI helpers ---------- */
/** One +/- stepper box. */
function stp(id,l,mx,gen){return'<div class="fld stp" data-g="'+(gen||'')+'"><label for="'+id+'">'+l+'</label><div class="st"><button type="button" data-d="-1" aria-label="'+l+' কমান">−</button><input id="'+id+'" type="text" inputmode="numeric" autocomplete="off" data-mx="'+mx+'" value="০"><button type="button" data-d="1" aria-label="'+l+' বাড়ান">+</button></div></div>'}
/** Read a non-negative integer from a stepper input. */
function intOf(e){var n=Math.floor(nv(e.value));return isNaN(n)||n<0?0:n}
/** Highlight selected steppers. */
function mark(root){$$('.stp',root).forEach(function(d){d.classList.toggle('on',intOf($('input',d))>0)})}
/** Bind stepper buttons and typing. */
function wire(root,after){
 root.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.st button');if(!b)return;var i=$('input',b.parentNode),mx=+i.dataset.mx,n=Math.max(0,Math.min(mx,intOf(i)+(+b.dataset.d)));i.value=bn(n);after()});
 root.addEventListener('change',function(e){var i=e.target;if(i.dataset&&i.dataset.mx){var nv2=bn(Math.max(0,Math.min(+i.dataset.mx,intOf(i))));if(i.value!==nv2){i.value=nv2;after()}}});
 root.addEventListener('input',after)}
/** Clear all steppers. */
function reset(root,after){$$('.st input',root).forEach(function(i){i.value='০'});after()}

/* ---------- estate ---------- */
var UN=[['tk','টাকা'],['sh','শতাংশ'],['bi','বিঘা'],['ka','কাঠা'],['ac','একর'],['sf','বর্গফুট']];
/** Format an amount in the chosen unit (Taka or land). */
function amt(x,u){return u=='tk'?LM.money(x,2)+' টাকা':fmt(x)+' '+LM.nm(LM.AREA,u)}
/** Read the estate and apply deductions (funeral, debts, bequest <= 1/3). */
function estate(p){ /* p = id prefix: z or h */
 var E=nv($('#'+p+'e').value),u=$('#'+p+'u').value,w=[],o={u:u,E:E};
 if(isNaN(E)||E<=0){o.none=true;return o}
 if(p=='z'){var fu=nv($('#zf').value),db=nv($('#zd').value),wl=nv($('#zw').value);fu=isNaN(fu)?0:fu;db=isNaN(db)?0:db;wl=isNaN(wl)?0:wl;
  var net=E-fu-db;if(net<0){w.push('কাফন-দাফন ও ঋণ মোট সম্পত্তির চেয়ে বেশি। অবশিষ্ট নেই, তাই ০ ধরা হয়েছে।');net=0}
  var cap=net/3,used=Math.min(wl,cap);if(wl>cap+1e-9)w.push('ওসিয়ত অবশিষ্ট সম্পত্তির ১/৩ ('+amt(cap,u)+') এর বেশি দেওয়া হয়েছে। বেশি অংশের জন্য সব ওয়ারিশের সম্মতি লাগে। এখানে ১/৩ ধরা হয়েছে।');
  o.fu=fu;o.db=db;o.wl=used;o.net=net;o.P=net-used}
 else o.P=E;
 o.w=w;return o}

/* ---------- table rendering ---------- */
/** Build the result table for a list of heirs. */
function build(rows,P,u){ /* rows: [{l,c,t}] with t fraction */
 var T=F(0,1),h='<table class="ft"><thead><tr><th>ওয়ারিশ</th><th>মোট অংশ</th><th>শতকরা</th><th>প্রত্যেকে</th>'+(P>0?'<th>প্রত্যেকের পরিমাণ</th>':'')+'</tr></thead><tbody>',rep=[];
 rows.forEach(function(r){T=add(T,r.t);var each=dvn(r.t,r.c),pc=fmt(val(r.t)*100,2)+'%';
  var a=P>0?val(each)*P:0,at=P>0?amt(a,u)+(u!='tk'?'<small>'+LM.compose(LM.toSqft(a,u))+'</small>':''):'';
  var lab=r.l+(r.c>1?' ('+bn(r.c)+' জন)':'');
  h+='<tr><td>'+lab+'</td><td>'+ff(r.t)+'</td><td>'+pc+'</td><td>'+ff(each)+'</td>'+(P>0?'<td>'+at+'</td>':'')+'</tr>';
  rep.push([lab,'<b>'+ff(r.t)+'</b> ('+pc+')'+(P>0?' · প্রত্যেকে '+amt(a,u):'')])});
 h+='<tr class="tot"><td><b>মোট</b></td><td><b>'+ff(T)+'</b></td><td>'+fmt(val(T)*100,2)+'%</td><td></td>'+(P>0?'<td>'+amt(P,u)+'</td>':'')+'</tr></tbody></table>';
 return{html:h,rep:rep}}
/** Render notes. */
function notes(a){return a.map(function(n){return'<div class="rwarn">'+n+'</div>'}).join('')}

/* ---------- Muslim panel ---------- */
var MF=[['h','স্বামী',1,'m'],['w','স্ত্রী (সংখ্যা)',4,'f'],['s','পুত্র (জীবিত)',20],['d','কন্যা (জীবিত)',20],['f','পিতা',1],['m','মাতা',1],['gf','দাদা (পিতার পিতা)',1],['fb','সহোদর ভাই',20],['fs','সহোদরা বোন',20],['pb','বৈমাত্রেয় ভাই (পিতা এক)',20],['ps','বৈমাত্রেয় বোন (পিতা এক)',20],['ub','বৈপিত্রেয় ভাই (মাতা এক)',20],['us','বৈপিত্রেয় বোন (মাতা এক)',20]];
var DEAD=[]; /* pre-deceased children: {t:'s'|'d', gs:'', gd:''} */
var zData=null;
/** Render the pre-deceased children rows. */
function deadHtml(){return DEAD.map(function(d,i){return'<div class="dead" data-i="'+i+'"><b>মৃত '+(d.t=='s'?'পুত্র':'কন্যা')+' '+bn(i+1)+'</b><div class="fgrid"><div class="fld"><label>তাঁর পুত্র (নাতি) কয়জন</label><input data-k="gs" inputmode="numeric" value="'+(d.gs||'')+'" placeholder="০"></div><div class="fld"><label>তাঁর কন্যা (নাতনি) কয়জন</label><input data-k="gd" inputmode="numeric" value="'+(d.gd||'')+'" placeholder="০"></div></div><button type="button" class="btn ol2" data-rm="'+i+'">বাদ দিন</button></div>'}).join('')}
/** Muslim calculation + result + report data. */
function calcZ(){
 var male=$('[name=gz]:checked').value==='m';
 $$('#mz [data-g]').forEach(function(d){var gg=d.dataset.g;var hide=(gg==='m'&&male)||(gg==='f'&&!male);d.style.display=hide?'none':'';if(hide)$('input',d).value='০'});mark($('#mz'));
 var I={},box=$('#zr');MF.forEach(function(f){var x=intOf($('#z_'+f[0]));I[f[0]]=Math.min(x,f[2])});
 var ds=0,dd=0,dw=[];DEAD.forEach(function(d,i){d.on=false;var el=$('.dead[data-i="'+i+'"]');d.gs=nv($('[data-k=gs]',el).value)||0;d.gd=nv($('[data-k=gd]',el).value)||0;d.gs=Math.floor(d.gs);d.gd=Math.floor(d.gd);
  if(d.gs+d.gd<=0){dw.push('মৃত '+(d.t=='s'?'পুত্র':'কন্যা')+' '+bn(i+1)+'-এর কোনো সন্তান নেই বলে হিসাবে ধরা হয়নি।');return}d.on=true;if(d.t=='s')ds++;else dd++});
 var I2=Object.assign({},I);I2.s+=ds;I2.d+=dd;
 var E=estate('z'),total=I2.h+I2.w+I2.s+I2.d+I2.f+I2.m+I2.gf+I2.fb+I2.fs+I2.pb+I2.ps+I2.ub+I2.us;
 if(!total){box.innerHTML='<p class="rhint">উপরের ঘরে + চেপে ওয়ারিশ যোগ করুন। ফলাফল এখানে আসবে।</p>';zData=null;return}
 var res=muslim(I2),rows=[],k;
 for(k in res.sh){var r=res.sh[k];
  if(k=='s'||k=='d'){var per=dvn(r.t,r.c),live=k=='s'?I.s:I.d,lbl=k=='s'?'পুত্র':'কন্যা';
   if(live)rows.push({l:lbl,c:live,t:mul(per,F(live,1))});
   var n=0;DEAD.forEach(function(d){if(d.on&&d.t==k){n++;var u2=2*d.gs+d.gd,pre='মৃত '+lbl+' '+bn(n)+'-এর ';
    if(d.gs)rows.push({l:pre+'পুত্র',c:d.gs,t:mul(per,F(2*d.gs,u2))});if(d.gd)rows.push({l:pre+'কন্যা',c:d.gd,t:mul(per,F(d.gd,u2))})}})}
  else rows.push({l:r.l,c:r.c,t:r.t})}
 var N=res.N.concat(dw);if(DEAD.some(function(d){return d.on}))N.push('মৃত সন্তানের সন্তানেরা ১৯৬১ সালের মুসলিম পারিবারিক আইন অধ্যাদেশ অনুযায়ী তাঁদের মৃত পিতা বা মাতার প্রাপ্য অংশ পান, সেই অংশ নিজেদের মধ্যে পুত্র:কন্যা ২:১ হারে ভাগ হয়।');
 var P=E.none?0:E.P,u=E.u,b=build(rows,P,u),pre='';
 pre=(!E.none&&(E.fu||E.db||E.wl))?'<table class="ut" style="margin-bottom:10px"><tbody><tr><th>মোট সম্পত্তি</th><td>'+amt(E.E,u)+'</td></tr>'+(E.fu?'<tr><th>কাফন-দাফন</th><td>− '+amt(E.fu,u)+'</td></tr>':'')+(E.db?'<tr><th>ঋণ</th><td>− '+amt(E.db,u)+'</td></tr>':'')+(E.wl?'<tr><th>ওসিয়ত</th><td>− '+amt(E.wl,u)+'</td></tr>':'')+'<tr><th><b>ওয়ারিশদের মধ্যে বণ্টনযোগ্য</b></th><td><b>'+amt(E.P,u)+'</b></td></tr></tbody></table>':'';
 box.innerHTML=pre+'<div class="tw res">'+b.html+'</div>'+notes(N.concat(E.w||[]))+(E.none?'<p class="rhint" style="margin-top:10px">সম্পত্তির পরিমাণ দিলে প্রত্যেকের জমি বা টাকার অঙ্কও দেখাবে।</p>':'')+'<p class="rnote">⚠️ '+DISC+' <i>হানাফী মাযহাব ও বাংলাদেশের প্রচলিত আইন অনুযায়ী সরল হিসাব। জটিল বা বিরোধপূর্ণ ক্ষেত্রে আইনজীবীর পরামর্শ নিন।</i></p>';
 var inputs=[['মৃত ব্যক্তি',male?'পুরুষ':'নারী']];MF.forEach(function(f){if(I[f[0]])inputs.push([f[1].replace(' (জীবিত)',''),bn(I[f[0]])+' জন'])});DEAD.forEach(function(d,i){if(d.on)inputs.push(['মৃত '+(d.t=='s'?'পুত্র':'কন্যা')+' '+bn(i+1)+'-এর সন্তান','নাতি '+bn(d.gs)+', নাতনি '+bn(d.gd)])});
 if(!E.none){inputs.push(['মোট সম্পত্তি',amt(E.E,u)]);if(E.fu)inputs.push(['কাফন-দাফন',amt(E.fu,u)]);if(E.db)inputs.push(['ঋণ',amt(E.db,u)]);if(E.wl)inputs.push(['ওসিয়ত',amt(E.wl,u)])}
 zData={title:'ফারায়েজ (মুসলিম, হানাফী): উত্তরাধিকারের হিসাব',inputs:inputs,results:b.rep,notes:N.concat(E.w||[],['হানাফী মাযহাব ও বাংলাদেশের প্রচলিত আইন অনুযায়ী সরল হিসাব। জটিল ক্ষেত্রে আইনজীবীর পরামর্শ নিন।'])};
 Report.bar(box,function(){return zData})}

/* ---------- Hindu panel ---------- */
var HF=[['w','স্ত্রী (বিধবা)',1],['s','পুত্র',20],['d','কন্যা (অবিবাহিতা/পুত্রবতী)',20],['f','পিতা',1],['m','মাতা',1],['b','সহোদর ভাই',20]];
var hData=null;
/** Hindu calculation + result + report data. */
function calcH(){
 var I={},box=$('#hr');HF.forEach(function(f){I[f[0]]=Math.min(intOf($('#h_'+f[0])),f[2])});mark($('#hz'));
 if(!HF.some(function(f){return I[f[0]]})){box.innerHTML='<p class="rhint">উপরের ঘরে + চেপে ওয়ারিশ যোগ করুন। ফলাফল এখানে আসবে।</p>';hData=null;return}
 var res=hindu(I),rows=[],k;for(k in res.sh)rows.push(res.sh[k]);
 var E=estate('h'),P=E.none?0:E.P,u=E.u,b=build(rows,P,u);
 box.innerHTML='<div class="tw res">'+b.html+'</div>'+notes(res.N)+'<p class="rnote">⚠️ '+DISC+' <i>এটি দায়ভাগা রীতির সরল ধারণা। মৃত ব্যক্তি হিন্দু পুরুষ ধরা হয়েছে।</i></p>';
 var inputs=[['মৃত ব্যক্তি','হিন্দু পুরুষ']];HF.forEach(function(f){if(I[f[0]])inputs.push([f[1],bn(I[f[0]])+' জন'])});if(!E.none)inputs.push(['মোট সম্পত্তি',amt(E.E,u)]);
 hData={title:'উত্তরাধিকারের হিসাব (হিন্দু, দায়ভাগা সরল)',inputs:inputs,results:b.rep,notes:res.N.concat(['দায়ভাগা রীতির সরল ধারণা। আইনজীবীর পরামর্শ নিন।'])};
 Report.bar(box,function(){return hData})}

/* ---------- mount ---------- */
/** Options for the estate unit select. */
function unitOpts(){return UN.map(function(x){return'<option value="'+x[0]+'">'+x[1]+'</option>'}).join('')}
/** Initialise the page. */
function mount(){
 $('#mz').innerHTML=MF.map(function(f){return stp('z_'+f[0],f[1],f[2],f[3])}).join('');
 $('#hz').innerHTML=HF.map(function(f){return stp('h_'+f[0],f[1],f[2])}).join('');
 $('#zu').innerHTML=unitOpts();$('#hu').innerHTML=unitOpts();$('#zu').value='sh';$('#hu').value='sh';
 wire($('#mz'),calcZ);wire($('#hz'),calcH);
 ['zeu'].forEach(function(){});
 $$('#panZ .est input,#panZ .est select,[name=gz]').forEach(function(e){e.addEventListener('input',calcZ)});
 $$('#panH .est input,#panH .est select').forEach(function(e){e.addEventListener('input',calcH)});
 $('#deadAddS').onclick=function(){DEAD.push({t:'s'});$('#deadBox').innerHTML=deadHtml();calcZ()};
 $('#deadAddD').onclick=function(){DEAD.push({t:'d'});$('#deadBox').innerHTML=deadHtml();calcZ()};
 $('#deadBox').addEventListener('input',calcZ);
 $('#deadBox').addEventListener('click',function(e){var b=e.target.closest('[data-rm]');if(!b)return;DEAD.splice(+b.dataset.rm,1);$('#deadBox').innerHTML=deadHtml();calcZ()});
 $('#rzb').onclick=function(){DEAD=[];$('#deadBox').innerHTML='';reset($('#mz'),calcZ)};$('#rhb').onclick=function(){reset($('#hz'),calcH)};
 $$('.tabs button').forEach(function(b){b.onclick=function(){$$('.tabs button').forEach(function(x){x.setAttribute('aria-selected',x===b)});$$('.pan').forEach(function(p){p.hidden=p.dataset.t!==b.dataset.t});if(history.replaceState)history.replaceState(null,'','#'+b.dataset.t)}});
 var h=(location.hash||'').slice(1);if(['z','h','r'].indexOf(h)>-1){var b=$('.tabs button[data-t='+h+']');if(b)b.click()}
 calcZ();calcH()}
mount();
})();
