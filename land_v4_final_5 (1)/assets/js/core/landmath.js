/**
 * core/landmath.js : shared, exact land mathematics (used by the hero drawing AND every calculator)
 * - Heron / pentagon (3 triangles) area, unit tables (area + length), Bengali number formatting,
 *   ana-gonda-kora-kranti-til conversion, bigha-katha-chhatak breakdown.
 * Public API: window.LM. Keeping this in one file guarantees the home page example and the calculator agree.
 */
/* /assets/js/core/landmath.js: shared exact-area maths. The home-page hero and the calculators use these same functions. */
(function(){
var BD='০১২৩৪৫৬৭৮৯';
/** Western digits to Bengali digits. */
function bn(x,d){var t=(d==null?String(+x):(+x).toFixed(d));return t.replace(/\d/g,function(c){return BD[c]})}
var SH=435.6; /* sq ft per shotangsho (decimal) */

/* triangle area from three sides (Heron). NaN when the sides cannot form a triangle */
/** Triangle area from three sides (Heron). NaN when the sides cannot form a triangle. */
function tri(a,b,c){var s=(a+b+c)/2,v=s*(s-a)*(s-b)*(s-c);return v>0?Math.sqrt(v):NaN}
/** Angle (radians) between sides a and b, opposite side c (law of cosines). */
function ang(a,b,c){ /* angle opposite side c, between sides a and b */
 var x=(a*a+b*b-c*c)/(2*a*b);return Math.acos(Math.max(-1,Math.min(1,x)))}

/* five sides AB,BC,CD,DE,EA plus diagonals AC and AD split the plot into three triangles */
/** Pentagon from 5 sides + 2 diagonals from vertex A: area (3 triangles) and corner coordinates for drawing. */
function pentagon(s){
 var t1=tri(s.ab,s.bc,s.ac),t2=tri(s.ac,s.cd,s.ad),t3=tri(s.ad,s.de,s.ea);
 if(isNaN(t1)||isNaN(t2)||isNaN(t3))return{ok:false,bad:isNaN(t1)?'ABC':isNaN(t2)?'ACD':'ADE'};
 var a1=ang(s.ab,s.ac,s.bc),a2=ang(s.ac,s.ad,s.cd),a3=ang(s.ad,s.ea,s.de);
 var P=function(r,a){return[r*Math.cos(a),-r*Math.sin(a)]};
 return{ok:true,area:t1+t2+t3,tris:[t1,t2,t3],angleSum:(a1+a2+a3)*180/Math.PI,
  pts:[[0,0],P(s.ab,-a1),P(s.ac,0),P(s.ad,a2),P(s.ea,a2+a3)]}}

window.LM={bn:bn,SH:SH,tri:tri,ang:ang,pentagon:pentagon};

/* ---- home hero: plot no. 612, a 5-sided plot, area computed by the same function ---- */
var HERO={ab:98,bc:73,cd:77,de:86,ea:93,ac:151,ad:153};
window.LM.HERO=HERO;
/** Draw the home-page example (plot no. 612) with the same pentagon function the calculator uses. */
function hero(el){
 var r=pentagon(HERO);if(!r.ok)return;
 var W=420,H=360,pad=52,xs=r.pts.map(function(p){return p[0]}),ys=r.pts.map(function(p){return p[1]});
 var x0=Math.min.apply(0,xs),x1=Math.max.apply(0,xs),y0=Math.min.apply(0,ys),y1=Math.max.apply(0,ys);
 var k=Math.min((W-2*pad)/(x1-x0),(H-2*pad-18)/(y1-y0)),ox=(W-k*(x1-x0))/2-k*x0,oy=(H-k*(y1-y0))/2-k*y0-6;
 var q=r.pts.map(function(p){return[p[0]*k+ox,p[1]*k+oy]});
 var cx=q.reduce(function(a,p){return a+p[0]},0)/5,cy=q.reduce(function(a,p){return a+p[1]},0)/5;
 var side=[HERO.ab,HERO.bc,HERO.cd,HERO.de,HERO.ea],L='ABCDE',o='';
 for(var i=0;i<5;i++){var p=q[i],n=q[(i+1)%5],mx=(p[0]+n[0])/2,my=(p[1]+n[1])/2,dx=n[0]-p[0],dy=n[1]-p[1],len=Math.hypot(dx,dy);
  var nx=-dy/len,ny=dx/len;if((mx+nx-cx)*(mx-cx)+(my+ny-cy)*(my-cy)<0){nx=-nx;ny=-ny}
  var a=Math.atan2(dy,dx)*180/Math.PI;if(a>90)a-=180;if(a<-90)a+=180;
  var tx=mx+nx*13,ty=my+ny*13;
  o+='<text x="'+tx.toFixed(1)+'" y="'+ty.toFixed(1)+'" transform="rotate('+a.toFixed(1)+' '+tx.toFixed(1)+' '+ty.toFixed(1)+')" text-anchor="middle" dominant-baseline="middle">'+bn(side[i])+' ফুট</text>'}
 var dg='<g stroke="#cdee77" stroke-width="1.4" stroke-dasharray="5 5" opacity=".75"><line x1="'+q[0][0]+'" y1="'+q[0][1]+'" x2="'+q[2][0]+'" y2="'+q[2][1]+'"/><line x1="'+q[0][0]+'" y1="'+q[0][1]+'" x2="'+q[3][0]+'" y2="'+q[3][1]+'"/></g>';
 var dots='',lab='';
 for(i=0;i<5;i++){var p2=q[i],vx=p2[0]-cx,vy=p2[1]-cy,vl=Math.hypot(vx,vy);
  dots+='<circle cx="'+p2[0].toFixed(1)+'" cy="'+p2[1].toFixed(1)+'" r="5"/>';
  lab+='<text x="'+(p2[0]+vx/vl*15).toFixed(1)+'" y="'+(p2[1]+vy/vl*15).toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-weight="700" fill="#cdee77">'+L[i]+'</text>'}
 var pts=q.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' ');
 var dec=r.area/SH;
 el.innerHTML='<svg class="map" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="দাগ নং ৬১২, পাঁচ বাহুর জমি, ক্ষেত্রফল '+bn(dec,2)+' শতাংশ" fill="none">'+
 '<g stroke="#3b5a66" stroke-width="1" opacity=".5"><path d="M10 80h400M10 200h400M10 300h400M70 10v340M200 10v340M340 10v340"/></g>'+
 '<polygon class="plot" points="'+pts+'" fill="rgba(79,174,63,.22)" stroke="#cdee77" stroke-width="3" stroke-linejoin="round"/>'+dg+
 '<g fill="#cdee77">'+dots+'</g>'+
 '<g fill="#fff" font-size="14.5" font-family="Hind Siliguri,sans-serif">'+o+lab+'</g>'+
 '<g font-family="Hind Siliguri,sans-serif" text-anchor="middle"><text x="'+cx.toFixed(1)+'" y="'+(cy-10).toFixed(1)+'" fill="#fff" font-size="17" font-weight="700">দাগ নং ৬১২</text>'+
 '<text x="'+cx.toFixed(1)+'" y="'+(cy+11).toFixed(1)+'" fill="#cdee77" font-size="16">'+bn(dec,2)+' শতাংশ</text>'+
 '<text x="'+cx.toFixed(1)+'" y="'+(cy+29).toFixed(1)+'" fill="#d6e3e8" font-size="12">৫ বাহুর জমি</text></g>'+
 '<g transform="translate(372 44)"><circle r="22" stroke="#8aa4b0" stroke-width="2"/><path d="M0-18L6 0 0 18-6 0Z" fill="#cdee77"/><path d="M-18 0L0-5 18 0 0 5Z" fill="#1f5fbf"/><text y="-28" fill="#fff" font-size="12" text-anchor="middle" font-family="Hind Siliguri,sans-serif">উ</text></g></svg>';
 var cap=document.getElementById('hpcap');
 if(cap){var s=HERO;cap.innerHTML='বাহু ৫টি ('+[s.ab,s.bc,s.cd,s.de,s.ea].map(function(v){return bn(v)}).join(', ')+' ফুট) ও কর্ণ ২টি ('+bn(s.ac)+', '+bn(s.ad)+' ফুট) থেকে তিনটি ত্রিভুজের ক্ষেত্রফল যোগ করে '+bn(r.area,1)+' বর্গফুট = <b>'+bn(dec,2)+' শতাংশ</b>। <a href="/calculators/land-area/?shape=pent&ab='+s.ab+'&bc='+s.bc+'&cd='+s.cd+'&de='+s.de+'&ea='+s.ea+'&ac='+s.ac+'&ad='+s.ad+'">ক্যালকুলেটরে একই মাপ দিয়ে দেখুন</a>'}}
window.LM.hero=hero;
var e=document.getElementById('hp');if(e)hero(e);
})();

