/**
 * pages/home-hadith.js : rotating hadith card in the home hero (auto-rotates, pauses on hover/focus).
 */
/* /assets/js/pages/home-hadith.js: rotating hadith about land in the home hero */
(function(){
var el=document.getElementById('hhad');if(!el)return;
var D=[
['যে ব্যক্তি জুলুম করে এক বিঘত জমিও নিয়ে নেয়, কিয়ামতের দিন সাত স্তর জমিন তার গলায় বেড়ির মতো পরানো হবে।','সহীহ বুখারী ও সহীহ মুসলিম'],
['আল্লাহ তাআলা তাকে অভিসম্পাত করেছেন, যে জমির সীমানার চিহ্ন বদলে দেয়।','সহীহ মুসলিম'],
['ক্রেতা ও বিক্রেতা সত্য বললে এবং দোষ-ত্রুটি স্পষ্ট করলে তাদের কেনাবেচায় বরকত হয়। গোপন করলে ও মিথ্যা বললে বরকত মুছে যায়।','সহীহ বুখারী ও সহীহ মুসলিম'],
['নির্ধারিত অংশগুলো তার হকদারদের কাছে পৌঁছে দাও। এরপর যা অবশিষ্ট থাকে, তা নিকটতম পুরুষ আত্মীয়ের।','সহীহ বুখারী ও সহীহ মুসলিম']];
var q=el.querySelector('blockquote'),c=el.querySelector('cite'),dots=el.querySelector('.hdots'),i=0,timer=null,paused=false;
D.forEach(function(_,k){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','হাদিস '+(k+1));b.onclick=function(){show(k,true)};dots.appendChild(b)});
/** Show hadith k with a fade. */
function show(k,user){i=k;el.classList.add('out');setTimeout(function(){q.textContent=D[k][0];c.textContent='হাদিস · '+D[k][1];[].forEach.call(dots.children,function(d,j){d.classList.toggle('on',j==k)});el.classList.remove('out')},user?0:260);if(user)restart()}
/** Go to the next hadith unless paused. */
function next(){if(!paused)show((i+1)%D.length)}
/** Restart the rotation timer. */
function restart(){clearInterval(timer);timer=setInterval(next,8000)}
el.addEventListener('mouseenter',function(){paused=true});el.addEventListener('mouseleave',function(){paused=false});el.addEventListener('focusin',function(){paused=true});el.addEventListener('focusout',function(){paused=false});
q.textContent=D[0][0];c.textContent='হাদিস · '+D[0][1];dots.children[0].classList.add('on');restart();
})();
