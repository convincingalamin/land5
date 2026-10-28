/**
 * pages/calc-land-area.js : "Land Area & Unit Converter" page
 * Tabs: measure land (9 shapes incl. 5-sided plot), unit converter, find dimensions from area, ana-gonda, price & split.
 * Lengths are entered in feet+inches (or other units) and converted to feet; the diagram is drawn as inline SVG.
 */
/* /assets/js/pages/calc-land-area.js: জমির হিসাব page (measure, units, dimensions, ana-gonda, price). Uses LM (/assets/js/core/landmath.js) and Report (/assets/js/core/report.js). */
(function(){
var LM=window.LM,bn=LM.bn,fmt=LM.fmt,nv=LM.nv;
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
/** Escape text for HTML. */
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var DISC='ফলাফল আনুমানিক। চূড়ান্ত সিদ্ধান্তের আগে সরকারি কাগজ ও আইন অনুযায়ী যাচাই করুন।';
var ACC='গণনা নির্ভুল সূত্রে হয়েছে। ফল ততটাই সঠিক, আপনার দেওয়া মাপ যতটা সঠিক।';

/* ---------- common result box ---------- */
var UNITROWS=['sh','ka','bi','ac','sf','sy','sm','ha','hat'];
/** Table of area units for a result. */
function unitTable(sf,keys){return'<table class="ut"><tbody>'+(keys||UNITROWS).map(function(k){return'<tr><th>'+LM.nm(LM.AREA,k)+'</th><td>'+fmt(LM.fromSqft(sf,k))+'</td></tr>'}).join('')+'</tbody></table>'}
/** Same rows for the report. */
function unitRowsData(sf,keys){return(keys||UNITROWS).map(function(k){return[LM.nm(LM.AREA,k),fmt(LM.fromSqft(sf,k))]})}
/** Result header box plus body and the standard note. */
function bigBox(label,main,sub,body,warn){
 return'<div class="rbig"><small>'+label+'</small><b>'+main+'</b>'+(sub?'<span>'+sub+'</span>':'')+'</div>'+(warn||'')+body+'<p class="rnote">⚠️ '+DISC+' <i>'+ACC+'</i></p>'}
/** Render warning messages. */
function warnHtml(a){return a&&a.length?a.map(function(w){return'<div class="rwarn">'+w+'</div>'}).join(''):''}
/** Render an error message. */
function errHtml(m){return'<div class="rerr">'+m+'</div>'}
/** Feet-inch text of a length. */
function lenTxt(ft){var t=LM.ftIn(ft);return t.indexOf('ইঞ্চি')>-1?t+' ('+fmt(ft)+' ফুট)':t}

/* ---------- tabs ---------- */
var tabs=$$('.tabs button'),pans=$$('.pan');
/** Switch the visible tab and remember it in the URL hash. */
function openTab(t){tabs.forEach(function(b){b.setAttribute('aria-selected',b.dataset.t==t)});pans.forEach(function(p){p.hidden=p.dataset.t!=t});if(history.replaceState)history.replaceState(null,'','#'+t)}
tabs.forEach(function(b){b.onclick=function(){openTab(b.dataset.t)}});

/* ---------- length fields (feet+inch or any unit) ---------- */
var LU='fi';
/** One length input (feet + inch boxes, or a single unit box). */
function lenField(id,label,hint){
 var h=hint?'<small class="hint">'+hint+'</small>':'';
 if(LU=='fi')return'<div class="fld"><label for="'+id+'_f">'+label+'</label><div class="fi"><input id="'+id+'_f" data-len="'+id+'" inputmode="decimal" autocomplete="off" placeholder="০"><i>ফুট</i><input id="'+id+'_i" data-len="'+id+'" inputmode="decimal" autocomplete="off" placeholder="০"><i>ইঞ্চি</i></div>'+h+'</div>';
 return'<div class="fld"><label for="'+id+'_f">'+label+'</label><div class="fi one"><input id="'+id+'_f" data-len="'+id+'" inputmode="decimal" autocomplete="off" placeholder="০"><i>'+LM.nm(LM.LEN,LU)+'</i></div>'+h+'</div>'}
/** Read a length field in feet. */
function getLen(id){var fe=$('#'+id+'_f');if(!fe)return NaN;var f=nv(fe.value);
 if(LU=='fi'){var i=nv($('#'+id+'_i').value);if(isNaN(f)&&isNaN(i))return NaN;return(isNaN(f)?0:f)+(isNaN(i)?0:i)/12}
 return isNaN(f)?NaN:LM.toFt(f,LU)}
/** Write a length (feet) into a field. */
function setLen(id,ft){var fe=$('#'+id+'_f');if(!fe)return;if(isNaN(ft)){fe.value='';var ie=$('#'+id+'_i');if(ie)ie.value='';return}
 if(LU=='fi'){var t=Math.round(ft*12*100)/100,f=Math.floor(t/12+1e-9),i=Math.round((t-f*12)*100)/100;fe.value=bn(f);$('#'+id+'_i').value=i?bn(i):''}
 else fe.value=bn(+(ft/LM.fac(LM.LEN,LU)).toFixed(4))}
/** Warn when inches are 12 or more. */
function inchWarn(id){if(LU!='fi')return'';var i=nv(($('#'+id+'_i')||{}).value);return i>=12?'ইঞ্চি ১২ বা তার বেশি দিয়েছেন, তাই তা ফুটে যোগ করে হিসাব হয়েছে।':''}
/** Options for the length-unit select. */
function lenOpts(sel){return LM.LEN.filter(function(x){return['ft','hat','yd','m','lk','cn'].indexOf(x[0])>-1}).map(function(x){return'<option value="'+x[0]+'"'+(x[0]==sel?' selected':'')+'>'+x[1]+'</option>'}).join('')}
/** Options for an area-unit select. */
function areaOpts(sel,keys){return LM.AREA.filter(function(x){return!keys||keys.indexOf(x[0])>-1}).map(function(x){return'<option value="'+x[0]+'"'+(x[0]==sel?' selected':'')+'>'+x[1]+'</option>'}).join('')}

/* ---------- drawing ---------- */
/** Draw a polygon with side labels, diagonals, vertex names (inline SVG). */
function svgPoly(o){
 var W=440,H=300,pad=58,pts=o.pts,xs=pts.map(function(p){return p[0]}),ys=pts.map(function(p){return p[1]});
 var x0=Math.min.apply(0,xs),x1=Math.max.apply(0,xs),y0=Math.min.apply(0,ys),y1=Math.max.apply(0,ys),dx=x1-x0||1,dy=y1-y0||1;
 var k=Math.min((W-2*pad)/dx,(H-2*pad)/dy),ox=(W-k*dx)/2-k*x0,oy=(H-k*dy)/2-k*y0;
 var q=pts.map(function(p){return[p[0]*k+ox,p[1]*k+oy]}),n=q.length,cx=q.reduce(function(a,p){return a+p[0]},0)/n,cy=q.reduce(function(a,p){return a+p[1]},0)/n;
 var ghost=o.ghost?' opacity=".55"':'',s='<svg class="dg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.alt||'জমির নকশা')+'" fill="none"'+ghost+'>';
 s+='<polygon points="'+q.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' ')+'" fill="rgba(79,174,63,.18)" stroke="#2f8f2f" stroke-width="3" stroke-linejoin="round"/>';
 (o.diags||[]).forEach(function(d){var a=q[d[0]],b=q[d[1]];s+='<line x1="'+a[0].toFixed(1)+'" y1="'+a[1].toFixed(1)+'" x2="'+b[0].toFixed(1)+'" y2="'+b[1].toFixed(1)+'" stroke="#1f5fbf" stroke-width="1.8" stroke-dasharray="6 5"/>';
  if(d[2]){var mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;s+=lab(mx,my-6,0,d[2],'#1f5fbf')}});
 if(o.hline){var a=[o.hline[0]*k+ox,o.hline[1]*k+oy],b=[o.hline[2]*k+ox,o.hline[3]*k+oy];s+='<line x1="'+a[0].toFixed(1)+'" y1="'+a[1].toFixed(1)+'" x2="'+b[0].toFixed(1)+'" y2="'+b[1].toFixed(1)+'" stroke="#1f5fbf" stroke-width="1.8" stroke-dasharray="6 5"/>'+lab((a[0]+b[0])/2+14,(a[1]+b[1])/2,0,o.hline[4],'#1f5fbf')}
 for(var i=0;i<n;i++){var p=q[i],m=q[(i+1)%n],lb=(o.edges||[])[i];if(!lb)continue;
  var ex=m[0]-p[0],ey=m[1]-p[1],len=Math.hypot(ex,ey)||1,nx=-ey/len,ny=ex/len,mx=(p[0]+m[0])/2,my=(p[1]+m[1])/2;
  if((mx+nx-cx)*(mx-cx)+(my+ny-cy)*(my-cy)<0){nx=-nx;ny=-ny}
  var a=Math.atan2(ey,ex)*180/Math.PI;if(a>90)a-=180;if(a<-90)a+=180;s+=lab(mx+nx*14,my+ny*14,a,lb,'#0c2233')}
 s+='<g fill="#2f8f2f">'+q.map(function(p){return'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4.5"/>'}).join('')+'</g>';
 if(o.names)q.forEach(function(p,i){var vx=p[0]-cx,vy=p[1]-cy,vl=Math.hypot(vx,vy)||1;s+='<text x="'+(p[0]+vx/vl*15).toFixed(1)+'" y="'+(p[1]+vy/vl*15).toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#1f5fbf" font-family="Hind Siliguri,sans-serif">'+o.names[i]+'</text>'});
 if(o.center)s+='<text x="'+cx.toFixed(1)+'" y="'+cy.toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="700" fill="#0c2233" font-family="Hind Siliguri,sans-serif">'+o.center+'</text>';
 return s+'</svg>'}
/** One SVG text label with a white halo. */
function lab(x,y,a,t,c){return'<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" transform="rotate('+a.toFixed(1)+' '+x.toFixed(1)+' '+y.toFixed(1)+')" text-anchor="middle" dominant-baseline="middle" font-size="12.5" font-weight="600" fill="'+(c||'#0c2233')+'" stroke="#fff" stroke-width="3.5" paint-order="stroke" stroke-linejoin="round" font-family="Hind Siliguri,sans-serif">'+esc(t)+'</text>'}
/** Draw the circle diagram. */
function svgCircle(r,ghost){var s='<svg class="dg" viewBox="0 0 440 300" role="img" aria-label="বৃত্তাকার জমি" fill="none"'+(ghost?' opacity=".55"':'')+'><circle cx="220" cy="150" r="104" fill="rgba(79,174,63,.18)" stroke="#2f8f2f" stroke-width="3"/><line x1="220" y1="150" x2="324" y2="150" stroke="#1f5fbf" stroke-width="2" stroke-dasharray="6 5"/><circle cx="220" cy="150" r="4.5" fill="#2f8f2f"/>';
 return s+(r?lab(272,138,0,'r = '+r,'#1f5fbf'):'')+'</svg>'}
var LB=function(ft){return fmt(ft,2)+' ফুট'};

/* ---------- shapes ---------- */
var S={};
/** Describe one input field. */
function fl(id,l,h){return{id:id,l:l,h:h}}
S.rect={n:'আয়তক্ষেত্র',s:'দৈর্ঘ্য × প্রস্থ',ic:'<rect x="4" y="7" width="16" height="10" rx="1"/>',f:[fl('a','দৈর্ঘ্য'),fl('b','প্রস্থ')],
 sample:{pts:[[0,0],[14,0],[14,9],[0,9]]},
 calc:function(v){return{area:v.a*v.b,per:2*(v.a+v.b),pts:[[0,0],[v.a,0],[v.a,v.b],[0,v.b]],edges:[LB(v.a),LB(v.b),LB(v.a),LB(v.b)],center:'ক্ষেত্রফল = দৈর্ঘ্য × প্রস্থ',how:'ক্ষেত্রফল = '+fmt(v.a)+' × '+fmt(v.b)+' বর্গফুট'}}};
S.square={n:'বর্গ',s:'চার বাহু সমান',ic:'<rect x="6" y="6" width="12" height="12" rx="1"/>',f:[fl('a','এক বাহুর দৈর্ঘ্য')],sample:{pts:[[0,0],[10,0],[10,10],[0,10]]},
 calc:function(v){return{area:v.a*v.a,per:4*v.a,pts:[[0,0],[v.a,0],[v.a,v.a],[0,v.a]],edges:[LB(v.a),LB(v.a),LB(v.a),LB(v.a)],how:'ক্ষেত্রফল = '+fmt(v.a)+' × '+fmt(v.a)+' বর্গফুট'}}};
S.tri3={n:'ত্রিভুজ (তিন বাহু)',s:'তিনটি বাহু জানলে',ic:'<path d="M12 5L21 19H3z"/>',f:[fl('a','প্রথম বাহু'),fl('b','দ্বিতীয় বাহু'),fl('c','তৃতীয় বাহু')],sample:{pts:[[0,0],[16,0],[6,-9]]},
 calc:function(v){var t=LM.tri(v.a,v.b,v.c);if(isNaN(t))return{err:'এই তিন বাহু দিয়ে ত্রিভুজ হয় না। যেকোনো দুই বাহুর যোগফল তৃতীয় বাহুর চেয়ে বড় হতে হবে। মাপ আবার দেখুন।'};
  var x=(v.b*v.b+v.c*v.c-v.a*v.a)/(2*v.c),y=-Math.sqrt(Math.max(0,v.b*v.b-x*x));
  return{area:t,per:v.a+v.b+v.c,pts:[[0,0],[v.c,0],[x,y]],names:'ABC',edges:[LB(v.c),LB(v.a),LB(v.b)],how:'হিরনের সূত্র: s = '+fmt((v.a+v.b+v.c)/2)+', ক্ষেত্রফল = √(s(s−a)(s−b)(s−c))'}}};
S.trih={n:'ত্রিভুজ (ভূমি-উচ্চতা)',s:'ভূমি ও লম্ব উচ্চতা',ic:'<path d="M12 5L20 19H4z"/><path d="M12 5V19" stroke-dasharray="2 2"/>',f:[fl('b','ভূমি'),fl('h','উচ্চতা','ভূমি থেকে বিপরীত কোণ পর্যন্ত লম্ব দূরত্ব')],sample:{pts:[[0,0],[16,0],[6,-9]]},
 calc:function(v){var x=v.b*.38;return{area:v.b*v.h/2,per:null,pts:[[0,0],[v.b,0],[x,-v.h]],hline:[x,-v.h,x,0,'h = '+fmt(v.h,2)],edges:[LB(v.b),'',''],how:'ক্ষেত্রফল = ½ × '+fmt(v.b)+' × '+fmt(v.h)+' বর্গফুট'}}};
S.trap={n:'ট্রাপিজিয়াম',s:'দুই সমান্তরাল বাহু',ic:'<path d="M7 7h10l4 10H3z"/>',f:[fl('a','নিচের সমান্তরাল বাহু'),fl('b','উপরের সমান্তরাল বাহু'),fl('h','দুই বাহুর মধ্যে দূরত্ব','লম্ব দূরত্ব')],sample:{pts:[[0,0],[16,0],[13,-8],[3,-8]]},
 calc:function(v){return{area:(v.a+v.b)/2*v.h,per:null,pts:[[0,0],[v.a,0],[(v.a+v.b)/2,-v.h],[(v.a-v.b)/2,-v.h]],hline:[(v.a+v.b)/2,-v.h,(v.a+v.b)/2,0,'h = '+fmt(v.h,2)],edges:[LB(v.a),'',LB(v.b),''],how:'ক্ষেত্রফল = ½ × ('+fmt(v.a)+' + '+fmt(v.b)+') × '+fmt(v.h)+' বর্গফুট'}}};
S.quad={n:'চতুর্ভুজ',s:'চার বাহু ও একটি কর্ণ',ic:'<path d="M4 8l12-3 4 9-13 5z"/><path d="M4 8l16 6" stroke-dasharray="2 2"/>',f:[fl('ab','AB বাহু'),fl('bc','BC বাহু'),fl('cd','CD বাহু'),fl('da','DA বাহু'),fl('ac','কর্ণ AC','A থেকে C কোণের সরাসরি দূরত্ব')],sample:{pts:[[0,0],[5,-7],[16,0],[7,8]]},
 calc:function(v){var t1=LM.tri(v.ab,v.bc,v.ac),t2=LM.tri(v.ac,v.cd,v.da);
  if(isNaN(t1))return{err:'ABC ত্রিভুজ হচ্ছে না। AB, BC ও কর্ণ AC এর মান মিলছে না। কর্ণ বা এই দুই বাহু আবার মেপে দেখুন।'};
  if(isNaN(t2))return{err:'ACD ত্রিভুজ হচ্ছে না। CD, DA ও কর্ণ AC এর মান মিলছে না। কর্ণ বা এই দুই বাহু আবার মেপে দেখুন।'};
  var e=v.ac,bx=(v.ab*v.ab+e*e-v.bc*v.bc)/(2*e),by=-Math.sqrt(Math.max(0,v.ab*v.ab-bx*bx)),dx=(v.da*v.da+e*e-v.cd*v.cd)/(2*e),dy=Math.sqrt(Math.max(0,v.da*v.da-dx*dx));
  return{area:t1+t2,per:v.ab+v.bc+v.cd+v.da,pts:[[0,0],[bx,by],[e,0],[dx,dy]],names:'ABCD',diags:[[0,2,LB(e)]],edges:[LB(v.ab),LB(v.bc),LB(v.cd),LB(v.da)],how:'কর্ণ AC দিয়ে দুটি ত্রিভুজে ভাগ: '+fmt(t1,2)+' + '+fmt(t2,2)+' বর্গফুট'}}};
S.pent={n:'পাঁচ বাহু',s:'৫ বাহু ও ২ কর্ণ',ic:'<path d="M12 3l8.5 6.2-3.2 10H6.7L3.5 9.2z"/><path d="M12 3L6.7 19.2M12 3l5.3 16.2" stroke-dasharray="2 2"/>',
 f:[fl('ab','AB বাহু'),fl('bc','BC বাহু'),fl('cd','CD বাহু'),fl('de','DE বাহু'),fl('ea','EA বাহু'),fl('ac','কর্ণ AC','A থেকে C'),fl('ad','কর্ণ AD','A থেকে D')],
 note:'পাঁচ বাহু আলাদা করে দিলে আকৃতি নির্দিষ্ট হয় না, তাই A কোণ থেকে দুটি কর্ণ (AC ও AD) মেপে জমিকে তিনটি ত্রিভুজে ভাগ করা হয়। আমিনরাও এভাবেই মাপেন।',
 sample:{pts:[[0,0],[6,10],[16,10],[19,2],[10,-6]]},
 calc:function(v){var r=LM.pentagon(v);if(!r.ok){var m={ABC:'ABC (AB, BC, AC)',ACD:'ACD (AC, CD, AD)',ADE:'ADE (AD, DE, EA)'}[r.bad];return{err:'তিন ত্রিভুজের একটি '+m+' হচ্ছে না। ওই বাহু ও কর্ণের মান মিলছে না। আবার মেপে দেখুন।'}}
  var w=[];if(r.angleSum>=180)w.push('A কোণে তিন ত্রিভুজের মোট কোণ ১৮০° ছাড়িয়েছে ('+fmt(r.angleSum,1)+'°)। জমি অবতল (ভেতরে ঢোকা) হলে বা কর্ণ বাইরে পড়লে ফল ভুল হতে পারে। মাপ মিলিয়ে নিন।');
  return{area:r.area,per:v.ab+v.bc+v.cd+v.de+v.ea,pts:r.pts,names:'ABCDE',diags:[[0,2,LB(v.ac)],[0,3,LB(v.ad)]],edges:[LB(v.ab),LB(v.bc),LB(v.cd),LB(v.de),LB(v.ea)],warn:w,
   how:'তিন ত্রিভুজ: ABC = '+fmt(r.tris[0],1)+', ACD = '+fmt(r.tris[1],1)+', ADE = '+fmt(r.tris[2],1)+' বর্গফুট। যোগফল = '+fmt(r.area,1)+' বর্গফুট'}}};
S.circle={n:'বৃত্ত',s:'গোল জমি, পুকুর',ic:'<circle cx="12" cy="12" r="8"/><path d="M12 12h8" stroke-dasharray="2 2"/>',f:[fl('r','ব্যাসার্ধ (কেন্দ্র থেকে ধার)')],note:'ব্যাস জানা থাকলে তার অর্ধেক লিখুন।',
 calc:function(v){return{area:Math.PI*v.r*v.r,per:2*Math.PI*v.r,circle:LB(v.r),how:'ক্ষেত্রফল = π × '+fmt(v.r)+'² বর্গফুট (π = ৩.১৪১৫৯২৬…)'}}};
S.poly={n:'অনিয়মিত আকার',s:'কোণার স্থানাঙ্ক দিয়ে',ic:'<path d="M4 15l3-9 7 2 6 5-4 7z"/>',custom:true,
 note:'প্রতিটি কোণার (x, y) মাপ ক্রমানুসারে লিখুন, প্রতি লাইনে একটি। যেমন: 0, 0 ঘড়ির কাঁটার দিকে বা উল্টো, যেদিকে খুশি, তবে কোণার ক্রম ঠিক রাখুন। কমপক্ষে ৩টি কোণা। কোণাগুলো ক্রমে না দিলে আকার কেটে যাবে ও ফল ভুল হবে।',
 sample:{pts:[[0,0],[10,-4],[16,2],[13,10],[4,9]]},
 calc:function(v){var p=v.pts,a=0,per=0,n=p.length;for(var i=0;i<n;i++){var j=(i+1)%n;a+=p[i][0]*p[j][1]-p[j][0]*p[i][1];per+=Math.hypot(p[j][0]-p[i][0],p[j][1]-p[i][1])}
  var w=[];if(selfX(p))w.push('কোণার ক্রমে বাহুগুলো পরস্পরকে কেটেছে। ক্রম ঠিক না হলে ফল ভুল হবে। নকশা দেখে কোণার ক্রম মিলিয়ে নিন।');
  var ed=p.map(function(q,i){var m=p[(i+1)%n];return LB(Math.hypot(m[0]-q[0],m[1]-q[1]))});
  return{area:Math.abs(a)/2,per:per,pts:p.map(function(q){return[q[0],q[1]]}),names:'ABCDEFGHIJKLMNOP'.slice(0,n),edges:ed,warn:w,how:'শু-লেস (জুতার ফিতা) সূত্রে '+bn(n)+' কোণার জমির ক্ষেত্রফল'}}};
/** True if a polygon's edges cross each other. */
function selfX(p){var n=p.length;if(n<4)return false;function o(a,b,c){return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])}
 for(var i=0;i<n;i++)for(var j=i+1;j<n;j++){if(j==i+1||(i==0&&j==n-1))continue;var a=p[i],b=p[(i+1)%n],c=p[j],d=p[(j+1)%n];if(o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0)return true}return false}
var ORDER=['rect','square','tri3','trih','trap','quad','pent','circle','poly'],cur='rect',lastShape=null;

/** Render the shape picker cards. */
function buildPicker(){$('#shg').innerHTML=ORDER.map(function(k){var s=S[k];return'<button type="button" class="shc'+(k==cur?' on':'')+'" data-k="'+k+'" aria-pressed="'+(k==cur)+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+s.ic+'</svg><b>'+s.n+'</b><span>'+s.s+'</span></button>'}).join('')}
/** Render the input fields of the chosen shape. */
function buildForm(keep){
 var s=S[cur],h='';
 if(s.custom)h='<div class="fld"><label for="pt">কোণার স্থানাঙ্ক (x, y)</label><textarea id="pt" rows="6" inputmode="decimal" placeholder="যেমন:&#10;0, 0&#10;40, 0&#10;45, 30&#10;10, 35"></textarea><small class="hint">মাপের একক: '+(LU=='fi'?'ফুট (দশমিকে, যেমন ১২.৫)':LM.nm(LM.LEN,LU))+'</small></div>';
 else h='<div class="fgrid">'+s.f.map(function(f){return lenField(f.id,f.l,f.h)}).join('')+'</div>';
 $('#shf').innerHTML=h+(s.note?'<p class="note">'+s.note+'</p>':'');
 if(keep)Object.keys(keep).forEach(function(id){setLen(id,keep[id])})}
/** Read all length fields of the chosen shape. */
function collect(){var s=S[cur],o={};if(s.custom)return o;s.f.forEach(function(f){o[f.id]=getLen(f.id)});return o}

/** Parse the irregular-shape coordinate textarea. */
function parsePts(){var t=$('#pt').value.split(/\n+/).map(function(l){return l.trim()}).filter(Boolean),p=[];
 for(var i=0;i<t.length;i++){var m=t[i].replace(/[০-৯]/g,function(d){return'০১২৩৪৫৬৭৮৯'.indexOf(d)}).split(/[\s,;]+/).filter(Boolean);if(m.length<2||isNaN(+m[0])||isNaN(+m[1]))return{err:'লাইন '+bn(i+1)+' পড়া যায়নি। "x, y" আকারে লিখুন।'};
  var f=LU=='fi'?1:LM.fac(LM.LEN,LU);p.push([+m[0]*f,+m[1]*f])}
 if(p.length<3)return{err:'কমপক্ষে ৩টি কোণা দিন।'};return{pts:p}}

var shapeData=null;
/** Calculate and draw the chosen shape; build the report data. */
function calcShape(){
 var s=S[cur],box=$('#shr'),dg=$('#shd'),v,miss=[];
 if(s.custom){var pr=parsePts();if(pr.err){drawSample(s);box.innerHTML='<p class="rhint">'+(pr.err.indexOf('কমপক্ষে')>-1||!$('#pt').value.trim()?'কোণার স্থানাঙ্ক দিন, নকশা ও ক্ষেত্রফল এখানে আসবে।':errHtml(pr.err))+'</p>';shapeData=null;return}v={pts:pr.pts}}
 else{v=collect();s.f.forEach(function(f){if(isNaN(v[f.id]))miss.push(f.l);else if(v[f.id]<=0)miss.push(f.l+' (০-র বেশি হতে হবে)')});
  if(miss.length){drawSample(s);var some=s.f.some(function(f){return!isNaN(v[f.id])});box.innerHTML='<p class="rhint">'+(some?'বাকি মাপ দিন: '+miss.join(', ')+'।':'মাপ দিন, নকশা ও ক্ষেত্রফল এখানে আসবে।')+'</p>';shapeData=null;return}}
 var r=s.calc(v);if(r.err){drawSample(s);box.innerHTML=errHtml(r.err);shapeData=null;return}
 var svg=r.circle?svgCircle(r.circle):svgPoly({pts:r.pts,edges:r.edges,names:r.names,diags:r.diags,hline:r.hline,alt:s.n+' জমির নকশা'});
 dg.innerHTML=svg;
 var w=(r.warn||[]).slice();if(!s.custom)s.f.forEach(function(f){var m=inchWarn(f.id);if(m&&w.indexOf(m)<0)w.push(m)});
 var sf=r.area,body='<div class="rcomp"><div><small>বিঘা-কাঠা-ছটাক</small>'+LM.compose(sf)+'</div><div><small>একর-শতাংশ</small>'+LM.acreDec(sf)+'</div>'+(r.per?'<div><small>সীমানার মোট দৈর্ঘ্য</small>'+lenTxt(r.per)+' = '+fmt(r.per/3.280839895,2)+' মিটার</div>':'')+'</div>'+unitTable(sf)+'<p class="hw">'+r.how+'</p>';
 box.innerHTML=bigBox('ক্ষেত্রফল',fmt(LM.fromSqft(sf,'sh'))+' শতাংশ',fmt(sf)+' বর্গফুট',body,warnHtml(w));
 var inputs=[['আকৃতি',s.n]];
 if(s.custom)v.pts.forEach(function(p,i){inputs.push(['কোণা '+'ABCDEFGHIJKLMNOP'[i],'('+fmt(p[0],2)+', '+fmt(p[1],2)+') ফুট'])});else s.f.forEach(function(f){inputs.push([f.l,lenTxt(v[f.id])])});
 inputs.push(['কাঠা-বিঘার মান','১ কাঠা = '+fmt(LM.kk(),2)+' বর্গফুট']);
 shapeData={title:'জমির ক্ষেত্রফল: '+s.n,inputs:inputs,svg:svg,results:[['ক্ষেত্রফল (শতাংশ)','<b>'+fmt(LM.fromSqft(sf,'sh'))+'</b>'],['বিঘা-কাঠা-ছটাক',LM.compose(sf)],['একর-শতাংশ',LM.acreDec(sf)]].concat(unitRowsData(sf,['ka','bi','ac','sf','sy','sm','ha'])).concat(r.per?[['সীমানার মোট দৈর্ঘ্য',lenTxt(r.per)]]:[]),notes:[r.how].concat(w),ACC:ACC};
 shapeData.notes.push(ACC);
 Report.bar(box,function(){return shapeData},shareLink)}
/** Draw a faded sample while inputs are incomplete. */
function drawSample(s){if(s.circle||cur=='circle'){$('#shd').innerHTML=svgCircle('',true);return}$('#shd').innerHTML=svgPoly({pts:s.sample.pts,ghost:true,alt:'নমুনা নকশা'})}
/** URL that re-opens this calculation with the same measurements. */
function shareLink(){var s=S[cur],v=collect(),q=['shape='+cur];Object.keys(v).forEach(function(k){if(!isNaN(v[k]))q.push(k+'='+(+v[k].toFixed(3)))});if(s.custom&&$('#pt'))q.push('pts='+encodeURIComponent($('#pt').value.replace(/\n+/g,';')));q.push('kt='+LM.kk());return location.origin+location.pathname+'?'+q.join('&')+'#m'}

/** Change the active shape. */
function setShape(k,keep){cur=k;buildPicker();buildForm(keep);calcShape()}
$('#shg').addEventListener('click',function(e){var b=e.target.closest('.shc');if(b)setShape(b.dataset.k)});
$('#shf').addEventListener('input',calcShape);
$('#lu').addEventListener('change',function(){var keep=collect(),dk=getLen('dl');LU=this.value;buildForm(keep);calcShape();$('#dl').innerHTML=lenField('dl','জানা বাহু');setLen('dl',dk);calcDims()});

/* ---------- units tab ---------- */
var unitData={};
/** Area unit conversion. */
function convArea(){var v=nv($('#cv').value),from=$('#cf').value,to=$('#ct').value,box=$('#cr');
 if(isNaN(v)){box.innerHTML='<p class="rhint">সংখ্যা লিখুন, রূপান্তর এখানে আসবে।</p>';unitData.a=null;return}
 if(v<0){box.innerHTML=errHtml('ঋণাত্মক মান হয় না।');return}
 var sf=LM.toSqft(v,from),res=LM.fromSqft(sf,to),all=LM.AREA.map(function(a){return[a[1],fmt(LM.fromSqft(sf,a[0]))]});
 box.innerHTML=bigBox('ফলাফল',fmt(res)+' '+LM.nm(LM.AREA,to),fmt(v)+' '+LM.nm(LM.AREA,from)+' =','<div class="rcomp"><div><small>বিঘা-কাঠা-ছটাক</small>'+LM.compose(sf)+'</div><div><small>একর-শতাংশ</small>'+LM.acreDec(sf)+'</div></div><details class="alld"><summary>সব এককে দেখুন</summary><table class="ut"><tbody>'+all.map(function(r){return'<tr><th>'+r[0]+'</th><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table></details>');
 unitData.a={title:'জমির ক্ষেত্রফল রূপান্তর',inputs:[['মান',fmt(v)+' '+LM.nm(LM.AREA,from)],['কাঠা-বিঘার মান','১ কাঠা = '+fmt(LM.kk(),2)+' বর্গফুট']],results:[[LM.nm(LM.AREA,to),'<b>'+fmt(res)+'</b>'],['বিঘা-কাঠা-ছটাক',LM.compose(sf)],['একর-শতাংশ',LM.acreDec(sf)]].concat(all),notes:[ACC]};
 Report.bar(box,function(){return unitData.a})}
/** Feet+inches to decimal feet. */
function convFtIn(){var f=nv($('#fi_f').value),i=nv($('#fi_i').value),box=$('#fr');
 if(isNaN(f)&&isNaN(i)){box.innerHTML='<p class="rhint">ফুট ও ইঞ্চি দিন, দশমিক ফুট এখানে আসবে।</p>';unitData.f=null;return}
 var ft=(isNaN(f)?0:f)+(isNaN(i)?0:i)/12;
 box.innerHTML=bigBox('দশমিক ফুট',fmt(ft,4)+' ফুট',(isNaN(f)?'০':fmt(f))+' ফুট '+(isNaN(i)?'০':fmt(i))+' ইঞ্চি =','<div class="rcomp"><div><small>মিটার</small>'+fmt(ft/3.280839895,4)+'</div><div><small>হাত</small>'+fmt(ft/1.5,4)+'</div><div><small>গজ</small>'+fmt(ft/3,4)+'</div><div><small>সেন্টিমিটার</small>'+fmt(ft*30.48,2)+'</div></div><p class="hw">সূত্র: দশমিক ফুট = ফুট + ইঞ্চি ÷ ১২</p>');
 unitData.f={title:'ফুট-ইঞ্চি থেকে দশমিক ফুট',inputs:[['ফুট-ইঞ্চি',(isNaN(f)?'০':fmt(f))+' ফুট '+(isNaN(i)?'০':fmt(i))+' ইঞ্চি']],results:[['দশমিক ফুট','<b>'+fmt(ft,4)+'</b>'],['মিটার',fmt(ft/3.280839895,4)],['হাত',fmt(ft/1.5,4)],['গজ',fmt(ft/3,4)]],notes:['১২ ইঞ্চি = ১ ফুট']};
 Report.bar(box,function(){return unitData.f})}
/** Decimal feet to feet+inches. */
function convDec(){var d=nv($('#df').value),box=$('#dr');
 if(isNaN(d)){box.innerHTML='<p class="rhint">দশমিক ফুট দিন, ফুট-ইঞ্চি এখানে আসবে।</p>';unitData.d=null;return}
 box.innerHTML=bigBox('ফুট-ইঞ্চি',LM.ftIn(d),fmt(d,4)+' ফুট =','<p class="hw">সূত্র: দশমিক অংশ × ১২ = ইঞ্চি</p>');
 unitData.d={title:'দশমিক ফুট থেকে ফুট-ইঞ্চি',inputs:[['দশমিক ফুট',fmt(d,4)]],results:[['ফুট-ইঞ্চি','<b>'+LM.ftIn(d)+'</b>']],notes:[]};Report.bar(box,function(){return unitData.d})}
/** Length conversion. */
function convLen(){var v=nv($('#lv').value),from=$('#lf').value,box=$('#lr');
 if(isNaN(v)){box.innerHTML='<p class="rhint">দৈর্ঘ্য লিখুন, সব এককে ফল আসবে।</p>';unitData.l=null;return}
 var ft=LM.toFt(v,from),all=LM.LEN.map(function(l){return[l[1],fmt(ft/l[2])]});
 box.innerHTML=bigBox('ফলাফল',LM.ftIn(ft),fmt(v)+' '+LM.nm(LM.LEN,from)+' =','<table class="ut"><tbody>'+all.map(function(r){return'<tr><th>'+r[0]+'</th><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table>');
 unitData.l={title:'দৈর্ঘ্য রূপান্তর',inputs:[['মান',fmt(v)+' '+LM.nm(LM.LEN,from)]],results:[['ফুট-ইঞ্চি','<b>'+LM.ftIn(ft)+'</b>']].concat(all),notes:['১ হাত = ১.৫ ফুট (১৮ ইঞ্চি)']};Report.bar(box,function(){return unitData.l})}

/* ---------- dimensions tab ---------- */
var dimData=null;
/** Find the missing dimension from an area. */
function calcDims(){var v=nv($('#dv').value),u=$('#du').value,t=$('#dt').value,box=$('#dr2'),lf=$('#dl_f');
 $('#dlw').hidden=t!='rect';
 if(isNaN(v)||v<=0){box.innerHTML='<p class="rhint">জমির পরিমাণ দিন।</p>';dimData=null;return}
 var sf=LM.toSqft(v,u),res=[],main,sub,ins=[['জমির পরিমাণ',fmt(v)+' '+LM.nm(LM.AREA,u)+' = '+fmt(sf)+' বর্গফুট']];
 if(t=='rect'){var a=getLen('dl');if(isNaN(a)||a<=0){box.innerHTML='<p class="rhint">একটি বাহুর মাপ দিন, অন্যটি বের হবে।</p>';dimData=null;return}
  var b=sf/a;main='অন্য বাহু = '+LM.ftIn(b);sub='প্রস্থ বা দৈর্ঘ্য';res=[['দেওয়া বাহু',lenTxt(a)],['অন্য বাহু','<b>'+lenTxt(b)+'</b>'],['অন্য বাহু (মিটার)',fmt(b/3.280839895,3)],['সীমানার মোট দৈর্ঘ্য',lenTxt(2*(a+b))]];ins.push(['আকৃতি','আয়তক্ষেত্র'],['একটি বাহু',lenTxt(a)])}
 else if(t=='square'){var s=Math.sqrt(sf);main='প্রতি বাহু = '+LM.ftIn(s);sub='বর্গাকার জমি';res=[['প্রতি বাহু','<b>'+lenTxt(s)+'</b>'],['প্রতি বাহু (মিটার)',fmt(s/3.280839895,3)],['সীমানার মোট দৈর্ঘ্য',lenTxt(4*s)]];ins.push(['আকৃতি','বর্গ'])}
 else{var r=Math.sqrt(sf/Math.PI);main='ব্যাসার্ধ = '+LM.ftIn(r);sub='গোলাকার জমি';res=[['ব্যাসার্ধ','<b>'+lenTxt(r)+'</b>'],['ব্যাস',lenTxt(2*r)],['পরিধি',lenTxt(2*Math.PI*r)]];ins.push(['আকৃতি','বৃত্ত'])}
 box.innerHTML=bigBox('মাপ',main,sub,'<table class="ut"><tbody>'+res.map(function(r){return'<tr><th>'+r[0]+'</th><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table>');
 dimData={title:'ক্ষেত্রফল থেকে জমির মাপ',inputs:ins,results:res,notes:[ACC,'কোণ সমকোণ ও আকৃতি নিয়মিত ধরে হিসাব।']};Report.bar(box,function(){return dimData})}

/* ---------- ana-gonda tab (compact; full tool on /calculators/ana-gonda-hissa/) ---------- */
var anaData=null;
/** Read the ana-gonda boxes. */
function anaVals(p){var o={};['ana','gonda','kora','kranti','til'].forEach(function(k){var x=nv($('#'+p+k).value);o[k]=isNaN(x)?0:x});return o}
/** Compact ana-gonda calculation. */
function calcAna(){var v=nv($('#av').value),u=$('#au').value,box=$('#ar'),m=$('#am').value;
 $('#aA').hidden=m!='A';$('#aB').hidden=m!='B';
 if(isNaN(v)||v<=0){box.innerHTML='<p class="rhint">মোট জমির পরিমাণ দিন।</p>';anaData=null;return}
 var tot=LM.toSqft(v,u),ins=[['মোট জমি',fmt(v)+' '+LM.nm(LM.AREA,u)]],res,main,sub,w='';
 if(m=='A'){var a=anaVals('x'),f=LM.anaToFrac(a);if(f<=0){box.innerHTML='<p class="rhint">অংশ দিন (আনা, গণ্ডা, কড়া, ক্রান্তি, তিল)।</p>';anaData=null;return}
  if(f>1)w=warnHtml(['অংশ ১৬ আনার বেশি হয়ে গেছে। মান আবার দেখুন।']);
  var sf=tot*f;ins.push(['অংশ',LM.anaText(a)]);main=fmt(LM.fromSqft(sf,'sh'))+' শতাংশ';sub=LM.anaText(a)+' =';
  res=[['অংশের জমি (শতাংশ)','<b>'+fmt(LM.fromSqft(sf,'sh'))+'</b>'],['বিঘা-কাঠা-ছটাক',LM.compose(sf)],['একর-শতাংশ',LM.acreDec(sf)],['ভগ্নাংশ',fmt(f*16,4)+'/১৬ আনা'],['শতকরা',fmt(f*100,3)+'%']].concat(unitRowsData(sf,['ka','bi','ac','sf','sm']))}
 else{var o=nv($('#ao').value),ou=$('#aou').value;if(isNaN(o)||o<=0){box.innerHTML='<p class="rhint">আপনার জমির পরিমাণ দিন।</p>';anaData=null;return}
  var os=LM.toSqft(o,ou),f2=os/tot;if(f2>1)w=warnHtml(['আপনার জমি মোট জমির চেয়ে বেশি হয়েছে। মান মিলিয়ে নিন।']);
  var an=LM.fracToAna(f2);ins.push(['আপনার জমি',fmt(o)+' '+LM.nm(LM.AREA,ou)]);main=LM.anaText(an);sub=fmt(o)+' '+LM.nm(LM.AREA,ou)+' জমির অংশ =';
  res=[['আনা-গণ্ডা-কড়া-ক্রান্তি-তিল','<b>'+LM.anaText(an)+'</b>'],['ভগ্নাংশ',fmt(f2*16,4)+'/১৬ আনা'],['শতকরা',fmt(f2*100,3)+'%']]}
 box.innerHTML=bigBox('ফলাফল',main,sub,'<table class="ut"><tbody>'+res.map(function(r){return'<tr><th>'+r[0]+'</th><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table><p class="hw">১ আনা = ২০ গণ্ডা, ১ গণ্ডা = ৪ কড়া, ১ কড়া = ৩ ক্রান্তি, ১ ক্রান্তি = ২০ তিল। পুরো জমি ১৬ আনা।</p>',w);
 anaData={title:'আনা-গণ্ডা হিসাব',inputs:ins,results:res,notes:['১৬ আনা = পুরো জমি',ACC]};Report.bar(box,function(){return anaData})}

/* ---------- price tab ---------- */
var priceData=null;
/** Price and equal split. */
function calcPrice(){var v=nv($('#pv').value),u=$('#pu').value,pr=nv($('#pp').value),pu=$('#ppu').value,n=Math.floor(nv($('#pn').value))||1,box=$('#pr');
 if(isNaN(v)||v<=0||isNaN(pr)||pr<=0){box.innerHTML='<p class="rhint">জমির পরিমাণ ও দাম দিন।</p>';priceData=null;return}
 var sf=LM.toSqft(v,u),per=pr/LM.fac(LM.AREA,pu),total=sf*per;
 var body='<div class="rcomp"><div><small>প্রতি বর্গফুট</small>'+LM.money(per,2)+' টাকা</div><div><small>প্রতি শতাংশ</small>'+LM.money(per*435.6,2)+' টাকা</div><div><small>প্রতি কাঠা</small>'+LM.money(per*LM.kk(),2)+' টাকা</div></div>';
 var res=[['জমি',fmt(v)+' '+LM.nm(LM.AREA,u)+' ('+fmt(LM.fromSqft(sf,'sh'))+' শতাংশ)'],['দাম (প্রতি '+LM.nm(LM.AREA,pu)+')',LM.money(pr,2)+' টাকা'],['মোট দাম','<b>'+LM.money(total,2)+' টাকা</b>']];
 if(n>1){body+='<div class="rcomp"><div><small>'+bn(n)+' জনে সমান ভাগে, প্রত্যেকের জমি</small>'+fmt(LM.fromSqft(sf/n,'sh'))+' শতাংশ ('+LM.compose(sf/n)+')</div><div><small>প্রত্যেকের দাম</small>'+LM.money(total/n,2)+' টাকা</div></div>';res.push([bn(n)+' জনে প্রত্যেকের জমি',fmt(LM.fromSqft(sf/n,'sh'))+' শতাংশ'],['প্রত্যেকের দাম',LM.money(total/n,2)+' টাকা'])}
 box.innerHTML=bigBox('মোট দাম',LM.money(total,2)+' টাকা',fmt(v)+' '+LM.nm(LM.AREA,u)+' জমি',body);
 priceData={title:'জমির দাম ও ভাগ',inputs:[['জমি',fmt(v)+' '+LM.nm(LM.AREA,u)],['দাম (প্রতি '+LM.nm(LM.AREA,pu)+')',LM.money(pr,2)+' টাকা'],['ভাগের সংখ্যা',bn(n)+' জন']],results:res,notes:['জমির বাজারদর এলাকাভেদে আলাদা। এখানে শুধু আপনার দেওয়া দামে গণনা।',ACC]};Report.bar(box,function(){return priceData})}

/* ---------- init ---------- */
/** Initialise the page (fill selects, bind events, read URL parameters). */
function mount(){
 $('#cf').innerHTML=areaOpts('sh');$('#ct').innerHTML=areaOpts('ka');$('#lf').innerHTML=LM.LEN.map(function(x){return'<option value="'+x[0]+'"'+(x[0]=='ft'?' selected':'')+'>'+x[1]+'</option>'}).join('');
 $('#du').innerHTML=areaOpts('sh',['sh','ka','bi','ac','sf','sm']);$('#au').innerHTML=areaOpts('sh',['sh','ka','bi','ac','sf']);$('#aou').innerHTML=areaOpts('sh',['sh','ka','bi','ac','sf']);$('#pu').innerHTML=areaOpts('sh',['sh','ka','bi','ac','sf']);$('#ppu').innerHTML=areaOpts('sh',['sh','ka','bi','sf']);
 $('#lu').innerHTML='<option value="fi">ফুট ও ইঞ্চি (দুই ঘরে)</option>'+lenOpts('')+'';
 $('#dl').innerHTML=lenField('dl','জানা বাহু');
 ['cv','cf','ct'].forEach(function(i){$('#'+i).addEventListener('input',convArea)});
 ['fi_f','fi_i'].forEach(function(i){$('#'+i).addEventListener('input',convFtIn)});$('#df').addEventListener('input',convDec);['lv','lf'].forEach(function(i){$('#'+i).addEventListener('input',convLen)});
 $('#dl').addEventListener('input',calcDims);['dv','du','dt'].forEach(function(i){$('#'+i).addEventListener('input',calcDims)});
 $$('#panA input,#panA select').forEach(function(e){e.addEventListener('input',calcAna)});
 $$('#panP input,#panP select').forEach(function(e){e.addEventListener('input',calcPrice)});
 $('#bg').onchange=function(){window.LAND.kathaSf=parseFloat(this.value);document.dispatchEvent(new Event('landchange'))};
 document.addEventListener('landchange',function(){calcShape();convArea();calcDims();calcAna();calcPrice()});
 /* quick inch table */
 $('#itab').innerHTML='<table class="ut"><tbody>'+[1,2,3,4,5,6,7,8,9,10,11].map(function(i){return'<tr><th>'+bn(i)+' ইঞ্চি</th><td>'+fmt(i/12,4)+' ফুট</td></tr>'}).join('')+'</tbody></table>';
 buildPicker();buildForm();calcShape();convArea();convFtIn();convDec();convLen();calcDims();calcAna();calcPrice();
 /* link params: ?shape=pent&ab=98&... (values in feet) */
 var q=new URLSearchParams(location.search);
 if(q.get('kt')){var kt=parseFloat(q.get('kt'));if(kt>0){window.LAND.kathaSf=kt;$('#bg').value=(Math.abs(kt-718.74)<.01?'718.74':'720')}}
 var sh=q.get('shape');
 if(sh&&S[sh]){var keep={};if(S[sh].f)S[sh].f.forEach(function(f){var x=parseFloat(q.get(f.id));if(!isNaN(x))keep[f.id]=x});setShape(sh,keep);if(S[sh].custom&&q.get('pts')){$('#pt').value=q.get('pts').split(';').join('\n');calcShape()}openTab('m');var hs=$('#shg');if(hs&&hs.scrollIntoView)setTimeout(function(){$('#shr').scrollIntoView({behavior:'smooth',block:'center'})},300)}
 else{var h=(location.hash||'').slice(1);if(['m','u','d','a','p'].indexOf(h)>-1)openTab(h);else openTab('m')}
}
mount();
})();
