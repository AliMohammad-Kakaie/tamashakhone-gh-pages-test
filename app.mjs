import {normalize} from './model.mjs';
const byId=id=>document.getElementById(id);
const search=byId('search'),type=byId('type'),reset=byId('reset');
const cards=[...document.querySelectorAll('.work')];
const format=new Intl.NumberFormat('fa-IR',{useGrouping:false});
const catalog=cards.map(element=>({element,kind:element.dataset.kind,text:normalize(element.querySelector('h2').textContent+' '+element.querySelector('.english').textContent)}));
function render(){
  const query=normalize(search.value);let count=0;
  for(const item of catalog){const matches=(!query||item.text.includes(query))&&(type.value==='all'||item.kind===type.value);item.element.hidden=!matches;if(matches)count+=1;}
  byId('results').textContent=format.format(count)+' از '+format.format(cards.length)+' اثر کاملاً ساختگی';
  byId('empty').hidden=count!==0;
}
search.addEventListener('input',render);
type.addEventListener('change',render);
reset.addEventListener('click',()=>{search.value='';type.value='all';render();search.focus();});
let clicks=0;
byId('test-button').addEventListener('click',()=>{clicks+=1;byId('counter').textContent='تعداد کلیک: '+format.format(clicks);});
for(const control of [search,type,reset,byId('test-button')])control.disabled=false;
byId('script-status').textContent='جاوااسکریپت فعال است؛ دکمه را لمس کنید.';
byId('script-status').classList.add('ready');
render();
