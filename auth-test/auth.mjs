import {PROJECT_URL,PUBLISHABLE_KEY} from './config.mjs';
const el=id=>document.getElementById(id);
let token=null,epoch=0,expires=0,pending=null;
const fa=new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1});
function status(message){el('status').textContent=message;}
function clearPrivate(){epoch++;pending?.abort();pending=null;token=null;expires=0;el('works').replaceChildren();for(const id of ['member','facts','fetched'])el(id).textContent='';el('private-panel').hidden=true;el('login-panel').hidden=false;el('password').value='';}
async function api(fn,path,{method='GET',body,session=token,signal}={}){
  if(!PUBLISHABLE_KEY.startsWith('sb_publishable_'))throw new Error('این نمونه هنوز برای اتصال آماده نشده است.');
  const headers={apikey:PUBLISHABLE_KEY};if(session)headers.authorization=`Bearer ${session}`;
  if(body)headers['Content-Type']='application/json';
  const response=await fetch(`${PROJECT_URL}/functions/v1/tamashakhone-${fn}/${path}`,{method,headers,...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',cache:'no-store',redirect:'error',signal});
  const result=await response.json().catch(()=>({error:'UNEXPECTED_RESPONSE'}));
  if(!response.ok){const e=new Error(result.error||'CONNECTION_FAILED');e.status=response.status;throw e;}
  return result;
}
function message(error){
  if(error.message==='INVALID_CREDENTIALS')return 'نام کاربری یا رمز عبور درست نیست.';
  if(error.status===429)return 'تلاش‌های ورود بیش از حد مجاز است؛ ده دقیقه بعد دوباره امتحان کن.';
  if(error.status===401)return 'نشست معتبر نیست یا پایان یافته است؛ دوباره وارد شو.';
  if(error.message==='LOGOUT_NOT_CONFIRMED')return 'اطلاعات این صفحه پاک شد، اما خروج سمت سرور تأیید نشد. ارتباط را بررسی کن.';
  if(error.message.includes('هنوز'))return error.message;
  return 'ارتباط با سرویس برقرار نشد. هیچ دادهٔ جایگزینی نمایش داده نمی‌شود.';
}
function textNode(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
function score(value){return value===null||value===undefined?'ثبت‌نشده':`${fa.format(value)} از ۱۰`}
function render(data){
  if(!data.archive?.isDemo || !Array.isArray(data.archive.works))throw new Error('INVALID_DEMO_SOURCE');
  el('works').replaceChildren(...data.archive.works.map(work=>{
    const node=document.createElement('article');node.className='work';node.append(textNode('p','آزمایشی'),textNode('h3',work.title),textNode('p',`${work.type==='series'?'سریال':'فیلم'} · ${fa.format(work.year)}`),textNode('p',`کاربر آزمایشی یک: ${score(work.scores?.demo_one)}`),textNode('p',`کاربر آزمایشی دو: ${score(work.scores?.demo_two)}`));return node;
  }));
  el('member').textContent=`واردشده: ${data.member.displayName}`;
  const shared=data.archive.watchEvents.filter(x=>x.mode==='shared');
  const progress=data.archive.progress.map(p=>`${p.person==='demo_one'?'کاربر یک':'کاربر دو'}: ${fa.format(p.completedEpisodes)} از ${fa.format(p.releasedEpisodes)} قسمت`).join('؛ ');
  el('facts').textContent=`${fa.format(shared.length)} رویداد مشترک با دو شرکت‌کننده. پیشرفت مستقل: ${progress}`;
  el('fetched').textContent=`زمان دریافت از سرور: ${new Date(data.fetchedAt).toLocaleString('fa-IR')}`;
  el('private-panel').hidden=false;el('login-panel').hidden=true;
}
async function loadArchive(){
  const generation=epoch;pending?.abort();pending=new AbortController();
  try{
    if(!token || Date.now()/1000>=expires){clearPrivate();status('نشست پایان یافته است؛ دوباره وارد شو.');return;}
    const data=await api('private','archive',{signal:pending.signal});
    if(generation!==epoch || !token)return;
    render(data);status('دادهٔ آزمایشی پس از بررسی هویت در سرور دریافت شد.');
  }catch(error){if(error.name==='AbortError'||generation!==epoch)return;clearPrivate();status(message(error));}
}
el('login-form').addEventListener('submit',async event=>{
  event.preventDefault();const generation=epoch;el('login').disabled=true;status('در حال بررسی ورود در سرور…');
  try{
    const data=await api('login','login',{method:'POST',session:null,body:{username:el('username').value,password:el('password').value}});
    if(generation!==epoch)return;
    if(typeof data.accessToken!=='string'||!Number.isFinite(data.expiresAt))throw new Error('INVALID_SESSION_RESPONSE');
    token=data.accessToken;expires=data.expiresAt;epoch++;el('password').value='';await loadArchive();
  }catch(error){clearPrivate();status(message(error));}finally{el('password').value='';el('login').disabled=false;}
});
el('logout').addEventListener('click',async()=>{
  const old=token;clearPrivate();status('اطلاعات صفحه پاک شد؛ در حال پایان‌دادن نشست در سرور…');
  try{const data=await api('private','logout',{method:'POST',session:old});if(!data.revoked)throw new Error('LOGOUT_NOT_CONFIRMED');status('خروج سمت سرور تأیید شد؛ دادهٔ محافظت‌شده دیگر قابل دریافت نیست.');}
  catch(error){status(error.status===401?'نشست پایان یافته و اطلاعات صفحه پاک شده است.':message(new Error('LOGOUT_NOT_CONFIRMED')));}
});
el('refresh').addEventListener('click',loadArchive);
async function health(){el('checks-status').textContent='در حال بررسی…';try{const data=await api('login','health',{session:null});if(data.build!=='M11.AUTH.1'||data.syntheticOnly!==true)throw new Error('WRONG_BUILD');el('checks-status').textContent='ارتباط واقعی با تابع سرور برقرار است. این نتیجه به‌تنهایی تأیید ورود نیست.';if(!token)status('سرویس پاسخ می‌دهد؛ برای دیدن دادهٔ محافظت‌شده وارد شو.');}catch(error){el('checks-status').textContent=message(error);if(!token)status('ارتباط سرویس هنوز تأیید نشده است.');}}
el('health').addEventListener('click',health);
el('unauthorized').addEventListener('click',async()=>{try{await api('private','archive',{session:null});el('checks-status').textContent='خطا: درخواست بدون ورود پذیرفته شد؛ آزمایش را متوقف کن.';}catch(error){el('checks-status').textContent=error.status===401?'درخواست مستقیم بدون ورود با پاسخ ۴۰۱ رد شد.':message(error);}});
addEventListener('pagehide',clearPrivate);addEventListener('pageshow',event=>{if(event.persisted){clearPrivate();status('برای حفاظت از داده‌ها دوباره وارد شو.');}});
setInterval(()=>{if(token&&Date.now()/1000>=expires){clearPrivate();status('نشست پایان یافته است؛ دوباره وارد شو.');}},15000);
health();
