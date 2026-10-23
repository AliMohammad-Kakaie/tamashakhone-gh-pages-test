// Memory-only sync state. No personal data in localStorage, IndexedDB, Cache API or service worker.
export function createArchiveController({load,sourceEnvironment='demo'}={}){
 if(typeof load!=='function'||!['demo','live'].includes(sourceEnvironment))throw Error('Invalid source configuration');
 let sequence=0,state={status:'idle',data:null,lastSuccessfulSync:null,sourceEnvironment,error:null};
 return {getState:()=>structuredClone(state),clear(){sequence++;state={...state,status:'idle',data:null,lastSuccessfulSync:null,error:null};},
 async refresh(){const current=++sequence;state={...state,status:'loading',error:null};try{const result=await load();if(current!==sequence)return this.getState();if(result?.status!=='success'||result.sync?.sourceEnvironment!==sourceEnvironment||result.demo!==(sourceEnvironment==='demo')||!result.data||!Number.isFinite(Date.parse(result.sync?.lastSuccessfulSync||'')))throw Error('SOURCE_CONTRACT_MISMATCH');state={...state,status:'fresh',data:result.data,lastSuccessfulSync:result.sync.lastSuccessfulSync,error:null};}catch(e){if(current!==sequence)return this.getState();if(e?.status===401||e?.status===403){state={...state,status:'unauthorized',data:null,lastSuccessfulSync:null,error:'ورود یا دسترسی معتبر نیست.'};}else state={...state,status:state.data?'stale':'error',error:'به‌روزرسانی ناموفق بود؛ داده قبلی در صورت وجود تازه نیست.'};}return this.getState();}};
}