/* ---- units & conversion (shared by every calculator) ---- */
(function(){
var LM=window.LM,bn=LM.bn;
/** Current katha size in sq ft (government 720, or local 718.74). */
function kk(){return(window.LAND&&window.LAND.kathaSf)||720}
var AREA=[['sh','শতাংশ',435.6],['ac','একর',43560],['bi','বিঘা',function(){return 20*kk()}],['ka','কাঠা',kk],['ch','ছটাক',function(){return kk()/16}],['sf','বর্গফুট',1],['si','বর্গইঞ্চি',1/144],['sy','বর্গগজ',9],['hat','বর্গহাত',2.25],['lk','বর্গলিংক',.4356],['cn','বর্গচেইন',4356],['sm','বর্গমিটার',10.763910416709722],['scm','বর্গসেন্টিমিটার',.001076391041671],['skm','বর্গকিলোমিটার',10763910.416709722],['smi','বর্গমাইল',27878400],['ha','হেক্টর',107639.10416709722],['ay','অযুতাংশ',4.356]];
var LEN=[['ft','ফুট',1],['in','ইঞ্চি',1/12],['hat','হাত',1.5],['yd','গজ',3],['m','মিটার',3.280839895],['cm','সেন্টিমিটার',.03280839895],['lk','লিংক',.66],['cn','চেইন',66],['km','কিলোমিটার',3280.839895],['mi','মাইল',5280]];
/** Square-feet (or feet) factor of a unit key. */
function fac(L,k){for(var i=0;i<L.length;i++)if(L[i][0]==k){var f=L[i][2];return typeof f=='function'?f():f}return NaN}
/** Bengali display name of a unit key. */
function nm(L,k){for(var i=0;i<L.length;i++)if(L[i][0]==k)return L[i][1];return k}
/** Remove trailing zeros of a decimal string. */
function trim(s){return s.indexOf('.')>-1?s.replace(/0+$/,'').replace(/\.$/,''):s}
/** Format a number in Bengali digits with thousands separators. */
function fmt(x,d){ /* readable Bengali number */
 if(!isFinite(x))return'-';var a=Math.abs(x),t;
 if(d!=null)t=trim(x.toFixed(d));else if(a>=1000)t=trim(x.toFixed(2));else if(a>=1)t=trim(x.toFixed(3));else if(a>=.0001)t=trim(x.toFixed(5));else t=a==0?'0':x.toExponential(2);
 var p=t.split('.');p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');return p.join('.').replace(/\d/g,function(c){return'০১২৩৪৫৬৭৮৯'[c]})}
/** Parse user input (Bengali or English digits) into a number. */
function nv(v){var t=String(v==null?'':v).replace(/[০-৯]/g,function(d){return'০১২৩৪৫৬৭৮৯'.indexOf(d)}).replace(/(\d),(?=\d{3}(?!\d))/g,'$1').replace(/,/g,'.').trim();return t===''?NaN:parseFloat(t)}
/** Convert an area value to square feet. */
function toSqft(v,k){return v*fac(AREA,k)}
/** Convert square feet to an area unit. */
function fromSqft(sf,k){return sf/fac(AREA,k)}
/** Convert a length value to feet. */
function toFt(v,k){return v*fac(LEN,k)}
/** Break square feet into bigha-katha-chhatak-sq ft text. */
function compose(sf){ /* বিঘা-কাঠা-ছটাক-বর্গফুট */
 var k=kk(),r=Math.round(sf*100)/100,b=Math.floor(r/(20*k)+1e-9);r-=b*20*k;var ka=Math.floor(r/k+1e-9);r-=ka*k;var c=Math.floor(r/(k/16)+1e-9);r-=c*(k/16);
 var o=[];if(b)o.push(fmt(b,0)+' বিঘা');if(ka)o.push(bn(ka)+' কাঠা');if(c)o.push(bn(c)+' ছটাক');if(r>.004||!o.length)o.push(fmt(Math.round(r*100)/100)+' বর্গফুট');return o.join(' ')}
/** Acre + decimal text. */
function acreDec(sf){var d=sf/435.6,a=Math.floor(d/100+1e-9);return a?bn(a)+' একর '+fmt(d-a*100)+' শতাংশ':fmt(d)+' শতাংশ'}
/** Decimal feet to feet-inches text. */
function ftIn(ft){var t=Math.round(ft*12*100)/100,f=Math.floor(t/12+1e-9),i=Math.round((t-f*12)*100)/100;if(i>=12){f++;i=0}return bn(f)+' ফুট'+(i?' '+fmt(i)+' ইঞ্চি':'')}
/** Format Taka with Bangladeshi lakh/crore grouping. */
function money(x,d){if(!isFinite(x))return'-';var t=(Math.round(x*Math.pow(10,d==null?2:d))/Math.pow(10,d==null?2:d)).toFixed(d==null?2:d),p=t.split('.'),i=p[0],r=i.slice(-3),h=i.slice(0,-3);if(h)r=h.replace(/\B(?=(\d{2})+(?!\d))/g,',')+','+r;var o=r+(p[1]&&+p[1]?'.'+p[1].replace(/0+$/,''):'');return o.replace(/\d/g,function(c){return'০১২৩৪৫৬৭৮৯'[c]})}
Object.assign(LM,{money:money,AREA:AREA,LEN:LEN,fac:fac,nm:nm,fmt:fmt,nv:nv,toSqft:toSqft,fromSqft:fromSqft,toFt:toFt,compose:compose,acreDec:acreDec,ftIn:ftIn,kk:kk});

/* ana-gonda system: 1 taka = 16 ana, 1 ana = 20 gonda, 1 gonda = 4 kora, 1 kora = 3 kranti, 1 kranti = 20 til */
var TIL={ana:4800,gonda:240,kora:60,kranti:20,til:1},TOT=76800;
LM.TIL=TIL;LM.TILTOTAL=TOT;
LM.anaToFrac=function(a){return((a.ana||0)*TIL.ana+(a.gonda||0)*TIL.gonda+(a.kora||0)*TIL.kora+(a.kranti||0)*TIL.kranti+(a.til||0))/TOT};
LM.fracToAna=function(f){var t=Math.round(f*TOT*1e6)/1e6,o={};['ana','gonda','kora','kranti'].forEach(function(k){o[k]=Math.floor(t/TIL[k]+1e-9);t-=o[k]*TIL[k]});o.til=Math.round(t*1e4)/1e4;return o};
LM.anaText=function(o){var n={ana:'আনা',gonda:'গণ্ডা',kora:'কড়া',kranti:'ক্রান্তি',til:'তিল'},s=[];['ana','gonda','kora','kranti','til'].forEach(function(k){if(o[k])s.push(fmt(o[k])+' '+n[k])});return s.length?s.join(' '):'০'};
})();
