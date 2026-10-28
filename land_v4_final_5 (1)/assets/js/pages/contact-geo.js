/**
 * pages/contact-geo.js : division -> district -> upazila dropdowns for the contact form
 * Data: /assets/data/bd-geo.json (8 divisions, 64 districts, 494 upazilas; Bangla + English names).
 * Source: github.com/nuhil/bangladesh-geocode (MIT licence). No API key and no network call to a third party.
 * The option VALUE is always the Bengali name (what the office receives); the option TEXT follows the page language.
 * Mouza and JL number stay manual: there is no free, reliable public mouza list API.
 */
(function(){
var dv=document.getElementById('dv'),dz=document.getElementById('dz'),up=document.getElementById('up');
if(!dv||!dz||!up)return;
var G=null;
/** true when the page is in English */
function en(){return window.I18N&&I18N.get()=='en'}
/** option text in the current language */
function nm(o){return en()?o.e:o.b}
/** placeholder text (translated through the dictionary when English) */
function ph(){return window.I18N?I18N.t('— বাছাই করুন —'):'— বাছাই করুন —'}
/** (re)build the options of one select, keeping the current selection when possible */
function fill(sel,items,keep){
 var cur=keep?sel.value:'';sel.innerHTML='';
 sel.add(new Option(ph(),''));
 items.forEach(function(o){sel.add(new Option(nm(o),o.b))});
 sel.value=cur;sel.disabled=!items.length}
/** find the selected record in a list by its Bengali name */
function pick(list,b){for(var i=0;i<list.length;i++)if(list[i].b===b)return list[i];return null}
function districts(){var d=pick(G.d,dv.value);return d?d.z:[]}
function upazilas(){var z=pick(districts(),dz.value);return z?z.u.map(function(u){return{b:u[0],e:u[1]}}):[]}
/** refresh all three selects (used on load and when the language changes) */
function render(keep){fill(dv,G.d,keep);fill(dz,districts(),keep);fill(up,upazilas(),keep)}
function changed(){document.getElementById('wf').dispatchEvent(new Event('change',{bubbles:true}))}
dv.addEventListener('change',function(){fill(dz,districts(),false);fill(up,[],false);changed()});
dz.addEventListener('change',function(){fill(up,upazilas(),false);changed()});
document.addEventListener('langchange',function(){if(G)setTimeout(function(){render(true)},0)});
fetch('/assets/data/bd-geo.json').then(function(r){return r.json()}).then(function(j){G=j;render(false)}).catch(function(){
 /* if the data cannot load, fall back to a plain text field so the form still works */
 [dv,dz,up].forEach(function(s){var i=document.createElement('input');i.id=s.id;i.setAttribute('data-l',s.getAttribute('data-l'));s.replaceWith(i)})});
})();
