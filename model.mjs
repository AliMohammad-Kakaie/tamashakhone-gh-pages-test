export const ratingSources={ali:{name:'علی‌محمد',personal:true},fat:{name:'فاطمه',personal:true},imdb:{name:'IMDb · نمونه ساختگی',personal:false}};
export const defaults=()=>({tab:'library',q:'',type:'all',status:'all',watch:'all',source:'ali',scoreMode:'all',min:'',max:'',sort:'recent',scoreOrder:'none',limit:24,rankAll:false,drill:null});
export const normalize=s=>String(s??'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d\u064B-\u065F]/g,'').replace(/\s/g,'').toLowerCase();
export const normalizeNumber=s=>String(s??'').replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/٫/g,'.').trim();
export function parseRange(min,max){const a=normalizeNumber(min),b=normalizeNumber(max);const lo=a===''?0:Number(a),hi=b===''?10:Number(b);if((a!==''&&!/^\d+(\.\d+)?$/.test(a))||(b!==''&&!/^\d+(\.\d+)?$/.test(b))||!Number.isFinite(lo)||!Number.isFinite(hi)||lo<0||hi>10||lo>hi)return {error:'حداقل و حداکثر باید بین صفر تا ۱۰ باشند؛ حداقل نباید از حداکثر بیشتر باشد.'};return {lo,hi};}
export const score=(w,source)=>{const v=source==='imdb'?w.demoRatings?.imdb:w.ratings?.[source];return typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=10?v:null;};
export function filterWorks(works,state,{ignoreTab=false}={}){
 const range=state.scoreMode==='range'?parseRange(state.min,state.max):null;if(range?.error)return [];
 let arr=works.filter(w=>{
  const v=score(w,state.source),q=normalize(state.q);
  return (ignoreTab||state.tab!=='active'||w.kind==='series'&&w.active)&&(ignoreTab||state.tab!=='waiting'||w.kind==='series'&&w.waiting)
   &&(ignoreTab||state.tab!=='completed'||w.kind==='series'&&w.completed)
   &&(state.status==='all'||state.status==='active'&&w.active||state.status==='waiting'&&w.waiting||state.status==='completed'&&w.completed)
   &&(state.type==='all'||w.kind===state.type)&&(state.watch==='all'||(w.viewKinds||[w.viewKind]).includes(state.watch))
   &&(!q||normalize(`${w.fa} ${w.en} ${w.year}`).includes(q))
   &&(state.scoreMode==='all'||state.scoreMode==='rated'&&v!==null||state.scoreMode==='unrated'&&v===null||state.scoreMode==='range'&&v!==null&&v>=range.lo&&v<=range.hi)
   &&(!state.drill||v!==null&&v>=state.drill.lo&&(state.drill.inclusive?v<=state.drill.hi:v<state.drill.hi));
 });
 const tie=(a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true});
 return arr.sort((a,b)=>{
  if(state.sort==='rating'){
   const x=score(a,state.source),y=score(b,state.source);if(x===null&&y===null)return tie(a,b);if(x===null)return 1;if(y===null)return -1;return (state.scoreOrder==='asc'?x-y:y-x)||tie(a,b);
  }
  return (state.sort==='recent'?b.idx-a.idx:state.sort==='oldest'?a.idx-b.idx:state.sort==='yearDesc'?b.year-a.year:state.sort==='yearAsc'?a.year-b.year:state.sort==='titleDesc'?b.fa.localeCompare(a.fa,'fa'):a.fa.localeCompare(b.fa,'fa'))||tie(a,b);
 });
}
export function histogram(works,source){return Array.from({length:10},(_,i)=>({lo:i,hi:i+1,inclusive:i===9,count:works.filter(w=>{const v=score(w,source);return v!==null&&v>=i&&(i===9?v<=10:v<i+1);}).length}));}
export function rankWorks(works,source,order='desc'){return filterWorks(works,{...defaults(),source,scoreMode:'rated',sort:'rating',scoreOrder:order});}
export function allMembers(id,collections,works,visited=new Set()){
 if(visited.has(id))return [];visited.add(id);const col=collections.find(c=>c.id===id);if(!col)return [];
 const ids=new Set([...(col.members||[]),...collections.filter(c=>c.parent===id).flatMap(c=>allMembers(c.id,collections,works,visited).map(w=>w.id))]);return works.filter(w=>ids.has(w.id));
}
export function remainingEpisodes(w,person){if(w.kind!=='series'||!Number.isInteger(w.release?.episodes)||!w.seasons.length)return null;const totals=w.seasons.reduce((n,s)=>n+(Number.isInteger(s.episodes)?s.episodes:0),0);if(totals!==w.release.episodes||w.seasons.some(s=>!Number.isInteger(s.progress?.[person])))return null;return Math.max(0,totals-w.seasons.reduce((n,s)=>n+s.progress[person],0));}
